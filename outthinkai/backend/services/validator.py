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
        fallacy_type: str,
        user_message: str,
        last_3_turns: str,
    ) -> ValidatorResult:
        """
        사용자의 반박을 평가하고 score_delta(0~40)를 반환합니다.
        """
        try:
            response = await self.client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {
                        "role": "system",
                        "content": VALIDATOR_SYSTEM_PROMPT.format(
                            fallacy_type=fallacy_type,
                            last_3_turns=last_3_turns,
                        ),
                    },
                    {
                        "role": "user",
                        "content": VALIDATOR_USER_PROMPT.format(
                            user_message=user_message,
                        ),
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
