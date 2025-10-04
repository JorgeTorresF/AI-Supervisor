CREATE TABLE agent_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID,
    agent_id UUID,
    user_id UUID REFERENCES auth.users(id),
    activity_type TEXT NOT NULL,
    content TEXT,
    metadata JSONB DEFAULT '{}',
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);