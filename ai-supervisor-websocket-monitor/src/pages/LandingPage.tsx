import React, { useState, useEffect } from 'react'
import { HeroSection } from '../components/HeroSection'
import { LiveDemo } from '../components/LiveDemo'
import { RealTimeMonitoring } from '../components/RealTimeMonitoring'
import { TechnicalDocumentation } from '../components/TechnicalDocumentation'
import { ArchitectureOverview } from '../components/ArchitectureOverview'
import { FeatureShowcase } from '../components/FeatureShowcase'
import { Footer } from '../components/Footer'
import { Navigation } from '../components/Navigation'
import { useWebSocket } from '../contexts/WebSocketContext'

export function LandingPage() {
  const { isConnected, connectionAttempts } = useWebSocket()
  const [activeSection, setActiveSection] = useState('hero')

  // Handle scroll-based section detection
  useEffect(() => {
    const handleScroll = () => {
      const sections = ['hero', 'demo', 'monitoring', 'features', 'architecture', 'docs']
      const scrollPosition = window.scrollY + 100

      for (const section of sections) {
        const element = document.getElementById(section)
        if (element) {
          const { offsetTop, offsetHeight } = element
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(section)
            break
          }
        }
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Navigation activeSection={activeSection} />
      
      {/* Connection Status Banner */}
      {!isConnected && connectionAttempts > 0 && (
        <div className="fixed top-0 left-0 right-0 z-40 bg-yellow-600/20 border-b border-yellow-500/30 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-2 text-center">
            <p className="text-yellow-300 text-sm">
              WebSocket server disconnected - Running in demo mode with simulated data
            </p>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main>
        <section id="hero">
          <HeroSection />
        </section>
        
        <section id="demo">
          <LiveDemo />
        </section>
        
        <section id="monitoring">
          <RealTimeMonitoring />
        </section>
        
        <section id="features">
          <FeatureShowcase />
        </section>
        
        <section id="architecture">
          <ArchitectureOverview />
        </section>
        
        <section id="docs">
          <TechnicalDocumentation />
        </section>
      </main>

      <Footer />
    </div>
  )
}
