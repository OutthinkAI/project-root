import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams, Link, useLocation } from "react-router-dom";
import ChatBubble from "../components/ChatBubble";
import ScorePanel from "../components/ScorePanel";
import {
  connectStream,
  getChatHistory,
  getScenario,
  getSession,
  postChatMessage,
} from "../api/client";

const REPORT_STORAGE_PREFIX = "outthink-report:";

// ---- 사이드바 네비게이션 아이템 ----
const navItems = [
  {
    label: "미션 센터", href: "/", section: "메인",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
        <path d="M6.66667 2H2V6.66667H6.66667V2Z" stroke="currentColor" strokeWidth="0.666667"/>
        <path d="M14.0002 2H9.3335V6.66667H14.0002V2Z" stroke="currentColor" strokeWidth="0.666667"/>
        <path d="M6.66667 9.33337H2V14H6.66667V9.33337Z" stroke="currentColor" strokeWidth="0.666667"/>
        <path d="M14.0002 9.33337H9.3335V14H14.0002V9.33337Z" stroke="currentColor" strokeWidth="0.666667"/>
      </svg>
    ),
  },
  {
    label: "삼각 토론", href: "/debate", section: null,
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
        <path d="M5.33333 7.99996H5.34M8 7.99996H8.00667M10.6667 7.99996H10.6733M14 7.99996C14 10.9453 11.3133 13.3333 8 13.3333C7.01909 13.3366 6.04986 13.1205 5.16333 12.7006L2 13.3333L2.93 10.8533C2.34133 10.028 2 9.04929 2 7.99996C2 5.05463 4.68667 2.66663 8 2.66663C11.3133 2.66663 14 5.05463 14 7.99996Z" stroke="currentColor" strokeOpacity="0.6" strokeWidth="0.666667"/>
      </svg>
    ),
  },
  {
    label: "사고 증명", href: "/report", section: null,
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
        <path d="M6.00016 11.3333V10M8.00016 11.3333V8.66667M10.0002 11.3333V7.33333M11.3335 14H4.66683C4.31321 14 3.97407 13.8595 3.72402 13.6095C3.47397 13.3594 3.3335 13.0203 3.3335 12.6667V3.33333C3.3335 2.97971 3.47397 2.64057 3.72402 2.39052C3.97407 2.14048 4.31321 2 4.66683 2H8.39083C8.56763 2.00004 8.73717 2.0703 8.86216 2.19533L12.4715 5.80467C12.5965 5.92966 12.6668 6.0992 12.6668 6.276V12.6667C12.6668 13.0203 12.5264 13.3594 12.2763 13.6095C12.0263 13.8595 11.6871 14 11.3335 14Z" stroke="currentColor" strokeOpacity="0.6" strokeWidth="0.666667"/>
      </svg>
    ),
  },
];

function Sidebar({ isOpen, onClose }) {
  const location = useLocation();

  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />}
      <aside className={`fixed lg:relative inset-y-0 left-0 z-50 lg:z-auto w-64 flex flex-col flex-shrink-0 border-r border-white/10 bg-black/50 backdrop-blur-sm transition-transform duration-200 lg:translate-x-0 ${isOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex flex-col gap-[3px] p-6 border-b border-white/10">
          <div className="font-mono text-[18px] font-bold leading-7">
            <span className="text-[#00ffaa]">LOGIC</span><span className="text-white/20">_</span><span className="text-[#ff00aa]">DBG</span>
          </div>
          <div className="font-mono text-[9px] font-normal text-white/30 tracking-[0.9px] uppercase">비판적 사고 훈련</div>
        </div>

        <div className="flex items-center gap-3 p-4 border-b border-white/10">
          <div className="w-10 h-10 flex items-center justify-center bg-[#00ffaa] flex-shrink-0">
            <span className="font-mono text-[16px] font-bold text-black">김</span>
          </div>
          <div className="flex flex-col">
            <span className="font-mono text-[14px] font-medium text-white leading-5">김서연</span>
            <span className="font-mono text-[10px] text-[#00ffaa] uppercase leading-[15px]">LV.7 분석가</span>
          </div>
        </div>

        <nav className="flex-1 flex flex-col py-[15px]">
          <div className="px-4 mb-[15px]"><span className="font-mono text-[9px] text-white/30 tracking-[0.9px] uppercase">메인</span></div>
          <div className="flex flex-col">
            {navItems.map((item) => {
              const isActive = location.pathname === item.href || (item.href !== "/" && location.pathname.startsWith(item.href));
              return (
                <Link key={item.href} to={item.href} onClick={onClose} className={`flex items-center gap-3 px-4 py-3 relative ${isActive ? "bg-[#00ffaa]/5" : "hover:bg-white/5"} transition-colors`}>
                  <span className={isActive ? "text-white" : "text-white/60"}>{item.icon}</span>
                  {isActive && <div className="absolute left-0 top-[8.8px] w-[3px] h-[26px] bg-[#00ffaa]" />}
                  <span className={`font-mono text-[14px] font-normal leading-5 ${isActive ? "text-white" : "text-white/60"}`}>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="flex flex-col gap-1 p-4 border-t border-white/10">
          <div className="flex justify-between items-center">
            <span className="font-mono text-[9px] text-white/30">일일 할당량</span>
            <span className="font-mono text-[9px] text-[#00ffaa]">7/10</span>
          </div>
          <div className="h-1 bg-white/10 overflow-hidden">
            <div className="h-full bg-[#00ffaa]" style={{ width: "70%" }} />
          </div>
        </div>
      </aside>
    </>
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
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState("");

  const orderedMessages = useMemo(() => sortMessages(messages), [messages]);

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

  function handleSessionComplete(payload) {
    disconnectStream();
    setSending(false);
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
        setSending(false);
        setStreaming(false);
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
        setSending(false);
        setError("The live stream ended unexpectedly.");
      },
    });
  }

  async function handleSend(event) {
    event.preventDefault();

    const content = input.trim();
    if (!content || !sessionId || sending || session?.status === "completed") {
      return;
    }

    const optimisticMessage = buildUserMessage(content, (session?.turn_count || 0) + 1);

    setError("");
    setSending(true);
    setInput("");
    setMessages((current) => [...current, optimisticMessage]);

    try {
      const response = await postChatMessage({ sessionId, content });
      setMessages((current) =>
        current.map((message) =>
          message.id === optimisticMessage.id ? response?.message || optimisticMessage : message,
        ),
      );
      startStream(sessionId);
    } catch (sendError) {
      setSending(false);
      setMessages((current) =>
        current.filter((message) => message.id !== optimisticMessage.id),
      );
      setError(sendError.message || "Failed to send message.");
    }
  }

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
                {!sessionId ? "No Active Session" : scenario?.topic || "Debate Session"}
              </h1>
              <p className="font-mono text-[14px] text-white/40">
                {sessionId ? "> 시스템 논리 허점을 공략하십시오_" : "> 진행 중인 시뮬레이션이 없습니다_"}
              </p>
            </div>
            
            <div className="hidden md:flex flex-col items-end">
               <span className="font-mono text-[10px] text-white/40 uppercase mb-1">Session ID</span>
               <span className="font-mono text-[12px] text-white/80">{sessionId ? `${sessionId.slice(0, 8)}...` : "NONE"}</span>
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

                  {orderedMessages.map((message) => (
                    <ChatBubble
                      key={message.id}
                      role={message.role}
                      content={message.content}
                      createdAt={message.created_at}
                      feedback={message.feedback}
                      scoreDelta={message.score_delta}
                    />
                  ))}

                  {drafts.agent_a && <ChatBubble role="agent_a" content={drafts.agent_a} isStreaming />}
                  {drafts.agent_b && <ChatBubble role="agent_b" content={drafts.agent_b} isStreaming />}
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
                    disabled={!sessionId || sending || session?.status === "completed"}
                    className="flex-1 bg-white/[0.03] border border-white/10 px-5 py-4 text-white font-sans text-[14px] outline-none focus:border-[#00ffaa] transition-colors placeholder:text-white/20 disabled:opacity-50"
                  />
                  <button
                    type="submit"
                    disabled={!sessionId || sending || session?.status === "completed"}
                    className="px-8 bg-[#00ffaa] text-black font-mono text-[14px] font-bold uppercase hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {sending ? "..." : "Send"}
                  </button>
                </form>
                
                {error && (
                  <div className="absolute bottom-24 left-0 right-0 px-6 py-2 bg-[#ff00aa]/20 border-y border-[#ff00aa]/50 text-[#ff00aa] font-mono text-[11px] text-center backdrop-blur-md z-20">
                    {error}
                  </div>
                )}
              </div>

              {/* 우측 정보 패널 영역: 이 구역도 내부에서 따로 스크롤되게 만듭니다. */}
              <div className="lg:col-span-4 flex flex-col bg-black/20 border border-white/5 relative overflow-hidden h-full">
                <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 scrollbar-cyber">
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
                    sessionStatus={session?.status}
                  />
                </div>

                {session?.status === "completed" && (
                  <div className="p-4 border-t border-[#00ffaa]/30 bg-[#00ffaa]/5 flex-shrink-0 backdrop-blur-md">
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