import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { DashboardLayout } from './components/layout/DashboardLayout'
import { LandingPage } from './pages/LandingPage'
import { Dashboard } from './pages/Dashboard'
import { CreativeExpander } from './pages/CreativeExpander'
import { SimsplicerForge } from './pages/SimsplicerForge'
import { ProjectCombiner } from './pages/ProjectCombiner'
import { AgentSlicer } from './pages/AgentSlicer'
import { IdeaValidator } from './pages/IdeaValidator'
import { TaskMonitoring } from './pages/TaskMonitoring'
import { InterventionCenter } from './pages/InterventionCenter'
import { DeploymentManager } from './pages/DeploymentManager'
import { MiniMaxIntegration } from './pages/MiniMaxIntegration'
import { AnalyticsPage } from './pages/AnalyticsPage'
import { ConfigurationPage } from './pages/ConfigurationPage'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { useAuth } from './contexts/AuthContext'
import './App.css'

function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading AI Supervisor...</p>
        </div>
      </div>
    )
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-900 text-gray-100">
        <Routes>
          {/* Landing page for non-authenticated users */}
          <Route 
            path="/" 
            element={
              user ? <Navigate to="/dashboard" replace /> : <LandingPage />
            } 
          />
          
          {/* Auth callback route */}
          <Route path="/auth/callback" element={<AuthCallback />} />
          
          {/* Protected dashboard routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Dashboard />} />
            <Route path="creative-expander" element={<CreativeExpander />} />
            <Route path="simsplicer-forge" element={<SimsplicerForge />} />
            <Route path="project-combiner" element={<ProjectCombiner />} />
            <Route path="agent-slicer" element={<AgentSlicer />} />
            <Route path="idea-validator" element={<IdeaValidator />} />
            <Route path="task-monitoring" element={<TaskMonitoring />} />
            <Route path="intervention-center" element={<InterventionCenter />} />
            <Route path="deployment-manager" element={<DeploymentManager />} />
            <Route path="minimax-integration" element={<MiniMaxIntegration />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="configuration" element={<ConfigurationPage />} />
          </Route>
          
          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  )
}

// Auth callback handler
function AuthCallback() {
  const { user } = useAuth()
  
  React.useEffect(() => {
    const handleAuthCallback = async () => {
      const hashFragment = window.location.hash

      if (hashFragment && hashFragment.length > 0) {
        try {
          const { supabase } = await import('./lib/supabase')
          const { data, error } = await supabase.auth.exchangeCodeForSession(hashFragment)

          if (error) {
            console.error('Error exchanging code for session:', error.message)
            window.location.href = '/?error=' + encodeURIComponent(error.message)
            return
          }

          if (data.session) {
            window.location.href = '/dashboard'
            return
          }
        } catch (error) {
          console.error('Auth callback error:', error)
        }
      }

      window.location.href = '/?error=No session found'
    }

    if (!user) {
      handleAuthCallback()
    } else {
      window.location.href = '/dashboard'
    }
  }, [user])

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600 mx-auto mb-4"></div>
        <p className="text-gray-400">Processing authentication...</p>
      </div>
    </div>
  )
}

function AppWrapper() {
  return (
    <AuthProvider>
      <App />
    </AuthProvider>
  )
}

export default AppWrapper
