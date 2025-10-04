import React, { useRef } from 'react';
import { Toaster } from 'react-hot-toast';
import { useWebSocket } from './hooks/useWebSocket';

// Components
import Navigation from './components/Navigation';
import HeroSection from './components/HeroSection';
import VideoSection from './components/VideoSection';
import ConnectionStatus from './components/ConnectionStatus';
import InteractiveDemo from './components/InteractiveDemo';
import DecisionLog from './components/DecisionLog';
import FeaturesShowcase from './components/FeaturesShowcase';
import RoadmapSection from './components/RoadmapSection';
import UltimateVisionSection from './components/UltimateVisionSection';
import ArchitectureSection from './components/ArchitectureSection';

function App() {
  const {
    isConnected,
    decisions,
    sendDecisionRequest,
    startSession,
    getDecisionLog,
    reconnect,
    lastDecision,
    connectionStatus,
    toggleDemoMode,
    isDemoMode
  } = useWebSocket();
  
  const demoRef = useRef<HTMLDivElement>(null);
  
  const scrollToDemo = () => {
    demoRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900">
      {/* Navigation */}
      <Navigation isConnected={isConnected} />
      
      {/* Hero Section */}
      <HeroSection onScrollToDemo={scrollToDemo} />
      
      {/* Video Section */}
      <VideoSection />
      
      {/* Interactive Demo Section */}
      <div ref={demoRef}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Connection Status */}
          <ConnectionStatus
            isConnected={isConnected}
            connectionStatus={connectionStatus}
            lastDecision={lastDecision}
            onReconnect={reconnect}
            onToggleDemo={toggleDemoMode}
            isDemoMode={isDemoMode}
          />
        </div>
        
        {/* Interactive Demo */}
        <InteractiveDemo
          onSendDecisionRequest={sendDecisionRequest}
          isConnected={isConnected}
        />
        
        {/* Decision Log */}
        {decisions.length > 0 && (
          <div className="bg-gray-900">
            <DecisionLog decisions={decisions} />
          </div>
        )}
      </div>
      
      {/* Features Showcase */}
      <FeaturesShowcase />
      
      {/* Roadmap Section */}
      <RoadmapSection />
      
      {/* Ultimate Vision Section */}
      <UltimateVisionSection />
      
      {/* Architecture Section */}
      <ArchitectureSection />
      
      {/* Footer */}
      <footer className="bg-gray-900 border-t border-gray-800 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <img 
                  src="/supervisor-ai-robot-logo.png" 
                  alt="AI Supervisor Robot Logo"
                  className="w-10 h-10 rounded-lg object-contain"
                />
                <span className="text-white font-bold text-2xl">
                  AI Supervisor
                </span>
              </div>
              <p className="text-gray-400 mb-4 max-w-md">
                Advanced AI supervision and orchestration platform for intelligent 
                agent monitoring, decision-making, and autonomous intervention.
              </p>
              <div className="flex items-center space-x-2 text-sm">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
                <span className="text-gray-400">
                  {isConnected ? 'System Online' : 'Demo Mode'}
                </span>
              </div>
            </div>
            
            <div>
              <h3 className="text-white font-semibold mb-4">Features</h3>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li>Real-Time Monitoring</li>
                <li>Intelligent Decisions</li>
                <li>Auto-Intervention</li>
                <li>Pattern Recognition</li>
                <li>WebSocket API</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-white font-semibold mb-4">Resources</h3>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li>Documentation</li>
                <li>API Reference</li>
                <li>Integration Guides</li>
                <li>Support</li>
                <li>GitHub Repository</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8">
            <div className="flex flex-col md:flex-row items-center justify-between">
              <p className="text-gray-400 text-sm">
                © 2025 AI Supervisor Platform. Advanced AI monitoring and orchestration.
              </p>
              <div className="flex items-center space-x-4 mt-4 md:mt-0">
                <span className="text-gray-400 text-sm">
                  WebSocket Status: 
                  <span className={isConnected ? 'text-green-400' : 'text-red-400'}>
                    {connectionStatus.toUpperCase()}
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </footer>
      
      {/* Toast Notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1f2937',
            color: '#fff',
            border: '1px solid #374151',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </div>
  );
}

export default App;