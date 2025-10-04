import React, { useState, useEffect } from 'react'
import { 
  Lightbulb, 
  Zap, 
  Star, 
  Plus, 
  Search, 
  Filter, 
  Heart, 
  Share, 
  Copy, 
  Download,
  Sparkles,
  Target,
  Brain,
  Rocket,
  Trophy
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

interface GeneratedIdea {
  id: string
  title: string
  description: string
  category: string
  feasibility: number
  innovation: number
  impact: number
  connections: string[]
  timestamp: Date
}

interface PromptTemplate {
  id: string
  title: string
  description: string
  template: string
  category: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  tags: string[]
}

const CATEGORIES = [
  'All', 'Web Development', 'Mobile Apps', 'AI/ML', 'Data Science', 
  'Game Development', 'IoT', 'Blockchain', 'Design', 'Business'
]

const PROMPT_TEMPLATES: PromptTemplate[] = [
  {
    id: '1',
    title: 'AI-Powered Personal Assistant',
    description: 'Create a comprehensive personal AI assistant',
    template: 'Build an AI assistant that can {capability} for {target_audience} by integrating {technology_stack}',
    category: 'AI/ML',
    difficulty: 'advanced',
    tags: ['AI', 'Assistant', 'Productivity']
  },
  {
    id: '2',
    title: 'Responsive Web Application',
    description: 'Modern web app with clean architecture',
    template: 'Develop a {app_type} web application using {framework} that helps users {primary_function}',
    category: 'Web Development',
    difficulty: 'intermediate',
    tags: ['React', 'TypeScript', 'UI/UX']
  },
  {
    id: '3',
    title: 'Data Visualization Dashboard',
    description: 'Interactive dashboard for data insights',
    template: 'Create a data visualization dashboard for {industry} that displays {data_types} using {visualization_library}',
    category: 'Data Science',
    difficulty: 'intermediate',
    tags: ['Dashboard', 'Charts', 'Analytics']
  },
  {
    id: '4',
    title: 'Mobile Game Concept',
    description: 'Engaging mobile game with unique mechanics',
    template: 'Design a {game_genre} mobile game featuring {unique_mechanic} for {target_age_group}',
    category: 'Game Development',
    difficulty: 'advanced',
    tags: ['Mobile', 'Gaming', 'Unity']
  },
  {
    id: '5',
    title: 'IoT Smart Home Solution',
    description: 'Connected devices for home automation',
    template: 'Build an IoT solution that automates {home_aspect} using {iot_platform} and {connectivity_protocol}',
    category: 'IoT',
    difficulty: 'advanced',
    tags: ['IoT', 'Automation', 'Smart Home']
  }
]

export function CreativeExpander() {
  const [activeTab, setActiveTab] = useState<'generator' | 'library'>('generator')
  const [inputIdea, setInputIdea] = useState('')
  const [generatedIdeas, setGeneratedIdeas] = useState<GeneratedIdea[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [userLevel, setUserLevel] = useState({ xp: 1250, level: 8, title: 'Idea Architect' })
  const [recentActivity, setRecentActivity] = useState<string[]>([])

  const generateIdeas = async () => {
    if (!inputIdea.trim()) return
    
    setIsGenerating(true)
    
    // Simulate AI idea generation
    setTimeout(() => {
      const newIdeas: GeneratedIdea[] = [
        {
          id: Date.now().toString(),
          title: `Enhanced ${inputIdea} with AI Integration`,
          description: `An advanced version of ${inputIdea} that incorporates machine learning algorithms to provide personalized experiences and predictive capabilities.`,
          category: 'AI/ML',
          feasibility: 8.5,
          innovation: 9.2,
          impact: 8.8,
          connections: ['Machine Learning', 'User Experience', 'Data Analytics'],
          timestamp: new Date()
        },
        {
          id: (Date.now() + 1).toString(),
          title: `Collaborative ${inputIdea} Platform`,
          description: `A multi-user platform that enables teams to collaborate on ${inputIdea} projects with real-time synchronization and version control.`,
          category: 'Web Development',
          feasibility: 7.8,
          innovation: 7.5,
          impact: 8.2,
          connections: ['Collaboration', 'Real-time Sync', 'Version Control'],
          timestamp: new Date()
        },
        {
          id: (Date.now() + 2).toString(),
          title: `Mobile-First ${inputIdea} Solution`,
          description: `A mobile-native application that reimagines ${inputIdea} for on-the-go users with offline capabilities and cloud synchronization.`,
          category: 'Mobile Apps',
          feasibility: 8.1,
          innovation: 7.9,
          impact: 8.0,
          connections: ['Mobile Development', 'Offline First', 'Cloud Sync'],
          timestamp: new Date()
        },
        {
          id: (Date.now() + 3).toString(),
          title: `Gamified ${inputIdea} Experience`,
          description: `Transform ${inputIdea} into an engaging gamified experience with achievements, leaderboards, and progressive skill development.`,
          category: 'Game Development',
          feasibility: 7.2,
          innovation: 8.7,
          impact: 7.8,
          connections: ['Gamification', 'User Engagement', 'Progress Tracking'],
          timestamp: new Date()
        }
      ]
      
      setGeneratedIdeas(prev => [...newIdeas, ...prev])
      setRecentActivity(prev => [`Generated 4 ideas for "${inputIdea}"`, ...prev.slice(0, 4)])
      setUserLevel(prev => ({ ...prev, xp: prev.xp + 50 }))
      setIsGenerating(false)
      setInputIdea('')
    }, 2000)
  }

  const filteredPrompts = PROMPT_TEMPLATES.filter(prompt => {
    const matchesSearch = prompt.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         prompt.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         prompt.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesCategory = selectedCategory === 'All' || prompt.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-900/20 text-green-400 border-green-700/50'
      case 'intermediate': return 'bg-yellow-900/20 text-yellow-400 border-yellow-700/50'
      case 'advanced': return 'bg-red-900/20 text-red-400 border-red-700/50'
      default: return 'bg-gray-900/20 text-gray-400 border-gray-700/50'
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 8.5) return 'text-green-400'
    if (score >= 7.0) return 'text-yellow-400'
    return 'text-red-400'
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center">
            <Lightbulb className="h-8 w-8 text-yellow-400 mr-3" />
            Creative Idea Expander
          </h1>
          <p className="text-gray-400 mt-1">AI-powered brainstorming and idea generation platform</p>
        </div>
        
        {/* User Progress */}
        <Card className="bg-gradient-to-r from-purple-900/20 to-pink-900/20 border-purple-700/50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-4">
              <div className="text-center">
                <div className="text-lg font-bold text-purple-400">Level {userLevel.level}</div>
                <div className="text-xs text-gray-400">{userLevel.title}</div>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-400">XP Progress</span>
                  <span className="text-xs text-purple-400">{userLevel.xp}/1500</span>
                </div>
                <div className="w-24 h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300"
                    style={{ width: `${(userLevel.xp % 1500) / 1500 * 100}%` }}
                  ></div>
                </div>
              </div>
              <Trophy className="h-6 w-6 text-yellow-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-800 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('generator')}
          className={`flex items-center space-x-2 px-6 py-3 rounded-md transition-all ${
            activeTab === 'generator' 
              ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white' 
              : 'text-gray-400 hover:text-white hover:bg-gray-700'
          }`}
        >
          <Zap className="h-4 w-4" />
          <span>Idea Generator</span>
        </button>
        <button
          onClick={() => setActiveTab('library')}
          className={`flex items-center space-x-2 px-6 py-3 rounded-md transition-all ${
            activeTab === 'library' 
              ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white' 
              : 'text-gray-400 hover:text-white hover:bg-gray-700'
          }`}
        >
          <Star className="h-4 w-4" />
          <span>Prompt Library</span>
        </button>
      </div>

      {/* Generator Tab */}
      {activeTab === 'generator' && (
        <div className="space-y-6">
          {/* Idea Input */}
          <Card className="bg-gradient-to-r from-gray-800 to-gray-900 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Brain className="h-6 w-6 text-cyan-400 mr-3" />
                Generate Creative Ideas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <textarea
                  value={inputIdea}
                  onChange={(e) => setInputIdea(e.target.value)}
                  placeholder="Describe your initial idea, concept, or problem you want to explore..."
                  className="w-full h-32 px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 resize-none focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                />
                
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-400">
                    Enter any concept and AI will generate creative variations and improvements
                  </div>
                  
                  <Button
                    onClick={generateIdeas}
                    disabled={!inputIdea.trim() || isGenerating}
                    className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 disabled:opacity-50"
                  >
                    {isGenerating ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Generate Ideas
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Generated Ideas */}
          {generatedIdeas.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white flex items-center">
                  <Rocket className="h-6 w-6 text-purple-400 mr-3" />
                  Generated Ideas ({generatedIdeas.length})
                </h2>
                
                <div className="flex space-x-2">
                  <Button variant="outline" className="border-gray-600 text-gray-300">
                    <Download className="h-4 w-4 mr-2" />
                    Export All
                  </Button>
                  <Button variant="outline" className="border-gray-600 text-gray-300">
                    <Share className="h-4 w-4 mr-2" />
                    Share Collection
                  </Button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {generatedIdeas.map((idea) => (
                  <Card key={idea.id} className="bg-gray-800 border-gray-700 hover:border-gray-600 transition-colors">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg text-white mb-2">{idea.title}</CardTitle>
                          <Badge className="bg-blue-900/20 text-blue-400 border-blue-700/50">
                            {idea.category}
                          </Badge>
                        </div>
                        <div className="flex space-x-1">
                          <Button size="sm" variant="ghost" className="text-gray-400 hover:text-red-400">
                            <Heart className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" className="text-gray-400 hover:text-blue-400">
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-300 mb-4">{idea.description}</p>
                      
                      {/* Scores */}
                      <div className="grid grid-cols-3 gap-4 mb-4">
                        <div className="text-center">
                          <div className={`text-lg font-bold ${getScoreColor(idea.feasibility)}`}>
                            {idea.feasibility.toFixed(1)}
                          </div>
                          <div className="text-xs text-gray-400">Feasibility</div>
                        </div>
                        <div className="text-center">
                          <div className={`text-lg font-bold ${getScoreColor(idea.innovation)}`}>
                            {idea.innovation.toFixed(1)}
                          </div>
                          <div className="text-xs text-gray-400">Innovation</div>
                        </div>
                        <div className="text-center">
                          <div className={`text-lg font-bold ${getScoreColor(idea.impact)}`}>
                            {idea.impact.toFixed(1)}
                          </div>
                          <div className="text-xs text-gray-400">Impact</div>
                        </div>
                      </div>
                      
                      {/* Connections */}
                      <div className="mb-4">
                        <div className="text-sm text-gray-400 mb-2">Key Connections:</div>
                        <div className="flex flex-wrap gap-2">
                          {idea.connections.map((connection, index) => (
                            <Badge key={index} className="bg-purple-900/20 text-purple-400 border-purple-700/50 text-xs">
                              {connection}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-500">
                          Generated {idea.timestamp.toLocaleTimeString()}
                        </span>
                        <Button size="sm" className="bg-gradient-to-r from-purple-600 to-pink-600">
                          <Target className="h-4 w-4 mr-2" />
                          Develop Further
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Library Tab */}
      {activeTab === 'library' && (
        <div className="space-y-6">
          {/* Search and Filters */}
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search prompts, tags, or categories..."
                    className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                  />
                </div>
                
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                >
                  {CATEGORIES.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Prompt Templates */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredPrompts.map((prompt) => (
              <Card key={prompt.id} className="bg-gray-800 border-gray-700 hover:border-gray-600 transition-colors">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg text-white mb-2">{prompt.title}</CardTitle>
                      <div className="flex space-x-2 mb-2">
                        <Badge className="bg-blue-900/20 text-blue-400 border-blue-700/50">
                          {prompt.category}
                        </Badge>
                        <Badge className={getDifficultyColor(prompt.difficulty)}>
                          {prompt.difficulty}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300 mb-4">{prompt.description}</p>
                  
                  <div className="bg-gray-900 rounded-lg p-4 mb-4">
                    <code className="text-cyan-400 text-sm">{prompt.template}</code>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    {prompt.tags.map((tag, index) => (
                      <Badge key={index} className="bg-purple-900/20 text-purple-400 border-purple-700/50 text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button size="sm" className="bg-gradient-to-r from-purple-600 to-pink-600 flex-1">
                      <Plus className="h-4 w-4 mr-2" />
                      Use Template
                    </Button>
                    <Button size="sm" variant="outline" className="border-gray-600 text-gray-300">
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity Sidebar */}
      {recentActivity.length > 0 && (
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white text-sm">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentActivity.slice(0, 5).map((activity, index) => (
                <div key={index} className="text-sm text-gray-400 p-2 bg-gray-900/50 rounded">
                  {activity}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
