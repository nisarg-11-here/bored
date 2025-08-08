# Database Connection Debug Guide

## 🔍 Overview

This guide provides multiple ways to check if your MongoDB database connection is established correctly and verify that database operations are working properly.

## 🛠️ Tools Available

### 1. **CLI Health Check Script**
```bash
npm run db:health
```

### 2. **API Health Endpoint**
```bash
# Basic health check
curl http://localhost:3000/api/health/database

# With database statistics
curl http://localhost:3000/api/health/database?stats=true

# With connection string validation
curl http://localhost:3000/api/health/database?test=true
```

### 3. **Web Debug Interface**
Visit: `http://localhost:3000/debug`

### 4. **Direct API Testing**
```bash
# Test all endpoints
curl -X GET http://localhost:3000/api/tasks
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Task","category":"personal"}'
```

## 📋 Step-by-Step Debugging

### Step 1: Check Environment Variables
```bash
# Verify your .env.local file exists and has the correct values
cat .env.local

# Should contain:
# MONGODB_URI=your_mongodb_atlas_connection_string_here
# OPENAI_API_KEY=your_openai_api_key_here
```

### Step 2: Test Connection String Format
```bash
npm run db:health
```

**Expected Output:**
```
🔍 MongoDB Database Health Check
================================

1. Testing Connection String...
   Result: ✅ Valid

2. Testing Database Operations...
🔍 Testing database connection...
✅ Database connection successful (150ms)
🔍 Testing read operation...
✅ Read operation successful (25ms) - Found 0 tasks
🔍 Testing write operation...
✅ Write operation successful (45ms) - Created task: 507f1f77bcf86cd799439011
🔍 Testing delete operation...
✅ Delete operation successful (30ms)
🎉 All database operations successful!

📊 Health Check Results:
   Connection: ✅
   Read: ✅
   Write: ✅
   Delete: ✅

⏱️  Performance:
   Connection Time: 150ms
   Read Time: 25ms
   Write Time: 45ms
   Delete Time: 30ms

3. Getting Database Statistics...
✅ Database stats retrieved successfully

🎯 Overall Status:
✅ Database is healthy and all operations are working!
```

### Step 3: Check via Web Interface
1. Start your development server: `npm run dev`
2. Visit: `http://localhost:3000/debug`
3. Click "Check Health" or "Check with Stats"

### Step 4: Test API Endpoints Directly
```bash
# Test the health endpoint
curl -s http://localhost:3000/api/health/database | jq .

# Test task creation
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Task",
    "description": "Testing database connection",
    "category": "personal",
    "priority": "medium"
  }'

# Test task retrieval
curl -s http://localhost:3000/api/tasks | jq .
```

## 🔧 Troubleshooting Common Issues

### Issue 1: "MONGODB_URI is not defined"
**Solution:**
```bash
# Check if .env.local exists
ls -la .env.local

# Create or update .env.local
echo "MONGODB_URI=your_actual_connection_string" > .env.local
echo "OPENAI_API_KEY=your_actual_api_key" >> .env.local
```

### Issue 2: "Connection failed" or "Authentication failed"
**Solutions:**
1. **Check MongoDB Atlas:**
   - Verify your cluster is running
   - Check IP whitelist (add `0.0.0.0/0` for testing)
   - Verify username/password in connection string

2. **Test connection string:**
   ```bash
   # Try connecting with mongosh (if installed)
   mongosh "your_connection_string"
   ```

3. **Check connection string format:**
   ```
   mongodb+srv://username:password@cluster.mongodb.net/bored?retryWrites=true&w=majority
   ```

### Issue 3: "Database operations failed"
**Solutions:**
1. **Check database permissions:**
   - Ensure your MongoDB user has read/write permissions
   - Verify the database name is correct

2. **Check network connectivity:**
   ```bash
   # Test if you can reach MongoDB Atlas
   ping cluster.mongodb.net
   ```

3. **Check firewall/network:**
   - Ensure port 27017 is not blocked
   - Check if you're behind a corporate firewall

### Issue 4: "Task model not found"
**Solution:**
```bash
# Restart the development server
npm run dev
```

## 📊 Understanding the Results

### Health Check Response
```json
{
  "status": "success",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "database": {
    "connection": true,
    "read": true,
    "write": true,
    "delete": true,
    "details": {
      "connectionTime": 150,
      "readTime": 25,
      "writeTime": 45,
      "deleteTime": 30
    }
  },
  "stats": {
    "totalTasks": 5,
    "completedTasks": 2,
    "aiGeneratedTasks": 1,
    "completionRate": "40.0",
    "aiGeneratedRate": "20.0"
  }
}
```

### Performance Benchmarks
- **Connection Time**: < 500ms (good), < 1000ms (acceptable), > 1000ms (slow)
- **Read Time**: < 100ms (good), < 250ms (acceptable), > 250ms (slow)
- **Write Time**: < 200ms (good), < 500ms (acceptable), > 500ms (slow)
- **Delete Time**: < 100ms (good), < 250ms (acceptable), > 250ms (slow)

## 🚀 Advanced Debugging

### 1. **Enable MongoDB Debug Logging**
```typescript
// Add to your .env.local
DEBUG=mongoose:*
```

### 2. **Test with MongoDB Compass**
1. Download MongoDB Compass
2. Connect using your connection string
3. Browse your database and collections

### 3. **Monitor Database Operations**
```bash
# Watch for database operations in real-time
npm run dev
# Then check browser console for any errors
```

### 4. **Test Individual Operations**
```bash
# Test connection only
curl -s "http://localhost:3000/api/health/database?test=true" | jq .

# Test with stats
curl -s "http://localhost:3000/api/health/database?stats=true" | jq .
```

## 🔍 What Each Test Checks

### Connection Test
- ✅ Validates connection string format
- ✅ Establishes connection to MongoDB
- ✅ Measures connection time
- ✅ Verifies authentication

### Read Test
- ✅ Performs a simple query
- ✅ Measures query performance
- ✅ Verifies database access permissions

### Write Test
- ✅ Creates a test task
- ✅ Measures write performance
- ✅ Verifies write permissions
- ✅ Tests schema validation

### Delete Test
- ✅ Deletes the test task
- ✅ Measures delete performance
- ✅ Verifies delete permissions
- ✅ Cleans up test data

### Statistics Test
- ✅ Counts total tasks
- ✅ Counts completed tasks
- ✅ Counts AI-generated tasks
- ✅ Calculates completion rates

## 📈 Performance Monitoring

### Good Performance Indicators
- Connection time < 500ms
- Read operations < 100ms
- Write operations < 200ms
- Delete operations < 100ms
- No timeout errors
- No authentication errors

### Warning Signs
- Connection time > 1000ms
- Operation time > 500ms
- Frequent timeouts
- Authentication errors
- Network errors

## 🛡️ Security Considerations

### Environment Variables
- ✅ Never commit `.env.local` to version control
- ✅ Use strong passwords for MongoDB users
- ✅ Restrict IP access in MongoDB Atlas
- ✅ Use connection string with proper authentication

### Network Security
- ✅ Use HTTPS in production
- ✅ Whitelist only necessary IPs
- ✅ Monitor connection logs
- ✅ Use MongoDB Atlas security features

## 📞 Getting Help

If you're still having issues:

1. **Check the logs:**
   ```bash
   npm run dev
   # Look for error messages in the terminal
   ```

2. **Verify MongoDB Atlas:**
   - Check cluster status
   - Verify user permissions
   - Check IP whitelist

3. **Test with minimal setup:**
   ```bash
   # Create a simple test
   node -e "
   require('dotenv').config({path: '.env.local'});
   console.log('MONGODB_URI:', process.env.MONGODB_URI ? 'Set' : 'Not set');
   "
   ```

4. **Common MongoDB Atlas Issues:**
   - Cluster paused (free tier)
   - IP not whitelisted
   - Wrong username/password
   - Network connectivity issues

This comprehensive debugging guide should help you identify and resolve any database connection issues with your Bored app!
