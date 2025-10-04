import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Lightbulb,
  Palette,
  Users,
  Combine,
  ChevronRight,
  Sparkles,
  Rocket,
  Brain,
  Zap
} from 'lucide-react'
import { toast } from 'sonner'

interface LandingPageProps {
  onSetupComplete: () => void
}

export const LandingPage: React.FC<LandingPageProps> = ({ onSetupComplete }) => {
  const [isLoading, setIsLoading] = useState(false)

  const features = [
    {
      icon: Lightbulb,
      title: 'Creative Studio',
      description: 'AI-powered idea generation using OpenAI GPT-4 for innovative project concepts',
      color: 'from-yellow-500 to-orange-500'
    },
    {
      icon: Palette,
      title: 'Aesthetic Forge',
      description: 'Generate beautiful code with 6 visual themes: cyberpunk, glitchcore, minimal, slushwave, vaporwave, brutalist',
      color: 'from-purple-500 to-pink-500'
    },
    {
      icon: Users,
      title: 'Agent Slicer',
      description: 'Modular AI agent management system for creating and controlling specialized agents',
      color: 'from-green-500 to-emerald-500'
    },
    {
      icon: Combine,
      title: 'Project Combiner',
      description: 'Intelligently combine multiple AI projects into unified, cohesive systems',
      color: 'from-indigo-500 to-purple-500'
    }
  ]

  const handleGetStarted = async () => {
    setIsLoading(true)
    
    // Simulate setup process
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    toast.success('Welcome to AI Supervisor Platform!', {
      description: 'Your platform is ready to use',
      duration: 3000,
    })
    
    setIsLoading(false)
    onSetupComplete()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiM4YjVjZjYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIxLjUiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-20" />
      
      <div className="relative z-10 container mx-auto px-6 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-white/10 backdrop-blur-sm border border-white/20">
              <img 
                src="/images/supervisor-ai-robot-logo.png" 
                alt="Supervisor AI Robot Logo" 
                className="w-12 h-12 object-contain"
              />
            </div>
            <h1 className="text-5xl font-bold text-white">
              AI Supervisor Agent Platform
            </h1>
          </div>
          
          <p className="text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
            The comprehensive platform for AI agent monitoring, creation, and management. 
            Build, combine, and control intelligent agents with real-time AI functionality.
          </p>
          
          <div className="flex items-center justify-center gap-2 mt-4 text-sm text-slate-400">
            <Sparkles className="w-4 h-4" />
            <span>Powered by OpenAI GPT-4</span>
            <span className="mx-2">•</span>
            <Brain className="w-4 h-4" />
            <span>Real-time AI Processing</span>
            <span className="mx-2">•</span>
            <Zap className="w-4 h-4" />
            <span>Instant Deployment</span>
          </div>
        </motion.div>

        {/* Video Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-16"
        >
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-white text-center mb-8">See AI Supervisor in Action</h2>
            <div className="bg-slate-800/50 backdrop-blur-lg rounded-2xl p-4 border border-purple-500/20">
              <div style={{paddingBottom: '56.25%', position: 'relative'}}>
                <iframe 
                  width="100%" 
                  height="100%" 
                  src="https://www.youtube-nocookie.com/embed/z7Ig-zj8j3I?autoplay=1&controls=0&loop=1&modestbranding=1&playlist=z7Ig-zj8j3I&rel=0" 
                  frameBorder="0" 
                  allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen"  
                  style={{position: 'absolute', top: '0px', left: '0px', width: '100%', height: '100%', borderRadius: '12px'}}
                  title="AI Supervisor Demo Video"
                >
                </iframe>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16"
        >
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 * index }}
                className="bg-slate-800/50 backdrop-blur-lg rounded-xl p-6 border border-purple-500/20 hover:border-purple-500/40 transition-all duration-300 group"
              >
                <div className={`w-12 h-12 bg-gradient-to-br ${feature.color} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-slate-300 text-sm leading-relaxed">{feature.description}</p>
              </motion.div>
            )
          })}
        </motion.div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center"
        >
          <div className="bg-slate-800/50 backdrop-blur-lg rounded-2xl p-8 border border-purple-500/20 max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold text-white mb-4">
              Ready to Build Intelligent Systems?
            </h2>
            <p className="text-slate-300 mb-8">
              Join the future of AI development with our comprehensive platform. 
              No setup required - start creating immediately.
            </p>
            
            <button
              onClick={handleGetStarted}
              disabled={isLoading}
              className="bg-gradient-to-r from-purple-500 to-cyan-500 text-white font-semibold px-8 py-4 rounded-lg hover:from-purple-600 hover:to-cyan-600 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 mx-auto"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Setting up your platform...</span>
                </>
              ) : (
                <>
                  <Rocket className="w-5 h-5" />
                  <span>Launch AI Supervisor Platform</span>
                  <ChevronRight className="w-5 h-5" />
                </>
              )}
            </button>
            
            <div className="flex items-center justify-center gap-6 mt-6 text-sm text-slate-400">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span>OpenAI Integration Ready</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                <span>Supabase Backend Active</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Quick Start Guide */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-16 text-center"
        >
          <h3 className="text-2xl font-bold text-white mb-8">How It Works</h3>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-4 text-white font-bold text-lg">
                1
              </div>
              <h4 className="text-lg font-semibold text-white mb-2">Generate Ideas</h4>
              <p className="text-slate-300 text-sm">Use Creative Studio to generate AI-powered project ideas and concepts</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-cyan-500 rounded-full flex items-center justify-center mx-auto mb-4 text-white font-bold text-lg">
                2
              </div>
              <h4 className="text-lg font-semibold text-white mb-2">Create Agents</h4>
              <p className="text-slate-300 text-sm">Build specialized AI agents with Aesthetic Forge and Agent Slicer</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-pink-500 rounded-full flex items-center justify-center mx-auto mb-4 text-white font-bold text-lg">
                3
              </div>
              <h4 className="text-lg font-semibold text-white mb-2">Combine & Deploy</h4>
              <p className="text-slate-300 text-sm">Use Project Combiner to merge systems and deploy intelligent solutions</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}