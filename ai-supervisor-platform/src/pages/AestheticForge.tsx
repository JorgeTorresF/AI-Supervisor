import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Palette,
  Code,
  Eye,
  Download,
  Copy,
  Sparkles,
  Monitor,
  Smartphone,
  RefreshCw
} from 'lucide-react'
import { toast } from 'sonner'
import { invokeEdgeFunction } from '../lib/supabase'

export const AestheticForge: React.FC = () => {
  const [prompt, setPrompt] = useState('')
  const [aestheticTheme, setAestheticTheme] = useState('cyberpunk')
  const [componentType, setComponentType] = useState('button')
  const [complexity, setComplexity] = useState('intermediate')
  const [generatedCode, setGeneratedCode] = useState<any>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop')

  const themes = [
    { value: 'cyberpunk', label: 'Cyberpunk', colors: ['#00ffff', '#ff00ff', '#39ff14'], description: 'Neon and futuristic vibes' },
    { value: 'glitchcore', label: 'Glitchcore', colors: ['#00ff41', '#ff0040', '#00ffff'], description: 'Digital distortion effects' },
    { value: 'minimal', label: 'Minimal', colors: ['#007acc', '#333333', '#ffffff'], description: 'Clean and simple design' },
    { value: 'slushwave', label: 'Slushwave', colors: ['#ff006e', '#8338ec', '#3a86ff'], description: 'Dreamy gradient flows' },
    { value: 'vaporwave', label: 'Vaporwave', colors: ['#ff006e', '#8338ec', '#39ff14'], description: 'Retro 80s aesthetics' },
    { value: 'brutalist', label: 'Brutalist', colors: ['#000000', '#ffffff', '#ff0000'], description: 'Bold and raw design' }
  ]

  const componentTypes = [
    { value: 'button', label: 'Button' },
    { value: 'card', label: 'Card' },
    { value: 'form', label: 'Form' },
    { value: 'navigation', label: 'Navigation' },
    { value: 'hero', label: 'Hero Section' },
    { value: 'layout', label: 'Layout Grid' }
  ]

  const complexityLevels = [
    { value: 'beginner', label: 'Beginner', description: 'Simple, clean code' },
    { value: 'intermediate', label: 'Intermediate', description: 'Moderate complexity' },
    { value: 'advanced', label: 'Advanced', description: 'Complex animations' }
  ]

  const handleGenerateCode = async () => {
    if (!prompt.trim()) {
      toast.error('Please enter a prompt for code generation')
      return
    }

    setIsGenerating(true)

    try {
      const { data, error } = await invokeEdgeFunction('AESTHETIC_FORGE', {
        prompt,
        aestheticTheme,
        componentType,
        complexity
      })

      if (error) {
        throw error
      }

      if (data?.data?.code) {
        setGeneratedCode(data.data.code)
        toast.success('Code generated successfully!')
      } else {
        // Fallback with mock data
        const mockCode = {
          html: `<div class="${aestheticTheme}-component">
  <h2>Generated Component</h2>
  <p>This is a ${aestheticTheme} styled ${componentType} component.</p>
  <button class="cta-button">Click Me</button>
</div>`,
          css: `.${aestheticTheme}-component {
  background: linear-gradient(135deg, #8b5cf6, #06b6d4);
  padding: 2rem;
  border-radius: 1rem;
  color: white;
  max-width: 400px;
  margin: 2rem auto;
  text-align: center;
  border: 2px solid rgba(139, 92, 246, 0.3);
  box-shadow: 0 10px 30px rgba(139, 92, 246, 0.2);
}

.${aestheticTheme}-component h2 {
  font-size: 1.5rem;
  margin-bottom: 1rem;
  text-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
}

.cta-button {
  background: linear-gradient(45deg, #ff006e, #8338ec);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 1rem;
}

.cta-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 25px rgba(255, 0, 110, 0.3);
}`,
          javascript: `// Interactive functionality
document.addEventListener('DOMContentLoaded', function() {
  const button = document.querySelector('.cta-button');
  if (button) {
    button.addEventListener('click', function() {
      this.style.transform = 'scale(0.95)';
      setTimeout(() => {
        this.style.transform = '';
      }, 150);
      
      // Add your custom functionality here
      console.log('${aestheticTheme} button clicked!');
    });
  }
});`,
          description: `A ${aestheticTheme} styled ${componentType} component with modern design patterns and interactive elements.`,
          features: ['Responsive design', 'Smooth animations', 'Modern CSS3', 'Interactive elements'],
          usage: 'Copy the HTML, CSS, and JavaScript code to integrate into your project.',
          accessibility: 'Includes proper focus states and semantic HTML structure.'
        }
        setGeneratedCode(mockCode)
        toast.success('Code generated! (Demo mode)', {
          description: 'Full AI integration available with API key setup'
        })
      }
    } catch (error) {
      console.error('Error generating code:', error)
      toast.error('Failed to generate code. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const copyToClipboard = (code: string, type: string) => {
    navigator.clipboard.writeText(code)
    toast.success(`${type} code copied to clipboard!`)
  }

  const downloadCode = () => {
    if (!generatedCode) return

    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${aestheticTheme} Component</title>
    <style>
${generatedCode.css}
    </style>
</head>
<body>
${generatedCode.html}
    <script>
${generatedCode.javascript}
    </script>
</body>
</html>`

    const blob = new Blob([htmlContent], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${aestheticTheme}-${componentType}.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    toast.success('Code downloaded successfully!')
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <Palette className="w-8 h-8 text-purple-400" />
            Aesthetic Forge
          </h1>
          <p className="text-slate-400">Generate beautiful UI components with AI-powered aesthetic themes</p>
        </div>
        <div className="flex items-center gap-2 bg-purple-500/20 text-purple-400 px-3 py-2 rounded-lg">
          <Sparkles className="w-4 h-4" />
          <span className="text-sm font-medium">6 Themes Available</span>
        </div>
      </motion.div>

      {/* Theme Selection */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-slate-800/50 backdrop-blur-lg rounded-xl p-6 border border-purple-500/20"
      >
        <h2 className="text-xl font-semibold text-white mb-6">Aesthetic Themes</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {themes.map((theme) => (
            <button
              key={theme.value}
              onClick={() => setAestheticTheme(theme.value)}
              className={`p-4 rounded-lg border-2 transition-all duration-300 text-left ${
                aestheticTheme === theme.value
                  ? 'border-purple-400 bg-purple-500/20'
                  : 'border-slate-600 bg-slate-700/30 hover:border-slate-500'
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="flex gap-1">
                  {theme.colors.map((color, i) => (
                    <div
                      key={i}
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <h3 className="font-semibold text-white">{theme.label}</h3>
              </div>
              <p className="text-slate-400 text-sm">{theme.description}</p>
            </button>
          ))}
        </div>
      </motion.div>

      {/* Configuration */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-slate-800/50 backdrop-blur-lg rounded-xl p-6 border border-purple-500/20"
      >
        <h2 className="text-xl font-semibold text-white mb-6">Component Configuration</h2>
        
        <div className="space-y-6">
          <div>
            <label className="block text-white font-medium mb-2">Component Description</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the component you want to create... (e.g., 'a glowing neon button with hover animations for a cyberpunk website')"
              className="w-full h-24 bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:border-purple-400 focus:outline-none transition-colors resize-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-white font-medium mb-2">Component Type</label>
              <select
                value={componentType}
                onChange={(e) => setComponentType(e.target.value)}
                className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-3 text-white focus:border-purple-400 focus:outline-none transition-colors"
              >
                {componentTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-white font-medium mb-2">Complexity Level</label>
              <select
                value={complexity}
                onChange={(e) => setComplexity(e.target.value)}
                className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-3 text-white focus:border-purple-400 focus:outline-none transition-colors"
              >
                {complexityLevels.map(level => (
                  <option key={level.value} value={level.value}>{level.label} - {level.description}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-center">
            <button
              onClick={handleGenerateCode}
              disabled={isGenerating || !prompt.trim()}
              className="bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold px-8 py-3 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3"
            >
              {isGenerating ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Forging Code...</span>
                </>
              ) : (
                <>
                  <Code className="w-5 h-5" />
                  <span>Generate Component</span>
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>

      {/* Generated Code */}
      {generatedCode && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-8"
        >
          {/* Preview */}
          <div className="bg-slate-800/50 backdrop-blur-lg rounded-xl p-6 border border-purple-500/20">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white flex items-center gap-3">
                <Eye className="w-5 h-5 text-blue-400" />
                Live Preview
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setPreviewMode('desktop')}
                  className={`p-2 rounded-lg transition-colors ${
                    previewMode === 'desktop' ? 'bg-blue-500 text-white' : 'bg-slate-700 text-slate-400'
                  }`}
                >
                  <Monitor className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPreviewMode('mobile')}
                  className={`p-2 rounded-lg transition-colors ${
                    previewMode === 'mobile' ? 'bg-blue-500 text-white' : 'bg-slate-700 text-slate-400'
                  }`}
                >
                  <Smartphone className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div className={`bg-white rounded-lg p-4 overflow-auto ${
              previewMode === 'mobile' ? 'max-w-sm mx-auto' : 'w-full'
            }`}>
              <div 
                dangerouslySetInnerHTML={{ __html: generatedCode.html }}
              />
              <style dangerouslySetInnerHTML={{ __html: generatedCode.css }} />
            </div>
          </div>

          {/* Code Tabs */}
          <div className="bg-slate-800/50 backdrop-blur-lg rounded-xl p-6 border border-purple-500/20">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white flex items-center gap-3">
                <Code className="w-5 h-5 text-green-400" />
                Generated Code
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={downloadCode}
                  className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {/* HTML */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-white font-medium">HTML</h4>
                  <button
                    onClick={() => copyToClipboard(generatedCode.html, 'HTML')}
                    className="flex items-center gap-1 px-2 py-1 bg-slate-700 text-white rounded text-sm hover:bg-slate-600 transition-colors"
                  >
                    <Copy className="w-3 h-3" />
                    Copy
                  </button>
                </div>
                <pre className="bg-slate-900 text-green-400 p-4 rounded-lg text-sm overflow-x-auto font-mono">
                  <code>{generatedCode.html}</code>
                </pre>
              </div>

              {/* CSS */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-white font-medium">CSS</h4>
                  <button
                    onClick={() => copyToClipboard(generatedCode.css, 'CSS')}
                    className="flex items-center gap-1 px-2 py-1 bg-slate-700 text-white rounded text-sm hover:bg-slate-600 transition-colors"
                  >
                    <Copy className="w-3 h-3" />
                    Copy
                  </button>
                </div>
                <pre className="bg-slate-900 text-blue-400 p-4 rounded-lg text-sm overflow-x-auto font-mono max-h-40 overflow-y-auto">
                  <code>{generatedCode.css}</code>
                </pre>
              </div>

              {/* JavaScript */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-white font-medium">JavaScript</h4>
                  <button
                    onClick={() => copyToClipboard(generatedCode.javascript, 'JavaScript')}
                    className="flex items-center gap-1 px-2 py-1 bg-slate-700 text-white rounded text-sm hover:bg-slate-600 transition-colors"
                  >
                    <Copy className="w-3 h-3" />
                    Copy
                  </button>
                </div>
                <pre className="bg-slate-900 text-yellow-400 p-4 rounded-lg text-sm overflow-x-auto font-mono max-h-32 overflow-y-auto">
                  <code>{generatedCode.javascript}</code>
                </pre>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}