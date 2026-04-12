import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import ChatBubble from "../components/ChatBubble";
import ScorePanel from "../components/ScorePanel";
import Sidebar from "../components/Sidebar";
import {
  connectStream,
  getChatHistory,
  getScenario,
  getSession,
  postChatMessage,
} from "../api/client";

const REPORT_STORAGE_PREFIX = "outthink-report:";
const EMPTY_BREAKDOWN = {
  fallacy_identification: 0,
  evidence_quality: 0,
  terminology_accuracy: 0,
  speed_bonus: 0,
};

function addBreakdowns(left, right) {
  return Object.fromEntries(
    Object.keys(EMPTY_BREAKDOWN).map((key) => [
      key,
      (left?.[key] || 0) + (right?.[key] || 0),
    ]),
  );
}

// ---- 헬퍼 함수들 ----
function sortMessages(messages) {
  return [...messages].sort((left, right) => {
    const turnGap = (left.turn_number || 0) - (right.turn_number || 0);
    if (turnGap !== 0) return turnGap;
    return new Date(left.created_at || 0) - new Date(right.created_at || 0);
  });
}

function buildUserMessage(content, turnNumber) {
  return {
    id: `user-${Date.now()}`,
    role: "user",
    content,
    turn_number: turnNumber,
    created_at: new Date().toISOString(),
    score_delta: 0,
    feedback: "",
  };
}

function persistReport(sessionId, payload) {
  if (!sessionId || typeof window === "undefined") return;
  window.sessionStorage.setItem(
    `${REPORT_STORAGE_PREFIX}${sessionId}`,
    JSON.stringify(payload || {}),
  );
}

// ---- 메인 Debate 페이지 ----
export default function Debate() {
  const navigate = useNavigate();
  const { sessionId: pathId } = useParams();
  const [searchParams] = useSearchParams();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const disconnectRef = useRef(null);
  const messagesEndRef = useRef(null); // 스크롤용
  const pendingAgentsRef = useRef(new Set());

  const latestRef = useRef({
    scenario: null,
    session: null,
    validator: null,
    messages: [],
  });

  // 경로 파라미터나 쿼리 스트링 모두에서 sessionId를 가져옵니다.
  const sessionId = pathId || searchParams.get("sessionId") || "";

  const [scenario, setScenario] = useState(null);
  const [session, setSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [drafts, setDrafts] = useState({ agent_a: "", agent_b: "" });
  const [validator, setValidator] = useState(null);
  const [cumulativeBreakdown, setCumulativeBreakdown] = useState(EMPTY_BREAKDOWN);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [streaming, setStreaming] = useState(false);
  const [responseLocked, setResponseLocked] = useState(false);
  const [error, setError] = useState("");

  const orderedMessages = useMemo(() => sortMessages(messages), [messages]);

  // 에이전트 초기 클레임 (DB에 저장되지 않으므로 scenario에서 직접 표시)
  const initialClaims = useMemo(() => {
    if (!scenario) return [];
    return [
      scenario.agent_a?.initial_claim && {
        id: "init-a",
        role: "agent_a",
        content: scenario.agent_a.initial_claim,
        turn_number: 0,
        created_at: scenario.created_at,
        score_delta: 0,
        feedback: "",
      },
      scenario.agent_b?.initial_claim && {
        id: "init-b",
        role: "agent_b",
        content: scenario.agent_b.initial_claim,
        turn_number: 0,
        created_at: scenario.created_at,
        score_delta: 0,
        feedback: "",
      },
    ].filter(Boolean);
  }, [scenario]);

  // 실제 에이전트 이름 (ChatBubble에 전달)
  const agentNames = useMemo(() => ({
    agent_a: scenario?.agent_a?.name || "Agent Alpha",
    agent_b: scenario?.agent_b?.name || "Agent Bravo",
  }), [scenario]);

  // 자동 스크롤
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [orderedMessages, drafts]);

  useEffect(() => {
    latestRef.current = { scenario, session, validator, messages: orderedMessages };
  }, [scenario, session, validator, orderedMessages]);

  useEffect(() => {
    if (!sessionId) {
      setLoading(false);
      return undefined;
    }

    let cancelled = false;

    async function loadDebate() {
      setLoading(true);
      setError("");
      try {
        const [scenarioData, sessionData, historyData] = await Promise.all([
          getScenario(sessionId),
          getSession(sessionId),
          getChatHistory(sessionId),
        ]);

        if (cancelled) return;

        setScenario(scenarioData);
        setSession(sessionData);
        setMessages(historyData?.messages || []);
        setCumulativeBreakdown(EMPTY_BREAKDOWN);
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError.message || "Failed to load debate session.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }
    loadDebate();

    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  useEffect(() => {
    return () => disconnectRef.current?.();
  }, []);

  function disconnectStream() {
    disconnectRef.current?.();
    disconnectRef.current = null;
    setStreaming(false);
  }

  function clearResponseLock() {
    pendingAgentsRef.current = new Set();
    setResponseLocked(false);
    setStreaming(false);
  }

  function handleSessionComplete(payload) {
    disconnectStream();
    clearResponseLock();
    setDrafts({ agent_a: "", agent_b: "" });
    setSession((current) =>
      current ? { ...current, status: "completed" } : { status: "completed" },
    );

    persistReport(sessionId, {
      scenario: latestRef.current.scenario,
      session: latestRef.current.session,
      validator: latestRef.current.validator,
      messages: latestRef.current.messages,
      completion: payload,
      report: payload?.report || null,
    });

    navigate(`/report/${encodeURIComponent(sessionId)}`);
  }

  function startStream(activeSessionId) {
    disconnectStream();
    setStreaming(true);

    disconnectRef.current = connectStream({
      sessionId: activeSessionId,
      onAgentToken: (payload) => {
        const agent = payload.agent;
        if (!agent) return;
        setDrafts((current) => ({
          ...current,
          [agent]: `${current[agent] || ""}${payload.token || ""}`,
        }));
      },
      onAgentComplete: (payload) => {
        setDrafts((current) => ({
          ...current,
          [payload.agent]: "",
        }));

        setMessages((current) => [
          ...current,
          {
            id: payload.id || `${payload.agent}-${Date.now()}`,
            role: payload.agent,
            content: payload.full_content || payload.content || "",
            turn_number: payload.turn_number,
            created_at: payload.created_at || new Date().toISOString(),
            score_delta: payload.score_delta || 0,
            feedback: payload.feedback || "",
          },
        ]);
      },
      onValidatorResult: (payload) => {
        setValidator(payload);
        if (payload.turn_score_breakdown) {
          setCumulativeBreakdown((current) => addBreakdowns(current, payload.turn_score_breakdown));
        }
        if (payload.agent) {
          pendingAgentsRef.current.delete(payload.agent);
        }
        const stillProcessing = pendingAgentsRef.current.size > 0;
        setResponseLocked(stillProcessing);
        setStreaming(stillProcessing);
        setSession((current) => {
          const nextTurnCount = Math.max(
            current?.turn_count || 0,
            latestRef.current.messages.length,
            payload.turn_count || 0,
          );

          if (!current) {
            return {
              total_score: payload.total_score || payload.score_delta || 0,
              turn_count: nextTurnCount,
              status: "active",
            };
          }

          return {
            ...current,
            total_score:
              payload.total_score ?? (current.total_score || 0) + (payload.score_delta || 0),
            turn_count: nextTurnCount,
          };
        });
      },
      onSurrenderDetected: (payload) => {
        clearResponseLock();
        setMessages((current) => [
          ...current,
          {
            id: `surrender-${Date.now()}`,
            role: payload.agent || "agent_b",
            content: payload.message || "The debate ended by surrender.",
            created_at: new Date().toISOString(),
            score_delta: 0,
            feedback: "",
          },
        ]);
        setSession((current) =>
          current ? { ...current, status: "completed" } : { status: "completed" },
        );
      },
      onSessionComplete: (payload) => {
        handleSessionComplete(payload);
      },
      onError: () => {
        disconnectStream();
        clearResponseLock();
        setError("The live stream ended unexpectedly.");
      },
    });
  }

  async function handleSend(event) {
    event.preventDefault();

    const content = input.trim();
    if (!content || !sessionId || responseLocked || session?.status === "completed") {
      return;
    }

    const optimisticMessage = buildUserMessage(content, (session?.turn_count || 0) + 1);

    setError("");
    setResponseLocked(true);
    setInput("");
    setMessages((current) => [...current, optimisticMessage]);

    try {
      const response = await postChatMessage({ sessionId, content });
      setMessages((current) =>
        current.map((message) =>
          message.id === optimisticMessage.id ? response?.message || optimisticMessage : message,
        ),
      );
      const targetAgents = (response?.target_agents || [])
        .map((agent) => (typeof agent === "string" ? agent : agent?.value))
        .filter(Boolean);
      pendingAgentsRef.current = new Set(targetAgents.length > 0 ? targetAgents : ["agent_a", "agent_b"]);

      if (pendingAgentsRef.current.size === 0) {
        clearResponseLock();
        return;
      }

      startStream(sessionId);
    } catch (sendError) {
      clearResponseLock();
      setMessages((current) =>
        current.filter((message) => message.id !== optimisticMessage.id),
      );
      setError(sendError.message || "Failed to send message.");
    }
  }

  const inputDisabled = !sessionId || responseLocked || session?.status === "completed";

  return (
    // 1. min-h-screen을 h-screen으로 변경하여 브라우저 높이에 딱 맞게 고정합니다.
    <div className="relative flex h-screen bg-[#050505] text-white overflow-hidden selection:bg-[#00ffaa]/30 font-sans">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* 2. main 영역도 h-full과 overflow-hidden을 추가해 내부 요소가 밖으로 나가지 않게 합니다. */}
      <main className="relative flex-1 flex flex-col h-full min-w-0 overflow-hidden z-10">
        {/* 3. 내부 컨테이너도 h-full로 채우고 overflow-hidden을 줍니다. */}
        <div className="flex flex-col gap-6 p-6 md:p-12 max-w-[1400px] mx-auto w-full h-full overflow-hidden">
          
          {/* Header Section: flex-shrink-0을 넣어 높이가 줄어들지 않게 고정합니다. */}
          <div className="flex justify-between items-end border-b border-white/10 pb-6 flex-shrink-0">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 ${sessionId ? (streaming ? "bg-[#00ffaa] animate-pulse" : "bg-white/20") : "bg-[#ff00aa]"}`} />
                <span className="font-mono text-[10px] text-[#00ffaa] tracking-[2px] uppercase">
                  {!sessionId ? "Offline" : session?.status || (loading ? "Initializing" : "Idle")}
                </span>
              </div>
              <h1 className="font-grotesk text-[32px] md:text-[40px] font-bold leading-none tracking-tight">
                {!sessionId ? "No Active Session" : session?.topic || scenario?.topic || "Debate Session"}
              </h1>
              <p className="font-mono text-[14px] text-white/40">
                {sessionId ? "> 시스템 논리 허점을 공략하십시오_" : "> 진행 중인 시뮬레이션이 없습니다_"}
              </p>
            </div>
            
          </div>

          {/* Main Content Area */}
          {!sessionId ? (
            <div className="flex-1 border border-white/10 bg-black/40 flex flex-col items-center justify-center p-8 text-center relative overflow-hidden">
              {/* ... (기존 세션 없음 UI 유지) ... */}
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#ff00aa]/50 to-transparent opacity-50" />
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#ff00aa" strokeWidth="1" className="mb-6 opacity-80">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <h2 className="font-grotesk text-[24px] font-bold text-white mb-2 uppercase tracking-widest">
                Session Not Found
              </h2>
              <p className="font-mono text-[14px] text-white/50 mb-8 max-w-md leading-relaxed">
                현재 활성화된 삼각 토론 세션이 없습니다.<br/>
                미션 센터로 돌아가 새로운 분석 시나리오를 가동하십시오.
              </p>
              <button
                onClick={() => navigate("/")}
                className="px-8 py-4 bg-white/5 border border-white/20 text-white font-mono text-[12px] font-bold uppercase tracking-wider hover:bg-[#00ffaa] hover:text-black hover:border-[#00ffaa] transition-all shadow-[0_0_15px_rgba(0,255,170,0)] hover:shadow-[0_0_20px_rgba(0,255,170,0.3)]"
              >
                미션 센터로 귀환 →
              </button>
            </div>
          ) : (
            // 4. grid 영역에 flex-1과 min-h-0을 주어 부모 높이를 넘어가지 않게 합니다.
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1 min-h-0 overflow-hidden">
              
              {/* 좌측 채팅 영역: flex-col과 overflow-hidden으로 내부 스크롤 준비를 합니다. */}
              <div className="lg:col-span-8 flex flex-col border border-white/10 bg-black/40 overflow-hidden relative">
                <div className="absolute top-0 right-0 p-2 pointer-events-none opacity-20">
                    <span className="font-mono text-[10px] tracking-widest uppercase">ENCRYPTED_CHANNEL</span>
                </div>
                
                {/* 5. 핵심: flex-1과 overflow-y-auto를 통해 채팅 리스트만 스크롤되게 만듭니다. */}
                <div className="flex-1 overflow-y-auto p-6 md:p-8 flex flex-col gap-2 scrollbar-cyber">
                  {loading && <p className="font-mono text-[12px] text-white/40 italic text-center py-10">Loading debate records...</p>}
                  {!loading && orderedMessages.length === 0 && !error && (
                    <p className="font-mono text-[12px] text-[#00ffaa] italic text-center py-10 opacity-70 animate-pulse">
                      시스템 준비 완료. 첫 번째 반박을 전송하여 논리 검증 엔진을 가동하십시오.
                    </p>
                  )}

                  {[...initialClaims, ...orderedMessages].map((message) => (
                    <ChatBubble
                      key={message.id}
                      role={message.role}
                      content={message.content}
                      createdAt={message.created_at}
                      feedback={message.feedback}
                      scoreDelta={message.score_delta}
                      agentName={agentNames[message.role]}
                    />
                  ))}

                  {drafts.agent_a && <ChatBubble role="agent_a" content={drafts.agent_a} isStreaming agentName={agentNames.agent_a} />}
                  {drafts.agent_b && <ChatBubble role="agent_b" content={drafts.agent_b} isStreaming agentName={agentNames.agent_b} />}
                  <div ref={messagesEndRef} />
                </div>

                <form
                  onSubmit={handleSend}
                  className="flex border-t border-white/10 bg-black p-4 md:p-6 gap-4 flex-shrink-0"
                >
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="논리 오류를 짚고 반박을 입력하세요."
                    disabled={inputDisabled}
                    className="flex-1 bg-white/[0.03] border border-white/10 px-5 py-4 text-white font-sans text-[14px] outline-none focus:border-[#00ffaa] transition-colors placeholder:text-white/20 disabled:opacity-50"
                  />
                  <button
                    type="submit"
                    disabled={inputDisabled}
                    className="px-8 bg-[#00ffaa] text-black font-mono text-[14px] font-bold uppercase hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {responseLocked ? "..." : "Send"}
                  </button>
                </form>
                
                {error && (
                  <div className="absolute bottom-24 left-0 right-0 px-6 py-2 bg-[#ff00aa]/20 border-y border-[#ff00aa]/50 text-[#ff00aa] font-mono text-[11px] text-center backdrop-blur-md z-20">
                    {error}
                  </div>
                )}
              </div>

              {/* 우측 정보 패널 영역 */}
              <div className="lg:col-span-4 flex flex-col gap-4 overflow-y-auto scrollbar-cyber min-h-0">
                  <div className="p-5 border border-white/10 bg-white/[0.02]">
                      <h3 className="font-mono text-[10px] text-white/40 uppercase tracking-[2px] mb-4">
                        Scenario Brief
                      </h3>
                      <p className="font-sans text-[13px] text-white/80 leading-relaxed whitespace-pre-wrap">
                        {scenario?.scenario || "시나리오 데이터를 불러오는 중입니다..."}
                      </p>
                      
                      <div className="mt-6 flex flex-col gap-3">
                        <div className="flex justify-between font-mono text-[11px] border-b border-white/5 pb-2">
                            <span className="text-white/40">Agent Alpha</span>
                            <span className="text-[#00ffaa] text-right">{scenario?.agent_a?.name || "-"}</span>
                        </div>
                        <div className="flex justify-between font-mono text-[11px] border-b border-white/5 pb-2">
                            <span className="text-white/40">Agent Bravo</span>
                            <span className="text-[#ff00aa] text-right">{scenario?.agent_b?.name || "-"}</span>
                        </div>
                      </div>
                  </div>

                  <ScorePanel
                    totalScore={session?.total_score || 0}
                    validator={validator}
                    cumulativeBreakdown={cumulativeBreakdown}
                    sessionStatus={session?.status}
                  />

                  {session?.status === "completed" && (
                    <div className="p-4 border border-[#00ffaa]/30 bg-[#00ffaa]/5 backdrop-blur-md">
                      <button
                        onClick={() => navigate(`/report/${sessionId}`)}
                        className="w-full py-4 bg-[#00ffaa] text-black font-mono text-[13px] font-bold uppercase hover:bg-white hover:shadow-[0_0_20px_rgba(0,255,170,0.4)] transition-all"
                      >
                        View Final Report →
                      </button>
                    </div>
                  )}
              </div>

            </div>
          )}

        </div>
      </main>
    </div>
  );
}
