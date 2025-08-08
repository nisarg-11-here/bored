import { NextRequest, NextResponse } from 'next/server'
import { createMockRequest, mockMongoConnection, cleanupMocks, mockTasks } from '@/lib/test-utils'

// Mock NextResponse
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn().mockImplementation((data, options) => ({ data, options })),
  },
}))

describe('/api/tasks', () => {
  let route: any
  let mocks: any

  beforeEach(async () => {
    cleanupMocks()
    mocks = mockMongoConnection()
    
    // Dynamically import the route after mocking
    const { GET, POST } = await import('../route')
    route = { GET, POST }
  })

  afterEach(() => {
    cleanupMocks()
  })

  describe('GET /api/tasks', () => {
    it('should fetch all tasks successfully', async () => {
      const request = createMockRequest()
      
      const response = await route.GET(request)
      
      expect(mocks.mockConnect).toHaveBeenCalled()
      expect(mocks.mockFind).toHaveBeenCalledWith({})
      expect(mocks.mockFind().sort).toHaveBeenCalledWith({ createdAt: -1 })
      expect(NextResponse.json).toHaveBeenCalledWith(mockTasks)
    })

    it('should handle database connection errors', async () => {
      mocks.mockConnect.mockRejectedValueOnce(new Error('Connection failed'))
      
      const request = createMockRequest()
      
      const response = await route.GET(request)
      
      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: 'Failed to fetch tasks' },
        { status: 500 }
      )
    })

    it('should handle database query errors', async () => {
      mocks.mockFind().sort.mockRejectedValueOnce(new Error('Query failed'))
      
      const request = createMockRequest()
      
      const response = await route.GET(request)
      
      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: 'Failed to fetch tasks' },
        { status: 500 }
      )
    })
  })

  describe('POST /api/tasks', () => {
    it('should create a new task successfully', async () => {
      const newTask = {
        title: 'New Test Task',
        description: 'A new test task',
        category: 'work',
        priority: 'high' as const,
      }
      
      const request = createMockRequest(newTask, 'POST')
      
      const response = await route.POST(request)
      
      expect(mocks.mockConnect).toHaveBeenCalled()
      expect(mocks.mockCreate).toHaveBeenCalledWith(newTask)
      expect(NextResponse.json).toHaveBeenCalledWith(mockTasks[0], { status: 201 })
    })

    it('should handle invalid task data', async () => {
      const invalidTask = {
        // Missing required title field
        description: 'A task without title',
        category: 'personal',
      }
      
      const request = createMockRequest(invalidTask, 'POST')
      
      const response = await route.POST(request)
      
      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: 'Failed to create task' },
        { status: 500 }
      )
    })

    it('should handle database creation errors', async () => {
      mocks.mockCreate.mockRejectedValueOnce(new Error('Creation failed'))
      
      const newTask = {
        title: 'New Test Task',
        category: 'personal',
      }
      
      const request = createMockRequest(newTask, 'POST')
      
      const response = await route.POST(request)
      
      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: 'Failed to create task' },
        { status: 500 }
      )
    })

    it('should handle connection errors during creation', async () => {
      mocks.mockConnect.mockRejectedValueOnce(new Error('Connection failed'))
      
      const newTask = {
        title: 'New Test Task',
        category: 'personal',
      }
      
      const request = createMockRequest(newTask, 'POST')
      
      const response = await route.POST(request)
      
      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: 'Failed to create task' },
        { status: 500 }
      )
    })
  })
})
