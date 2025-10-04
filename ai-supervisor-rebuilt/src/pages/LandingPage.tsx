import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useNavigate, useLocation } from 'react-router-dom'
import { 
  Brain, 
  Shield, 
  Zap, 
  Eye, 
  Users, 
  Rocket, 
  Target, 
  Code2, 
  GitBranch, 
  Layers, 
  Settings, 
  ChevronRight, 
  Star, 
  Trophy, 
  Download, 
  Play,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Monitor,
  Bot,
  Palette,
  Lightbulb,
  Wrench,
  Globe
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'

interface LandingPageProps {
  onGetStarted?: () => void
}

export function LandingPage({ onGetStarted }: LandingPageProps) {
  const { user, signIn, signUp, loading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [activeSection, setActiveSection] = useState('overview')
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin')
  const [credentials, setCredentials] = useState({ email: '', password: '' })
  const [authLoading, setAuthLoading] = useState(false)
  const [error, setError] = useState('')

  // Auto-navigate if user is already authenticated
  useEffect(() => {
    if (user && !loading) {
      navigate('/dashboard', { replace: true })
    }
  }, [user, loading, navigate])

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthLoading(true)
    setError('')

    try {
      const { error } = authMode === 'signin' 
        ? await signIn(credentials.email, credentials.password)
        : await signUp(credentials.email, credentials.password)

      if (error) {
        setError(error.message)
      } else if (authMode === 'signup') {
        setError('Check your email for the confirmation link!')
      } else {
        setShowAuthModal(false)
        if (onGetStarted) onGetStarted()
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed')
    } finally {
      setAuthLoading(false)
    }
  }

  const sections = [
    { id: 'overview', title: 'Overview', icon: Eye },
    { id: 'features', title: 'Features', icon: Star },
    { id: 'installation', title: 'Installation', icon: Download },
    { id: 'integration', title: 'MiniMax Integration', icon: Bot },
    { id: 'judging', title: 'Judging Criteria', icon: Trophy },
    { id: 'commercial', title: 'Commercial Use', icon: TrendingUp }
  ]

  const ScrollToSection = ({ section }: { section: string }) => {
    useEffect(() => {
      if (section) {
        const element = document.getElementById(section)
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' })
        }
      }
    }, [section])
    return null
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Initializing AI Supervisor...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-gray-900/95 backdrop-blur-sm z-50 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/10 backdrop-blur-sm border border-white/20">
                <img 
                  src="/assets/supervisor-ai-robot-logo.png" 
                  alt="Supervisor AI Robot Logo" 
                  className="w-6 h-6 object-contain"
                />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                AI Supervisor Agent
              </span>
            </div>
            
            <div className="hidden md:flex items-center space-x-8">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                    activeSection === section.id 
                      ? 'text-cyan-400 bg-cyan-900/20' 
                      : 'text-gray-400 hover:text-white hover:bg-gray-800'
                  }`}
                >
                  <section.icon className="h-4 w-4" />
                  <span>{section.title}</span>
                </button>
              ))}
            </div>

            <Button 
              onClick={() => setShowAuthModal(true)}
              className="bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-700 hover:to-purple-700"
            >
              Get Started
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <div className="mb-8">
            <Badge className="mb-6 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 text-cyan-400 border-cyan-500/20">
              Next-Generation AI Supervision Platform
            </Badge>
            
            <h1 className="text-5xl md:text-7xl font-bold mb-6">
              <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                AI Supervisor
              </span>
              <br />
              <span className="text-white">Agent Platform</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-4xl mx-auto leading-relaxed">
              The ultimate platform for monitoring, managing, and optimizing AI agents with real-time supervision, 
              creative project planning, and aesthetic dashboard customization.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Button 
              size="lg" 
              onClick={() => setShowAuthModal(true)}
              className="bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-700 hover:to-purple-700 text-lg px-8 py-4"
            >
              <Play className="h-5 w-5 mr-2" />
              Launch Platform
            </Button>
            
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => setActiveSection('installation')}
              className="border-gray-600 hover:border-cyan-500 text-lg px-8 py-4"
            >
              <Download className="h-5 w-5 mr-2" />
              View Installation Guide
            </Button>
          </div>

          {/* Key Stats */}
          {/* Demo Video Section */}
          <div className="max-w-4xl mx-auto mb-12">
            <h3 className="text-2xl font-bold text-center mb-6 text-white">
              See AI Supervisor in Action
            </h3>
            <div className="bg-gray-800/50 backdrop-blur-lg rounded-2xl p-4 border border-cyan-500/20">
              <div style={{paddingBottom: '56.25%', position: 'relative'}}>
                <iframe 
                  width="100%" 
                  height="100%" 
                  src="https://www.youtube-nocookie.com/embed/z7Ig-zj8j3I?autoplay=1&controls=0&loop=1&modestbranding=1&playlist=z7Ig-zj8j3I&rel=0" 
                  frameBorder="0" 
                  allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen"  
                  style={{position: 'absolute', top: '0px', left: '0px', width: '100%', height: '100%', borderRadius: '12px'}}
                  title="AI Supervisor Demo Video"
                >
                  <small>Powered by <a href="https://embed.tube/embed-code-generator/youtube/">youtube embed video</a> generator</small>
                </iframe>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="text-3xl font-bold text-cyan-400 mb-2">6</div>
              <div className="text-gray-400">Visual Themes</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-400 mb-2">∞</div>
              <div className="text-gray-400">AI Agents</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-pink-400 mb-2">24/7</div>
              <div className="text-gray-400">Monitoring</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-400 mb-2">100%</div>
              <div className="text-gray-400">Open Source</div>
            </div>
          </div>
        </div>
      </section>

      <ScrollToSection section={activeSection} />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        {/* Overview Section */}
        <section id="overview" className="mb-20">
          <h2 className="text-4xl font-bold mb-8 text-center">
            <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
              Platform Overview
            </span>
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="bg-gray-800 border-gray-700 p-6">
              <Monitor className="h-12 w-12 text-cyan-400 mb-4" />
              <h3 className="text-xl font-semibold mb-3">Real-time Monitoring</h3>
              <p className="text-gray-400">
                Advanced dashboard with live agent supervision, performance tracking, and instant notifications.
              </p>
            </Card>
            
            <Card className="bg-gray-800 border-gray-700 p-6">
              <Lightbulb className="h-12 w-12 text-purple-400 mb-4" />
              <h3 className="text-xl font-semibold mb-3">Creative Expansion</h3>
              <p className="text-gray-400">
                AI-powered idea generation, brainstorming tools, and gamified project planning system.
              </p>
            </Card>
            
            <Card className="bg-gray-800 border-gray-700 p-6">
              <Palette className="h-12 w-12 text-pink-400 mb-4" />
              <h3 className="text-xl font-semibold mb-3">Aesthetic Forge</h3>
              <p className="text-gray-400">
                Six stunning visual themes with live code preview and aesthetic component generation.
              </p>
            </Card>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="mb-20">
          <h2 className="text-4xl font-bold mb-12 text-center">
            <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
              Comprehensive Features
            </span>
          </h2>
          
          <div className="space-y-8">
            {/* Core Features */}
            <div className="grid md:grid-cols-2 gap-8">
              <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700 p-8">
                <div className="flex items-center mb-6">
                  <Brain className="h-8 w-8 text-cyan-400 mr-3" />
                  <h3 className="text-2xl font-bold">AI Agent Supervision</h3>
                </div>
                <ul className="space-y-3 text-gray-300">
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-400 mr-3" />
                    Real-time agent monitoring and health checks
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-400 mr-3" />
                    Intelligent intervention system with auto-recovery
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-400 mr-3" />
                    Task coherence monitoring and drift detection
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-400 mr-3" />
                    Performance analytics and insights
                  </li>
                </ul>
              </Card>
              
              <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700 p-8">
                <div className="flex items-center mb-6">
                  <Wrench className="h-8 w-8 text-purple-400 mr-3" />
                  <h3 className="text-2xl font-bold">Creative Tools</h3>
                </div>
                <ul className="space-y-3 text-gray-300">
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-400 mr-3" />
                    Creative Idea Expander with AI brainstorming
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-400 mr-3" />
                    Simsplicer aesthetic code forge (6 themes)
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-400 mr-3" />
                    MiniMax Project Combiner
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-400 mr-3" />
                    Agent Slicer for modular management
                  </li>
                </ul>
              </Card>
            </div>

            {/* Visual Themes */}
            <Card className="bg-gradient-to-r from-gray-800 to-gray-900 border-gray-700 p-8">
              <h3 className="text-2xl font-bold mb-6 flex items-center">
                <Palette className="h-8 w-8 text-pink-400 mr-3" />
                Six Stunning Visual Themes
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {[
                  { name: 'Slushwave', color: 'from-pink-500 to-purple-600', desc: 'Dreamy gradients' },
                  { name: 'Glitchcore', color: 'from-green-400 to-cyan-500', desc: 'Digital chaos' },
                  { name: 'Minimal', color: 'from-gray-400 to-gray-600', desc: 'Clean elegance' },
                  { name: 'Cyberpunk', color: 'from-cyan-400 to-blue-600', desc: 'Neon future' },
                  { name: 'Vaporwave', color: 'from-purple-500 to-pink-500', desc: 'Retro aesthetic' },
                  { name: 'Brutalist', color: 'from-yellow-500 to-red-600', desc: 'Bold statements' }
                ].map((theme) => (
                  <div key={theme.name} className="text-center">
                    <div className={`w-full h-20 rounded-lg bg-gradient-to-r ${theme.color} mb-2`}></div>
                    <h4 className="font-semibold text-sm">{theme.name}</h4>
                    <p className="text-xs text-gray-400">{theme.desc}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </section>

        {/* Installation Section */}
        <section id="installation" className="mb-20">
          <h2 className="text-4xl font-bold mb-12 text-center">
            <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
              Installation Guide
            </span>
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            {/* Quick Start */}
            <Card className="bg-gray-800 border-gray-700 p-8">
              <h3 className="text-2xl font-bold mb-6 flex items-center">
                <Rocket className="h-6 w-6 text-cyan-400 mr-3" />
                Quick Start (Recommended)
              </h3>
              
              <div className="space-y-4">
                <div className="bg-gray-900 rounded-lg p-4">
                  <p className="text-sm text-gray-400 mb-2">1. Clone the repository</p>
                  <code className="text-cyan-400 text-sm">git clone https://github.com/ai-supervisor/platform.git</code>
                </div>
                
                <div className="bg-gray-900 rounded-lg p-4">
                  <p className="text-sm text-gray-400 mb-2">2. Install dependencies</p>
                  <code className="text-cyan-400 text-sm">cd platform && npm install</code>
                </div>
                
                <div className="bg-gray-900 rounded-lg p-4">
                  <p className="text-sm text-gray-400 mb-2">3. Configure environment</p>
                  <code className="text-cyan-400 text-sm">cp .env.example .env.local</code>
                </div>
                
                <div className="bg-gray-900 rounded-lg p-4">
                  <p className="text-sm text-gray-400 mb-2">4. Start the platform</p>
                  <code className="text-cyan-400 text-sm">npm run dev</code>
                </div>
              </div>
            </Card>

            {/* Advanced Setup */}
            <Card className="bg-gray-800 border-gray-700 p-8">
              <h3 className="text-2xl font-bold mb-6 flex items-center">
                <Settings className="h-6 w-6 text-purple-400 mr-3" />
                Advanced Configuration
              </h3>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-cyan-400 mb-2">Environment Variables</h4>
                  <ul className="text-sm text-gray-300 space-y-1">
                    <li>• NEXT_PUBLIC_SUPABASE_URL</li>
                    <li>• NEXT_PUBLIC_SUPABASE_ANON_KEY</li>
                    <li>• OPENAI_API_KEY (optional)</li>
                    <li>• ANTHROPIC_API_KEY (optional)</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-semibold text-purple-400 mb-2">Database Setup</h4>
                  <ul className="text-sm text-gray-300 space-y-1">
                    <li>• Run Supabase migrations</li>
                    <li>• Configure RLS policies</li>
                    <li>• Set up edge functions</li>
                    <li>• Initialize storage buckets</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-semibold text-pink-400 mb-2">Custom Themes</h4>
                  <p className="text-sm text-gray-300">
                    Extend the visual themes in <code className="text-cyan-400">themes/</code> directory
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* System Requirements */}
          <Card className="bg-gray-800 border-gray-700 p-8 mt-8">
            <h3 className="text-2xl font-bold mb-6">System Requirements</h3>
            <div className="grid md:grid-cols-3 gap-8">
              <div>
                <h4 className="font-semibold text-cyan-400 mb-3">Minimum</h4>
                <ul className="text-sm text-gray-300 space-y-1">
                  <li>• Node.js 18+</li>
                  <li>• 4GB RAM</li>
                  <li>• 2GB Storage</li>
                  <li>• Modern Browser</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-purple-400 mb-3">Recommended</h4>
                <ul className="text-sm text-gray-300 space-y-1">
                  <li>• Node.js 20+</li>
                  <li>• 8GB RAM</li>
                  <li>• 10GB Storage</li>
                  <li>• Chrome/Edge/Firefox</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-pink-400 mb-3">Enterprise</h4>
                <ul className="text-sm text-gray-300 space-y-1">
                  <li>• Node.js 20+</li>
                  <li>• 16GB+ RAM</li>
                  <li>• 50GB+ Storage</li>
                  <li>• Load Balancer</li>
                </ul>
              </div>
            </div>
          </Card>
        </section>

        {/* Continue with other sections... */}
        {/* I'll continue with the MiniMax Integration, Judging Criteria, and Commercial sections in the next part */}
      </div>

      {/* Auth Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="bg-gray-800 border-gray-700 w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold">
                  {authMode === 'signin' ? 'Sign In' : 'Create Account'}
                </h3>
                <button 
                  onClick={() => setShowAuthModal(false)}
                  className="text-gray-400 hover:text-white"
                >
                  ×
                </button>
              </div>
              
              <form onSubmit={handleAuth} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Email</label>
                  <input
                    type="email"
                    value={credentials.email}
                    onChange={(e) => setCredentials(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-cyan-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Password</label>
                  <input
                    type="password"
                    value={credentials.password}
                    onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-cyan-500"
                    required
                  />
                </div>
                
                {error && (
                  <div className={`text-sm p-3 rounded-lg ${
                    error.includes('Check your email') 
                      ? 'bg-green-900/20 text-green-400 border border-green-700/50'
                      : 'bg-red-900/20 text-red-400 border border-red-700/50'
                  }`}>
                    {error}
                  </div>
                )}
                
                <Button 
                  type="submit" 
                  disabled={authLoading}
                  className="w-full bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-700 hover:to-purple-700"
                >
                  {authLoading ? 'Loading...' : (authMode === 'signin' ? 'Sign In' : 'Create Account')}
                </Button>
                
                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode(authMode === 'signin' ? 'signup' : 'signin')
                      setError('')
                    }}
                    className="text-cyan-400 hover:text-cyan-300 text-sm"
                  >
                    {authMode === 'signin' ? 'Need an account? Sign up' : 'Already have an account? Sign in'}
                  </button>
                </div>
              </form>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
