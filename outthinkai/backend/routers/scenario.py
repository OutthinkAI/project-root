import logging
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from openai import APIError as OpenAIAPIError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

logger = logging.getLogger(__name__)

from ..db import get_db
from ..schemas.pydantic_schemas import (
    ErrorResponse,
    ScenarioGenerateRequest,
    ScenarioGenerateResponse,
    AgentPersona,
)
from ..services.scenario_generator import generate_scenario

router = APIRouter()


@router.post("/generate", response_model=ScenarioGenerateResponse)
async def post_scenario_generate(
    request: ScenarioGenerateRequest,
    db: AsyncSession = Depends(get_db),
):
    if not request.topic or len(request.topic.strip()) < 2:
        raise HTTPException(
            status_code=400,
            detail=ErrorResponse(
                error={"code": "INVALID_TOPIC", "message": "topic은 2자 이상이어야 합니다."}
            ).model_dump(),
        )
    request.topic = request.topic.strip()

    try:
        return await generate_scenario(request, db)
    except OpenAIAPIError as e:
        logger.exception("OpenAI API 호출 실패")
        raise HTTPException(
            status_code=500,
            detail=ErrorResponse(
                error={"code": "LLM_ERROR", "message": "GPT API 호출에 실패했습니다.", "detail": str(e)}
            ).model_dump(),
        )
    except ValueError as e:
        logger.exception("LLM 응답 파싱 실패")
        raise HTTPException(
            status_code=500,
            detail=ErrorResponse(
                error={"code": "LLM_ERROR", "message": "LLM 응답 파싱에 실패했습니다.", "detail": str(e)}
            ).model_dump(),
        )
    except Exception as e:
        logger.exception("예상치 못한 에러 발생")
        raise HTTPException(
            status_code=500,
            detail=ErrorResponse(
                error={"code": "INTERNAL_ERROR", "message": "서버 내부 오류가 발생했습니다.", "detail": str(e)}
            ).model_dump(),
        )


@router.get("/{session_id}", response_model=ScenarioGenerateResponse)
async def get_scenario(
    session_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        text("SELECT * FROM sessions WHERE id = :sid"),
        {"sid": str(session_id)},
    )
    row = result.mappings().one_or_none()

    if row is None:
        raise HTTPException(
            status_code=404,
            detail=ErrorResponse(
                error={"code": "SESSION_NOT_FOUND", "message": "세션을 찾을 수 없습니다."}
            ).model_dump(),
        )

    return ScenarioGenerateResponse(
        session_id=row["id"],
        scenario=row["scenario"],
        agent_a=AgentPersona(**row["agent_a"]),
        agent_b=AgentPersona(**row["agent_b"]),
        difficulty=row["difficulty"],
        created_at=row["created_at"],
    )