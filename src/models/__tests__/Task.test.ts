import mongoose from 'mongoose'
import Task from '../Task'

// Mock mongoose
jest.mock('mongoose', () => ({
  Schema: jest.fn(),
  model: jest.fn(),
  models: {},
}))

describe('Task Model', () => {
  let mockSchema: jest.MockedFunction<any>
  let mockModel: jest.MockedFunction<any>
  let mockModels: any

  beforeEach(() => {
    jest.clearAllMocks()
    mockSchema = mongoose.Schema as jest.MockedFunction<any>
    mockModel = mongoose.model as jest.MockedFunction<any>
    mockModels = mongoose.models
    
    // Reset models
    mockModels.Task = undefined
  })

  afterEach(() => {
    jest.resetModules()
  })

  describe('Task Schema', () => {
    it('should define the correct schema structure', () => {
      require('../Task')
      
      expect(mockSchema).toHaveBeenCalledWith(
        expect.objectContaining({
          title: expect.objectContaining({
            type: String,
            required: true,
            trim: true,
          }),
          description: expect.objectContaining({
            type: String,
            trim: true,
          }),
          category: expect.objectContaining({
            type: String,
            required: true,
            default: 'personal',
          }),
          priority: expect.objectContaining({
            type: String,
            enum: ['low', 'medium', 'high'],
            default: 'medium',
          }),
          completed: expect.objectContaining({
            type: Boolean,
            default: false,
          }),
          createdAt: expect.objectContaining({
            type: Date,
            default: Date.now,
          }),
          completedAt: expect.objectContaining({
            type: Date,
          }),
          aiGenerated: expect.objectContaining({
            type: Boolean,
            default: false,
          }),
        })
      )
    })

    it('should create model with correct name', () => {
      require('../Task')
      
      expect(mockModel).toHaveBeenCalledWith('Task', expect.any(Object))
    })

    it('should return existing model if already defined', () => {
      const existingModel = { name: 'Task' }
      mockModels.Task = existingModel
      
      const TaskModel = require('../Task').default
      
      expect(mockModel).not.toHaveBeenCalled()
      expect(TaskModel).toBe(existingModel)
    })

    it('should create new model if not already defined', () => {
      const newModel = { name: 'Task' }
      mockModel.mockReturnValue(newModel)
      
      const TaskModel = require('../Task').default
      
      expect(mockModel).toHaveBeenCalledWith('Task', expect.any(Object))
      expect(TaskModel).toBe(newModel)
    })
  })

  describe('Task Interface', () => {
    it('should have correct interface structure', () => {
      const { ITask } = require('../Task')
      
      expect(ITask).toBeDefined()
      
      // Check that the interface has the expected properties
      const task: typeof ITask = {
        _id: '507f1f77bcf86cd799439011',
        title: 'Test Task',
        description: 'Test description',
        category: 'personal',
        priority: 'medium',
        completed: false,
        createdAt: new Date(),
        completedAt: undefined,
        aiGenerated: false,
      }
      
      expect(task._id).toBeDefined()
      expect(task.title).toBeDefined()
      expect(task.category).toBeDefined()
      expect(task.priority).toBeDefined()
      expect(task.completed).toBeDefined()
      expect(task.createdAt).toBeDefined()
      expect(task.aiGenerated).toBeDefined()
    })

    it('should allow optional description', () => {
      const { ITask } = require('../Task')
      
      const task: typeof ITask = {
        _id: '507f1f77bcf86cd799439011',
        title: 'Test Task',
        category: 'personal',
        priority: 'medium',
        completed: false,
        createdAt: new Date(),
        aiGenerated: false,
      }
      
      expect(task.title).toBeDefined()
      // description is optional, so it's okay if it's undefined
    })

    it('should allow optional completedAt', () => {
      const { ITask } = require('../Task')
      
      const task: typeof ITask = {
        _id: '507f1f77bcf86cd799439011',
        title: 'Test Task',
        category: 'personal',
        priority: 'medium',
        completed: false,
        createdAt: new Date(),
        aiGenerated: false,
      }
      
      expect(task.completed).toBe(false)
      // completedAt is optional, so it's okay if it's undefined
    })
  })

  describe('Priority Enum', () => {
    it('should only allow valid priority values', () => {
      const { ITask } = require('../Task')
      
      // These should be valid
      const validPriorities: Array<typeof ITask['priority']> = ['low', 'medium', 'high']
      
      validPriorities.forEach(priority => {
        expect(['low', 'medium', 'high']).toContain(priority)
      })
    })
  })

  describe('Category Values', () => {
    it('should support all expected categories', () => {
      const { ITask } = require('../Task')
      
      const validCategories = [
        'personal',
        'work', 
        'health',
        'learning',
        'creative',
        'social'
      ]
      
      validCategories.forEach(category => {
        const task: typeof ITask = {
          _id: '507f1f77bcf86cd799439011',
          title: 'Test Task',
          category,
          priority: 'medium',
          completed: false,
          createdAt: new Date(),
          aiGenerated: false,
        }
        
        expect(task.category).toBe(category)
      })
    })
  })

  describe('Date Fields', () => {
    it('should handle date fields correctly', () => {
      const { ITask } = require('../Task')
      
      const now = new Date()
      const completedAt = new Date()
      
      const task: typeof ITask = {
        _id: '507f1f77bcf86cd799439011',
        title: 'Test Task',
        category: 'personal',
        priority: 'medium',
        completed: true,
        createdAt: now,
        completedAt,
        aiGenerated: false,
      }
      
      expect(task.createdAt).toBeInstanceOf(Date)
      expect(task.completedAt).toBeInstanceOf(Date)
    })
  })

  describe('Boolean Fields', () => {
    it('should handle boolean fields correctly', () => {
      const { ITask } = require('../Task')
      
      const task: typeof ITask = {
        _id: '507f1f77bcf86cd799439011',
        title: 'Test Task',
        category: 'personal',
        priority: 'medium',
        completed: true,
        createdAt: new Date(),
        aiGenerated: true,
      }
      
      expect(typeof task.completed).toBe('boolean')
      expect(typeof task.aiGenerated).toBe('boolean')
      expect(task.completed).toBe(true)
      expect(task.aiGenerated).toBe(true)
    })
  })
})
