import React from 'react'
import { Activity, Zap, Shield } from 'lucide-react'
import { useWebSocket } from '../contexts/WebSocketContext'

interface NavigationProps {
  activeSection: string
}

export function Navigation({ activeSection }: NavigationProps) {
  const { isConnected, isReconnecting } = useWebSocket()

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const navItems = [
    { id: 'hero', label: 'Overview' },
    { id: 'demo', label: 'Live Demo' },
    { id: 'monitoring', label: 'Monitoring' },
    { id: 'features', label: 'Features' },
    { id: 'architecture', label: 'Architecture' },
    { id: 'docs', label: 'Integration' }
  ]

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              {isConnected && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse" />
              )}
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">AI Supervisor</h1>
              <p className="text-xs text-slate-400">Orchestrator & Monitor</p>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => scrollToSection(item.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeSection === item.id
                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Connection Status */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${
                isConnected 
                  ? 'bg-green-400 animate-pulse' 
                  : isReconnecting 
                    ? 'bg-yellow-400 animate-pulse' 
                    : 'bg-red-400'
              }`} />
              <span className={`text-xs font-medium ${
                isConnected 
                  ? 'text-green-400' 
                  : isReconnecting 
                    ? 'text-yellow-400' 
                    : 'text-red-400'
              }`}>
                {isConnected ? 'Connected' : isReconnecting ? 'Reconnecting' : 'Demo Mode'}
              </span>
            </div>
            
            <button
              onClick={() => scrollToSection('demo')}
              className="px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-400 text-white rounded-lg text-sm font-medium hover:from-blue-600 hover:to-cyan-500 transition-all duration-200 flex items-center space-x-2"
            >
              <Activity className="w-4 h-4" />
              <span>Live Demo</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}
