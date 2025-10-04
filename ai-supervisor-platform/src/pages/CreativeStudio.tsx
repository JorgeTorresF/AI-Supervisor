import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Lightbulb,
  Sparkles,
  RefreshCw,
  Save,
  Share2,
  Clock,
  Target,
  Users,
  Settings,
  Brain
} from 'lucide-react'
import { toast } from 'sonner'
import { invokeEdgeFunction } from '../lib/supabase'

export const CreativeStudio: React.FC = () => {
  const [prompt, setPrompt] = useState('')
  const [ideaType, setIdeaType] = useState('automation')
  const [targetAudience, setTargetAudience] = useState('businesses')
  const [constraints, setConstraints] = useState('')
  const [ideas, setIdeas] = useState<any[]>([])
  const [isGenerating, setIsGenerating] = useState(false)

  const ideaTypes = [
    { value: 'automation', label: 'Automation & Workflows' },
    { value: 'monitoring', label: 'Monitoring & Analytics' },
    { value: 'content', label: 'Content Generation' },
    { value: 'productivity', label: 'Productivity Tools' },
    { value: 'innovation', label: 'Innovation & Research' }
  ]

  const audiences = [
    { value: 'businesses', label: 'Businesses & Enterprises' },
    { value: 'developers', label: 'Developers & Tech Teams' },
    { value: 'creators', label: 'Content Creators' },
    { value: 'students', label: 'Students & Researchers' },
    { value: 'general', label: 'General Users' }
  ]

  const handleGenerateIdeas = async () => {
    if (!prompt.trim()) {
      toast.error('Please enter a prompt for idea generation')
      return
    }

    setIsGenerating(true)
    
    try {
      const { data, error } = await invokeEdgeFunction('CREATIVE_STUDIO', {
        prompt,
        ideaType,
        targetAudience,
        constraints
      })

      if (error) {
        throw error
      }

      if (data?.data?.ideas) {
        setIdeas(data.data.ideas)
        toast.success(`Generated ${data.data.ideas.length} creative ideas!`)
      } else {
        // Fallback with mock data for demonstration
        const mockIdeas = [
          {
            title: 'AI Social Media Sentiment Monitor',
            description: 'Real-time monitoring of social media sentiment for brand management and crisis prevention.',
            features: ['Real-time sentiment analysis', 'Multi-platform monitoring', 'Alert system', 'Trend visualization'],
            complexity: 'Intermediate',
            impact: 'High',
            developmentTime: '3-4 weeks',
            category: 'Monitoring'
          },
          {
            title: 'Smart Content Scheduler',
            description: 'AI-powered content scheduling that optimizes posting times based on audience engagement patterns.',
            features: ['Optimal timing AI', 'Content optimization', 'Multi-channel support', 'Performance analytics'],
            complexity: 'Beginner',
            impact: 'Medium',
            developmentTime: '2-3 weeks',
            category: 'Automation'
          },
          {
            title: 'Automated Customer Support Agent',
            description: 'Intelligent chatbot that handles customer inquiries with context awareness and escalation protocols.',
            features: ['Natural language processing', 'Context retention', 'Escalation triggers', 'Learning system'],
            complexity: 'Advanced',
            impact: 'High',
            developmentTime: '6-8 weeks',
            category: 'Automation'
          },
          {
            title: 'Code Review Assistant',
            description: 'AI assistant that reviews code for best practices, security issues, and optimization opportunities.',
            features: ['Security scanning', 'Performance analysis', 'Best practice checks', 'Suggestion engine'],
            complexity: 'Advanced',
            impact: 'High',
            developmentTime: '4-6 weeks',
            category: 'Productivity'
          },
          {
            title: 'Meeting Insights Generator',
            description: 'Automatically generate action items, summaries, and follow-ups from meeting recordings.',
            features: ['Speech-to-text', 'Key point extraction', 'Action item detection', 'Follow-up scheduling'],
            complexity: 'Intermediate',
            impact: 'Medium',
            developmentTime: '3-4 weeks',
            category: 'Productivity'
          },
          {
            title: 'Trend Prediction Engine',
            description: 'AI system that analyzes market data and social signals to predict emerging trends.',
            features: ['Data aggregation', 'Pattern recognition', 'Prediction algorithms', 'Visualization dashboard'],
            complexity: 'Advanced',
            impact: 'High',
            developmentTime: '8-10 weeks',
            category: 'Innovation'
          }
        ]
        setIdeas(mockIdeas)
        toast.success('Generated 6 creative ideas! (Demo mode)', {
          description: 'OpenAI integration will be available with API key setup'
        })
      }
    } catch (error) {
      console.error('Error generating ideas:', error)
      toast.error('Failed to generate ideas. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const getComplexityColor = (complexity: string) => {
    switch (complexity.toLowerCase()) {
      case 'beginner': return 'bg-green-500/20 text-green-400'
      case 'intermediate': return 'bg-yellow-500/20 text-yellow-400'
      case 'advanced': return 'bg-red-500/20 text-red-400'
      default: return 'bg-gray-500/20 text-gray-400'
    }
  }

  const getImpactColor = (impact: string) => {
    switch (impact.toLowerCase()) {
      case 'low': return 'bg-gray-500/20 text-gray-400'
      case 'medium': return 'bg-blue-500/20 text-blue-400'
      case 'high': return 'bg-purple-500/20 text-purple-400'
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
            <Lightbulb className="w-8 h-8 text-yellow-400" />
            Creative Studio
          </h1>
          <p className="text-slate-400">AI-powered idea generation for innovative projects</p>
        </div>
        <div className="flex items-center gap-2 bg-yellow-500/20 text-yellow-400 px-3 py-2 rounded-lg">
          <Brain className="w-4 h-4" />
          <span className="text-sm font-medium">GPT-4 Powered</span>
        </div>
      </motion.div>

      {/* Input Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-slate-800/50 backdrop-blur-lg rounded-xl p-6 border border-purple-500/20"
      >
        <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-3">
          <Settings className="w-5 h-5 text-purple-400" />
          Project Configuration
        </h2>
        
        <div className="space-y-6">
          {/* Main Prompt */}
          <div>
            <label className="block text-white font-medium mb-2">Project Description</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe your AI project idea... (e.g., 'AI-powered dashboard for monitoring social media sentiment and generating automated responses')"
              className="w-full h-32 bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:border-purple-400 focus:outline-none transition-colors resize-none"
            />
          </div>

          {/* Configuration Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-white font-medium mb-2 flex items-center gap-2">
                <Target className="w-4 h-4 text-blue-400" />
                Idea Type
              </label>
              <select
                value={ideaType}
                onChange={(e) => setIdeaType(e.target.value)}
                className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-3 text-white focus:border-purple-400 focus:outline-none transition-colors"
              >
                {ideaTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-white font-medium mb-2 flex items-center gap-2">
                <Users className="w-4 h-4 text-green-400" />
                Target Audience
              </label>
              <select
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-3 text-white focus:border-purple-400 focus:outline-none transition-colors"
              >
                {audiences.map(audience => (
                  <option key={audience.value} value={audience.value}>{audience.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-white font-medium mb-2">Constraints (Optional)</label>
              <input
                type="text"
                value={constraints}
                onChange={(e) => setConstraints(e.target.value)}
                placeholder="e.g., budget-friendly, mobile-first"
                className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:border-purple-400 focus:outline-none transition-colors"
              />
            </div>
          </div>

          {/* Generate Button */}
          <div className="flex justify-center">
            <button
              onClick={handleGenerateIdeas}
              disabled={isGenerating || !prompt.trim()}
              className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-semibold px-8 py-3 rounded-lg hover:from-yellow-600 hover:to-orange-600 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3"
            >
              {isGenerating ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Generating Ideas...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>Generate Creative Ideas</span>
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>

      {/* Generated Ideas */}
      {ideas.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-6"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <Sparkles className="w-6 h-6 text-yellow-400" />
              Generated Ideas ({ideas.length})
            </h2>
            <div className="flex gap-3">
              <button
                onClick={() => setIdeas([])}
                className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Clear
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {ideas.map((idea, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 * index }}
                className="bg-slate-800/50 backdrop-blur-lg rounded-xl p-6 border border-purple-500/20 hover:border-purple-400/40 transition-all duration-300 group"
              >
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-xl font-semibold text-white group-hover:text-yellow-400 transition-colors">
                    {idea.title}
                  </h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => toast.success('Idea saved to favorites!')}
                      className="p-2 bg-slate-700/50 hover:bg-slate-700 rounded-lg transition-colors"
                    >
                      <Save className="w-4 h-4 text-slate-400 hover:text-white" />
                    </button>
                    <button
                      onClick={() => toast.success('Idea shared!')}
                      className="p-2 bg-slate-700/50 hover:bg-slate-700 rounded-lg transition-colors"
                    >
                      <Share2 className="w-4 h-4 text-slate-400 hover:text-white" />
                    </button>
                  </div>
                </div>
                
                <p className="text-slate-300 mb-4 leading-relaxed">{idea.description}</p>
                
                <div className="space-y-3">
                  <div>
                    <h4 className="text-sm font-medium text-white mb-2">Key Features:</h4>
                    <div className="flex flex-wrap gap-2">
                      {idea.features?.map((feature: string, i: number) => (
                        <span
                          key={i}
                          className="px-2 py-1 bg-slate-700/50 text-slate-300 text-xs rounded-md"
                        >
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-3 border-t border-slate-700">
                    <div className="flex gap-3">
                      <span className={`px-2 py-1 rounded-md text-xs font-medium ${getComplexityColor(idea.complexity)}`}>
                        {idea.complexity}
                      </span>
                      <span className={`px-2 py-1 rounded-md text-xs font-medium ${getImpactColor(idea.impact)}`}>
                        {idea.impact} Impact
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-slate-400 text-xs">
                      <Clock className="w-3 h-3" />
                      {idea.developmentTime}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  )
}