CREATE TABLE user_achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    achievement_id TEXT NOT NULL,
    achievement_title TEXT NOT NULL,
    achievement_description TEXT,
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id,
    achievement_id)
);