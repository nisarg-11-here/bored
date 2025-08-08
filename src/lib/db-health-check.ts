import dbConnect from './mongodb'
import Task from '@/models/Task'

export interface DBHealthStatus {
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

export async function checkDatabaseHealth(): Promise<DBHealthStatus> {
  const status: DBHealthStatus = {
    connection: false,
    read: false,
    write: false,
    delete: false,
    details: {}
  }

  try {
    // Test 1: Database Connection
    console.log('🔍 Testing database connection...')
    const startTime = Date.now()
    await dbConnect()
    const connectionTime = Date.now() - startTime
    status.connection = true
    status.details!.connectionTime = connectionTime
    console.log(`✅ Database connection successful (${connectionTime}ms)`)

    // Test 2: Read Operation
    console.log('🔍 Testing read operation...')
    const readStartTime = Date.now()
    const tasks = await Task.find({}).limit(1)
    const readTime = Date.now() - readStartTime
    status.read = true
    status.details!.readTime = readTime
    console.log(`✅ Read operation successful (${readTime}ms) - Found ${tasks.length} tasks`)

    // Test 3: Write Operation
    console.log('🔍 Testing write operation...')
    const writeStartTime = Date.now()
    const testTask = await Task.create({
      title: 'Health Check Test Task',
      description: 'This task is created during database health check',
      category: 'personal',
      priority: 'low',
      aiGenerated: false
    })
    const writeTime = Date.now() - writeStartTime
    status.write = true
    status.details!.writeTime = writeTime
    console.log(`✅ Write operation successful (${writeTime}ms) - Created task: ${testTask._id}`)

    // Test 4: Delete Operation
    console.log('🔍 Testing delete operation...')
    const deleteStartTime = Date.now()
    await Task.findByIdAndDelete(testTask._id)
    const deleteTime = Date.now() - deleteStartTime
    status.delete = true
    status.details!.deleteTime = deleteTime
    console.log(`✅ Delete operation successful (${deleteTime}ms)`)

    console.log('🎉 All database operations successful!')
    return status

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    status.error = errorMessage
    console.error('❌ Database health check failed:', errorMessage)
    return status
  }
}

export async function getDatabaseStats() {
  try {
    await dbConnect()
    
    const totalTasks = await Task.countDocuments({})
    const completedTasks = await Task.countDocuments({ completed: true })
    const aiGeneratedTasks = await Task.countDocuments({ aiGenerated: true })
    
    const stats = {
      totalTasks,
      completedTasks,
      aiGeneratedTasks,
      completionRate: totalTasks > 0 ? (completedTasks / totalTasks * 100).toFixed(1) : '0',
      aiGeneratedRate: totalTasks > 0 ? (aiGeneratedTasks / totalTasks * 100).toFixed(1) : '0'
    }

    console.log('📊 Database Statistics:')
    console.log(`   Total Tasks: ${stats.totalTasks}`)
    console.log(`   Completed Tasks: ${stats.completedTasks}`)
    console.log(`   AI Generated Tasks: ${stats.aiGeneratedTasks}`)
    console.log(`   Completion Rate: ${stats.completionRate}%`)
    console.log(`   AI Generated Rate: ${stats.aiGeneratedRate}%`)

    return stats
  } catch (error) {
    console.error('❌ Failed to get database stats:', error)
    throw error
  }
}

export async function testConnectionString() {
  const uri = process.env.MONGODB_URI
  
  if (!uri) {
    console.error('❌ MONGODB_URI is not defined in environment variables')
    return false
  }

  console.log('🔍 Testing connection string...')
  console.log(`   URI Format: ${uri.includes('mongodb+srv://') ? 'Atlas' : 'Local'}`)
  console.log(`   URI Length: ${uri.length} characters`)
  
  // Check if URI has required components
  const hasProtocol = uri.startsWith('mongodb://') || uri.startsWith('mongodb+srv://')
  const hasHost = uri.includes('@') || uri.includes('localhost')
  const hasDatabase = uri.includes('/bored') || uri.includes('?')
  
  console.log(`   Has Protocol: ${hasProtocol}`)
  console.log(`   Has Host: ${hasHost}`)
  console.log(`   Has Database: ${hasDatabase}`)
  
  return hasProtocol && hasHost && hasDatabase
}
