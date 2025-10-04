import React, { useState } from 'react'
import { 
  Combine, 
  GitMerge, 
  Folder, 
  Plus, 
  Download, 
  Upload, 
  Play, 
  Settings, 
  Trash2,
  Edit,
  Copy,
  Share2,
  Archive
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

interface Project {
  id: string
  name: string
  type: 'web-app' | 'mobile-app' | 'ai-model' | 'api' | 'dashboard' | 'game'
  description: string
  status: 'active' | 'completed' | 'archived'
  agents: string[]
  lastModified: Date
  size: string
  technologies: string[]
}

interface CombinedProject {
  id: string
  name: string
  description: string
  sourceProjects: Project[]
  combinationType: 'merge' | 'integrate' | 'hybrid'
  status: 'planning' | 'combining' | 'testing' | 'completed'
  createdAt: Date
}

const SAMPLE_PROJECTS: Project[] = [
  {
    id: '1',
    name: 'AI Chat Interface',
    type: 'web-app',
    description: 'Modern chat interface with AI integration',
    status: 'completed',
    agents: ['AI-001', 'UI-Designer-002'],
    lastModified: new Date('2024-01-15'),
    size: '2.4 MB',
    technologies: ['React', 'TypeScript', 'WebSocket']
  },
  {
    id: '2',
    name: 'Data Visualization Dashboard',
    type: 'dashboard',
    description: 'Interactive charts and analytics platform',
    status: 'active',
    agents: ['DataViz-003', 'Backend-004'],
    lastModified: new Date('2024-01-18'),
    size: '5.1 MB',
    technologies: ['D3.js', 'Python', 'FastAPI']
  },
  {
    id: '3',
    name: 'Mobile Fitness Tracker',
    type: 'mobile-app',
    description: 'Cross-platform fitness tracking application',
    status: 'completed',
    agents: ['Mobile-005', 'Health-006'],
    lastModified: new Date('2024-01-12'),
    size: '8.7 MB',
    technologies: ['React Native', 'SQLite', 'HealthKit']
  },
  {
    id: '4',
    name: 'ML Recommendation Engine',
    type: 'ai-model',
    description: 'Machine learning model for content recommendations',
    status: 'active',
    agents: ['ML-007', 'Data-008'],
    lastModified: new Date('2024-01-20'),
    size: '15.2 MB',
    technologies: ['Python', 'TensorFlow', 'Docker']
  }
]

export function ProjectCombiner() {
  const [projects] = useState<Project[]>(SAMPLE_PROJECTS)
  const [selectedProjects, setSelectedProjects] = useState<Project[]>([])
  const [combinedProjects, setCombinedProjects] = useState<CombinedProject[]>([])
  const [combineMode, setCombineMode] = useState<'merge' | 'integrate' | 'hybrid'>('merge')
  const [combiningName, setCombiningName] = useState('')
  const [combiningDescription, setCombiningDescription] = useState('')
  const [showCombineModal, setShowCombineModal] = useState(false)
  const [isCombining, setIsCombining] = useState(false)

  const toggleProjectSelection = (project: Project) => {
    setSelectedProjects(prev => 
      prev.find(p => p.id === project.id)
        ? prev.filter(p => p.id !== project.id)
        : [...prev, project]
    )
  }

  const startCombining = () => {
    if (selectedProjects.length < 2) return
    setShowCombineModal(true)
    setCombiningName(`Combined ${selectedProjects.map(p => p.name).join(' + ')}`)
    setCombiningDescription(`A hybrid project combining ${selectedProjects.length} MiniMax AI projects`)
  }

  const executeCombine = async () => {
    setIsCombining(true)
    
    // Simulate project combination process
    setTimeout(() => {
      const newCombinedProject: CombinedProject = {
        id: Date.now().toString(),
        name: combiningName,
        description: combiningDescription,
        sourceProjects: selectedProjects,
        combinationType: combineMode,
        status: 'completed',
        createdAt: new Date()
      }
      
      setCombinedProjects(prev => [newCombinedProject, ...prev])
      setSelectedProjects([])
      setShowCombineModal(false)
      setIsCombining(false)
      setCombiningName('')
      setCombiningDescription('')
    }, 3000)
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'web-app': return 'bg-blue-900/20 text-blue-400 border-blue-700/50'
      case 'mobile-app': return 'bg-green-900/20 text-green-400 border-green-700/50'
      case 'ai-model': return 'bg-purple-900/20 text-purple-400 border-purple-700/50'
      case 'api': return 'bg-orange-900/20 text-orange-400 border-orange-700/50'
      case 'dashboard': return 'bg-cyan-900/20 text-cyan-400 border-cyan-700/50'
      case 'game': return 'bg-pink-900/20 text-pink-400 border-pink-700/50'
      default: return 'bg-gray-900/20 text-gray-400 border-gray-700/50'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-900/20 text-green-400'
      case 'completed': return 'bg-blue-900/20 text-blue-400'
      case 'archived': return 'bg-gray-900/20 text-gray-400'
      default: return 'bg-yellow-900/20 text-yellow-400'
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center">
            <Combine className="h-8 w-8 text-green-400 mr-3" />
            MiniMax Project Combiner
          </h1>
          <p className="text-gray-400 mt-1">Merge and integrate multiple AI projects into unified solutions</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <Badge className={`${selectedProjects.length >= 2 ? 'bg-green-900/20 text-green-400' : 'bg-gray-900/20 text-gray-400'}`}>
            {selectedProjects.length} Selected
          </Badge>
          
          <Button
            onClick={startCombining}
            disabled={selectedProjects.length < 2}
            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:opacity-50"
          >
            <GitMerge className="h-4 w-4 mr-2" />
            Combine Projects
          </Button>
        </div>
      </div>

      {/* Combination Mode Selector */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Combination Strategy</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div
              onClick={() => setCombineMode('merge')}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                combineMode === 'merge' 
                  ? 'border-green-500 bg-green-900/20' 
                  : 'border-gray-600 hover:border-gray-500'
              }`}
            >
              <div className="flex items-center mb-2">
                <GitMerge className="h-5 w-5 text-green-400 mr-2" />
                <h3 className="font-semibold text-white">Merge</h3>
              </div>
              <p className="text-sm text-gray-400">
                Combine codebases into a single unified project with shared components
              </p>
            </div>
            
            <div
              onClick={() => setCombineMode('integrate')}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                combineMode === 'integrate' 
                  ? 'border-blue-500 bg-blue-900/20' 
                  : 'border-gray-600 hover:border-gray-500'
              }`}
            >
              <div className="flex items-center mb-2">
                <Combine className="h-5 w-5 text-blue-400 mr-2" />
                <h3 className="font-semibold text-white">Integrate</h3>
              </div>
              <p className="text-sm text-gray-400">
                Keep projects separate but create seamless communication between them
              </p>
            </div>
            
            <div
              onClick={() => setCombineMode('hybrid')}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                combineMode === 'hybrid' 
                  ? 'border-purple-500 bg-purple-900/20' 
                  : 'border-gray-600 hover:border-gray-500'
              }`}
            >
              <div className="flex items-center mb-2">
                <Archive className="h-5 w-5 text-purple-400 mr-2" />
                <h3 className="font-semibold text-white">Hybrid</h3>
              </div>
              <p className="text-sm text-gray-400">
                Selective integration with some merged components and some standalone
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Available Projects */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Folder className="h-6 w-6 text-blue-400 mr-3" />
            Available Projects ({projects.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => {
              const isSelected = selectedProjects.find(p => p.id === project.id)
              
              return (
                <div
                  key={project.id}
                  onClick={() => toggleProjectSelection(project)}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    isSelected 
                      ? 'border-green-500 bg-green-900/10' 
                      : 'border-gray-600 hover:border-gray-500 bg-gray-900/50'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-white mb-1">{project.name}</h3>
                      <p className="text-sm text-gray-400 mb-2">{project.description}</p>
                    </div>
                    {isSelected && (
                      <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mb-3">
                    <Badge className={getTypeColor(project.type)}>
                      {project.type}
                    </Badge>
                    <Badge className={getStatusColor(project.status)}>
                      {project.status}
                    </Badge>
                  </div>
                  
                  <div className="text-xs text-gray-500 space-y-1">
                    <div>Size: {project.size}</div>
                    <div>Agents: {project.agents.join(', ')}</div>
                    <div>Modified: {project.lastModified.toLocaleDateString()}</div>
                  </div>
                  
                  <div className="flex flex-wrap gap-1 mt-2">
                    {project.technologies.slice(0, 3).map((tech, index) => (
                      <Badge key={index} className="bg-gray-700 text-gray-300 text-xs border-gray-600">
                        {tech}
                      </Badge>
                    ))}
                    {project.technologies.length > 3 && (
                      <Badge className="bg-gray-700 text-gray-300 text-xs border-gray-600">
                        +{project.technologies.length - 3}
                      </Badge>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Combined Projects */}
      {combinedProjects.length > 0 && (
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Archive className="h-6 w-6 text-purple-400 mr-3" />
              Combined Projects ({combinedProjects.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {combinedProjects.map((combined) => (
                <div key={combined.id} className="bg-gray-900/50 border border-gray-600 rounded-lg p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-white mb-2">{combined.name}</h3>
                      <p className="text-gray-400 mb-3">{combined.description}</p>
                      
                      <div className="flex items-center space-x-4 mb-3">
                        <Badge className="bg-purple-900/20 text-purple-400 border-purple-700/50">
                          {combined.combinationType}
                        </Badge>
                        <Badge className={getStatusColor(combined.status)}>
                          {combined.status}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          Created {combined.createdAt.toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                        <Play className="h-4 w-4 mr-1" />
                        Launch
                      </Button>
                      <Button size="sm" variant="outline" className="border-gray-600 text-gray-300">
                        <Download className="h-4 w-4 mr-1" />
                        Export
                      </Button>
                      <Button size="sm" variant="outline" className="border-gray-600 text-gray-300">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-300 mb-2">Source Projects:</h4>
                    <div className="flex flex-wrap gap-2">
                      {combined.sourceProjects.map((project) => (
                        <Badge key={project.id} className="bg-gray-700 text-gray-300 border-gray-600">
                          {project.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Combine Modal */}
      {showCombineModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="bg-gray-800 border-gray-700 w-full max-w-2xl">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <GitMerge className="h-6 w-6 text-green-400 mr-3" />
                Combine Projects
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Project Name</label>
                  <input
                    type="text"
                    value={combiningName}
                    onChange={(e) => setCombiningName(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-green-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                  <textarea
                    value={combiningDescription}
                    onChange={(e) => setCombiningDescription(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white h-24 resize-none focus:outline-none focus:border-green-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Selected Projects</label>
                  <div className="flex flex-wrap gap-2">
                    {selectedProjects.map((project) => (
                      <Badge key={project.id} className="bg-green-900/20 text-green-400 border-green-700/50">
                        {project.name}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Combination Mode</label>
                  <Badge className="bg-purple-900/20 text-purple-400 border-purple-700/50">
                    {combineMode}
                  </Badge>
                </div>
                
                <div className="flex justify-end space-x-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowCombineModal(false)}
                    className="border-gray-600 text-gray-300"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={executeCombine}
                    disabled={!combiningName.trim() || isCombining}
                    className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                  >
                    {isCombining ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Combining...
                      </>
                    ) : (
                      <>
                        <Combine className="h-4 w-4 mr-2" />
                        Start Combination
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
