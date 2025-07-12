import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { LLMService, llmService } from '../services/LLMService'
import type { LLMConfig, LLMMessage } from '../types'

/**
 * LLM Integration Tests
 * 
 * Following 2024 best practices for testing external API services:
 * 1. Mock all external API calls (no real network requests)
 * 2. Test the integration contract between our service and the LLM provider
 * 3. Use Vitest mocking (vi.mock) to mock the entire SDK
 * 4. Focus on error handling and edge cases
 * 5. Ensure tests are fast, reliable, and deterministic
 * 
 * Based on research from:
 * - Martin Fowler's Test Pyramid
 * - Vitest mocking documentation
 * - Kent C. Dodds' testing philosophy
 * - MSW patterns (but using vi.mock for simplicity)
 */

// Mock the entire Google Gen AI SDK
// This follows best practice of mocking at the boundary
// Use vi.hoisted to ensure variables are available during mock initialization
const {
  mockGenerateContent,
  mockGenerateContentStream,
  mockGoogleGenAI
} = vi.hoisted(() => {
  const mockGenerateContent = vi.fn()
  const mockGenerateContentStream = vi.fn()
  
  const mockGoogleGenAI = {
    models: {
      generateContent: mockGenerateContent,
      generateContentStream: mockGenerateContentStream
    }
  }
  
  return {
    mockGenerateContent,
    mockGenerateContentStream,
    mockGoogleGenAI
  }
})

vi.mock('@google/genai', () => ({
  GoogleGenAI: vi.fn(() => mockGoogleGenAI)
}))

// Mock environment variables for consistent testing
const mockEnv = vi.hoisted(() => ({
  VITE_GEMINI_API_KEY: 'test-integration-api-key-12345',
  VITE_GOOGLE_API_KEY: 'test-integration-api-key-12345'
}))

vi.stubGlobal('import.meta.env', mockEnv)

describe('LLM Service Integration Tests', () => {
  let service: LLMService

  beforeEach(() => {
    vi.clearAllMocks()
    // Create fresh service instance for each test
    service = new LLMService()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Service-Provider Integration', () => {
    it('should successfully integrate with Gemini API for single messages', async () => {
      // Arrange - Mock successful API response
      const mockResponse = {
        text: 'Hello! I am Gemini, an AI assistant created by Google.'
      }
      mockGenerateContent.mockResolvedValue(mockResponse)

      const config: LLMConfig = {
        model: 'gemini-2.0-flash-exp',
        temperature: 0.7,
        maxTokens: 1000
      }

      // Act
      const result = await service.sendMessage('Hello, introduce yourself', config)

      // Assert - Verify API was called with correct parameters
      expect(mockGenerateContent).toHaveBeenCalledWith({
        model: 'gemini-2.0-flash-exp',
        contents: 'Hello, introduce yourself',
        config: {
          temperature: 0.7,
          maxOutputTokens: 1000,
          topP: undefined,
          topK: undefined
        }
      })
      expect(mockGenerateContent).toHaveBeenCalledTimes(1)
      expect(result).toBe('Hello! I am Gemini, an AI assistant created by Google.')
    })

    it('should integrate correctly for conversation flows', async () => {
      // Arrange
      const mockResponse = {
        text: 'Sure! Here are some key TypeScript features: static typing, interfaces, generics, and decorators.'
      }
      mockGenerateContent.mockResolvedValue(mockResponse)

      const conversationMessages: LLMMessage[] = [
        {
          id: 'msg-1',
          role: 'user',
          content: 'What is TypeScript?',
          timestamp: new Date('2024-01-01T10:00:00Z')
        },
        {
          id: 'msg-2',
          role: 'assistant',
          content: 'TypeScript is a strongly typed programming language that builds on JavaScript.',
          timestamp: new Date('2024-01-01T10:00:05Z')
        },
        {
          id: 'msg-3',
          role: 'user',
          content: 'What are its main features?',
          timestamp: new Date('2024-01-01T10:00:10Z')
        }
      ]

      const config: LLMConfig = {
        model: 'gemini-1.5-pro',
        temperature: 0.5
      }

      // Act
      const result = await service.sendConversation(conversationMessages, config)

      // Assert - Verify conversation was transformed correctly
      expect(mockGenerateContent).toHaveBeenCalledWith({
        model: 'gemini-1.5-pro',
        contents: [
          {
            role: 'user',
            parts: [{ text: 'What is TypeScript?' }]
          },
          {
            role: 'model', // Should transform 'assistant' to 'model'
            parts: [{ text: 'TypeScript is a strongly typed programming language that builds on JavaScript.' }]
          },
          {
            role: 'user',
            parts: [{ text: 'What are its main features?' }]
          }
        ],
        config: {
          temperature: 0.5,
          maxOutputTokens: undefined,
          topP: undefined,
          topK: undefined
        }
      })
      expect(result).toBe('Sure! Here are some key TypeScript features: static typing, interfaces, generics, and decorators.')
    })

    it('should handle streaming responses correctly', async () => {
      // Arrange - Mock streaming response
      const streamChunks = [
        'Streaming', ' is', ' a', ' powerful', ' feature', ' of', ' modern', ' LLMs'
      ]
      
      const mockStreamResponse = (async function* () {
        for (const chunk of streamChunks) {
          yield { text: chunk }
        }
      })()
      
      mockGenerateContentStream.mockResolvedValue(mockStreamResponse)

      const streamCallback = vi.fn()
      const config: LLMConfig = {
        model: 'gemini-2.0-flash-exp',
        temperature: 0.8
      }

      // Act
      const result = await service.sendMessage('Explain streaming', config, streamCallback)

      // Assert - Verify streaming was configured correctly
      expect(mockGenerateContentStream).toHaveBeenCalledWith({
        model: 'gemini-2.0-flash-exp',
        contents: 'Explain streaming',
        config: {
          temperature: 0.8,
          maxOutputTokens: undefined,
          topP: undefined,
          topK: undefined
        }
      })
      
      // Verify all chunks were streamed
      expect(streamCallback).toHaveBeenCalledTimes(8)
      streamChunks.forEach((chunk, index) => {
        expect(streamCallback).toHaveBeenNthCalledWith(index + 1, chunk)
      })
      
      // Verify final result
      expect(result).toBe('Streaming is a powerful feature of modern LLMs')
    })

    it('should handle conversation streaming', async () => {
      // Arrange
      const streamChunks = ['AI', ' can', ' help', ' with', ' many', ' tasks']
      
      const mockStreamResponse = (async function* () {
        for (const chunk of streamChunks) {
          yield { text: chunk }
        }
      })()
      
      mockGenerateContentStream.mockResolvedValue(mockStreamResponse)

      const messages: LLMMessage[] = [
        {
          id: 'msg-1',
          role: 'user',
          content: 'What can AI help with?',
          timestamp: new Date()
        }
      ]

      const streamCallback = vi.fn()

      // Act
      const result = await service.sendConversation(messages, undefined, streamCallback)

      // Assert
      expect(mockGenerateContentStream).toHaveBeenCalledWith({
        model: 'gemini-2.0-flash-exp', // Default model
        contents: [
          {
            role: 'user',
            parts: [{ text: 'What can AI help with?' }]
          }
        ],
        config: {
          temperature: undefined,
          maxOutputTokens: undefined,
          topP: undefined,
          topK: undefined
        }
      })

      expect(streamCallback).toHaveBeenCalledTimes(6)
      expect(result).toBe('AI can help with many tasks')
    })
  })

  describe('Error Handling Integration', () => {
    it('should handle API rate limiting errors gracefully', async () => {
      // Arrange
      const rateLimitError = new Error('Rate limit exceeded. Please try again later.')
      mockGenerateContent.mockRejectedValue(rateLimitError)

      // Act & Assert
      await expect(service.sendMessage('Test message')).rejects.toThrow(
        'Failed to get response from Gemini: Rate limit exceeded. Please try again later.'
      )
    })

    it('should handle authentication errors', async () => {
      // Arrange
      const authError = new Error('Invalid API key provided')
      mockGenerateContent.mockRejectedValue(authError)

      // Act & Assert
      await expect(service.sendMessage('Test message')).rejects.toThrow(
        'Failed to get response from Gemini: Invalid API key provided'
      )
    })

    it('should handle network errors', async () => {
      // Arrange
      const networkError = new Error('Network request failed')
      mockGenerateContent.mockRejectedValue(networkError)

      // Act & Assert
      await expect(service.sendMessage('Test message')).rejects.toThrow(
        'Failed to get response from Gemini: Network request failed'
      )
    })

    it('should handle conversation-specific errors', async () => {
      // Arrange
      const conversationError = new Error('Context length exceeded maximum allowed')
      mockGenerateContent.mockRejectedValue(conversationError)

      const messages: LLMMessage[] = [
        { id: '1', role: 'user', content: 'Long conversation...', timestamp: new Date() }
      ]

      // Act & Assert
      await expect(service.sendConversation(messages)).rejects.toThrow(
        'Failed to continue conversation with Gemini: Context length exceeded maximum allowed'
      )
    })

    it('should handle streaming errors', async () => {
      // Arrange
      const streamError = new Error('Stream connection lost')
      mockGenerateContentStream.mockRejectedValue(streamError)

      const streamCallback = vi.fn()

      // Act & Assert
      await expect(
        service.sendMessage('Test stream', undefined, streamCallback)
      ).rejects.toThrow('Failed to get response from Gemini: Stream connection lost')
      
      // Ensure callback wasn't called on error
      expect(streamCallback).not.toHaveBeenCalled()
    })

    it('should handle unknown API errors', async () => {
      // Arrange
      const unknownError = new Error('Unknown error occurred')
      mockGenerateContent.mockRejectedValue(unknownError)

      // Act & Assert
      await expect(service.sendMessage('Test message')).rejects.toThrow(
        'Failed to get response from Gemini: Unknown error occurred'
      )
    })
  })

  describe('Configuration Integration', () => {
    it('should pass all configuration parameters to the provider', async () => {
      // Arrange
      const mockResponse = { text: 'Configured response' }
      mockGenerateContent.mockResolvedValue(mockResponse)

      const fullConfig: LLMConfig = {
        model: 'gemini-1.5-pro-latest',
        temperature: 0.9,
        maxTokens: 2048,
        topP: 0.95,
        topK: 100
      }

      // Act
      await service.sendMessage('Test with full config', fullConfig)

      // Assert
      expect(mockGenerateContent).toHaveBeenCalledWith({
        model: 'gemini-1.5-pro-latest',
        contents: 'Test with full config',
        config: {
          temperature: 0.9,
          maxOutputTokens: 2048,
          topP: 0.95,
          topK: 100
        }
      })
    })

    it('should use default values when no config provided', async () => {
      // Arrange
      const mockResponse = { text: 'Default response' }
      mockGenerateContent.mockResolvedValue(mockResponse)

      // Act
      await service.sendMessage('Test without config')

      // Assert
      expect(mockGenerateContent).toHaveBeenCalledWith({
        model: 'gemini-2.0-flash-exp', // Default model
        contents: 'Test without config',
        config: {
          temperature: undefined,
          maxOutputTokens: undefined,
          topP: undefined,
          topK: undefined
        }
      })
    })

    it('should handle partial configuration', async () => {
      // Arrange
      const mockResponse = { text: 'Partial config response' }
      mockGenerateContent.mockResolvedValue(mockResponse)

      const partialConfig: LLMConfig = {
        model: 'gemini-1.5-pro',
        temperature: 0.3
        // Other parameters intentionally omitted
      }

      // Act
      await service.sendMessage('Test partial config', partialConfig)

      // Assert
      expect(mockGenerateContent).toHaveBeenCalledWith({
        model: 'gemini-1.5-pro',
        contents: 'Test partial config',
        config: {
          temperature: 0.3,
          maxOutputTokens: undefined,
          topP: undefined,
          topK: undefined
        }
      })
    })
  })

  describe('Singleton Service Integration', () => {
    it('should maintain singleton behavior', async () => {
      // Arrange
      const mockResponse = { text: 'Singleton response' }
      mockGenerateContent.mockResolvedValue(mockResponse)

      // Act
      const result = await llmService.sendMessage('Test singleton')

      // Assert
      expect(result).toBe('Singleton response')
      expect(llmService.getProviderName()).toBe('gemini')
    })

    it('should maintain state between calls', async () => {
      // Arrange
      const responses = ['First response', 'Second response']
      mockGenerateContent
        .mockResolvedValueOnce({ text: responses[0] })
        .mockResolvedValueOnce({ text: responses[1] })

      // Act
      const result1 = await llmService.sendMessage('First message')
      const result2 = await llmService.sendMessage('Second message')

      // Assert
      expect(result1).toBe('First response')
      expect(result2).toBe('Second response')
      expect(mockGenerateContent).toHaveBeenCalledTimes(2)
    })
  })

  describe('Edge Cases and Data Validation', () => {
    it('should handle empty messages', async () => {
      // Arrange
      const mockResponse = { text: 'Handled empty message' }
      mockGenerateContent.mockResolvedValue(mockResponse)

      // Act
      const result = await service.sendMessage('')

      // Assert
      expect(mockGenerateContent).toHaveBeenCalledWith({
        model: 'gemini-2.0-flash-exp',
        contents: '',
        config: {
          temperature: undefined,
          maxOutputTokens: undefined,
          topP: undefined,
          topK: undefined
        }
      })
      expect(result).toBe('Handled empty message')
    })

    it('should handle empty conversation arrays', async () => {
      // Arrange
      const mockResponse = { text: 'Handled empty conversation' }
      mockGenerateContent.mockResolvedValue(mockResponse)

      // Act
      const result = await service.sendConversation([])

      // Assert
      expect(mockGenerateContent).toHaveBeenCalledWith({
        model: 'gemini-2.0-flash-exp',
        contents: [],
        config: {
          temperature: undefined,
          maxOutputTokens: undefined,
          topP: undefined,
          topK: undefined
        }
      })
      expect(result).toBe('Handled empty conversation')
    })

    it('should handle API responses with empty text', async () => {
      // Arrange
      const mockResponse = { text: '' }
      mockGenerateContent.mockResolvedValue(mockResponse)

      // Act
      const result = await service.sendMessage('Test empty response')

      // Assert
      expect(result).toBe('')
    })

    it('should handle API responses with undefined text', async () => {
      // Arrange
      const mockResponse = { text: undefined }
      mockGenerateContent.mockResolvedValue(mockResponse)

      // Act
      const result = await service.sendMessage('Test undefined response')

      // Assert
      expect(result).toBe('') // Should default to empty string
    })

    it('should handle streaming with empty chunks', async () => {
      // Arrange
      const streamChunks = ['Hello', '', ' ', 'world']
      
      const mockStreamResponse = (async function* () {
        for (const chunk of streamChunks) {
          yield { text: chunk }
        }
      })()
      
      mockGenerateContentStream.mockResolvedValue(mockStreamResponse)

      const streamCallback = vi.fn()

      // Act
      const result = await service.sendMessage('Test empty chunks', undefined, streamCallback)

      // Assert
      expect(streamCallback).toHaveBeenCalledTimes(4)
      expect(streamCallback).toHaveBeenNthCalledWith(1, 'Hello')
      expect(streamCallback).toHaveBeenNthCalledWith(2, '')
      expect(streamCallback).toHaveBeenNthCalledWith(3, ' ')
      expect(streamCallback).toHaveBeenNthCalledWith(4, 'world')
      expect(result).toBe('Hello world')
    })

    it('should handle streaming with undefined chunks', async () => {
      // Arrange
      const streamChunks = ['Hello', undefined, 'world']
      
      const mockStreamResponse = (async function* () {
        for (const chunk of streamChunks) {
          yield { text: chunk }
        }
      })()
      
      mockGenerateContentStream.mockResolvedValue(mockStreamResponse)

      const streamCallback = vi.fn()

      // Act
      const result = await service.sendMessage('Test undefined chunks', undefined, streamCallback)

      // Assert
      expect(streamCallback).toHaveBeenCalledTimes(3)
      expect(streamCallback).toHaveBeenNthCalledWith(1, 'Hello')
      expect(streamCallback).toHaveBeenNthCalledWith(2, '') // undefined should become empty string
      expect(streamCallback).toHaveBeenNthCalledWith(3, 'world')
      expect(result).toBe('Helloworld')
    })
  })
})
