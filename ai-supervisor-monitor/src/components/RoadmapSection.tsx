import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, Zap, Brain, Users, Globe, Sparkles } from 'lucide-react';

const RoadmapSection: React.FC = () => {
  const [selectedPhase, setSelectedPhase] = useState<number | null>(null);
  
  const roadmapPhases = [
    {
      phase: "Phase 1",
      title: "Deepen the Orchestration (More Autonomous)",
      status: "In Development",
      timeline: "Q1 2025",
      color: "blue",
      icon: <Zap className="w-6 h-6" />,
      description: "Enhanced orchestration capabilities with dynamic agent management and intelligent resource allocation for fully autonomous multi-agent coordination.",
      features: [
        {
          name: "Dynamic Agent Capabilities",
          description: "Query agents to discover capabilities or assign new tools on-the-fly with real-time skill assessment and adaptive capability matching"
        },
        {
          name: "Resource-Aware Task Assignment",
          description: "Consider agent load (CPU, memory, active tasks) for better load balancing with intelligent workload distribution based on available resources"
        },
        {
          name: "Sub-Orchestration",
          description: "Spawn sub-orchestrators with dedicated agent teams for complex goals enabling hierarchical task management with nested orchestration layers"
        }
      ]
    },
    {
      phase: "Phase 2",
      title: "Enhance the Supervisor's Senses (More Insightful)",
      status: "Planned",
      timeline: "Q2 2025",
      color: "green",
      icon: <Brain className="w-6 h-6" />,
      description: "Advanced sensing capabilities with specialized domain expertise, multi-modal analysis, and comprehensive cost monitoring.",
      features: [
        {
          name: "Code-aware Supervision",
          description: "Specialized CodeSupervisor with parsing, static analysis, syntax error detection, code smell identification, and security vulnerability checking"
        },
        {
          name: "Multi-modal Supervision",
          description: "Vision models for evaluating non-text output quality (images, media) with advanced analysis across text, code, images, and other data formats"
        },
        {
          name: "Cost Analysis",
          description: "Token usage tracking and operational cost reporting for LLM calls with real-time cost monitoring and optimization recommendations"
        }
      ]
    },
    {
      phase: "Phase 3",
      title: "Improve the Human/AI Interface (More Usable)",
      status: "Research",
      timeline: "Q3 2025",
      color: "purple",
      icon: <Users className="w-6 h-6" />,
      description: "Seamless human-AI collaboration with intuitive interfaces, real-time communication, and enterprise-grade user management.",
      features: [
        {
          name: "Real-time Log Streaming",
          description: "WebSocket-based real-time log streaming for fluid dashboard experience with live streaming of decision logs and system events"
        },
        {
          name: "Interactive Goal Definition",
          description: "Drag-and-drop UI for task creation and orchestrator plan modification with intuitive interface for defining and modifying AI agent objectives"
        },
        {
          name: "Authentication & Multi-User",
          description: "Proper login system for individual agent and project management with secure multi-user environment and role-based access control"
        }
      ]
    },
    {
      phase: "Vision",
      title: "The Last Milestone - The Ultimate Vision",
      status: "Future",
      timeline: "2025+",
      color: "gradient",
      icon: <Sparkles className="w-6 h-6" />,
      description: "The culmination of AI supervision technology achieving full autonomy, self-improvement, and perfect human-AI symbiosis.",
      features: [
        {
          name: "Full System Autonomy: The Supervisor as the User",
          description: "Complete autonomous operation with opportunity discovery through external data streams (market trends, GitHub repositories, financial news, business metrics) and self-sustaining platform integration (Upwork) with crypto wallet connectivity for earning operational fees"
        },
        {
          name: "Meta-Supervision: The System Improves Itself",
          description: "AI systems that supervise and improve other AI supervision systems with automated code refactoring based on performance metrics and automated prompt engineering with success rate tracking and optimization"
        },
        {
          name: "Human-AI Symbiosis: Beyond UI to True Partnership",
          description: "Perfect collaboration between human intelligence and AI capabilities featuring conversational planning with natural language goal setting, deeply explainable AI with full natural-language decision reports, and the 'Agent Academy' for automatic fine-tuning dataset generation"
        }
      ]
    }
  ];
  
  const getColorClasses = (color: string) => {
    const colors = {
      blue: {
        border: 'border-blue-500',
        bg: 'bg-blue-500/10',
        text: 'text-blue-400',
        icon: 'bg-blue-500',
        glow: 'shadow-blue-500/25'
      },
      green: {
        border: 'border-green-500',
        bg: 'bg-green-500/10',
        text: 'text-green-400',
        icon: 'bg-green-500',
        glow: 'shadow-green-500/25'
      },
      purple: {
        border: 'border-purple-500',
        bg: 'bg-purple-500/10',
        text: 'text-purple-400',
        icon: 'bg-purple-500',
        glow: 'shadow-purple-500/25'
      },
      gradient: {
        border: 'border-transparent bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500',
        bg: 'bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10',
        text: 'bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent',
        icon: 'bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500',
        glow: 'shadow-purple-500/25'
      }
    };
    return colors[color as keyof typeof colors];
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'In Development': return 'bg-blue-500 text-white';
      case 'Planned': return 'bg-green-500 text-white';
      case 'Research': return 'bg-purple-500 text-white';
      case 'Future': return 'bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };
  
  return (
    <section id="roadmap" className="py-20 bg-gradient-to-b from-gray-900 to-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Future <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">Roadmap</span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Our vision for the future of AI supervision and orchestration. 
            Each phase builds upon previous achievements to create the ultimate AI management platform.
          </p>
        </motion.div>
        
        {/* Desktop Timeline */}
        <div className="hidden lg:block relative">
          {/* Timeline Line */}
          <div className="absolute left-1/2 transform -translate-x-1/2 w-1 h-full bg-gradient-to-b from-blue-500 via-purple-500 to-pink-500 rounded-full"></div>
          
          {/* Timeline Items */}
          <div className="space-y-16">
            {roadmapPhases.map((phase, index) => {
              const colorClasses = getColorClasses(phase.color);
              const isEven = index % 2 === 0;
              
              return (
                <motion.div
                  key={phase.phase}
                  initial={{ opacity: 0, x: isEven ? -50 : 50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className={`relative flex items-center ${isEven ? 'justify-start' : 'justify-end'}`}
                >
                  {/* Timeline Node */}
                  <div className={`absolute left-1/2 transform -translate-x-1/2 w-4 h-4 ${colorClasses.icon} rounded-full shadow-lg ${colorClasses.glow} z-10`}></div>
                  
                  {/* Content Card */}
                  <div className={`w-5/12 ${isEven ? 'mr-auto pr-8' : 'ml-auto pl-8'}`}>
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      onClick={() => setSelectedPhase(selectedPhase === index ? null : index)}
                      className={`bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border ${colorClasses.border} cursor-pointer transition-all duration-300 hover:${colorClasses.glow} shadow-xl`}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className={`${colorClasses.icon} text-white rounded-lg p-2`}>
                            {phase.icon}
                          </div>
                          <div>
                            <h3 className={`text-xl font-bold ${colorClasses.text}`}>
                              {phase.title}
                            </h3>
                            <p className="text-gray-400 text-sm">{phase.phase}</p>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(phase.status)}`}>
                            {phase.status}
                          </div>
                          <p className="text-gray-400 text-sm mt-1">{phase.timeline}</p>
                        </div>
                      </div>
                      
                      <p className="text-gray-300 mb-4">{phase.description}</p>
                      
                      {/* Expandable Features */}
                      {selectedPhase === index && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                          className="border-t border-gray-700 pt-4 space-y-3"
                        >
                          {phase.features.map((feature, featureIndex) => (
                            <div key={featureIndex} className="flex items-start space-x-3">
                              <ChevronRight className={`w-4 h-4 mt-0.5 ${colorClasses.text} flex-shrink-0`} />
                              <div>
                                <h4 className="text-white font-medium text-sm">{feature.name}</h4>
                                <p className="text-gray-400 text-xs">{feature.description}</p>
                              </div>
                            </div>
                          ))}
                        </motion.div>
                      )}
                    </motion.div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
        
        {/* Mobile Timeline */}
        <div className="lg:hidden space-y-8">
          {roadmapPhases.map((phase, index) => {
            const colorClasses = getColorClasses(phase.color);
            
            return (
              <motion.div
                key={phase.phase}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                onClick={() => setSelectedPhase(selectedPhase === index ? null : index)}
                className={`bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border ${colorClasses.border} cursor-pointer transition-all duration-300`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`${colorClasses.icon} text-white rounded-lg p-2`}>
                      {phase.icon}
                    </div>
                    <div>
                      <h3 className={`text-xl font-bold ${colorClasses.text}`}>
                        {phase.title}
                      </h3>
                      <p className="text-gray-400 text-sm">{phase.phase}</p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(phase.status)}`}>
                      {phase.status}
                    </div>
                    <p className="text-gray-400 text-sm mt-1">{phase.timeline}</p>
                  </div>
                </div>
                
                <p className="text-gray-300 mb-4">{phase.description}</p>
                
                {selectedPhase === index && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="border-t border-gray-700 pt-4 space-y-3"
                  >
                    {phase.features.map((feature, featureIndex) => (
                      <div key={featureIndex} className="flex items-start space-x-3">
                        <ChevronRight className={`w-4 h-4 mt-0.5 ${colorClasses.text} flex-shrink-0`} />
                        <div>
                          <h4 className="text-white font-medium text-sm">{feature.name}</h4>
                          <p className="text-gray-400 text-xs">{feature.description}</p>
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>
        
        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          viewport={{ once: true }}
          className="text-center mt-16"
        >
          <div className="bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 backdrop-blur-sm rounded-2xl p-8 border border-purple-500/30">
            <h3 className="text-2xl font-bold text-white mb-4">
              Shape the Future of AI Supervision
            </h3>
            <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
              Join us in building the next generation of AI management platforms. 
              Your feedback and collaboration help drive our development roadmap.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-8 py-3 rounded-xl font-semibold transition-all duration-200 hover:scale-105">
                Join Beta Program
              </button>
              <button className="border border-purple-500 text-purple-400 hover:bg-purple-500/10 px-8 py-3 rounded-xl font-semibold transition-all duration-200">
                Request Features
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default RoadmapSection;