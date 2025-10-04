CREATE TABLE generated_code (
    id SERIAL PRIMARY KEY,
    html_code TEXT,
    css_code TEXT,
    javascript_code TEXT,
    description TEXT,
    features TEXT[],
    usage_instructions TEXT,
    accessibility_notes TEXT,
    aesthetic_theme VARCHAR(100),
    component_type VARCHAR(100),
    complexity VARCHAR(50),
    prompt TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);