import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/ui/ToastProvider'
import { 
  Settings,
  Monitor,
  Globe,
  Smartphone,
  Network,
  HardDrive,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Clock,
  Download,
  Play,
  Square,
  RefreshCw,
  ExternalLink,
  Wifi,
  WifiOff
} from 'lucide-react'
import type { DeploymentMode, HealthCheck, DeploymentDownload } from '@/lib/supabase'

interface DeploymentStatus {
  deployments: DeploymentMode[]
  summary: {
    total_modes: number
    active_modes: number
    error_modes: number
  }
}

interface HealthData {
  health_checks: HealthCheck[]
  summary: {
    total_checks: number
    healthy_count: number
    warning_count: number
    critical_count: number
  }
}

export function DeploymentManager() {
  const { user } = useAuth()
  const { addToast } = useToast()
  const [deploymentStatus, setDeploymentStatus] = useState<DeploymentStatus | null>(null)
  const [healthData, setHealthData] = useState<HealthData | null>(null)
  const [downloads, setDownloads] = useState<DeploymentDownload[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [testingCommunication, setTestingCommunication] = useState(false)

  useEffect(() => {
    if (user) {
      loadDeploymentData()
    }
  }, [user])

  const loadDeploymentData = async () => {
    if (!user) return
    
    try {
      setRefreshing(true)
      
      // Fetch deployment status, health data, and downloads in parallel
      const [statusResult, healthResult, downloadsResult] = await Promise.all([
        supabase.functions.invoke('deployment-manager', {
          body: {},
          method: 'GET'
        }),
        supabase.functions.invoke('deployment-manager', {
          body: { action: 'health' },
          method: 'GET'
        }),
        supabase.functions.invoke('deployment-manager', {
          body: { action: 'downloads' },
          method: 'GET'
        })
      ])

      if (statusResult.data) {
        setDeploymentStatus(statusResult.data)
      }

      if (healthResult.data) {
        setHealthData(healthResult.data)
      }

      if (downloadsResult.data) {
        setDownloads(downloadsResult.data.downloads)
      }

    } catch (error: any) {
      console.error('Error loading deployment data:', error)
      addToast('Failed to load deployment data', 'error')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const performHealthCheck = async (deploymentMode: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('deployment-manager', {
        body: {
          deployment_mode: deploymentMode,
          check_type: 'connectivity'
        },
        method: 'POST'
      })

      if (error) {
        addToast(`Health check failed for ${deploymentMode}`, 'error')
        return
      }

      addToast(`Health check completed for ${deploymentMode}`, 'success')
      loadDeploymentData() // Refresh data
    } catch (error) {
      addToast('Health check failed', 'error')
    }
  }

  const deployMode = async (deploymentMode: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('deployment-manager', {
        body: {
          deployment_mode: deploymentMode,
          configuration: getDefaultConfiguration(deploymentMode)
        },
        method: 'POST'
      })

      if (error) {
        addToast(`Failed to deploy ${deploymentMode}`, 'error')
        return
      }

      addToast(`Deployment initiated for ${deploymentMode}`, 'success')
      loadDeploymentData() // Refresh data
    } catch (error) {
      addToast('Deployment failed', 'error')
    }
  }

  const testCommunication = async () => {
    setTestingCommunication(true)
    try {
      const { data, error } = await supabase.functions.invoke('deployment-manager', {
        body: {
          source_mode: 'web_app',
          target_mode: 'browser_extension',
          test_type: 'ping'
        },
        method: 'POST'
      })

      if (error || !data.success) {
        addToast('Communication test failed', 'error')
        return
      }

      addToast(`Communication test successful (${data.latency_ms}ms)`, 'success')
    } catch (error) {
      addToast('Communication test failed', 'error')
    } finally {
      setTestingCommunication(false)
    }
  }

  const getDefaultConfiguration = (mode: string) => {
    switch (mode) {
      case 'browser_extension':
        return {
          permissions: ['activeTab', 'storage', 'webNavigation'],
          supported_sites: ['*://*/*'],
          auto_inject: true
        }
      case 'hybrid_gateway':
        return {
          port: 8080,
          cors_enabled: true,
          websocket_enabled: true
        }
      case 'local_installation':
        return {
          install_path: '/usr/local/bin/ai-supervisor',
          service_enabled: true,
          auto_start: true
        }
      default:
        return {}
    }
  }

  const getDeploymentIcon = (mode: string) => {
    switch (mode) {
      case 'web_app':
        return <Globe className="h-6 w-6" />
      case 'browser_extension':
        return <Smartphone className="h-6 w-6" />
      case 'hybrid_gateway':
        return <Network className="h-6 w-6" />
      case 'local_installation':
        return <HardDrive className="h-6 w-6" />
      default:
        return <Monitor className="h-6 w-6" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-400 bg-green-900/20 border-green-700/50'
      case 'deploying':
        return 'text-blue-400 bg-blue-900/20 border-blue-700/50'
      case 'error':
        return 'text-red-400 bg-red-900/20 border-red-700/50'
      case 'maintenance':
        return 'text-yellow-400 bg-yellow-900/20 border-yellow-700/50'
      default:
        return 'text-gray-400 bg-gray-900/20 border-gray-700/50'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-5 w-5" />
      case 'deploying':
        return <Clock className="h-5 w-5 animate-spin" />
      case 'error':
        return <XCircle className="h-5 w-5" />
      case 'maintenance':
        return <AlertTriangle className="h-5 w-5" />
      default:
        return <Clock className="h-5 w-5" />
    }
  }

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'Unknown'
    const mb = bytes / (1024 * 1024)
    return `${mb.toFixed(1)} MB`
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-700 rounded-lg w-1/3"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
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
            <Settings className="h-6 w-6 text-blue-400" />
            <span>Deployment Manager</span>
          </h1>
          <p className="text-gray-400 mt-1">Centralized management of all deployment modes</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <button
            onClick={testCommunication}
            disabled={testingCommunication}
            className="flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-lg transition-colors"
          >
            {testingCommunication ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Testing...</span>
              </>
            ) : (
              <>
                <Wifi className="h-4 w-4" />
                <span>Test Communication</span>
              </>
            )}
          </button>
          
          <button
            onClick={loadDeploymentData}
            disabled={refreshing}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      {deploymentStatus && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">Total Deployment Modes</p>
                <p className="text-3xl font-bold text-white mt-1">{deploymentStatus.summary.total_modes}</p>
              </div>
              <div className="p-3 bg-blue-900/20 rounded-lg">
                <Monitor className="h-6 w-6 text-blue-400" />
              </div>
            </div>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">Active Deployments</p>
                <p className="text-3xl font-bold text-green-400 mt-1">{deploymentStatus.summary.active_modes}</p>
              </div>
              <div className="p-3 bg-green-900/20 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-400" />
              </div>
            </div>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">Error States</p>
                <p className="text-3xl font-bold text-red-400 mt-1">{deploymentStatus.summary.error_modes}</p>
              </div>
              <div className="p-3 bg-red-900/20 rounded-lg">
                <XCircle className="h-6 w-6 text-red-400" />
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Deployment Modes */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-white">Deployment Modes</h2>
          
          {deploymentStatus?.deployments.map((deployment) => (
            <div key={deployment.id} className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gray-700 rounded-lg">
                    {getDeploymentIcon(deployment.deployment_mode)}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white capitalize">
                      {deployment.deployment_mode.replace('_', ' ')}
                    </h3>
                    <p className="text-sm text-gray-400">Version {deployment.version}</p>
                  </div>
                </div>
                
                <div className={`px-3 py-1 rounded-full border flex items-center space-x-2 ${getStatusColor(deployment.status)}`}>
                  {getStatusIcon(deployment.status)}
                  <span className="text-sm font-medium capitalize">{deployment.status}</span>
                </div>
              </div>
              
              {deployment.deployment_url && (
                <div className="mb-4">
                  <a 
                    href={deployment.deployment_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    <ExternalLink className="h-4 w-4" />
                    <span className="text-sm">{deployment.deployment_url}</span>
                  </a>
                </div>
              )}
              
              <div className="flex items-center space-x-3">
                {deployment.status === 'inactive' && (
                  <button
                    onClick={() => deployMode(deployment.deployment_mode)}
                    className="flex items-center space-x-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                  >
                    <Play className="h-4 w-4" />
                    <span>Deploy</span>
                  </button>
                )}
                
                {deployment.status === 'active' && (
                  <button
                    onClick={() => performHealthCheck(deployment.deployment_mode)}
                    className="flex items-center space-x-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    <RefreshCw className="h-4 w-4" />
                    <span>Health Check</span>
                  </button>
                )}
                
                <div className="text-sm text-gray-400">
                  Updated: {new Date(deployment.updated_at).toLocaleString()}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Downloads & Communication Test */}
        <div className="space-y-6">
          {/* Downloads Section */}
          <div>
            <h2 className="text-lg font-semibold text-white mb-4">Download Packages</h2>
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <div className="space-y-4">
                {downloads.map((download) => (
                  <div key={download.id} className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-gray-600 rounded-lg">
                        <Download className="h-5 w-5 text-gray-300" />
                      </div>
                      <div>
                        <p className="text-white font-medium">{download.filename}</p>
                        <p className="text-sm text-gray-400">{download.description}</p>
                        <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                          <span>v{download.version}</span>
                          <span>{formatFileSize(download.file_size)}</span>
                        </div>
                      </div>
                    </div>
                    <button className="flex items-center space-x-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                      <Download className="h-4 w-4" />
                      <span>Download</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Health Status */}
          {healthData && (
            <div>
              <h2 className="text-lg font-semibold text-white mb-4">System Health</h2>
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-400">{healthData.summary.healthy_count}</p>
                    <p className="text-sm text-gray-400">Healthy</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-red-400">{healthData.summary.critical_count}</p>
                    <p className="text-sm text-gray-400">Critical</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  {healthData.health_checks.slice(0, 3).map((check) => (
                    <div key={check.id} className="flex items-center justify-between text-sm">
                      <span className="text-gray-300 capitalize">{check.check_type}</span>
                      <div className="flex items-center space-x-2">
                        {check.response_time_ms && (
                          <span className="text-gray-400">{check.response_time_ms}ms</span>
                        )}
                        <div className={`w-2 h-2 rounded-full ${
                          check.status === 'healthy' ? 'bg-green-500' :
                          check.status === 'warning' ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}