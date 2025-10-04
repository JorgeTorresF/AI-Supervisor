import React, { useState, useEffect } from 'react'
import { Play, Pause, RotateCcw, Settings, Zap, AlertCircle, CheckCircle } from 'lucide-react'
import { useWebSocket, AgentMetrics, SupervisorDecision } from '../contexts/WebSocketContext'
import { useSession } from '../contexts/SessionContext'
import { toast } from 'sonner'

export function LiveDemo() {
  const { isConnected, testDecision, currentSession, startSession } = useWebSocket()
  const { startRecording, stopRecording, currentSession: recordingSession } = useSession()
  const [isRunning, setIsRunning] = useState(false)
  const [currentMetrics, setCurrentMetrics] = useState<AgentMetrics>({
    quality_score: 0.9,
    error_count: 0,
    resource_usage: 0.2,
    task_progress: 0.8,
    drift_score: 0.05
  })
  const [latestDecision, setLatestDecision] = useState<SupervisorDecision | null>(null)
  const [testHistory, setTestHistory] = useState<{ metrics: AgentMetrics; decision: SupervisorDecision; timestamp: string }[]>([])
  const [autoMode, setAutoMode] = useState(false)
  const [testInterval, setTestInterval] = useState<NodeJS.Timeout | null>(null)

  // Preset scenarios for quick testing
  const presetScenarios = [
    {
      name: 'Optimal Performance',
      description: 'High-quality output with minimal resource usage',
      metrics: { quality_score: 0.95, error_count: 0, resource_usage: 0.15, task_progress: 0.9, drift_score: 0.02 },
      expectedDecision: 'ALLOW'
    },
    {
      name: 'Warning Threshold',
      description: 'Moderate performance degradation',
      metrics: { quality_score: 0.68, error_count: 1, resource_usage: 0.6, task_progress: 0.6, drift_score: 0.25 },
      expectedDecision: 'WARN'
    },
    {
      name: 'Needs Correction',
      description: 'Significant issues requiring intervention',
      metrics: { quality_score: 0.45, error_count: 3, resource_usage: 0.8, task_progress: 0.3, drift_score: 0.55 },
      expectedDecision: 'CORRECT'
    },
    {
      name: 'Critical Failure',
      description: 'Severe problems requiring escalation',
      metrics: { quality_score: 0.25, error_count: 5, resource_usage: 0.95, task_progress: 0.1, drift_score: 0.85 },
      expectedDecision: 'ESCALATE'
    }
  ]

  const runSingleTest = async () => {
    try {
      setIsRunning(true)
      const decision = await testDecision(currentMetrics)
      
      if (decision) {
        setLatestDecision(decision)
        setTestHistory(prev => [{
          metrics: { ...currentMetrics },
          decision,
          timestamp: new Date().toISOString()
        }, ...prev.slice(0, 9)]) // Keep last 10 tests
        
        toast.success(`Decision: ${decision.decision} (${(decision.confidence * 100).toFixed(1)}% confidence)`)
      }
    } catch (error) {
      toast.error('Failed to get supervisor decision')
    } finally {
      setIsRunning(false)
    }
  }

  const startAutoMode = () => {
    if (autoMode) {
      stopAutoMode()
      return
    }

    setAutoMode(true)
    const interval = setInterval(async () => {
      // Randomly vary metrics for realistic simulation
      const baseMetrics = { ...currentMetrics }
      const newMetrics = {
        quality_score: Math.max(0, Math.min(1, baseMetrics.quality_score + (Math.random() - 0.5) * 0.3)),
        error_count: Math.max(0, Math.floor(baseMetrics.error_count + (Math.random() - 0.7) * 3)),
        resource_usage: Math.max(0, Math.min(1, baseMetrics.resource_usage + (Math.random() - 0.5) * 0.4)),
        task_progress: Math.max(0, Math.min(1, baseMetrics.task_progress + (Math.random() - 0.3) * 0.2)),
        drift_score: Math.max(0, Math.min(1, baseMetrics.drift_score + (Math.random() - 0.5) * 0.3))
      }
      
      setCurrentMetrics(newMetrics)
      
      const decision = await testDecision(newMetrics)
      if (decision) {
        setLatestDecision(decision)
        setTestHistory(prev => [{
          metrics: { ...newMetrics },
          decision,
          timestamp: new Date().toISOString()
        }, ...prev.slice(0, 9)])
      }
    }, 3000) // Test every 3 seconds
    
    setTestInterval(interval)
  }

  const stopAutoMode = () => {
    setAutoMode(false)
    if (testInterval) {
      clearInterval(testInterval)
      setTestInterval(null)
    }
  }

  const loadPreset = (preset: typeof presetScenarios[0]) => {
    setCurrentMetrics(preset.metrics)
    toast.success(`Loaded preset: ${preset.name}`)
  }

  const resetMetrics = () => {
    setCurrentMetrics({
      quality_score: 0.9,
      error_count: 0,
      resource_usage: 0.2,
      task_progress: 0.8,
      drift_score: 0.05
    })
    setLatestDecision(null)
    toast.success('Metrics reset to default values')
  }

  useEffect(() => {
    return () => {
      if (testInterval) {
        clearInterval(testInterval)
      }
    }
  }, [testInterval])

  const getDecisionColor = (decision: string) => {
    switch (decision) {
      case 'ALLOW': return 'text-green-400 bg-green-500/20 border-green-500/30'
      case 'WARN': return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30'
      case 'CORRECT': return 'text-orange-400 bg-orange-500/20 border-orange-500/30'
      case 'ESCALATE': return 'text-red-400 bg-red-500/20 border-red-500/30'
      default: return 'text-slate-400 bg-slate-500/20 border-slate-500/30'
    }
  }

  const getMetricColor = (value: number, inverted = false) => {
    const threshold = inverted ? (value <= 0.3 ? 'green' : value <= 0.7 ? 'yellow' : 'red') 
                              : (value >= 0.7 ? 'green' : value >= 0.4 ? 'yellow' : 'red')
    
    switch (threshold) {
      case 'green': return 'bg-green-500'
      case 'yellow': return 'bg-yellow-500'
      case 'red': return 'bg-red-500'
      default: return 'bg-slate-500'
    }
  }

  return (
    <div className="py-24 bg-gradient-to-b from-slate-950 to-slate-900">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            <span className="gradient-text">Interactive Live Demo</span>
          </h2>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto">
            Experience real-time AI supervision with adjustable performance metrics. 
            Test all four decision types with live WebSocket communication.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Control Panel */}
          <div className="space-y-6">
            {/* Preset Scenarios */}
            <div className="glass rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                <Settings className="w-5 h-5 text-cyan-400" />
                <span>Quick Test Scenarios</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {presetScenarios.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => loadPreset(preset)}
                    className="p-3 bg-slate-800/50 rounded-lg border border-slate-700 hover:border-cyan-500/50 transition-all duration-200 text-left"
                  >
                    <div className={`text-sm font-medium mb-1 ${
                      preset.expectedDecision === 'ALLOW' ? 'text-green-400' :
                      preset.expectedDecision === 'WARN' ? 'text-yellow-400' :
                      preset.expectedDecision === 'CORRECT' ? 'text-orange-400' : 'text-red-400'
                    }`}>
                      {preset.name}
                    </div>
                    <div className="text-xs text-slate-400">{preset.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Metrics Control */}
            <div className="glass rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">Agent Performance Metrics</h3>
              <div className="space-y-4">
                {/* Quality Score */}
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-sm font-medium">Quality Score</label>
                    <span className="text-sm text-cyan-400">{currentMetrics.quality_score.toFixed(2)}</span>
                  </div>
                  <div className="relative">
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={currentMetrics.quality_score}
                      onChange={(e) => setCurrentMetrics(prev => ({ ...prev, quality_score: parseFloat(e.target.value) }))}
                      className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                    />
                    <div 
                      className={`absolute top-0 left-0 h-2 rounded-lg transition-all duration-200 ${getMetricColor(currentMetrics.quality_score)}`}
                      style={{ width: `${currentMetrics.quality_score * 100}%` }}
                    />
                  </div>
                </div>

                {/* Error Count */}
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-sm font-medium">Error Count</label>
                    <span className="text-sm text-cyan-400">{currentMetrics.error_count}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    step="1"
                    value={currentMetrics.error_count}
                    onChange={(e) => setCurrentMetrics(prev => ({ ...prev, error_count: parseInt(e.target.value) }))}
                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* Resource Usage */}
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-sm font-medium">Resource Usage</label>
                    <span className="text-sm text-cyan-400">{(currentMetrics.resource_usage * 100).toFixed(0)}%</span>
                  </div>
                  <div className="relative">
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={currentMetrics.resource_usage}
                      onChange={(e) => setCurrentMetrics(prev => ({ ...prev, resource_usage: parseFloat(e.target.value) }))}
                      className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                    />
                    <div 
                      className={`absolute top-0 left-0 h-2 rounded-lg transition-all duration-200 ${getMetricColor(currentMetrics.resource_usage, true)}`}
                      style={{ width: `${currentMetrics.resource_usage * 100}%` }}
                    />
                  </div>
                </div>

                {/* Task Progress */}
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-sm font-medium">Task Progress</label>
                    <span className="text-sm text-cyan-400">{(currentMetrics.task_progress * 100).toFixed(0)}%</span>
                  </div>
                  <div className="relative">
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={currentMetrics.task_progress}
                      onChange={(e) => setCurrentMetrics(prev => ({ ...prev, task_progress: parseFloat(e.target.value) }))}
                      className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                    />
                    <div 
                      className={`absolute top-0 left-0 h-2 rounded-lg transition-all duration-200 ${getMetricColor(currentMetrics.task_progress)}`}
                      style={{ width: `${currentMetrics.task_progress * 100}%` }}
                    />
                  </div>
                </div>

                {/* Drift Score */}
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-sm font-medium">Drift Score</label>
                    <span className="text-sm text-cyan-400">{(currentMetrics.drift_score * 100).toFixed(1)}%</span>
                  </div>
                  <div className="relative">
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={currentMetrics.drift_score}
                      onChange={(e) => setCurrentMetrics(prev => ({ ...prev, drift_score: parseFloat(e.target.value) }))}
                      className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                    />
                    <div 
                      className={`absolute top-0 left-0 h-2 rounded-lg transition-all duration-200 ${getMetricColor(currentMetrics.drift_score, true)}`}
                      style={{ width: `${currentMetrics.drift_score * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Control Buttons */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={runSingleTest}
                disabled={isRunning}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-400 text-white rounded-lg font-medium hover:from-blue-600 hover:to-cyan-500 transition-all duration-200 flex items-center space-x-2 disabled:opacity-50"
              >
                {isRunning ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Zap className="w-5 h-5" />
                )}
                <span>Test Decision</span>
              </button>
              
              <button
                onClick={startAutoMode}
                className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 ${
                  autoMode 
                    ? 'bg-red-500 hover:bg-red-600 text-white' 
                    : 'bg-green-500 hover:bg-green-600 text-white'
                }`}
              >
                {autoMode ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                <span>{autoMode ? 'Stop Auto' : 'Auto Mode'}</span>
              </button>
              
              <button
                onClick={resetMetrics}
                className="px-6 py-3 border border-slate-600 text-slate-300 rounded-lg font-medium hover:bg-slate-800 hover:border-slate-500 transition-all duration-200 flex items-center space-x-2"
              >
                <RotateCcw className="w-5 h-5" />
                <span>Reset</span>
              </button>
            </div>
          </div>

          {/* Results Panel */}
          <div className="space-y-6">
            {/* Latest Decision */}
            {latestDecision && (
              <div className="glass rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-4">Latest Supervisor Decision</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">Decision:</span>
                    <span className={`px-3 py-1 rounded-lg border font-medium ${getDecisionColor(latestDecision.decision)}`}>
                      {latestDecision.decision}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">Confidence:</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-24 h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-500"
                          style={{ width: `${latestDecision.confidence * 100}%` }}
                        />
                      </div>
                      <span className="text-cyan-400 font-medium">{(latestDecision.confidence * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                  
                  <div>
                    <span className="text-slate-300 block mb-2">Reasoning:</span>
                    <p className="text-slate-400 text-sm leading-relaxed bg-slate-800/50 p-3 rounded-lg">
                      {latestDecision.reasoning}
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Timestamp:</span>
                    <span className="text-slate-400">{new Date(latestDecision.timestamp).toLocaleTimeString()}</span>
                  </div>
                  
                  {latestDecision.action_required && (
                    <div className="flex items-center space-x-2 text-yellow-400">
                      <AlertCircle className="w-4 h-4" />
                      <span className="text-sm">Action Required</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Test History */}
            <div className="glass rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">Decision History</h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {testHistory.length === 0 ? (
                  <p className="text-slate-400 text-center py-8">No tests run yet. Click "Test Decision" to start.</p>
                ) : (
                  testHistory.map((test, index) => (
                    <div key={index} className="p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                      <div className="flex items-center justify-between mb-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getDecisionColor(test.decision.decision)}`}>
                          {test.decision.decision}
                        </span>
                        <span className="text-xs text-slate-400">
                          {new Date(test.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400">
                        Q: {test.metrics.quality_score.toFixed(2)} | 
                        E: {test.metrics.error_count} | 
                        R: {(test.metrics.resource_usage * 100).toFixed(0)}% | 
                        P: {(test.metrics.task_progress * 100).toFixed(0)}% | 
                        D: {(test.metrics.drift_score * 100).toFixed(1)}%
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        Confidence: {(test.decision.confidence * 100).toFixed(1)}%
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
