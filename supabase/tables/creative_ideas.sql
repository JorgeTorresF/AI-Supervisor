CREATE TABLE creative_ideas (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    features TEXT[],
    complexity VARCHAR(50),
    impact VARCHAR(50),
    development_time VARCHAR(100),
    category VARCHAR(100),
    prompt TEXT,
    idea_type VARCHAR(100),
    target_audience VARCHAR(255),
    constraints TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);