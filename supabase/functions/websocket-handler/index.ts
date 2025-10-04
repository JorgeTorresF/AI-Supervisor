// WebSocket Handler Edge Function
// Standalone implementation for real-time communication

Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, upgrade, connection',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE, PATCH',
    'Access-Control-Max-Age': '86400',
    'Access-Control-Allow-Credentials': 'false'
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    if (req.headers.get('upgrade') === 'websocket') {
      const { socket, response } = Deno.upgradeWebSocket(req);
      
      const url = new URL(req.url);
      const userId = url.searchParams.get('user_id');
      const sessionId = url.searchParams.get('session_id') || crypto.randomUUID();
      
      console.log(`WebSocket connection established for user: ${userId}, session: ${sessionId}`);
      
      socket.onopen = () => {
        console.log(`WebSocket opened for user: ${userId}`);
        
        socket.send(JSON.stringify({
          type: 'connection_established',
          data: {
            session_id: sessionId,
            user_id: userId,
            timestamp: new Date().toISOString(),
            server_info: {
              version: '1.0.0',
              capabilities: ['real_time_monitoring', 'intervention_alerts', 'task_updates']
            }
          }
        }));
      };
      
      socket.onmessage = async (event) => {
        try {
          const message = JSON.parse(event.data);
          console.log(`Received message from user ${userId}:`, message.type);
          
          await handleWebSocketMessage(socket, message, userId, sessionId);
          
        } catch (error) {
          console.error('Error processing WebSocket message:', error);
          socket.send(JSON.stringify({
            type: 'error',
            data: {
              code: 'MESSAGE_PROCESSING_ERROR',
              message: error.message,
              timestamp: new Date().toISOString()
            }
          }));
        }
      };
      
      socket.onclose = (event) => {
        console.log(`WebSocket closed for user ${userId}, code: ${event.code}`);
      };
      
      socket.onerror = (error) => {
        console.error(`WebSocket error for user ${userId}:`, error);
      };
      
      return response;
    }
    
    if (req.method === 'GET') {
      return new Response(JSON.stringify({
        data: {
          service: 'websocket-handler',
          status: 'active',
          version: '1.0.0',
          capabilities: [
            'real_time_monitoring',
            'intervention_alerts', 
            'task_updates',
            'browser_extension_communication'
          ]
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    if (req.method === 'POST') {
      const requestData = await req.json();
      const { user_id, message_type, data } = requestData;
      
      if (!user_id || !message_type) {
        throw new Error('user_id and message_type are required');
      }
      
      return new Response(JSON.stringify({
        data: {
          message: 'Message queued for delivery',
          user_id: user_id,
          message_type: message_type,
          timestamp: new Date().toISOString()
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    throw new Error('Method not allowed');
    
  } catch (error) {
    console.error('WebSocket handler error:', error);

    const errorResponse = {
      error: {
        code: 'WEBSOCKET_HANDLER_ERROR',
        message: error.message
      }
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function handleWebSocketMessage(socket, message, userId, sessionId) {
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  
  switch (message.type) {
    case 'ping':
      socket.send(JSON.stringify({
        type: 'pong',
        data: {
          timestamp: new Date().toISOString(),
          session_id: sessionId
        }
      }));
      break;
      
    case 'agent_activity_report':
      const { agent_name, activity_type, content, url } = message.data;
      
      const activityLog = {
        user_id: userId,
        activity_type: activity_type || 'browser_activity',
        content: content || '',
        metadata: JSON.stringify({
          agent_name: agent_name,
          url: url,
          session_id: sessionId,
          reported_at: new Date().toISOString()
        }),
        timestamp: new Date().toISOString()
      };
      
      if (serviceRoleKey && supabaseUrl) {
        await fetch(`${supabaseUrl}/rest/v1/agent_activities`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(activityLog)
        });
      }
      
      socket.send(JSON.stringify({
        type: 'activity_logged',
        data: {
          status: 'success',
          timestamp: new Date().toISOString()
        }
      }));
      break;
      
    case 'request_intervention':
      const { task_id, intervention_type, reason } = message.data;
      
      socket.send(JSON.stringify({
        type: 'intervention_queued',
        data: {
          task_id: task_id,
          intervention_type: intervention_type,
          reason: reason,
          status: 'processing',
          timestamp: new Date().toISOString()
        }
      }));
      break;
      
    case 'subscribe_to_updates':
      const { subscription_types } = message.data;
      
      socket.send(JSON.stringify({
        type: 'subscription_confirmed',
        data: {
          session_id: sessionId,
          subscription_types: subscription_types || ['all'],
          timestamp: new Date().toISOString()
        }
      }));
      break;
      
    case 'browser_extension_status':
      const { extension_version, active_agents, current_site } = message.data;
      
      if (serviceRoleKey && supabaseUrl) {
        const auditLog = {
          user_id: userId,
          action_type: 'browser_extension_status',
          entity_type: 'browser_extension',
          details: JSON.stringify({
            extension_version: extension_version,
            active_agents: active_agents,
            current_site: current_site,
            session_id: sessionId
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
      }
      
      socket.send(JSON.stringify({
        type: 'status_acknowledged',
        data: {
          timestamp: new Date().toISOString()
        }
      }));
      break;
      
    default:
      socket.send(JSON.stringify({
        type: 'unsupported_message_type',
        data: {
          received_type: message.type,
          timestamp: new Date().toISOString()
        }
      }));
  }
}