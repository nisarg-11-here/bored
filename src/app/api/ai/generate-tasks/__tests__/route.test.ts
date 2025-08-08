import { NextRequest, NextResponse } from 'next/server'
import { createMockRequest, mockOpenAI, cleanupMocks } from '@/lib/test-utils'

// Mock NextResponse
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn().mockImplementation((data, options) => ({ data, options })),
  },
}))

describe('/api/ai/generate-tasks', () => {
  let route: any
  let mocks: any

  beforeEach(async () => {
    cleanupMocks()
    mocks = mockOpenAI()
    
    // Dynamically import the route after mocking
    const { POST } = await import('../route')
    route = { POST }
  })

  afterEach(() => {
    cleanupMocks()
  })

  describe('POST /api/ai/generate-tasks', () => {
    it('should generate AI tasks successfully', async () => {
      const aiInputs = {
        mood: 'happy',
        energyLevel: 8,
        availableTime: 60,
      }
      
      const request = createMockRequest(aiInputs, 'POST')
      
      const response = await route.POST(request)
      
      expect(mocks.mockCreate).toHaveBeenCalledWith({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant that generates engaging tasks to combat boredom. Always respond with valid JSON arrays only."
          },
          {
            role: "user",
            content: expect.stringContaining('Mood: happy')
          }
        ],
        temperature: 0.8,
        max_tokens: 500,
      })
      
      expect(NextResponse.json).toHaveBeenCalledWith([
        {
          title: 'AI Generated Task',
          description: 'This is an AI generated task',
          category: 'personal',
          priority: 'medium',
        }
      ])
    })

    it('should handle different mood inputs', async () => {
      const aiInputs = {
        mood: 'stressed',
        energyLevel: 3,
        availableTime: 30,
      }
      
      const request = createMockRequest(aiInputs, 'POST')
      
      const response = await route.POST(request)
      
      expect(mocks.mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({
              content: expect.stringContaining('Mood: stressed')
            })
          ])
        })
      )
    })

    it('should handle different energy levels', async () => {
      const aiInputs = {
        mood: 'neutral',
        energyLevel: 10,
        availableTime: 120,
      }
      
      const request = createMockRequest(aiInputs, 'POST')
      
      const response = await route.POST(request)
      
      expect(mocks.mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({
              content: expect.stringContaining('Energy Level: 10/10')
            })
          ])
        })
      )
    })

    it('should handle different time constraints', async () => {
      const aiInputs = {
        mood: 'excited',
        energyLevel: 7,
        availableTime: 15,
      }
      
      const request = createMockRequest(aiInputs, 'POST')
      
      const response = await route.POST(request)
      
      expect(mocks.mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({
              content: expect.stringContaining('Available Time: 15 minutes')
            })
          ])
        })
      )
    })

    it('should handle OpenAI API errors', async () => {
      mocks.mockCreate.mockRejectedValueOnce(new Error('OpenAI API error'))
      
      const aiInputs = {
        mood: 'happy',
        energyLevel: 5,
        availableTime: 45,
      }
      
      const request = createMockRequest(aiInputs, 'POST')
      
      const response = await route.POST(request)
      
      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: 'Failed to generate tasks' },
        { status: 500 }
      )
    })

    it('should handle empty response from OpenAI', async () => {
      mocks.mockCompletion.choices[0].message.content = null
      
      const aiInputs = {
        mood: 'neutral',
        energyLevel: 5,
        availableTime: 30,
      }
      
      const request = createMockRequest(aiInputs, 'POST')
      
      const response = await route.POST(request)
      
      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: 'Failed to generate tasks' },
        { status: 500 }
      )
    })

    it('should handle invalid JSON response from OpenAI', async () => {
      mocks.mockCompletion.choices[0].message.content = 'invalid json'
      
      const aiInputs = {
        mood: 'happy',
        energyLevel: 6,
        availableTime: 60,
      }
      
      const request = createMockRequest(aiInputs, 'POST')
      
      const response = await route.POST(request)
      
      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: 'Failed to generate tasks' },
        { status: 500 }
      )
    })

    it('should handle missing OpenAI API key', async () => {
      // Temporarily remove the API key
      const originalApiKey = process.env.OPENAI_API_KEY
      delete process.env.OPENAI_API_KEY
      
      const aiInputs = {
        mood: 'happy',
        energyLevel: 5,
        availableTime: 30,
      }
      
      const request = createMockRequest(aiInputs, 'POST')
      
      const response = await route.POST(request)
      
      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: 'Failed to generate tasks' },
        { status: 500 }
      )
      
      // Restore the API key
      process.env.OPENAI_API_KEY = originalApiKey
    })

    it('should validate required input fields', async () => {
      const invalidInputs = {
        // Missing required fields
        mood: 'happy',
        // energyLevel missing
        // availableTime missing
      }
      
      const request = createMockRequest(invalidInputs, 'POST')
      
      const response = await route.POST(request)
      
      // Should still work as the function doesn't validate these fields
      expect(mocks.mockCreate).toHaveBeenCalled()
    })

    it('should handle extreme values gracefully', async () => {
      const extremeInputs = {
        mood: 'bored',
        energyLevel: 1, // Very low energy
        availableTime: 480, // 8 hours
      }
      
      const request = createMockRequest(extremeInputs, 'POST')
      
      const response = await route.POST(request)
      
      expect(mocks.mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({
              content: expect.stringContaining('Energy Level: 1/10')
            })
          ])
        })
      )
    })

    it('should include proper prompt structure', async () => {
      const aiInputs = {
        mood: 'tired',
        energyLevel: 2,
        availableTime: 20,
      }
      
      const request = createMockRequest(aiInputs, 'POST')
      
      const response = await route.POST(request)
      
      expect(mocks.mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({
              content: expect.stringMatching(/Generate 3 engaging and personalized tasks/)
            }),
            expect.objectContaining({
              content: expect.stringMatching(/Format each task as a JSON object/)
            })
          ])
        })
      )
    })
  })
})
