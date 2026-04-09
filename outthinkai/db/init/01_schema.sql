-- =============================================
-- OutThinkAI DB Schema
-- =============================================

-- ENUM 타입 생성
CREATE TYPE difficulty_type AS ENUM ('beginner', 'intermediate', 'advanced');
CREATE TYPE session_status  AS ENUM ('active', 'completed');
CREATE TYPE role_type       AS ENUM ('user', 'agent_a', 'agent_b');
CREATE TYPE fallacy_type    AS ENUM (
    'hasty_generalization',
    'appeal_to_authority',
    'false_cause',
    'sampling_bias',
    'false_dichotomy',
    'circular_reasoning'
);
CREATE TYPE quality_type AS ENUM ('excellent', 'good', 'partial');

-- =============================================
-- sessions
-- =============================================
CREATE TABLE sessions (
    id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    topic       VARCHAR(200) NOT NULL,
    scenario    TEXT         NOT NULL,
    agent_a     JSONB        NOT NULL,   -- AgentPersona JSON
    agent_b     JSONB        NOT NULL,   -- AgentPersona JSON
    difficulty  difficulty_type NOT NULL DEFAULT 'intermediate',
    status      session_status  NOT NULL DEFAULT 'active',
    turn_count  INTEGER      NOT NULL DEFAULT 0,
    total_score INTEGER      NOT NULL DEFAULT 0,
    created_at  TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- =============================================
-- messages
-- =============================================
CREATE TABLE messages (
    id          UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id  UUID      NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    role        role_type NOT NULL,
    content     TEXT      NOT NULL,
    turn_number INTEGER   NOT NULL,
    score_delta INTEGER   NOT NULL DEFAULT 0,
    feedback    TEXT,                   -- Validator 피드백 (role=user일 때만)
    created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_messages_session_id ON messages(session_id);
CREATE INDEX idx_messages_turn       ON messages(session_id, turn_number);

-- =============================================
-- reports
-- =============================================
CREATE TABLE reports (
    id               UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id       UUID    NOT NULL UNIQUE REFERENCES sessions(id) ON DELETE CASCADE,
    total_score      INTEGER NOT NULL,
    fallacies_caught JSONB   NOT NULL DEFAULT '[]',
    strengths        JSONB   NOT NULL DEFAULT '[]',
    improvements     JSONB   NOT NULL DEFAULT '[]',
    summary          TEXT    NOT NULL,
    created_at       TIMESTAMP NOT NULL DEFAULT NOW()
);