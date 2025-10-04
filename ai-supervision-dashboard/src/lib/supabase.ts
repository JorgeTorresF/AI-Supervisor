import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://murarhjdkvrwiplwknbi.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im11cmFyaGpka3Zyd2lwbHdrbmJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1OTU1MjAsImV4cCI6MjA3MTE3MTUyMH0.x4ur6eaD8wPzFt7F2DyQtUNN6pP3RZA34gsG2XB6FoI'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Edge function URLs
export const EDGE_FUNCTIONS = {
  ideaValidator: `${supabaseUrl}/functions/v1/idea-validator`,
  taskCoherenceMonitor: `${supabaseUrl}/functions/v1/task-coherence-monitor`,
  interventionOrchestrator: `${supabaseUrl}/functions/v1/intervention-orchestrator`,
  websocketHandler: `${supabaseUrl}/functions/v1/websocket-handler`,
  analyticsGenerator: `${supabaseUrl}/functions/v1/analytics-generator`,
  deploymentManager: `${supabaseUrl}/functions/v1/deployment-manager`,
  minimaxIntegration: `${supabaseUrl}/functions/v1/minimax-integration`
}

// Database types
export interface Profile {
  id: string
  full_name: string | null
  avatar_url: string | null
  subscription_tier: string
  preferences: Record<string, any>
  created_at: string
  updated_at: string
}

export interface Agent {
  id: string
  user_id: string
  agent_name: string
  agent_type: string
  framework: string | null
  description: string | null
  status: string
  configuration: Record<string, any>
  created_at: string
  updated_at: string
}

export interface AgentTask {
  id: string
  agent_id: string | null
  user_id: string
  task_name: string
  original_prompt: string
  current_status: string
  quality_score: number
  coherence_score: number
  completion_percentage: number
  started_at: string
  updated_at: string
  completed_at: string | null
}

export interface AgentActivity {
  id: string
  task_id: string | null
  agent_id: string | null
  user_id: string
  activity_type: string
  content: string | null
  metadata: Record<string, any>
  timestamp: string
}

export interface Intervention {
  id: string
  task_id: string | null
  agent_id: string | null
  user_id: string
  intervention_type: string
  trigger_reason: string | null
  action_taken: string | null
  confidence_score: number | null
  was_successful: boolean
  created_at: string
  resolved_at: string | null
}

export interface IdeaValidation {
  id: string
  user_id: string
  project_idea: string
  feasibility_score: number
  risk_level: string
  warnings: string[]
  suggestions: string[]
  technical_issues: string[]
  business_issues: string[]
  resource_requirements: Record<string, any>
  estimated_timeline: string | null
  success_probability: number | null
  validated_at: string
}

export interface ConfigurationSetting {
  id: string
  user_id: string
  setting_key: string
  setting_value: Record<string, any>
  category: string
  description: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface AuditLog {
  id: string
  user_id: string | null
  action_type: string
  entity_type: string | null
  entity_id: string | null
  details: Record<string, any>
  ip_address: string | null
  user_agent: string | null
  created_at: string
}

export interface DeploymentMode {
  id: string
  user_id: string
  deployment_mode: string
  status: string
  configuration: Record<string, any>
  health_data: Record<string, any>
  last_health_check: string | null
  deployment_url: string | null
  version: string
  created_at: string
  updated_at: string
}

export interface HealthCheck {
  id: string
  user_id: string
  deployment_id: string | null
  check_type: string
  status: string
  response_time_ms: number | null
  error_message: string | null
  check_data: Record<string, any>
  performed_at: string
}

export interface DeploymentSync {
  id: string
  user_id: string
  deployment_mode: string
  sync_status: string
  last_sync: string | null
  sync_config: Record<string, any>
  error_details: string | null
  created_at: string
  updated_at: string
}

export interface AgentSupervision {
  id: string
  user_id: string
  target_agent: string
  supervision_status: string
  configuration: Record<string, any>
  test_results: Record<string, any>
  connection_data: Record<string, any>
  last_activity: string | null
  created_at: string
  updated_at: string
}

export interface DeploymentDownload {
  id: string
  user_id: string | null
  file_type: string
  filename: string
  version: string
  download_url: string | null
  file_size: number | null
  checksum: string | null
  description: string | null
  created_at: string
  is_active: boolean
}