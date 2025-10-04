CREATE TABLE health_checks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    deployment_id UUID,
    check_type TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('healthy',
    'warning',
    'critical',
    'unknown')),
    response_time_ms INTEGER,
    error_message TEXT,
    check_data JSONB DEFAULT '{}',
    performed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);