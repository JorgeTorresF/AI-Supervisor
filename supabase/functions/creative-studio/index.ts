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
        const { prompt, ideaType, targetAudience, constraints } = await req.json();

        if (!prompt) {
            throw new Error('Prompt is required');
        }

        const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
        if (!openaiApiKey) {
            throw new Error('OpenAI API key not configured');
        }

        // Create comprehensive prompt for idea generation
        const systemPrompt = `You are a creative AI assistant specializing in generating innovative ideas for AI supervisor agents and automation systems. Generate exactly 6 diverse, actionable ideas based on the user's prompt.

For each idea, provide:
1. A catchy, memorable title (max 50 characters)
2. A brief description (2-3 sentences)
3. Key features (3-4 bullet points)
4. Implementation complexity (Beginner/Intermediate/Advanced)
5. Potential impact (Low/Medium/High)
6. Estimated development time

Focus on: ${ideaType || 'general AI automation'}
Target audience: ${targetAudience || 'general users'}
Constraints: ${constraints || 'none specified'}

Return only a JSON array with 6 ideas in this exact format:
[
  {
    "title": "Idea Title",
    "description": "Brief description of the idea and its purpose.",
    "features": ["Feature 1", "Feature 2", "Feature 3"],
    "complexity": "Beginner",
    "impact": "High",
    "developmentTime": "2-3 weeks",
    "category": "Automation"
  }
]`;

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
                    { role: 'user', content: prompt }
                ],
                temperature: 0.8,
                max_tokens: 2000
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`OpenAI API error: ${errorText}`);
        }

        const data = await response.json();
        const aiResponse = data.choices[0].message.content;

        // Parse the JSON response
        let ideas;
        try {
            ideas = JSON.parse(aiResponse);
        } catch (parseError) {
            // Fallback: try to extract JSON from response
            const jsonMatch = aiResponse.match(/\[.*\]/s);
            if (jsonMatch) {
                ideas = JSON.parse(jsonMatch[0]);
            } else {
                throw new Error('Failed to parse AI response as JSON');
            }
        }

        // Validate and ensure we have exactly 6 ideas
        if (!Array.isArray(ideas) || ideas.length === 0) {
            throw new Error('No valid ideas generated');
        }

        // Ensure we have exactly 6 ideas
        ideas = ideas.slice(0, 6);
        while (ideas.length < 6) {
            ideas.push({
                title: `Generated Idea ${ideas.length + 1}`,
                description: "A creative AI supervision concept focusing on automation and user experience enhancement.",
                features: ["Smart automation", "User-friendly interface", "Scalable architecture"],
                complexity: "Intermediate",
                impact: "Medium",
                developmentTime: "3-4 weeks",
                category: "Automation"
            });
        }

        return new Response(JSON.stringify({
            data: {
                ideas,
                metadata: {
                    prompt,
                    ideaType,
                    targetAudience,
                    constraints,
                    generatedAt: new Date().toISOString(),
                    ideaCount: ideas.length
                }
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Creative Studio error:', error);

        const errorResponse = {
            error: {
                code: 'CREATIVE_STUDIO_ERROR',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});