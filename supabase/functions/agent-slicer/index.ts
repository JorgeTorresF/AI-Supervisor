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
        const { action, agentConfig, agentId } = await req.json();

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
            case 'create_agent':
                if (!agentConfig) {
                    throw new Error('Agent configuration is required');
                }

                // Generate agent code using OpenAI
                const systemPrompt = `You are an expert in creating modular AI agent systems. Generate a complete, production-ready AI agent based on the configuration provided.

Agent Configuration:
Name: ${agentConfig.name}
Type: ${agentConfig.type}
Capabilities: ${agentConfig.capabilities?.join(', ')}
Personality: ${agentConfig.personality}
Specialization: ${agentConfig.specialization}

Generate:
1. Complete agent class with proper methods
2. Configuration interface
3. Event handling system
4. Integration points
5. Error handling
6. Documentation

Return ONLY a JSON object with this structure:
{
  "agentCode": "// Complete agent implementation",
  "configSchema": {
    "name": "string",
    "capabilities": "array",
    "settings": "object"
  },
  "documentation": "## Agent Documentation\n\nUsage instructions and examples",
  "integrationPoints": ["api_endpoint", "webhook", "event_system"],
  "dependencies": ["dependency1", "dependency2"]
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
                            { role: 'user', content: `Create an AI agent with the following specifications: ${JSON.stringify(agentConfig)}` }
                        ],
                        temperature: 0.3,
                        max_tokens: 4000
                    })
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`OpenAI API error: ${errorText}`);
                }

                const data = await response.json();
                const aiResponse = data.choices[0].message.content;

                let agentData;
                try {
                    agentData = JSON.parse(aiResponse);
                } catch (parseError) {
                    const jsonMatch = aiResponse.match(/\{.*\}/s);
                    if (jsonMatch) {
                        agentData = JSON.parse(jsonMatch[0]);
                    } else {
                        throw new Error('Failed to parse AI response');
                    }
                }

                // Save agent to database
                const agentRecord = {
                    name: agentConfig.name,
                    type: agentConfig.type,
                    capabilities: agentConfig.capabilities,
                    personality: agentConfig.personality,
                    specialization: agentConfig.specialization,
                    agent_code: agentData.agentCode,
                    config_schema: agentData.configSchema,
                    documentation: agentData.documentation,
                    integration_points: agentData.integrationPoints,
                    dependencies: agentData.dependencies,
                    status: 'active',
                    created_at: new Date().toISOString()
                };

                const createResponse = await fetch(`${supabaseUrl}/rest/v1/ai_agents`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                        'Content-Type': 'application/json',
                        'Prefer': 'return=representation'
                    },
                    body: JSON.stringify(agentRecord)
                });

                if (!createResponse.ok) {
                    const errorText = await createResponse.text();
                    throw new Error(`Failed to save agent: ${errorText}`);
                }

                const savedAgent = await createResponse.json();
                result = { agent: savedAgent[0], generatedCode: agentData };
                break;

            case 'list_agents':
                const listResponse = await fetch(`${supabaseUrl}/rest/v1/ai_agents?select=*&order=created_at.desc`, {
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                        'Content-Type': 'application/json'
                    }
                });

                if (!listResponse.ok) {
                    const errorText = await listResponse.text();
                    throw new Error(`Failed to fetch agents: ${errorText}`);
                }

                const agents = await listResponse.json();
                result = { agents };
                break;

            case 'delete_agent':
                if (!agentId) {
                    throw new Error('Agent ID is required for deletion');
                }

                const deleteResponse = await fetch(`${supabaseUrl}/rest/v1/ai_agents?id=eq.${agentId}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                        'Content-Type': 'application/json'
                    }
                });

                if (!deleteResponse.ok) {
                    const errorText = await deleteResponse.text();
                    throw new Error(`Failed to delete agent: ${errorText}`);
                }

                result = { success: true, deletedAgentId: agentId };
                break;

            case 'update_agent':
                if (!agentId || !agentConfig) {
                    throw new Error('Agent ID and configuration are required for update');
                }

                const updateData = {
                    ...agentConfig,
                    updated_at: new Date().toISOString()
                };

                const updateResponse = await fetch(`${supabaseUrl}/rest/v1/ai_agents?id=eq.${agentId}`, {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                        'Content-Type': 'application/json',
                        'Prefer': 'return=representation'
                    },
                    body: JSON.stringify(updateData)
                });

                if (!updateResponse.ok) {
                    const errorText = await updateResponse.text();
                    throw new Error(`Failed to update agent: ${errorText}`);
                }

                const updatedAgent = await updateResponse.json();
                result = { agent: updatedAgent[0] };
                break;

            default:
                throw new Error(`Unknown action: ${action}`);
        }

        return new Response(JSON.stringify({ data: result }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Agent Slicer error:', error);

        const errorResponse = {
            error: {
                code: 'AGENT_SLICER_ERROR',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});