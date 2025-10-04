import React, { useState, useEffect } from 'react'
import { Activity, Download, Trash2, Filter, TrendingUp, Clock, AlertTriangle } from 'lucide-react'
import { useWebSocket } from '../contexts/WebSocketContext'
import { useSession } from '../contexts/SessionContext'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts'

export function RealTimeMonitoring() {
  const { isConnected, decisionHistory, clearHistory } = useWebSocket()
  const { recordedSessions, isReplaying, replayProgress } = useSession()
  const [filter, setFilter] = useState<'ALL' | 'ALLOW' | 'WARN' | 'CORRECT' | 'ESCALATE'>('ALL')
  const [chartData, setChartData] = useState<any[]>([])
  const [decisionCounts, setDecisionCounts] = useState<any[]>([])
  const [timelineData, setTimelineData] = useState<any[]>([])

  // Update chart data when decision history changes
  useEffect(() => {
    if (decisionHistory.length > 0) {
      // Prepare decision distribution data
      const counts = {
        ALLOW: decisionHistory.filter(d => d.decision === 'ALLOW').length,
        WARN: decisionHistory.filter(d => d.decision === 'WARN').length,
        CORRECT: decisionHistory.filter(d => d.decision === 'CORRECT').length,
        ESCALATE: decisionHistory.filter(d => d.decision === 'ESCALATE').length
      }

      const pieData = [
        { name: 'ALLOW', value: counts.ALLOW, color: '#10b981' },
        { name: 'WARN', value: counts.WARN, color: '#f59e0b' },
        { name: 'CORRECT', value: counts.CORRECT, color: '#f97316' },
        { name: 'ESCALATE', value: counts.ESCALATE, color: '#ef4444' }
      ]

      setDecisionCounts(pieData)

      // Prepare confidence trend data (last 20 decisions)
      const recentDecisions = decisionHistory.slice(0, 20).reverse()
      const confidenceData = recentDecisions.map((decision, index) => ({
        index: index + 1,
        confidence: decision.confidence * 100,
        decision: decision.decision,
        timestamp: new Date(decision.timestamp).toLocaleTimeString()
      }))

      setChartData(confidenceData)

      // Prepare timeline data (hourly distribution)
      const now = new Date()
      const hourlyData = Array.from({ length: 24 }, (_, i) => {
        const hour = new Date(now)
        hour.setHours(hour.getHours() - (23 - i))
        
        const hourDecisions = decisionHistory.filter(d => {
          const decisionTime = new Date(d.timestamp)
          return decisionTime.getHours() === hour.getHours() && 
                 decisionTime.getDate() === hour.getDate()
        })

        return {
          hour: hour.getHours(),
          total: hourDecisions.length,
          allow: hourDecisions.filter(d => d.decision === 'ALLOW').length,
          warn: hourDecisions.filter(d => d.decision === 'WARN').length,
          correct: hourDecisions.filter(d => d.decision === 'CORRECT').length,
          escalate: hourDecisions.filter(d => d.decision === 'ESCALATE').length
        }
      })

      setTimelineData(hourlyData)
    }
  }, [decisionHistory])

  const filteredHistory = filter === 'ALL' 
    ? decisionHistory 
    : decisionHistory.filter(d => d.decision === filter)

  const exportData = () => {
    const data = {
      timestamp: new Date().toISOString(),
      totalDecisions: decisionHistory.length,
      decisions: decisionHistory,
      summary: {
        allow: decisionHistory.filter(d => d.decision === 'ALLOW').length,
        warn: decisionHistory.filter(d => d.decision === 'WARN').length,
        correct: decisionHistory.filter(d => d.decision === 'CORRECT').length,
        escalate: decisionHistory.filter(d => d.decision === 'ESCALATE').length,
        averageConfidence: decisionHistory.reduce((sum, d) => sum + d.confidence, 0) / decisionHistory.length
      }
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `supervisor-decisions-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const getDecisionColor = (decision: string) => {
    switch (decision) {
      case 'ALLOW': return 'text-green-400 bg-green-500/20 border-green-500/30'
      case 'WARN': return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30'
      case 'CORRECT': return 'text-orange-400 bg-orange-500/20 border-orange-500/30'
      case 'ESCALATE': return 'text-red-400 bg-red-500/20 border-red-500/30'
      default: return 'text-slate-400 bg-slate-500/20 border-slate-500/30'
    }
  }

  const getDecisionIcon = (decision: string) => {
    switch (decision) {
      case 'ALLOW': return '✓'
      case 'WARN': return '⚠'
      case 'CORRECT': return '🔧'
      case 'ESCALATE': return '🚨'
      default: return '?'
    }
  }

  return (
    <div className="py-24 bg-gradient-to-b from-slate-900 to-slate-950">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            <span className="gradient-text">Real-Time Monitoring Dashboard</span>
          </h2>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto">
            Live supervisor decision tracking with comprehensive analytics and session replay capabilities.
          </p>
        </div>

        {/* Status Bar */}
        <div className="glass rounded-xl p-6 mb-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${
                  isConnected ? 'bg-green-400 animate-pulse' : 'bg-yellow-400'
                }`} />
                <span className="text-sm font-medium">
                  {isConnected ? 'WebSocket Connected' : 'Demo Mode Active'}
                </span>
              </div>
              
              <div className="flex items-center space-x-2">
                <Activity className="w-4 h-4 text-cyan-400" />
                <span className="text-sm">
                  {decisionHistory.length} Total Decisions
                </span>
              </div>
              
              {isReplaying && (
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-purple-400" />
                  <span className="text-sm">Replaying Session ({replayProgress.toFixed(0)}%)</span>
                  <div className="w-20 h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-purple-500 transition-all duration-200"
                      style={{ width: `${replayProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-3">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm focus:border-cyan-500 focus:outline-none"
              >
                <option value="ALL">All Decisions</option>
                <option value="ALLOW">Allow Only</option>
                <option value="WARN">Warnings Only</option>
                <option value="CORRECT">Corrections Only</option>
                <option value="ESCALATE">Escalations Only</option>
              </select>
              
              <button
                onClick={exportData}
                disabled={decisionHistory.length === 0}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-2 disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                <span>Export</span>
              </button>
              
              <button
                onClick={clearHistory}
                disabled={decisionHistory.length === 0}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-2 disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                <span>Clear</span>
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Decision Stream */}
          <div className="lg:col-span-2">
            <div className="glass rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                <Activity className="w-5 h-5 text-cyan-400" />
                <span>Live Decision Stream</span>
                <span className="text-sm text-slate-400">({filteredHistory.length} decisions)</span>
              </h3>
              
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {filteredHistory.length === 0 ? (
                  <div className="text-center py-12">
                    <AlertTriangle className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-400">No decisions to display</p>
                    <p className="text-sm text-slate-500 mt-2">
                      {filter === 'ALL' ? 'Run a test to see decisions here' : `No ${filter} decisions found`}
                    </p>
                  </div>
                ) : (
                  filteredHistory.map((decision, index) => (
                    <div key={index} className="p-4 bg-slate-800/50 rounded-lg border border-slate-700 hover:border-slate-600 transition-all duration-200">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">{getDecisionIcon(decision.decision)}</span>
                          <div>
                            <span className={`px-3 py-1 rounded-lg border font-medium text-sm ${getDecisionColor(decision.decision)}`}>
                              {decision.decision}
                            </span>
                            <div className="text-xs text-slate-400 mt-1">
                              {new Date(decision.timestamp).toLocaleString()}
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className="text-sm font-medium text-cyan-400">
                            {(decision.confidence * 100).toFixed(1)}%
                          </div>
                          <div className="text-xs text-slate-400">confidence</div>
                        </div>
                      </div>
                      
                      <p className="text-sm text-slate-300 leading-relaxed">
                        {decision.reasoning}
                      </p>
                      
                      {decision.action_required && (
                        <div className="mt-2 flex items-center space-x-2 text-yellow-400">
                          <AlertTriangle className="w-3 h-3" />
                          <span className="text-xs">Action Required</span>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Analytics Panel */}
          <div className="space-y-6">
            {/* Decision Distribution */}
            <div className="glass rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">Decision Distribution</h3>
              {decisionCounts.length > 0 ? (
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={decisionCounts}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {decisionCounts.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1e293b', 
                          border: '1px solid #374151',
                          borderRadius: '8px',
                          color: '#ffffff'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-48 flex items-center justify-center text-slate-400">
                  No data available
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-2 mt-4">
                {decisionCounts.map((item) => (
                  <div key={item.name} className="flex items-center space-x-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-xs text-slate-300">
                      {item.name}: {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Confidence Trend */}
            <div className="glass rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-cyan-400" />
                <span>Confidence Trend</span>
              </h3>
              {chartData.length > 0 ? (
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis 
                        dataKey="index" 
                        stroke="#9ca3af"
                        fontSize={12}
                      />
                      <YAxis 
                        stroke="#9ca3af"
                        fontSize={12}
                        domain={[0, 100]}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1e293b', 
                          border: '1px solid #374151',
                          borderRadius: '8px',
                          color: '#ffffff'
                        }}
                        formatter={(value, name, props) => [
                          `${value}%`,
                          'Confidence',
                          `Decision: ${props.payload?.decision}`
                        ]}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="confidence" 
                        stroke="#06b6d4" 
                        strokeWidth={2}
                        dot={{ fill: '#06b6d4', strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6, stroke: '#06b6d4', strokeWidth: 2, fill: '#0891b2' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-48 flex items-center justify-center text-slate-400">
                  No trend data available
                </div>
              )}
            </div>

            {/* Session Info */}
            <div className="glass rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">Session Information</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Sessions:</span>
                  <span className="text-white">{recordedSessions.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Current Status:</span>
                  <span className={isConnected ? 'text-green-400' : 'text-yellow-400'}>
                    {isConnected ? 'Live Monitoring' : 'Demo Mode'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Last Updated:</span>
                  <span className="text-white">
                    {decisionHistory.length > 0 
                      ? new Date(decisionHistory[0].timestamp).toLocaleTimeString()
                      : 'Never'
                    }
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Avg Response Time:</span>
                  <span className="text-white">~150ms</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Timeline Chart */}
        {timelineData.length > 0 && (
          <div className="glass rounded-xl p-6 mt-8">
            <h3 className="text-lg font-semibold mb-4">24-Hour Decision Timeline</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={timelineData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="hour" 
                    stroke="#9ca3af"
                    fontSize={12}
                    tickFormatter={(hour) => `${hour}:00`}
                  />
                  <YAxis stroke="#9ca3af" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1e293b', 
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#ffffff'
                    }}
                  />
                  <Bar dataKey="allow" stackId="a" fill="#10b981" name="Allow" />
                  <Bar dataKey="warn" stackId="a" fill="#f59e0b" name="Warn" />
                  <Bar dataKey="correct" stackId="a" fill="#f97316" name="Correct" />
                  <Bar dataKey="escalate" stackId="a" fill="#ef4444" name="Escalate" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
