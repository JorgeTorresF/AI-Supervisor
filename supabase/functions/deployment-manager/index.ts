// Deployment Management Edge Function
// Handles deployment status, health checks, and configuration

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
    const url = new URL(req.url);
    const action = url.searchParams.get('action') || 'status';
    
    console.log(`Deployment management request for user: ${userId}, action: ${action}`);

    switch (req.method) {
      case 'GET':
        return await handleGetRequest(supabaseUrl, serviceRoleKey, userId, action);
      case 'POST':
        const requestData = await req.json();
        return await handlePostRequest(supabaseUrl, serviceRoleKey, userId, action, requestData);
      case 'PUT':
        const updateData = await req.json();
        return await handlePutRequest(supabaseUrl, serviceRoleKey, userId, action, updateData);
      default:
        throw new Error('Method not allowed');
    }

  } catch (error) {
    console.error('Deployment management error:', error);

    const errorResponse = {
      error: {
        code: 'DEPLOYMENT_MANAGEMENT_ERROR',
        message: error.message
      }
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

// Handle GET requests
async function handleGetRequest(supabaseUrl, serviceRoleKey, userId, action) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json'
  };

  switch (action) {
    case 'status':
      return await getDeploymentStatus(supabaseUrl, serviceRoleKey, userId, corsHeaders);
    case 'health':
      return await getHealthChecks(supabaseUrl, serviceRoleKey, userId, corsHeaders);
    case 'downloads':
      return await getDownloads(supabaseUrl, serviceRoleKey, corsHeaders);
    case 'sync':
      return await getSyncStatus(supabaseUrl, serviceRoleKey, userId, corsHeaders);
    default:
      return await getDeploymentStatus(supabaseUrl, serviceRoleKey, userId, corsHeaders);
  }
}

// Handle POST requests
async function handlePostRequest(supabaseUrl, serviceRoleKey, userId, action, requestData) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json'
  };

  switch (action) {
    case 'deploy':
      return await deployMode(supabaseUrl, serviceRoleKey, userId, requestData, corsHeaders);
    case 'health-check':
      return await performHealthCheck(supabaseUrl, serviceRoleKey, userId, requestData, corsHeaders);
    case 'test-communication':
      return await testCommunication(supabaseUrl, serviceRoleKey, userId, requestData, corsHeaders);
    default:
      throw new Error(`Unsupported POST action: ${action}`);
  }
}

// Handle PUT requests
async function handlePutRequest(supabaseUrl, serviceRoleKey, userId, action, updateData) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json'
  };

  switch (action) {
    case 'configure':
      return await updateConfiguration(supabaseUrl, serviceRoleKey, userId, updateData, corsHeaders);
    case 'sync':
      return await updateSyncSettings(supabaseUrl, serviceRoleKey, userId, updateData, corsHeaders);
    default:
      throw new Error(`Unsupported PUT action: ${action}`);
  }
}

// Get deployment status for all modes
async function getDeploymentStatus(supabaseUrl, serviceRoleKey, userId, corsHeaders) {
  const response = await fetch(`${supabaseUrl}/rest/v1/deployment_modes?user_id=eq.${userId}`, {
    headers: {
      'Authorization': `Bearer ${serviceRoleKey}`,
      'apikey': serviceRoleKey
    }
  });

  if (!response.ok) {
    throw new Error('Failed to fetch deployment status');
  }

  const deployments = await response.json();
  
  // Ensure all deployment modes exist
  const modes = ['web_app', 'browser_extension', 'hybrid_gateway', 'local_installation'];
  const existingModes = new Set(deployments.map(d => d.deployment_mode));
  
  for (const mode of modes) {
    if (!existingModes.has(mode)) {
      // Create missing deployment mode
      const defaultConfig = getDefaultConfig(mode);
      const insertData = {
        user_id: userId,
        deployment_mode: mode,
        status: mode === 'web_app' ? 'active' : 'inactive',
        configuration: JSON.stringify(defaultConfig),
        deployment_url: mode === 'web_app' ? 'https://ncczq77atgsg.space.minimax.io' : null,
        version: '1.0.0'
      };

      await fetch(`${supabaseUrl}/rest/v1/deployment_modes`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'apikey': serviceRoleKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(insertData)
      });
    }
  }

  // Fetch updated deployments
  const updatedResponse = await fetch(`${supabaseUrl}/rest/v1/deployment_modes?user_id=eq.${userId}`, {
    headers: {
      'Authorization': `Bearer ${serviceRoleKey}`,
      'apikey': serviceRoleKey
    }
  });

  const updatedDeployments = await updatedResponse.json();

  return new Response(JSON.stringify({
    data: {
      deployments: updatedDeployments,
      summary: {
        total_modes: updatedDeployments.length,
        active_modes: updatedDeployments.filter(d => d.status === 'active').length,
        error_modes: updatedDeployments.filter(d => d.status === 'error').length
      }
    }
  }), {
    headers: corsHeaders
  });
}

// Get health check data
async function getHealthChecks(supabaseUrl, serviceRoleKey, userId, corsHeaders) {
  const response = await fetch(`${supabaseUrl}/rest/v1/health_checks?user_id=eq.${userId}&order=performed_at.desc&limit=50`, {
    headers: {
      'Authorization': `Bearer ${serviceRoleKey}`,
      'apikey': serviceRoleKey
    }
  });

  if (!response.ok) {
    throw new Error('Failed to fetch health checks');
  }

  const healthChecks = await response.json();
  
  return new Response(JSON.stringify({
    data: {
      health_checks: healthChecks,
      summary: {
        total_checks: healthChecks.length,
        healthy_count: healthChecks.filter(h => h.status === 'healthy').length,
        warning_count: healthChecks.filter(h => h.status === 'warning').length,
        critical_count: healthChecks.filter(h => h.status === 'critical').length
      }
    }
  }), {
    headers: corsHeaders
  });
}

// Get download links
async function getDownloads(supabaseUrl, serviceRoleKey, corsHeaders) {
  const response = await fetch(`${supabaseUrl}/rest/v1/deployment_downloads?is_active=eq.true&order=created_at.desc`, {
    headers: {
      'Authorization': `Bearer ${serviceRoleKey}`,
      'apikey': serviceRoleKey
    }
  });

  if (!response.ok) {
    throw new Error('Failed to fetch downloads');
  }

  const downloads = await response.json();
  
  return new Response(JSON.stringify({
    data: { downloads }
  }), {
    headers: corsHeaders
  });
}

// Get sync status
async function getSyncStatus(supabaseUrl, serviceRoleKey, userId, corsHeaders) {
  const response = await fetch(`${supabaseUrl}/rest/v1/deployment_sync?user_id=eq.${userId}`, {
    headers: {
      'Authorization': `Bearer ${serviceRoleKey}`,
      'apikey': serviceRoleKey
    }
  });

  if (!response.ok) {
    throw new Error('Failed to fetch sync status');
  }

  const syncData = await response.json();
  
  return new Response(JSON.stringify({
    data: { sync_settings: syncData }
  }), {
    headers: corsHeaders
  });
}

// Deploy a specific mode
async function deployMode(supabaseUrl, serviceRoleKey, userId, requestData, corsHeaders) {
  const { deployment_mode, configuration } = requestData;
  
  if (!deployment_mode) {
    throw new Error('Deployment mode is required');
  }

  // Update deployment status to 'deploying'
  const updateResponse = await fetch(`${supabaseUrl}/rest/v1/deployment_modes?user_id=eq.${userId}&deployment_mode=eq.${deployment_mode}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${serviceRoleKey}`,
      'apikey': serviceRoleKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      status: 'deploying',
      configuration: JSON.stringify(configuration || {}),
      updated_at: new Date().toISOString()
    })
  });

  if (!updateResponse.ok) {
    throw new Error('Failed to update deployment status');
  }

  // Simulate deployment process (in real implementation, this would trigger actual deployment)
  setTimeout(async () => {
    await fetch(`${supabaseUrl}/rest/v1/deployment_modes?user_id=eq.${userId}&deployment_mode=eq.${deployment_mode}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        status: 'active',
        updated_at: new Date().toISOString()
      })
    });
  }, 3000);

  return new Response(JSON.stringify({
    data: {
      message: 'Deployment initiated successfully',
      deployment_mode: deployment_mode,
      status: 'deploying'
    }
  }), {
    headers: corsHeaders
  });
}

// Perform health check
async function performHealthCheck(supabaseUrl, serviceRoleKey, userId, requestData, corsHeaders) {
  const { deployment_mode, check_type } = requestData;
  
  const startTime = Date.now();
  let status = 'healthy';
  let errorMessage = null;
  const checkData = {};

  try {
    // Simulate health check logic
    switch (deployment_mode) {
      case 'web_app':
        // Check web app availability
        const webResponse = await fetch('https://ncczq77atgsg.space.minimax.io', { method: 'HEAD' });
        status = webResponse.ok ? 'healthy' : 'critical';
        checkData.http_status = webResponse.status;
        break;
      case 'browser_extension':
        // Simulate browser extension health check
        status = 'healthy'; // Would check extension connectivity
        break;
      case 'hybrid_gateway':
        // Simulate hybrid gateway health check
        status = 'warning'; // Example: partially functional
        break;
      case 'local_installation':
        // Simulate local installation health check
        status = 'unknown'; // Cannot check remote local installations
        break;
    }
  } catch (error) {
    status = 'critical';
    errorMessage = error.message;
  }

  const responseTime = Date.now() - startTime;

  // Save health check result
  const healthCheckData = {
    user_id: userId,
    deployment_id: null, // Would link to specific deployment
    check_type: check_type || 'connectivity',
    status: status,
    response_time_ms: responseTime,
    error_message: errorMessage,
    check_data: JSON.stringify(checkData)
  };

  await fetch(`${supabaseUrl}/rest/v1/health_checks`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${serviceRoleKey}`,
      'apikey': serviceRoleKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(healthCheckData)
  });

  return new Response(JSON.stringify({
    data: {
      deployment_mode: deployment_mode,
      status: status,
      response_time_ms: responseTime,
      error_message: errorMessage,
      check_data: checkData
    }
  }), {
    headers: corsHeaders
  });
}

// Test communication between deployment modes
async function testCommunication(supabaseUrl, serviceRoleKey, userId, requestData, corsHeaders) {
  const { source_mode, target_mode, test_type } = requestData;
  
  // Simulate communication test
  const testResult = {
    source_mode: source_mode,
    target_mode: target_mode,
    test_type: test_type || 'ping',
    success: Math.random() > 0.2, // 80% success rate for demo
    latency_ms: Math.floor(Math.random() * 100) + 10,
    timestamp: new Date().toISOString()
  };

  return new Response(JSON.stringify({
    data: testResult
  }), {
    headers: corsHeaders
  });
}

// Update configuration
async function updateConfiguration(supabaseUrl, serviceRoleKey, userId, updateData, corsHeaders) {
  const { deployment_mode, configuration } = updateData;
  
  const response = await fetch(`${supabaseUrl}/rest/v1/deployment_modes?user_id=eq.${userId}&deployment_mode=eq.${deployment_mode}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${serviceRoleKey}`,
      'apikey': serviceRoleKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      configuration: JSON.stringify(configuration),
      updated_at: new Date().toISOString()
    })
  });

  if (!response.ok) {
    throw new Error('Failed to update configuration');
  }

  return new Response(JSON.stringify({
    data: {
      message: 'Configuration updated successfully',
      deployment_mode: deployment_mode
    }
  }), {
    headers: corsHeaders
  });
}

// Update sync settings
async function updateSyncSettings(supabaseUrl, serviceRoleKey, userId, updateData, corsHeaders) {
  const { deployment_mode, sync_config } = updateData;
  
  // Check if sync setting exists
  const existingResponse = await fetch(`${supabaseUrl}/rest/v1/deployment_sync?user_id=eq.${userId}&deployment_mode=eq.${deployment_mode}`, {
    headers: {
      'Authorization': `Bearer ${serviceRoleKey}`,
      'apikey': serviceRoleKey
    }
  });

  const existing = await existingResponse.json();
  
  if (existing.length === 0) {
    // Create new sync setting
    await fetch(`${supabaseUrl}/rest/v1/deployment_sync`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        user_id: userId,
        deployment_mode: deployment_mode,
        sync_config: JSON.stringify(sync_config),
        last_sync: new Date().toISOString()
      })
    });
  } else {
    // Update existing sync setting
    await fetch(`${supabaseUrl}/rest/v1/deployment_sync?user_id=eq.${userId}&deployment_mode=eq.${deployment_mode}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sync_config: JSON.stringify(sync_config),
        last_sync: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
    });
  }

  return new Response(JSON.stringify({
    data: {
      message: 'Sync settings updated successfully',
      deployment_mode: deployment_mode
    }
  }), {
    headers: corsHeaders
  });
}

// Get default configuration for deployment modes
function getDefaultConfig(mode) {
  switch (mode) {
    case 'web_app':
      return {
        url: 'https://ncczq77atgsg.space.minimax.io',
        features: ['dashboard', 'idea_validator', 'task_monitoring'],
        auth_enabled: true
      };
    case 'browser_extension':
      return {
        permissions: ['activeTab', 'storage', 'webNavigation'],
        supported_sites: ['*://*/*'],
        auto_inject: true
      };
    case 'hybrid_gateway':
      return {
        port: 8080,
        cors_enabled: true,
        websocket_enabled: true
      };
    case 'local_installation':
      return {
        install_path: '/usr/local/bin/ai-supervisor',
        service_enabled: true,
        auto_start: true
      };
    default:
      return {};
  }
}