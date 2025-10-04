import React, { useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { 
  Brain, 
  LayoutDashboard, 
  Lightbulb, 
  Palette, 
  Combine, 
  Scissors, 
  Target, 
  Activity, 
  Shield, 
  Rocket, 
  Bot, 
  BarChart3, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  User,
  Bell,
  Search
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

interface NavItem {
  id: string
  name: string
  icon: React.ComponentType<{ className?: string }>
  path: string
  description: string
  category: 'main' | 'tools' | 'management'
  badge?: string
}

const NAV_ITEMS: NavItem[] = [
  // Main Dashboard
  {
    id: 'dashboard',
    name: 'Mission Control',
    icon: LayoutDashboard,
    path: '/dashboard',
    description: 'Main dashboard and overview',
    category: 'main'
  },
  
  // Creative Tools
  {
    id: 'creative-expander',
    name: 'Creative Expander',
    icon: Lightbulb,
    path: '/dashboard/creative-expander',
    description: 'AI-powered idea generation',
    category: 'tools',
    badge: 'New'
  },
  {
    id: 'simsplicer-forge',
    name: 'Simsplicer Forge',
    icon: Palette,
    path: '/dashboard/simsplicer-forge',
    description: 'Aesthetic code generator',
    category: 'tools',
    badge: '6 Themes'
  },
  {
    id: 'project-combiner',
    name: 'Project Combiner',
    icon: Combine,
    path: '/dashboard/project-combiner',
    description: 'Merge AI projects',
    category: 'tools',
    badge: 'Beta'
  },
  {
    id: 'agent-slicer',
    name: 'Agent Slicer',
    icon: Scissors,
    path: '/dashboard/agent-slicer',
    description: 'Modular agent management',
    category: 'tools'
  },
  {
    id: 'idea-validator',
    name: 'Idea Validator',
    icon: Target,
    path: '/dashboard/idea-validator',
    description: 'Validate project concepts',
    category: 'tools'
  },
  
  // Management
  {
    id: 'task-monitoring',
    name: 'Task Monitor',
    icon: Activity,
    path: '/dashboard/task-monitoring',
    description: 'Real-time task tracking',
    category: 'management'
  },
  {
    id: 'intervention-center',
    name: 'Intervention Center',
    icon: Shield,
    path: '/dashboard/intervention-center',
    description: 'Agent intervention management',
    category: 'management'
  },
  {
    id: 'deployment-manager',
    name: 'Deployment Manager',
    icon: Rocket,
    path: '/dashboard/deployment-manager',
    description: 'Manage deployments',
    category: 'management'
  },
  {
    id: 'minimax-integration',
    name: 'MiniMax Integration',
    icon: Bot,
    path: '/dashboard/minimax-integration',
    description: 'MiniMax API integration',
    category: 'management'
  },
  {
    id: 'analytics',
    name: 'Analytics',
    icon: BarChart3,
    path: '/dashboard/analytics',
    description: 'Performance analytics',
    category: 'management'
  },
  {
    id: 'configuration',
    name: 'Configuration',
    icon: Settings,
    path: '/dashboard/configuration',
    description: 'System configuration',
    category: 'management'
  }
]

export function DashboardLayout() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [notifications] = useState([
    { id: '1', message: 'Agent AI-007 completed task successfully', time: '2 min ago', type: 'success' },
    { id: '2', message: 'Intervention triggered for Agent AI-003', time: '5 min ago', type: 'warning' },
    { id: '3', message: 'New idea validated with score 8.5/10', time: '10 min ago', type: 'info' }
  ])

  const handleSignOut = async () => {
    try {
      await signOut()
      navigate('/')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const getCurrentPageInfo = () => {
    const currentItem = NAV_ITEMS.find(item => item.path === location.pathname)
    return currentItem || NAV_ITEMS[0]
  }

  const groupedItems = {
    main: NAV_ITEMS.filter(item => item.category === 'main'),
    tools: NAV_ITEMS.filter(item => item.category === 'tools'),
    management: NAV_ITEMS.filter(item => item.category === 'management')
  }

  const currentPage = getCurrentPageInfo()

  return (
    <div className="flex h-screen bg-gray-900">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-72' : 'w-16'} transition-all duration-300 bg-gray-800 border-r border-gray-700 flex flex-col`}>
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center justify-between">
            {sidebarOpen && (
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Brain className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-white">AI Supervisor</h1>
                  <p className="text-xs text-gray-400">Agent Platform</p>
                </div>
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-gray-400 hover:text-white"
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Main */}
          <div>
            {sidebarOpen && <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Main</h3>}
            <nav className="space-y-1">
              {groupedItems.main.map((item) => {
                const isActive = location.pathname === item.path
                return (
                  <button
                    key={item.id}
                    onClick={() => navigate(item.path)}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-gradient-to-r from-cyan-600 to-purple-600 text-white'
                        : 'text-gray-400 hover:text-white hover:bg-gray-700'
                    }`}
                    title={!sidebarOpen ? item.name : undefined}
                  >
                    <item.icon className="h-5 w-5 flex-shrink-0" />
                    {sidebarOpen && (
                      <>
                        <span className="font-medium">{item.name}</span>
                        {item.badge && (
                          <Badge className="ml-auto bg-cyan-900/30 text-cyan-400 border-cyan-700/50 text-xs">
                            {item.badge}
                          </Badge>
                        )}
                      </>
                    )}
                  </button>
                )
              })}
            </nav>
          </div>

          {/* Creative Tools */}
          <div>
            {sidebarOpen && <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Creative Tools</h3>}
            <nav className="space-y-1">
              {groupedItems.tools.map((item) => {
                const isActive = location.pathname === item.path
                return (
                  <button
                    key={item.id}
                    onClick={() => navigate(item.path)}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                        : 'text-gray-400 hover:text-white hover:bg-gray-700'
                    }`}
                    title={!sidebarOpen ? item.name : undefined}
                  >
                    <item.icon className="h-5 w-5 flex-shrink-0" />
                    {sidebarOpen && (
                      <>
                        <span className="font-medium">{item.name}</span>
                        {item.badge && (
                          <Badge className="ml-auto bg-purple-900/30 text-purple-400 border-purple-700/50 text-xs">
                            {item.badge}
                          </Badge>
                        )}
                      </>
                    )}
                  </button>
                )
              })}
            </nav>
          </div>

          {/* Management */}
          <div>
            {sidebarOpen && <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Management</h3>}
            <nav className="space-y-1">
              {groupedItems.management.map((item) => {
                const isActive = location.pathname === item.path
                return (
                  <button
                    key={item.id}
                    onClick={() => navigate(item.path)}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white'
                        : 'text-gray-400 hover:text-white hover:bg-gray-700'
                    }`}
                    title={!sidebarOpen ? item.name : undefined}
                  >
                    <item.icon className="h-5 w-5 flex-shrink-0" />
                    {sidebarOpen && (
                      <>
                        <span className="font-medium">{item.name}</span>
                        {item.badge && (
                          <Badge className="ml-auto bg-green-900/30 text-green-400 border-green-700/50 text-xs">
                            {item.badge}
                          </Badge>
                        )}
                      </>
                    )}
                  </button>
                )
              })}
            </nav>
          </div>
        </div>

        {/* User Section */}
        <div className="p-4 border-t border-gray-700">
          {sidebarOpen ? (
            <div className="space-y-3">
              <div className="flex items-center space-x-3 p-2 bg-gray-900/50 rounded-lg">
                <div className="w-8 h-8 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {user?.email || 'User'}
                  </p>
                  <p className="text-xs text-gray-400">AI Supervisor Admin</p>
                </div>
              </div>
              
              <Button
                onClick={handleSignOut}
                variant="outline"
                size="sm"
                className="w-full border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-full p-2 text-gray-400 hover:text-white"
                title="User Profile"
              >
                <User className="h-5 w-5" />
              </Button>
              <Button
                onClick={handleSignOut}
                variant="ghost"
                size="sm"
                className="w-full p-2 text-gray-400 hover:text-white"
                title="Sign Out"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-white flex items-center">
                <currentPage.icon className="h-6 w-6 mr-3 text-cyan-400" />
                {currentPage.name}
              </h1>
              <p className="text-sm text-gray-400 mt-1">{currentPage.description}</p>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Search */}
              <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyan-500 w-64"
                />
              </div>
              
              {/* Notifications */}
              <div className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-white relative"
                >
                  <Bell className="h-5 w-5" />
                  {notifications.length > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {notifications.length}
                    </span>
                  )}
                </Button>
              </div>
              
              {/* User Avatar */}
              <div className="w-8 h-8 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-white" />
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-gray-900">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
