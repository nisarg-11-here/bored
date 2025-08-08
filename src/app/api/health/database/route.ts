import { NextRequest, NextResponse } from 'next/server'
import { checkDatabaseHealth, getDatabaseStats, testConnectionString } from '@/lib/db-health-check'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const includeStats = searchParams.get('stats') === 'true'
    const testConnection = searchParams.get('test') === 'true'

    const healthStatus = await checkDatabaseHealth()
    
    let response: any = {
      status: 'success',
      timestamp: new Date().toISOString(),
      database: healthStatus
    }

    // Test connection string if requested
    if (testConnection) {
      const connectionStringValid = await testConnectionString()
      response.connectionString = {
        valid: connectionStringValid,
        uri: process.env.MONGODB_URI ? '***configured***' : 'not configured'
      }
    }

    // Include database stats if requested
    if (includeStats && healthStatus.connection) {
      try {
        const stats = await getDatabaseStats()
        response.stats = stats
      } catch (error) {
        response.stats = { error: 'Failed to get stats' }
      }
    }

    // Determine overall status
    const allOperationsWorking = healthStatus.connection && 
                               healthStatus.read && 
                               healthStatus.write && 
                               healthStatus.delete

    if (allOperationsWorking) {
      return NextResponse.json(response, { status: 200 })
    } else {
      return NextResponse.json(response, { status: 503 })
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: errorMessage,
      database: {
        connection: false,
        read: false,
        write: false,
        delete: false,
        error: errorMessage
      }
    }, { status: 500 })
  }
}
