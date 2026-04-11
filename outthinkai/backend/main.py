import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
#from models import db_models

from db import engine, Base

# -----------------------------------------------------------------------------
# Lifespan: startup / shutdown 이벤트
# -----------------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    # ── Startup ──────────────────────────────────────────────────────────────
    # ORM 테이블 자동 생성 (개발 편의용; 운영에서는 Alembic 마이그레이션 사용 권장)
    #서버가 실행될 때마다 테이블을 자동으로 생성
    #async with engine.begin() as conn:
        # checkfirst=True: 01_schema.sql이 이미 생성한 ENUM/테이블과 충돌 방지
        #await conn.run_sync(lambda c: Base.metadata.create_all(c, checkfirst=True))
        
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
from routers import scenario
app.include_router(scenario.router)


# -----------------------------------------------------------------------------
# GET /api/health — 헬스 체크 엔드포인트
# -----------------------------------------------------------------------------
@app.get("/api/health", tags=["Health"])
async def health_check():
    return {"status": "ok", "version": "1.0.0"}
