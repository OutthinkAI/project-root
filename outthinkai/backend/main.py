import os
from contextlib import asynccontextmanager
from pathlib import Path
from dotenv import load_dotenv

# 현재 파일(main.py)의 디렉토리에 있는 .env 파일을 로드합니다.
env_path = Path(__file__).parent / ".env"
load_dotenv(dotenv_path=env_path)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .db import engine, Base

# -----------------------------------------------------------------------------
# Lifespan: startup / shutdown 이벤트
# -----------------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    # ── Startup ──────────────────────────────────────────────────────────────
    # ORM 테이블 자동 생성 (개발 편의용; 운영에서는 Alembic 마이그레이션 사용 권장)
    # async with engine.begin() as conn:
    #     await conn.run_sync(lambda c: Base.metadata.create_all(c, checkfirst=True))
        
    print("✅ DB connection established")
    yield
    # ── Shutdown ─────────────────────────────────────────────────────────────
    await engine.dispose()
    print("🛑 DB connection closed")


# -----------------------------------------------------------------------------
# FastAPI 앱 인스턴스
# -----------------------------------------------------------------------------
app = FastAPI(
    title="OutThinkAI API",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)

# -----------------------------------------------------------------------------
# CORS 미들웨어
#   - CORS_ORIGINS 환경변수: 콤마(,) 구분된 허용 출처 목록
#   - 미설정 시 개발용 기본값(localhost:3000) 사용
# -----------------------------------------------------------------------------
_raw_origins: str = os.getenv("CORS_ORIGINS", "http://localhost:3000")
origins: list[str] = [o.strip() for o in _raw_origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -----------------------------------------------------------------------------
# 라우터 등록
# -----------------------------------------------------------------------------
from .routers.scenario import router as scenario_router
from .routers.session import router as session_router
from .routers.chat import router as chat_router
from .routers.report import router as report_router

app.include_router(scenario_router, prefix="/api/scenario", tags=["Scenario"])
app.include_router(session_router, prefix="/api/session", tags=["Session"])
app.include_router(report_router, prefix="/api/report", tags=["Report"])
app.include_router(chat_router, prefix="/api/chat", tags=["Chat"])


# -----------------------------------------------------------------------------
# GET /api/health — 헬스 체크 엔드포인트
# -----------------------------------------------------------------------------
@app.get("/api/health", tags=["Health"])
async def health_check():
    return {"status": "ok", "version": "1.0.0"}
