CREATE TABLE agent_supervision (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    target_agent TEXT NOT NULL DEFAULT 'minimax_agent',
    supervision_status TEXT NOT NULL DEFAULT 'inactive' CHECK (supervision_status IN ('active',
    'inactive',
    'configuring',
    'testing',
    'error')),
    configuration JSONB DEFAULT '{}',
    test_results JSONB DEFAULT '{}',
    connection_data JSONB DEFAULT '{}',
    last_activity TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);