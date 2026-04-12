import logging
import json
import os
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from openai import AsyncOpenAI

logger = logging.getLogger(__name__)

IDLE_TURNS = 2
SURRENDER_SIGNALS = [
    "i surrender",
    "you win",
    "i cannot argue further",
    "i give up",
    "항복합니다",
    "당신이 이겼습니다",
    "더 이상 논쟁할 수 없습니다"
]

async def determine_targets(session_id: UUID, db: AsyncSession) -> list:
    """
    현재 세션 상태를 보고다음에 응답할 에이전트 결정.
    기본적으로 user -> agent_a -> agent_b 순서를 따르거나 상황에 맞게 조정.
    """
    # 마지막 메시지의 실을 확인
    result = await db.execute(
        text("SELECT role FROM messages WHERE session_id = :sid ORDER BY turn_number DESC, created_at DESC LIMIT 1"),
        {"sid": str(session_id)}
    )
    last_role = result.scalar()

    if last_role == "user":
        # 사용자가 말했으면 삼각 토론 구조상 양쪽 에이전트 모두 응답
        return ["agent_a", "agent_b"]
    else:
        # 에이전트가 마지막으로 말했으면 사용자 차례
        return []

async def detect_surrender(content: str, client: AsyncOpenAI) -> bool:
    """
    LLM을 사용하여 사용자의 입력에서 항복/포기 의사가 있는지 감지.
    """
    if not content or len(content.strip()) < 2:
        return False

    try:
        response = await client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a surrender detection assistant. "
                        "Determine if the user's message indicates they are giving up, surrendering, "
                        "admitting defeat, or ending the debate because they cannot argue further. "
                        "Respond only with 'true' or 'false' in JSON format: {\"surrendered\": bool}"
                    )
                },
                {"role": "user", "content": content}
            ],
            temperature=0,
            response_format={"type": "json_object"}
        )
        data = json.loads(response.choices[0].message.content)
        return data.get("surrendered", False)
    except Exception as e:
        logger.error(f"Error in LLM-based surrender detection: {e}")
        # Fallback to simple keyword match if LLM fails
        content_lower = content.lower()
        return any(signal in content_lower for signal in SURRENDER_SIGNALS)

async def update_session_after_message(session_id: UUID, score_delta: int, db: AsyncSession):
    """
    turn_count를 1 올리고, Validator가 준 score_delta를 total_score에 누적 업데이트.
    """
    await db.execute(
        text("""
            UPDATE sessions
            SET turn_count = turn_count + 1,
                total_score = total_score + :delta
            WHERE id = :sid
        """),
        {"delta": score_delta, "sid": str(session_id)}
    )
    await db.commit()
