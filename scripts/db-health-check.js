const mongoose = require('mongoose')

// Database connection function
async function dbConnect() {
  const MONGODB_URI = process.env.MONGODB_URI

  console.log('🔍 [DEBUG] Starting database connection...')
  console.log('🔍 [DEBUG] Environment check:')
  console.log(`   - MONGODB_URI exists: ${!!process.env.MONGODB_URI}`)
  console.log(`   - URI length: ${process.env.MONGODB_URI?.length || 0}`)
  console.log(`   - URI format: ${process.env.MONGODB_URI?.includes('mongodb+srv://') ? 'Atlas' : 'Local'}`)
  
  if (!MONGODB_URI) {
    console.error('❌ [DEBUG] MONGODB_URI is not defined')
    throw new Error('Please define the MONGODB_URI environment variable')
  }

  // Log connection string (masked for security)
  const maskedUri = MONGODB_URI.replace(/:([^@]+)@/, ':****@')
  console.log(`🔍 [DEBUG] Connection string: ${maskedUri}`)

  const opts = {
    bufferCommands: false,
  }

  console.log('🔍 [DEBUG] Connection options:', JSON.stringify(opts, null, 2))
  console.log('🔍 [DEBUG] Attempting to connect to MongoDB...')

  try {
    const connection = await mongoose.connect(MONGODB_URI, opts)
    console.log('✅ [DEBUG] MongoDB connection established successfully')
    console.log('🔍 [DEBUG] Connection details:')
    console.log(`   - Database: ${connection.connection.db?.databaseName || 'unknown'}`)
    console.log(`   - Host: ${connection.connection.host || 'unknown'}`)
    console.log(`   - Port: ${connection.connection.port || 'unknown'}`)
    console.log(`   - Ready state: ${connection.connection.readyState}`)
    return connection.connection
  } catch (error) {
    console.error('❌ [DEBUG] MongoDB connection failed:')
    console.error(`   - Error type: ${error.constructor.name}`)
    console.error(`   - Error message: ${error.message}`)
    console.error(`   - Error code: ${error.code || 'N/A'}`)
    console.error(`   - Error name: ${error.name || 'N/A'}`)
    console.error(`   - Full error:`, error)
    throw error
  }
}

// Simple Task model for testing
const TaskSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  category: { type: String, required: true, default: 'personal' },
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  completed: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  completedAt: { type: Date },
  aiGenerated: { type: Boolean, default: false },
})

const Task = mongoose.models.Task || mongoose.model('Task', TaskSchema)

// Health check functions
async function checkDatabaseHealth() {
  const status = {
    connection: false,
    read: false,
    write: false,
    delete: false,
    error: null,
    details: {}
  }

  try {
    // Test 1: Database Connection
    console.log('🔍 Testing database connection...')
    const startTime = Date.now()
    await dbConnect()
    const connectionTime = Date.now() - startTime
    status.connection = true
    status.details.connectionTime = connectionTime
    console.log(`✅ Database connection successful (${connectionTime}ms)`)

    // Test 2: Read Operation
    console.log('🔍 Testing read operation...')
    console.log('🔍 [DEBUG] Attempting to find tasks...')
    const readStartTime = Date.now()
    const tasks = await Task.find({}).sort({ createdAt: -1 }).limit(1)
    const readTime = Date.now() - readStartTime
    status.read = true
    status.details.readTime = readTime
    console.log(`✅ Read operation successful (${readTime}ms) - Found ${tasks.length} tasks`)
    console.log('🔍 [DEBUG] Read operation details:')
    console.log(`   - Query: find({}).sort({createdAt: -1}).limit(1)`)
    console.log(`   - Result count: ${tasks.length}`)
    if (tasks.length > 0) {
      console.log(`   - First task ID: ${tasks[0]._id}`)
      console.log(`   - First task title: ${tasks[0].title}`)
    }

    // Test 3: Write Operation
    console.log('🔍 Testing write operation...')
    console.log('🔍 [DEBUG] Attempting to create test task...')
    const writeStartTime = Date.now()
    const testTaskData = {
      title: 'Health Check Test Task',
      description: 'This task is created during database health check',
      category: 'personal',
      priority: 'low',
      aiGenerated: false
    }
    console.log('🔍 [DEBUG] Test task data:', JSON.stringify(testTaskData, null, 2))
    
    const testTask = await Task.create(testTaskData)
    const writeTime = Date.now() - writeStartTime
    status.write = true
    status.details.writeTime = writeTime
    console.log(`✅ Write operation successful (${writeTime}ms) - Created task: ${testTask._id}`)
    console.log('🔍 [DEBUG] Created task details:')
    console.log(`   - Task ID: ${testTask._id}`)
    console.log(`   - Task title: ${testTask.title}`)
    console.log(`   - Task category: ${testTask.category}`)
    console.log(`   - Created at: ${testTask.createdAt}`)

    // Test 4: Delete Operation
    console.log('🔍 Testing delete operation...')
    console.log('🔍 [DEBUG] Attempting to delete test task...')
    const deleteStartTime = Date.now()
    const deleteResult = await Task.findByIdAndDelete(testTask._id)
    const deleteTime = Date.now() - deleteStartTime
    status.delete = true
    status.details.deleteTime = deleteTime
    console.log(`✅ Delete operation successful (${deleteTime}ms)`)
    console.log('🔍 [DEBUG] Delete operation details:')
    console.log(`   - Deleted task ID: ${testTask._id}`)
    console.log(`   - Delete result: ${deleteResult ? 'Success' : 'Not found'}`)

    console.log('🎉 All database operations successful!')
    return status

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    status.error = errorMessage
    console.error('❌ Database health check failed:', errorMessage)
    console.error('🔍 [DEBUG] Full error details:')
    console.error(`   - Error type: ${error.constructor.name}`)
    console.error(`   - Error message: ${error.message}`)
    console.error(`   - Error code: ${error.code || 'N/A'}`)
    console.error(`   - Error name: ${error.name || 'N/A'}`)
    console.error(`   - Error stack:`, error.stack)
    return status
  }
}

async function getDatabaseStats() {
  try {
    console.log('🔍 [DEBUG] Getting database statistics...')
    await dbConnect()
    
    console.log('🔍 [DEBUG] Counting total tasks...')
    const totalTasks = await Task.countDocuments({})
    console.log(`   - Total tasks: ${totalTasks}`)
    
    console.log('🔍 [DEBUG] Counting completed tasks...')
    const completedTasks = await Task.countDocuments({ completed: true })
    console.log(`   - Completed tasks: ${completedTasks}`)
    
    console.log('🔍 [DEBUG] Counting AI generated tasks...')
    const aiGeneratedTasks = await Task.countDocuments({ aiGenerated: true })
    console.log(`   - AI generated tasks: ${aiGeneratedTasks}`)
    
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
    console.error('🔍 [DEBUG] Stats error details:')
    console.error(`   - Error type: ${error.constructor.name}`)
    console.error(`   - Error message: ${error.message}`)
    console.error(`   - Error code: ${error.code || 'N/A'}`)
    throw error
  }
}

async function testConnectionString() {
  const uri = process.env.MONGODB_URI
  
  console.log('🔍 [DEBUG] Testing connection string...')
  console.log(`   - URI exists: ${!!uri}`)
  
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
  
  // Additional detailed checks
  console.log('🔍 [DEBUG] Connection string analysis:')
  console.log(`   - Starts with mongodb://: ${uri.startsWith('mongodb://')}`)
  console.log(`   - Starts with mongodb+srv://: ${uri.startsWith('mongodb+srv://')}`)
  console.log(`   - Contains @ symbol: ${uri.includes('@')}`)
  console.log(`   - Contains localhost: ${uri.includes('localhost')}`)
  console.log(`   - Contains /bored: ${uri.includes('/bored')}`)
  console.log(`   - Contains ? symbol: ${uri.includes('?')}`)
  
  // Check for common issues
  if (!hasProtocol) {
    console.error('❌ [DEBUG] Missing protocol (should start with mongodb:// or mongodb+srv://)')
  }
  if (!hasHost) {
    console.error('❌ [DEBUG] Missing host information')
  }
  if (!hasDatabase) {
    console.error('❌ [DEBUG] Missing database name or query parameters')
  }
  
  return hasProtocol && hasHost && hasDatabase
}

module.exports = {
  checkDatabaseHealth,
  getDatabaseStats,
  testConnectionString
}
