CREATE TABLE combined_projects (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    architecture TEXT,
    components TEXT[],
    integration_points TEXT[],
    features TEXT[],
    integration_plan JSONB,
    code_structure JSONB,
    data_flow JSONB,
    documentation TEXT,
    source_projects TEXT[],
    combination_strategy VARCHAR(100),
    target_framework VARCHAR(100),
    status VARCHAR(50) DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);