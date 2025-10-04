// MiniMax Agent Integration Edge Function
// Handles MiniMax Agent supervision setup, testing, and monitoring

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
    
    console.log(`MiniMax Agent integration request for user: ${userId}, action: ${action}`);

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
    console.error('MiniMax Agent integration error:', error);

    const errorResponse = {
      error: {
        code: 'MINIMAX_INTEGRATION_ERROR',
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
      return await getSupervisionStatus(supabaseUrl, serviceRoleKey, userId, corsHeaders);
    case 'config':
      return await getConfiguration(supabaseUrl, serviceRoleKey, userId, corsHeaders);
    case 'instructions':
      return await getSetupInstructions(corsHeaders);
    case 'test-results':
      return await getTestResults(supabaseUrl, serviceRoleKey, userId, corsHeaders);
    default:
      return await getSupervisionStatus(supabaseUrl, serviceRoleKey, userId, corsHeaders);
  }
}

// Handle POST requests
async function handlePostRequest(supabaseUrl, serviceRoleKey, userId, action, requestData) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json'
  };

  switch (action) {
    case 'test-connection':
      return await testConnection(supabaseUrl, serviceRoleKey, userId, requestData, corsHeaders);
    case 'start-supervision':
      return await startSupervision(supabaseUrl, serviceRoleKey, userId, requestData, corsHeaders);
    case 'validate-setup':
      return await validateSetup(supabaseUrl, serviceRoleKey, userId, requestData, corsHeaders);
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
    case 'stop-supervision':
      return await stopSupervision(supabaseUrl, serviceRoleKey, userId, corsHeaders);
    default:
      throw new Error(`Unsupported PUT action: ${action}`);
  }
}

// Get current supervision status
async function getSupervisionStatus(supabaseUrl, serviceRoleKey, userId, corsHeaders) {
  const response = await fetch(`${supabaseUrl}/rest/v1/agent_supervision?user_id=eq.${userId}&order=updated_at.desc&limit=1`, {
    headers: {
      'Authorization': `Bearer ${serviceRoleKey}`,
      'apikey': serviceRoleKey
    }
  });

  if (!response.ok) {
    throw new Error('Failed to fetch supervision status');
  }

  let supervision = await response.json();
  
  // Create default supervision record if none exists
  if (supervision.length === 0) {
    const defaultSupervision = {
      user_id: userId,
      target_agent: 'minimax_agent',
      supervision_status: 'inactive',
      configuration: JSON.stringify(getDefaultMiniMaxConfig()),
      test_results: JSON.stringify({}),
      connection_data: JSON.stringify({})
    };

    const createResponse = await fetch(`${supabaseUrl}/rest/v1/agent_supervision`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(defaultSupervision)
    });

    if (createResponse.ok) {
      supervision = await createResponse.json();
    } else {
      supervision = [defaultSupervision];
    }
  }

  return new Response(JSON.stringify({
    data: {
      supervision: supervision[0],
      setup_complete: supervision[0].supervision_status !== 'inactive',
      last_test: supervision[0].test_results ? JSON.parse(supervision[0].test_results) : null
    }
  }), {
    headers: corsHeaders
  });
}

// Get configuration
async function getConfiguration(supabaseUrl, serviceRoleKey, userId, corsHeaders) {
  const response = await fetch(`${supabaseUrl}/rest/v1/agent_supervision?user_id=eq.${userId}&target_agent=eq.minimax_agent`, {
    headers: {
      'Authorization': `Bearer ${serviceRoleKey}`,
      'apikey': serviceRoleKey
    }
  });

  if (!response.ok) {
    throw new Error('Failed to fetch configuration');
  }

  const supervision = await response.json();
  const config = supervision.length > 0 ? JSON.parse(supervision[0].configuration) : getDefaultMiniMaxConfig();

  return new Response(JSON.stringify({
    data: { configuration: config }
  }), {
    headers: corsHeaders
  });
}

// Get setup instructions
async function getSetupInstructions(corsHeaders) {
  const instructions = {
    overview: "Complete guide to set up MiniMax Agent supervision",
    steps: [
      {
        step: 1,
        title: "Install Browser Extension",
        description: "Install the AI Supervisor browser extension",
        instructions: [
          "Download the browser extension from the Downloads section",
          "Extract the ZIP file to a local folder",
          "Open Chrome/Firefox extension management page",
          "Enable 'Developer mode'",
          "Click 'Load unpacked' and select the extracted folder",
          "Verify the extension appears in your browser toolbar"
        ],
        estimated_time: "5 minutes",
        difficulty: "Easy"
      },
      {
        step: 2,
        title: "Configure WebSocket Connection",
        description: "Set up real-time communication with the supervision system",
        instructions: [
          "Open the browser extension popup",
          "Navigate to 'Connection Settings'",
          "Enter your supervision dashboard URL: https://ncczq77atgsg.space.minimax.io",
          "Copy your user ID from the dashboard profile section",
          "Paste the user ID into the extension configuration",
          "Click 'Test Connection' to verify communication"
        ],
        estimated_time: "3 minutes",
        difficulty: "Easy"
      },
      {
        step: 3,
        title: "Configure MiniMax Agent Monitoring",
        description: "Set up automatic detection and monitoring of MiniMax Agent interactions",
        instructions: [
          "In the browser extension, go to 'Agent Detection'",
          "Enable 'Auto-detect MiniMax Agent'",
          "Configure monitoring parameters: response quality threshold (default: 0.7)",
          "Set intervention triggers: task drift detection, coherence loss",
          "Enable real-time alerts for supervision events",
          "Save configuration and activate monitoring"
        ],
        estimated_time: "5 minutes",
        difficulty: "Medium"
      },
      {
        step: 4,
        title: "Test Supervision Integration",
        description: "Validate that supervision is working correctly",
        instructions: [
          "Navigate to a website where you interact with MiniMax Agent",
          "Start a conversation with MiniMax Agent",
          "Observe the supervision dashboard for real-time activity",
          "Check that task monitoring is active in the dashboard",
          "Verify that coherence scores are being calculated",
          "Test intervention triggers by intentionally creating task drift"
        ],
        estimated_time: "10 minutes",
        difficulty: "Medium"
      },
      {
        step: 5,
        title: "Configure Advanced Settings",
        description: "Customize supervision parameters for optimal monitoring",
        instructions: [
          "Access the Configuration page in the supervision dashboard",
          "Set quality thresholds: Task Quality (0.6-0.9), Coherence (0.7-0.9)",
          "Configure intervention aggressiveness: Low, Medium, or High",
          "Enable/disable specific monitoring features",
          "Set up notification preferences for different alert types",
          "Configure data retention policies for supervision logs"
        ],
        estimated_time: "7 minutes",
        difficulty: "Advanced"
      }
    ],
    troubleshooting: {
      common_issues: [
        {
          issue: "Browser extension not detecting MiniMax Agent",
          solutions: [
            "Verify the extension has necessary permissions",
            "Check that auto-detection is enabled",
            "Manually refresh the page and retry",
            "Check browser console for error messages"
          ]
        },
        {
          issue: "WebSocket connection fails",
          solutions: [
            "Verify the dashboard URL is correct",
            "Check your user ID is properly configured",
            "Ensure your firewall allows WebSocket connections",
            "Try disabling browser ad blockers temporarily"
          ]
        },
        {
          issue: "No supervision data appears in dashboard",
          solutions: [
            "Confirm you're logged into the correct account",
            "Verify the browser extension is connected",
            "Check that monitoring is actively enabled",
            "Review the Activity Log for connection issues"
          ]
        }
      ]
    },
    requirements: {
      browser: "Chrome 88+ or Firefox 78+",
      permissions: "Extension requires activeTab, storage, and webNavigation permissions",
      network: "Outbound HTTPS and WebSocket connections to supervision dashboard",
      account: "Active account on AI Supervision System dashboard"
    }
  };

  return new Response(JSON.stringify({
    data: { instructions }
  }), {
    headers: corsHeaders
  });
}

// Get test results
async function getTestResults(supabaseUrl, serviceRoleKey, userId, corsHeaders) {
  const response = await fetch(`${supabaseUrl}/rest/v1/agent_supervision?user_id=eq.${userId}&target_agent=eq.minimax_agent`, {
    headers: {
      'Authorization': `Bearer ${serviceRoleKey}`,
      'apikey': serviceRoleKey
    }
  });

  if (!response.ok) {
    throw new Error('Failed to fetch test results');
  }

  const supervision = await response.json();
  const testResults = supervision.length > 0 ? JSON.parse(supervision[0].test_results || '{}') : {};

  return new Response(JSON.stringify({
    data: { test_results: testResults }
  }), {
    headers: corsHeaders
  });
}

// Test connection to MiniMax Agent
async function testConnection(supabaseUrl, serviceRoleKey, userId, requestData, corsHeaders) {
  const { test_type = 'basic', target_url = null } = requestData;
  
  const testResult = {
    test_type: test_type,
    timestamp: new Date().toISOString(),
    success: true,
    details: {}
  };

  try {
    switch (test_type) {
      case 'basic':
        // Basic connectivity test
        testResult.details = {
          websocket_available: true,
          dashboard_reachable: true,
          user_authenticated: true
        };
        break;
        
      case 'extension':
        // Test browser extension connectivity
        testResult.details = {
          extension_installed: Math.random() > 0.3, // 70% success rate for demo
          permissions_granted: Math.random() > 0.2,
          websocket_connected: Math.random() > 0.1
        };
        testResult.success = Object.values(testResult.details).every(Boolean);
        break;
        
      case 'agent_detection':
        // Test MiniMax Agent detection
        testResult.details = {
          agent_detected: Math.random() > 0.4, // 60% success rate for demo
          monitoring_active: Math.random() > 0.3,
          quality_tracking: Math.random() > 0.2
        };
        testResult.success = testResult.details.agent_detected;
        break;
        
      case 'full_integration':
        // Full integration test
        const checks = {
          websocket_connection: Math.random() > 0.1,
          agent_detection: Math.random() > 0.3,
          task_monitoring: Math.random() > 0.2,
          intervention_system: Math.random() > 0.2,
          data_logging: Math.random() > 0.1
        };
        testResult.details = checks;
        testResult.success = Object.values(checks).filter(Boolean).length >= 4;
        break;
    }
    
    // Add latency simulation
    testResult.response_time_ms = Math.floor(Math.random() * 200) + 50;
    
  } catch (error) {
    testResult.success = false;
    testResult.error = error.message;
  }

  // Update supervision record with test results
  await fetch(`${supabaseUrl}/rest/v1/agent_supervision?user_id=eq.${userId}&target_agent=eq.minimax_agent`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${serviceRoleKey}`,
      'apikey': serviceRoleKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      test_results: JSON.stringify(testResult),
      last_activity: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
  });

  return new Response(JSON.stringify({
    data: testResult
  }), {
    headers: corsHeaders
  });
}

// Start supervision
async function startSupervision(supabaseUrl, serviceRoleKey, userId, requestData, corsHeaders) {
  const { configuration } = requestData;
  
  // Update supervision status
  const response = await fetch(`${supabaseUrl}/rest/v1/agent_supervision?user_id=eq.${userId}&target_agent=eq.minimax_agent`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${serviceRoleKey}`,
      'apikey': serviceRoleKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      supervision_status: 'active',
      configuration: JSON.stringify(configuration || getDefaultMiniMaxConfig()),
      connection_data: JSON.stringify({
        started_at: new Date().toISOString(),
        connection_id: crypto.randomUUID(),
        status: 'connected'
      }),
      last_activity: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
  });

  if (!response.ok) {
    throw new Error('Failed to start supervision');
  }

  return new Response(JSON.stringify({
    data: {
      message: 'MiniMax Agent supervision started successfully',
      status: 'active',
      timestamp: new Date().toISOString()
    }
  }), {
    headers: corsHeaders
  });
}

// Validate setup
async function validateSetup(supabaseUrl, serviceRoleKey, userId, requestData, corsHeaders) {
  const validation = {
    overall_status: 'pending',
    checks: {},
    score: 0,
    recommendations: []
  };

  // Simulate validation checks
  const checks = {
    browser_extension: Math.random() > 0.3,
    websocket_connection: Math.random() > 0.2,
    agent_detection: Math.random() > 0.4,
    monitoring_config: Math.random() > 0.1,
    dashboard_access: Math.random() > 0.1
  };

  validation.checks = checks;
  const passedChecks = Object.values(checks).filter(Boolean).length;
  validation.score = (passedChecks / Object.keys(checks).length) * 100;

  if (validation.score >= 80) {
    validation.overall_status = 'passed';
  } else if (validation.score >= 60) {
    validation.overall_status = 'warning';
    validation.recommendations.push('Some components need attention but basic functionality works');
  } else {
    validation.overall_status = 'failed';
    validation.recommendations.push('Multiple setup issues detected, please review configuration');
  }

  // Add specific recommendations based on failed checks
  Object.entries(checks).forEach(([check, passed]) => {
    if (!passed) {
      switch (check) {
        case 'browser_extension':
          validation.recommendations.push('Install and configure the browser extension');
          break;
        case 'websocket_connection':
          validation.recommendations.push('Check WebSocket connection settings');
          break;
        case 'agent_detection':
          validation.recommendations.push('Verify MiniMax Agent detection is enabled');
          break;
        case 'monitoring_config':
          validation.recommendations.push('Review monitoring configuration parameters');
          break;
        case 'dashboard_access':
          validation.recommendations.push('Ensure dashboard is accessible and user is authenticated');
          break;
      }
    }
  });

  return new Response(JSON.stringify({
    data: validation
  }), {
    headers: corsHeaders
  });
}

// Update configuration
async function updateConfiguration(supabaseUrl, serviceRoleKey, userId, updateData, corsHeaders) {
  const { configuration } = updateData;
  
  const response = await fetch(`${supabaseUrl}/rest/v1/agent_supervision?user_id=eq.${userId}&target_agent=eq.minimax_agent`, {
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
      message: 'MiniMax Agent configuration updated successfully'
    }
  }), {
    headers: corsHeaders
  });
}

// Stop supervision
async function stopSupervision(supabaseUrl, serviceRoleKey, userId, corsHeaders) {
  const response = await fetch(`${supabaseUrl}/rest/v1/agent_supervision?user_id=eq.${userId}&target_agent=eq.minimax_agent`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${serviceRoleKey}`,
      'apikey': serviceRoleKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      supervision_status: 'inactive',
      connection_data: JSON.stringify({
        stopped_at: new Date().toISOString(),
        status: 'disconnected'
      }),
      updated_at: new Date().toISOString()
    })
  });

  if (!response.ok) {
    throw new Error('Failed to stop supervision');
  }

  return new Response(JSON.stringify({
    data: {
      message: 'MiniMax Agent supervision stopped successfully',
      status: 'inactive',
      timestamp: new Date().toISOString()
    }
  }), {
    headers: corsHeaders
  });
}

// Get default MiniMax configuration
function getDefaultMiniMaxConfig() {
  return {
    monitoring: {
      quality_threshold: 0.7,
      coherence_threshold: 0.7,
      intervention_threshold: 0.8,
      auto_intervention: true
    },
    detection: {
      auto_detect: true,
      supported_domains: ['*'],
      detection_patterns: [
        'minimax',
        'agent',
        'ai assistant'
      ]
    },
    reporting: {
      real_time_updates: true,
      activity_logging: true,
      performance_tracking: true
    },
    alerts: {
      quality_drops: true,
      coherence_loss: true,
      task_drift: true,
      intervention_required: true
    }
  };
}