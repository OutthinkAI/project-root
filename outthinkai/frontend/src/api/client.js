const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.VITE_API_BASE_URL ||
  "http://localhost:8000/api";

function buildUrl(path) {
  return `${API_BASE_URL}${path}`;
}

function parseJson(data) {
  if (!data) return null;

  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

async function fetchJson(path, options) {
  const response = await fetch(buildUrl(path), options);
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      payload?.detail ||
      payload?.message ||
      `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return payload;
}

export async function getScenario(sessionId) {
  return fetchJson(`/scenario/${sessionId}`);
}

export async function getSession(sessionId) {
  return fetchJson(`/session/${sessionId}`);
}

export async function getChatHistory(sessionId) {
  return fetchJson(`/chat/history/${sessionId}`);
}

export async function postChatMessage({ sessionId, content, role = "user" }) {
  return fetchJson("/chat/message", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      session_id: sessionId,
      role,
      content,
    }),
  });
}

export function connectStream({
  sessionId,
  onAgentToken,
  onAgentComplete,
  onValidatorResult,
  onSurrenderDetected,
  onSessionComplete,
  onError,
}) {
  if (!sessionId || typeof window === "undefined") {
    return () => {};
  }

  const source = new EventSource(buildUrl(`/chat/stream/${sessionId}`));

  source.addEventListener("agent_token", (event) => {
    onAgentToken?.(parseJson(event.data) || {});
  });

  source.addEventListener("agent_complete", (event) => {
    onAgentComplete?.(parseJson(event.data) || {});
  });

  source.addEventListener("validator_result", (event) => {
    onValidatorResult?.(parseJson(event.data) || {});
  });

  source.addEventListener("surrender_detected", (event) => {
    onSurrenderDetected?.(parseJson(event.data) || {});
  });

  source.addEventListener("session_complete", (event) => {
    onSessionComplete?.(parseJson(event.data) || {});
  });

  source.addEventListener("error", (event) => {
    onError?.(event);
  });

  return () => {
    source.close();
  };
}
