# OutThinkAI

> AI를 이겨야만 학습이 끝나는 역방향 AI 학습 플랫폼

## 개요

기존 AI 학습 방식과 다르게, 사용자가 AI의 **의도적 오류**를 탐지하고 논리적으로 반박해야만 학습이 완료되는 새로운 형태의 교육 플랫폼입니다.

### 핵심 동작 원리

| 기존 AI | OutThinkAI |
|--------|------------|
| 사용자 질문 → AI 정답 제공 → 학습 종료 | 사용자 주제 입력 → AI 의도적 오류 포함 답변 → 사용자 오류 탐지 + 논리적 반박 → AI 설득 완료 시 학습 종료 |

## 기술 스택

| 레이어 | 기술 |
|-------|-----|
| Frontend | React + Vite + TailwindCSS |
| Backend | FastAPI (Python) |
| LLM | GPT-4o / GPT-4o-mini |
| DB | PostgreSQL |
| 통신 | REST + SSE |

## 프로젝트 구조

```
outthinkai/
├── frontend/
│   └── src/
│       ├── pages/
│       ├── components/
│       └── api/
├── backend/
│   ├── routers/
│   ├── services/
│   ├── models/
│   ├── schemas/
│   └── prompts/
└── docker-compose.yml
```

## 실행 방법

```bash
# Docker로 실행
docker-compose up -d

# 개발 서버
# Backend: http://localhost:8000
# Frontend: http://localhost:5173
```

## MVP 핵심 기능

1. **시나리오 + 에이전트 생성** - 주제 입력 시 AI가 시나리오와 오류를 가진 에이전트 생성
2. **멀티 에이전트 채팅** - 사용자가 에이전트들과 토론
3. **Validator + 점수 리포트** - 사용자 반박 평가 및 최종 리포트 생성

## 라이선스

MIT License