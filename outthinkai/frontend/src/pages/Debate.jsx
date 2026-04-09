import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
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

export default function Debate() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const disconnectRef = useRef(null);
  const latestRef = useRef({
    scenario: null,
    session: null,
    validator: null,
    messages: [],
  });

  const sessionId = searchParams.get("sessionId") || "";

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
    return () => {
      disconnectRef.current?.();
    };
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

    navigate(`/report?sessionId=${encodeURIComponent(sessionId)}`);
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
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        gridTemplateColumns: "minmax(0, 1.4fr) 360px",
        background:
          "radial-gradient(circle at top left, rgba(0, 201, 167, 0.14), transparent 28%), linear-gradient(180deg, #06121b, #04070a 60%)",
        color: "#f4f7fb",
        fontFamily: "\"Segoe UI\", sans-serif",
      }}
    >
      <section
        style={{
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
          borderRight: "1px solid rgba(148, 163, 184, 0.18)",
        }}
      >
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 24,
            padding: "28px 32px 20px",
            borderBottom: "1px solid rgba(148, 163, 184, 0.16)",
          }}
        >
          <div>
            <span
              style={{
                display: "inline-flex",
                fontSize: "0.75rem",
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "#8fb7cc",
              }}
            >
              Live Debate
            </span>
            <h1 style={{ margin: "10px 0 8px", fontSize: "2rem" }}>
              {scenario?.topic || "Debate Session"}
            </h1>
            <p style={{ margin: 0, color: "#b8c8d8", lineHeight: 1.6 }}>
              {scenario?.scenario || "Open a session with a valid sessionId to begin."}
            </p>
          </div>

          <div style={{ display: "grid", gap: 10, alignContent: "start" }}>
            <span
              style={{
                display: "inline-flex",
                justifyContent: "center",
                padding: "10px 14px",
                borderRadius: 999,
                border: "1px solid rgba(110, 231, 183, 0.24)",
                background: "rgba(15, 23, 42, 0.7)",
                color: "#d9fff1",
                fontSize: "0.82rem",
              }}
            >
              {session?.status || (loading ? "loading" : "idle")}
            </span>
            <span
              style={{
                display: "inline-flex",
                justifyContent: "center",
                padding: "10px 14px",
                borderRadius: 999,
                border: "1px solid rgba(110, 231, 183, 0.24)",
                background: "rgba(15, 23, 42, 0.7)",
                color: "#d9fff1",
                fontSize: "0.82rem",
              }}
            >
              {streaming ? "SSE connected" : "SSE waiting"}
            </span>
          </div>
        </header>

        <section style={{ display: "flex", flexDirection: "column", minHeight: 0, flex: 1 }}>
          <div style={{ flex: 1, minHeight: 0, overflow: "auto", padding: "28px 32px 20px" }}>
            {loading ? <p style={{ color: "#b8c8d8" }}>Loading debate...</p> : null}

            {!loading && orderedMessages.length === 0 ? (
              <p style={{ color: "#b8c8d8" }}>No messages yet. Send the first rebuttal.</p>
            ) : null}

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

            {drafts.agent_a ? <ChatBubble role="agent_a" content={drafts.agent_a} isStreaming /> : null}
            {drafts.agent_b ? <ChatBubble role="agent_b" content={drafts.agent_b} isStreaming /> : null}
          </div>

          <form
            onSubmit={handleSend}
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 1fr) 120px",
              gap: 12,
              padding: "20px 32px 28px",
              borderTop: "1px solid rgba(148, 163, 184, 0.16)",
              background: "rgba(5, 10, 16, 0.92)",
            }}
          >
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="논리 오류를 짚고 반박을 입력하세요."
              disabled={!sessionId || sending || session?.status === "completed"}
              style={{
                width: "100%",
                minWidth: 0,
                border: "1px solid rgba(148, 163, 184, 0.22)",
                borderRadius: 14,
                background: "rgba(15, 23, 42, 0.84)",
                color: "#f4f7fb",
                padding: "14px 16px",
                font: "inherit",
              }}
            />
            <button
              type="submit"
              disabled={!sessionId || sending || session?.status === "completed"}
              style={{
                border: 0,
                borderRadius: 14,
                background: "linear-gradient(135deg, #34d399, #22c55e)",
                color: "#04210f",
                font: "inherit",
                fontWeight: 700,
                cursor: "pointer",
                opacity: !sessionId || sending || session?.status === "completed" ? 0.5 : 1,
              }}
            >
              {sending ? "Sending..." : "Send"}
            </button>
          </form>

          {error ? <p style={{ padding: "0 32px 24px", color: "#ffb4b4" }}>{error}</p> : null}
        </section>
      </section>

      <aside
        style={{
          padding: 24,
          display: "grid",
          gap: 18,
          alignContent: "start",
          background: "rgba(3, 8, 14, 0.92)",
        }}
      >
        <section
          style={{
            padding: 18,
            borderRadius: 20,
            border: "1px solid rgba(148, 163, 184, 0.16)",
            background: "rgba(10, 18, 28, 0.92)",
            color: "#f4f7fb",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", gap: 16, marginBottom: 16 }}>
            <div>
              <span
                style={{
                  display: "inline-flex",
                  fontSize: "0.75rem",
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: "#8fb7cc",
                }}
              >
                Scenario
              </span>
              <h3 style={{ margin: "10px 0 0", fontSize: "1.2rem" }}>Debate Setup</h3>
            </div>
          </div>

          <dl style={{ display: "grid", gap: 14, margin: 0 }}>
            <div>
              <dt style={{ color: "#8fb7cc", fontSize: "0.78rem" }}>Topic</dt>
              <dd style={{ margin: 0 }}>{scenario?.topic || "-"}</dd>
            </div>
            <div>
              <dt style={{ color: "#8fb7cc", fontSize: "0.78rem" }}>Agent A</dt>
              <dd style={{ margin: 0 }}>{scenario?.agent_a?.name || "-"}</dd>
            </div>
            <div>
              <dt style={{ color: "#8fb7cc", fontSize: "0.78rem" }}>Agent B</dt>
              <dd style={{ margin: 0 }}>{scenario?.agent_b?.name || "-"}</dd>
            </div>
            <div>
              <dt style={{ color: "#8fb7cc", fontSize: "0.78rem" }}>Session</dt>
              <dd style={{ margin: 0 }}>{sessionId || "Missing sessionId"}</dd>
            </div>
          </dl>
        </section>

        <ScorePanel
          totalScore={session?.total_score || 0}
          validator={validator}
          sessionStatus={session?.status}
        />
      </aside>
    </main>
  );
}
