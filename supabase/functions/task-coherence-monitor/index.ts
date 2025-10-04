import { DerailmentDetector, InterventionType } from '../_shared/task-coherence.ts';

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
      agent_response, 
      current_task, 
      conversation_history = [],
      agent_id,
      agent_name
    } = requestData;

    // Validate required fields
    if (!task_id || !agent_response || !current_task) {
      throw new Error('task_id, agent_response, and current_task are required');
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

    console.log(`Monitoring task ${task_id} for user: ${userId}`);

    // Initialize derailment detector
    const detector = new DerailmentDetector();
    
    // Detect potential derailment
    const derailmentResult = detector.detectDerailment(
      current_task, 
      agent_response, 
      conversation_history
    );
    
    console.log(`Derailment analysis complete. Type: ${derailmentResult.derailment_type}, Confidence: ${derailmentResult.confidence}`);

    // Calculate quality scores
    const qualityScore = derailmentResult.confidence < 0.5 ? 0.8 : 0.5;
    const coherenceScore = 1 - derailmentResult.confidence;
    
    // Update task status
    const taskUpdate = {
      quality_score: qualityScore,
      coherence_score: coherenceScore,
      current_status: derailmentResult.confidence > 0.7 ? 'needs_intervention' : 'active',
      updated_at: new Date().toISOString()
    };

    const taskUpdateResponse = await fetch(`${supabaseUrl}/rest/v1/agent_tasks?id=eq.${task_id}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(taskUpdate)
    });

    if (!taskUpdateResponse.ok) {
      console.error('Failed to update task:', await taskUpdateResponse.text());
    }

    // Log activity
    const activityLog = {
      task_id: task_id,
      agent_id: agent_id || null,
      user_id: userId,
      activity_type: 'coherence_check',
      content: agent_response.substring(0, 500), // Truncate for storage
      metadata: JSON.stringify({
        derailment_type: derailmentResult.derailment_type,
        confidence: derailmentResult.confidence,
        explanation: derailmentResult.explanation,
        quality_score: qualityScore,
        coherence_score: coherenceScore
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

    // Generate intervention recommendation if needed
    let interventionRecommendation = null;
    
    if (derailmentResult.confidence > 0.7) {
      let interventionType = InterventionType.WARNING;
      let actionMessage = "Agent response appears to be on track";
      
      if (derailmentResult.confidence > 0.9) {
        interventionType = InterventionType.BLOCK;
        actionMessage = "Immediate intervention required - agent has significantly derailed";
      } else if (derailmentResult.confidence > 0.8) {
        interventionType = InterventionType.REDIRECT;
        actionMessage = "Redirect agent back to original task focus";
      } else {
        interventionType = InterventionType.WARNING;
        actionMessage = "Warning - potential derailment detected";
      }
      
      interventionRecommendation = {
        type: interventionType,
        confidence: derailmentResult.confidence,
        message: actionMessage,
        reasoning: derailmentResult.explanation,
        suggested_prompt: this._generateRefocusPrompt(current_task, derailmentResult.derailment_type)
      };
    }

    // Audit log
    const auditLog = {
      user_id: userId,
      action_type: 'task_monitoring',
      entity_type: 'agent_task',
      entity_id: task_id,
      details: JSON.stringify({
        agent_name: agent_name || 'unknown',
        derailment_confidence: derailmentResult.confidence,
        quality_score: qualityScore,
        intervention_recommended: !!interventionRecommendation
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

    // Return monitoring result
    return new Response(JSON.stringify({
      data: {
        task_id: task_id,
        quality_score: qualityScore,
        coherence_score: coherenceScore,
        derailment_result: derailmentResult,
        intervention_recommendation: interventionRecommendation,
        timestamp: new Date().toISOString()
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Task coherence monitoring error:', error);

    const errorResponse = {
      error: {
        code: 'TASK_MONITORING_FAILED',
        message: error.message
      }
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
  
  // Helper function to generate refocus prompts
  function _generateRefocusPrompt(currentTask, derailmentType) {
    const basePrompt = `Please refocus on the original task: "${currentTask}"`;
    
    switch (derailmentType) {
      case 'task_drift':
        return `${basePrompt}. You seem to have drifted away from the main objective. Please return to addressing the specific requirements outlined in the task.`;
      case 'scope_creep':
        return `${basePrompt}. Please limit your response to only what is asked for in the original task without expanding into additional topics.`;
      case 'repetition_loop':
        return `${basePrompt}. Avoid repeating previous responses and focus on making progress toward completing the task.`;
      case 'context_loss':
        return `${basePrompt}. Please review the conversation context and ensure your response directly addresses the current task requirements.`;
      default:
        return `${basePrompt}. Please ensure your response directly addresses all aspects of the task as originally specified.`;
    }
  }
});