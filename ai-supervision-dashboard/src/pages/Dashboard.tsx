import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase, EDGE_FUNCTIONS } from '@/lib/supabase'
import { useToast } from '@/components/ui/ToastProvider'
import { 
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
  Brain,
  Shield,
  TrendingUp,
  Zap,
  Eye,
  AlertCircle
} from 'lucide-react'

interface DashboardStats {
  overview: {
    total_agents: number
    active_agents: number
    total_tasks: number
    active_tasks: number
    total_interventions: number
    total_activities: number
    total_idea_validations: number
  }
  health_scores: {
    avg_task_quality: number
    avg_task_coherence: number
    intervention_success_rate: number
    avg_idea_feasibility: number
  }
  status_breakdown: {
    tasks: {
      active: number
      completed: number
      blocked: number
      needs_intervention: number
    }
    interventions: Record<string, number>
    activities: Record<string, number>
    idea_risks: Record<string, number>
  }
  recent_activity: Array<{
    type: string
    timestamp: string
    content: string
  }>
}

export function Dashboard() {
  const { user } = useAuth()
  const { addToast } = useToast()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const fetchDashboardStats = async () => {
    if (!user) return
    
    try {
      setRefreshing(true)
      
      const { data, error } = await supabase.functions.invoke('analytics-generator', {
        body: {}
      })

      if (error) {
        console.error('Error fetching dashboard stats:', error)
        addToast('Failed to load dashboard statistics', 'error')
        return
      }

      if (data?.data) {
        setStats(data.data.summary)
        setLastUpdated(new Date())
      }
    } catch (error: any) {
      console.error('Error fetching dashboard stats:', error)
      addToast('Failed to load dashboard statistics', 'error')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchDashboardStats()
    
    // Set up real-time updates every 30 seconds
    const interval = setInterval(fetchDashboardStats, 30000)
    
    return () => clearInterval(interval)
  }, [user])

  const getHealthColor = (score: number) => {
    if (score >= 0.8) return 'text-green-400'
    if (score >= 0.6) return 'text-yellow-400'
    return 'text-red-400'
  }

  const getHealthBg = (score: number) => {
    if (score >= 0.8) return 'bg-green-900/20 border-green-700/50'
    if (score >= 0.6) return 'bg-yellow-900/20 border-yellow-700/50'
    return 'bg-red-900/20 border-red-700/50'
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-700 rounded-lg w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-700 rounded-lg"></div>
            ))}
          </div>
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
          <h1 className="text-2xl font-bold text-white">Mission Control Dashboard</h1>
          <p className="text-gray-400 mt-1">Real-time AI agent supervision and monitoring</p>
        </div>
        <div className="flex items-center space-x-4">
          {lastUpdated && (
            <div className="text-sm text-gray-400">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </div>
          )}
          <button
            onClick={fetchDashboardStats}
            disabled={refreshing}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg transition-colors flex items-center space-x-2"
          >
            <Activity className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {stats && (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm font-medium">Active Agents</p>
                  <p className="text-3xl font-bold text-white mt-1">{stats.overview.active_agents}</p>
                  <p className="text-xs text-gray-500 mt-1">of {stats.overview.total_agents} total</p>
                </div>
                <div className="p-3 bg-blue-900/20 rounded-lg">
                  <Users className="h-6 w-6 text-blue-400" />
                </div>
              </div>
            </div>

            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm font-medium">Active Tasks</p>
                  <p className="text-3xl font-bold text-white mt-1">{stats.overview.active_tasks}</p>
                  <p className="text-xs text-gray-500 mt-1">of {stats.overview.total_tasks} total</p>
                </div>
                <div className="p-3 bg-green-900/20 rounded-lg">
                  <Activity className="h-6 w-6 text-green-400" />
                </div>
              </div>
            </div>

            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm font-medium">Interventions</p>
                  <p className="text-3xl font-bold text-white mt-1">{stats.overview.total_interventions}</p>
                  <p className="text-xs text-gray-500 mt-1">total actions taken</p>
                </div>
                <div className="p-3 bg-yellow-900/20 rounded-lg">
                  <Shield className="h-6 w-6 text-yellow-400" />
                </div>
              </div>
            </div>

            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm font-medium">Ideas Validated</p>
                  <p className="text-3xl font-bold text-white mt-1">{stats.overview.total_idea_validations}</p>
                  <p className="text-xs text-gray-500 mt-1">project assessments</p>
                </div>
                <div className="p-3 bg-purple-900/20 rounded-lg">
                  <Brain className="h-6 w-6 text-purple-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Health Scores */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className={`border rounded-lg p-6 ${getHealthBg(stats.health_scores.avg_task_quality)}`}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-gray-300 text-sm font-medium">Task Quality</p>
                <TrendingUp className={`h-4 w-4 ${getHealthColor(stats.health_scores.avg_task_quality)}`} />
              </div>
              <p className={`text-2xl font-bold ${getHealthColor(stats.health_scores.avg_task_quality)}`}>
                {Math.round(stats.health_scores.avg_task_quality * 100)}%
              </p>
            </div>

            <div className={`border rounded-lg p-6 ${getHealthBg(stats.health_scores.avg_task_coherence)}`}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-gray-300 text-sm font-medium">Task Coherence</p>
                <Zap className={`h-4 w-4 ${getHealthColor(stats.health_scores.avg_task_coherence)}`} />
              </div>
              <p className={`text-2xl font-bold ${getHealthColor(stats.health_scores.avg_task_coherence)}`}>
                {Math.round(stats.health_scores.avg_task_coherence * 100)}%
              </p>
            </div>

            <div className={`border rounded-lg p-6 ${getHealthBg(stats.health_scores.intervention_success_rate)}`}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-gray-300 text-sm font-medium">Intervention Success</p>
                <CheckCircle className={`h-4 w-4 ${getHealthColor(stats.health_scores.intervention_success_rate)}`} />
              </div>
              <p className={`text-2xl font-bold ${getHealthColor(stats.health_scores.intervention_success_rate)}`}>
                {Math.round(stats.health_scores.intervention_success_rate * 100)}%
              </p>
            </div>

            <div className={`border rounded-lg p-6 ${getHealthBg(stats.health_scores.avg_idea_feasibility / 10)}`}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-gray-300 text-sm font-medium">Idea Feasibility</p>
                <Eye className={`h-4 w-4 ${getHealthColor(stats.health_scores.avg_idea_feasibility / 10)}`} />
              </div>
              <p className={`text-2xl font-bold ${getHealthColor(stats.health_scores.avg_idea_feasibility / 10)}`}>
                {stats.health_scores.avg_idea_feasibility.toFixed(1)}/10
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Task Status Breakdown */}
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Task Status</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-gray-300">Active</span>
                  </div>
                  <span className="text-white font-semibold">{stats.status_breakdown.tasks.active}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="text-gray-300">Completed</span>
                  </div>
                  <span className="text-white font-semibold">{stats.status_breakdown.tasks.completed}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <span className="text-gray-300">Needs Intervention</span>
                  </div>
                  <span className="text-white font-semibold">{stats.status_breakdown.tasks.needs_intervention}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span className="text-gray-300">Blocked</span>
                  </div>
                  <span className="text-white font-semibold">{stats.status_breakdown.tasks.blocked}</span>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="lg:col-span-2 bg-gray-800 border border-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
              <div className="space-y-3">
                {stats.recent_activity.length === 0 ? (
                  <div className="text-center text-gray-400 py-8">
                    <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No recent activity</p>
                  </div>
                ) : (
                  stats.recent_activity.slice(0, 5).map((activity, index) => (
                    <div key={index} className="flex items-start space-x-3 p-3 bg-gray-700/50 rounded-lg">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white capitalize">{activity.type.replace('_', ' ')}</p>
                        <p className="text-xs text-gray-400 truncate">{activity.content}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(activity.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Alert Summary */}
          {(stats.status_breakdown.tasks.blocked > 0 || stats.status_breakdown.tasks.needs_intervention > 0) && (
            <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-lg p-6">
              <div className="flex items-center space-x-2 mb-3">
                <AlertTriangle className="h-5 w-5 text-yellow-400" />
                <h3 className="text-lg font-semibold text-yellow-100">Attention Required</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {stats.status_breakdown.tasks.needs_intervention > 0 && (
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="h-4 w-4 text-yellow-400" />
                    <span className="text-yellow-100">
                      {stats.status_breakdown.tasks.needs_intervention} task{stats.status_breakdown.tasks.needs_intervention !== 1 ? 's' : ''} need intervention
                    </span>
                  </div>
                )}
                {stats.status_breakdown.tasks.blocked > 0 && (
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="h-4 w-4 text-red-400" />
                    <span className="text-yellow-100">
                      {stats.status_breakdown.tasks.blocked} task{stats.status_breakdown.tasks.blocked !== 1 ? 's' : ''} blocked
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {!stats && !loading && (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-12 text-center">
          <Activity className="h-12 w-12 text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">No Data Available</h3>
          <p className="text-gray-400 mb-4">Dashboard statistics will appear once you start using the system.</p>
          <button
            onClick={fetchDashboardStats}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Refresh Dashboard
          </button>
        </div>
      )}
    </div>
  )
}