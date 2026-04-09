import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const generateScenario = async (topic, difficulty) => {
  const response = await client.post('/scenario/generate', { topic, difficulty });
  return response.data;
};

export const getScenario = async (sessionId) => {
  const response = await client.get(`/scenario/${sessionId}`);
  return response.data;
};

export const getSessionState = async (sessionId) => {
  const response = await client.get(`/session/${sessionId}`);
  return response.data;
};

export const sendMessage = async (sessionId, content) => {
  const response = await client.post('/chat/message', { session_id: sessionId, content });
  return response.data;
};

export const surrenderAgent = async (sessionId, agent) => {
  const response = await client.patch(`/session/${sessionId}/surrender`, { agent });
  return response.data;
};

export const getChatHistory = async (sessionId) => {
  const response = await client.get(`/chat/history/${sessionId}`);
  return response.data;
};

export const generateReport = async (sessionId) => {
  const response = await client.post('/report/generate', { session_id: sessionId });
  return response.data;
};

export const getReport = async (sessionId) => {
  const response = await client.get(`/report/${sessionId}`);
  return response.data;
};

export function connectStream(sessionId, handlers) {
  const es = new EventSource(`${API_BASE_URL}/chat/stream/${sessionId}`);

  es.addEventListener('agent_token', (e) => handlers.onToken(JSON.parse(e.data)));
  es.addEventListener('agent_complete', (e) => handlers.onAgentComplete(JSON.parse(e.data)));
  es.addEventListener('validator_result', (e) => handlers.onValidator(JSON.parse(e.data)));
  es.addEventListener('surrender_detected', (e) => handlers.onSurrender(JSON.parse(e.data)));
  es.addEventListener('session_complete', (e) => {
    handlers.onComplete(JSON.parse(e.data));
    es.close();
  });
  es.addEventListener('error', (e) => {
    if (handlers.onError) handlers.onError(e);
    es.close();
  });

  return es;
}

export default client;
