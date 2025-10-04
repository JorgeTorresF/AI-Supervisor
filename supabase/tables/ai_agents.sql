CREATE TABLE ai_agents (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL,
    capabilities TEXT[],
    personality TEXT,
    specialization TEXT,
    agent_code TEXT,
    config_schema JSONB,
    documentation TEXT,
    integration_points TEXT[],
    dependencies TEXT[],
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);