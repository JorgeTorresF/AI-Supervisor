import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Activity,
  Brain,
  Code,
  Users,
  Zap,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  BarChart3,
  Lightbulb,
  Palette,
  Combine
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

export const Dashboard: React.FC = () => {
  const navigate = useNavigate()
  const [stats, setStats] = useState({
    totalIdeas: 0,
    generatedCode: 0,
    activeAgents: 0,
    combinedProjects: 0
  })

  useEffect(() => {
    // Simulate loading stats
    const timer = setTimeout(() => {
      setStats({
        totalIdeas: Math.floor(Math.random() * 50) + 10,
        generatedCode: Math.floor(Math.random() * 30) + 5,
        activeAgents: Math.floor(Math.random() * 10) + 2,
        combinedProjects: Math.floor(Math.random() * 8) + 1
      })
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  const quickActions = [
    {
      title: 'Generate Ideas',
      description: 'Create new AI project concepts',
      icon: Lightbulb,
      color: 'from-yellow-500 to-orange-500',
      path: '/creative-studio',
      action: () => {
        navigate('/creative-studio')
        toast.success('Navigating to Creative Studio')
      }
    },
    {
      title: 'Code Generation',
      description: 'Create aesthetic UI components',
      icon: Palette,
      color: 'from-purple-500 to-pink-500',
      path: '/aesthetic-forge',
      action: () => {
        navigate('/aesthetic-forge')
        toast.success('Opening Aesthetic Forge')
      }
    },
    {
      title: 'Manage Agents',
      description: 'Create and control AI agents',
      icon: Users,
      color: 'from-green-500 to-emerald-500',
      path: '/agent-slicer',
      action: () => {
        navigate('/agent-slicer')
        toast.success('Loading Agent Slicer')
      }
    },
    {
      title: 'Combine Projects',
      description: 'Merge AI systems intelligently',
      icon: Combine,
      color: 'from-indigo-500 to-purple-500',
      path: '/project-combiner',
      action: () => {
        navigate('/project-combiner')
        toast.success('Opening Project Combiner')
      }
    }
  ]

  const recentActivity = [
    { type: 'idea', title: 'AI Social Media Monitor generated', time: '2 minutes ago', status: 'success' },
    { type: 'code', title: 'Cyberpunk button component created', time: '5 minutes ago', status: 'success' },
    { type: 'agent', title: 'Content Analysis Agent deployed', time: '10 minutes ago', status: 'success' },
    { type: 'project', title: 'E-commerce + AI Chat combined', time: '15 minutes ago', status: 'success' },
    { type: 'system', title: 'Platform initialization complete', time: '1 hour ago', status: 'info' }
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">AI Supervisor Dashboard</h1>
          <p className="text-slate-400">Monitor and control your AI agent ecosystem</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-green-500/20 text-green-400 px-3 py-2 rounded-lg">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-sm font-medium">All Systems Active</span>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        <div className="bg-slate-800/50 backdrop-blur-lg rounded-xl p-6 border border-purple-500/20">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center">
              <Lightbulb className="w-6 h-6 text-white" />
            </div>
            <TrendingUp className="w-5 h-5 text-green-400" />
          </div>
          <h3 className="text-2xl font-bold text-white">{stats.totalIdeas}</h3>
          <p className="text-slate-400 text-sm">Creative Ideas Generated</p>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-lg rounded-xl p-6 border border-purple-500/20">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <Code className="w-6 h-6 text-white" />
            </div>
            <BarChart3 className="w-5 h-5 text-blue-400" />
          </div>
          <h3 className="text-2xl font-bold text-white">{stats.generatedCode}</h3>
          <p className="text-slate-400 text-sm">Code Components Created</p>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-lg rounded-xl p-6 border border-purple-500/20">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <Activity className="w-5 h-5 text-green-400" />
          </div>
          <h3 className="text-2xl font-bold text-white">{stats.activeAgents}</h3>
          <p className="text-slate-400 text-sm">Active AI Agents</p>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-lg rounded-xl p-6 border border-purple-500/20">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
              <Combine className="w-6 h-6 text-white" />
            </div>
            <Zap className="w-5 h-5 text-yellow-400" />
          </div>
          <h3 className="text-2xl font-bold text-white">{stats.combinedProjects}</h3>
          <p className="text-slate-400 text-sm">Combined Projects</p>
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-slate-800/50 backdrop-blur-lg rounded-xl p-6 border border-purple-500/20"
      >
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
          <Brain className="w-6 h-6 text-purple-400" />
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, index) => {
            const Icon = action.icon
            return (
              <motion.button
                key={action.title}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 * index }}
                onClick={action.action}
                className="bg-slate-700/50 hover:bg-slate-700 border border-slate-600 hover:border-purple-400 rounded-lg p-4 transition-all duration-300 group text-left"
              >
                <div className={`w-10 h-10 bg-gradient-to-br ${action.color} rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-semibold text-white mb-1">{action.title}</h3>
                <p className="text-slate-400 text-sm">{action.description}</p>
              </motion.button>
            )
          })}
        </div>
      </motion.div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-slate-800/50 backdrop-blur-lg rounded-xl p-6 border border-purple-500/20"
      >
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
          <Clock className="w-6 h-6 text-blue-400" />
          Recent Activity
        </h2>
        <div className="space-y-4">
          {recentActivity.map((activity, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 * index }}
              className="flex items-center gap-4 p-3 bg-slate-700/30 rounded-lg hover:bg-slate-700/50 transition-colors"
            >
              {activity.status === 'success' ? (
                <CheckCircle className="w-5 h-5 text-green-400" />
              ) : (
                <AlertCircle className="w-5 h-5 text-blue-400" />
              )}
              <div className="flex-1">
                <h4 className="text-white font-medium">{activity.title}</h4>
                <p className="text-slate-400 text-sm">{activity.time}</p>
              </div>
              <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                activity.status === 'success' 
                  ? 'bg-green-500/20 text-green-400' 
                  : 'bg-blue-500/20 text-blue-400'
              }`}>
                {activity.status === 'success' ? 'Completed' : 'Info'}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* System Status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        <div className="bg-slate-800/50 backdrop-blur-lg rounded-xl p-6 border border-green-500/20">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <h3 className="text-lg font-semibold text-white">OpenAI Integration</h3>
          </div>
          <p className="text-green-400 text-sm">Connected and operational</p>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-lg rounded-xl p-6 border border-blue-500/20">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            <h3 className="text-lg font-semibold text-white">Supabase Backend</h3>
          </div>
          <p className="text-blue-400 text-sm">All edge functions active</p>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-lg rounded-xl p-6 border border-purple-500/20">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
            <h3 className="text-lg font-semibold text-white">Platform Status</h3>
          </div>
          <p className="text-purple-400 text-sm">Ready for production</p>
        </div>
      </motion.div>
    </div>
  )
}