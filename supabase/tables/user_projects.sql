CREATE TABLE user_projects (
    id SERIAL PRIMARY KEY,
    user_id UUID,
    project_name VARCHAR(255) NOT NULL,
    project_type VARCHAR(100),
    project_data JSONB,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);