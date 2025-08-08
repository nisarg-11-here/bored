import { NextRequest } from 'next/server'
import mongoose from 'mongoose'

// Mock task data for testing
export const mockTask = {
  _id: '507f1f77bcf86cd799439011',
  title: 'Test Task',
  description: 'This is a test task',
  category: 'personal',
  priority: 'medium' as const,
  completed: false,
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
  completedAt: undefined,
  aiGenerated: false,
}

export const mockTasks = [
  mockTask,
  {
    ...mockTask,
    _id: '507f1f77bcf86cd799439012',
    title: 'Another Test Task',
    completed: true,
    completedAt: new Date('2024-01-02T00:00:00.000Z'),
  },
]

// Create a mock NextRequest
export function createMockRequest(body?: any, method: string = 'GET'): NextRequest {
  const request = {
    json: jest.fn().mockResolvedValue(body || {}),
    method,
  } as any

  return request as NextRequest
}

// Mock MongoDB connection
export function mockMongoConnection() {
  const mockConnect = jest.fn().mockResolvedValue({})
  const mockFind = jest.fn().mockReturnValue({
    sort: jest.fn().mockResolvedValue(mockTasks),
  })
  const mockCreate = jest.fn().mockResolvedValue(mockTask)
  const mockFindByIdAndUpdate = jest.fn().mockResolvedValue(mockTask)
  const mockFindByIdAndDelete = jest.fn().mockResolvedValue(mockTask)

  const mockTaskModel = {
    find: mockFind,
    create: mockCreate,
    findByIdAndUpdate: mockFindByIdAndUpdate,
    findByIdAndDelete: mockFindByIdAndDelete,
  }

  // Mock the modules
  jest.doMock('../../models/Task', () => ({
    __esModule: true,
    default: mockTaskModel,
  }))

  jest.doMock('../mongodb', () => ({
    __esModule: true,
    default: mockConnect,
  }))

  return {
    mockConnect,
    mockFind,
    mockCreate,
    mockFindByIdAndUpdate,
    mockFindByIdAndDelete,
    mockTaskModel,
  }
}

// Mock OpenAI
export function mockOpenAI() {
  const mockCompletion = {
    choices: [
      {
        message: {
          content: JSON.stringify([
            {
              title: 'AI Generated Task',
              description: 'This is an AI generated task',
              category: 'personal',
              priority: 'medium',
            },
          ]),
        },
      },
    ],
  }

  const mockCreate = jest.fn().mockResolvedValue(mockCompletion)

  const mockOpenAI = {
    chat: {
      completions: {
        create: mockCreate,
      },
    },
  }

  jest.doMock('openai', () => ({
    __esModule: true,
    default: jest.fn().mockImplementation(() => mockOpenAI),
  }))

  return {
    mockCreate,
    mockCompletion,
  }
}

// Clean up mocks after each test
export function cleanupMocks() {
  jest.clearAllMocks()
  jest.resetModules()
}
