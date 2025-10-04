import { createClient } from '@supabase/supabase-js'

// Supabase configuration
const supabaseUrl = 'https://murarhjdkvrwiplwknbi.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im11cmFyaGpka3Zyd2lwbHdrbmJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1OTU1MjAsImV4cCI6MjA3MTE3MTUyMH0.x4ur6eaD8wPzFt7F2DyQtUNN6pP3RZA34gsG2XB6FoI'

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Edge function endpoints
export const EDGE_FUNCTIONS = {
  ANALYTICS_GENERATOR: 'analytics-generator',
  DEPLOYMENT_MANAGER: 'deployment-manager',
  IDEA_VALIDATOR: 'idea-validator',
  INTERVENTION_ORCHESTRATOR: 'intervention-orchestrator',
  MINIMAX_INTEGRATION: 'minimax-integration',
  TASK_COHERENCE_MONITOR: 'task-coherence-monitor',
  WEBSOCKET_HANDLER: 'websocket-handler',
  CREATE_ADMIN_USER: 'create-admin-user'
} as const

// Helper function to invoke edge functions
export async function invokeEdgeFunction(functionName: string, body: any = {}) {
  try {
    const { data, error } = await supabase.functions.invoke(functionName, {
      body,
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (error) {
      console.error(`Error invoking ${functionName}:`, error)
      throw error
    }

    return data
  } catch (error) {
    console.error(`Failed to invoke ${functionName}:`, error)
    throw error
  }
}

export default supabase
