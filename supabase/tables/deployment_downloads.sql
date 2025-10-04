CREATE TABLE deployment_downloads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    file_type TEXT NOT NULL CHECK (file_type IN ('browser_extension',
    'local_installer',
    'hybrid_gateway',
    'documentation')),
    filename TEXT NOT NULL,
    version TEXT DEFAULT '1.0.0',
    download_url TEXT,
    file_size BIGINT,
    checksum TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);