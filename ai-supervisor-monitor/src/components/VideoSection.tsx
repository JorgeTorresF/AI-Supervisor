import React from 'react';
import { motion } from 'framer-motion';
import { Play } from 'lucide-react';

const VideoSection: React.FC = () => {
  return (
    <section className="py-20 bg-gradient-to-b from-gray-900 to-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            See AI Supervisor in <span className="text-blue-400">Action</span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Watch our comprehensive demonstration of real-time AI agent monitoring, 
            intelligent decision-making with Expectimax algorithms, autonomous intervention 
            capabilities, and the future of human-AI collaboration.
          </p>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          viewport={{ once: true }}
          className="max-w-5xl mx-auto"
        >
          <div className="relative bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700 shadow-2xl">
            {/* Video Container */}
            <div className="relative bg-black rounded-xl overflow-hidden shadow-lg">
              <div style={{ paddingBottom: '56.25%', position: 'relative' }}>
                <iframe 
                  width="100%" 
                  height="100%" 
                  src="https://www.youtube-nocookie.com/embed/z7Ig-zj8j3I?autoplay=1&controls=0&loop=1&modestbranding=1&playlist=z7Ig-zj8j3I&rel=0" 
                  frameBorder="0" 
                  allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen"  
                  style={{position: 'absolute', top: '0px', left: '0px', width: '100%', height: '100%'}}
                  title="AI Supervisor Demo Video"
                >
                  <small>Powered by <a href="https://embed.tube/embed-code-generator/youtube/">youtube embed video</a> generator</small>
                </iframe>
              </div>
            </div>
            
            {/* Video Info */}
            <div className="mt-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold text-white mb-2">AI Supervisor Platform Demo</h3>
                <p className="text-gray-400">
                  Complete walkthrough of real-time monitoring, decision algorithms, and intervention systems
                </p>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="flex items-center text-green-400">
                  <Play className="w-5 h-5 mr-2" />
                  <span className="text-sm font-medium">Live Demo Available</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Feature Highlights */}
          <div className="grid md:grid-cols-3 gap-6 mt-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              viewport={{ once: true }}
              className="text-center bg-gray-800/30 backdrop-blur-sm rounded-xl p-6 border border-gray-700"
            >
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                <div className="w-6 h-6 bg-blue-400 rounded-full animate-pulse"></div>
              </div>
              <h4 className="text-white font-semibold mb-2">Real-Time Monitoring</h4>
              <p className="text-gray-400 text-sm">Live WebSocket connections track agent performance metrics continuously</p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              viewport={{ once: true }}
              className="text-center bg-gray-800/30 backdrop-blur-sm rounded-xl p-6 border border-gray-700"
            >
              <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                <div className="w-6 h-6 bg-green-400 rounded-full animate-bounce"></div>
              </div>
              <h4 className="text-white font-semibold mb-2">Intelligent Decisions</h4>
              <p className="text-gray-400 text-sm">AI-powered decision engine with confidence scoring and reasoning</p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              viewport={{ once: true }}
              className="text-center bg-gray-800/30 backdrop-blur-sm rounded-xl p-6 border border-gray-700"
            >
              <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                <div className="w-6 h-6 bg-purple-400 rounded-full animate-ping"></div>
              </div>
              <h4 className="text-white font-semibold mb-2">Auto-Intervention</h4>
              <p className="text-gray-400 text-sm">Automatic correction and escalation based on performance thresholds</p>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default VideoSection;