CREATE TABLE system_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    metric_type TEXT NOT NULL,
    metric_value NUMERIC NOT NULL,
    metric_unit TEXT,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);