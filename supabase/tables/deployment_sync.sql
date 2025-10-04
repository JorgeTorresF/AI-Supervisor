CREATE TABLE deployment_sync (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    deployment_mode TEXT NOT NULL,
    sync_status TEXT NOT NULL DEFAULT 'enabled' CHECK (sync_status IN ('enabled',
    'disabled',
    'error')),
    last_sync TIMESTAMP WITH TIME ZONE,
    sync_config JSONB DEFAULT '{}',
    error_details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);