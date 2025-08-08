import mongoose from 'mongoose'

// Mock mongoose
jest.mock('mongoose', () => ({
  connect: jest.fn(),
}))

describe('MongoDB Connection', () => {
  let dbConnect: any
  let mockConnect: jest.MockedFunction<typeof mongoose.connect>

  beforeEach(() => {
    jest.clearAllMocks()
    mockConnect = mongoose.connect as jest.MockedFunction<typeof mongoose.connect>
    
    // Reset global mongoose cache
    ;(global as any).mongoose = undefined
  })

  afterEach(() => {
    jest.resetModules()
  })

  describe('dbConnect function', () => {
    it('should connect to MongoDB successfully', async () => {
      const mockConnection = { readyState: 1 }
      mockConnect.mockResolvedValueOnce(mockConnection as any)
      
      // Dynamically import after mocking
      const { default: dbConnect } = await import('../mongodb')
      
      const result = await dbConnect()
      
      expect(mockConnect).toHaveBeenCalledWith(
        process.env.MONGODB_URI,
        { bufferCommands: false }
      )
      expect(result).toBe(mockConnection)
    })

    it('should reuse existing connection if available', async () => {
      const mockConnection = { readyState: 1 }
      ;(global as any).mongoose = {
        conn: mockConnection,
        promise: Promise.resolve(mockConnection),
      }
      
      const { default: dbConnect } = await import('../mongodb')
      
      const result = await dbConnect()
      
      expect(mockConnect).not.toHaveBeenCalled()
      expect(result).toBe(mockConnection)
    })

    it('should reuse existing promise if available', async () => {
      const mockConnection = { readyState: 1 }
      const mockPromise = Promise.resolve(mockConnection)
      ;(global as any).mongoose = {
        conn: null,
        promise: mockPromise,
      }
      
      const { default: dbConnect } = await import('../mongodb')
      
      const result = await dbConnect()
      
      expect(mockConnect).not.toHaveBeenCalled()
      expect(result).toBe(mockConnection)
    })

    it('should handle connection errors', async () => {
      const connectionError = new Error('Connection failed')
      mockConnect.mockRejectedValueOnce(connectionError)
      
      const { default: dbConnect } = await import('../mongodb')
      
      await expect(dbConnect()).rejects.toThrow('Connection failed')
      
      // Verify that the promise is reset on error
      expect((global as any).mongoose.promise).toBeNull()
    })

    it('should throw error if MONGODB_URI is not defined', async () => {
      const originalUri = process.env.MONGODB_URI
      delete process.env.MONGODB_URI
      
      await expect(async () => {
        const { default: dbConnect } = await import('../mongodb')
        await dbConnect()
      }).rejects.toThrow('Please define the MONGODB_URI environment variable')
      
      // Restore the environment variable
      process.env.MONGODB_URI = originalUri
    })

    it('should create new connection when no cached connection exists', async () => {
      const mockConnection = { readyState: 1 }
      mockConnect.mockResolvedValueOnce(mockConnection as any)
      
      const { default: dbConnect } = await import('../mongodb')
      
      const result = await dbConnect()
      
      expect(mockConnect).toHaveBeenCalledTimes(1)
      expect(result).toBe(mockConnection)
    })

    it('should handle multiple concurrent connection attempts', async () => {
      const mockConnection = { readyState: 1 }
      mockConnect.mockResolvedValueOnce(mockConnection as any)
      
      const { default: dbConnect } = await import('../mongodb')
      
      // Make multiple concurrent calls
      const promises = [
        dbConnect(),
        dbConnect(),
        dbConnect(),
      ]
      
      const results = await Promise.all(promises)
      
      // Should only call connect once
      expect(mockConnect).toHaveBeenCalledTimes(1)
      
      // All should return the same connection
      results.forEach(result => {
        expect(result).toBe(mockConnection)
      })
    })

    it('should reset promise on connection failure', async () => {
      const connectionError = new Error('Connection failed')
      mockConnect.mockRejectedValueOnce(connectionError)
      
      const { default: dbConnect } = await import('../mongodb')
      
      try {
        await dbConnect()
      } catch (error) {
        // Expected to fail
      }
      
      // Verify promise is reset
      expect((global as any).mongoose.promise).toBeNull()
      
      // Should be able to retry
      mockConnect.mockResolvedValueOnce({ readyState: 1 } as any)
      await expect(dbConnect()).resolves.toBeDefined()
    })
  })

  describe('Environment validation', () => {
    it('should validate MONGODB_URI on module load', () => {
      const originalUri = process.env.MONGODB_URI
      delete process.env.MONGODB_URI
      
      expect(() => {
        require('../mongodb')
      }).toThrow('Please define the MONGODB_URI environment variable')
      
      // Restore the environment variable
      process.env.MONGODB_URI = originalUri
    })
  })
})
