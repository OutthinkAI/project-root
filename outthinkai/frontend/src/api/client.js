import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ---- [추가] 서버 헬스 체크 ----
export const checkHealth = async () => {
  const response = await client.get('/health');
  return response.data;
};

// ---- 시나리오 및 세션 관리 ----
export const generateScenario = async (topic, difficulty) => {
  const response = await client.post('/scenario/generate', { topic, difficulty });
  return response.data;
};

export const getScenario = async (sessionId) => {
  const response = await client.get(`/scenario/${sessionId}`);
  return response.data;
};

// Debate.jsx 호환: getSessionState -> getSession
export const getSession = async (sessionId) => {
  const response = await client.get(`/session/${sessionId}`);
  return response.data;
};

export const surrenderAgent = async (sessionId, agent) => {
  const response = await client.patch(`/session/${sessionId}/surrender`, { agent });
  return response.data;
};

// ---- 채팅 관리 ----
// Debate.jsx 호환: 객체({sessionId, content}) 형태로 인자 받도록 수정, sendMessage -> postChatMessage
export const postChatMessage = async ({ sessionId, content }) => {
  const response = await client.post('/chat/message', { session_id: sessionId, content });
  return response.data;
};

export const getChatHistory = async (sessionId) => {
  const response = await client.get(`/chat/history/${sessionId}`);
  return response.data;
};

// ---- 리포트 관리 ----
export const generateReport = async (sessionId) => {
  const response = await client.post('/report/generate', { session_id: sessionId });
  return response.data;
};

export const getReport = async (sessionId) => {
  const response = await client.get(`/report/${sessionId}`);
  return response.data;
};

// ---- SSE 스트리밍 연결 ----
// Debate.jsx 호환: 인자를 단일 객체로 받고, disconnect용 함수를 반환하도록 수정
export function connectStream({
  sessionId,
  onAgentToken,
  onAgentComplete,
  onValidatorResult,
  onSurrenderDetected,
  onSessionComplete,
  onError,
}) {
  const es = new EventSource(`${API_BASE_URL}/chat/stream/${sessionId}`);

  es.addEventListener('agent_token', (e) => onAgentToken(JSON.parse(e.data)));
  es.addEventListener('agent_complete', (e) => onAgentComplete(JSON.parse(e.data)));
  es.addEventListener('validator_result', (e) => onValidatorResult(JSON.parse(e.data)));
  es.addEventListener('surrender_detected', (e) => onSurrenderDetected(JSON.parse(e.data)));
  
  es.addEventListener('session_complete', (e) => {
    onSessionComplete(JSON.parse(e.data));
    es.close();
  });

  es.addEventListener('error', (e) => {
    if (es.readyState === EventSource.CLOSED) {
      console.log('SSE connection closed naturally.');
    } else {
      if (onError) onError(e);
    }
    es.close();
  });

  // Debate.jsx의 disconnectRef.current?.() 호출을 지원하기 위한 클린업 함수 반환
  return () => {
    es.close();
  };
}

export default client;
