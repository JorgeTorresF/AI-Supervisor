import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { invokeEdgeFunction, EDGE_FUNCTIONS } from '@/lib/supabase'
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
  AlertCircle,
  RefreshCw,
  Play,
  Pause,
  Settings
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

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
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [notifications, setNotifications] = useState<Array<any>>([])

  const fetchDashboardStats = async () => {
    if (!user) return
    
    try {
      setRefreshing(true)
      
      const data = await invokeEdgeFunction(EDGE_FUNCTIONS.ANALYTICS_GENERATOR, {})

      if (data?.data) {
        setStats(data.data.summary)
        setLastUpdated(new Date())
      }
    } catch (error: any) {
      console.error('Error fetching dashboard stats:', error)
      // Set mock data for demonstration
      setStats({
        overview: {
          total_agents: 12,
          active_agents: 8,
          total_tasks: 245,
          active_tasks: 23,
          total_interventions: 15,
          total_activities: 1289,
          total_idea_validations: 67
        },
        health_scores: {
          avg_task_quality: 0.89,
          avg_task_coherence: 0.92,
          intervention_success_rate: 0.94,
          avg_idea_feasibility: 8.3
        },
        status_breakdown: {
          tasks: {
            active: 23,
            completed: 198,
            blocked: 3,
            needs_intervention: 2
          },
          interventions: {},
          activities: {},
          idea_risks: {}
        },
        recent_activity: [
          { type: 'task_completed', timestamp: new Date().toISOString(), content: 'Agent AI-007 completed data analysis task' },
          { type: 'intervention_triggered', timestamp: new Date().toISOString(), content: 'Automatic intervention for Agent AI-003 coherence drift' },
          { type: 'idea_validated', timestamp: new Date().toISOString(), content: 'New project idea validated with score 8.5/10' }
        ]
      })
      setLastUpdated(new Date())
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
          <h1 className="text-3xl font-bold text-white flex items-center">
            <Brain className="h-8 w-8 text-cyan-400 mr-3" />
            Mission Control Dashboard
          </h1>
          <p className="text-gray-400 mt-1">Real-time AI agent supervision and monitoring</p>
        </div>
        <div className="flex items-center space-x-4">
          {lastUpdated && (
            <div className="text-sm text-gray-400">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </div>
          )}
          <Button
            onClick={fetchDashboardStats}
            disabled={refreshing}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {stats && (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-6">
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
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-6">
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
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-6">
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
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-6">
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
              </CardContent>
            </Card>
          </div>

          {/* Health Scores */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className={`border ${getHealthBg(stats.health_scores.avg_task_quality)}`}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-gray-300 text-sm font-medium">Task Quality</p>
                  <TrendingUp className={`h-4 w-4 ${getHealthColor(stats.health_scores.avg_task_quality)}`} />
                </div>
                <p className={`text-2xl font-bold ${getHealthColor(stats.health_scores.avg_task_quality)}`}>
                  {Math.round(stats.health_scores.avg_task_quality * 100)}%
                </p>
              </CardContent>
            </Card>

            <Card className={`border ${getHealthBg(stats.health_scores.avg_task_coherence)}`}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-gray-300 text-sm font-medium">Task Coherence</p>
                  <Zap className={`h-4 w-4 ${getHealthColor(stats.health_scores.avg_task_coherence)}`} />
                </div>
                <p className={`text-2xl font-bold ${getHealthColor(stats.health_scores.avg_task_coherence)}`}>
                  {Math.round(stats.health_scores.avg_task_coherence * 100)}%
                </p>
              </CardContent>
            </Card>

            <Card className={`border ${getHealthBg(stats.health_scores.intervention_success_rate)}`}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-gray-300 text-sm font-medium">Intervention Success</p>
                  <CheckCircle className={`h-4 w-4 ${getHealthColor(stats.health_scores.intervention_success_rate)}`} />
                </div>
                <p className={`text-2xl font-bold ${getHealthColor(stats.health_scores.intervention_success_rate)}`}>
                  {Math.round(stats.health_scores.intervention_success_rate * 100)}%
                </p>
              </CardContent>
            </Card>

            <Card className={`border ${getHealthBg(stats.health_scores.avg_idea_feasibility / 10)}`}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-gray-300 text-sm font-medium">Idea Feasibility</p>
                  <Eye className={`h-4 w-4 ${getHealthColor(stats.health_scores.avg_idea_feasibility / 10)}`} />
                </div>
                <p className={`text-2xl font-bold ${getHealthColor(stats.health_scores.avg_idea_feasibility / 10)}`}>
                  {stats.health_scores.avg_idea_feasibility.toFixed(1)}/10
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Task Status & Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Task Status Breakdown */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Activity className="h-5 w-5 text-cyan-400 mr-2" />
                  Task Status Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                      <span className="text-gray-300">Active</span>
                    </div>
                    <span className="text-white font-semibold">{stats.status_breakdown.tasks.active}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                      <span className="text-gray-300">Completed</span>
                    </div>
                    <span className="text-white font-semibold">{stats.status_breakdown.tasks.completed}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-red-500 rounded-full mr-3"></div>
                      <span className="text-gray-300">Blocked</span>
                    </div>
                    <span className="text-white font-semibold">{stats.status_breakdown.tasks.blocked}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full mr-3"></div>
                      <span className="text-gray-300">Needs Intervention</span>
                    </div>
                    <span className="text-white font-semibold">{stats.status_breakdown.tasks.needs_intervention}</span>
                  </div>
                </div>
                
                <div className="mt-6">
                  <Button className="w-full bg-cyan-600 hover:bg-cyan-700">
                    <Settings className="h-4 w-4 mr-2" />
                    Manage Tasks
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Clock className="h-5 w-5 text-purple-400 mr-2" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats.recent_activity.map((activity, index) => (
                    <div key={index} className="flex items-start space-x-3 p-3 bg-gray-900/50 rounded-lg">
                      <div className={`w-2 h-2 rounded-full mt-2 ${
                        activity.type === 'task_completed' ? 'bg-green-400' :
                        activity.type === 'intervention_triggered' ? 'bg-yellow-400' :
                        'bg-purple-400'
                      }`}></div>
                      <div className="flex-1">
                        <p className="text-gray-300 text-sm">{activity.content}</p>
                        <p className="text-gray-500 text-xs mt-1">
                          {new Date(activity.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-6">
                  <Button variant="outline" className="w-full border-gray-600 text-gray-300 hover:bg-gray-700">
                    View All Activity
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card className="bg-gradient-to-r from-gray-800 to-gray-900 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white text-center">
                <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                  Quick Actions
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Button className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 p-6 h-auto flex-col">
                  <Brain className="h-8 w-8 mb-2" />
                  <span>Idea Validator</span>
                  <span className="text-xs opacity-80 mt-1">Validate new project ideas</span>
                </Button>
                
                <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 p-6 h-auto flex-col">
                  <Zap className="h-8 w-8 mb-2" />
                  <span>Creative Expander</span>
                  <span className="text-xs opacity-80 mt-1">AI-powered brainstorming</span>
                </Button>
                
                <Button className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 p-6 h-auto flex-col">
                  <Eye className="h-8 w-8 mb-2" />
                  <span>Simsplicer Forge</span>
                  <span className="text-xs opacity-80 mt-1">Aesthetic code generation</span>
                </Button>
                
                <Button className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 p-6 h-auto flex-col">
                  <Settings className="h-8 w-8 mb-2" />
                  <span>Agent Manager</span>
                  <span className="text-xs opacity-80 mt-1">Manage AI agents</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
