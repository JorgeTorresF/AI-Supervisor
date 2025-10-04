// Idea Validator Edge Function
// Includes inline task coherence logic for Deno environment

const RiskLevel = {
  LOW: "low",
  MEDIUM: "medium", 
  HIGH: "high",
  CRITICAL: "critical"
};

class IdeaValidator {
  constructor() {
    this.technicalFlags = {
      impossible_tech: [
        /time travel/i, /faster than light/i, /perpetual motion/i,
        /unlimited energy/i, /consciousness upload/i, /teleportation/i
      ],
      complex_ai: [
        /artificial general intelligence/i, /agi/i, /sentient ai/i,
        /conscious ai/i, /self-aware ai/i, /ai that thinks/i
      ],
      bleeding_edge: [
        /quantum computing app/i, /brain-computer interface/i,
        /neural implant/i, /direct neural connection/i
      ],
      resource_intensive: [
        /real-time 3d rendering/i, /massive multiplayer/i,
        /blockchain from scratch/i, /custom operating system/i
      ]
    };
    
    this.businessFlags = {
      saturated_markets: [
        /another social media/i, /facebook clone/i, /twitter alternative/i,
        /instagram competitor/i, /tiktok clone/i, /messaging app/i
      ],
      legal_issues: [
        /scrape copyrighted/i, /bypass copyright/i, /piracy/i,
        /illegal streaming/i, /hack/i, /exploit/i, /crack/i
      ],
      no_market: [
        /app for pets/i, /ai for plants/i, /social network for/i,
        /dating app for/i, /uber for/i
      ]
    };
    
    this.resourcePatterns = {
      high_budget: [
        /machine learning model/i, /ai training/i, /cloud infrastructure/i,
        /real-time processing/i, /video streaming/i, /live chat/i
      ],
      team_required: [
        /enterprise software/i, /large scale application/i,
        /multi-platform app/i, /complex backend/i
      ],
      long_timeline: [
        /operating system/i, /game engine/i, /compiler/i,
        /programming language/i, /database system/i
      ]
    };
  }
  
  validateIdea(ideaText) {
    const ideaLower = ideaText.toLowerCase();
    
    const warnings = [];
    const suggestions = [];
    const technicalIssues = [];
    const businessIssues = [];
    const resourceRequirements = {};
    
    // Check technical red flags
    for (const [category, patterns] of Object.entries(this.technicalFlags)) {
      for (const pattern of patterns) {
        if (pattern.test(ideaLower)) {
          if (category === 'impossible_tech') {
            technicalIssues.push(`Involves potentially impossible technology`);
            warnings.push("This idea involves technology that doesn't exist or violates known physics");
          } else if (category === 'complex_ai') {
            technicalIssues.push(`Requires advanced AI beyond current capabilities`);
            warnings.push("Current AI technology cannot achieve true consciousness or AGI");
          } else if (category === 'bleeding_edge') {
            technicalIssues.push(`Uses cutting-edge technology`);
            warnings.push("This technology is experimental and may not be accessible");
          } else if (category === 'resource_intensive') {
            technicalIssues.push(`Highly resource-intensive`);
            resourceRequirements['compute'] = 'Very High';
          }
        }
      }
    }
    
    // Check business red flags
    for (const [category, patterns] of Object.entries(this.businessFlags)) {
      for (const pattern of patterns) {
        if (pattern.test(ideaLower)) {
          if (category === 'saturated_markets') {
            businessIssues.push(`Highly competitive market`);
            warnings.push("This market is extremely saturated with established players");
            suggestions.push("Consider finding a unique niche or novel approach");
          } else if (category === 'legal_issues') {
            businessIssues.push(`Potential legal concerns`);
            warnings.push("This idea may involve legal or ethical issues");
          } else if (category === 'no_market') {
            businessIssues.push(`Questionable market demand`);
            warnings.push("Market demand for this concept is unclear");
          }
        }
      }
    }
    
    // Check resource requirements
    for (const [category, patterns] of Object.entries(this.resourcePatterns)) {
      for (const pattern of patterns) {
        if (pattern.test(ideaLower)) {
          if (category === 'high_budget') {
            resourceRequirements['budget'] = 'High';
            resourceRequirements['infrastructure'] = 'Cloud services required';
          } else if (category === 'team_required') {
            resourceRequirements['team_size'] = 'Multiple developers';
            resourceRequirements['timeline'] = 'Extended (6+ months)';
          } else if (category === 'long_timeline') {
            resourceRequirements['timeline'] = 'Very Long (1+ years)';
            resourceRequirements['complexity'] = 'Extremely High';
          }
        }
      }
    }
    
    const feasibilityScore = this._calculateFeasibilityScore(
      technicalIssues, businessIssues, resourceRequirements
    );
    
    const riskLevel = this._determineRiskLevel(feasibilityScore, warnings);
    
    if (suggestions.length === 0 && warnings.length > 0) {
      suggestions.push(...this._generateSuggestions(ideaLower, warnings));
    }
    
    const estimatedTimeline = this._estimateTimeline(ideaLower, resourceRequirements);
    
    const successProbability = this._calculateSuccessProbability(
      feasibilityScore, warnings.length, technicalIssues.length, businessIssues.length
    );
    
    return {
      feasibility_score: feasibilityScore,
      risk_level: riskLevel,
      warnings,
      suggestions,
      technical_issues: technicalIssues,
      business_issues: businessIssues,
      resource_requirements: resourceRequirements,
      estimated_timeline: estimatedTimeline,
      success_probability: successProbability
    };
  }
  
  _calculateFeasibilityScore(technicalIssues, businessIssues, resourceRequirements) {
    let score = 10;
    score -= technicalIssues.length * 2;
    score -= businessIssues.length * 1.5;
    if (resourceRequirements['budget'] === 'High') score -= 1;
    if (resourceRequirements['team_size'] === 'Multiple developers') score -= 1;
    if (resourceRequirements['timeline']?.includes('Very Long')) score -= 2;
    return Math.max(1, Math.min(10, Math.floor(score)));
  }
  
  _determineRiskLevel(feasibilityScore, warnings) {
    if (feasibilityScore <= 3 || warnings.length >= 4) {
      return RiskLevel.CRITICAL;
    } else if (feasibilityScore <= 5 || warnings.length >= 2) {
      return RiskLevel.HIGH;
    } else if (feasibilityScore <= 7 || warnings.length >= 1) {
      return RiskLevel.MEDIUM;
    } else {
      return RiskLevel.LOW;
    }
  }
  
  _generateSuggestions(ideaLower, warnings) {
    const suggestions = [];
    if (warnings.some(w => w.toLowerCase().includes('saturated'))) {
      suggestions.push("Consider targeting a specific niche market instead");
      suggestions.push("Focus on a unique feature that competitors lack");
    }
    if (warnings.some(w => w.toLowerCase().includes('technology'))) {
      suggestions.push("Start with existing technology and iterate");
      suggestions.push("Consider a simpler MVP approach first");
    }
    if (warnings.some(w => w.toLowerCase().includes('legal'))) {
      suggestions.push("Consult with a legal expert before proceeding");
      suggestions.push("Research compliance requirements thoroughly");
    }
    if (warnings.some(w => w.toLowerCase().includes('market'))) {
      suggestions.push("Conduct thorough market research first");
      suggestions.push("Consider validating demand through surveys or MVPs");
    }
    return suggestions;
  }
  
  _estimateTimeline(ideaLower, resourceRequirements) {
    if (resourceRequirements['timeline']) {
      return resourceRequirements['timeline'];
    }
    if (/simple|basic|quick/.test(ideaLower)) {
      return "1-3 months";
    } else if (/complex|advanced|enterprise/.test(ideaLower)) {
      return "6-12 months";
    } else {
      return "3-6 months";
    }
  }
  
  _calculateSuccessProbability(feasibilityScore, warningCount, technicalIssueCount, businessIssueCount) {
    let probability = 0.5;
    probability += (feasibilityScore - 5) * 0.08;
    probability -= warningCount * 0.1;
    probability -= technicalIssueCount * 0.05;
    probability -= businessIssueCount * 0.05;
    return Math.max(0.05, Math.min(0.95, probability));
  }
}

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
    if (req.method !== 'POST') {
      throw new Error('Method not allowed');
    }

    const requestData = await req.json();
    const { project_idea } = requestData;

    if (!project_idea || typeof project_idea !== 'string') {
      throw new Error('Project idea text is required');
    }

    if (project_idea.length < 10) {
      throw new Error('Project idea must be at least 10 characters long');
    }

    if (project_idea.length > 5000) {
      throw new Error('Project idea must be less than 5000 characters');
    }

    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('No authorization header provided');
    }

    const token = authHeader.replace('Bearer ', '');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');

    if (!serviceRoleKey || !supabaseUrl) {
      throw new Error('Supabase configuration missing');
    }

    const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'apikey': serviceRoleKey
      }
    });

    if (!userResponse.ok) {
      throw new Error('Invalid or expired token');
    }

    const userData = await userResponse.json();
    const userId = userData.id;

    console.log(`Validating idea for user: ${userId}`);

    const validator = new IdeaValidator();
    const validationResult = validator.validateIdea(project_idea);
    
    console.log(`Validation completed. Risk level: ${validationResult.risk_level}, Score: ${validationResult.feasibility_score}`);

    const validationRecord = {
      user_id: userId,
      project_idea: project_idea,
      feasibility_score: validationResult.feasibility_score,
      risk_level: validationResult.risk_level,
      warnings: JSON.stringify(validationResult.warnings),
      suggestions: JSON.stringify(validationResult.suggestions),
      technical_issues: JSON.stringify(validationResult.technical_issues),
      business_issues: JSON.stringify(validationResult.business_issues),
      resource_requirements: JSON.stringify(validationResult.resource_requirements),
      estimated_timeline: validationResult.estimated_timeline,
      success_probability: validationResult.success_probability,
      validated_at: new Date().toISOString()
    };

    const insertResponse = await fetch(`${supabaseUrl}/rest/v1/idea_validations`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(validationRecord)
    });

    if (!insertResponse.ok) {
      const errorText = await insertResponse.text();
      console.error('Failed to save validation result:', errorText);
    }

    const auditLog = {
      user_id: userId,
      action_type: 'idea_validation',
      entity_type: 'idea_validation',
      details: JSON.stringify({
        idea_length: project_idea.length,
        risk_level: validationResult.risk_level,
        feasibility_score: validationResult.feasibility_score
      }),
      created_at: new Date().toISOString()
    };

    await fetch(`${supabaseUrl}/rest/v1/audit_logs`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(auditLog)
    });

    return new Response(JSON.stringify({
      data: validationResult
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Idea validation error:', error);

    const errorResponse = {
      error: {
        code: 'IDEA_VALIDATION_FAILED',
        message: error.message
      }
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});