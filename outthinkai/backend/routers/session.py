import json
import logging
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

from db import get_db
from schemas.pydantic_schemas import (
    AgentPersona,
    ErrorResponse,
    Role,
    SessionStateResponse,
    SessionStatus,
    SurrenderRequest,
    SurrenderResponse,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/session", tags=["Session"])


@router.get("/{session_id}", response_model=SessionStateResponse)
async def get_session(
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

    return SessionStateResponse(
        session_id=row["id"],
        topic=row["topic"],
        scenario=row["scenario"],
        agent_a=AgentPersona(**row["agent_a"]),
        agent_b=AgentPersona(**row["agent_b"]),
        status=SessionStatus(row["status"]),
        total_score=row["total_score"],
        turn_count=row["turn_count"],
        created_at=row["created_at"],
    )


@router.patch("/{session_id}/surrender", response_model=SurrenderResponse)
async def patch_surrender(
    session_id: UUID,
    body: SurrenderRequest,
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

    if body.agent == Role.user:
        raise HTTPException(
            status_code=400,
            detail=ErrorResponse(
                error={"code": "INVALID_AGENT", "message": "agent는 agent_a 또는 agent_b여야 합니다."}
            ).model_dump(),
        )

    agent_key = body.agent.value  # "agent_a" or "agent_b"
    agent_data: dict = dict(row[agent_key])

    if agent_data.get("surrendered"):
        raise HTTPException(
            status_code=409,
            detail=ErrorResponse(
                error={"code": "ALREADY_SURRENDERED", "message": "이미 항복 처리된 에이전트입니다."}
            ).model_dump(),
        )

    agent_data["surrendered"] = True

    # 상대 에이전트 항복 여부 확인
    other_key = "agent_b" if agent_key == "agent_a" else "agent_a"
    other_data: dict = dict(row[other_key])
    both_surrendered = other_data.get("surrendered", False)

    # 업데이트: 항복한 에이전트 JSONB + 양쪽 항복 시 status = completed
    new_status = "completed" if both_surrendered else row["status"]

    await db.execute(
        text(f"""
            UPDATE sessions
            SET {agent_key} = cast(:agent_data as jsonb),
                status = cast(:status as session_status)
            WHERE id = :sid
        """),
        {
            "agent_data": json.dumps(agent_data, ensure_ascii=False),
            "status": new_status,
            "sid": str(session_id),
        },
    )
    await db.commit()

    return SurrenderResponse(
        session_id=session_id,
        agent=Role(agent_key),
        both_surrendered=both_surrendered,
    )