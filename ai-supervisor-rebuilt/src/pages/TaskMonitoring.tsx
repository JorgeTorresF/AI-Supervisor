import React from 'react'
import { Activity } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'

export function TaskMonitoring() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center">
            <Activity className="h-8 w-8 text-blue-400 mr-3" />
            Task Monitoring
          </h1>
          <p className="text-gray-400 mt-1">Real-time task tracking and performance monitoring</p>
        </div>
      </div>

      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Task Monitoring Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-400">Task monitoring features will be displayed here.</p>
        </CardContent>
      </Card>
    </div>
  )
}
