CREATE TABLE idea_validations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    project_idea TEXT NOT NULL,
    feasibility_score INTEGER NOT NULL,
    risk_level TEXT NOT NULL,
    warnings JSONB DEFAULT '[]',
    suggestions JSONB DEFAULT '[]',
    technical_issues JSONB DEFAULT '[]',
    business_issues JSONB DEFAULT '[]',
    resource_requirements JSONB DEFAULT '{}',
    estimated_timeline TEXT,
    success_probability FLOAT,
    validated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);