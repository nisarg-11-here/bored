#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' })

console.log('🔍 Environment Debug Script')
console.log('============================')
console.log('')

// Check if .env.local exists
const fs = require('fs')
const path = require('path')

const envPath = path.join(__dirname, '..', '.env.local')
console.log('1. Checking .env.local file:')
console.log(`   - File exists: ${fs.existsSync(envPath)}`)
console.log(`   - File path: ${envPath}`)

if (fs.existsSync(envPath)) {
  const stats = fs.statSync(envPath)
  console.log(`   - File size: ${stats.size} bytes`)
  console.log(`   - Last modified: ${stats.mtime}`)
}

console.log('')

// Check environment variables
console.log('2. Environment Variables:')
console.log(`   - MONGODB_URI exists: ${!!process.env.MONGODB_URI}`)
console.log(`   - OPENAI_API_KEY exists: ${!!process.env.OPENAI_API_KEY}`)

if (process.env.MONGODB_URI) {
  const uri = process.env.MONGODB_URI
  console.log(`   - MONGODB_URI length: ${uri.length}`)
  console.log(`   - MONGODB_URI format: ${uri.includes('mongodb+srv://') ? 'Atlas' : 'Local'}`)
  
  // Mask the password for security
  const maskedUri = uri.replace(/:([^@]+)@/, ':****@')
  console.log(`   - MONGODB_URI (masked): ${maskedUri}`)
  
  // Parse the URI components
  try {
    const url = new URL(uri)
    console.log('   - URI Components:')
    console.log(`     - Protocol: ${url.protocol}`)
    console.log(`     - Hostname: ${url.hostname}`)
    console.log(`     - Port: ${url.port || 'default'}`)
    console.log(`     - Username: ${url.username}`)
    console.log(`     - Password: ${url.password ? '****' : 'none'}`)
    console.log(`     - Pathname: ${url.pathname}`)
    console.log(`     - Search params: ${url.search}`)
  } catch (error) {
    console.log(`   - URI parsing failed: ${error.message}`)
  }
} else {
  console.log('   - MONGODB_URI is not set')
}

console.log('')

// Check for common issues
console.log('3. Common Issues Check:')
const issues = []

if (!process.env.MONGODB_URI) {
  issues.push('MONGODB_URI is not defined')
}

if (process.env.MONGODB_URI) {
  const uri = process.env.MONGODB_URI
  
  if (!uri.startsWith('mongodb://') && !uri.startsWith('mongodb+srv://')) {
    issues.push('MONGODB_URI does not start with mongodb:// or mongodb+srv://')
  }
  
  if (!uri.includes('@')) {
    issues.push('MONGODB_URI does not contain authentication (@ symbol)')
  }
  
  if (uri.includes('<db_password>')) {
    issues.push('MONGODB_URI contains placeholder <db_password> instead of actual password')
  }
  
  if (!uri.includes('mongodb.net')) {
    issues.push('MONGODB_URI does not contain mongodb.net (Atlas domain)')
  }
}

if (issues.length === 0) {
  console.log('   ✅ No obvious issues found')
} else {
  console.log('   ❌ Issues found:')
  issues.forEach(issue => console.log(`     - ${issue}`))
}

console.log('')

// Test basic connection string format
console.log('4. Connection String Validation:')
if (process.env.MONGODB_URI) {
  const uri = process.env.MONGODB_URI
  const hasProtocol = uri.startsWith('mongodb://') || uri.startsWith('mongodb+srv://')
  const hasAuth = uri.includes('@')
  const hasHost = uri.includes('mongodb.net')
  const hasParams = uri.includes('?')
  
  console.log(`   - Has protocol: ${hasProtocol}`)
  console.log(`   - Has authentication: ${hasAuth}`)
  console.log(`   - Has host: ${hasHost}`)
  console.log(`   - Has parameters: ${hasParams}`)
  
  const isValid = hasProtocol && hasAuth && hasHost
  console.log(`   - Overall valid: ${isValid}`)
} else {
  console.log('   - Cannot validate: MONGODB_URI not set')
}

console.log('')
console.log('�� Debug complete!')
