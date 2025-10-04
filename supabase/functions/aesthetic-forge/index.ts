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
        const { prompt, aestheticTheme, componentType, complexity } = await req.json();

        if (!prompt || !aestheticTheme) {
            throw new Error('Prompt and aesthetic theme are required');
        }

        const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
        if (!openaiApiKey) {
            throw new Error('OpenAI API key not configured');
        }

        // Define aesthetic theme characteristics
        const themeSpecs = {
            cyberpunk: {
                colors: ['#00ffff', '#ff00ff', '#39ff14', '#0080ff', '#ff073a'],
                patterns: ['neon borders', 'glitch effects', 'grid overlays', 'holographic textures'],
                fonts: ['Orbitron', 'Courier New', 'JetBrains Mono'],
                effects: ['glow', 'scan lines', 'flicker animations', 'matrix rain']
            },
            glitchcore: {
                colors: ['#00ff41', '#ff0040', '#00ffff', '#ffff00', '#ff00ff'],
                patterns: ['static noise', 'distortion', 'clip masks', 'scan lines'],
                fonts: ['Courier New', 'monospace', 'pixel fonts'],
                effects: ['clip-path animations', 'filter glitches', 'transform distortions']
            },
            minimal: {
                colors: ['#007acc', '#333333', '#666666', '#ffffff', '#f5f5f5'],
                patterns: ['clean lines', 'simple borders', 'subtle shadows', 'geometric shapes'],
                fonts: ['Inter', 'Roboto', 'system fonts'],
                effects: ['smooth transitions', 'subtle hover states', 'clean focus indicators']
            },
            slushwave: {
                colors: ['#ff006e', '#8338ec', '#3a86ff', '#06ffa5', '#ffbe0b'],
                patterns: ['gradient flows', 'wave animations', 'fluid shapes', 'dreamy textures'],
                fonts: ['Poppins', 'Nunito', 'rounded fonts'],
                effects: ['flowing animations', 'color transitions', 'soft glows']
            },
            vaporwave: {
                colors: ['#ff006e', '#8338ec', '#3a86ff', '#ff6b9f', '#39ff14'],
                patterns: ['retro grids', '80s aesthetics', 'neon outlines', 'perspective grids'],
                fonts: ['Orbitron', 'retro fonts', 'neon styled fonts'],
                effects: ['perspective transforms', 'neon glows', 'retro animations']
            },
            brutalist: {
                colors: ['#000000', '#ffffff', '#ff0000', '#0000ff', '#ffff00'],
                patterns: ['bold blocks', 'harsh contrasts', 'geometric shapes', 'raw textures'],
                fonts: ['Arial Black', 'Impact', 'bold sans-serif'],
                effects: ['hard shadows', 'sharp transitions', 'bold transformations']
            }
        };

        const selectedTheme = themeSpecs[aestheticTheme] || themeSpecs.minimal;

        const systemPrompt = `You are an expert frontend developer specializing in aesthetic UI/UX design with deep knowledge of modern CSS, HTML, and JavaScript. Generate clean, modern, and visually striking code based on the user's request.

Aesthetic Theme: ${aestheticTheme.toUpperCase()}
Theme Colors: ${selectedTheme.colors.join(', ')}
Theme Patterns: ${selectedTheme.patterns.join(', ')}
Theme Effects: ${selectedTheme.effects.join(', ')}
Recommended Fonts: ${selectedTheme.fonts.join(', ')}

Component Type: ${componentType || 'general component'}
Complexity Level: ${complexity || 'intermediate'}

Requirements:
1. Generate complete, working code (HTML, CSS, and JavaScript if needed)
2. Use modern CSS features (flexbox, grid, custom properties, animations)
3. Ensure responsive design principles
4. Include hover states and interactive effects
5. Follow accessibility best practices
6. Use the specified aesthetic theme consistently
7. Add smooth animations and transitions
8. Include proper semantic HTML structure

Return ONLY a JSON object in this exact format:
{
  "html": "<div class=\"component\">HTML content here</div>",
  "css": ".component { /* CSS styles here */ }",
  "javascript": "// JavaScript code here (if needed)",
  "description": "Brief description of the component and its features",
  "features": ["Feature 1", "Feature 2", "Feature 3"],
  "usage": "Instructions on how to use this component",
  "accessibility": "Accessibility features included"
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
                    { role: 'user', content: prompt }
                ],
                temperature: 0.7,
                max_tokens: 3000
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`OpenAI API error: ${errorText}`);
        }

        const data = await response.json();
        const aiResponse = data.choices[0].message.content;

        // Parse the JSON response
        let codeResult;
        try {
            codeResult = JSON.parse(aiResponse);
        } catch (parseError) {
            // Fallback: try to extract JSON from response
            const jsonMatch = aiResponse.match(/\{.*\}/s);
            if (jsonMatch) {
                codeResult = JSON.parse(jsonMatch[0]);
            } else {
                throw new Error('Failed to parse AI response as JSON');
            }
        }

        // Validate required fields
        if (!codeResult.html || !codeResult.css) {
            throw new Error('Invalid code generation - missing HTML or CSS');
        }

        // Add theme metadata
        codeResult.theme = {
            name: aestheticTheme,
            colors: selectedTheme.colors,
            patterns: selectedTheme.patterns,
            effects: selectedTheme.effects
        };

        return new Response(JSON.stringify({
            data: {
                code: codeResult,
                metadata: {
                    prompt,
                    aestheticTheme,
                    componentType,
                    complexity,
                    generatedAt: new Date().toISOString()
                }
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Aesthetic Forge error:', error);

        const errorResponse = {
            error: {
                code: 'AESTHETIC_FORGE_ERROR',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});