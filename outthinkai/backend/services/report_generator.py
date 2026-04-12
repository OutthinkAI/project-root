import json
import logging
import os
from uuid import UUID

from openai import AsyncOpenAI
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

from ..prompts.report_prompt import REPORT_SYSTEM_PROMPT, REPORT_USER_PROMPT
from ..schemas.pydantic_schemas import FallacyCaught, ReportResponse

logger = logging.getLogger(__name__)

client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def debate_turn_from_message_turn(turn_number: int) -> int:
    return max(1, ((turn_number - 1) // 3) + 1)

def normalize_fallacy_turns(fallacies: list[dict]) -> list[dict]:
    normalized = []
    for fallacy in fallacies:
        item = dict(fallacy)
        try:
            item["turn"] = debate_turn_from_message_turn(int(item.get("turn", 1)))
        except (TypeError, ValueError):
            item["turn"] = 1
        normalized.append(item)
    return normalized


async def generate_report(session_id: UUID, db: AsyncSession) -> ReportResponse:
    res_session = await db.execute(
        text("SELECT total_score FROM sessions WHERE id = :sid"),
        {"sid": str(session_id)},
    )
    session_row = res_session.mappings().one()
    authoritative_total_score = min(100, session_row["total_score"])

    # 전체 대화 로그 조회
    res_msgs = await db.execute(
        text("""
            SELECT role, content, turn_number, score_delta
            FROM messages
            WHERE session_id = :sid
            ORDER BY turn_number ASC, created_at ASC
        """),
        {"sid": str(session_id)},
    )
    rows = res_msgs.mappings().all()

    full_dialogue = "\n".join(
        [
            f"[Debate Turn {debate_turn_from_message_turn(r['turn_number'])} | Message {r['turn_number']}] "
            f"{r['role']}: {r['content']}"
            for r in rows
        ]
    )
    score_history = "\n".join(
        [
            f"Debate Turn {debate_turn_from_message_turn(r['turn_number'])} "
            f"(message {r['turn_number']}, {r['role']}): score_delta={r['score_delta']}"
            for r in rows
        ]
    )

    # GPT-4o 리포트 생성
    response = await client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": REPORT_SYSTEM_PROMPT},
            {"role": "user", "content": REPORT_USER_PROMPT.format(
                full_dialogue=full_dialogue,
                score_history=score_history,
                total_score=authoritative_total_score,
            )},
        ],
        temperature=0.3,
        response_format={"type": "json_object"},
    )

    data = json.loads(response.choices[0].message.content)
    fallacies_caught = normalize_fallacy_turns(data.get("fallacies_caught", []))

    # reports 테이블 저장
    report_res = await db.execute(
        text("""
            INSERT INTO reports (session_id, total_score, fallacies_caught, strengths, improvements, summary)
            VALUES (:sid, :total_score, cast(:fallacies_caught as jsonb), cast(:strengths as jsonb), cast(:improvements as jsonb), :summary)
            RETURNING id, created_at
        """),
        {
            "sid": str(session_id),
            "total_score": authoritative_total_score,
            "fallacies_caught": json.dumps(fallacies_caught, ensure_ascii=False),
            "strengths": json.dumps(data.get("strengths", []), ensure_ascii=False),
            "improvements": json.dumps(data.get("improvements", []), ensure_ascii=False),
            "summary": data["summary"],
        },
    )
    await db.commit()
    report_row = report_res.mappings().one()

    return ReportResponse(
        report_id=report_row["id"],
        session_id=session_id,
        total_score=authoritative_total_score,
        fallacies_caught=[FallacyCaught(**f) for f in fallacies_caught],
        strengths=data.get("strengths", []),
        improvements=data.get("improvements", []),
        summary=data["summary"],
        created_at=report_row["created_at"],
    )
