import { NextRequest, NextResponse } from 'next/server'
import { createMockRequest, mockMongoConnection, cleanupMocks, mockTask } from '@/lib/test-utils'

// Mock NextResponse
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn().mockImplementation((data, options) => ({ data, options })),
  },
}))

describe('/api/tasks/[id]', () => {
  let route: any
  let mocks: any

  beforeEach(async () => {
    cleanupMocks()
    mocks = mockMongoConnection()
    
    // Dynamically import the route after mocking
    const { PUT, DELETE } = await import('../route')
    route = { PUT, DELETE }
  })

  afterEach(() => {
    cleanupMocks()
  })

  describe('PUT /api/tasks/[id]', () => {
    it('should update a task successfully', async () => {
      const taskId = '507f1f77bcf86cd799439011'
      const updateData = {
        title: 'Updated Task',
        completed: true,
        completedAt: new Date().toISOString(),
      }
      
      const request = createMockRequest(updateData, 'PUT')
      const params = { id: taskId }
      
      const response = await route.PUT(request, { params })
      
      expect(mocks.mockConnect).toHaveBeenCalled()
      expect(mocks.mockFindByIdAndUpdate).toHaveBeenCalledWith(
        taskId,
        updateData,
        {
          new: true,
          runValidators: true,
        }
      )
      expect(NextResponse.json).toHaveBeenCalledWith(mockTask)
    })

    it('should handle task not found', async () => {
      mocks.mockFindByIdAndUpdate.mockResolvedValueOnce(null)
      
      const taskId = 'nonexistent-id'
      const updateData = { title: 'Updated Task' }
      
      const request = createMockRequest(updateData, 'PUT')
      const params = { id: taskId }
      
      const response = await route.PUT(request, { params })
      
      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: 'Task not found' },
        { status: 404 }
      )
    })

    it('should handle database update errors', async () => {
      mocks.mockFindByIdAndUpdate.mockRejectedValueOnce(new Error('Update failed'))
      
      const taskId = '507f1f77bcf86cd799439011'
      const updateData = { title: 'Updated Task' }
      
      const request = createMockRequest(updateData, 'PUT')
      const params = { id: taskId }
      
      const response = await route.PUT(request, { params })
      
      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: 'Failed to update task' },
        { status: 500 }
      )
    })

    it('should handle connection errors during update', async () => {
      mocks.mockConnect.mockRejectedValueOnce(new Error('Connection failed'))
      
      const taskId = '507f1f77bcf86cd799439011'
      const updateData = { title: 'Updated Task' }
      
      const request = createMockRequest(updateData, 'PUT')
      const params = { id: taskId }
      
      const response = await route.PUT(request, { params })
      
      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: 'Failed to update task' },
        { status: 500 }
      )
    })

    it('should handle invalid task ID format', async () => {
      const invalidTaskId = 'invalid-id'
      const updateData = { title: 'Updated Task' }
      
      const request = createMockRequest(updateData, 'PUT')
      const params = { id: invalidTaskId }
      
      const response = await route.PUT(request, { params })
      
      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: 'Failed to update task' },
        { status: 500 }
      )
    })
  })

  describe('DELETE /api/tasks/[id]', () => {
    it('should delete a task successfully', async () => {
      const taskId = '507f1f77bcf86cd799439011'
      
      const request = createMockRequest({}, 'DELETE')
      const params = { id: taskId }
      
      const response = await route.DELETE(request, { params })
      
      expect(mocks.mockConnect).toHaveBeenCalled()
      expect(mocks.mockFindByIdAndDelete).toHaveBeenCalledWith(taskId)
      expect(NextResponse.json).toHaveBeenCalledWith({
        message: 'Task deleted successfully'
      })
    })

    it('should handle task not found during deletion', async () => {
      mocks.mockFindByIdAndDelete.mockResolvedValueOnce(null)
      
      const taskId = 'nonexistent-id'
      
      const request = createMockRequest({}, 'DELETE')
      const params = { id: taskId }
      
      const response = await route.DELETE(request, { params })
      
      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: 'Task not found' },
        { status: 404 }
      )
    })

    it('should handle database deletion errors', async () => {
      mocks.mockFindByIdAndDelete.mockRejectedValueOnce(new Error('Deletion failed'))
      
      const taskId = '507f1f77bcf86cd799439011'
      
      const request = createMockRequest({}, 'DELETE')
      const params = { id: taskId }
      
      const response = await route.DELETE(request, { params })
      
      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: 'Failed to delete task' },
        { status: 500 }
      )
    })

    it('should handle connection errors during deletion', async () => {
      mocks.mockConnect.mockRejectedValueOnce(new Error('Connection failed'))
      
      const taskId = '507f1f77bcf86cd799439011'
      
      const request = createMockRequest({}, 'DELETE')
      const params = { id: taskId }
      
      const response = await route.DELETE(request, { params })
      
      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: 'Failed to delete task' },
        { status: 500 }
      )
    })

    it('should handle invalid task ID format during deletion', async () => {
      const invalidTaskId = 'invalid-id'
      
      const request = createMockRequest({}, 'DELETE')
      const params = { id: invalidTaskId }
      
      const response = await route.DELETE(request, { params })
      
      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: 'Failed to delete task' },
        { status: 500 }
      )
    })
  })
})
