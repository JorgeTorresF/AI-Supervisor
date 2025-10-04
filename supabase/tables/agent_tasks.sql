CREATE TABLE agent_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID,
    user_id UUID REFERENCES auth.users(id),
    task_name TEXT NOT NULL,
    original_prompt TEXT NOT NULL,
    current_status TEXT DEFAULT 'active',
    quality_score FLOAT DEFAULT 0.0,
    coherence_score FLOAT DEFAULT 0.0,
    completion_percentage INTEGER DEFAULT 0,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);