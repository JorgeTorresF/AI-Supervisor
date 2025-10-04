import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/ui/ToastProvider'
import { 
  Lightbulb,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  AlertCircle,
  Info,
  Send,
  History,
  Star
} from 'lucide-react'

interface ValidationResult {
  feasibility_score: number
  risk_level: string
  warnings: string[]
  suggestions: string[]
  technical_issues: string[]
  business_issues: string[]
  resource_requirements: Record<string, any>
  estimated_timeline: string
  success_probability: number
}

interface PreviousValidation {
  id: string
  project_idea: string
  feasibility_score: number
  risk_level: string
  validated_at: string
}

export function IdeaValidator() {
  const { user } = useAuth()
  const { addToast } = useToast()
  const [projectIdea, setProjectIdea] = useState('')
  const [isValidating, setIsValidating] = useState(false)
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null)
  const [previousValidations, setPreviousValidations] = useState<PreviousValidation[]>([])
  const [showHistory, setShowHistory] = useState(false)

  useEffect(() => {
    if (user) {
      fetchPreviousValidations()
    }
  }, [user])

  const fetchPreviousValidations = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('idea_validations')
        .select('id, project_idea, feasibility_score, risk_level, validated_at')
        .eq('user_id', user.id)
        .order('validated_at', { ascending: false })
        .limit(10)

      if (error) {
        console.error('Error fetching previous validations:', error)
        return
      }

      setPreviousValidations(data || [])
    } catch (error) {
      console.error('Error fetching previous validations:', error)
    }
  }

  const validateIdea = async () => {
    if (!projectIdea.trim()) {
      addToast('Please enter a project idea to validate', 'warning')
      return
    }

    if (projectIdea.length < 10) {
      addToast('Please provide a more detailed project description (at least 10 characters)', 'warning')
      return
    }

    setIsValidating(true)
    setValidationResult(null)

    try {
      const { data, error } = await supabase.functions.invoke('idea-validator', {
        body: {
          project_idea: projectIdea
        }
      })

      if (error) {
        console.error('Validation error:', error)
        addToast('Failed to validate idea. Please try again.', 'error')
        return
      }

      if (data?.data) {
        setValidationResult(data.data)
        addToast('Idea validation completed successfully!', 'success')
        
        // Refresh previous validations
        fetchPreviousValidations()
      } else {
        addToast('No validation result received', 'error')
      }
    } catch (error: any) {
      console.error('Error validating idea:', error)
      addToast(error.message || 'An unexpected error occurred', 'error')
    } finally {
      setIsValidating(false)
    }
  }

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel.toLowerCase()) {
      case 'low':
        return 'text-green-400 bg-green-900/20 border-green-700/50'
      case 'medium':
        return 'text-yellow-400 bg-yellow-900/20 border-yellow-700/50'
      case 'high':
        return 'text-orange-400 bg-orange-900/20 border-orange-700/50'
      case 'critical':
        return 'text-red-400 bg-red-900/20 border-red-700/50'
      default:
        return 'text-gray-400 bg-gray-900/20 border-gray-700/50'
    }
  }

  const getRiskIcon = (riskLevel: string) => {
    switch (riskLevel.toLowerCase()) {
      case 'low':
        return <CheckCircle className="h-5 w-5" />
      case 'medium':
        return <Info className="h-5 w-5" />
      case 'high':
        return <AlertTriangle className="h-5 w-5" />
      case 'critical':
        return <AlertCircle className="h-5 w-5" />
      default:
        return <Info className="h-5 w-5" />
    }
  }

  const loadPreviousValidation = (validation: PreviousValidation) => {
    setProjectIdea(validation.project_idea)
    setShowHistory(false)
    setValidationResult(null)
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center space-x-2">
            <Lightbulb className="h-6 w-6 text-yellow-400" />
            <span>Idea Validator</span>
          </h1>
          <p className="text-gray-400 mt-1">Validate project ideas before investing time and resources</p>
        </div>
        
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="flex items-center space-x-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
        >
          <History className="h-4 w-4" />
          <span>History ({previousValidations.length})</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Validation Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Input Section */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Describe Your Project Idea</h2>
            <div className="space-y-4">
              <textarea
                value={projectIdea}
                onChange={(e) => setProjectIdea(e.target.value)}
                placeholder="Enter your project idea here... Be as detailed as possible to get accurate validation results. Include what you want to build, who it's for, and how it will work."
                className="w-full h-32 px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none transition-colors"
                maxLength={5000}
              />
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-400">
                  {projectIdea.length}/5000 characters
                </div>
                <button
                  onClick={validateIdea}
                  disabled={isValidating || !projectIdea.trim()}
                  className="flex items-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                >
                  {isValidating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Validating...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      <span>Validate Idea</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Validation Results */}
          {validationResult && (
            <div className="space-y-6">
              {/* Overall Score */}
              <div className={`border rounded-lg p-6 ${getRiskColor(validationResult.risk_level)}`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    {getRiskIcon(validationResult.risk_level)}
                    <h3 className="text-lg font-semibold">Validation Results</h3>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">{validationResult.feasibility_score}/10</div>
                    <div className="text-sm opacity-75">Feasibility Score</div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-lg font-semibold">{validationResult.risk_level.toUpperCase()}</div>
                    <div className="text-sm opacity-75">Risk Level</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold">{Math.round(validationResult.success_probability * 100)}%</div>
                    <div className="text-sm opacity-75">Success Probability</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold">{validationResult.estimated_timeline}</div>
                    <div className="text-sm opacity-75">Estimated Timeline</div>
                  </div>
                </div>
              </div>

              {/* Warnings */}
              {validationResult.warnings.length > 0 && (
                <div className="bg-red-900/20 border border-red-700/50 rounded-lg p-6">
                  <h4 className="text-lg font-semibold text-red-400 mb-3 flex items-center space-x-2">
                    <AlertTriangle className="h-5 w-5" />
                    <span>Warnings</span>
                  </h4>
                  <ul className="space-y-2">
                    {validationResult.warnings.map((warning, index) => (
                      <li key={index} className="text-red-100 flex items-start space-x-2">
                        <div className="w-1.5 h-1.5 bg-red-400 rounded-full mt-2 flex-shrink-0"></div>
                        <span>{warning}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Suggestions */}
              {validationResult.suggestions.length > 0 && (
                <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-6">
                  <h4 className="text-lg font-semibold text-blue-400 mb-3 flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5" />
                    <span>Suggestions</span>
                  </h4>
                  <ul className="space-y-2">
                    {validationResult.suggestions.map((suggestion, index) => (
                      <li key={index} className="text-blue-100 flex items-start space-x-2">
                        <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                        <span>{suggestion}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Technical & Business Issues */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {validationResult.technical_issues.length > 0 && (
                  <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                    <h4 className="text-lg font-semibold text-white mb-3">Technical Issues</h4>
                    <ul className="space-y-2">
                      {validationResult.technical_issues.map((issue, index) => (
                        <li key={index} className="text-gray-300 flex items-start space-x-2">
                          <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                          <span>{issue}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {validationResult.business_issues.length > 0 && (
                  <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                    <h4 className="text-lg font-semibold text-white mb-3">Business Issues</h4>
                    <ul className="space-y-2">
                      {validationResult.business_issues.map((issue, index) => (
                        <li key={index} className="text-gray-300 flex items-start space-x-2">
                          <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                          <span>{issue}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Resource Requirements */}
              {Object.keys(validationResult.resource_requirements).length > 0 && (
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                  <h4 className="text-lg font-semibold text-white mb-3">Resource Requirements</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(validationResult.resource_requirements).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between py-2">
                        <span className="text-gray-400 capitalize">{key.replace('_', ' ')}</span>
                        <span className="text-white font-medium">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Tips */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
              <Star className="h-5 w-5 text-yellow-400" />
              <span>Validation Tips</span>
            </h3>
            <div className="space-y-3 text-sm text-gray-300">
              <div className="p-3 bg-gray-700/50 rounded-lg">
                <p className="font-medium text-white mb-1">Be Specific</p>
                <p>Include details about your target users, core features, and business model.</p>
              </div>
              <div className="p-3 bg-gray-700/50 rounded-lg">
                <p className="font-medium text-white mb-1">Technical Details</p>
                <p>Mention the technology stack and complexity level you're considering.</p>
              </div>
              <div className="p-3 bg-gray-700/50 rounded-lg">
                <p className="font-medium text-white mb-1">Market Context</p>
                <p>Explain the problem you're solving and how you'll differentiate from competitors.</p>
              </div>
            </div>
          </div>

          {/* Previous Validations */}
          {showHistory && previousValidations.length > 0 && (
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Previous Validations</h3>
              <div className="space-y-3">
                {previousValidations.map((validation) => (
                  <div
                    key={validation.id}
                    onClick={() => loadPreviousValidation(validation)}
                    className="p-3 bg-gray-700/50 hover:bg-gray-700 rounded-lg cursor-pointer transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-xs px-2 py-1 rounded ${getRiskColor(validation.risk_level).split(' ')[0]} ${getRiskColor(validation.risk_level).split(' ')[1]}`}>
                        {validation.risk_level.toUpperCase()}
                      </span>
                      <span className="text-xs text-gray-400">
                        {validation.feasibility_score}/10
                      </span>
                    </div>
                    <p className="text-sm text-gray-300 truncate">{validation.project_idea}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(validation.validated_at).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}