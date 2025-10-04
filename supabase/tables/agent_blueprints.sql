CREATE TABLE agent_blueprints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    components TEXT[] NOT NULL,
    estimated_lines INTEGER DEFAULT 0,
    complexity TEXT NOT NULL,
    generated_code TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);