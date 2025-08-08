import { NextRequest } from 'next/server'
import { createMockRequest, mockMongoConnection, mockOpenAI, cleanupMocks } from '@/lib/test-utils'

// Mock NextResponse
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn().mockImplementation((data, options) => ({ data, options })),
  },
}))

describe('API Integration Tests', () => {
  let tasksRoute: any
  let taskRoute: any
  let aiRoute: any
  let mocks: any

  beforeEach(async () => {
    cleanupMocks()
    mocks = mockMongoConnection()
    mockOpenAI()
    
    // Dynamically import all routes
    const { GET: tasksGET, POST: tasksPOST } = await import('../app/api/tasks/route')
    const { PUT, DELETE } = await import('../app/api/tasks/[id]/route')
    const { POST: aiPOST } = await import('../app/api/ai/generate-tasks/route')
    
    tasksRoute = { GET: tasksGET, POST: tasksPOST }
    taskRoute = { PUT, DELETE }
    aiRoute = { POST: aiPOST }
  })

  afterEach(() => {
    cleanupMocks()
  })

  describe('Complete Task Lifecycle', () => {
    it('should handle complete task lifecycle: create, read, update, delete', async () => {
      // 1. Create a task
      const newTask = {
        title: 'Integration Test Task',
        description: 'This is a test task for integration testing',
        category: 'work',
        priority: 'high' as const,
      }
      
      const createRequest = createMockRequest(newTask, 'POST')
      const createResponse = await tasksRoute.POST(createRequest)
      
      expect(mocks.mockCreate).toHaveBeenCalledWith(newTask)
      expect(createResponse.data).toBeDefined()

      // 2. Read all tasks
      const readRequest = createMockRequest()
      const readResponse = await tasksRoute.GET(readRequest)
      
      expect(mocks.mockFind).toHaveBeenCalledWith({})
      expect(readResponse.data).toBeDefined()

      // 3. Update the task
      const taskId = '507f1f77bcf86cd799439011'
      const updateData = {
        completed: true,
        completedAt: new Date().toISOString(),
      }
      
      const updateRequest = createMockRequest(updateData, 'PUT')
      const updateResponse = await taskRoute.PUT(updateRequest, { params: { id: taskId } })
      
      expect(mocks.mockFindByIdAndUpdate).toHaveBeenCalledWith(
        taskId,
        updateData,
        { new: true, runValidators: true }
      )

      // 4. Delete the task
      const deleteRequest = createMockRequest({}, 'DELETE')
      const deleteResponse = await taskRoute.DELETE(deleteRequest, { params: { id: taskId } })
      
      expect(mocks.mockFindByIdAndDelete).toHaveBeenCalledWith(taskId)
    })
  })

  describe('AI Task Generation Integration', () => {
    it('should generate AI tasks and create them in database', async () => {
      // 1. Generate AI tasks
      const aiInputs = {
        mood: 'happy',
        energyLevel: 8,
        availableTime: 60,
      }
      
      const aiRequest = createMockRequest(aiInputs, 'POST')
      const aiResponse = await aiRoute.POST(aiRequest)
      
      expect(aiResponse.data).toBeDefined()
      expect(Array.isArray(aiResponse.data)).toBe(true)

      // 2. Verify AI tasks have correct structure
      const aiTasks = aiResponse.data
      aiTasks.forEach((task: any) => {
        expect(task).toHaveProperty('title')
        expect(task).toHaveProperty('description')
        expect(task).toHaveProperty('category')
        expect(task).toHaveProperty('priority')
        expect(['low', 'medium', 'high']).toContain(task.priority)
        expect(['personal', 'work', 'health', 'learning', 'creative', 'social']).toContain(task.category)
      })
    })

    it('should handle AI generation errors gracefully', async () => {
      // Mock OpenAI error
      const mockOpenAIInstance = require('openai').default
      mockOpenAIInstance.mockImplementationOnce(() => ({
        chat: {
          completions: {
            create: jest.fn().mockRejectedValue(new Error('OpenAI API error'))
          }
        }
      }))

      const aiInputs = {
        mood: 'happy',
        energyLevel: 5,
        availableTime: 30,
      }
      
      const aiRequest = createMockRequest(aiInputs, 'POST')
      const aiResponse = await aiRoute.POST(aiRequest)
      
      expect(aiResponse.options.status).toBe(500)
      expect(aiResponse.data.error).toBe('Failed to generate tasks')
    })
  })

  describe('Error Handling Integration', () => {
    it('should handle database connection failures across all endpoints', async () => {
      // Mock connection failure
      mocks.mockConnect.mockRejectedValue(new Error('Database connection failed'))

      // Test all endpoints with connection failure
      const endpoints = [
        { route: tasksRoute.GET, name: 'GET /api/tasks' },
        { route: tasksRoute.POST, name: 'POST /api/tasks', request: createMockRequest({ title: 'Test' }, 'POST') },
        { route: taskRoute.PUT, name: 'PUT /api/tasks/[id]', request: createMockRequest({ title: 'Updated' }, 'PUT'), params: { id: 'test-id' } },
        { route: taskRoute.DELETE, name: 'DELETE /api/tasks/[id]', request: createMockRequest({}, 'DELETE'), params: { id: 'test-id' } },
      ]

      for (const endpoint of endpoints) {
        const request = endpoint.request || createMockRequest()
        const params = endpoint.params || {}
        
        const response = await endpoint.route(request, { params })
        
        expect(response.options.status).toBe(500)
        expect(response.data.error).toContain('Failed')
      }
    })

    it('should handle invalid data gracefully', async () => {
      // Test with invalid task data
      const invalidTask = {
        // Missing required title
        description: 'Invalid task',
      }
      
      const createRequest = createMockRequest(invalidTask, 'POST')
      const createResponse = await tasksRoute.POST(createRequest)
      
      expect(createResponse.options.status).toBe(500)
      expect(createResponse.data.error).toBe('Failed to create task')
    })
  })

  describe('Data Validation Integration', () => {
    it('should validate task data structure', async () => {
      const validTask = {
        title: 'Valid Task',
        description: 'Valid description',
        category: 'personal',
        priority: 'medium' as const,
      }
      
      const createRequest = createMockRequest(validTask, 'POST')
      const createResponse = await tasksRoute.POST(createRequest)
      
      expect(createResponse.options.status).toBe(201)
      expect(createResponse.data).toBeDefined()
    })

    it('should handle edge cases in AI inputs', async () => {
      const edgeCaseInputs = [
        { mood: 'happy', energyLevel: 1, availableTime: 5 }, // Very low energy and time
        { mood: 'excited', energyLevel: 10, availableTime: 480 }, // Very high energy and time
        { mood: 'stressed', energyLevel: 5, availableTime: 30 }, // Normal case
      ]

      for (const inputs of edgeCaseInputs) {
        const aiRequest = createMockRequest(inputs, 'POST')
        const aiResponse = await aiRoute.POST(aiRequest)
        
        expect(aiResponse.data).toBeDefined()
        expect(Array.isArray(aiResponse.data)).toBe(true)
      }
    })
  })

  describe('Performance Integration', () => {
    it('should handle multiple concurrent requests', async () => {
      const concurrentRequests = [
        tasksRoute.GET(createMockRequest()),
        tasksRoute.POST(createMockRequest({ title: 'Task 1' }, 'POST')),
        tasksRoute.POST(createMockRequest({ title: 'Task 2' }, 'POST')),
        aiRoute.POST(createMockRequest({ mood: 'happy', energyLevel: 5, availableTime: 30 }, 'POST')),
      ]

      const responses = await Promise.all(concurrentRequests)
      
      responses.forEach(response => {
        expect(response).toBeDefined()
      })
    })
  })
})
