// Task Coherence Modules for Edge Functions
// Simplified versions for Deno environment

// Enums and Types
export const RiskLevel = {
  LOW: "low",
  MEDIUM: "medium", 
  HIGH: "high",
  CRITICAL: "critical"
};

export const DerailmentType = {
  TASK_DRIFT: "task_drift",
  CONTEXT_LOSS: "context_loss", 
  INSTRUCTION_IGNORE: "instruction_ignore",
  SCOPE_CREEP: "scope_creep",
  REPETITION_LOOP: "repetition_loop"
};

export const InterventionType = {
  WARNING: "warning",
  REDIRECT: "redirect",
  BLOCK: "block",
  SUGGEST: "suggest",
  REWRITE: "rewrite"
};

// Idea Validator for Deno environment
export class IdeaValidator {
  constructor() {
    // Technical red flags
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
    
    // Business red flags
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
    
    // Resource requirements patterns
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
    
    // Initialize results
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
    
    // Calculate feasibility score
    const feasibilityScore = this._calculateFeasibilityScore(
      technicalIssues, businessIssues, resourceRequirements
    );
    
    // Determine risk level
    const riskLevel = this._determineRiskLevel(feasibilityScore, warnings);
    
    // Generate suggestions if none exist
    if (suggestions.length === 0 && warnings.length > 0) {
      suggestions.push(...this._generateSuggestions(ideaLower, warnings));
    }
    
    // Estimate timeline
    const estimatedTimeline = this._estimateTimeline(ideaLower, resourceRequirements);
    
    // Calculate success probability
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
    
    // Deduct for technical issues
    score -= technicalIssues.length * 2;
    
    // Deduct for business issues
    score -= businessIssues.length * 1.5;
    
    // Deduct for high resource requirements
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
    let probability = 0.5; // Base 50%
    
    // Adjust based on feasibility score
    probability += (feasibilityScore - 5) * 0.08; // ±40% based on score
    
    // Reduce for issues
    probability -= warningCount * 0.1;
    probability -= technicalIssueCount * 0.05;
    probability -= businessIssueCount * 0.05;
    
    return Math.max(0.05, Math.min(0.95, probability));
  }
}

// Derailment Detector for Deno environment
export class DerailmentDetector {
  constructor() {
    this.derailmentThreshold = 0.7;
  }
  
  detectDerailment(currentTask, agentResponse, conversationHistory = []) {
    const taskKeywords = this._extractKeywords(currentTask);
    const responseKeywords = this._extractKeywords(agentResponse);
    
    // Calculate keyword overlap
    const keywordOverlap = this._calculateOverlap(taskKeywords, responseKeywords);
    
    // Check for common derailment patterns
    let derailmentType = null;
    let confidence = 0;
    
    if (keywordOverlap < 0.3) {
      derailmentType = DerailmentType.TASK_DRIFT;
      confidence = 1 - keywordOverlap;
    } else if (this._detectRepetition(agentResponse, conversationHistory)) {
      derailmentType = DerailmentType.REPETITION_LOOP;
      confidence = 0.8;
    } else if (this._detectScopeCreep(currentTask, agentResponse)) {
      derailmentType = DerailmentType.SCOPE_CREEP;
      confidence = 0.7;
    }
    
    return {
      derailment_type: derailmentType,
      confidence: confidence || 0.2,
      explanation: this._generateExplanation(derailmentType, confidence)
    };
  }
  
  _extractKeywords(text) {
    return text.toLowerCase()
      .replace(/[^a-z\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3)
      .slice(0, 20); // Limit for performance
  }
  
  _calculateOverlap(keywords1, keywords2) {
    const set1 = new Set(keywords1);
    const set2 = new Set(keywords2);
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    
    return union.size > 0 ? intersection.size / union.size : 0;
  }
  
  _detectRepetition(response, history) {
    if (history.length === 0) return false;
    
    const recent = history.slice(-3).join(' ').toLowerCase();
    const responseLower = response.toLowerCase();
    
    // Simple repetition detection
    return recent.includes(responseLower.slice(0, 50)) && responseLower.length > 50;
  }
  
  _detectScopeCreep(task, response) {
    const taskWords = this._extractKeywords(task);
    const responseWords = this._extractKeywords(response);
    
    // Detect if response introduces many new concepts not in task
    const newConcepts = responseWords.filter(word => !taskWords.includes(word));
    return newConcepts.length > taskWords.length * 1.5;
  }
  
  _generateExplanation(derailmentType, confidence) {
    if (!derailmentType) return "Response appears to be on track";
    
    const explanations = {
      [DerailmentType.TASK_DRIFT]: "Agent response has drifted away from the original task focus",
      [DerailmentType.CONTEXT_LOSS]: "Agent seems to have lost track of the conversation context", 
      [DerailmentType.INSTRUCTION_IGNORE]: "Agent is not following the given instructions properly",
      [DerailmentType.SCOPE_CREEP]: "Agent is expanding beyond the defined task scope",
      [DerailmentType.REPETITION_LOOP]: "Agent appears to be repeating previous responses"
    };
    
    return explanations[derailmentType] || "Potential issue detected";
  }
}