import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface SessionData {
  sessionId: string
  timestamp: string
  decisions: any[]
  metrics: any[]
  duration: number
}

interface SessionContextType {
  sessions: SessionData[]
  currentSession: SessionData | null
  recordedSessions: SessionData[]
  
  // Session management
  startRecording: (sessionId: string) => void
  stopRecording: () => void
  saveSession: (data: SessionData) => void
  loadSession: (sessionId: string) => SessionData | null
  deleteSession: (sessionId: string) => void
  clearAllSessions: () => void
  
  // Replay functionality
  replaySession: (sessionId: string) => void
  isReplaying: boolean
  replayProgress: number
  pauseReplay: () => void
  resumeReplay: () => void
  stopReplay: () => void
}

const SessionContext = createContext<SessionContextType | undefined>(undefined)

interface SessionProviderProps {
  children: ReactNode
}

const STORAGE_KEY = 'ai-supervisor-sessions'

export function SessionProvider({ children }: SessionProviderProps) {
  const [sessions, setSessions] = useState<SessionData[]>([])
  const [currentSession, setCurrentSession] = useState<SessionData | null>(null)
  const [recordedSessions, setRecordedSessions] = useState<SessionData[]>([])
  const [isReplaying, setIsReplaying] = useState(false)
  const [replayProgress, setReplayProgress] = useState(0)
  const [replayTimer, setReplayTimer] = useState<NodeJS.Timeout | null>(null)
  const [isPaused, setIsPaused] = useState(false)

  // Load sessions from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsedSessions = JSON.parse(stored)
        setRecordedSessions(parsedSessions)
      }
    } catch (error) {
      console.error('Failed to load sessions from localStorage:', error)
    }
  }, [])

  // Save sessions to localStorage whenever recordedSessions changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(recordedSessions))
    } catch (error) {
      console.error('Failed to save sessions to localStorage:', error)
    }
  }, [recordedSessions])

  const startRecording = (sessionId: string) => {
    const newSession: SessionData = {
      sessionId,
      timestamp: new Date().toISOString(),
      decisions: [],
      metrics: [],
      duration: 0
    }
    
    setCurrentSession(newSession)
    setSessions(prev => [newSession, ...prev])
  }

  const stopRecording = () => {
    if (currentSession) {
      const endTime = Date.now()
      const startTime = new Date(currentSession.timestamp).getTime()
      const duration = endTime - startTime
      
      const finalSession = {
        ...currentSession,
        duration
      }
      
      setRecordedSessions(prev => [finalSession, ...prev.slice(0, 19)]) // Keep last 20 sessions
      setCurrentSession(null)
    }
  }

  const saveSession = (data: SessionData) => {
    setRecordedSessions(prev => {
      const existing = prev.find(s => s.sessionId === data.sessionId)
      if (existing) {
        return prev.map(s => s.sessionId === data.sessionId ? data : s)
      }
      return [data, ...prev.slice(0, 19)]
    })
  }

  const loadSession = (sessionId: string): SessionData | null => {
    return recordedSessions.find(s => s.sessionId === sessionId) || null
  }

  const deleteSession = (sessionId: string) => {
    setRecordedSessions(prev => prev.filter(s => s.sessionId !== sessionId))
  }

  const clearAllSessions = () => {
    setRecordedSessions([])
    setSessions([])
    setCurrentSession(null)
    localStorage.removeItem(STORAGE_KEY)
  }

  const replaySession = (sessionId: string) => {
    const session = loadSession(sessionId)
    if (!session) return

    setIsReplaying(true)
    setReplayProgress(0)
    setIsPaused(false)

    // Simulate replay by updating progress over time
    let progress = 0
    const interval = setInterval(() => {
      if (isPaused) return
      
      progress += 2 // 2% per interval
      setReplayProgress(progress)
      
      if (progress >= 100) {
        clearInterval(interval)
        setIsReplaying(false)
        setReplayProgress(0)
      }
    }, 200) // Update every 200ms
    
    setReplayTimer(interval)
  }

  const pauseReplay = () => {
    setIsPaused(true)
  }

  const resumeReplay = () => {
    setIsPaused(false)
  }

  const stopReplay = () => {
    if (replayTimer) {
      clearInterval(replayTimer)
      setReplayTimer(null)
    }
    setIsReplaying(false)
    setReplayProgress(0)
    setIsPaused(false)
  }

  const value: SessionContextType = {
    sessions,
    currentSession,
    recordedSessions,
    startRecording,
    stopRecording,
    saveSession,
    loadSession,
    deleteSession,
    clearAllSessions,
    replaySession,
    isReplaying,
    replayProgress,
    pauseReplay,
    resumeReplay,
    stopReplay
  }

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  )
}

export function useSession() {
  const context = useContext(SessionContext)
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionProvider')
  }
  return context
}
