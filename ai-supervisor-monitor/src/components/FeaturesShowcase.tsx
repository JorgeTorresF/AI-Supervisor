import React from 'react';
import { motion } from 'framer-motion';
import { Brain, Target, Users, Search, Zap, TreePine, Eye, Cpu } from 'lucide-react';

const FeaturesShowcase: React.FC = () => {
  const featureCategories = [
    {
      title: "The Intelligent Supervisor Core",
      description: "Sophisticated AI decision-making with probabilistic future simulation",
      color: "blue",
      features: [
        {
          icon: <Brain className="w-6 h-6" />,
          title: "Probabilistic Decision-Making (Expectimax Agent)",
          description: "Sophisticated Expectimax algorithm that 'looks into the future' by simulating likely outcomes of interventions (ALLOW, WARN, CORRECT, ESCALATE) and choosing the highest expected value for optimal long-term results.",
          highlights: [
            "Future outcome simulation", 
            "Expected value optimization", 
            "Strategic intervention planning",
            "Probabilistic reasoning engine"
          ]
        },
        {
          icon: <Target className="w-6 h-6" />,
          title: "Multi-Factor State Evaluation",
          description: "Comprehensive analysis system evaluating multiple dimensions of agent performance with precise scoring mechanisms.",
          highlights: [
            "Output Quality: Score representing generated content quality",
            "Task Coherence: Drift score measuring goal adherence", 
            "Error Count: Tracking intervention requirements",
            "Resource Usage: Token monitoring preventing runaways",
            "Task Progress: Completion proximity measurement"
          ]
        },
        {
          icon: <Eye className="w-6 h-6" />,
          title: "Advanced Senses for Deeper Insight",
          description: "Multi-layered perception system providing nuanced understanding of agent behavior through specialized analysis modules.",
          highlights: [
            "LLM Judge: Claude 3 Opus second opinions for quality",
            "Coherence Analyzer: Logical consistency verification", 
            "Instruction Alignment: Goal adherence monitoring",
            "Context Understanding: Deep semantic analysis"
          ]
        }
      ]
    },
    {
      title: "The Self-Improving System (Learning & Debugging)",
      description: "Continuous learning and adaptation with human feedback integration",
      color: "green",
      features: [
        {
          icon: <Target className="w-6 h-6" />,
          title: "Feedback-Driven Learning Loop",
          description: "Comprehensive human-in-the-loop learning system that captures corrections and automatically improves decision-making through structured feedback and retraining cycles.",
          highlights: [
            "Human Correction: Dashboard-based decision correction capability",
            "Feedback Storage: Structured linking of corrections to supervisor states", 
            "Automated Retraining: Dashboard-triggered training with FeedbackTrainer",
            "Live Updates: Real-time weight adjustment improving judgment"
          ]
        },
        {
          icon: <TreePine className="w-6 h-6" />,
          title: "Interactive Decision Debugger",
          description: "Advanced visualization and debugging system providing transparent insight into the supervisor's decision-making process with interactive exploration capabilities.",
          highlights: [
            "Visual Decision Tree: Mermaid.js graphical thought process flowchart",
            "Node Inspector: Clickable nodes with exact details and scores", 
            "Simulation Tracking: Step-by-step decision path visualization",
            "Performance Analytics: Decision accuracy and improvement metrics"
          ]
        }
      ]
    },
    {
      title: "The Autonomous Orchestrator",
      description: "Intelligent multi-agent coordination and project management system",
      color: "purple",
      features: [
        {
          icon: <Users className="w-6 h-6" />,
          title: "Agent Pool Management",
          description: "Sophisticated agent lifecycle management system maintaining specialized agents with registered capabilities (python, file_io, text_analysis) and intelligent workload distribution.",
          highlights: [
            "Capability Registration: Detailed agent skill and tool inventory",
            "Dynamic Allocation: Real-time agent assignment optimization", 
            "Load Balancing: Workload distribution across available agents",
            "Performance Tracking: Agent efficiency and success rate monitoring"
          ]
        },
        {
          icon: <Cpu className="w-6 h-6" />,
          title: "LLM-Powered Task Planner",
          description: "Advanced project management AI that acts as an intelligent coordinator, decomposing high-level goals into logical multi-step plans with comprehensive dependency management.",
          highlights: [
            "Goal Decomposition: Complex objectives broken into manageable tasks",
            "Dependency Analysis: Task relationship mapping and sequencing", 
            "Resource Planning: Agent and tool requirement assessment",
            "Progress Monitoring: Real-time project status and bottleneck detection"
          ]
        },
        {
          icon: <Zap className="w-6 h-6" />,
          title: "Supervisor Integration & Autonomous Execution",
          description: "Seamless integration with the Intelligent Supervisor Core for continuous monitoring of each assigned task with automated intervention and quality assurance.",
          highlights: [
            "Continuous Monitoring: Real-time task execution supervision",
            "Quality Assurance: Automated output validation and correction", 
            "Intervention Management: Smart escalation and assistance delivery",
            "Success Optimization: Performance-based task routing and assignment"
          ]
        }
      ]
    },
    {
      title: "Proactive Research & Assistance",
      description: "Intelligent problem-solving with autonomous research and contextual assistance",
      color: "orange",
      features: [
        {
          icon: <Search className="w-6 h-6" />,
          title: "Stuck Agent Detection & Autonomous Web Research",
          description: "Advanced monitoring system that detects agent difficulties and automatically conducts targeted web research to provide actionable solutions and guidance.",
          highlights: [
            "Stuck Detection: Tracks consecutive failures on identical tasks",
            "Query Formulation: Precise Google Search queries from agent errors", 
            "URL Selection: Intelligent targeting of promising sources (Stack Overflow)",
            "Content Analysis: Automated webpage reading and information extraction"
          ]
        },
        {
          icon: <Zap className="w-6 h-6" />,
          title: "LLM-Powered Suggestion Synthesis",
          description: "Advanced content processing system that transforms raw research data into concise, actionable suggestions specifically tailored to the agent's current challenge.",
          highlights: [
            "Content Processing: Raw text transformation into actionable insights",
            "Context Awareness: Solutions tailored to specific agent challenges", 
            "Suggestion Ranking: Priority-based recommendation ordering",
            "Relevance Filtering: Noise reduction and accuracy optimization"
          ]
        },
        {
          icon: <Target className="w-6 h-6" />,
          title: "ASSISTANCE Interventions",
          description: "Specialized intervention system providing proactive assistance with intelligent timing and contextual help delivery through prominently highlighted dashboard notifications.",
          highlights: [
            "Proactive Assistance: Anticipatory help before critical failures",
            "Intelligent Timing: Optimal intervention moment identification", 
            "Contextual Help: Situation-specific guidance and suggestions",
            "Dashboard Delivery: Highlighted assistance notifications and hints"
          ]
        }
      ]
    }
  ];
  
  const getColorClasses = (color: string) => {
    const colors = {
      blue: {
        border: 'border-blue-500/30',
        bg: 'bg-blue-500/10',
        text: 'text-blue-400',
        icon: 'bg-blue-500/20'
      },
      green: {
        border: 'border-green-500/30',
        bg: 'bg-green-500/10',
        text: 'text-green-400',
        icon: 'bg-green-500/20'
      },
      purple: {
        border: 'border-purple-500/30',
        bg: 'bg-purple-500/10',
        text: 'text-purple-400',
        icon: 'bg-purple-500/20'
      },
      orange: {
        border: 'border-orange-500/30',
        bg: 'bg-orange-500/10',
        text: 'text-orange-400',
        icon: 'bg-orange-500/20'
      }
    };
    return colors[color as keyof typeof colors];
  };
  
  return (
    <section id="features" className="py-20 bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Comprehensive <span className="text-blue-400">Feature Set</span>
          </h2>
          <p className="text-xl text-gray-300 max-w-4xl mx-auto">
            Advanced AI supervision platform featuring sophisticated intelligence algorithms, 
            self-improving learning systems, autonomous multi-agent orchestration, and 
            proactive research capabilities with deep technical implementations.
          </p>
        </motion.div>
        
        <div className="space-y-16">
          {featureCategories.map((category, categoryIndex) => {
            const colorClasses = getColorClasses(category.color);
            
            return (
              <motion.div
                key={category.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: categoryIndex * 0.1 }}
                viewport={{ once: true }}
                className="relative"
              >
                {/* Category Header */}
                <div className={`${colorClasses.bg} ${colorClasses.border} border rounded-2xl p-8 mb-8`}>
                  <div className="text-center">
                    <h3 className={`text-3xl font-bold ${colorClasses.text} mb-4`}>
                      {category.title}
                    </h3>
                    <p className="text-gray-300 text-lg max-w-2xl mx-auto">
                      {category.description}
                    </p>
                  </div>
                </div>
                
                {/* Features Grid */}
                <div className="grid md:grid-cols-2 gap-8">
                  {category.features.map((feature, featureIndex) => (
                    <motion.div
                      key={feature.title}
                      initial={{ opacity: 0, x: featureIndex % 2 === 0 ? -20 : 20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.6, delay: featureIndex * 0.1 }}
                      viewport={{ once: true }}
                      className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-8 border border-gray-700 hover:border-gray-600 transition-all duration-300 group"
                    >
                      <div className="flex items-start space-x-4">
                        <div className={`${colorClasses.icon} ${colorClasses.text} rounded-xl p-3 group-hover:scale-110 transition-transform duration-300`}>
                          {feature.icon}
                        </div>
                        
                        <div className="flex-1">
                          <h4 className="text-white font-bold text-xl mb-3">
                            {feature.title}
                          </h4>
                          <p className="text-gray-300 mb-4 leading-relaxed">
                            {feature.description}
                          </p>
                          
                          {/* Feature Highlights */}
                          <div className="space-y-2">
                            {feature.highlights.map((highlight, index) => (
                              <div key={index} className="flex items-center space-x-2">
                                <div className={`w-2 h-2 rounded-full ${colorClasses.text.replace('text-', 'bg-')}`}></div>
                                <span className="text-gray-400 text-sm">{highlight}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>
        
        {/* Feature Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          viewport={{ once: true }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16"
        >
          <div className="text-center bg-gray-800/30 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
            <div className="text-3xl font-bold text-blue-400 mb-2">12+</div>
            <div className="text-gray-300 text-sm">Core Features</div>
            <div className="text-gray-500 text-xs mt-1">Advanced Capabilities</div>
          </div>
          
          <div className="text-center bg-gray-800/30 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
            <div className="text-3xl font-bold text-green-400 mb-2">95%+</div>
            <div className="text-gray-300 text-sm">Decision Accuracy</div>
            <div className="text-gray-500 text-xs mt-1">Expectimax Algorithm</div>
          </div>
          
          <div className="text-center bg-gray-800/30 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
            <div className="text-3xl font-bold text-purple-400 mb-2">&lt;50ms</div>
            <div className="text-gray-300 text-sm">Response Time</div>
            <div className="text-gray-500 text-xs mt-1">WebSocket Real-time</div>
          </div>
          
          <div className="text-center bg-gray-800/30 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
            <div className="text-3xl font-bold text-orange-400 mb-2">24/7</div>
            <div className="text-gray-300 text-sm">Autonomous Monitoring</div>
            <div className="text-gray-500 text-xs mt-1">Multi-Agent Orchestration</div>
          </div>
        </motion.div>
        
        {/* Technical Specifications */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          viewport={{ once: true }}
          className="mt-16 bg-gradient-to-r from-blue-500/10 to-purple-500/10 backdrop-blur-sm rounded-2xl p-8 border border-blue-500/30"
        >
          <h3 className="text-2xl font-bold text-white mb-6 text-center">
            Technical <span className="text-blue-400">Specifications</span>
          </h3>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <h4 className="text-white font-semibold mb-4 flex items-center">
                <div className="w-3 h-3 bg-blue-400 rounded-full mr-3"></div>
                Core Intelligence
              </h4>
              <ul className="space-y-2 text-gray-300 text-sm">
                <li>• Expectimax probabilistic algorithm</li>
                <li>• Multi-factor state evaluation engine</li>
                <li>• LLM Judge (Claude 3 Opus) integration</li>
                <li>• Coherence analysis and drift detection</li>
                <li>• Real-time confidence scoring</li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4 flex items-center">
                <div className="w-3 h-3 bg-green-400 rounded-full mr-3"></div>
                Learning System
              </h4>
              <ul className="space-y-2 text-gray-300 text-sm">
                <li>• Human-in-the-loop feedback capture</li>
                <li>• Automated retraining with FeedbackTrainer</li>
                <li>• Interactive decision tree visualization</li>
                <li>• Real-time weight adjustment</li>
                <li>• Performance analytics and metrics</li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4 flex items-center">
                <div className="w-3 h-3 bg-purple-400 rounded-full mr-3"></div>
                Orchestration
              </h4>
              <ul className="space-y-2 text-gray-300 text-sm">
                <li>• Multi-agent pool management</li>
                <li>• LLM-powered task planning</li>
                <li>• Dependency-based execution</li>
                <li>• Autonomous web research</li>
                <li>• Proactive assistance delivery</li>
              </ul>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default FeaturesShowcase;