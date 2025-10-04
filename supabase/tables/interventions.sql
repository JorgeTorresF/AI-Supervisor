CREATE TABLE interventions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID,
    agent_id UUID,
    user_id UUID REFERENCES auth.users(id),
    intervention_type TEXT NOT NULL,
    trigger_reason TEXT,
    action_taken TEXT,
    confidence_score FLOAT,
    was_successful BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE
);