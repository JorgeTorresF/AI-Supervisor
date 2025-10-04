import React from 'react';
import { motion } from 'framer-motion';
import { Wifi, WifiOff, Activity, AlertTriangle, Check } from 'lucide-react';
import { SupervisorDecision } from '../lib/websocket';

interface ConnectionStatusProps {
  isConnected: boolean;
  connectionStatus: 'connected' | 'connecting' | 'disconnected' | 'demo';
  lastDecision: SupervisorDecision | null;
  onReconnect: () => void;
  onToggleDemo: () => void;
  isDemoMode: boolean;
}

const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  isConnected,
  connectionStatus,
  lastDecision,
  onReconnect,
  onToggleDemo,
  isDemoMode
}) => {
  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'text-green-400';
      case 'demo': return 'text-blue-400';
      case 'connecting': return 'text-yellow-400';
      default: return 'text-red-400';
    }
  };
  
  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected': return 'Connected to AI Supervisor';
      case 'demo': return 'Demo Mode - Sample Data';
      case 'connecting': return 'Connecting to WebSocket...';
      default: return 'Disconnected from Server';
    }
  };
  
  const getDecisionColor = (decision: string) => {
    switch (decision) {
      case 'ALLOW': return 'text-green-400 bg-green-400/10 border-green-400/20';
      case 'WARN': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
      case 'CORRECT': return 'text-orange-400 bg-orange-400/10 border-orange-400/20';
      case 'ESCALATE': return 'text-red-400 bg-red-400/10 border-red-400/20';
      default: return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
    }
  };
  
  const getDecisionIcon = (decision: string) => {
    switch (decision) {
      case 'ALLOW': return <Check className="w-4 h-4" />;
      case 'WARN': return <AlertTriangle className="w-4 h-4" />;
      case 'CORRECT': return <Activity className="w-4 h-4" />;
      case 'ESCALATE': return <AlertTriangle className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };
  
  return (
    <div className="bg-gray-900/95 backdrop-blur-sm border border-gray-700 rounded-xl p-6 mb-8">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        {/* Connection Status */}
        <div className="flex items-center space-x-3">
          <div className="relative">
            {isConnected ? (
              <Wifi className={`w-6 h-6 ${getStatusColor()}`} />
            ) : (
              <WifiOff className={`w-6 h-6 ${getStatusColor()}`} />
            )}
            {connectionStatus === 'connecting' && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-ping"></div>
            )}
          </div>
          <div>
            <p className={`font-semibold ${getStatusColor()}`}>
              {getStatusText()}
            </p>
            <p className="text-sm text-gray-400">
              WebSocket: ws://localhost:8765
            </p>
          </div>
        </div>
        
        {/* Last Decision */}
        {lastDecision && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className={`border rounded-lg px-4 py-2 ${getDecisionColor(lastDecision.decision)}`}
          >
            <div className="flex items-center space-x-2">
              {getDecisionIcon(lastDecision.decision)}
              <span className="font-semibold">{lastDecision.decision}</span>
              <span className="text-sm opacity-75">
                {Math.round(lastDecision.confidence * 100)}%
              </span>
            </div>
            <p className="text-xs mt-1 opacity-75">
              {new Date(lastDecision.timestamp).toLocaleTimeString()}
            </p>
          </motion.div>
        )}
        
        {/* Controls */}
        <div className="flex space-x-2">
          <button
            onClick={onToggleDemo}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
              isDemoMode 
                ? 'bg-blue-500 text-white hover:bg-blue-600' 
                : 'border border-gray-600 text-gray-300 hover:border-gray-500 hover:text-white'
            }`}
          >
            {isDemoMode ? 'Live Mode' : 'Demo Mode'}
          </button>
          
          {connectionStatus === 'disconnected' && (
            <button
              onClick={onReconnect}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium text-sm transition-all duration-200"
            >
              Reconnect
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConnectionStatus;