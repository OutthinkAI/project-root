import json
import os

from openai import AsyncOpenAI
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

from prompts.scenario_prompt import SCENARIO_SYSTEM_PROMPT, SCENARIO_USER_PROMPT
from schemas.pydantic_schemas import (
    AgentPersona,
    Difficulty,
    ScenarioGenerateRequest,
    ScenarioGenerateResponse,
)

client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))


async def generate_scenario(
    request: ScenarioGenerateRequest,
    db: AsyncSession,
) -> ScenarioGenerateResponse:
    raw = await _call_llm(request.topic, request.difficulty)
    parsed = _parse_llm_response(raw)
    session_row = await _save_session(db, request, parsed)

    return ScenarioGenerateResponse(
        session_id=session_row["id"],
        scenario=parsed["scenario"],
        agent_a=AgentPersona(**parsed["agent_a"], surrendered=False),
        agent_b=AgentPersona(**parsed["agent_b"], surrendered=False),
        difficulty=request.difficulty,
        created_at=session_row["created_at"],
    )


async def _call_llm(topic: str, difficulty: Difficulty) -> str:
    response = await client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": SCENARIO_SYSTEM_PROMPT},
            {
                "role": "user",
                "content": SCENARIO_USER_PROMPT.format(
                    topic=topic, difficulty=difficulty.value
                ),
            },
        ],
        temperature=0.8,
        response_format={"type": "json_object"},
    )
    return response.choices[0].message.content


def _parse_llm_response(raw: str) -> dict:
    data = json.loads(raw)

    required_keys = {"scenario", "agent_a", "agent_b"}
    if not required_keys.issubset(data.keys()):
        raise ValueError(f"LLM response missing keys: {required_keys - data.keys()}")

    for agent_key in ("agent_a", "agent_b"):
        agent = data[agent_key]
        for field in ("name", "persona", "fallacy_type", "initial_claim"):
            if field not in agent:
                raise ValueError(f"{agent_key} missing field: {field}")

    return data


async def _save_session(
    db: AsyncSession,
    request: ScenarioGenerateRequest,
    parsed: dict,
) -> dict:
    agent_a = {**parsed["agent_a"], "surrendered": False}
    agent_b = {**parsed["agent_b"], "surrendered": False}

    result = await db.execute(
        text("""
            INSERT INTO sessions (topic, scenario, agent_a, agent_b, difficulty)
            VALUES (:topic, :scenario, cast(:agent_a as jsonb), cast(:agent_b as jsonb), cast(:difficulty as difficulty_type))
            RETURNING id, created_at
        """),
        {
            "topic": request.topic,
            "scenario": parsed["scenario"],
            "agent_a": json.dumps(agent_a, ensure_ascii=False),
            "agent_b": json.dumps(agent_b, ensure_ascii=False),
            "difficulty": request.difficulty.value,
        },
    )
    await db.commit()
    row = result.mappings().one()
    return row