import mongoose from 'mongoose';

interface Cached {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

let cached: Cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  const MONGODB_URI = process.env.MONGODB_URI;

  if (!MONGODB_URI) {
    throw new Error('Please define the MONGODB_URI environment variable')
  }

  console.log('🔍 [DEBUG] Starting database connection...')
  console.log('🔍 [DEBUG] Environment check:')
  console.log(`   - MONGODB_URI exists: ${!!process.env.MONGODB_URI}`)
  console.log(`   - URI length: ${process.env.MONGODB_URI?.length || 0}`)
  console.log(`   - URI format: ${process.env.MONGODB_URI?.includes('mongodb+srv://') ? 'Atlas' : 'Local'}`)
  
  if (cached.conn) {
    console.log('✅ [DEBUG] Using cached connection')
    return cached.conn;
  }

  if (!cached.promise) {
    console.log('🔍 [DEBUG] Creating new connection promise...')
    const opts = {
      bufferCommands: false,
    };

    console.log('🔍 [DEBUG] Connection options:', JSON.stringify(opts, null, 2))
    console.log('🔍 [DEBUG] Attempting to connect to MongoDB...')

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      console.log('✅ [DEBUG] MongoDB connection established successfully')
      console.log('🔍 [DEBUG] Connection details:')
      console.log(`   - Database: ${mongoose.connection.db?.databaseName || 'unknown'}`)
      console.log(`   - Host: ${mongoose.connection.host || 'unknown'}`)
      console.log(`   - Port: ${mongoose.connection.port || 'unknown'}`)
      console.log(`   - Ready state: ${mongoose.connection.readyState}`)
      return mongoose;
    }).catch((error) => {
      console.error('❌ [DEBUG] MongoDB connection failed:')
      console.error(`   - Error type: ${error.constructor.name}`)
      console.error(`   - Error message: ${error.message}`)
      console.error(`   - Error code: ${error.code || 'N/A'}`)
      console.error(`   - Full error:`, error)
      throw error;
    });
  }

  try {
    console.log('🔍 [DEBUG] Waiting for connection promise...')
    cached.conn = await cached.promise;
    console.log('✅ [DEBUG] Connection promise resolved successfully')
    return cached.conn;
  } catch (e) {
    console.error('❌ [DEBUG] Connection promise failed:')
    console.error(`   - Error: ${e}`)
    cached.promise = null;
    throw e;
  }
}

export default dbConnect;
