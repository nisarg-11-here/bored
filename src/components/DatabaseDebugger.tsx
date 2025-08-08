'use client'

import { useState } from 'react'
import { CheckCircle, XCircle, Clock, Database, Activity } from 'lucide-react'

interface HealthStatus {
  status: string
  timestamp: string
  database: {
    connection: boolean
    read: boolean
    write: boolean
    delete: boolean
    error?: string
    details?: {
      connectionTime?: number
      readTime?: number
      writeTime?: number
      deleteTime?: number
    }
  }
  stats?: {
    totalTasks: number
    completedTasks: number
    aiGeneratedTasks: number
    completionRate: string
    aiGeneratedRate: string
  }
}

export default function DatabaseDebugger() {
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const checkHealth = async (includeStats = false) => {
    setLoading(true)
    setError(null)
    
    try {
      const params = new URLSearchParams()
      if (includeStats) params.append('stats', 'true')
      params.append('test', 'true')
      
      const response = await fetch(`/api/health/database?${params}`)
      const data = await response.json()
      
      if (response.ok) {
        setHealthStatus(data)
      } else {
        setError(data.error || 'Failed to check database health')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error')
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: boolean) => {
    return status ? (
      <CheckCircle className="w-5 h-5 text-green-500" />
    ) : (
      <XCircle className="w-5 h-5 text-red-500" />
    )
  }

  const getStatusText = (status: boolean) => {
    return status ? 'Working' : 'Failed'
  }

  return (
    <div className="bg-white rounded-lg p-6 shadow-lg max-w-2xl mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <Database className="w-6 h-6 text-blue-500" />
        <h2 className="text-xl font-semibold">Database Health Check</h2>
      </div>

      <div className="space-y-4">
        <div className="flex gap-2">
          <button
            onClick={() => checkHealth(false)}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
          >
            <Activity className="w-4 h-4" />
            {loading ? 'Checking...' : 'Check Health'}
          </button>
          
          <button
            onClick={() => checkHealth(true)}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50"
          >
            <Database className="w-4 h-4" />
            {loading ? 'Checking...' : 'Check with Stats'}
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-500" />
              <span className="text-red-700 font-medium">Error</span>
            </div>
            <p className="text-red-600 mt-1">{error}</p>
          </div>
        )}

        {healthStatus && (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-md p-4">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-5 h-5 text-gray-500" />
                <span className="font-medium">Last Check</span>
              </div>
              <p className="text-sm text-gray-600">
                {new Date(healthStatus.timestamp).toLocaleString()}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 rounded-md p-4">
                <div className="flex items-center gap-2 mb-2">
                  {getStatusIcon(healthStatus.database.connection)}
                  <span className="font-medium">Connection</span>
                </div>
                <p className="text-sm text-gray-600">
                  {getStatusText(healthStatus.database.connection)}
                </p>
                {healthStatus.database.details?.connectionTime && (
                  <p className="text-xs text-gray-500 mt-1">
                    {healthStatus.database.details.connectionTime}ms
                  </p>
                )}
              </div>

              <div className="bg-green-50 rounded-md p-4">
                <div className="flex items-center gap-2 mb-2">
                  {getStatusIcon(healthStatus.database.read)}
                  <span className="font-medium">Read</span>
                </div>
                <p className="text-sm text-gray-600">
                  {getStatusText(healthStatus.database.read)}
                </p>
                {healthStatus.database.details?.readTime && (
                  <p className="text-xs text-gray-500 mt-1">
                    {healthStatus.database.details.readTime}ms
                  </p>
                )}
              </div>

              <div className="bg-yellow-50 rounded-md p-4">
                <div className="flex items-center gap-2 mb-2">
                  {getStatusIcon(healthStatus.database.write)}
                  <span className="font-medium">Write</span>
                </div>
                <p className="text-sm text-gray-600">
                  {getStatusText(healthStatus.database.write)}
                </p>
                {healthStatus.database.details?.writeTime && (
                  <p className="text-xs text-gray-500 mt-1">
                    {healthStatus.database.details.writeTime}ms
                  </p>
                )}
              </div>

              <div className="bg-red-50 rounded-md p-4">
                <div className="flex items-center gap-2 mb-2">
                  {getStatusIcon(healthStatus.database.delete)}
                  <span className="font-medium">Delete</span>
                </div>
                <p className="text-sm text-gray-600">
                  {getStatusText(healthStatus.database.delete)}
                </p>
                {healthStatus.database.details?.deleteTime && (
                  <p className="text-xs text-gray-500 mt-1">
                    {healthStatus.database.details.deleteTime}ms
                  </p>
                )}
              </div>
            </div>

            {healthStatus.database.error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <div className="flex items-center gap-2 mb-2">
                  <XCircle className="w-5 h-5 text-red-500" />
                  <span className="font-medium text-red-700">Database Error</span>
                </div>
                <p className="text-red-600 text-sm">{healthStatus.database.error}</p>
              </div>
            )}

            {healthStatus.stats && (
              <div className="bg-purple-50 rounded-md p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Database className="w-5 h-5 text-purple-500" />
                  <span className="font-medium">Database Statistics</span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Total Tasks</p>
                    <p className="font-semibold">{healthStatus.stats.totalTasks}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Completed Tasks</p>
                    <p className="font-semibold">{healthStatus.stats.completedTasks}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">AI Generated Tasks</p>
                    <p className="font-semibold">{healthStatus.stats.aiGeneratedTasks}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Completion Rate</p>
                    <p className="font-semibold">{healthStatus.stats.completionRate}%</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
