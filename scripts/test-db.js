#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' })

const { checkDatabaseHealth, getDatabaseStats, testConnectionString } = require('./db-health-check')

async function main() {
  console.log('🔍 MongoDB Database Health Check')
  console.log('================================')
  console.log('')

  // Test 1: Connection String
  console.log('1. Testing Connection String...')
  const connectionStringValid = await testConnectionString()
  console.log(`   Result: ${connectionStringValid ? '✅ Valid' : '❌ Invalid'}`)
  console.log('')

  if (!connectionStringValid) {
    console.log('❌ Connection string is invalid. Please check your MONGODB_URI in .env.local')
    process.exit(1)
  }

  // Test 2: Database Health
  console.log('2. Testing Database Operations...')
  const healthStatus = await checkDatabaseHealth()
  
  console.log('')
  console.log('📊 Health Check Results:')
  console.log(`   Connection: ${healthStatus.connection ? '✅' : '❌'}`)
  console.log(`   Read: ${healthStatus.read ? '✅' : '❌'}`)
  console.log(`   Write: ${healthStatus.write ? '✅' : '❌'}`)
  console.log(`   Delete: ${healthStatus.delete ? '✅' : '❌'}`)
  
  if (healthStatus.error) {
    console.log(`   Error: ${healthStatus.error}`)
  }

  if (healthStatus.details) {
    console.log('')
    console.log('⏱️  Performance:')
    console.log(`   Connection Time: ${healthStatus.details.connectionTime || 'N/A'}ms`)
    console.log(`   Read Time: ${healthStatus.details.readTime || 'N/A'}ms`)
    console.log(`   Write Time: ${healthStatus.details.writeTime || 'N/A'}ms`)
    console.log(`   Delete Time: ${healthStatus.details.deleteTime || 'N/A'}ms`)
  }

  // Test 3: Database Stats
  if (healthStatus.connection) {
    console.log('')
    console.log('3. Getting Database Statistics...')
    try {
      const stats = await getDatabaseStats()
      console.log('✅ Database stats retrieved successfully')
    } catch (error) {
      console.log('❌ Failed to get database stats:', error.message)
    }
  }

  // Overall result
  const allWorking = healthStatus.connection && healthStatus.read && healthStatus.write && healthStatus.delete
  
  console.log('')
  console.log('🎯 Overall Status:')
  if (allWorking) {
    console.log('✅ Database is healthy and all operations are working!')
    process.exit(0)
  } else {
    console.log('❌ Database has issues. Please check your configuration.')
    process.exit(1)
  }
}

// Handle errors
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled error:', error)
  process.exit(1)
})

// Run the health check
main().catch((error) => {
  console.error('❌ Health check failed:', error)
  process.exit(1)
})
