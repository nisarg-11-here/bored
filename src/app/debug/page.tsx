import DatabaseDebugger from '@/components/DatabaseDebugger'

export default function DebugPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Database Debug</h1>
          <p className="text-gray-600">Check your MongoDB connection and database operations</p>
        </div>
        
        <DatabaseDebugger />
        
        <div className="mt-8 bg-white rounded-lg p-6 shadow-lg max-w-2xl mx-auto">
          <h2 className="text-xl font-semibold mb-4">How to Use</h2>
          <div className="space-y-3 text-sm text-gray-600">
            <p><strong>Check Health:</strong> Tests basic database operations (connection, read, write, delete)</p>
            <p><strong>Check with Stats:</strong> Includes database statistics and task counts</p>
            <p><strong>CLI Command:</strong> Run <code className="bg-gray-100 px-2 py-1 rounded">npm run db:health</code> in terminal</p>
            <p><strong>API Endpoint:</strong> Visit <code className="bg-gray-100 px-2 py-1 rounded">/api/health/database</code> directly</p>
          </div>
        </div>
      </div>
    </div>
  )
}
