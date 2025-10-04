import { toast } from 'react-hot-toast';

interface SupervisorMetrics {
  quality_score: number;
  error_count: number;
  resource_usage: number;
  task_progress: number;
  drift_score: number;
}

interface SupervisorDecision {
  success: boolean;
  decision: 'ALLOW' | 'WARN' | 'CORRECT' | 'ESCALATE';
  confidence: number;
  reasoning: string;
  timestamp: string;
  action_required: boolean;
}

interface SessionData {
  session_id: string;
  agent_name: string;
  task_description: string;
  timestamp: string;
}

class SupervisorWebSocket {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private isReconnecting = false;
  private messageQueue: any[] = [];
  
  // Event handlers
  public onConnectionChange: (connected: boolean) => void = () => {};
  public onDecisionReceived: (decision: SupervisorDecision) => void = () => {};
  public onError: (error: string) => void = () => {};
  public onMessage: (message: any) => void = () => {};
  
  private readonly WS_URL = 'ws://localhost:8765';
  
  constructor() {
    this.connect();
  }
  
  private connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) return;
    
    try {
      this.ws = new WebSocket(this.WS_URL);
      
      this.ws.onopen = () => {
        console.log('Connected to AI Supervisor WebSocket');
        this.onConnectionChange(true);
        this.reconnectAttempts = 0;
        this.isReconnecting = false;
        
        // Send queued messages
        while (this.messageQueue.length > 0) {
          const message = this.messageQueue.shift();
          this.send(message);
        }
        
        toast.success('Connected to AI Supervisor');
      };
      
      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('Received message:', data);
          
          if (data.success && data.decision) {
            this.onDecisionReceived(data as SupervisorDecision);
          }
          
          this.onMessage(data);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
          this.onError('Failed to parse server response');
        }
      };
      
      this.ws.onclose = (event) => {
        console.log('WebSocket connection closed:', event.code, event.reason);
        this.onConnectionChange(false);
        
        if (!this.isReconnecting && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.scheduleReconnect();
        } else if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          toast.error('Failed to connect to AI Supervisor. Using demo mode.');
          this.onError('Max reconnection attempts reached');
        }
      };
      
      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.onError('WebSocket connection error');
      };
      
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      this.onError('Failed to create WebSocket connection');
    }
  }
  
  private scheduleReconnect(): void {
    if (this.isReconnecting) return;
    
    this.isReconnecting = true;
    this.reconnectAttempts++;
    
    console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    setTimeout(() => {
      if (this.reconnectAttempts <= this.maxReconnectAttempts) {
        this.connect();
      }
    }, this.reconnectDelay * this.reconnectAttempts);
  }
  
  public send(message: any): boolean {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
      return true;
    } else {
      // Queue message for when connection is restored
      this.messageQueue.push(message);
      return false;
    }
  }
  
  public requestDecision(metrics: SupervisorMetrics): boolean {
    const message = {
      tool: 'get_minimax_decision',
      args: metrics
    };
    return this.send(message);
  }
  
  public startSession(sessionData: Omit<SessionData, 'timestamp'>): boolean {
    const message = {
      tool: 'start_session',
      args: {
        ...sessionData,
        timestamp: new Date().toISOString()
      }
    };
    return this.send(message);
  }
  
  public getDecisionLog(limit = 50): boolean {
    const message = {
      tool: 'get_decision_log',
      args: { limit }
    };
    return this.send(message);
  }
  
  public disconnect(): void {
    this.reconnectAttempts = this.maxReconnectAttempts; // Prevent reconnection
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
  
  public isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN || false;
  }
  
  public reconnect(): void {
    this.reconnectAttempts = 0;
    this.disconnect();
    setTimeout(() => this.connect(), 1000);
  }
}

export { SupervisorWebSocket, type SupervisorMetrics, type SupervisorDecision, type SessionData };