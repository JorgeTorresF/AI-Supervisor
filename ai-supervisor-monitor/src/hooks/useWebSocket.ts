import { useState, useEffect } from 'react';
import { SupervisorWebSocket, SupervisorDecision, SupervisorMetrics } from '../lib/websocket';
import { demoDecisions, generateRealtimeDecision } from '../lib/demoData';
import { toast } from 'react-hot-toast';

interface UseWebSocketReturn {
  isConnected: boolean;
  decisions: SupervisorDecision[];
  sendDecisionRequest: (metrics: SupervisorMetrics) => void;
  startSession: (sessionId: string, agentName: string, taskDescription: string) => void;
  getDecisionLog: (limit?: number) => void;
  reconnect: () => void;
  lastDecision: SupervisorDecision | null;
  connectionStatus: 'connected' | 'connecting' | 'disconnected' | 'demo';
  toggleDemoMode: () => void;
  isDemoMode: boolean;
}

export function useWebSocket(): UseWebSocketReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [decisions, setDecisions] = useState<SupervisorDecision[]>([]);
  const [lastDecision, setLastDecision] = useState<SupervisorDecision | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected' | 'demo'>('connecting');
  const [ws, setWs] = useState<SupervisorWebSocket | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [demoInterval, setDemoInterval] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Initialize WebSocket
    const websocket = new SupervisorWebSocket();
    
    websocket.onConnectionChange = (connected: boolean) => {
      setIsConnected(connected);
      setConnectionStatus(connected ? 'connected' : 'disconnected');
      
      if (!connected && !isDemoMode) {
        // Auto-switch to demo mode after failed connection
        setTimeout(() => {
          if (!isConnected) {
            setIsDemoMode(true);
            setConnectionStatus('demo');
            setDecisions(demoDecisions);
            if (demoDecisions.length > 0) {
              setLastDecision(demoDecisions[0]);
            }
            toast.success('Switched to demo mode with sample data');
          }
        }, 5000);
      }
    };
    
    websocket.onDecisionReceived = (decision: SupervisorDecision) => {
      setDecisions(prev => [decision, ...prev.slice(0, 99)]); // Keep last 100
      setLastDecision(decision);
      
      // Show notification based on decision type
      const decisionColors = {
        ALLOW: 'success',
        WARN: 'warning', 
        CORRECT: 'error',
        ESCALATE: 'error'
      };
      
      const message = `AI Supervisor: ${decision.decision} (${Math.round(decision.confidence * 100)}% confidence)`;
      
      if (decision.decision === 'ALLOW') {
        toast.success(message);
      } else if (decision.decision === 'WARN') {
        toast(message, { icon: '⚠️' });
      } else {
        toast.error(message);
      }
    };
    
    websocket.onError = (error: string) => {
      console.error('WebSocket error:', error);
    };
    
    setWs(websocket);
    
    // Cleanup
    return () => {
      if (demoInterval) {
        clearInterval(demoInterval);
      }
      websocket.disconnect();
    };
  }, []);
  
  const sendDecisionRequest = (metrics: SupervisorMetrics) => {
    if (isDemoMode) {
      // Generate demo decision
      setTimeout(() => {
        const decision = generateRealtimeDecision();
        setDecisions(prev => [decision, ...prev.slice(0, 99)]);
        setLastDecision(decision);
        
        const message = `AI Supervisor: ${decision.decision} (${Math.round(decision.confidence * 100)}% confidence)`;
        if (decision.decision === 'ALLOW') {
          toast.success(message);
        } else if (decision.decision === 'WARN') {
          toast(message, { icon: '⚠️' });
        } else {
          toast.error(message);
        }
      }, 500 + Math.random() * 1000); // Simulate network delay
      return;
    }
    
    if (ws && isConnected) {
      ws.requestDecision(metrics);
    } else {
      toast.error('Not connected to AI Supervisor. Using demo mode.');
      setIsDemoMode(true);
      setConnectionStatus('demo');
    }
  };
  
  const startSession = (sessionId: string, agentName: string, taskDescription: string) => {
    if (isDemoMode) {
      toast.success(`Demo session started: ${sessionId}`);
      return;
    }
    
    if (ws && isConnected) {
      ws.startSession({ session_id: sessionId, agent_name: agentName, task_description: taskDescription });
    } else {
      toast.error('Cannot start session - not connected');
    }
  };
  
  const getDecisionLog = (limit = 50) => {
    if (isDemoMode) {
      setDecisions(demoDecisions);
      return;
    }
    
    if (ws && isConnected) {
      ws.getDecisionLog(limit);
    } else {
      toast.error('Cannot fetch logs - not connected');
    }
  };
  
  const reconnect = () => {
    if (ws) {
      setConnectionStatus('connecting');
      ws.reconnect();
    }
  };
  
  const toggleDemoMode = () => {
    const newDemoMode = !isDemoMode;
    setIsDemoMode(newDemoMode);
    
    if (newDemoMode) {
      setConnectionStatus('demo');
      setDecisions(demoDecisions);
      if (demoDecisions.length > 0) {
        setLastDecision(demoDecisions[0]);
      }
      
      // Start demo interval for periodic updates
      const interval = setInterval(() => {
        const decision = generateRealtimeDecision();
        setDecisions(prev => [decision, ...prev.slice(0, 99)]);
        setLastDecision(decision);
      }, 10000 + Math.random() * 15000); // Random interval 10-25 seconds
      
      setDemoInterval(interval);
      toast.success('Demo mode activated');
    } else {
      if (demoInterval) {
        clearInterval(demoInterval);
        setDemoInterval(null);
      }
      
      if (isConnected) {
        setConnectionStatus('connected');
      } else {
        setConnectionStatus('disconnected');
        reconnect();
      }
      toast.success('Live mode activated');
    }
  };
  
  return {
    isConnected: isDemoMode || isConnected,
    decisions,
    sendDecisionRequest,
    startSession,
    getDecisionLog,
    reconnect,
    lastDecision,
    connectionStatus,
    toggleDemoMode,
    isDemoMode
  };
}