import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Menu, X, Activity, Home, Play, Settings, Map, Code } from 'lucide-react';

interface NavigationProps {
  isConnected: boolean;
}

const Navigation: React.FC<NavigationProps> = ({ isConnected }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const navigationItems = [
    { name: 'Home', href: '#', icon: <Home className="w-4 h-4" /> },
    { name: 'Demo', href: '#demo', icon: <Play className="w-4 h-4" /> },
    { name: 'Features', href: '#features', icon: <Settings className="w-4 h-4" /> },
    { name: 'Roadmap', href: '#roadmap', icon: <Map className="w-4 h-4" /> },
    { name: 'Vision', href: '#vision', icon: <Activity className="w-4 h-4" /> },
    { name: 'Architecture', href: '#architecture', icon: <Code className="w-4 h-4" /> }
  ];
  
  const scrollToSection = (href: string) => {
    if (href === '#') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      const element = document.querySelector(href);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
    setIsMenuOpen(false);
  };
  
  return (
    <nav className="fixed top-0 w-full z-50 bg-gray-900/95 backdrop-blur-sm border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <img 
              src="/supervisor-ai-robot-logo.png" 
              alt="AI Supervisor Robot Logo"
              className="w-8 h-8 rounded-lg object-contain"
            />
            <span className="text-white font-bold text-xl">
              AI Supervisor
            </span>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navigationItems.map((item) => (
              <button
                key={item.name}
                onClick={() => scrollToSection(item.href)}
                className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors duration-200"
              >
                {item.icon}
                <span>{item.name}</span>
              </button>
            ))}
          </div>
          
          {/* Status Indicator & Mobile Menu */}
          <div className="flex items-center space-x-4">
            {/* Connection Status */}
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
              <span className="hidden sm:block text-sm text-gray-400">
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            
            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden text-gray-300 hover:text-white transition-colors duration-200"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
        
        {/* Mobile Menu */}
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="md:hidden bg-gray-800/95 backdrop-blur-sm border-t border-gray-700"
          >
            <div className="px-4 py-4 space-y-2">
              {navigationItems.map((item) => (
                <button
                  key={item.name}
                  onClick={() => scrollToSection(item.href)}
                  className="flex items-center space-x-3 w-full text-left px-3 py-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-all duration-200"
                >
                  {item.icon}
                  <span>{item.name}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;