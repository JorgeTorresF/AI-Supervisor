-- Migration: setup_deployment_rls_policies
-- Created at: 1755610760

-- Enable Row Level Security on new tables
ALTER TABLE deployment_modes ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE deployment_sync ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_supervision ENABLE ROW LEVEL SECURITY;
ALTER TABLE deployment_downloads ENABLE ROW LEVEL SECURITY;

-- deployment_modes policies
CREATE POLICY "Users can manage their own deployment modes" ON deployment_modes
  FOR ALL USING (auth.uid() = user_id);

-- health_checks policies  
CREATE POLICY "Users can view their own health checks" ON health_checks
  FOR ALL USING (auth.uid() = user_id);

-- deployment_sync policies
CREATE POLICY "Users can manage their own sync settings" ON deployment_sync
  FOR ALL USING (auth.uid() = user_id);

-- agent_supervision policies
CREATE POLICY "Users can manage their own agent supervision" ON agent_supervision
  FOR ALL USING (auth.uid() = user_id);

-- deployment_downloads policies (global read access, admin write)
CREATE POLICY "Anyone can view active downloads" ON deployment_downloads
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage downloads" ON deployment_downloads
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Insert default deployment downloads
INSERT INTO deployment_downloads (file_type, filename, version, description, file_size, is_active) VALUES
('browser_extension', 'ai-supervisor-extension-v1.0.0.zip', '1.0.0', 'Chrome/Firefox browser extension for real-time AI supervision', 2048000, true),
('local_installer', 'ai-supervisor-local-v1.0.0.exe', '1.0.0', 'Local installation package for desktop supervision', 15360000, true),
('hybrid_gateway', 'ai-supervisor-hybrid-v1.0.0.tar.gz', '1.0.0', 'Hybrid gateway for multi-mode supervision', 5120000, true),
('documentation', 'ai-supervisor-setup-guide.pdf', '1.0.0', 'Complete setup and configuration guide', 1024000, true);;