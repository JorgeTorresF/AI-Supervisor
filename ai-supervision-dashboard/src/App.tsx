import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { DashboardLayout } from './components/layout/DashboardLayout'
import { AuthPage } from './pages/AuthPage'
import { Dashboard } from './pages/Dashboard'
import { IdeaValidator } from './pages/IdeaValidator'
import { TaskMonitoring } from './pages/TaskMonitoring'
import { InterventionCenter } from './pages/InterventionCenter'
import { DeploymentManager } from './pages/DeploymentManager'
import { MiniMaxIntegration } from './pages/MiniMaxIntegration'
import { AnalyticsPage } from './pages/AnalyticsPage'
import { ConfigurationPage } from './pages/ConfigurationPage'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { ToastProvider } from './components/ui/ToastProvider'
import { supabase } from './lib/supabase'
import './App.css'

function App() {
  return (
    <Router>
      <AuthProvider>
        <ToastProvider>
          <div className="min-h-screen bg-gray-900 text-gray-100">
            <Routes>
              {/* Auth routes */}
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              
              {/* Protected dashboard routes */}
              <Route path="/" element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }>
                <Route index element={<Dashboard />} />
                <Route path="idea-validator" element={<IdeaValidator />} />
                <Route path="task-monitoring" element={<TaskMonitoring />} />
                <Route path="intervention-center" element={<InterventionCenter />} />
                <Route path="deployment-manager" element={<DeploymentManager />} />
                <Route path="minimax-integration" element={<MiniMaxIntegration />} />
                <Route path="analytics" element={<AnalyticsPage />} />
                <Route path="configuration" element={<ConfigurationPage />} />
              </Route>
              
              {/* Redirect root to dashboard */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </ToastProvider>
      </AuthProvider>
    </Router>
  )
}

// Auth callback handler
function AuthCallback() {
  React.useEffect(() => {
    // Handle the callback in your auth/callback page:
    async function handleAuthCallback() {
      // Get the hash fragment from the URL
      const hashFragment = window.location.hash

      if (hashFragment && hashFragment.length > 0) {
        // Exchange the auth code for a session
        const { data, error } = await supabase.auth.exchangeCodeForSession(hashFragment)

        if (error) {
          console.error('Error exchanging code for session:', error.message)
          // Redirect to error page or show error message
          window.location.href = '/auth?error=' + encodeURIComponent(error.message)
          return
        }

        if (data.session) {
          // Successfully signed in, redirect to app
          window.location.href = '/'
          return
        }
      }

      // If we get here, something went wrong
      window.location.href = '/auth?error=No session found'
    }

    handleAuthCallback()
  }, [])

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-400">Processing authentication...</p>
      </div>
    </div>
  )
}

export default App