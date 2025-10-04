import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Combine,
  Plus,
  Layers,
  Zap,
  Download,
  Share2,
  CheckCircle,
  AlertCircle,
  Code,
  FileText,
  Archive
} from 'lucide-react'
import { toast } from 'sonner'
import { invokeEdgeFunction } from '../lib/supabase'

export const ProjectCombiner: React.FC = () => {
  const [projects, setProjects] = useState<any[]>([])
  const [selectedProjects, setSelectedProjects] = useState<any[]>([])
  const [combinationStrategy, setCombinationStrategy] = useState('intelligent_merge')
  const [targetFramework, setTargetFramework] = useState('react_typescript')
  const [isCombining, setIsCombining] = useState(false)
  const [combinedProject, setCombinedProject] = useState<any>(null)
  const [showProjectForm, setShowProjectForm] = useState(false)
  const [newProject, setNewProject] = useState({
    name: '',
    type: 'web_app',
    features: [],
    description: ''
  })

  const availableProjects = [
    {
      id: 1,
      name: 'E-commerce Dashboard',
      type: 'web_app',
      features: ['Product Management', 'Order Tracking', 'Analytics', 'User Authentication'],
      description: 'Complete e-commerce management system with real-time analytics',
      framework: 'React + TypeScript',
      status: 'ready'
    },
    {
      id: 2,
      name: 'AI Chat Assistant',
      type: 'ai_service',
      features: ['Natural Language Processing', 'Context Memory', 'Multi-language Support'],
      description: 'Intelligent chat assistant with contextual understanding',
      framework: 'Node.js + OpenAI',
      status: 'ready'
    },
    {
      id: 3,
      name: 'Social Media Monitor',
      type: 'monitoring',
      features: ['Real-time Tracking', 'Sentiment Analysis', 'Alert System', 'Reporting'],
      description: 'Advanced social media monitoring and analytics platform',
      framework: 'Python + FastAPI',
      status: 'ready'
    },
    {
      id: 4,
      name: 'Content Generator',
      type: 'ai_service',
      features: ['Text Generation', 'Image Creation', 'SEO Optimization', 'Multi-format Export'],
      description: 'AI-powered content creation and optimization tool',
      framework: 'React + OpenAI',
      status: 'ready'
    },
    {
      id: 5,
      name: 'Task Automation Engine',
      type: 'automation',
      features: ['Workflow Builder', 'API Integration', 'Scheduling', 'Error Handling'],
      description: 'Comprehensive task automation and workflow management',
      framework: 'Node.js + Express',
      status: 'ready'
    },
    {
      id: 6,
      name: 'Data Visualization Suite',
      type: 'analytics',
      features: ['Interactive Charts', 'Real-time Updates', 'Export Options', 'Custom Dashboards'],
      description: 'Advanced data visualization and dashboard creation tools',
      framework: 'React + D3.js',
      status: 'ready'
    }
  ]

  const combinationStrategies = [
    { value: 'intelligent_merge', label: 'Intelligent Merge', description: 'AI-powered smart integration' },
    { value: 'microservices', label: 'Microservices', description: 'Service-oriented architecture' },
    { value: 'modular_fusion', label: 'Modular Fusion', description: 'Component-based integration' },
    { value: 'api_gateway', label: 'API Gateway', description: 'Centralized API management' }
  ]

  const targetFrameworks = [
    { value: 'react_typescript', label: 'React + TypeScript', description: 'Modern web framework' },
    { value: 'next_js', label: 'Next.js', description: 'Full-stack React framework' },
    { value: 'vue_nuxt', label: 'Vue + Nuxt', description: 'Progressive web framework' },
    { value: 'angular', label: 'Angular', description: 'Enterprise web platform' },
    { value: 'node_express', label: 'Node.js + Express', description: 'Backend API framework' }
  ]

  useEffect(() => {
    setProjects(availableProjects)
  }, [])

  const handleProjectSelect = (project: any) => {
    if (selectedProjects.find(p => p.id === project.id)) {
      setSelectedProjects(selectedProjects.filter(p => p.id !== project.id))
    } else {
      setSelectedProjects([...selectedProjects, project])
    }
  }

  const handleCombineProjects = async () => {
    if (selectedProjects.length < 2) {
      toast.error('Please select at least 2 projects to combine')
      return
    }

    setIsCombining(true)

    try {
      const { data, error } = await invokeEdgeFunction('PROJECT_COMBINER', {
        action: 'combine_projects',
        projects: selectedProjects,
        combinationStrategy,
        targetFramework
      })

      if (data?.data?.combinedProject) {
        setCombinedProject(data.data)
        toast.success('Projects combined successfully!')
      } else {
        // Fallback with mock data
        const mockCombination = {
          combinedProject: {
            name: `${selectedProjects[0].name} + ${selectedProjects[1].name}${selectedProjects.length > 2 ? ` + ${selectedProjects.length - 2} more` : ''}`,
            description: `Intelligent combination of ${selectedProjects.length} projects using ${combinationStrategy} strategy`,
            architecture: 'Microservices architecture with API gateway pattern, featuring modular components and scalable data flow',
            components: ['Unified Dashboard', 'API Gateway', 'Authentication Service', 'Data Processing Engine', 'Notification System'],
            integrationPoints: ['REST APIs', 'WebSocket Connections', 'Database Sync', 'Real-time Events'],
            features: selectedProjects.flatMap(p => p.features).slice(0, 8)
          },
          integrationPlan: {
            steps: [
              'Analyze project dependencies and APIs',
              'Create unified data models and schemas',
              'Implement API gateway and routing',
              'Integrate authentication and authorization',
              'Merge frontend components and UI',
              'Set up data synchronization',
              'Implement cross-service communication',
              'Testing and quality assurance',
              'Deployment and monitoring setup'
            ],
            timeline: '6-8 weeks',
            challenges: ['Data model conflicts', 'API compatibility', 'UI consistency'],
            solutions: ['Unified schema mapping', 'API adapters', 'Design system implementation']
          },
          codeStructure: {
            directories: {
              '/src/components': 'Unified React components',
              '/src/services': 'API service integrations',
              '/src/stores': 'State management',
              '/api/gateway': 'API gateway configuration',
              '/api/services': 'Microservices endpoints'
            },
            keyFiles: ['App.tsx', 'api-gateway.ts', 'unified-schema.ts', 'integration-config.ts'],
            dependencies: ['react', 'typescript', 'express', 'socket.io', 'prisma']
          },
          sourceProjects: selectedProjects
        }
        setCombinedProject(mockCombination)
        toast.success('Projects combined! (Demo mode)', {
          description: 'Full AI integration available with API key setup'
        })
      }
    } catch (error) {
      console.error('Error combining projects:', error)
      toast.error('Failed to combine projects. Please try again.')
    } finally {
      setIsCombining(false)
    }
  }

  const getProjectTypeColor = (type: string) => {
    switch (type) {
      case 'web_app': return 'bg-blue-500/20 text-blue-400'
      case 'ai_service': return 'bg-purple-500/20 text-purple-400'
      case 'monitoring': return 'bg-green-500/20 text-green-400'
      case 'automation': return 'bg-yellow-500/20 text-yellow-400'
      case 'analytics': return 'bg-cyan-500/20 text-cyan-400'
      default: return 'bg-gray-500/20 text-gray-400'
    }
  }

  const downloadCombinedProject = () => {
    if (!combinedProject) return

    const projectData = {
      ...combinedProject,
      generatedAt: new Date().toISOString(),
      strategy: combinationStrategy,
      framework: targetFramework
    }

    const blob = new Blob([JSON.stringify(projectData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${combinedProject.combinedProject.name.replace(/\s+/g, '-').toLowerCase()}-combination.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    toast.success('Project combination downloaded!')
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
            <Combine className="w-8 h-8 text-indigo-400" />
            Project Combiner
          </h1>
          <p className="text-slate-400">Intelligently merge multiple AI projects into unified systems</p>
        </div>
        <div className="flex items-center gap-2 bg-indigo-500/20 text-indigo-400 px-3 py-2 rounded-lg">
          <Zap className="w-4 h-4" />
          <span className="text-sm font-medium">AI-Powered Integration</span>
        </div>
      </motion.div>

      {/* Configuration */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-slate-800/50 backdrop-blur-lg rounded-xl p-6 border border-indigo-500/20"
      >
        <h2 className="text-xl font-semibold text-white mb-6">Combination Configuration</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-white font-medium mb-2">Combination Strategy</label>
            <select
              value={combinationStrategy}
              onChange={(e) => setCombinationStrategy(e.target.value)}
              className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-3 text-white focus:border-indigo-400 focus:outline-none transition-colors"
            >
              {combinationStrategies.map(strategy => (
                <option key={strategy.value} value={strategy.value}>
                  {strategy.label} - {strategy.description}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-white font-medium mb-2">Target Framework</label>
            <select
              value={targetFramework}
              onChange={(e) => setTargetFramework(e.target.value)}
              className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-3 text-white focus:border-indigo-400 focus:outline-none transition-colors"
            >
              {targetFrameworks.map(framework => (
                <option key={framework.value} value={framework.value}>
                  {framework.label} - {framework.description}
                </option>
              ))}
            </select>
          </div>
        </div>
      </motion.div>

      {/* Project Selection */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-slate-800/50 backdrop-blur-lg rounded-xl p-6 border border-indigo-500/20"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white flex items-center gap-3">
            <Layers className="w-5 h-5 text-indigo-400" />
            Available Projects ({selectedProjects.length} selected)
          </h2>
          <button
            onClick={handleCombineProjects}
            disabled={isCombining || selectedProjects.length < 2}
            className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold px-6 py-3 rounded-lg hover:from-indigo-600 hover:to-purple-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isCombining ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Combining...
              </>
            ) : (
              <>
                <Combine className="w-4 h-4" />
                Combine Projects
              </>
            )}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project, index) => {
            const isSelected = selectedProjects.find(p => p.id === project.id)
            return (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 * index }}
                onClick={() => handleProjectSelect(project)}
                className={`p-6 rounded-xl border-2 cursor-pointer transition-all duration-300 ${
                  isSelected
                    ? 'border-indigo-400 bg-indigo-500/20'
                    : 'border-slate-600 bg-slate-700/30 hover:border-slate-500'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-1">{project.name}</h3>
                    <span className={`px-2 py-1 rounded-md text-xs font-medium ${getProjectTypeColor(project.type)}`}>
                      {project.type.replace('_', ' ')}
                    </span>
                  </div>
                  {isSelected && (
                    <CheckCircle className="w-6 h-6 text-indigo-400" />
                  )}
                </div>
                
                <p className="text-slate-300 text-sm mb-4 leading-relaxed">{project.description}</p>
                
                <div className="space-y-3">
                  <div>
                    <h4 className="text-sm font-medium text-white mb-2">Features:</h4>
                    <div className="flex flex-wrap gap-2">
                      {project.features.slice(0, 3).map((feature: string, i: number) => (
                        <span
                          key={i}
                          className="px-2 py-1 bg-slate-700/50 text-slate-300 text-xs rounded-md"
                        >
                          {feature}
                        </span>
                      ))}
                      {project.features.length > 3 && (
                        <span className="px-2 py-1 bg-slate-700/50 text-slate-400 text-xs rounded-md">
                          +{project.features.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-3 border-t border-slate-700">
                    <div className="text-slate-400 text-xs">{project.framework}</div>
                    <div className="flex items-center gap-1 text-green-400 text-xs">
                      <CheckCircle className="w-3 h-3" />
                      {project.status}
                    </div>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </motion.div>

      {/* Combined Project Result */}
      {combinedProject && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-6"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <Archive className="w-6 h-6 text-indigo-400" />
              Combined Project Result
            </h2>
            <div className="flex gap-3">
              <button
                onClick={downloadCombinedProject}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                Download
              </button>
              <button
                onClick={() => toast.success('Project shared!')}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Share2 className="w-4 h-4" />
                Share
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Project Overview */}
            <div className="bg-slate-800/50 backdrop-blur-lg rounded-xl p-6 border border-indigo-500/20">
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-3">
                <FileText className="w-5 h-5 text-indigo-400" />
                Project Overview
              </h3>
              
              <div className="space-y-4">
                <div>
                  <h4 className="text-white font-medium mb-2">Name:</h4>
                  <p className="text-slate-300">{combinedProject.combinedProject.name}</p>
                </div>
                
                <div>
                  <h4 className="text-white font-medium mb-2">Description:</h4>
                  <p className="text-slate-300 leading-relaxed">{combinedProject.combinedProject.description}</p>
                </div>
                
                <div>
                  <h4 className="text-white font-medium mb-2">Architecture:</h4>
                  <p className="text-slate-300 leading-relaxed">{combinedProject.combinedProject.architecture}</p>
                </div>
                
                <div>
                  <h4 className="text-white font-medium mb-2">Key Features:</h4>
                  <div className="flex flex-wrap gap-2">
                    {combinedProject.combinedProject.features?.map((feature: string, i: number) => (
                      <span
                        key={i}
                        className="px-2 py-1 bg-indigo-500/20 text-indigo-300 text-sm rounded-md"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Integration Plan */}
            <div className="bg-slate-800/50 backdrop-blur-lg rounded-xl p-6 border border-indigo-500/20">
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-3">
                <Code className="w-5 h-5 text-green-400" />
                Integration Plan
              </h3>
              
              <div className="space-y-4">
                <div>
                  <h4 className="text-white font-medium mb-2">Timeline:</h4>
                  <p className="text-slate-300">{combinedProject.integrationPlan.timeline}</p>
                </div>
                
                <div>
                  <h4 className="text-white font-medium mb-2">Implementation Steps:</h4>
                  <div className="space-y-2">
                    {combinedProject.integrationPlan.steps?.slice(0, 5).map((step: string, i: number) => (
                      <div key={i} className="flex items-start gap-3">
                        <div className="w-6 h-6 bg-indigo-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                          {i + 1}
                        </div>
                        <span className="text-slate-300 text-sm">{step}</span>
                      </div>
                    ))}
                    {combinedProject.integrationPlan.steps?.length > 5 && (
                      <div className="text-slate-400 text-sm ml-9">
                        +{combinedProject.integrationPlan.steps.length - 5} more steps...
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <h4 className="text-white font-medium mb-2">Challenges & Solutions:</h4>
                  <div className="space-y-2">
                    {combinedProject.integrationPlan.challenges?.map((challenge: string, i: number) => (
                      <div key={i} className="flex items-start gap-3">
                        <AlertCircle className="w-4 h-4 text-yellow-400 mt-0.5" />
                        <div>
                          <span className="text-slate-300 text-sm">{challenge}</span>
                          {combinedProject.integrationPlan.solutions?.[i] && (
                            <div className="flex items-start gap-2 mt-1 ml-2">
                              <CheckCircle className="w-3 h-3 text-green-400 mt-0.5" />
                              <span className="text-green-300 text-xs">{combinedProject.integrationPlan.solutions[i]}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}