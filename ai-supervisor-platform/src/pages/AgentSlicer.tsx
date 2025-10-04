import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Users,
  Plus,
  Settings,
  Activity,
  Brain,
  Zap,
  Code,
  Trash2,
  Edit3,
  Play,
  Pause,
  Download
} from 'lucide-react'
import { toast } from 'sonner'
import { invokeEdgeFunction } from '../lib/supabase'

export const AgentSlicer: React.FC = () => {
  const [agents, setAgents] = useState<any[]>([])
  const [isCreating, setIsCreating] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newAgent, setNewAgent] = useState({
    name: '',
    type: 'assistant',
    capabilities: [],
    personality: 'professional',
    specialization: ''
  })

  const agentTypes = [
    { value: 'assistant', label: 'Virtual Assistant', icon: Brain },
    { value: 'monitor', label: 'Monitoring Agent', icon: Activity },
    { value: 'processor', label: 'Data Processor', icon: Zap },
    { value: 'analyzer', label: 'Content Analyzer', icon: Settings }
  ]

  const capabilityOptions = [
    'Natural Language Processing',
    'Data Analysis',
    'Real-time Monitoring',
    'Task Automation',
    'Content Generation',
    'Image Processing',
    'API Integration',
    'Notification System',
    'Report Generation',
    'User Interaction'
  ]

  const personalityTypes = [
    { value: 'professional', label: 'Professional & Formal' },
    { value: 'friendly', label: 'Friendly & Casual' },
    { value: 'analytical', label: 'Analytical & Data-Driven' },
    { value: 'creative', label: 'Creative & Innovative' },
    { value: 'technical', label: 'Technical & Precise' }
  ]

  useEffect(() => {
    loadAgents()
  }, [])

  const loadAgents = async () => {
    try {
      const { data, error } = await invokeEdgeFunction('AGENT_SLICER', {
        action: 'list_agents'
      })

      if (data?.data?.agents) {
        setAgents(data.data.agents)
      } else {
        // Mock data for demonstration
        setAgents([
          {
            id: 1,
            name: 'Content Monitor',
            type: 'monitor',
            capabilities: ['Real-time Monitoring', 'Content Analysis', 'Alert System'],
            personality: 'analytical',
            specialization: 'Social media monitoring and sentiment analysis',
            status: 'active',
            created_at: '2024-01-15T10:30:00Z'
          },
          {
            id: 2,
            name: 'Task Automator',
            type: 'processor',
            capabilities: ['Task Automation', 'API Integration', 'Report Generation'],
            personality: 'professional',
            specialization: 'Workflow automation and task scheduling',
            status: 'active',
            created_at: '2024-01-14T15:20:00Z'
          },
          {
            id: 3,
            name: 'Creative Assistant',
            type: 'assistant',
            capabilities: ['Content Generation', 'Creative Writing', 'Idea Generation'],
            personality: 'creative',
            specialization: 'Creative content creation and brainstorming',
            status: 'paused',
            created_at: '2024-01-13T09:15:00Z'
          }
        ])
      }
    } catch (error) {
      console.error('Error loading agents:', error)
      toast.error('Failed to load agents')
    }
  }

  const handleCreateAgent = async () => {
    if (!newAgent.name.trim()) {
      toast.error('Please provide an agent name')
      return
    }

    if (newAgent.capabilities.length === 0) {
      toast.error('Please select at least one capability')
      return
    }

    setIsCreating(true)

    try {
      const { data, error } = await invokeEdgeFunction('AGENT_SLICER', {
        action: 'create_agent',
        agentConfig: newAgent
      })

      if (data?.data?.agent) {
        setAgents([data.data.agent, ...agents])
        toast.success('Agent created successfully!')
      } else {
        // Fallback for demo
        const mockAgent = {
          id: Date.now(),
          ...newAgent,
          status: 'active',
          created_at: new Date().toISOString()
        }
        setAgents([mockAgent, ...agents])
        toast.success('Agent created! (Demo mode)')
      }

      setShowCreateForm(false)
      setNewAgent({
        name: '',
        type: 'assistant',
        capabilities: [],
        personality: 'professional',
        specialization: ''
      })
    } catch (error) {
      console.error('Error creating agent:', error)
      toast.error('Failed to create agent')
    } finally {
      setIsCreating(false)
    }
  }

  const toggleAgentStatus = (agentId: number) => {
    setAgents(agents.map(agent => 
      agent.id === agentId 
        ? { ...agent, status: agent.status === 'active' ? 'paused' : 'active' }
        : agent
    ))
    toast.success('Agent status updated')
  }

  const deleteAgent = (agentId: number) => {
    setAgents(agents.filter(agent => agent.id !== agentId))
    toast.success('Agent deleted successfully')
  }

  const toggleCapability = (capability: string) => {
    setNewAgent({
      ...newAgent,
      capabilities: newAgent.capabilities.includes(capability)
        ? newAgent.capabilities.filter(c => c !== capability)
        : [...newAgent.capabilities, capability]
    })
  }

  const getAgentTypeIcon = (type: string) => {
    const agentType = agentTypes.find(t => t.value === type)
    return agentType ? agentType.icon : Brain
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500/20 text-green-400'
      case 'paused': return 'bg-yellow-500/20 text-yellow-400'
      case 'error': return 'bg-red-500/20 text-red-400'
      default: return 'bg-gray-500/20 text-gray-400'
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <Users className="w-8 h-8 text-green-400" />
            Agent Slicer
          </h1>
          <p className="text-slate-400">Create and manage modular AI agents for specialized tasks</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-green-500/20 text-green-400 px-3 py-2 rounded-lg">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-sm font-medium">{agents.filter(a => a.status === 'active').length} Active</span>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold px-4 py-2 rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all duration-300 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Agent
          </button>
        </div>
      </motion.div>

      {/* Create Agent Form */}
      {showCreateForm && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-slate-800/50 backdrop-blur-lg rounded-xl p-6 border border-green-500/20"
        >
          <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-3">
            <Brain className="w-5 h-5 text-green-400" />
            Create New Agent
          </h2>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-white font-medium mb-2">Agent Name</label>
                <input
                  type="text"
                  value={newAgent.name}
                  onChange={(e) => setNewAgent({ ...newAgent, name: e.target.value })}
                  placeholder="e.g., Content Monitor, Task Automator"
                  className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:border-green-400 focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-white font-medium mb-2">Agent Type</label>
                <select
                  value={newAgent.type}
                  onChange={(e) => setNewAgent({ ...newAgent, type: e.target.value })}
                  className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-3 text-white focus:border-green-400 focus:outline-none transition-colors"
                >
                  {agentTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-white font-medium mb-2">Specialization</label>
              <textarea
                value={newAgent.specialization}
                onChange={(e) => setNewAgent({ ...newAgent, specialization: e.target.value })}
                placeholder="Describe what this agent specializes in..."
                className="w-full h-24 bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:border-green-400 focus:outline-none transition-colors resize-none"
              />
            </div>

            <div>
              <label className="block text-white font-medium mb-2">Personality</label>
              <select
                value={newAgent.personality}
                onChange={(e) => setNewAgent({ ...newAgent, personality: e.target.value })}
                className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-3 text-white focus:border-green-400 focus:outline-none transition-colors"
              >
                {personalityTypes.map(personality => (
                  <option key={personality.value} value={personality.value}>{personality.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-white font-medium mb-2">Capabilities</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {capabilityOptions.map(capability => (
                  <button
                    key={capability}
                    onClick={() => toggleCapability(capability)}
                    className={`p-3 rounded-lg border-2 transition-all duration-300 text-sm ${
                      newAgent.capabilities.includes(capability)
                        ? 'border-green-400 bg-green-500/20 text-green-300'
                        : 'border-slate-600 bg-slate-700/30 text-slate-300 hover:border-slate-500'
                    }`}
                  >
                    {capability}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={handleCreateAgent}
                disabled={isCreating}
                className="bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold px-6 py-3 rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all duration-300 disabled:opacity-50 flex items-center gap-2"
              >
                {isCreating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Create Agent
                  </>
                )}
              </button>
              <button
                onClick={() => setShowCreateForm(false)}
                className="bg-slate-700 text-white font-semibold px-6 py-3 rounded-lg hover:bg-slate-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Agents Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {agents.map((agent, index) => {
          const IconComponent = getAgentTypeIcon(agent.type)
          return (
            <motion.div
              key={agent.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 * index }}
              className="bg-slate-800/50 backdrop-blur-lg rounded-xl p-6 border border-green-500/20 hover:border-green-400/40 transition-all duration-300 group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                    <IconComponent className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white group-hover:text-green-400 transition-colors">
                      {agent.name}
                    </h3>
                    <span className={`px-2 py-1 rounded-md text-xs font-medium ${getStatusColor(agent.status)}`}>
                      {agent.status}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => toggleAgentStatus(agent.id)}
                    className="p-2 bg-slate-700/50 hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    {agent.status === 'active' ? (
                      <Pause className="w-4 h-4 text-yellow-400" />
                    ) : (
                      <Play className="w-4 h-4 text-green-400" />
                    )}
                  </button>
                  <button
                    onClick={() => deleteAgent(agent.id)}
                    className="p-2 bg-slate-700/50 hover:bg-red-600 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              </div>

              <p className="text-slate-300 text-sm mb-4 leading-relaxed">
                {agent.specialization}
              </p>

              <div className="space-y-3">
                <div>
                  <h4 className="text-sm font-medium text-white mb-2">Capabilities:</h4>
                  <div className="flex flex-wrap gap-2">
                    {agent.capabilities?.slice(0, 3).map((capability: string, i: number) => (
                      <span
                        key={i}
                        className="px-2 py-1 bg-slate-700/50 text-slate-300 text-xs rounded-md"
                      >
                        {capability}
                      </span>
                    ))}
                    {agent.capabilities?.length > 3 && (
                      <span className="px-2 py-1 bg-slate-700/50 text-slate-400 text-xs rounded-md">
                        +{agent.capabilities.length - 3} more
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-700">
                  <div className="text-slate-400 text-xs">
                    Created {new Date(agent.created_at).toLocaleDateString()}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => toast.info('Agent configuration panel coming soon!')}
                      className="p-1 bg-slate-700/50 hover:bg-slate-700 rounded transition-colors"
                    >
                      <Settings className="w-3 h-3 text-slate-400" />
                    </button>
                    <button
                      onClick={() => toast.info('Agent code export coming soon!')}
                      className="p-1 bg-slate-700/50 hover:bg-slate-700 rounded transition-colors"
                    >
                      <Download className="w-3 h-3 text-slate-400" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )
        })}
      </motion.div>

      {agents.length === 0 && !showCreateForm && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-16"
        >
          <Users className="w-16 h-16 text-slate-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No Agents Created Yet</h3>
          <p className="text-slate-400 mb-6">Create your first AI agent to get started with automated tasks</p>
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold px-6 py-3 rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all duration-300 flex items-center gap-2 mx-auto"
          >
            <Plus className="w-4 h-4" />
            Create Your First Agent
          </button>
        </motion.div>
      )}
    </div>
  )
}