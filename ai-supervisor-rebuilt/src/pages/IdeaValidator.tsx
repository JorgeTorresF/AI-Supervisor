import React, { useState } from 'react'
import { 
  Target, 
  Brain, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Star, 
  Lightbulb, 
  BarChart3
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

export function IdeaValidator() {
  const [idea, setIdea] = useState('')
  const [validation, setValidation] = useState<any>(null)
  const [isValidating, setIsValidating] = useState(false)

  const validateIdea = async () => {
    if (!idea.trim()) return
    
    setIsValidating(true)
    
    // Simulate validation process
    setTimeout(() => {
      const mockValidation = {
        feasibility: 8.5,
        marketPotential: 7.8,
        technicalComplexity: 6.2,
        innovation: 9.1,
        overallScore: 8.2,
        risks: [
          'High technical complexity may extend development timeline',
          'Market competition from established players',
          'User adoption challenges'
        ],
        opportunities: [
          'Emerging market with high growth potential',
          'Unique value proposition',
          'Strong technology foundation'
        ],
        recommendations: [
          'Start with MVP to validate core assumptions',
          'Conduct user research for market validation',
          'Consider strategic partnerships'
        ]
      }
      
      setValidation(mockValidation)
      setIsValidating(false)
    }, 2000)
  }

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-400'
    if (score >= 6) return 'text-yellow-400'
    return 'text-red-400'
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center">
            <Target className="h-8 w-8 text-green-400 mr-3" />
            Idea Validator
          </h1>
          <p className="text-gray-400 mt-1">Validate your project ideas with AI-powered analysis</p>
        </div>
      </div>

      {/* Input Section */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Lightbulb className="h-6 w-6 text-yellow-400 mr-3" />
            Describe Your Idea
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <textarea
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              placeholder="Describe your project idea in detail... Include the problem you're solving, target audience, key features, and business model."
              className="w-full h-32 px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 resize-none focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
            />
            
            <div className="flex justify-end">
              <Button
                onClick={validateIdea}
                disabled={!idea.trim() || isValidating}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
              >
                {isValidating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Validating...
                  </>
                ) : (
                  <>
                    <Target className="h-4 w-4 mr-2" />
                    Validate Idea
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {validation && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Scores */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <BarChart3 className="h-6 w-6 text-blue-400 mr-3" />
                Validation Scores
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Feasibility</span>
                  <span className={`text-xl font-bold ${getScoreColor(validation.feasibility)}`}>
                    {validation.feasibility.toFixed(1)}/10
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Market Potential</span>
                  <span className={`text-xl font-bold ${getScoreColor(validation.marketPotential)}`}>
                    {validation.marketPotential.toFixed(1)}/10
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Innovation</span>
                  <span className={`text-xl font-bold ${getScoreColor(validation.innovation)}`}>
                    {validation.innovation.toFixed(1)}/10
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Technical Complexity</span>
                  <span className={`text-xl font-bold ${getScoreColor(10 - validation.technicalComplexity)}`}>
                    {validation.technicalComplexity.toFixed(1)}/10
                  </span>
                </div>
                
                <div className="border-t border-gray-600 pt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-white font-semibold">Overall Score</span>
                    <span className={`text-2xl font-bold ${getScoreColor(validation.overallScore)}`}>
                      {validation.overallScore.toFixed(1)}/10
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Analysis */}
          <div className="space-y-6">
            {/* Risks */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <AlertTriangle className="h-6 w-6 text-red-400 mr-3" />
                  Potential Risks
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {validation.risks.map((risk: string, index: number) => (
                    <li key={index} className="flex items-start space-x-3 text-gray-300">
                      <div className="w-2 h-2 bg-red-400 rounded-full mt-2 flex-shrink-0"></div>
                      <span className="text-sm">{risk}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Opportunities */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <TrendingUp className="h-6 w-6 text-green-400 mr-3" />
                  Opportunities
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {validation.opportunities.map((opportunity: string, index: number) => (
                    <li key={index} className="flex items-start space-x-3 text-gray-300">
                      <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
                      <span className="text-sm">{opportunity}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Recommendations */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <CheckCircle className="h-6 w-6 text-blue-400 mr-3" />
                  Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {validation.recommendations.map((rec: string, index: number) => (
                    <li key={index} className="flex items-start space-x-3 text-gray-300">
                      <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                      <span className="text-sm">{rec}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
