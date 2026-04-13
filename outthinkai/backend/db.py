import os

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import declarative_base

# -----------------------------------------------------------------------------
# 1. DB 접속
#    - Docker Compose 환경: 서비스명 'db' 를 호스트로 사용
#    - 로컬 직접 실행 시 DATABASE_URL 환경변수로 오버라이드 가능
# -----------------------------------------------------------------------------
DATABASE_URL: str = os.getenv(
    "DATABASE_URL",
    "postgresql+asyncpg://outthinkai:outthinkai@db:5432/outthinkai",
)

# -----------------------------------------------------------------------------
# 2. 비동기 엔진
#    - echo=True : 개발 환경에서 SQL 로그 출력 (운영 시 False 권장)
#    - pool_pre_ping=True : 연결 유효성 사전 확인 (DB 재시작 후 자동 복구)
# -----------------------------------------------------------------------------
engine = create_async_engine(
    DATABASE_URL,
    echo=True,
    pool_pre_ping=True,
)

# -----------------------------------------------------------------------------
# 3. 세션 팩토리
#    - expire_on_commit=False : commit 이후에도 ORM 객체 속성 접근 가능
# -----------------------------------------------------------------------------
async_session = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

# -----------------------------------------------------------------------------
# 4. 선언적 베이스 (모든 ORM 모델이 상속)
# -----------------------------------------------------------------------------
Base = declarative_base()

# -----------------------------------------------------------------------------
# 5. FastAPI Dependency: get_db
#    - 요청마다 세션을 열고, 완료 후 자동으로 닫음
#    - 예외 발생 시 rollback 보장
# -----------------------------------------------------------------------------    
async def get_db():
    async with async_session() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        # async with 블록 종료 시 SQLAlchemy가 자동으로 session.close() 호출