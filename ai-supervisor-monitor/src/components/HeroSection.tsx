import React from 'react';
import { motion } from 'framer-motion';
import { Activity, Shield, Zap, Cpu } from 'lucide-react';

interface HeroSectionProps {
  onScrollToDemo: () => void;
}

const HeroSection: React.FC<HeroSectionProps> = ({ onScrollToDemo }) => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background */}
      <div 
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: 'url(/ai_neural_network_dark_tech_background.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <div className="absolute inset-0 bg-gray-900/80"></div>
      </div>
      
      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-8"
        >
          <img 
            src="/supervisor-ai-robot-logo.png" 
            alt="AI Supervisor"
            className="w-32 h-32 mx-auto mb-8 rounded-2xl shadow-2xl"
          />
          
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
            AI Supervisor
            <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent block">
              & Orchestrator
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-4xl mx-auto leading-relaxed">
            Advanced real-time monitoring and intelligent decision-making system for AI agents 
            featuring Expectimax algorithms, self-improving learning loops, autonomous orchestration, 
            and proactive research capabilities. Prevent drift, ensure quality, and maintain 
            optimal performance with sophisticated supervision algorithms.
          </p>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12"
        >
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
            <Activity className="w-8 h-8 text-green-400 mx-auto mb-3" />
            <h3 className="text-white font-semibold mb-2">Real-Time Monitoring</h3>
            <p className="text-gray-400 text-sm">Live WebSocket connections for instant supervision</p>
          </div>
          
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
            <Shield className="w-8 h-8 text-blue-400 mx-auto mb-3" />
            <h3 className="text-white font-semibold mb-2">Intelligent Decisions</h3>
            <p className="text-gray-400 text-sm">ALLOW • WARN • CORRECT • ESCALATE</p>
          </div>
          
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
            <Zap className="w-8 h-8 text-yellow-400 mx-auto mb-3" />
            <h3 className="text-white font-semibold mb-2">Auto-Intervention</h3>
            <p className="text-gray-400 text-sm">Automated quality control and drift prevention</p>
          </div>
          
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
            <Cpu className="w-8 h-8 text-purple-400 mx-auto mb-3" />
            <h3 className="text-white font-semibold mb-2">Advanced Analytics</h3>
            <p className="text-gray-400 text-sm">Confidence scoring and pattern recognition</p>
          </div>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <button
            onClick={onScrollToDemo}
            className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white px-8 py-4 rounded-xl font-semibold text-lg shadow-lg transform transition-all duration-200 hover:scale-105"
          >
            Try Live Demo
          </button>
          
          <button 
            onClick={() => document.getElementById('architecture')?.scrollIntoView({ behavior: 'smooth' })}
            className="border-2 border-gray-600 hover:border-gray-500 text-gray-300 hover:text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-200 hover:bg-gray-800/50"
          >
            View Architecture
          </button>
        </motion.div>
      </div>
      
      {/* Floating elements */}
      <div className="absolute top-20 left-10 w-4 h-4 bg-blue-400 rounded-full opacity-60 animate-pulse"></div>
      <div className="absolute top-40 right-20 w-6 h-6 bg-cyan-400 rounded-full opacity-40 animate-bounce"></div>
      <div className="absolute bottom-40 left-20 w-3 h-3 bg-green-400 rounded-full opacity-50 animate-ping"></div>
    </section>
  );
};

export default HeroSection;