import React from 'react'
import { Settings, Sliders } from 'lucide-react'

export function ConfigurationPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center space-x-2">
          <Settings className="h-6 w-6 text-gray-400" />
          <span>Configuration</span>
        </h1>
        <p className="text-gray-400 mt-1">System settings and supervision preferences</p>
      </div>

      <div className="bg-gray-800 border border-gray-700 rounded-lg p-12 text-center">
        <Settings className="h-12 w-12 text-gray-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-white mb-2">System Configuration</h3>
        <p className="text-gray-400 mb-4">Supervision settings and preferences will be configurable here.</p>
        <div className="flex justify-center">
          <div className="flex items-center space-x-2 text-gray-400">
            <Sliders className="h-4 w-4" />
            <span className="text-sm">Settings Panel</span>
          </div>
        </div>
      </div>
    </div>
  )
}