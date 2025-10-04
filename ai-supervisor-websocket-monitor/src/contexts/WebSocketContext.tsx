import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { toast } from 'sonner'

export interface SupervisorDecision {
  success: boolean
  decision: 'ALLOW' | 'WARN' | 'CORRECT' | 'ESCALATE'
  confidence: number
  reasoning: string
  timestamp: string
  action_required: boolean
  quality_metrics?: {
    structure_score: number
    coherence_score: number
    instruction_adherence: number
    completeness_score: number
  }
}

export interface AgentMetrics {
  quality_score: number
  error_count: number
  resource_usage: number
  task_progress: number
  drift_score: number
}

export interface SessionInfo {
  session_id: string
  agent_name: string
  task_description: string
  started_at: string
  status: 'active' | 'paused' | 'completed' | 'error'
}

interface WebSocketContextType {
  isConnected: boolean
  isReconnecting: boolean
  connectionAttempts: number
  lastError: string | null
  currentSession: SessionInfo | null
  decisionHistory: SupervisorDecision[]
  
  // Actions
  connect: () => void
  disconnect: () => void
  startSession: (sessionInfo: Omit<SessionInfo, 'started_at' | 'status'>) => Promise<boolean>
  endSession: () => Promise<boolean>
  testDecision: (metrics: AgentMetrics) => Promise<SupervisorDecision | null>
  getDecisionLog: (limit?: number) => Promise<SupervisorDecision[]>
  clearHistory: () => void
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined)

interface WebSocketProviderProps {
  children: ReactNode
}

const WEBSOCKET_URL = 'ws://localhost:8765'
const RECONNECT_INTERVAL = 5000
const MAX_RECONNECT_ATTEMPTS = 5

export function WebSocketProvider({ children }: WebSocketProviderProps) {
  const [socket, setSocket] = useState<WebSocket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isReconnecting, setIsReconnecting] = useState(false)
  const [connectionAttempts, setConnectionAttempts] = useState(0)
  const [lastError, setLastError] = useState<string | null>(null)
  const [currentSession, setCurrentSession] = useState<SessionInfo | null>(null)
  const [decisionHistory, setDecisionHistory] = useState<SupervisorDecision[]>([])
  const [reconnectTimeout, setReconnectTimeout] = useState<NodeJS.Timeout | null>(null)
  const [pendingRequests, setPendingRequests] = useState<Map<string, {
    resolve: (value: any) => void
    reject: (error: any) => void
    timeout: NodeJS.Timeout
  }>>(new Map())

  // Load demo data on initialization
  useEffect(() => {
    loadDemoData()
  }, [])

  const loadDemoData = useCallback(async () => {
    try {
      const response = await fetch('/supervisor_test_results.json')
      if (response.ok) {
        const data = await response.json()
        if (data.scenarios_tested) {
          setDecisionHistory(data.scenarios_tested.map((scenario: any) => ({
            success: true,
            decision: scenario.decision,
            confidence: scenario.confidence,
            reasoning: scenario.reasoning,
            timestamp: scenario.timestamp,
            action_required: scenario.decision !== 'ALLOW'
          })))
        }
      }
    } catch (error) {
      console.log('Demo data not available, using fallback mode')
    }
  }, [])

  const generateId = () => Math.random().toString(36).substr(2, 9)

  const sendMessage = useCallback((message: any): Promise<any> => {
    return new Promise((resolve, reject) => {
      if (!socket || socket.readyState !== WebSocket.OPEN) {
        reject(new Error('WebSocket not connected'))
        return
      }

      const messageId = generateId()
      const messageWithId = { ...message, id: messageId }

      // Set up timeout for request
      const timeout = setTimeout(() => {
        const pending = pendingRequests.get(messageId)
        if (pending) {
          pendingRequests.delete(messageId)
          reject(new Error('Request timeout'))
        }
      }, 10000)

      // Store pending request
      setPendingRequests(prev => new Map(prev.set(messageId, {
        resolve,
        reject,
        timeout
      })))

      // Send message
      socket.send(JSON.stringify(messageWithId))
    })
  }, [socket, pendingRequests])

  const connect = useCallback(() => {
    if (socket?.readyState === WebSocket.CONNECTING || isConnected) {
      return
    }

    try {
      setIsReconnecting(true)
      setLastError(null)
      
      const ws = new WebSocket(WEBSOCKET_URL)
      
      ws.onopen = () => {
        console.log('WebSocket connected successfully')
        setSocket(ws)
        setIsConnected(true)
        setIsReconnecting(false)
        setConnectionAttempts(0)
        setLastError(null)
        
        if (reconnectTimeout) {
          clearTimeout(reconnectTimeout)
          setReconnectTimeout(null)
        }
        
        toast.success('Connected to AI Supervisor server')
      }
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          
          // Handle response to pending request
          if (data.id && pendingRequests.has(data.id)) {
            const pending = pendingRequests.get(data.id)!
            clearTimeout(pending.timeout)
            pendingRequests.delete(data.id)
            
            if (data.status === 'error') {
              pending.reject(new Error(data.message || 'Server error'))
            } else {
              pending.resolve(data)
            }
          }
          
          // Handle real-time updates
          if (data.type === 'decision_update' && data.decision) {
            setDecisionHistory(prev => [data.decision, ...prev.slice(0, 49)])
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error)
        }
      }
      
      ws.onclose = (event) => {
        console.log('WebSocket connection closed:', event.code, event.reason)
        setSocket(null)
        setIsConnected(false)
        setIsReconnecting(false)
        
        // Clear pending requests
        pendingRequests.forEach(({ reject, timeout }) => {
          clearTimeout(timeout)
          reject(new Error('Connection closed'))
        })
        setPendingRequests(new Map())
        
        if (event.code !== 1000 && connectionAttempts < MAX_RECONNECT_ATTEMPTS) {
          // Attempt reconnection
          setConnectionAttempts(prev => prev + 1)
          const timeout = setTimeout(() => {
            connect()
          }, RECONNECT_INTERVAL)
          setReconnectTimeout(timeout)
          
          toast.error(`Connection lost. Reconnecting... (${connectionAttempts + 1}/${MAX_RECONNECT_ATTEMPTS})`)
        } else if (connectionAttempts >= MAX_RECONNECT_ATTEMPTS) {
          setLastError('Failed to reconnect after maximum attempts')
          toast.error('Connection failed. Switching to demo mode.')
        }
      }
      
      ws.onerror = (error) => {
        console.error('WebSocket error:', error)
        setLastError('Connection error occurred')
        setIsReconnecting(false)
        
        if (connectionAttempts === 0) {
          toast.error('Failed to connect to supervisor server. Using demo mode.')
        }
      }
      
    } catch (error) {
      console.error('Error creating WebSocket connection:', error)
      setLastError('Failed to create connection')
      setIsReconnecting(false)
      toast.error('Connection error. Using demo mode.')
    }
  }, [socket, isConnected, connectionAttempts, reconnectTimeout, pendingRequests])

  const disconnect = useCallback(() => {
    if (socket) {
      socket.close(1000, 'Manual disconnect')
    }
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout)
      setReconnectTimeout(null)
    }
    setConnectionAttempts(0)
  }, [socket, reconnectTimeout])

  const startSession = useCallback(async (sessionInfo: Omit<SessionInfo, 'started_at' | 'status'>): Promise<boolean> => {
    try {
      if (isConnected && socket) {
        const response = await sendMessage({
          tool: 'start_session',
          args: {
            session_id: sessionInfo.session_id,
            agent_name: sessionInfo.agent_name,
            task_description: sessionInfo.task_description
          }
        })
        
        if (response.success) {
          const session: SessionInfo = {
            ...sessionInfo,
            started_at: new Date().toISOString(),
            status: 'active'
          }
          setCurrentSession(session)
          toast.success(`Session started: ${sessionInfo.session_id}`)
          return true
        }
      } else {
        // Demo mode
        const session: SessionInfo = {
          ...sessionInfo,
          started_at: new Date().toISOString(),
          status: 'active'
        }
        setCurrentSession(session)
        toast.success(`Demo session started: ${sessionInfo.session_id}`)
        return true
      }
    } catch (error) {
      console.error('Failed to start session:', error)
      toast.error('Failed to start monitoring session')
    }
    return false
  }, [isConnected, socket, sendMessage])

  const endSession = useCallback(async (): Promise<boolean> => {
    try {
      if (currentSession) {
        setCurrentSession(null)
        toast.success('Session ended successfully')
        return true
      }
    } catch (error) {
      console.error('Failed to end session:', error)
      toast.error('Failed to end session')
    }
    return false
  }, [currentSession])

  const testDecision = useCallback(async (metrics: AgentMetrics): Promise<SupervisorDecision | null> => {
    try {
      if (isConnected && socket) {
        const response = await sendMessage({
          tool: 'get_minimax_decision',
          args: metrics
        })
        
        if (response.success) {
          const decision: SupervisorDecision = response
          setDecisionHistory(prev => [decision, ...prev.slice(0, 49)])
          return decision
        }
      } else {
        // Demo mode - simulate decision based on metrics
        const decision = simulateDecision(metrics)
        setDecisionHistory(prev => [decision, ...prev.slice(0, 49)])
        return decision
      }
    } catch (error) {
      console.error('Failed to test decision:', error)
      // Fallback to demo mode
      const decision = simulateDecision(metrics)
      setDecisionHistory(prev => [decision, ...prev.slice(0, 49)])
      return decision
    }
    return null
  }, [isConnected, socket, sendMessage])

  const simulateDecision = (metrics: AgentMetrics): SupervisorDecision => {
    const overallScore = (
      metrics.quality_score * 0.4 +
      (1 - metrics.resource_usage) * 0.2 +
      metrics.task_progress * 0.2 +
      (1 - metrics.drift_score) * 0.1 +
      (metrics.error_count === 0 ? 1 : Math.max(0, 1 - metrics.error_count * 0.1)) * 0.1
    )

    let decision: 'ALLOW' | 'WARN' | 'CORRECT' | 'ESCALATE'
    let reasoning: string
    let confidence: number

    if (overallScore >= 0.8) {
      decision = 'ALLOW'
      confidence = 0.85 + Math.random() * 0.15
      reasoning = `Excellent performance metrics. Quality score: ${metrics.quality_score.toFixed(2)}, minimal errors, optimal resource usage.`
    } else if (overallScore >= 0.6) {
      decision = 'WARN'
      confidence = 0.7 + Math.random() * 0.2
      reasoning = `Performance degradation detected. Quality: ${metrics.quality_score.toFixed(2)}, resource usage: ${(metrics.resource_usage * 100).toFixed(1)}%, drift: ${(metrics.drift_score * 100).toFixed(1)}%.`
    } else if (overallScore >= 0.4) {
      decision = 'CORRECT'
      confidence = 0.75 + Math.random() * 0.15
      reasoning = `Significant issues requiring correction. Quality below threshold, ${metrics.error_count} errors detected, high resource consumption.`
    } else {
      decision = 'ESCALATE'
      confidence = 0.85 + Math.random() * 0.15
      reasoning = `Critical failure detected. Quality: ${metrics.quality_score.toFixed(2)}, ${metrics.error_count} errors, resource usage: ${(metrics.resource_usage * 100).toFixed(1)}%.`
    }

    return {
      success: true,
      decision,
      confidence,
      reasoning,
      timestamp: new Date().toISOString(),
      action_required: decision !== 'ALLOW',
      quality_metrics: {
        structure_score: Math.max(0, metrics.quality_score + (Math.random() - 0.5) * 0.2),
        coherence_score: Math.max(0, metrics.quality_score + (Math.random() - 0.5) * 0.3),
        instruction_adherence: Math.max(0, 1 - metrics.drift_score + (Math.random() - 0.5) * 0.1),
        completeness_score: Math.max(0, metrics.task_progress + (Math.random() - 0.5) * 0.2)
      }
    }
  }

  const getDecisionLog = useCallback(async (limit: number = 50): Promise<SupervisorDecision[]> => {
    try {
      if (isConnected && socket) {
        const response = await sendMessage({
          tool: 'get_decision_log',
          args: { limit }
        })
        
        if (response.success && response.decisions) {
          return response.decisions
        }
      }
      
      // Return current history as fallback
      return decisionHistory.slice(0, limit)
    } catch (error) {
      console.error('Failed to get decision log:', error)
      return decisionHistory.slice(0, limit)
    }
  }, [isConnected, socket, sendMessage, decisionHistory])

  const clearHistory = useCallback(() => {
    setDecisionHistory([])
    toast.success('Decision history cleared')
  }, [])

  // Auto-connect on mount
  useEffect(() => {
    connect()
    return () => {
      disconnect()
    }
  }, [])

  const value: WebSocketContextType = {
    isConnected,
    isReconnecting,
    connectionAttempts,
    lastError,
    currentSession,
    decisionHistory,
    connect,
    disconnect,
    startSession,
    endSession,
    testDecision,
    getDecisionLog,
    clearHistory
  }

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  )
}

export function useWebSocket() {
  const context = useContext(WebSocketContext)
  if (context === undefined) {
    throw new Error('useWebSocket must be used within a WebSocketProvider')
  }
  return context
}
