import React from 'react'
import { Shield } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'

export function InterventionCenter() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center">
            <Shield className="h-8 w-8 text-yellow-400 mr-3" />
            Intervention Center
          </h1>
          <p className="text-gray-400 mt-1">AI agent intervention and recovery management</p>
        </div>
      </div>

      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Intervention Center</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-400">Intervention management features will be displayed here.</p>
        </CardContent>
      </Card>
    </div>
  )
}
