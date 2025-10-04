import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Rocket, Infinity, Globe, Brain, Users } from 'lucide-react';

const UltimateVisionSection: React.FC = () => {
  const visionPillars = [
    {
      icon: <Rocket className="w-8 h-8" />,
      title: "Full System Autonomy",
      subtitle: "The Supervisor as the User",
      color: "blue",
      description: "Complete autonomous operation with self-sustaining capabilities and opportunity discovery.",
      features: [
        {
          name: "Opportunity Discovery",
          description: "Connection to external data streams including market trends, GitHub repositories, financial news, and business metrics for autonomous opportunity identification and strategic decision-making."
        },
        {
          name: "Self-Sustaining Operation",
          description: "Platform integration with services like Upwork and crypto wallet connectivity enabling the system to earn operational fees and maintain itself financially without human intervention."
        },
        {
          name: "Autonomous Business Intelligence",
          description: "Real-time analysis of market conditions, competitive landscapes, and emerging opportunities to guide strategic autonomous actions and resource allocation."
        }
      ]
    },
    {
      icon: <Infinity className="w-8 h-8" />,
      title: "Meta-Supervision",
      subtitle: "The System Improves Itself",
      color: "purple",
      description: "AI systems that supervise and improve other AI supervision systems with recursive enhancement.",
      features: [
        {
          name: "Automated Code Refactoring",
          description: "Performance metric analysis leading to autonomous code rewriting, optimization, and architectural improvements without human intervention, continuously enhancing system efficiency."
        },
        {
          name: "Automated Prompt Engineering",
          description: "Success rate tracking and prompt optimization for ASSISTANCE interventions, with AI-driven improvement of communication strategies and intervention effectiveness."
        },
        {
          name: "Recursive Self-Improvement",
          description: "Multi-layered supervision where AI supervisors monitor and improve other AI supervisors, creating a self-evolving hierarchy of intelligence and capability enhancement."
        }
      ]
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "Human-AI Symbiosis",
      subtitle: "Beyond UI to True Partnership",
      color: "green",
      description: "Perfect collaboration transcending traditional interfaces to achieve true intellectual partnership.",
      features: [
        {
          name: "Conversational Planning",
          description: "Natural language goal setting with clarifying questions and dynamic plan adjustment, enabling intuitive human-AI collaboration without technical barriers or complex interfaces."
        },
        {
          name: "Deeply Explainable AI (XAI)",
          description: "Full natural-language reports explaining every decision, assumption, identified ambiguity, and confidence level, providing unprecedented transparency in AI reasoning processes."
        },
        {
          name: "The Agent Academy",
          description: "Automatic generation of fine-tuning datasets and training materials from success/failure history, creating a self-improving educational system for AI agents and human collaborators."
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
        icon: 'bg-blue-500/20',
        glow: 'shadow-blue-500/25'
      },
      purple: {
        border: 'border-purple-500/30',
        bg: 'bg-purple-500/10',
        text: 'text-purple-400',
        icon: 'bg-purple-500/20',
        glow: 'shadow-purple-500/25'
      },
      green: {
        border: 'border-green-500/30',
        bg: 'bg-green-500/10',
        text: 'text-green-400',
        icon: 'bg-green-500/20',
        glow: 'shadow-green-500/25'
      }
    };
    return colors[color as keyof typeof colors];
  };
  
  return (
    <section id="vision" className="py-20 bg-gradient-to-b from-gray-800 to-gray-900 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl"></div>
        <div className="absolute top-3/4 left-1/2 w-64 h-64 bg-green-500/5 rounded-full blur-3xl"></div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="flex items-center justify-center mb-6">
            <Sparkles className="w-12 h-12 text-yellow-400 mr-4 animate-pulse" />
            <h2 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-green-400 bg-clip-text text-transparent">
              The Last Milestone
            </h2>
            <Sparkles className="w-12 h-12 text-yellow-400 ml-4 animate-pulse" />
          </div>
          
          <h3 className="text-3xl md:text-4xl font-bold text-white mb-6">
            The Ultimate Vision
          </h3>
          
          <p className="text-xl text-gray-300 max-w-4xl mx-auto leading-relaxed">
            The culmination of AI supervision technology: a fully autonomous system that 
            discovers opportunities, improves itself, and partners with humans in ways 
            that transcend current technological boundaries.
          </p>
          
          <div className="mt-8 flex items-center justify-center space-x-4">
            <Globe className="w-6 h-6 text-blue-400 animate-spin" style={{ animationDuration: '10s' }} />
            <span className="text-gray-400">Global Impact</span>
            <Brain className="w-6 h-6 text-purple-400 animate-pulse" />
            <span className="text-gray-400">Artificial General Intelligence</span>
            <Infinity className="w-6 h-6 text-green-400 animate-bounce" />
            <span className="text-gray-400">Unlimited Potential</span>
          </div>
        </motion.div>
        
        {/* Vision Pillars */}
        <div className="space-y-16">
          {visionPillars.map((pillar, index) => {
            const colorClasses = getColorClasses(pillar.color);
            const isEven = index % 2 === 0;
            
            return (
              <motion.div
                key={pillar.title}
                initial={{ opacity: 0, x: isEven ? -50 : 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: index * 0.2 }}
                viewport={{ once: true }}
                className={`relative ${isEven ? 'lg:pr-8' : 'lg:pl-8'}`}
              >
                <div className={`bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border ${colorClasses.border} ${colorClasses.glow} shadow-2xl hover:scale-105 transition-all duration-300`}>
                  {/* Header */}
                  <div className="flex items-start space-x-6 mb-8">
                    <div className={`${colorClasses.icon} ${colorClasses.text} rounded-xl p-4 flex-shrink-0`}>
                      {pillar.icon}
                    </div>
                    
                    <div className="flex-1">
                      <h3 className={`text-3xl font-bold ${colorClasses.text} mb-2`}>
                        {pillar.title}
                      </h3>
                      <h4 className="text-xl font-semibold text-white mb-4">
                        {pillar.subtitle}
                      </h4>
                      <p className="text-gray-300 text-lg leading-relaxed">
                        {pillar.description}
                      </p>
                    </div>
                  </div>
                  
                  {/* Features */}
                  <div className="space-y-6">
                    {pillar.features.map((feature, featureIndex) => (
                      <motion.div
                        key={feature.name}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: featureIndex * 0.1 }}
                        viewport={{ once: true }}
                        className={`${colorClasses.bg} rounded-xl p-6 border ${colorClasses.border}`}
                      >
                        <h5 className={`text-lg font-bold ${colorClasses.text} mb-3`}>
                          {feature.name}
                        </h5>
                        <p className="text-gray-300 leading-relaxed">
                          {feature.description}
                        </p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
        
        {/* Timeline to Vision */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          viewport={{ once: true }}
          className="mt-20 text-center"
        >
          <div className="bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-green-500/10 backdrop-blur-sm rounded-2xl p-8 border border-purple-500/30">
            <h3 className="text-3xl font-bold text-white mb-6">
              The Journey to <span className="bg-gradient-to-r from-blue-400 to-green-400 bg-clip-text text-transparent">Ultimate AI</span>
            </h3>
            
            <p className="text-gray-300 mb-8 max-w-3xl mx-auto text-lg">
              This vision represents the convergence of decades of AI research, autonomous systems development, 
              and human-computer interaction design. Each milestone builds toward a future where AI systems 
              operate with unprecedented autonomy while maintaining perfect alignment with human values and goals.
            </p>
            
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-400 mb-2">2025+</div>
                <div className="text-gray-300">Development Timeline</div>
              </div>
              
              <div className="text-center">
                <div className="text-4xl font-bold text-purple-400 mb-2">∞</div>
                <div className="text-gray-300">Potential Impact</div>
              </div>
              
              <div className="text-center">
                <div className="text-4xl font-bold text-green-400 mb-2">100%</div>
                <div className="text-gray-300">Human-AI Harmony</div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default UltimateVisionSection;