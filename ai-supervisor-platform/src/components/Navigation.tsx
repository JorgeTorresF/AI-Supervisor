import React from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  Home,
  Lightbulb,
  Palette,
  Users,
  Combine,
  Settings,
  LogOut,
  Shield
} from 'lucide-react'
import { toast } from 'sonner'

const Navigation: React.FC = () => {
  const location = useLocation()
  const navigate = useNavigate()

  const navItems = [
    { path: '/dashboard', icon: Home, label: 'Dashboard', color: 'from-blue-500 to-cyan-500' },
    { path: '/creative-studio', icon: Lightbulb, label: 'Creative Studio', color: 'from-yellow-500 to-orange-500' },
    { path: '/aesthetic-forge', icon: Palette, label: 'Aesthetic Forge', color: 'from-purple-500 to-pink-500' },
    { path: '/agent-slicer', icon: Users, label: 'Agent Slicer', color: 'from-green-500 to-emerald-500' },
    { path: '/project-combiner', icon: Combine, label: 'Project Combiner', color: 'from-indigo-500 to-purple-500' },
  ]

  const handleLogout = () => {
    localStorage.removeItem('supervisor-setup-complete')
    toast.success('Logged out successfully')
    window.location.reload()
  }

  return (
    <div className="fixed left-0 top-0 h-full w-64 bg-slate-900/95 backdrop-blur-lg border-r border-purple-500/20 z-50">
      {/* Header */}
      <div className="p-6 border-b border-purple-500/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-lg flex items-center justify-center">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-white font-bold text-lg">AI Supervisor</h1>
            <p className="text-slate-400 text-sm">Agent Platform</p>
          </div>
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="p-4 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = location.pathname === item.path
          
          return (
            <button
              key={item.path}
              onClick={() => {
                navigate(item.path)
                toast.success(`Navigated to ${item.label}`, {
                  description: 'Page loaded successfully',
                  duration: 2000,
                })
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
                isActive
                  ? 'bg-gradient-to-r ' + item.color + ' text-white shadow-lg'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />
              <span className="font-medium">{item.label}</span>
              {isActive && (
                <div className="ml-auto w-2 h-2 bg-white rounded-full animate-pulse" />
              )}
            </button>
          )
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-purple-500/20">
        <button
          onClick={() => {
            toast.info('Settings panel coming soon!')
          }}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/50 transition-all duration-200 mb-2"
        >
          <Settings className="w-5 h-5" />
          <span className="font-medium">Settings</span>
        </button>
        
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-900/20 transition-all duration-200"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </div>
  )
}

export { Navigation }