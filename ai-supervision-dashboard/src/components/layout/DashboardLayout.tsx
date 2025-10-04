import React from 'react'
import { Outlet, NavLink } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { 
  LayoutDashboard, 
  Lightbulb, 
  Activity, 
  Shield, 
  BarChart3, 
  Settings, 
  User,
  LogOut,
  Menu,
  X,
  Bell
} from 'lucide-react'
import { useState } from 'react'

const navigationItems = [
  {
    name: 'Dashboard',
    path: '/',
    icon: LayoutDashboard,
    description: 'Mission control overview'
  },
  {
    name: 'Idea Validator',
    path: '/idea-validator',
    icon: Lightbulb,
    description: 'Validate project ideas'
  },
  {
    name: 'Task Monitoring',
    path: '/task-monitoring',
    icon: Activity,
    description: 'Real-time task supervision'
  },
  {
    name: 'Intervention Center',
    path: '/intervention-center',
    icon: Shield,
    description: 'Manage AI interventions'
  },
  {
    name: 'Deployment Manager',
    path: '/deployment-manager',
    icon: Settings,
    description: 'Manage deployment modes'
  },
  {
    name: 'MiniMax Integration',
    path: '/minimax-integration',
    icon: User,
    description: 'MiniMax Agent supervision'
  },
  {
    name: 'Analytics',
    path: '/analytics',
    icon: BarChart3,
    description: 'Performance insights'
  },
  {
    name: 'Configuration',
    path: '/configuration',
    icon: Settings,
    description: 'System settings'
  }
]

export function DashboardLayout() {
  const { user, signOut } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-gray-800 transform transition-transform duration-300 ease-in-out
        lg:translate-x-0 lg:static lg:inset-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          {/* Logo and close button */}
          <div className="flex items-center justify-between p-4 border-b border-gray-700">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-white font-bold text-lg">AI Supervisor</h1>
                <p className="text-gray-400 text-xs">Mission Control</p>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1 rounded-md text-gray-400 hover:text-white hover:bg-gray-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-2">
            {navigationItems.map((item) => {
              const Icon = item.icon
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) => `
                    flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                    ${isActive 
                      ? 'bg-blue-600 text-white shadow-lg' 
                      : 'text-gray-300 hover:text-white hover:bg-gray-700'
                    }
                  `}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon className="h-5 w-5" />
                  <div>
                    <div>{item.name}</div>
                    <div className="text-xs opacity-75">{item.description}</div>
                  </div>
                </NavLink>
              )
            })}
          </nav>

          {/* User profile */}
          <div className="border-t border-gray-700 p-4">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                <User className="h-5 w-5 text-gray-300" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {user?.email || 'User'}
                </p>
                <p className="text-xs text-gray-400 truncate">
                  Supervisor Agent
                </p>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center space-x-2 w-full px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign out</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:ml-64 flex flex-col min-h-screen">
        {/* Header */}
        <header className="bg-gray-800 border-b border-gray-700 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div>
                <h2 className="text-lg font-semibold text-white">AI Agent Supervision System</h2>
                <p className="text-sm text-gray-400">Real-time monitoring and intervention platform</p>
              </div>
            </div>

            {/* Header actions */}
            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                  className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 relative"
                >
                  <Bell className="h-5 w-5" />
                  {/* Notification badge */}
                  <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                    3
                  </span>
                </button>
                
                {/* Notification dropdown */}
                {notificationsOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-50">
                    <div className="p-4 border-b border-gray-700">
                      <h3 className="text-sm font-semibold text-white">Recent Notifications</h3>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      <div className="p-3 border-b border-gray-700 hover:bg-gray-700">
                        <p className="text-sm text-white">High-risk idea detected</p>
                        <p className="text-xs text-gray-400">2 minutes ago</p>
                      </div>
                      <div className="p-3 border-b border-gray-700 hover:bg-gray-700">
                        <p className="text-sm text-white">Task intervention required</p>
                        <p className="text-xs text-gray-400">5 minutes ago</p>
                      </div>
                      <div className="p-3 hover:bg-gray-700">
                        <p className="text-sm text-white">New agent registered</p>
                        <p className="text-xs text-gray-400">1 hour ago</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Status indicator */}
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-400">System Active</span>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}