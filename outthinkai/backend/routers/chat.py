import asyncio
import json
import logging
import os
from datetime import datetime
from typing import Dict, List, Any
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sse_starlette.sse import EventSourceResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from openai import AsyncOpenAI

from ..db import get_db, async_session # async_session 추가
from ..schemas.pydantic_schemas import (
    ChatMessageRequest,
    ChatMessageResponse,
    ChatHistoryResponse,
    MessageLog,
    Role,
    APIError,
    ErrorResponse,
)
from ..services.agent_manager import (
    determine_targets,
    detect_surrender,
    update_session_after_message,
)
from ..services.validator import Validator
from ..prompts.agent_prompt import AGENT_SYSTEM_PROMPT, AGENT_USER_PROMPT

logger = logging.getLogger(__name__)

router = APIRouter()

MAX_USER_TURNS = 5  # 사용자가 5번 메시지를 보내면 세션 종료

# SSE Subscriber storage: session_id -> Set of asyncio.Queues
SESSION_SUBSCRIBERS: Dict[UUID, List[asyncio.Queue]] = {}

client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))
validator_service = Validator()

async def push_event(session_id: UUID, event_type: str, data: Any):
    if session_id in SESSION_SUBSCRIBERS:
        event = {"event": event_type, "data": json.dumps(data, ensure_ascii=False)}
        # 현재 연결된 모든 클라이언트 큐에 푸시
        for queue in SESSION_SUBSCRIBERS[session_id]:
            await queue.put(event)

@router.post("/message", response_model=ChatMessageResponse)
async def post_message(
    request: ChatMessageRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    # 1. 세션 존재 확인
    res = await db.execute(
        text("SELECT * FROM sessions WHERE id = :sid"),
        {"sid": str(request.session_id)}
    )
    session_row = res.mappings().one_or_none()
    if not session_row:
        raise HTTPException(status_code=404, detail="Session not found")

    if session_row["status"] == "completed":
        raise HTTPException(status_code=400, detail="Session already completed")

    # 2. 사용자 메시지 저장
    turn_number = session_row["turn_count"] + 1
    msg_id = uuid4()
    await db.execute(
        text("""
            INSERT INTO messages (id, session_id, role, content, turn_number)
            VALUES (:id, :sid, 'user', :content, :turn_number)
        """),
        {
            "id": msg_id,
            "sid": str(request.session_id),
            "content": request.content,
            "turn_number": turn_number,
        }
    )
    
    # 세션 turn_count 업데이트
    await db.execute(
        text("UPDATE sessions SET turn_count = :tc WHERE id = :sid"),
        {"tc": turn_number, "sid": str(request.session_id)}
    )
    await db.commit()

    # 항복 감지
    if await detect_surrender(request.content, client):
        background_tasks.add_task(handle_surrender, request.session_id, "user")

    # 3. 다음 에이전트 결정
    targets = await determine_targets(request.session_id, db)
    
    # 4. 에이전트들 응답 생성
    if targets:
        # 백그라운드 태스크에는 db 세션 대신 세션 팩토리를 사용하도록 변경
        background_tasks.add_task(process_agent_responses, request.session_id, targets, request.content)

    return ChatMessageResponse(
        message_id=msg_id,
        turn_number=turn_number,
        target_agents=[Role(t) for t in targets],
        validation_triggered=True
    )

@router.get("/stream/{session_id}")
async def stream_chat(session_id: UUID):
    async def event_generator():
        queue = asyncio.Queue()
        if session_id not in SESSION_SUBSCRIBERS:
            SESSION_SUBSCRIBERS[session_id] = []
        SESSION_SUBSCRIBERS[session_id].append(queue)
        
        logger.info(f"Client connected to session {session_id}. Active subscribers: {len(SESSION_SUBSCRIBERS[session_id])}")

        try:
            while True:
                event = await queue.get()
                yield event
                if event["event"] == "session_complete":
                     break
        except asyncio.CancelledError:
            logger.info(f"Stream cancelled for session {session_id}")
        finally:
            # Cleanup: 연결 종료 시 큐 제거
            if session_id in SESSION_SUBSCRIBERS:
                SESSION_SUBSCRIBERS[session_id].remove(queue)
                if not SESSION_SUBSCRIBERS[session_id]:
                    del SESSION_SUBSCRIBERS[session_id]
            logger.info(f"Client disconnected from {session_id}. Cleanup complete.")

    return EventSourceResponse(event_generator())

@router.get("/history/{session_id}", response_model=ChatHistoryResponse)
async def get_history(session_id: UUID, db: AsyncSession = Depends(get_db)):
    res_session = await db.execute(
        text("SELECT total_score FROM sessions WHERE id = :sid"),
        {"sid": str(session_id)}
    )
    session_row = res_session.mappings().one_or_none()
    if not session_row:
        raise HTTPException(status_code=404, detail="Session not found")

    res_msgs = await db.execute(
        text("SELECT * FROM messages WHERE session_id = :sid ORDER BY turn_number ASC, created_at ASC"),
        {"sid": str(session_id)}
    )
    messages = []
    for row in res_msgs.mappings().all():
        messages.append(MessageLog(
            id=row["id"],
            role=Role(row["role"]),
            content=row["content"],
            turn_number=row["turn_number"],
            score_delta=row["score_delta"],
            feedback=row["feedback"],
            created_at=row["created_at"]
        ))
    
    return ChatHistoryResponse(
        session_id=session_id,
        messages=messages,
        total_score=session_row["total_score"]
    )

# --- Background Helpers ---

async def process_agent_responses(session_id: UUID, targets: List[str], user_message: str):
    # 백그라운드 작업용 전용 DB 세션 생성
    async with async_session() as db:
        try:
            res = await db.execute(text("SELECT * FROM sessions WHERE id = :sid"), {"sid": str(session_id)})
            session = res.mappings().one()
            
            res_h = await db.execute(
                text("SELECT role, content FROM messages WHERE session_id = :sid ORDER BY turn_number DESC LIMIT 10"),
                {"sid": str(session_id)}
            )
            history_rows = res_h.mappings().all()
            history_str = "\n".join([f"{r['role']}: {r['content']}" for r in reversed(history_rows)])

            # 루프 도중 turn_number 관리를 위해 현재 값 가져오기
            current_turn = session["turn_count"]

            for agent_key in targets:
                agent_data = session[agent_key]
                current_turn += 1 # 각 에이전트 응답마다 턴 증가
                
                response_stream = await client.chat.completions.create(
                    model="gpt-4o",
                    messages=[
                        {"role": "system", "content": AGENT_SYSTEM_PROMPT.format(
                            persona=agent_data["persona"],
                            fallacy_type=agent_data["fallacy_type"],
                            topic=session["topic"],
                            scenario=session["scenario"]
                        )},
                        {"role": "user", "content": AGENT_USER_PROMPT.format(
                            history=history_str,
                            message=user_message
                        )}
                    ],
                    stream=True,
                    temperature=0.7
                )

                full_content = ""
                async for chunk in response_stream:
                    token = chunk.choices[0].delta.content
                    if token:
                        full_content += token
                        await push_event(session_id, "agent_token", {"agent": agent_key, "token": token})

                await push_event(session_id, "agent_complete", {
                    "agent": agent_key,
                    "full_content": full_content,
                    "turn_number": current_turn,
                })

                msg_id = uuid4()
                await db.execute(
                    text("""
                        INSERT INTO messages (id, session_id, role, content, turn_number)
                        VALUES (:id, :sid, :role, :content, :turn_number)
                    """),
                    {
                        "id": msg_id,
                        "sid": str(session_id),
                        "role": agent_key,
                        "content": full_content,
                        "turn_number": current_turn
                    }
                )
                await db.execute(
                    text("UPDATE sessions SET turn_count = :tc WHERE id = :sid"),
                    {"tc": current_turn, "sid": str(session_id)}
                )
                await db.commit()

                # Validator: 사용자 반박을 대상 에이전트의 fallacy 기준으로 평가
                val_result = await validator_service.evaluate_response(
                    fallacy_type=agent_data["fallacy_type"],
                    user_message=user_message,
                    last_3_turns=history_str,
                )

                await db.execute(
                    text("UPDATE messages SET score_delta = :sd, feedback = :fb WHERE id = :mid"),
                    {"sd": val_result.score_delta, "fb": val_result.feedback, "mid": msg_id}
                )
                # 세션 토탈 점수 업데이트 로직 (update_session_after_message 활용)
                await db.execute(
                    text("UPDATE sessions SET total_score = total_score + :delta WHERE id = :sid"),
                    {"delta": val_result.score_delta, "sid": str(session_id)}
                )
                await db.commit()

                await push_event(session_id, "validator_result", {
                    "agent": agent_key,
                    "score_delta": val_result.score_delta,
                    "feedback": val_result.feedback,
                    "is_valid_rebuttal": val_result.is_valid_rebuttal,
                    "fallacy_addressed": val_result.fallacy_addressed
                })

                if await detect_surrender(full_content, client):
                    await handle_surrender(session_id, agent_key)
                    return  # 항복 처리 후 종료

            # 에이전트 응답 완료 후 최대 턴 수 체크
            user_count_res = await db.execute(
                text("SELECT COUNT(*) FROM messages WHERE session_id = :sid AND role = 'user'"),
                {"sid": str(session_id)}
            )
            user_turn_count = user_count_res.scalar()

            if user_turn_count >= MAX_USER_TURNS:
                await db.execute(
                    text("UPDATE sessions SET status = cast('completed' as session_status) WHERE id = :sid"),
                    {"sid": str(session_id)}
                )
                await db.commit()
                await push_event(session_id, "session_complete", {"session_id": str(session_id)})
                asyncio.create_task(_auto_generate_report(session_id))

        except Exception as e:
            logger.exception("Error in background agent processing")
            await push_event(session_id, "stream_error", {"message": str(e)})

async def handle_surrender(session_id: UUID, role: str):
    # 유저가 포기한 경우 → 즉시 세션 종료 후 리포트 생성
    if role == "user":
        async with async_session() as db:
            await db.execute(
                text("UPDATE sessions SET status = cast('completed' as session_status) WHERE id = :sid"),
                {"sid": str(session_id)},
            )
            await db.commit()
        await push_event(session_id, "surrender_detected", {"agent": "user", "both_surrendered": True})
        await push_event(session_id, "session_complete", {"session_id": str(session_id)})
        asyncio.create_task(_auto_generate_report(session_id))
        return

    async with async_session() as db:
        # 항복한 에이전트 surrendered = true 업데이트
        res = await db.execute(
            text("SELECT agent_a, agent_b FROM sessions WHERE id = :sid"),
            {"sid": str(session_id)},
        )
        row = res.mappings().one()
        agent_data = dict(row[role])
        agent_data["surrendered"] = True

        other_key = "agent_b" if role == "agent_a" else "agent_a"
        other_data = dict(row[other_key])
        both_surrendered = other_data.get("surrendered", False)

        new_status = "completed" if both_surrendered else "active"
        await db.execute(
            text(f"""
                UPDATE sessions
                SET {role} = cast(:agent_data as jsonb),
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

    await push_event(session_id, "surrender_detected", {"agent": role, "both_surrendered": both_surrendered})

    if both_surrendered:
        await push_event(session_id, "session_complete", {"session_id": str(session_id)})
        asyncio.create_task(_auto_generate_report(session_id))


async def _auto_generate_report(session_id: UUID):
    """세션 완료 시 리포트를 자동 생성합니다."""
    from ..services.report_generator import generate_report
    try:
        async with async_session() as db:
            # 이미 리포트가 있으면 스킵
            res = await db.execute(
                text("SELECT id FROM reports WHERE session_id = :sid"),
                {"sid": str(session_id)}
            )
            if res.mappings().one_or_none():
                return
            await generate_report(session_id, db)
            logger.info(f"Auto-generated report for session {session_id}")
    except Exception:
        logger.exception(f"Auto report generation failed for session {session_id}")
