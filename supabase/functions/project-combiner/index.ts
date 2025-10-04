Deno.serve(async (req) => {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE, PATCH',
        'Access-Control-Max-Age': '86400',
        'Access-Control-Allow-Credentials': 'false'
    };

    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 200, headers: corsHeaders });
    }

    try {
        const { action, projects, combinationStrategy, targetFramework } = await req.json();

        if (!action) {
            throw new Error('Action is required');
        }

        const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');

        if (!openaiApiKey) {
            throw new Error('OpenAI API key not configured');
        }

        if (!serviceRoleKey || !supabaseUrl) {
            throw new Error('Supabase configuration missing');
        }

        let result = {};

        switch (action) {
            case 'combine_projects':
                if (!projects || !Array.isArray(projects) || projects.length < 2) {
                    throw new Error('At least 2 projects are required for combination');
                }

                const systemPrompt = `You are an expert software architect specializing in merging and integrating different AI projects and codebases. Your task is to create a unified, cohesive system from multiple separate projects.

Combination Strategy: ${combinationStrategy || 'intelligent_merge'}
Target Framework: ${targetFramework || 'React + TypeScript'}

Projects to combine:
${projects.map((p, i) => `\n${i + 1}. ${p.name}\n   Type: ${p.type}\n   Features: ${p.features?.join(', ')}\n   Code: ${p.code ? 'Yes' : 'No'}`).join('')}

Generate a comprehensive integration plan that includes:
1. Unified architecture design
2. Component integration strategy
3. Data flow and state management
4. API integration points
5. Conflict resolution approach
6. Migration steps
7. Testing strategy
8. Performance considerations

Return ONLY a JSON object with this structure:
{
  "combinedProject": {
    "name": "Combined Project Name",
    "description": "Overview of the combined system",
    "architecture": "Detailed architecture description",
    "components": ["Component1", "Component2"],
    "integrationPoints": ["API", "Database", "UI"],
    "features": ["Feature1", "Feature2"]
  },
  "integrationPlan": {
    "steps": ["Step 1", "Step 2", "Step 3"],
    "timeline": "Estimated timeline",
    "challenges": ["Challenge1", "Challenge2"],
    "solutions": ["Solution1", "Solution2"]
  },
  "codeStructure": {
    "directories": {"/src/components": "React components", "/src/services": "API services"},
    "keyFiles": ["App.tsx", "main.ts", "config.ts"],
    "dependencies": ["react", "typescript", "axios"]
  },
  "dataFlow": {
    "stateManagement": "State management approach",
    "dataModels": ["Model1", "Model2"],
    "apiEndpoints": ["/api/endpoint1", "/api/endpoint2"]
  },
  "documentation": "# Combined Project Documentation\n\nDetailed usage and setup instructions"
}`;

                const response = await fetch('https://api.openai.com/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${openaiApiKey}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        model: 'gpt-4',
                        messages: [
                            { role: 'system', content: systemPrompt },
                            { role: 'user', content: `Combine these projects: ${JSON.stringify(projects, null, 2)}` }
                        ],
                        temperature: 0.4,
                        max_tokens: 4000
                    })
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`OpenAI API error: ${errorText}`);
                }

                const data = await response.json();
                const aiResponse = data.choices[0].message.content;

                let combinationData;
                try {
                    combinationData = JSON.parse(aiResponse);
                } catch (parseError) {
                    const jsonMatch = aiResponse.match(/\{.*\}/s);
                    if (jsonMatch) {
                        combinationData = JSON.parse(jsonMatch[0]);
                    } else {
                        throw new Error('Failed to parse AI response');
                    }
                }

                // Save combined project to database
                const combinedProjectRecord = {
                    name: combinationData.combinedProject.name,
                    description: combinationData.combinedProject.description,
                    architecture: combinationData.combinedProject.architecture,
                    components: combinationData.combinedProject.components,
                    integration_points: combinationData.combinedProject.integrationPoints,
                    features: combinationData.combinedProject.features,
                    integration_plan: combinationData.integrationPlan,
                    code_structure: combinationData.codeStructure,
                    data_flow: combinationData.dataFlow,
                    documentation: combinationData.documentation,
                    source_projects: projects.map(p => p.id || p.name),
                    combination_strategy: combinationStrategy,
                    target_framework: targetFramework,
                    status: 'draft',
                    created_at: new Date().toISOString()
                };

                const createResponse = await fetch(`${supabaseUrl}/rest/v1/combined_projects`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                        'Content-Type': 'application/json',
                        'Prefer': 'return=representation'
                    },
                    body: JSON.stringify(combinedProjectRecord)
                });

                if (!createResponse.ok) {
                    const errorText = await createResponse.text();
                    throw new Error(`Failed to save combined project: ${errorText}`);
                }

                const savedProject = await createResponse.json();
                result = { 
                    combinedProject: savedProject[0], 
                    combinationData,
                    sourceProjects: projects
                };
                break;

            case 'list_combinations':
                const listResponse = await fetch(`${supabaseUrl}/rest/v1/combined_projects?select=*&order=created_at.desc`, {
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                        'Content-Type': 'application/json'
                    }
                });

                if (!listResponse.ok) {
                    const errorText = await listResponse.text();
                    throw new Error(`Failed to fetch combined projects: ${errorText}`);
                }

                const combinations = await listResponse.json();
                result = { combinations };
                break;

            case 'get_combination':
                const { projectId } = await req.json();
                if (!projectId) {
                    throw new Error('Project ID is required');
                }

                const getResponse = await fetch(`${supabaseUrl}/rest/v1/combined_projects?id=eq.${projectId}`, {
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                        'Content-Type': 'application/json'
                    }
                });

                if (!getResponse.ok) {
                    const errorText = await getResponse.text();
                    throw new Error(`Failed to fetch project: ${errorText}`);
                }

                const project = await getResponse.json();
                result = { project: project[0] };
                break;

            default:
                throw new Error(`Unknown action: ${action}`);
        }

        return new Response(JSON.stringify({ data: result }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Project Combiner error:', error);

        const errorResponse = {
            error: {
                code: 'PROJECT_COMBINER_ERROR',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});