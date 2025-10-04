import React, { useEffect, useState } from 'react'
import { Play, Shield, Zap, Activity, Brain, AlertTriangle } from 'lucide-react'
import { useWebSocket } from '../contexts/WebSocketContext'
import { useSession } from '../contexts/SessionContext'

export function HeroSection() {
  const { isConnected, decisionHistory } = useWebSocket()
  const { startRecording } = useSession()
  const [stats, setStats] = useState({
    totalDecisions: 0,
    allowCount: 0,
    warnCount: 0,
    correctCount: 0,
    escalateCount: 0,
    avgConfidence: 0
  })

  // Calculate real-time statistics
  useEffect(() => {
    if (decisionHistory.length > 0) {
      const totalDecisions = decisionHistory.length
      const allowCount = decisionHistory.filter(d => d.decision === 'ALLOW').length
      const warnCount = decisionHistory.filter(d => d.decision === 'WARN').length
      const correctCount = decisionHistory.filter(d => d.decision === 'CORRECT').length
      const escalateCount = decisionHistory.filter(d => d.decision === 'ESCALATE').length
      const avgConfidence = decisionHistory.reduce((sum, d) => sum + d.confidence, 0) / totalDecisions

      setStats({
        totalDecisions,
        allowCount,
        warnCount,
        correctCount,
        escalateCount,
        avgConfidence
      })
    }
  }, [decisionHistory])

  const scrollToDemo = () => {
    document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleStartDemo = () => {
    const sessionId = `demo_${Date.now()}`
    startRecording(sessionId)
    scrollToDemo()
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 hero-pattern">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950/90 via-blue-950/30 to-slate-950/90" />
      </div>
      
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-10"
        style={{ backgroundImage: 'url(/images/ai_neural_network_dark_tech_background.jpg)' }}
      />

      {/* Floating Elements */}
      <div className="absolute top-20 left-10 w-4 h-4 bg-blue-400 rounded-full animate-pulse opacity-60" />
      <div className="absolute top-40 right-20 w-2 h-2 bg-cyan-400 rounded-full animate-pulse opacity-40" />
      <div className="absolute bottom-32 left-20 w-3 h-3 bg-green-400 rounded-full animate-pulse opacity-50" />
      <div className="absolute bottom-60 right-10 w-6 h-6 bg-purple-400 rounded-full animate-pulse opacity-30" />

      <div className="relative z-10 container mx-auto px-4 text-center">
        {/* Main Hero Content */}
        <div className="max-w-4xl mx-auto">
          {/* AI Supervisor Icon */}
          <div className="mb-8 flex justify-center">
            <div className="relative">
              <div className="w-24 h-24 bg-gradient-to-r from-blue-500 via-cyan-400 to-green-400 rounded-2xl flex items-center justify-center animate-glow">
                <Brain className="w-12 h-12 text-white" />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center">
                <Shield className="w-5 h-5 text-yellow-900" />
              </div>
            </div>
          </div>

          {/* Title and Subtitle */}
          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            <span className="gradient-text">AI Supervisor</span>
            <br />
            <span className="text-white">& Orchestrator</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-slate-300 mb-8 leading-relaxed">
            Real-time intelligent monitoring and intervention for AI agents with
            <br className="hidden md:block" />
            <span className="text-cyan-400 font-semibold">WebSocket-powered live supervision</span>
          </p>

          {/* Key Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="glass rounded-xl p-6 interactive-card">
              <Activity className="w-8 h-8 text-cyan-400 mb-3 mx-auto" />
              <h3 className="text-lg font-semibold mb-2">Real-Time Monitoring</h3>
              <p className="text-slate-400 text-sm">Live WebSocket connection tracking agent performance with sub-second response times</p>
            </div>
            
            <div className="glass rounded-xl p-6 interactive-card">
              <Zap className="w-8 h-8 text-yellow-400 mb-3 mx-auto" />
              <h3 className="text-lg font-semibold mb-2">Intelligent Decisions</h3>
              <p className="text-slate-400 text-sm">4-tier response system: ALLOW, WARN, CORRECT, ESCALATE with confidence scoring</p>
            </div>
            
            <div className="glass rounded-xl p-6 interactive-card">
              <Shield className="w-8 h-8 text-green-400 mb-3 mx-auto" />
              <h3 className="text-lg font-semibold mb-2">Auto-Intervention</h3>
              <p className="text-slate-400 text-sm">Automated correction and escalation with human-in-the-loop capabilities</p>
            </div>
          </div>

          {/* Live Statistics */}
          <div className="glass rounded-xl p-6 mb-12">
            <h3 className="text-lg font-semibold mb-4 flex items-center justify-center space-x-2">
              <Activity className="w-5 h-5 text-cyan-400" />
              <span>Live Performance Statistics</span>
              <div className={`w-2 h-2 rounded-full ${
                isConnected ? 'bg-green-400 animate-pulse' : 'bg-yellow-400'
              }`} />
            </h3>
            
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-cyan-400">{stats.totalDecisions}</div>
                <div className="text-sm text-slate-400">Total Decisions</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">{stats.allowCount}</div>
                <div className="text-sm text-slate-400">Allowed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-400">{stats.warnCount}</div>
                <div className="text-sm text-slate-400">Warnings</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-400">{stats.correctCount}</div>
                <div className="text-sm text-slate-400">Corrected</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-400">{stats.escalateCount}</div>
                <div className="text-sm text-slate-400">Escalated</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400">{(stats.avgConfidence * 100).toFixed(1)}%</div>
                <div className="text-sm text-slate-400">Avg Confidence</div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col md:flex-row items-center justify-center space-y-4 md:space-y-0 md:space-x-6">
            <button
              onClick={handleStartDemo}
              className="px-8 py-4 bg-gradient-to-r from-blue-500 to-cyan-400 text-white rounded-xl text-lg font-semibold hover:from-blue-600 hover:to-cyan-500 transition-all duration-300 transform hover:scale-105 flex items-center space-x-3 shadow-lg"
            >
              <Play className="w-6 h-6" />
              <span>Start Live Demo</span>
            </button>
            
            <button
              onClick={() => document.getElementById('docs')?.scrollIntoView({ behavior: 'smooth' })}
              className="px-8 py-4 border border-slate-600 text-slate-300 rounded-xl text-lg font-semibold hover:bg-slate-800 hover:border-slate-500 transition-all duration-300 flex items-center space-x-3"
            >
              <Brain className="w-6 h-6" />
              <span>Integration Guide</span>
            </button>
          </div>

          {/* Connection Status */}
          <div className="mt-8 flex items-center justify-center space-x-2 text-sm">
            {isConnected ? (
              <>
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="text-green-400">Connected to WebSocket server (ws://localhost:8765)</span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-4 h-4 text-yellow-400" />
                <span className="text-yellow-400">Demo mode active - Server disconnected</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border border-slate-400 rounded-full flex justify-center">
          <div className="w-1 h-3 bg-slate-400 rounded-full mt-2 animate-pulse" />
        </div>
      </div>
    </div>
  )
}
