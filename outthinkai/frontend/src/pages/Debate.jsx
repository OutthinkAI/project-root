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
  const messagesEndRef = useRef(null);
  const pendingAgentsRef = useRef(new Set());

  const latestRef = useRef({
    scenario: null,
    session: null,
    validator: null,
    messages: [],
  });

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

  const agentNames = useMemo(() => ({
    agent_a: scenario?.agent_a?.name || "Agent Alpha",
    agent_b: scenario?.agent_b?.name || "Agent Bravo",
  }), [scenario]);

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
        // 활성 세션 ID 저장 (다른 페이지에서도 링크 유지)
        if (sessionData?.status === "completed") {
          localStorage.removeItem("outthink-active-session");
        } else {
          localStorage.setItem("outthink-active-session", sessionId);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError.message || "세션을 불러오지 못했습니다.");
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
    // 세션 완료 시 활성 세션 ID 삭제
    localStorage.removeItem("outthink-active-session");

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
        setError("스트림 연결이 예기치 않게 종료되었습니다.");
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
      setError(sendError.message || "메시지 전송에 실패했습니다.");
    }
  }

  const inputDisabled = !sessionId || loading || responseLocked || session?.status === "completed";

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white overflow-hidden">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        <div className="flex flex-col h-full max-w-[1400px] mx-auto w-full">

          {/* 헤더 */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 flex-shrink-0">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
                </svg>
              </button>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${
                  !sessionId ? "bg-gray-400"
                  : streaming ? "bg-emerald-500 animate-pulse"
                  : session?.status === "completed" ? "bg-gray-400"
                  : "bg-emerald-500"
                }`} />
                <span className="text-[13px] text-gray-500 dark:text-gray-400">
                  {!sessionId ? "세션 없음"
                    : session?.status === "completed" ? "완료"
                    : streaming ? "AI 응답 중"
                    : loading ? "로딩 중"
                    : "진행 중"}
                </span>
              </div>
              <span className="text-gray-300 dark:text-gray-700">|</span>
              <h1 className="text-[15px] font-semibold text-gray-900 dark:text-white truncate max-w-[300px]">
                {!sessionId ? "세션 없음" : session?.topic || scenario?.topic || "토론 세션"}
              </h1>
            </div>
          </div>

          {/* 컨텐츠 */}
          {!sessionId ? (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center max-w-sm">
                <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-400">
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                </div>
                <h2 className="text-[18px] font-semibold text-gray-900 dark:text-white mb-2">활성 세션 없음</h2>
                <p className="text-[14px] text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
                  현재 활성화된 토론 세션이 없습니다.<br/>미션 센터에서 새 시나리오를 시작해주세요.
                </p>
                <button
                  onClick={() => navigate("/")}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-[14px] rounded-lg transition-colors"
                >
                  미션 센터로 이동
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-0 min-h-0 overflow-hidden">

              {/* 채팅 영역 */}
              <div className="lg:col-span-8 flex flex-col border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
                {/* 메시지 목록 */}
                <div className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-0 scrollbar-custom">
                  {loading && (
                    <p className="text-[13px] text-gray-400 italic text-center py-12">세션 데이터 불러오는 중...</p>
                  )}
                  {!loading && orderedMessages.length === 0 && !error && (
                    <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
                      <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-blue-500">
                          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                        </svg>
                      </div>
                      <p className="text-[14px] text-gray-500 dark:text-gray-400">
                        AI 에이전트의 주장을 읽고 첫 번째 반박을 입력해보세요.
                      </p>
                    </div>
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

                {/* 에러 배너 */}
                {error && (
                  <div className="mx-4 mb-2 px-4 py-2.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-[13px] text-center">
                    {error}
                  </div>
                )}

                {/* 입력창 */}
                <form
                  onSubmit={handleSend}
                  className="border-t border-gray-200 dark:border-gray-800 p-4 flex gap-3 flex-shrink-0 bg-white dark:bg-gray-900"
                >
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={session?.status === "completed" ? "토론이 종료되었습니다." : "논리 오류를 지적하고 반박을 입력하세요..."}
                    disabled={inputDisabled}
                    className="flex-1 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-[14px] text-gray-900 dark:text-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition placeholder:text-gray-400 dark:placeholder:text-gray-600 disabled:opacity-50"
                  />
                  <button
                    type="submit"
                    disabled={inputDisabled}
                    className="px-5 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium text-[14px] rounded-xl transition-colors flex-shrink-0"
                  >
                    {responseLocked ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin">
                        <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                      </svg>
                    ) : "전송"}
                  </button>
                </form>
              </div>

              {/* 우측 정보 패널 */}
              <div className="lg:col-span-4 flex flex-col gap-4 overflow-y-auto p-4 scrollbar-custom bg-gray-50 dark:bg-gray-950 min-h-0">
                {/* 시나리오 */}
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm p-5">
                  <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-3">시나리오</p>
                  <p className="text-[13px] text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                    {scenario?.scenario || "시나리오 데이터 불러오는 중..."}
                  </p>
                  <div className="mt-4 flex flex-col gap-2">
                    <div className="flex items-center justify-between text-[12px]">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-violet-500" />
                        <span className="text-gray-500 dark:text-gray-400">Alpha</span>
                      </span>
                      <span className="text-gray-700 dark:text-gray-300 font-medium">{scenario?.agent_a?.name || "-"}</span>
                    </div>
                    <div className="flex items-center justify-between text-[12px]">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-orange-500" />
                        <span className="text-gray-500 dark:text-gray-400">Bravo</span>
                      </span>
                      <span className="text-gray-700 dark:text-gray-300 font-medium">{scenario?.agent_b?.name || "-"}</span>
                    </div>
                  </div>
                </div>

                {/* 점수 패널 */}
                <ScorePanel
                  totalScore={session?.total_score || 0}
                  validator={validator}
                  cumulativeBreakdown={cumulativeBreakdown}
                  sessionStatus={session?.status}
                />

                {/* 세션 완료 → 리포트 버튼 */}
                {session?.status === "completed" && (
                  <button
                    onClick={() => navigate(`/report/${sessionId}`)}
                    className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-[14px] rounded-xl transition-colors"
                  >
                    리포트 보기 →
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}