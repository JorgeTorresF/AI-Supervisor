import { InterventionType } from '../_shared/task-coherence.ts';

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
    // Validate method
    if (req.method !== 'POST') {
      throw new Error('Method not allowed');
    }

    // Extract request data
    const requestData = await req.json();
    const { 
      task_id,
      agent_id,
      intervention_type,
      trigger_reason,
      confidence_score,
      suggested_action,
      user_override = false
    } = requestData;

    // Validate required fields
    if (!task_id || !intervention_type || !trigger_reason) {
      throw new Error('task_id, intervention_type, and trigger_reason are required');
    }

    // Validate intervention type
    const validTypes = Object.values(InterventionType);
    if (!validTypes.includes(intervention_type)) {
      throw new Error(`Invalid intervention type. Must be one of: ${validTypes.join(', ')}`);
    }

    // Get user from auth header
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

    // Verify user token
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

    console.log(`Processing intervention for task ${task_id}, user: ${userId}, type: ${intervention_type}`);

    // Get user preferences for intervention behavior
    const preferencesResponse = await fetch(`${supabaseUrl}/rest/v1/configuration_settings?user_id=eq.${userId}&setting_key=eq.intervention_preferences`, {
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey,
        'Content-Type': 'application/json'
      }
    });

    let userPreferences = {
      aggressiveness: 'medium',
      auto_intervention: true,
      block_threshold: 0.9,
      warning_threshold: 0.7
    };

    if (preferencesResponse.ok) {
      const preferencesData = await preferencesResponse.json();
      if (preferencesData && preferencesData.length > 0) {
        userPreferences = { ...userPreferences, ...preferencesData[0].setting_value };
      }
    }

    // Process intervention based on type and user preferences
    let actionTaken = '';
    let wasSuccessful = true;
    let interventionResult = null;
    
    switch (intervention_type) {
      case InterventionType.WARNING:
        actionTaken = 'warning_issued';
        interventionResult = {
          type: 'warning',
          message: `⚠️ ATTENTION: ${trigger_reason}`,
          action: 'continue_monitoring',
          severity: 'low'
        };
        break;
        
      case InterventionType.REDIRECT:
        actionTaken = 'redirect_attempted';
        interventionResult = {
          type: 'redirect',
          message: `🎯 REDIRECT REQUIRED: ${trigger_reason}`,
          suggested_prompt: suggested_action || 'Please return to the original task focus',
          action: 'refocus_agent',
          severity: 'medium'
        };
        break;
        
      case InterventionType.BLOCK:
        if (confidence_score > userPreferences.block_threshold || user_override) {
          actionTaken = 'task_blocked';
          interventionResult = {
            type: 'block',
            message: `🚫 TASK BLOCKED: ${trigger_reason}`,
            action: 'pause_agent',
            severity: 'high',
            requires_human_review: true
          };
          
          // Update task status to blocked
          await fetch(`${supabaseUrl}/rest/v1/agent_tasks?id=eq.${task_id}`, {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${serviceRoleKey}`,
              'apikey': serviceRoleKey,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              current_status: 'blocked',
              updated_at: new Date().toISOString()
            })
          });
        } else {
          actionTaken = 'block_threshold_not_met';
          wasSuccessful = false;
          interventionResult = {
            type: 'warning',
            message: `⚠️ Block threshold not met (${confidence_score} < ${userPreferences.block_threshold})`,
            action: 'continue_monitoring',
            severity: 'low'
          };
        }
        break;
        
      case InterventionType.SUGGEST:
        actionTaken = 'suggestion_provided';
        interventionResult = {
          type: 'suggestion',
          message: `💡 SUGGESTION: ${trigger_reason}`,
          suggestions: suggested_action ? [suggested_action] : ['Consider alternative approaches'],
          action: 'provide_guidance',
          severity: 'info'
        };
        break;
        
      case InterventionType.REWRITE:
        actionTaken = 'rewrite_attempted';
        interventionResult = {
          type: 'rewrite',
          message: `✏️ REWRITE RECOMMENDED: ${trigger_reason}`,
          rewritten_prompt: suggested_action || 'Please rephrase your approach to better align with the task',
          action: 'modify_prompt',
          severity: 'medium'
        };
        break;
        
      default:
        throw new Error(`Unsupported intervention type: ${intervention_type}`);
    }

    // Save intervention record
    const interventionRecord = {
      task_id: task_id,
      agent_id: agent_id || null,
      user_id: userId,
      intervention_type: intervention_type,
      trigger_reason: trigger_reason,
      action_taken: actionTaken,
      confidence_score: confidence_score || 0,
      was_successful: wasSuccessful,
      created_at: new Date().toISOString(),
      resolved_at: wasSuccessful ? new Date().toISOString() : null
    };

    const insertResponse = await fetch(`${supabaseUrl}/rest/v1/interventions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(interventionRecord)
    });

    let interventionId = null;
    if (insertResponse.ok) {
      const insertData = await insertResponse.json();
      interventionId = insertData[0]?.id;
      console.log(`Intervention recorded with ID: ${interventionId}`);
    } else {
      console.error('Failed to save intervention record:', await insertResponse.text());
    }

    // Log activity
    const activityLog = {
      task_id: task_id,
      agent_id: agent_id || null,
      user_id: userId,
      activity_type: 'intervention',
      content: `Intervention executed: ${intervention_type}`,
      metadata: JSON.stringify({
        intervention_id: interventionId,
        action_taken: actionTaken,
        was_successful: wasSuccessful,
        trigger_reason: trigger_reason,
        confidence_score: confidence_score
      }),
      timestamp: new Date().toISOString()
    };

    await fetch(`${supabaseUrl}/rest/v1/agent_activities`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(activityLog)
    });

    // Audit log
    const auditLog = {
      user_id: userId,
      action_type: 'intervention_executed',
      entity_type: 'intervention',
      entity_id: interventionId,
      details: JSON.stringify({
        task_id: task_id,
        intervention_type: intervention_type,
        action_taken: actionTaken,
        was_successful: wasSuccessful,
        severity: interventionResult?.severity
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

    // Return intervention result
    return new Response(JSON.stringify({
      data: {
        intervention_id: interventionId,
        task_id: task_id,
        intervention_type: intervention_type,
        action_taken: actionTaken,
        was_successful: wasSuccessful,
        result: interventionResult,
        timestamp: new Date().toISOString()
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Intervention orchestration error:', error);

    const errorResponse = {
      error: {
        code: 'INTERVENTION_FAILED',
        message: error.message
      }
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});