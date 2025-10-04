import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Play, RotateCcw, Settings } from 'lucide-react';
import { SupervisorMetrics } from '../lib/websocket';
import { predefinedScenarios } from '../lib/demoData';

interface InteractiveDemoProps {
  onSendDecisionRequest: (metrics: SupervisorMetrics) => void;
  isConnected: boolean;
}

const InteractiveDemo: React.FC<InteractiveDemoProps> = ({ onSendDecisionRequest, isConnected }) => {
  const [metrics, setMetrics] = useState<SupervisorMetrics>({
    quality_score: 0.8,
    error_count: 1,
    resource_usage: 0.4,
    task_progress: 0.7,
    drift_score: 0.1
  });
  
  const [selectedScenario, setSelectedScenario] = useState<string>('');
  
  const handleSliderChange = (key: keyof SupervisorMetrics, value: number) => {
    setMetrics(prev => ({ ...prev, [key]: value }));
    setSelectedScenario(''); // Clear scenario selection when manually adjusting
  };
  
  const handleScenarioSelect = (scenario: typeof predefinedScenarios[0]) => {
    setMetrics(scenario.metrics);
    setSelectedScenario(scenario.name);
  };
  
  const resetMetrics = () => {
    setMetrics({
      quality_score: 0.8,
      error_count: 1,
      resource_usage: 0.4,
      task_progress: 0.7,
      drift_score: 0.1
    });
    setSelectedScenario('');
  };
  
  const handleTestDecision = () => {
    onSendDecisionRequest(metrics);
  };
  
  const getSliderColor = (value: number, isInverted = false) => {
    const threshold = isInverted ? 0.3 : 0.7;
    const condition = isInverted ? value > threshold : value < threshold;
    
    if (condition) return 'bg-red-400';
    if (isInverted ? value > 0.6 : value < 0.5) return 'bg-yellow-400';
    return 'bg-green-400';
  };
  
  return (
    <section id="demo" className="py-20 bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Interactive <span className="text-blue-400">AI Supervisor</span> Demo
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Test different agent performance scenarios and see how the AI Supervisor responds 
            with intelligent decisions. Adjust metrics in real-time and observe the 
            decision-making process.
          </p>
        </motion.div>
        
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Controls Panel */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
            className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-white flex items-center">
                <Settings className="w-6 h-6 mr-3 text-blue-400" />
                Agent Metrics Control
              </h3>
              <button
                onClick={resetMetrics}
                className="flex items-center px-3 py-2 text-sm text-gray-400 hover:text-white border border-gray-600 hover:border-gray-500 rounded-lg transition-all duration-200"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset
              </button>
            </div>
            
            {/* Predefined Scenarios */}
            <div className="mb-8">
              <h4 className="text-lg font-semibold text-white mb-4">Quick Scenarios</h4>
              <div className="grid grid-cols-2 gap-3">
                {predefinedScenarios.map((scenario) => (
                  <button
                    key={scenario.name}
                    onClick={() => handleScenarioSelect(scenario)}
                    className={`p-3 rounded-lg text-left transition-all duration-200 ${
                      selectedScenario === scenario.name
                        ? 'bg-blue-600 text-white border-blue-500'
                        : 'bg-gray-700 text-gray-300 border-gray-600 hover:bg-gray-600'
                    } border`}
                  >
                    <div className="font-medium text-sm">{scenario.name}</div>
                    <div className="text-xs opacity-75">{scenario.description}</div>
                  </button>
                ))}
              </div>
            </div>
            
            {/* Manual Controls */}
            <div className="space-y-6">
              {/* Quality Score */}
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-white font-medium">Quality Score</label>
                  <span className="text-blue-400 font-mono">{metrics.quality_score.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={metrics.quality_score}
                  onChange={(e) => handleSliderChange('quality_score', parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                />
                <div className={`h-1 rounded-full mt-1 transition-all duration-300 ${getSliderColor(metrics.quality_score)}`} 
                     style={{ width: `${metrics.quality_score * 100}%` }}></div>
              </div>
              
              {/* Error Count */}
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-white font-medium">Error Count</label>
                  <span className="text-blue-400 font-mono">{metrics.error_count}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="1"
                  value={metrics.error_count}
                  onChange={(e) => handleSliderChange('error_count', parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                />
                <div className={`h-1 rounded-full mt-1 transition-all duration-300 ${getSliderColor(metrics.error_count / 10, true)}`} 
                     style={{ width: `${(metrics.error_count / 10) * 100}%` }}></div>
              </div>
              
              {/* Resource Usage */}
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-white font-medium">Resource Usage</label>
                  <span className="text-blue-400 font-mono">{(metrics.resource_usage * 100).toFixed(0)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={metrics.resource_usage}
                  onChange={(e) => handleSliderChange('resource_usage', parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                />
                <div className={`h-1 rounded-full mt-1 transition-all duration-300 ${getSliderColor(metrics.resource_usage, true)}`} 
                     style={{ width: `${metrics.resource_usage * 100}%` }}></div>
              </div>
              
              {/* Task Progress */}
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-white font-medium">Task Progress</label>
                  <span className="text-blue-400 font-mono">{(metrics.task_progress * 100).toFixed(0)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={metrics.task_progress}
                  onChange={(e) => handleSliderChange('task_progress', parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                />
                <div className={`h-1 rounded-full mt-1 transition-all duration-300 ${getSliderColor(metrics.task_progress)}`} 
                     style={{ width: `${metrics.task_progress * 100}%` }}></div>
              </div>
              
              {/* Drift Score */}
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-white font-medium">Drift Score</label>
                  <span className="text-blue-400 font-mono">{metrics.drift_score.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={metrics.drift_score}
                  onChange={(e) => handleSliderChange('drift_score', parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                />
                <div className={`h-1 rounded-full mt-1 transition-all duration-300 ${getSliderColor(metrics.drift_score, true)}`} 
                     style={{ width: `${metrics.drift_score * 100}%` }}></div>
              </div>
            </div>
            
            {/* Test Button */}
            <button
              onClick={handleTestDecision}
              disabled={!isConnected}
              className="w-full mt-8 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white py-4 rounded-xl font-semibold text-lg shadow-lg transform transition-all duration-200 hover:scale-105 disabled:scale-100 flex items-center justify-center"
            >
              <Play className="w-5 h-5 mr-2" />
              Test AI Supervisor Decision
            </button>
            
            {!isConnected && (
              <p className="text-center text-gray-400 text-sm mt-2">
                Demo mode active - decisions will be simulated
              </p>
            )}
          </motion.div>
          
          {/* Visualization Panel */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            viewport={{ once: true }}
            className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700"
          >
            <h3 className="text-2xl font-bold text-white mb-6">Real-Time Visualization</h3>
            
            {/* Metrics Gauges */}
            <div className="grid grid-cols-2 gap-6 mb-8">
              <div className="text-center">
                <div className="relative w-24 h-24 mx-auto mb-3">
                  <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 36 36">
                    <path
                      d="m18,2.0845 a 15.9155,15.9155 0 0,1 0,31.831 a 15.9155,15.9155 0 0,1 0,-31.831"
                      fill="none"
                      stroke="#374151"
                      strokeWidth="2"
                    />
                    <path
                      d="m18,2.0845 a 15.9155,15.9155 0 0,1 0,31.831 a 15.9155,15.9155 0 0,1 0,-31.831"
                      fill="none"
                      stroke={metrics.quality_score > 0.7 ? '#10B981' : metrics.quality_score > 0.5 ? '#F59E0B' : '#EF4444'}
                      strokeWidth="2"
                      strokeDasharray={`${metrics.quality_score * 100}, 100`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-white font-bold text-sm">{(metrics.quality_score * 100).toFixed(0)}%</span>
                  </div>
                </div>
                <p className="text-gray-300 font-medium">Quality</p>
              </div>
              
              <div className="text-center">
                <div className="relative w-24 h-24 mx-auto mb-3">
                  <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 36 36">
                    <path
                      d="m18,2.0845 a 15.9155,15.9155 0 0,1 0,31.831 a 15.9155,15.9155 0 0,1 0,-31.831"
                      fill="none"
                      stroke="#374151"
                      strokeWidth="2"
                    />
                    <path
                      d="m18,2.0845 a 15.9155,15.9155 0 0,1 0,31.831 a 15.9155,15.9155 0 0,1 0,-31.831"
                      fill="none"
                      stroke={metrics.resource_usage < 0.7 ? '#10B981' : metrics.resource_usage < 0.8 ? '#F59E0B' : '#EF4444'}
                      strokeWidth="2"
                      strokeDasharray={`${metrics.resource_usage * 100}, 100`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-white font-bold text-sm">{(metrics.resource_usage * 100).toFixed(0)}%</span>
                  </div>
                </div>
                <p className="text-gray-300 font-medium">Resources</p>
              </div>
            </div>
            
            {/* Demo Image */}
            <div className="rounded-xl overflow-hidden mb-6">
              <img 
                src="/real-time-data-visualization-react-graph.jpg" 
                alt="Real-time data visualization"
                className="w-full h-48 object-cover"
              />
            </div>
            
            {/* Current Metrics Summary */}
            <div className="bg-gray-900/50 rounded-xl p-4">
              <h4 className="text-white font-semibold mb-3">Current Metrics</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Quality Score:</span>
                  <span className={`font-mono ${
                    metrics.quality_score > 0.7 ? 'text-green-400' : 
                    metrics.quality_score > 0.5 ? 'text-yellow-400' : 'text-red-400'
                  }`}>{metrics.quality_score.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Error Count:</span>
                  <span className={`font-mono ${
                    metrics.error_count < 3 ? 'text-green-400' : 
                    metrics.error_count < 6 ? 'text-yellow-400' : 'text-red-400'
                  }`}>{metrics.error_count}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Resource Usage:</span>
                  <span className={`font-mono ${
                    metrics.resource_usage < 0.7 ? 'text-green-400' : 
                    metrics.resource_usage < 0.8 ? 'text-yellow-400' : 'text-red-400'
                  }`}>{(metrics.resource_usage * 100).toFixed(0)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Task Progress:</span>
                  <span className={`font-mono ${
                    metrics.task_progress > 0.7 ? 'text-green-400' : 
                    metrics.task_progress > 0.5 ? 'text-yellow-400' : 'text-red-400'
                  }`}>{(metrics.task_progress * 100).toFixed(0)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Drift Score:</span>
                  <span className={`font-mono ${
                    metrics.drift_score < 0.2 ? 'text-green-400' : 
                    metrics.drift_score < 0.5 ? 'text-yellow-400' : 'text-red-400'
                  }`}>{metrics.drift_score.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default InteractiveDemo;