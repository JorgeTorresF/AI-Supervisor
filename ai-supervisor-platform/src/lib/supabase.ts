import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://murarhjdkvrwiplwknbi.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im11cmFyaGpka3Zyd2lwbHdrbmJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ2ODY3MDksImV4cCI6MjA1MDI2MjcwOX0.QdSWBl6kTFgfgPQ5D4bNYQDgR8I0lGQKzpJCnCuafEI'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Edge function URLs
export const EDGE_FUNCTIONS = {
  CREATIVE_STUDIO: `${supabaseUrl}/functions/v1/creative-studio`,
  AESTHETIC_FORGE: `${supabaseUrl}/functions/v1/aesthetic-forge`,
  AGENT_SLICER: `${supabaseUrl}/functions/v1/agent-slicer`,
  PROJECT_COMBINER: `${supabaseUrl}/functions/v1/project-combiner`
}

// Helper function to invoke edge functions
export async function invokeEdgeFunction(functionName: keyof typeof EDGE_FUNCTIONS, payload: any) {
  try {
    const { data, error } = await supabase.functions.invoke(functionName.toLowerCase().replace('_', '-'), {
      body: payload,
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (error) {
      throw error
    }

    return { data, error: null }
  } catch (error) {
    console.error(`Edge function ${functionName} error:`, error)
    return { data: null, error }
  }
}

// Database helper functions
export async function saveCreativeIdea(idea: any) {
  const { data, error } = await supabase
    .from('creative_ideas')
    .insert([idea])
    .select()
    .single()

  return { data, error }
}

export async function saveGeneratedCode(codeData: any) {
  const { data, error } = await supabase
    .from('generated_code')
    .insert([codeData])
    .select()
    .single()

  return { data, error }
}

export async function getUserProjects(userId?: string) {
  let query = supabase
    .from('user_projects')
    .select('*')
    .order('created_at', { ascending: false })

  if (userId) {
    query = query.eq('user_id', userId)
  }

  const { data, error } = await query
  return { data, error }
}

export async function saveUserProject(project: any) {
  const { data, error } = await supabase
    .from('user_projects')
    .insert([project])
    .select()
    .single()

  return { data, error }
}