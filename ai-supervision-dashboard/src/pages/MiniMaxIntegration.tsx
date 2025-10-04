import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/ui/ToastProvider'
import { 
  User,
  Play,
  Square,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  RefreshCw,
  Settings,
  Monitor,
  Activity,
  Zap,
  BookOpen,
  TestTube,
  Shield,
  Cpu,
  Network,
  Eye,
  Bell
} from 'lucide-react'
import type { AgentSupervision } from '@/lib/supabase'

interface TestResult {
  test_type: string
  timestamp: string
  success: boolean
  details: Record<string, any>
  response_time_ms?: number
  error?: string
}

interface SetupInstructions {
  overview: string
  steps: Array<{
    step: number
    title: string
    description: string
    instructions: string[]
    estimated_time: string
    difficulty: string
  }>
  troubleshooting: {
    common_issues: Array<{
      issue: string
      solutions: string[]
    }>
  }
  requirements: {
    browser: string
    permissions: string
    network: string
    account: string
  }
}

interface ValidationResult {
  overall_status: string
  checks: Record<string, boolean>
  score: number
  recommendations: string[]
}

export function MiniMaxIntegration() {
  const { user } = useAuth()
  const { addToast } = useToast()
  const [supervision, setSupervision] = useState<AgentSupervision | null>(null)
  const [testResults, setTestResults] = useState<TestResult | null>(null)
  const [instructions, setInstructions] = useState<SetupInstructions | null>(null)
  const [validation, setValidation] = useState<ValidationResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [isTestingConnection, setIsTestingConnection] = useState(false)
  const [isStartingSupervision, setIsStartingSupervision] = useState(false)
  const [isValidatingSetup, setIsValidatingSetup] = useState(false)

  useEffect(() => {
    if (user) {
      loadSupervisionData()
      loadInstructions()
    }
  }, [user])

  const loadSupervisionData = async () => {
    if (!user) return
    
    try {
      const { data, error } = await supabase.functions.invoke('minimax-integration', {
        body: {},
        method: 'GET'
      })

      if (error) {
        console.error('Error loading supervision data:', error)
        return
      }

      if (data?.data) {
        setSupervision(data.data.supervision)
        if (data.data.last_test) {
          setTestResults(data.data.last_test)
        }
      }
    } catch (error: any) {
      console.error('Error loading supervision data:', error)
      addToast('Failed to load supervision data', 'error')
    } finally {
      setLoading(false)
    }
  }

  const loadInstructions = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('minimax-integration', {
        body: {},
        method: 'GET'
      })

      if (data?.data?.instructions) {
        setInstructions(data.data.instructions)
      }
    } catch (error: any) {
      console.error('Error loading instructions:', error)
    }
  }

  const testConnection = async (testType: string = 'basic') => {
    setIsTestingConnection(true)
    try {
      const { data, error } = await supabase.functions.invoke('minimax-integration', {
        body: {
          test_type: testType
        },
        method: 'POST'
      })

      if (error) {
        addToast(`Connection test failed: ${error.message}`, 'error')
        return
      }

      if (data) {
        setTestResults(data)
        if (data.success) {
          addToast(`${testType} test completed successfully`, 'success')
        } else {
          addToast(`${testType} test failed`, 'error')
        }
      }
    } catch (error: any) {
      addToast('Connection test failed', 'error')
    } finally {
      setIsTestingConnection(false)
    }
  }

  const startSupervision = async () => {
    setIsStartingSupervision(true)
    try {
      const defaultConfig = {
        monitoring: {
          quality_threshold: 0.7,
          coherence_threshold: 0.7,
          intervention_threshold: 0.8,
          auto_intervention: true
        },
        detection: {
          auto_detect: true,
          supported_domains: ['*'],
          detection_patterns: ['minimax', 'agent', 'ai assistant']
        },
        reporting: {
          real_time_updates: true,
          activity_logging: true,
          performance_tracking: true
        }
      }

      const { data, error } = await supabase.functions.invoke('minimax-integration', {
        body: {
          configuration: defaultConfig
        },
        method: 'POST'
      })

      if (error) {
        addToast(`Failed to start supervision: ${error.message}`, 'error')
        return
      }

      addToast('MiniMax Agent supervision started successfully', 'success')
      loadSupervisionData()
    } catch (error: any) {
      addToast('Failed to start supervision', 'error')
    } finally {
      setIsStartingSupervision(false)
    }
  }

  const stopSupervision = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('minimax-integration', {
        body: {},
        method: 'PUT'
      })

      if (error) {
        addToast(`Failed to stop supervision: ${error.message}`, 'error')
        return
      }

      addToast('MiniMax Agent supervision stopped', 'success')
      loadSupervisionData()
    } catch (error: any) {
      addToast('Failed to stop supervision', 'error')
    }
  }

  const validateSetup = async () => {
    setIsValidatingSetup(true)
    try {
      const { data, error } = await supabase.functions.invoke('minimax-integration', {
        body: {},
        method: 'POST'
      })

      if (error) {
        addToast('Setup validation failed', 'error')
        return
      }

      if (data) {
        setValidation(data)
        if (data.overall_status === 'passed') {
          addToast('Setup validation passed!', 'success')
        } else if (data.overall_status === 'warning') {
          addToast('Setup validation completed with warnings', 'warning')
        } else {
          addToast('Setup validation failed', 'error')
        }
      }
    } catch (error: any) {
      addToast('Setup validation failed', 'error')
    } finally {
      setIsValidatingSetup(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-400 bg-green-900/20 border-green-700/50'
      case 'configuring':
        return 'text-blue-400 bg-blue-900/20 border-blue-700/50'
      case 'testing':
        return 'text-purple-400 bg-purple-900/20 border-purple-700/50'
      case 'error':
        return 'text-red-400 bg-red-900/20 border-red-700/50'
      default:
        return 'text-gray-400 bg-gray-900/20 border-gray-700/50'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-5 w-5" />
      case 'configuring':
        return <Settings className="h-5 w-5 animate-spin" />
      case 'testing':
        return <TestTube className="h-5 w-5" />
      case 'error':
        return <XCircle className="h-5 w-5" />
      default:
        return <Clock className="h-5 w-5" />
    }
  }

  const tabs = [
    { id: 'overview', name: 'Overview', icon: Monitor },
    { id: 'setup', name: 'Setup Guide', icon: BookOpen },
    { id: 'testing', name: 'Testing', icon: TestTube },
    { id: 'configuration', name: 'Configuration', icon: Settings }
  ]

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-700 rounded-lg w-1/3"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-64 bg-gray-700 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center space-x-2">
            <User className="h-6 w-6 text-purple-400" />
            <span>MiniMax Agent Integration</span>
          </h1>
          <p className="text-gray-400 mt-1">Complete supervision setup for MiniMax Agent</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <button
            onClick={validateSetup}
            disabled={isValidatingSetup}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg transition-colors"
          >
            {isValidatingSetup ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Validating...</span>
              </>
            ) : (
              <>
                <Shield className="h-4 w-4" />
                <span>Validate Setup</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Status Card */}
      {supervision && (
        <div className={`border rounded-lg p-6 ${getStatusColor(supervision.supervision_status)}`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              {getStatusIcon(supervision.supervision_status)}
              <div>
                <h3 className="text-lg font-semibold">MiniMax Agent Supervision</h3>
                <p className="text-sm opacity-75 capitalize">{supervision.supervision_status.replace('_', ' ')} Status</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {supervision.supervision_status === 'inactive' ? (
                <button
                  onClick={startSupervision}
                  disabled={isStartingSupervision}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-lg transition-colors"
                >
                  {isStartingSupervision ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Starting...</span>
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4" />
                      <span>Start Supervision</span>
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={stopSupervision}
                  className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                >
                  <Square className="h-4 w-4" />
                  <span>Stop Supervision</span>
                </button>
              )}
            </div>
          </div>
          
          {supervision.last_activity && (
            <div className="text-sm opacity-75">
              Last activity: {new Date(supervision.last_activity).toLocaleString()}
            </div>
          )}
        </div>
      )}

      {/* Validation Results */}
      {validation && (
        <div className={`border rounded-lg p-6 ${
          validation.overall_status === 'passed' ? 'bg-green-900/20 border-green-700/50' :
          validation.overall_status === 'warning' ? 'bg-yellow-900/20 border-yellow-700/50' :
          'bg-red-900/20 border-red-700/50'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              {validation.overall_status === 'passed' ? (
                <CheckCircle className="h-6 w-6 text-green-400" />
              ) : validation.overall_status === 'warning' ? (
                <AlertTriangle className="h-6 w-6 text-yellow-400" />
              ) : (
                <XCircle className="h-6 w-6 text-red-400" />
              )}
              <h3 className="text-lg font-semibold text-white">Setup Validation Results</h3>
            </div>
            <div className="text-2xl font-bold">{Math.round(validation.score)}%</div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
            {Object.entries(validation.checks).map(([check, passed]) => (
              <div key={check} className="text-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-2 ${
                  passed ? 'bg-green-500' : 'bg-red-500'
                }`}>
                  {passed ? <CheckCircle className="h-5 w-5 text-white" /> : <XCircle className="h-5 w-5 text-white" />}
                </div>
                <p className="text-xs text-gray-300 capitalize">{check.replace('_', ' ')}</p>
              </div>
            ))}
          </div>
          
          {validation.recommendations.length > 0 && (
            <div>
              <p className="text-sm font-medium text-white mb-2">Recommendations:</p>
              <ul className="text-sm space-y-1">
                {validation.recommendations.map((rec, index) => (
                  <li key={index} className="flex items-start space-x-2 opacity-90">
                    <div className="w-1.5 h-1.5 bg-current rounded-full mt-2 flex-shrink-0"></div>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-700">
        <nav className="flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-3 px-1 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.name}</span>
              </button>
            )
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Quick Actions */}
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button
                  onClick={() => testConnection('basic')}
                  disabled={isTestingConnection}
                  className="w-full flex items-center space-x-3 p-3 bg-gray-700/50 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <Network className="h-5 w-5 text-blue-400" />
                  <div className="text-left">
                    <p className="text-white font-medium">Test Basic Connection</p>
                    <p className="text-sm text-gray-400">Verify WebSocket and dashboard connectivity</p>
                  </div>
                </button>
                
                <button
                  onClick={() => testConnection('extension')}
                  disabled={isTestingConnection}
                  className="w-full flex items-center space-x-3 p-3 bg-gray-700/50 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <Cpu className="h-5 w-5 text-green-400" />
                  <div className="text-left">
                    <p className="text-white font-medium">Test Extension</p>
                    <p className="text-sm text-gray-400">Check browser extension status</p>
                  </div>
                </button>
                
                <button
                  onClick={() => testConnection('agent_detection')}
                  disabled={isTestingConnection}
                  className="w-full flex items-center space-x-3 p-3 bg-gray-700/50 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <Eye className="h-5 w-5 text-purple-400" />
                  <div className="text-left">
                    <p className="text-white font-medium">Test Agent Detection</p>
                    <p className="text-sm text-gray-400">Verify MiniMax Agent monitoring</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Latest Test Results */}
            {testResults && (
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Latest Test Results</h3>
                <div className={`p-4 rounded-lg border ${
                  testResults.success 
                    ? 'bg-green-900/20 border-green-700/50 text-green-100'
                    : 'bg-red-900/20 border-red-700/50 text-red-100'
                }`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      {testResults.success ? (
                        <CheckCircle className="h-5 w-5" />
                      ) : (
                        <XCircle className="h-5 w-5" />
                      )}
                      <span className="font-medium capitalize">{testResults.test_type} Test</span>
                    </div>
                    {testResults.response_time_ms && (
                      <span className="text-sm opacity-75">{testResults.response_time_ms}ms</span>
                    )}
                  </div>
                  
                  {testResults.details && Object.keys(testResults.details).length > 0 && (
                    <div className="space-y-2">
                      {Object.entries(testResults.details).map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between text-sm">
                          <span className="opacity-75 capitalize">{key.replace('_', ' ')}</span>
                          <div className={`w-2 h-2 rounded-full ${
                            value ? 'bg-green-400' : 'bg-red-400'
                          }`}></div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {testResults.error && (
                    <div className="mt-3 text-sm opacity-90">
                      Error: {testResults.error}
                    </div>
                  )}
                  
                  <div className="text-xs opacity-60 mt-3">
                    {new Date(testResults.timestamp).toLocaleString()}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'setup' && instructions && (
          <div className="space-y-6">
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">{instructions.overview}</h3>
              
              <div className="space-y-6">
                {instructions.steps.map((step) => (
                  <div key={step.step} className="border border-gray-600 rounded-lg p-6">
                    <div className="flex items-start space-x-4">
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {step.step}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-lg font-semibold text-white">{step.title}</h4>
                          <div className="flex items-center space-x-4 text-sm text-gray-400">
                            <span>{step.estimated_time}</span>
                            <span className={`px-2 py-1 rounded ${
                              step.difficulty === 'Easy' ? 'bg-green-900/20 text-green-400' :
                              step.difficulty === 'Medium' ? 'bg-yellow-900/20 text-yellow-400' :
                              'bg-red-900/20 text-red-400'
                            }`}>
                              {step.difficulty}
                            </span>
                          </div>
                        </div>
                        
                        <p className="text-gray-300 mb-4">{step.description}</p>
                        
                        <div className="space-y-2">
                          {step.instructions.map((instruction, index) => (
                            <div key={index} className="flex items-start space-x-2">
                              <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                              <p className="text-gray-300 text-sm">{instruction}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Requirements and Troubleshooting */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4">System Requirements</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-400">Browser</p>
                    <p className="text-white">{instructions.requirements.browser}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Permissions</p>
                    <p className="text-white">{instructions.requirements.permissions}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Network</p>
                    <p className="text-white">{instructions.requirements.network}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Account</p>
                    <p className="text-white">{instructions.requirements.account}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Troubleshooting</h3>
                <div className="space-y-4">
                  {instructions.troubleshooting.common_issues.map((issue, index) => (
                    <div key={index}>
                      <p className="text-white font-medium mb-2">{issue.issue}</p>
                      <div className="space-y-1">
                        {issue.solutions.map((solution, sIndex) => (
                          <div key={sIndex} className="flex items-start space-x-2">
                            <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full mt-2 flex-shrink-0"></div>
                            <p className="text-gray-300 text-sm">{solution}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'testing' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Connection Tests</h3>
              <div className="space-y-3">
                {[
                  { type: 'basic', name: 'Basic Connectivity', description: 'Test WebSocket and dashboard connection' },
                  { type: 'extension', name: 'Browser Extension', description: 'Verify extension installation and permissions' },
                  { type: 'agent_detection', name: 'Agent Detection', description: 'Test MiniMax Agent monitoring capabilities' },
                  { type: 'full_integration', name: 'Full Integration', description: 'Complete end-to-end functionality test' }
                ].map((test) => (
                  <button
                    key={test.type}
                    onClick={() => testConnection(test.type)}
                    disabled={isTestingConnection}
                    className="w-full text-left p-4 bg-gray-700/50 hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white font-medium">{test.name}</p>
                        <p className="text-sm text-gray-400">{test.description}</p>
                      </div>
                      <TestTube className="h-5 w-5 text-gray-400" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
            
            {testResults && (
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Test Results</h3>
                <div className={`p-4 rounded-lg border ${
                  testResults.success 
                    ? 'bg-green-900/20 border-green-700/50'
                    : 'bg-red-900/20 border-red-700/50'
                }`}>
                  <div className="flex items-center space-x-2 mb-4">
                    {testResults.success ? (
                      <CheckCircle className="h-6 w-6 text-green-400" />
                    ) : (
                      <XCircle className="h-6 w-6 text-red-400" />
                    )}
                    <h4 className="text-lg font-semibold text-white capitalize">
                      {testResults.test_type.replace('_', ' ')} Test
                    </h4>
                  </div>
                  
                  {testResults.details && Object.keys(testResults.details).length > 0 && (
                    <div className="space-y-3">
                      {Object.entries(testResults.details).map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between p-2 bg-gray-700/50 rounded">
                          <span className="text-gray-300 capitalize">{key.replace('_', ' ')}</span>
                          <div className="flex items-center space-x-2">
                            <span className={`text-sm ${
                              value ? 'text-green-400' : 'text-red-400'
                            }`}>
                              {value ? 'Pass' : 'Fail'}
                            </span>
                            <div className={`w-2 h-2 rounded-full ${
                              value ? 'bg-green-400' : 'bg-red-400'
                            }`}></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div className="mt-4 text-sm text-gray-400">
                    Completed at {new Date(testResults.timestamp).toLocaleString()}
                    {testResults.response_time_ms && ` • ${testResults.response_time_ms}ms`}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'configuration' && supervision && (
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-6">Supervision Configuration</h3>
            
            <div className="space-y-6">
              {/* Monitoring Settings */}
              <div>
                <h4 className="text-white font-medium mb-3 flex items-center space-x-2">
                  <Monitor className="h-5 w-5" />
                  <span>Monitoring Thresholds</span>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-gray-700/50 rounded-lg">
                    <label className="block text-sm text-gray-400 mb-2">Quality Threshold</label>
                    <div className="text-2xl font-bold text-white">0.7</div>
                    <div className="text-xs text-gray-500">Minimum quality score</div>
                  </div>
                  <div className="p-4 bg-gray-700/50 rounded-lg">
                    <label className="block text-sm text-gray-400 mb-2">Coherence Threshold</label>
                    <div className="text-2xl font-bold text-white">0.7</div>
                    <div className="text-xs text-gray-500">Minimum coherence score</div>
                  </div>
                  <div className="p-4 bg-gray-700/50 rounded-lg">
                    <label className="block text-sm text-gray-400 mb-2">Intervention Threshold</label>
                    <div className="text-2xl font-bold text-white">0.8</div>
                    <div className="text-xs text-gray-500">Auto-intervention trigger</div>
                  </div>
                </div>
              </div>
              
              {/* Detection Settings */}
              <div>
                <h4 className="text-white font-medium mb-3 flex items-center space-x-2">
                  <Eye className="h-5 w-5" />
                  <span>Agent Detection</span>
                </h4>
                <div className="p-4 bg-gray-700/50 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-gray-300">Auto-detect MiniMax Agent</span>
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  </div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-gray-300">Monitor all domains</span>
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Real-time activity logging</span>
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  </div>
                </div>
              </div>
              
              {/* Alert Settings */}
              <div>
                <h4 className="text-white font-medium mb-3 flex items-center space-x-2">
                  <Bell className="h-5 w-5" />
                  <span>Alert Preferences</span>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { name: 'Quality drops', enabled: true },
                    { name: 'Coherence loss', enabled: true },
                    { name: 'Task drift', enabled: true },
                    { name: 'Intervention required', enabled: true }
                  ].map((alert, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                      <span className="text-gray-300">{alert.name}</span>
                      <div className={`w-2 h-2 rounded-full ${
                        alert.enabled ? 'bg-green-500' : 'bg-red-500'
                      }`}></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}