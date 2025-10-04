import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Toaster } from 'sonner'
import { WebSocketProvider } from './contexts/WebSocketContext'
import { SessionProvider } from './contexts/SessionContext'
import { LandingPage } from './pages/LandingPage'
import './App.css'

function App() {
  return (
    <SessionProvider>
      <WebSocketProvider>
        <Router>
          <div className="app min-h-screen bg-slate-950">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="*" element={<LandingPage />} />
            </Routes>
            <Toaster
              position="top-right"
              toastOptions={{
                className: 'bg-slate-800 text-white border-blue-500',
                duration: 4000,
              }}
            />
          </div>
        </Router>
      </WebSocketProvider>
    </SessionProvider>
  )
}

export default App
