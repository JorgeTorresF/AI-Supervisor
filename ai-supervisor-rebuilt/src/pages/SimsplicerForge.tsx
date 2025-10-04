import React, { useState, useEffect } from 'react'
import { 
  Palette, 
  Code2, 
  Eye, 
  Play, 
  Download, 
  Save, 
  Share2, 
  Shuffle, 
  Settings, 
  Monitor,
  Smartphone,
  Tablet,
  Zap,
  Sparkles,
  Copy,
  RefreshCw
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

interface VisualTheme {
  id: string
  name: string
  description: string
  primaryColor: string
  secondaryColor: string
  accentColor: string
  gradient: string
  characteristics: string[]
}

interface GeneratedCode {
  html: string
  css: string
  js: string
}

interface ComponentTemplate {
  id: string
  name: string
  description: string
  category: string
  code: GeneratedCode
}

const VISUAL_THEMES: VisualTheme[] = [
  {
    id: 'slushwave',
    name: 'Slushwave',
    description: 'Dreamy gradients and flowing aesthetics',
    primaryColor: '#ff006e',
    secondaryColor: '#8338ec',
    accentColor: '#3a86ff',
    gradient: 'linear-gradient(45deg, #ff006e, #8338ec, #3a86ff)',
    characteristics: ['Soft gradients', 'Flowing animations', 'Pastel accents', 'Organic shapes']
  },
  {
    id: 'glitchcore',
    name: 'Glitchcore',
    description: 'Digital chaos and cybernetic aesthetics',
    primaryColor: '#00ff41',
    secondaryColor: '#ff0040',
    accentColor: '#00ffff',
    gradient: 'linear-gradient(45deg, #00ff41, #ff0040, #00ffff)',
    characteristics: ['Glitch effects', 'Digital distortion', 'Neon colors', 'System errors']
  },
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Clean lines and essential elements',
    primaryColor: '#007acc',
    secondaryColor: '#333333',
    accentColor: '#ffffff',
    gradient: 'linear-gradient(45deg, #007acc, #333333, #ffffff)',
    characteristics: ['Clean typography', 'Whitespace', 'Subtle shadows', 'Essential elements']
  },
  {
    id: 'cyberpunk',
    name: 'Cyberpunk',
    description: 'Neon-lit future with high-tech vibes',
    primaryColor: '#00ffff',
    secondaryColor: '#ff00ff',
    accentColor: '#39ff14',
    gradient: 'linear-gradient(45deg, #00ffff, #ff00ff, #39ff14)',
    characteristics: ['Neon glows', 'Grid patterns', 'Holographic effects', 'Tech interfaces']
  },
  {
    id: 'vaporwave',
    name: 'Vaporwave',
    description: 'Retro-futuristic nostalgia',
    primaryColor: '#ff006e',
    secondaryColor: '#8338ec',
    accentColor: '#ffbe0b',
    gradient: 'linear-gradient(45deg, #ff006e, #8338ec, #ffbe0b)',
    characteristics: ['Retro grids', 'Pink/purple palettes', 'Chrome effects', '80s nostalgia']
  },
  {
    id: 'brutalist',
    name: 'Brutalist',
    description: 'Bold, raw, and uncompromising design',
    primaryColor: '#000000',
    secondaryColor: '#ffffff',
    accentColor: '#ff0000',
    gradient: 'linear-gradient(45deg, #000000, #ffffff, #ff0000)',
    characteristics: ['Bold typography', 'Stark contrast', 'Raw layouts', 'Geometric shapes']
  }
]

const COMPONENT_TEMPLATES: { [key: string]: ComponentTemplate[] } = {
  slushwave: [
    {
      id: 'slush-button',
      name: 'Neon Button',
      description: 'Glowing button with smooth animations',
      category: 'Buttons',
      code: {
        html: '<button class="slush-btn">Click Me</button>',
        css: `.slush-btn {
  background: linear-gradient(45deg, #ff006e, #8338ec);
  border: none;
  color: white;
  padding: 15px 30px;
  border-radius: 25px;
  font-size: 16px;
  cursor: pointer;
  text-transform: uppercase;
  letter-spacing: 2px;
  box-shadow: 0 0 20px rgba(255, 0, 110, 0.5);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}
.slush-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 30px rgba(255, 0, 110, 0.7);
}`,
        js: ''
      }
    },
    {
      id: 'slush-card',
      name: 'Wavy Card',
      description: 'Card with flowing gradient background',
      category: 'Cards',
      code: {
        html: '<div class="slush-card"><h3>Slushwave</h3><p>Aesthetic vibes</p></div>',
        css: `.slush-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 30px;
  border-radius: 20px;
  color: white;
  position: relative;
  overflow: hidden;
  box-shadow: 0 15px 35px rgba(102, 126, 234, 0.3);
}
.slush-card::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: linear-gradient(45deg, transparent, rgba(255,255,255,0.1), transparent);
  animation: wave 3s ease-in-out infinite;
}
@keyframes wave {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}`,
        js: ''
      }
    }
  ],
  glitchcore: [
    {
      id: 'glitch-text',
      name: 'Glitch Text',
      description: 'Text with digital distortion effects',
      category: 'Typography',
      code: {
        html: '<h2 class="glitch-text" data-text="GLITCH">GLITCH</h2>',
        css: `.glitch-text {
  font-family: 'Courier New', monospace;
  font-size: 3rem;
  font-weight: bold;
  text-transform: uppercase;
  position: relative;
  color: #00ff41;
  letter-spacing: 5px;
}
.glitch-text::before,
.glitch-text::after {
  content: attr(data-text);
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}
.glitch-text::before {
  animation: glitch-anim-1 0.5s infinite linear alternate-reverse;
  color: #ff0040;
  z-index: -1;
}
.glitch-text::after {
  animation: glitch-anim-2 0.5s infinite linear alternate-reverse;
  color: #00ffff;
  z-index: -2;
}
@keyframes glitch-anim-1 {
  0% { clip: rect(42px, 9999px, 44px, 0); }
  10% { clip: rect(12px, 9999px, 59px, 0); }
  20% { clip: rect(15px, 9999px, 34px, 0); }
  100% { clip: rect(45px, 9999px, 60px, 0); }
}
@keyframes glitch-anim-2 {
  0% { clip: rect(65px, 9999px, 119px, 0); }
  15% { clip: rect(25px, 9999px, 90px, 0); }
  35% { clip: rect(85px, 9999px, 90px, 0); }
  100% { clip: rect(45px, 9999px, 60px, 0); }
}`,
        js: ''
      }
    }
  ]
}

export function SimsplicerForge() {
  const [selectedTheme, setSelectedTheme] = useState<VisualTheme>(VISUAL_THEMES[0])
  const [prompt, setPrompt] = useState('')
  const [generatedCode, setGeneratedCode] = useState<GeneratedCode>({ html: '', css: '', js: '' })
  const [activeTab, setActiveTab] = useState<'html' | 'css' | 'js'>('html')
  const [isGenerating, setIsGenerating] = useState(false)
  const [previewMode, setPreviewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')
  const [showPreview, setShowPreview] = useState(true)
  const [savedCreations, setSavedCreations] = useState<any[]>([])

  const generateCode = async () => {
    if (!prompt.trim()) return
    
    setIsGenerating(true)
    
    // Simulate AI code generation based on theme and prompt
    setTimeout(() => {
      const themeColors = {
        primary: selectedTheme.primaryColor,
        secondary: selectedTheme.secondaryColor,
        accent: selectedTheme.accentColor
      }
      
      let html = '', css = '', js = ''
      
      // Generate based on prompt keywords
      if (prompt.toLowerCase().includes('button')) {
        html = `<button class="${selectedTheme.id}-generated-btn">${prompt.includes('login') ? 'Login' : 'Click Me'}</button>`
        css = generateButtonCSS(selectedTheme, themeColors)
      } else if (prompt.toLowerCase().includes('card')) {
        html = `<div class="${selectedTheme.id}-generated-card">
  <h3>Generated Card</h3>
  <p>This card was created with ${selectedTheme.name} aesthetic.</p>
  <button class="card-action">Action</button>
</div>`
        css = generateCardCSS(selectedTheme, themeColors)
      } else {
        // Generic component
        html = `<div class="${selectedTheme.id}-generated-component">
  <h2>Generated Component</h2>
  <p>Based on: "${prompt}"</p>
  <div class="component-content">
    <span class="highlight">Aesthetic Element</span>
  </div>
</div>`
        css = generateGenericCSS(selectedTheme, themeColors)
      }
      
      js = `// Interactive functionality
document.addEventListener('DOMContentLoaded', function() {
  const element = document.querySelector('.${selectedTheme.id}-generated-btn, .${selectedTheme.id}-generated-card, .${selectedTheme.id}-generated-component');
  if (element) {
    element.addEventListener('click', function() {
      this.style.transform = 'scale(0.95)';
      setTimeout(() => this.style.transform = '', 150);
    });
  }
});`
      
      setGeneratedCode({ html, css, js })
      setIsGenerating(false)
      setShowPreview(true)
    }, 1500)
  }

  const generateButtonCSS = (theme: VisualTheme, colors: any) => {
    switch (theme.id) {
      case 'slushwave':
        return `.${theme.id}-generated-btn {
  background: linear-gradient(45deg, ${colors.primary}, ${colors.secondary});
  border: none;
  color: white;
  padding: 15px 30px;
  border-radius: 25px;
  font-size: 16px;
  cursor: pointer;
  text-transform: uppercase;
  letter-spacing: 2px;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px ${colors.primary}40;
}
.${theme.id}-generated-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 25px ${colors.primary}60;
}`
      
      case 'glitchcore':
        return `.${theme.id}-generated-btn {
  background: ${colors.primary};
  border: 2px solid ${colors.secondary};
  color: black;
  padding: 15px 30px;
  font-family: 'Courier New', monospace;
  font-weight: bold;
  text-transform: uppercase;
  cursor: pointer;
  position: relative;
  transition: all 0.3s ease;
}
.${theme.id}-generated-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: ${colors.secondary};
  animation: glitch-bg 0.3s infinite;
}
@keyframes glitch-bg {
  0%, 100% { opacity: 0; }
  50% { opacity: 0.5; }
}`
      
      case 'cyberpunk':
        return `.${theme.id}-generated-btn {
  background: transparent;
  border: 2px solid ${colors.primary};
  color: ${colors.primary};
  padding: 15px 30px;
  font-weight: bold;
  text-transform: uppercase;
  cursor: pointer;
  position: relative;
  transition: all 0.3s ease;
  box-shadow: 0 0 20px ${colors.primary}40;
}
.${theme.id}-generated-btn:hover {
  background: ${colors.primary};
  color: black;
  box-shadow: 0 0 30px ${colors.primary}80;
}`
      
      default:
        return `.${theme.id}-generated-btn {
  background: ${colors.primary};
  border: none;
  color: white;
  padding: 12px 24px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s ease;
}
.${theme.id}-generated-btn:hover {
  background: ${colors.secondary};
}`
    }
  }

  const generateCardCSS = (theme: VisualTheme, colors: any) => {
    return `.${theme.id}-generated-card {
  background: linear-gradient(135deg, ${colors.primary}, ${colors.secondary});
  padding: 30px;
  border-radius: ${theme.id === 'minimal' ? '8px' : '15px'};
  color: white;
  box-shadow: 0 10px 30px rgba(0,0,0,0.3);
  position: relative;
  overflow: hidden;
  max-width: 350px;
}
.card-action {
  background: ${colors.accent};
  border: none;
  color: ${theme.id === 'minimal' ? colors.primary : 'white'};
  padding: 10px 20px;
  border-radius: 5px;
  margin-top: 15px;
  cursor: pointer;
  transition: all 0.3s ease;
}
.card-action:hover {
  transform: translateY(-2px);
}`
  }

  const generateGenericCSS = (theme: VisualTheme, colors: any) => {
    return `.${theme.id}-generated-component {
  background: linear-gradient(45deg, ${colors.primary}20, ${colors.secondary}20);
  border: 2px solid ${colors.primary};
  padding: 20px;
  border-radius: 10px;
  color: ${theme.id === 'minimal' ? '#333' : 'white'};
  position: relative;
}
.highlight {
  color: ${colors.accent};
  font-weight: bold;
  text-shadow: 0 0 10px ${colors.accent};
}`
  }

  const getPreviewHTML = () => {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Preview</title>
    <style>
        body {
            margin: 0;
            padding: 20px;
            background: ${selectedTheme.id === 'minimal' ? '#f5f5f5' : '#1a1a1a'};
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
        }
        ${generatedCode.css}
    </style>
</head>
<body>
    ${generatedCode.html}
    <script>
        ${generatedCode.js}
    </script>
</body>
</html>`
  }

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text)
    // You could add a toast notification here
  }

  const saveCreation = () => {
    const creation = {
      id: Date.now().toString(),
      name: prompt || 'Untitled Creation',
      theme: selectedTheme.name,
      code: generatedCode,
      timestamp: new Date()
    }
    setSavedCreations(prev => [creation, ...prev])
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center">
            <Palette className="h-8 w-8 text-purple-400 mr-3" />
            Simsplicer: Aesthetic Code Forge
          </h1>
          <p className="text-gray-400 mt-1">Generate beautiful, themed components with AI</p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Badge className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 text-purple-400 border-purple-500/20">
            6 Visual Themes
          </Badge>
          <Badge className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 text-cyan-400 border-cyan-500/20">
            Live Preview
          </Badge>
        </div>
      </div>

      {/* Theme Selector */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Sparkles className="h-6 w-6 text-yellow-400 mr-3" />
            Choose Your Aesthetic
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {VISUAL_THEMES.map((theme) => (
              <div
                key={theme.id}
                onClick={() => setSelectedTheme(theme)}
                className={`cursor-pointer p-4 rounded-lg border-2 transition-all ${
                  selectedTheme.id === theme.id 
                    ? 'border-purple-500 bg-purple-900/20' 
                    : 'border-gray-600 hover:border-gray-500 bg-gray-900/50'
                }`}
              >
                <div 
                  className="w-full h-16 rounded-lg mb-3"
                  style={{ background: theme.gradient }}
                ></div>
                <h3 className="font-semibold text-white text-sm mb-1">{theme.name}</h3>
                <p className="text-xs text-gray-400 mb-2">{theme.description}</p>
                <div className="flex flex-wrap gap-1">
                  {theme.characteristics.slice(0, 2).map((char, index) => (
                    <Badge key={index} className="text-xs bg-gray-700 text-gray-300 border-gray-600">
                      {char}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Code Generation */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Zap className="h-6 w-6 text-cyan-400 mr-3" />
            AI Code Generator
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex space-x-4">
              <div className="flex-1">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder={`Describe your ${selectedTheme.name} component... (e.g., "glowing login button", "animated card with hover effects", "navigation bar with neon styling")`}
                  className="w-full h-24 px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 resize-none focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                />
              </div>
              
              <div className="flex flex-col space-y-2">
                <Button
                  onClick={generateCode}
                  disabled={!prompt.trim() || isGenerating}
                  className="bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-700 hover:to-purple-700 disabled:opacity-50 px-8"
                >
                  {isGenerating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Forging...
                    </>
                  ) : (
                    <>
                      <Code2 className="h-4 w-4 mr-2" />
                      Forge Code
                    </>
                  )}
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => setPrompt('')}
                  className="border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="text-sm text-gray-400">
              <strong>Selected Theme:</strong> {selectedTheme.name} - {selectedTheme.description}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Code Editor and Preview */}
      {generatedCode.html && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Code Editor */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white flex items-center">
                  <Code2 className="h-6 w-6 text-green-400 mr-3" />
                  Code Editor
                </CardTitle>
                
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    onClick={saveCreation}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-gray-600 text-gray-300"
                  >
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                </div>
              </div>
              
              {/* Code Tabs */}
              <div className="flex space-x-1 mt-4">
                {(['html', 'css', 'js'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-colors ${
                      activeTab === tab
                        ? 'bg-gray-900 text-white border-b-2 border-cyan-500'
                        : 'bg-gray-700 text-gray-400 hover:text-white hover:bg-gray-600'
                    }`}
                  >
                    {tab.toUpperCase()}
                  </button>
                ))}
              </div>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <pre className="bg-gray-900 rounded-lg p-4 text-sm text-gray-300 overflow-x-auto max-h-96">
                  <code>
                    {activeTab === 'html' && generatedCode.html}
                    {activeTab === 'css' && generatedCode.css}
                    {activeTab === 'js' && generatedCode.js}
                  </code>
                </pre>
                
                <Button
                  size="sm"
                  onClick={() => copyToClipboard(
                    activeTab === 'html' ? generatedCode.html :
                    activeTab === 'css' ? generatedCode.css : generatedCode.js,
                    activeTab
                  )}
                  className="absolute top-2 right-2 bg-gray-700 hover:bg-gray-600"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Live Preview */}
          {showPreview && (
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white flex items-center">
                    <Eye className="h-6 w-6 text-purple-400 mr-3" />
                    Live Preview
                  </CardTitle>
                  
                  <div className="flex items-center space-x-2">
                    {/* Device Toggles */}
                    <div className="flex bg-gray-700 rounded-lg p-1">
                      <button
                        onClick={() => setPreviewMode('desktop')}
                        className={`p-2 rounded ${previewMode === 'desktop' ? 'bg-gray-600 text-white' : 'text-gray-400'}`}
                      >
                        <Monitor className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setPreviewMode('tablet')}
                        className={`p-2 rounded ${previewMode === 'tablet' ? 'bg-gray-600 text-white' : 'text-gray-400'}`}
                      >
                        <Tablet className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setPreviewMode('mobile')}
                        className={`p-2 rounded ${previewMode === 'mobile' ? 'bg-gray-600 text-white' : 'text-gray-400'}`}
                      >
                        <Smartphone className="h-4 w-4" />
                      </button>
                    </div>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-gray-600 text-gray-300"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className={`bg-white rounded-lg overflow-hidden ${
                  previewMode === 'desktop' ? 'h-96' :
                  previewMode === 'tablet' ? 'h-80 max-w-md mx-auto' :
                  'h-96 max-w-sm mx-auto'
                }`}>
                  <iframe
                    srcDoc={getPreviewHTML()}
                    className="w-full h-full border-none"
                    title="Component Preview"
                  />
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Component Library */}
      {selectedTheme && COMPONENT_TEMPLATES[selectedTheme.id] && (
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Palette className="h-6 w-6 text-pink-400 mr-3" />
              {selectedTheme.name} Component Library
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {COMPONENT_TEMPLATES[selectedTheme.id]?.map((template) => (
                <div
                  key={template.id}
                  className="bg-gray-900/50 border border-gray-600 rounded-lg p-4 hover:border-gray-500 transition-colors cursor-pointer"
                  onClick={() => {
                    setGeneratedCode(template.code)
                    setShowPreview(true)
                    setPrompt(template.description)
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-white text-sm">{template.name}</h3>
                    <Badge className="bg-purple-900/20 text-purple-400 border-purple-700/50 text-xs">
                      {template.category}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-400 mb-3">{template.description}</p>
                  
                  <div className="flex space-x-2">
                    <Button size="sm" className="bg-gradient-to-r from-purple-600 to-pink-600 flex-1 text-xs">
                      <Play className="h-3 w-3 mr-1" />
                      Use
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="border-gray-600 text-gray-300 text-xs"
                      onClick={(e) => {
                        e.stopPropagation()
                        copyToClipboard(template.code.html + '\n\n' + template.code.css, 'component')
                      }}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Saved Creations */}
      {savedCreations.length > 0 && (
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Save className="h-6 w-6 text-green-400 mr-3" />
              My Creations ({savedCreations.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {savedCreations.slice(0, 6).map((creation) => (
                <div
                  key={creation.id}
                  className="bg-gray-900/50 border border-gray-600 rounded-lg p-4 hover:border-gray-500 transition-colors cursor-pointer"
                  onClick={() => {
                    setGeneratedCode(creation.code)
                    setPrompt(creation.name)
                    setShowPreview(true)
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-white text-sm truncate">{creation.name}</h3>
                    <Badge className="bg-blue-900/20 text-blue-400 border-blue-700/50 text-xs">
                      {creation.theme}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-400">
                    Created {creation.timestamp.toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
