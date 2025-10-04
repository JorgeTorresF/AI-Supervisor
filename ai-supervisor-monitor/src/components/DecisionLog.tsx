import React from 'react';
import { motion } from 'framer-motion';
import { Clock, AlertTriangle, CheckCircle, XCircle, Activity } from 'lucide-react';
import { SupervisorDecision } from '../lib/websocket';

interface DecisionLogProps {
  decisions: SupervisorDecision[];
}

const DecisionLog: React.FC<DecisionLogProps> = ({ decisions }) => {
  const getDecisionIcon = (decision: string) => {
    switch (decision) {
      case 'ALLOW': return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'WARN': return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
      case 'CORRECT': return <Activity className="w-5 h-5 text-orange-400" />;
      case 'ESCALATE': return <XCircle className="w-5 h-5 text-red-400" />;
      default: return <Activity className="w-5 h-5 text-gray-400" />;
    }
  };
  
  const getDecisionColor = (decision: string) => {
    switch (decision) {
      case 'ALLOW': return 'border-green-500/30 bg-green-500/10';
      case 'WARN': return 'border-yellow-500/30 bg-yellow-500/10';
      case 'CORRECT': return 'border-orange-500/30 bg-orange-500/10';
      case 'ESCALATE': return 'border-red-500/30 bg-red-500/10';
      default: return 'border-gray-500/30 bg-gray-500/10';
    }
  };
  
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return {
      time: date.toLocaleTimeString(),
      date: date.toLocaleDateString()
    };
  };
  
  if (decisions.length === 0) {
    return (
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-8 border border-gray-700 text-center">
        <Activity className="w-12 h-12 text-gray-500 mx-auto mb-4" />
        <h3 className="text-white font-semibold mb-2">No Decisions Yet</h3>
        <p className="text-gray-400">Start testing the supervisor to see decisions appear here</p>
      </div>
    );
  }
  
  return (
    <section className="py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="mb-8"
        >
          <h3 className="text-2xl font-bold text-white mb-4 flex items-center">
            <Clock className="w-6 h-6 mr-3 text-blue-400" />
            Decision Log
          </h3>
          <p className="text-gray-400">
            Real-time log of all supervisor decisions with confidence scores and reasoning
          </p>
        </motion.div>
        
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {decisions.map((decision, index) => {
            const timestamp = formatTimestamp(decision.timestamp);
            
            return (
              <motion.div
                key={`${decision.timestamp}-${index}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                className={`border rounded-xl p-4 ${getDecisionColor(decision.decision)} transition-all duration-200 hover:border-opacity-50`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <div className="mt-1">
                      {getDecisionIcon(decision.decision)}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="font-semibold text-white">
                          {decision.decision}
                        </span>
                        <span className="text-sm font-mono text-gray-400">
                          {Math.round(decision.confidence * 100)}% confidence
                        </span>
                        {decision.action_required && (
                          <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded-full border border-red-500/30">
                            Action Required
                          </span>
                        )}
                      </div>
                      
                      <p className="text-gray-300 text-sm leading-relaxed">
                        {decision.reasoning}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right text-xs text-gray-500 ml-4">
                    <div>{timestamp.time}</div>
                    <div>{timestamp.date}</div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
        
        {decisions.length > 0 && (
          <div className="mt-6 text-center">
            <p className="text-gray-400 text-sm">
              Showing {decisions.length} recent decisions
            </p>
          </div>
        )}
      </div>
    </section>
  );
};

export default DecisionLog;