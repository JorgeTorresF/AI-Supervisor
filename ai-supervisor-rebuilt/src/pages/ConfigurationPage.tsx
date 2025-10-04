import React from 'react'
import { Settings } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'

export function ConfigurationPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center">
            <Settings className="h-8 w-8 text-orange-400 mr-3" />
            Configuration
          </h1>
          <p className="text-gray-400 mt-1">System configuration and settings</p>
        </div>
      </div>

      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">System Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-400">Configuration options will be displayed here.</p>
        </CardContent>
      </Card>
    </div>
  )
}
