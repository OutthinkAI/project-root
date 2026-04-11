import json
import logging
import os
from openai import AsyncOpenAI
from ..prompts.validator_prompt import VALIDATOR_SYSTEM_PROMPT, VALIDATOR_USER_PROMPT
from ..schemas.pydantic_schemas import ValidatorResult

logger = logging.getLogger(__name__)

class Validator:
    def __init__(self):
        self.client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))

    async def evaluate_response(
        self, 
        session_context: dict, 
        agent_persona: dict, 
        opponent_message: str, 
        agent_message: str
    ) -> ValidatorResult:
        """
        LLM을 호출하여 에이전트의 응답을 평가하고 점수를 반환합니다.
        """
        try:
            response = await self.client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {
                        "role": "system", 
                        "content": VALIDATOR_SYSTEM_PROMPT.format(
                            topic=session_context["topic"],
                            scenario=session_context["scenario"],
                            persona=agent_persona["persona"],
                            fallacy_type=agent_persona["fallacy_type"]
                        )
                    },
                    {
                        "role": "user", 
                        "content": VALIDATOR_USER_PROMPT.format(
                            opponent_message=opponent_message,
                            agent_message=agent_message
                        )
                    },
                ],
                temperature=0.3,
                response_format={"type": "json_object"},
            )
            
            raw_result = response.choices[0].message.content
            data = json.loads(raw_result)
            
            return ValidatorResult(**data)
        except Exception as e:
            logger.exception("Validator evaluation failed")
            # 에러 발생 시 기본값 반환
            return ValidatorResult(
                is_valid_rebuttal=True,
                fallacy_addressed=False,
                score_delta=0,
                feedback=f"Validation error: {str(e)}",
                keywords_detected=[]
            )
