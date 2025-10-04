import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { Activity, Clock, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react'

interface AgentTask {
  id: string
  task_name: string
  current_status: string
  quality_score: number
  coherence_score: number
  completion_percentage: number
  started_at: string
  updated_at: string
}

export function TaskMonitoring() {
  const { user } = useAuth()
  const [tasks, setTasks] = useState<AgentTask[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchTasks()
    }
  }, [user])

  const fetchTasks = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('agent_tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(50)

      if (error) {
        console.error('Error fetching tasks:', error)
        return
      }

      setTasks(data || [])
    } catch (error) {
      console.error('Error fetching tasks:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-400 bg-green-900/20'
      case 'completed':
        return 'text-blue-400 bg-blue-900/20'
      case 'blocked':
        return 'text-red-400 bg-red-900/20'
      case 'needs_intervention':
        return 'text-yellow-400 bg-yellow-900/20'
      default:
        return 'text-gray-400 bg-gray-900/20'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <Activity className="h-4 w-4" />
      case 'completed':
        return <CheckCircle className="h-4 w-4" />
      case 'blocked':
        return <AlertTriangle className="h-4 w-4" />
      case 'needs_intervention':
        return <RefreshCw className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-700 rounded-lg w-1/3"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-700 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center space-x-2">
            <Activity className="h-6 w-6 text-green-400" />
            <span>Task Monitoring</span>
          </h1>
          <p className="text-gray-400 mt-1">Real-time supervision of AI agent tasks</p>
        </div>
        <button
          onClick={fetchTasks}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center space-x-2"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Refresh</span>
        </button>
      </div>

      {tasks.length === 0 ? (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-12 text-center">
          <Activity className="h-12 w-12 text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">No Tasks Found</h3>
          <p className="text-gray-400">Agent tasks will appear here once they start running.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {tasks.map((task) => (
            <div key={task.id} className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <h3 className="text-lg font-semibold text-white">{task.task_name}</h3>
                  <span className={`px-2 py-1 text-xs rounded-full flex items-center space-x-1 ${getStatusColor(task.current_status)}`}>
                    {getStatusIcon(task.current_status)}
                    <span className="capitalize">{task.current_status.replace('_', ' ')}</span>
                  </span>
                </div>
                <div className="text-sm text-gray-400">
                  Updated: {new Date(task.updated_at).toLocaleString()}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-400 mb-1">Quality Score</p>
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full"
                        style={{ width: `${task.quality_score * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-white font-medium">{Math.round(task.quality_score * 100)}%</span>
                  </div>
                </div>
                
                <div>
                  <p className="text-sm text-gray-400 mb-1">Coherence Score</p>
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${task.coherence_score * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-white font-medium">{Math.round(task.coherence_score * 100)}%</span>
                  </div>
                </div>
                
                <div>
                  <p className="text-sm text-gray-400 mb-1">Completion</p>
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-purple-500 h-2 rounded-full"
                        style={{ width: `${task.completion_percentage}%` }}
                      ></div>
                    </div>
                    <span className="text-white font-medium">{task.completion_percentage}%</span>
                  </div>
                </div>
              </div>
              
              <div className="text-sm text-gray-400">
                Started: {new Date(task.started_at).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}