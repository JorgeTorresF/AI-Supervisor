import React from 'react'
import { Shield, AlertTriangle, CheckCircle } from 'lucide-react'

export function InterventionCenter() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center space-x-2">
          <Shield className="h-6 w-6 text-red-400" />
          <span>Intervention Center</span>
        </h1>
        <p className="text-gray-400 mt-1">Manage AI agent interventions and corrective actions</p>
      </div>

      <div className="bg-gray-800 border border-gray-700 rounded-lg p-12 text-center">
        <Shield className="h-12 w-12 text-gray-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-white mb-2">Intervention Center</h3>
        <p className="text-gray-400 mb-4">This section will show active interventions and allow manual intervention controls.</p>
        <div className="flex justify-center space-x-4">
          <div className="flex items-center space-x-2 text-green-400">
            <CheckCircle className="h-4 w-4" />
            <span className="text-sm">System Active</span>
          </div>
          <div className="flex items-center space-x-2 text-yellow-400">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm">Ready for Interventions</span>
          </div>
        </div>
      </div>
    </div>
  )
}