// Analytics Generator Edge Function
// Standalone implementation for Deno environment

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
    if (req.method !== 'GET' && req.method !== 'POST') {
      throw new Error('Method not allowed');
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

    const url = new URL(req.url);
    const timeRange = url.searchParams.get('time_range') || '7d';
    const includeArchived = url.searchParams.get('include_archived') === 'true';
    
    console.log(`Generating analytics for user: ${userId}, time range: ${timeRange}`);

    const endDate = new Date();
    const startDate = new Date();
    
    switch (timeRange) {
      case '1d':
        startDate.setDate(endDate.getDate() - 1);
        break;
      case '7d':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(endDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(endDate.getDate() - 90);
        break;
      default:
        startDate.setDate(endDate.getDate() - 7);
    }

    const dateFilter = `created_at.gte.${startDate.toISOString()}&created_at.lte.${endDate.toISOString()}`;

    const analyticsPromises = [
      fetchTaskMetrics(supabaseUrl, serviceRoleKey, userId, dateFilter),
      fetchInterventionMetrics(supabaseUrl, serviceRoleKey, userId, dateFilter),
      fetchActivityMetrics(supabaseUrl, serviceRoleKey, userId, dateFilter),
      fetchIdeaValidationMetrics(supabaseUrl, serviceRoleKey, userId, dateFilter),
      fetchAgentMetrics(supabaseUrl, serviceRoleKey, userId, includeArchived)
    ];

    const [
      taskMetrics,
      interventionMetrics,
      activityMetrics,
      ideaValidationMetrics,
      agentMetrics
    ] = await Promise.all(analyticsPromises);

    const dashboardSummary = {
      overview: {
        total_agents: agentMetrics.total,
        active_agents: agentMetrics.active,
        total_tasks: taskMetrics.total,
        active_tasks: taskMetrics.active,
        total_interventions: interventionMetrics.total,
        total_activities: activityMetrics.total,
        total_idea_validations: ideaValidationMetrics.total
      },
      health_scores: {
        avg_task_quality: Math.round(taskMetrics.avg_quality_score * 100) / 100,
        avg_task_coherence: Math.round(taskMetrics.avg_coherence_score * 100) / 100,
        intervention_success_rate: interventionMetrics.total > 0 ? 
          Math.round((interventionMetrics.successful / interventionMetrics.total) * 100) / 100 : 1,
        avg_idea_feasibility: Math.round(ideaValidationMetrics.avg_feasibility_score * 100) / 100
      },
      status_breakdown: {
        tasks: {
          active: taskMetrics.active,
          completed: taskMetrics.completed,
          blocked: taskMetrics.blocked,
          needs_intervention: taskMetrics.needs_intervention
        },
        interventions: interventionMetrics.by_type,
        activities: activityMetrics.by_type,
        idea_risks: ideaValidationMetrics.by_risk_level
      },
      recent_activity: activityMetrics.recent_activities
    };

    const trendData = {
      daily_tasks: [],
      daily_interventions: [],
      quality_trend: [],
      coherence_trend: []
    };

    const auditLog = {
      user_id: userId,
      action_type: 'analytics_access',
      entity_type: 'dashboard',
      details: JSON.stringify({
        time_range: timeRange,
        include_archived: includeArchived,
        metrics_generated: Object.keys(dashboardSummary)
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
      data: {
        summary: dashboardSummary,
        trends: trendData,
        time_range: {
          start: startDate.toISOString(),
          end: endDate.toISOString(),
          range: timeRange
        },
        generated_at: new Date().toISOString()
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Analytics generation error:', error);

    const errorResponse = {
      error: {
        code: 'ANALYTICS_GENERATION_FAILED',
        message: error.message
      }
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function fetchTaskMetrics(supabaseUrl, serviceRoleKey, userId, dateFilter) {
  const response = await fetch(`${supabaseUrl}/rest/v1/agent_tasks?user_id=eq.${userId}&${dateFilter}`, {
    headers: {
      'Authorization': `Bearer ${serviceRoleKey}`,
      'apikey': serviceRoleKey
    }
  });
  
  if (!response.ok) return { total: 0, active: 0, completed: 0, blocked: 0, avg_quality_score: 0, avg_coherence_score: 0 };
  
  const tasks = await response.json();
  
  return {
    total: tasks.length,
    active: tasks.filter(t => t.current_status === 'active').length,
    completed: tasks.filter(t => t.current_status === 'completed').length,
    blocked: tasks.filter(t => t.current_status === 'blocked').length,
    needs_intervention: tasks.filter(t => t.current_status === 'needs_intervention').length,
    avg_quality_score: tasks.length > 0 ? 
      tasks.reduce((sum, t) => sum + (t.quality_score || 0), 0) / tasks.length : 0,
    avg_coherence_score: tasks.length > 0 ? 
      tasks.reduce((sum, t) => sum + (t.coherence_score || 0), 0) / tasks.length : 0
  };
}

async function fetchInterventionMetrics(supabaseUrl, serviceRoleKey, userId, dateFilter) {
  const response = await fetch(`${supabaseUrl}/rest/v1/interventions?user_id=eq.${userId}&${dateFilter}`, {
    headers: {
      'Authorization': `Bearer ${serviceRoleKey}`,
      'apikey': serviceRoleKey
    }
  });
  
  if (!response.ok) return { total: 0, successful: 0, by_type: {} };
  
  const interventions = await response.json();
  
  const byType = interventions.reduce((acc, i) => {
    acc[i.intervention_type] = (acc[i.intervention_type] || 0) + 1;
    return acc;
  }, {});
  
  return {
    total: interventions.length,
    successful: interventions.filter(i => i.was_successful).length,
    failed: interventions.filter(i => !i.was_successful).length,
    by_type: byType,
    avg_confidence: interventions.length > 0 ?
      interventions.reduce((sum, i) => sum + (i.confidence_score || 0), 0) / interventions.length : 0
  };
}

async function fetchActivityMetrics(supabaseUrl, serviceRoleKey, userId, dateFilter) {
  const response = await fetch(`${supabaseUrl}/rest/v1/agent_activities?user_id=eq.${userId}&${dateFilter}`, {
    headers: {
      'Authorization': `Bearer ${serviceRoleKey}`,
      'apikey': serviceRoleKey
    }
  });
  
  if (!response.ok) return { total: 0, by_type: {}, recent_activities: [] };
  
  const activities = await response.json();
  
  const byType = activities.reduce((acc, a) => {
    acc[a.activity_type] = (acc[a.activity_type] || 0) + 1;
    return acc;
  }, {});
  
  return {
    total: activities.length,
    by_type: byType,
    recent_activities: activities.slice(0, 10).map(a => ({
      type: a.activity_type,
      timestamp: a.timestamp,
      content: a.content ? a.content.substring(0, 100) + '...' : ''
    }))
  };
}

async function fetchIdeaValidationMetrics(supabaseUrl, serviceRoleKey, userId, dateFilter) {
  const response = await fetch(`${supabaseUrl}/rest/v1/idea_validations?user_id=eq.${userId}&${dateFilter}`, {
    headers: {
      'Authorization': `Bearer ${serviceRoleKey}`,
      'apikey': serviceRoleKey
    }
  });
  
  if (!response.ok) return { total: 0, by_risk_level: {}, avg_feasibility_score: 0 };
  
  const validations = await response.json();
  
  const byRiskLevel = validations.reduce((acc, v) => {
    acc[v.risk_level] = (acc[v.risk_level] || 0) + 1;
    return acc;
  }, {});
  
  return {
    total: validations.length,
    by_risk_level: byRiskLevel,
    avg_feasibility_score: validations.length > 0 ?
      validations.reduce((sum, v) => sum + (v.feasibility_score || 0), 0) / validations.length : 0,
    avg_success_probability: validations.length > 0 ?
      validations.reduce((sum, v) => sum + (v.success_probability || 0), 0) / validations.length : 0
  };
}

async function fetchAgentMetrics(supabaseUrl, serviceRoleKey, userId, includeArchived) {
  let url = `${supabaseUrl}/rest/v1/agents?user_id=eq.${userId}`;
  if (!includeArchived) {
    url += '&status=eq.active';
  }
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${serviceRoleKey}`,
      'apikey': serviceRoleKey
    }
  });
  
  if (!response.ok) return { total: 0, active: 0 };
  
  const agents = await response.json();
  
  const byFramework = agents.reduce((acc, a) => {
    const framework = a.framework || 'unknown';
    acc[framework] = (acc[framework] || 0) + 1;
    return acc;
  }, {});
  
  return {
    total: agents.length,
    active: agents.filter(a => a.status === 'active').length,
    inactive: agents.filter(a => a.status !== 'active').length,
    by_framework: byFramework
  };
}