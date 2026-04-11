import json
import logging
import os
from uuid import UUID

from openai import AsyncOpenAI
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

from prompts.report_prompt import REPORT_SYSTEM_PROMPT, REPORT_USER_PROMPT
from schemas.pydantic_schemas import FallacyCaught, ReportResponse

logger = logging.getLogger(__name__)

client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))


async def generate_report(session_id: UUID, db: AsyncSession) -> ReportResponse:
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
        [f"[Turn {r['turn_number']}] {r['role']}: {r['content']}" for r in rows]
    )
    score_history = "\n".join(
        [f"Turn {r['turn_number']} ({r['role']}): score_delta={r['score_delta']}" for r in rows]
    )

    # GPT-4o 리포트 생성
    response = await client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": REPORT_SYSTEM_PROMPT},
            {"role": "user", "content": REPORT_USER_PROMPT.format(
                full_dialogue=full_dialogue,
                score_history=score_history,
            )},
        ],
        temperature=0.3,
        response_format={"type": "json_object"},
    )

    data = json.loads(response.choices[0].message.content)

    # reports 테이블 저장
    report_res = await db.execute(
        text("""
            INSERT INTO reports (session_id, total_score, fallacies_caught, strengths, improvements, summary)
            VALUES (:sid, :total_score, cast(:fallacies_caught as jsonb), cast(:strengths as jsonb), cast(:improvements as jsonb), :summary)
            RETURNING id, created_at
        """),
        {
            "sid": str(session_id),
            "total_score": data["total_score"],
            "fallacies_caught": json.dumps(data.get("fallacies_caught", []), ensure_ascii=False),
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
        total_score=data["total_score"],
        fallacies_caught=[FallacyCaught(**f) for f in data.get("fallacies_caught", [])],
        strengths=data.get("strengths", []),
        improvements=data.get("improvements", []),
        summary=data["summary"],
        created_at=report_row["created_at"],
    )
