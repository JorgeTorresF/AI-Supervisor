import { SupervisorDecision } from './websocket';

export const demoDecisions: SupervisorDecision[] = [
  {
    success: true,
    decision: 'ALLOW',
    confidence: 0.95,
    reasoning: 'Excellent performance metrics across all dimensions. Quality score of 0.9 indicates superior output quality. Low error count and optimal resource usage demonstrate efficient operation. High task progress with minimal drift suggests strong task adherence.',
    timestamp: new Date(Date.now() - 300000).toISOString(),
    action_required: false
  },
  {
    success: true,
    decision: 'WARN',
    confidence: 0.72,
    reasoning: 'Performance metrics show moderate degradation requiring attention. Quality score of 0.7 is below optimal threshold. Single error and increased resource usage indicate potential efficiency issues. Moderate drift score suggests need for course correction monitoring.',
    timestamp: new Date(Date.now() - 240000).toISOString(),
    action_required: false
  },
  {
    success: true,
    decision: 'CORRECT',
    confidence: 0.84,
    reasoning: 'Significant performance issues detected requiring immediate correction. Quality score of 0.5 falls below acceptable standards. Multiple errors and high resource usage indicate system strain. Elevated drift score suggests potential task deviation requiring intervention.',
    timestamp: new Date(Date.now() - 180000).toISOString(),
    action_required: true
  },
  {
    success: true,
    decision: 'ESCALATE',
    confidence: 0.91,
    reasoning: 'Critical system failure detected requiring immediate human intervention. Extremely low quality score of 0.3 indicates severe output degradation. High error count and near-maximum resource usage suggest system instability. Critical drift score indicates complete task deviation.',
    timestamp: new Date(Date.now() - 120000).toISOString(),
    action_required: true
  },
  {
    success: true,
    decision: 'ALLOW',
    confidence: 0.89,
    reasoning: 'Strong performance with minor optimization opportunities. System has recovered from previous issues and is operating within normal parameters.',
    timestamp: new Date(Date.now() - 60000).toISOString(),
    action_required: false
  }
];

export const generateRealtimeDecision = (): SupervisorDecision => {
  const decisions = ['ALLOW', 'WARN', 'CORRECT', 'ESCALATE'] as const;
  const decision = decisions[Math.floor(Math.random() * decisions.length)];
  
  const confidenceRanges = {
    ALLOW: [0.85, 0.98],
    WARN: [0.65, 0.85],
    CORRECT: [0.75, 0.90],
    ESCALATE: [0.80, 0.95]
  };
  
  const [min, max] = confidenceRanges[decision];
  const confidence = Math.random() * (max - min) + min;
  
  const reasonings = {
    ALLOW: [
      'Excellent performance metrics across all dimensions. Operating within optimal parameters.',
      'Strong task adherence with minimal drift. Quality metrics exceed expectations.',
      'Efficient resource utilization with high-quality output generation.',
      'System performing optimally with no intervention required.'
    ],
    WARN: [
      'Performance metrics show moderate degradation requiring attention.',
      'Quality threshold approaching warning levels. Monitoring increased.',
      'Minor efficiency issues detected. Recommend performance review.',
      'Drift patterns suggest need for course correction monitoring.'
    ],
    CORRECT: [
      'Significant performance issues detected requiring immediate correction.',
      'Quality standards below acceptable threshold. Intervention needed.',
      'Resource strain detected with elevated error rates.',
      'Task deviation requiring active correction measures.'
    ],
    ESCALATE: [
      'Critical system failure detected requiring immediate human intervention.',
      'Severe output degradation with system instability indicators.',
      'High error count with near-maximum resource usage detected.',
      'Complete task deviation with critical drift score.'
    ]
  };
  
  const reasoning = reasonings[decision][Math.floor(Math.random() * reasonings[decision].length)];
  
  return {
    success: true,
    decision,
    confidence: Math.round(confidence * 100) / 100,
    reasoning,
    timestamp: new Date().toISOString(),
    action_required: decision === 'CORRECT' || decision === 'ESCALATE'
  };
};

export const predefinedScenarios = [
  {
    name: 'High Performance',
    metrics: { quality_score: 0.9, error_count: 0, resource_usage: 0.2, task_progress: 0.8, drift_score: 0.05 },
    description: 'Optimal AI agent performance with excellent quality metrics'
  },
  {
    name: 'Warning Threshold',
    metrics: { quality_score: 0.7, error_count: 1, resource_usage: 0.6, task_progress: 0.6, drift_score: 0.15 },
    description: 'Moderate performance degradation requiring attention'
  },
  {
    name: 'Correction Required',
    metrics: { quality_score: 0.5, error_count: 3, resource_usage: 0.85, task_progress: 0.4, drift_score: 0.3 },
    description: 'Significant issues requiring immediate correction'
  },
  {
    name: 'Critical Escalation',
    metrics: { quality_score: 0.3, error_count: 8, resource_usage: 0.95, task_progress: 0.2, drift_score: 0.7 },
    description: 'Critical failure requiring human intervention'
  }
];