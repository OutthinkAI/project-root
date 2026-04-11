import logging
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from openai import APIError as OpenAIAPIError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

from db import get_db
from schemas.pydantic_schemas import (
    AgentPersona,
    ErrorResponse,
    FallacyCaught,
    ReportGenerateRequest,
    ReportResponse,
)
from services.report_generator import generate_report

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/report", tags=["Report"])


@router.post("/generate", response_model=ReportResponse)
async def post_report_generate(
    request: ReportGenerateRequest,
    db: AsyncSession = Depends(get_db),
):
    # 세션 확인
    res = await db.execute(
        text("SELECT status FROM sessions WHERE id = :sid"),
        {"sid": str(request.session_id)},
    )
    session_row = res.mappings().one_or_none()

    if session_row is None:
        raise HTTPException(
            status_code=404,
            detail=ErrorResponse(
                error={"code": "SESSION_NOT_FOUND", "message": "세션을 찾을 수 없습니다."}
            ).model_dump(),
        )

    if session_row["status"] != "completed":
        raise HTTPException(
            status_code=409,
            detail=ErrorResponse(
                error={"code": "SESSION_NOT_COMPLETED", "message": "아직 완료되지 않은 세션입니다."}
            ).model_dump(),
        )

    # 이미 리포트 존재 여부 확인
    res_report = await db.execute(
        text("SELECT id FROM reports WHERE session_id = :sid"),
        {"sid": str(request.session_id)},
    )
    if res_report.mappings().one_or_none():
        raise HTTPException(
            status_code=409,
            detail=ErrorResponse(
                error={"code": "REPORT_ALREADY_EXISTS", "message": "이미 리포트가 존재하는 세션입니다."}
            ).model_dump(),
        )

    try:
        return await generate_report(request.session_id, db)
    except OpenAIAPIError as e:
        logger.exception("리포트 생성 LLM 호출 실패")
        raise HTTPException(
            status_code=500,
            detail=ErrorResponse(
                error={"code": "LLM_ERROR", "message": "GPT API 호출에 실패했습니다.", "detail": str(e)}
            ).model_dump(),
        )


@router.get("/{session_id}", response_model=ReportResponse)
async def get_report(
    session_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    res = await db.execute(
        text("SELECT * FROM reports WHERE session_id = :sid"),
        {"sid": str(session_id)},
    )
    row = res.mappings().one_or_none()

    if row is None:
        raise HTTPException(
            status_code=404,
            detail=ErrorResponse(
                error={"code": "REPORT_NOT_FOUND", "message": "리포트가 아직 생성되지 않은 세션입니다."}
            ).model_dump(),
        )

    return ReportResponse(
        report_id=row["id"],
        session_id=row["session_id"],
        total_score=row["total_score"],
        fallacies_caught=[FallacyCaught(**f) for f in row["fallacies_caught"]],
        strengths=row["strengths"],
        improvements=row["improvements"],
        summary=row["summary"],
        created_at=row["created_at"],
    )
