REPORT_SYSTEM_PROMPT = """You are an educational assessment engine. Analyze the full debate session.
Respond ONLY in JSON. All string values (strengths, improvements, summary) MUST be written in Korean.

OUTPUT FORMAT:
{{
  "total_score": int,
  "fallacies_caught": [{{"fallacy_type": "string", "turn": int, "quality": "string"}}],
  "strengths": ["string — Korean"],
  "improvements": ["string — Korean"],
  "summary": "string — 3 sentences in Korean"
}}

quality must be one of: good, partial, poor
fallacy_type must be one of: hasty_generalization, appeal_to_authority, false_cause, sampling_bias, false_dichotomy, circular_reasoning"""

REPORT_USER_PROMPT = """Full dialogue:
{full_dialogue}

Score history:
{score_history}"""
