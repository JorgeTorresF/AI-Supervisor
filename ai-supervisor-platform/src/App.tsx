import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import './App.css'

// Import components
import { LandingPage } from './pages/LandingPage'
import { Dashboard } from './pages/Dashboard'
import { CreativeStudio } from './pages/CreativeStudio'
import { AestheticForge } from './pages/AestheticForge'
import { AgentSlicer } from './pages/AgentSlicer'
import { ProjectCombiner } from './pages/ProjectCombiner'
import { Navigation } from './components/Navigation'
import { ThemeProvider } from './contexts/ThemeContext'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)

  // Check authentication status
  useEffect(() => {
    const hasCompletedSetup = localStorage.getItem('supervisor-setup-complete')
    setIsAuthenticated(!!hasCompletedSetup)
    setLoading(false)
  }, [])

  const handleSetupComplete = () => {
    localStorage.setItem('supervisor-setup-complete', 'true')
    setIsAuthenticated(true)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading AI Supervisor Platform...</div>
      </div>
    )
  }

  return (
    <ThemeProvider>
      <Router>
        <div className="app min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
          {isAuthenticated ? (
            <div className="flex">
              <Navigation />
              {/* Fixed: Add proper margin to prevent content hiding behind sidebar */}
              <main className="flex-1 ml-64 min-h-screen">
                <div className="p-6">
                  <Routes>
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/creative-studio" element={<CreativeStudio />} />
                    <Route path="/aesthetic-forge" element={<AestheticForge />} />
                    <Route path="/agent-slicer" element={<AgentSlicer />} />
                    <Route path="/project-combiner" element={<ProjectCombiner />} />
                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                  </Routes>
                </div>
              </main>
            </div>
          ) : (
            <LandingPage onSetupComplete={handleSetupComplete} />
          )}
          <Toaster
            position="top-right"
            toastOptions={{
              className: 'bg-slate-800 text-white border-purple-500',
              duration: 3000,
            }}
          />
        </div>
      </Router>
    </ThemeProvider>
  )
}

export default App