import React from 'react'
import { BarChart3, TrendingUp } from 'lucide-react'

export function AnalyticsPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center space-x-2">
          <BarChart3 className="h-6 w-6 text-blue-400" />
          <span>Analytics</span>
        </h1>
        <p className="text-gray-400 mt-1">Performance insights and supervision analytics</p>
      </div>

      <div className="bg-gray-800 border border-gray-700 rounded-lg p-12 text-center">
        <BarChart3 className="h-12 w-12 text-gray-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-white mb-2">Advanced Analytics</h3>
        <p className="text-gray-400 mb-4">Detailed performance metrics and trend analysis will be available here.</p>
        <div className="flex justify-center">
          <div className="flex items-center space-x-2 text-blue-400">
            <TrendingUp className="h-4 w-4" />
            <span className="text-sm">Coming Soon</span>
          </div>
        </div>
      </div>
    </div>
  )
}