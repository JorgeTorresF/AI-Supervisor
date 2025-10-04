-- Migration: setup_row_level_security
-- Created at: 1755603954

-- Enable Row Level Security on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE interventions ENABLE ROW LEVEL SECURITY;
ALTER TABLE idea_validations ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuration_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Agents policies  
CREATE POLICY "Users can manage their own agents" ON agents
  FOR ALL USING (auth.uid() = user_id);

-- Agent tasks policies
CREATE POLICY "Users can manage their own agent tasks" ON agent_tasks
  FOR ALL USING (auth.uid() = user_id);

-- Agent activities policies
CREATE POLICY "Users can view their own agent activities" ON agent_activities
  FOR ALL USING (auth.uid() = user_id);

-- Interventions policies
CREATE POLICY "Users can manage their own interventions" ON interventions
  FOR ALL USING (auth.uid() = user_id);

-- Idea validations policies
CREATE POLICY "Users can manage their own idea validations" ON idea_validations
  FOR ALL USING (auth.uid() = user_id);

-- Configuration settings policies
CREATE POLICY "Users can manage their own settings" ON configuration_settings
  FOR ALL USING (auth.uid() = user_id);

-- Audit logs policies (read-only for users)
CREATE POLICY "Users can view their own audit logs" ON audit_logs
  FOR SELECT USING (auth.uid() = user_id);

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger the function every time a user is created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();;