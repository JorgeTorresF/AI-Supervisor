import React from 'react'
import { BarChart3 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'

export function AnalyticsPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center">
            <BarChart3 className="h-8 w-8 text-cyan-400 mr-3" />
            Analytics
          </h1>
          <p className="text-gray-400 mt-1">Performance analytics and insights</p>
        </div>
      </div>

      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Analytics Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-400">Analytics and reporting features will be displayed here.</p>
        </CardContent>
      </Card>
    </div>
  )
}
