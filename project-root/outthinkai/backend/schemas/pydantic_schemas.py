from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel


# =============================================================================
# Enums
# =============================================================================

class Difficulty(str, Enum):
    beginner     = "beginner"
    intermediate = "intermediate"
    advanced     = "advanced"


class Role(str, Enum):
    user    = "user"
    agent_a = "agent_a"
    agent_b = "agent_b"


class SessionStatus(str, Enum):
    active    = "active"
    completed = "completed"


class FallacyType(str, Enum):
    hasty_generalization = "hasty_generalization"
    appeal_to_authority  = "appeal_to_authority"
    false_cause          = "false_cause"
    sampling_bias        = "sampling_bias"
    false_dichotomy      = "false_dichotomy"
    circular_reasoning   = "circular_reasoning"


class Quality(str, Enum):
    excellent = "excellent"
    good      = "good"
    partial   = "partial"


# =============================================================================
# Agent
# =============================================================================

class AgentPersona(BaseModel):
    name:          str
    persona:       str
    fallacy_type:  FallacyType
    initial_claim: str
    surrendered:   bool = False


# =============================================================================
# Scenario
# =============================================================================

class ScenarioGenerateRequest(BaseModel):
    topic:      str
    difficulty: Difficulty = Difficulty.intermediate


class ScenarioGenerateResponse(BaseModel):
    session_id: UUID
    scenario:   str
    agent_a:    AgentPersona
    agent_b:    AgentPersona
    difficulty: Difficulty
    created_at: datetime


# =============================================================================
# Session
# =============================================================================

class SessionStateResponse(BaseModel):
    session_id:  UUID
    topic:       str
    scenario:    str
    agent_a:     AgentPersona
    agent_b:     AgentPersona
    status:      SessionStatus
    total_score: int
    turn_count:  int
    created_at:  datetime


class SurrenderRequest(BaseModel):
    agent: Role


class SurrenderResponse(BaseModel):
    session_id:      UUID
    agent:           Role
    both_surrendered: bool


# =============================================================================
# Chat
# =============================================================================

class ChatMessageRequest(BaseModel):
    session_id: UUID
    content:    str


class ChatMessageResponse(BaseModel):
    message_id:           UUID
    turn_number:          int
    target_agents:        List[Role]
    validation_triggered: bool


class MessageLog(BaseModel):
    id:          UUID
    role:        Role
    content:     str
    turn_number: int
    score_delta: int
    feedback:    Optional[str] = None
    created_at:  datetime


class ChatHistoryResponse(BaseModel):
    session_id:  UUID
    messages:    List[MessageLog]
    total_score: int


# =============================================================================
# Validator
# =============================================================================

class ValidatorResult(BaseModel):
    is_valid_rebuttal:  bool
    fallacy_addressed:  bool
    score_delta:        int
    feedback:           str
    keywords_detected:  List[str]


# =============================================================================
# Report
# =============================================================================

class ReportGenerateRequest(BaseModel):
    session_id: UUID


class FallacyCaught(BaseModel):
    fallacy_type: FallacyType
    turn:         int
    quality:      Quality


class ReportResponse(BaseModel):
    report_id:        UUID
    session_id:       UUID
    total_score:      int
    fallacies_caught: List[FallacyCaught]
    strengths:        List[str]
    improvements:     List[str]
    summary:          str
    created_at:       datetime


# =============================================================================
# 공통 에러
# =============================================================================

class APIError(BaseModel):
    code:    str
    message: str
    detail:  Optional[str] = None


class ErrorResponse(BaseModel):
    error: APIError