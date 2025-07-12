import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { GeminiProvider } from '../providers/gemini/GeminiProvider'
import type { LLMConfig, LLMMessage } from '../types'

// Mock the new Google Gen AI library
const mockModels = {
  generateContent: vi.fn(),
  generateContentStream: vi.fn()
}

const mockClient = {
  models: mockModels
}

vi.mock('@google/genai', () => ({
  GoogleGenAI: vi.fn(() => mockClient)
}))

describe('GeminiProvider', () => {
  let provider: GeminiProvider

  beforeEach(() => {
    vi.clearAllMocks()
    provider = new GeminiProvider('test-api-key')
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('constructor', () => {
    it('should initialize with API key', () => {
      expect(provider.name).toBe('gemini')
    })

    it('should throw error with invalid API key', () => {
      expect(() => new GeminiProvider('')).toThrow()
    })
  })

  describe('sendMessage', () => {
    it('should send prompt and receive response', async () => {
      const mockResponse = {
        text: 'Hello, how can I help you?'
      }
      mockModels.generateContent.mockResolvedValue(mockResponse)

      const result = await provider.sendMessage('Hello')

      expect(mockModels.generateContent).toHaveBeenCalledWith({
        model: 'gemini-2.0-flash-exp',
        contents: 'Hello',
        config: {
          temperature: undefined,
          maxOutputTokens: undefined,
          topP: undefined,
          topK: undefined,
        }
      })
      expect(result).toBe('Hello, how can I help you?')
    })

    it('should handle streaming responses', async () => {
      const chunks = ['Hello', ' there', ' friend!']
      
      const mockStreamResponse = (async function* () {
        for (const chunk of chunks) {
          yield { text: chunk }
        }
      })()
      
      mockModels.generateContentStream.mockResolvedValue(mockStreamResponse)

      const onStreamMock = vi.fn()
      const result = await provider.sendMessage('Hello', undefined, onStreamMock)

      expect(mockModels.generateContentStream).toHaveBeenCalledWith({
        model: 'gemini-2.0-flash-exp',
        contents: 'Hello',
        config: {
          temperature: undefined,
          maxOutputTokens: undefined,
          topP: undefined,
          topK: undefined,
        }
      })
      expect(onStreamMock).toHaveBeenCalledTimes(3)
      expect(onStreamMock).toHaveBeenNthCalledWith(1, 'Hello')
      expect(onStreamMock).toHaveBeenNthCalledWith(2, ' there')
      expect(onStreamMock).toHaveBeenNthCalledWith(3, ' friend!')
      expect(result).toBe('Hello there friend!')
    })

    it('should handle API errors gracefully', async () => {
      const error = new Error('API Rate Limit Exceeded')
      mockModels.generateContent.mockRejectedValue(error)

      await expect(provider.sendMessage('Hello')).rejects.toThrow(
        'Failed to get response from Gemini: API Rate Limit Exceeded'
      )
    })

    it('should apply configuration parameters', async () => {
      const config: LLMConfig = {
        model: 'gemini-1.5-pro',
        temperature: 0.7,
        maxTokens: 1000,
        topP: 0.9,
        topK: 40
      }

      const mockResponse = {
        text: 'Response with config'
      }
      mockModels.generateContent.mockResolvedValue(mockResponse)

      await provider.sendMessage('Hello', config)

      expect(mockModels.generateContent).toHaveBeenCalledWith({
        model: 'gemini-1.5-pro',
        contents: 'Hello',
        config: {
          temperature: 0.7,
          maxOutputTokens: 1000,
          topP: 0.9,
          topK: 40,
        }
      })
    })
  })

  describe('sendConversation', () => {
    it('should manage conversation context', async () => {
      const messages: LLMMessage[] = [
        {
          id: '1',
          role: 'user',
          content: 'What is 2+2?',
          timestamp: new Date(),
        },
        {
          id: '2',
          role: 'assistant',
          content: '2+2 equals 4.',
          timestamp: new Date(),
        },
        {
          id: '3',
          role: 'user',
          content: 'What about 3+3?',
          timestamp: new Date(),
        }
      ]

      const mockResponse = {
        text: '3+3 equals 6.'
      }
      mockModels.generateContent.mockResolvedValue(mockResponse)

      const result = await provider.sendConversation(messages)

      expect(mockModels.generateContent).toHaveBeenCalledWith({
        model: 'gemini-2.0-flash-exp',
        contents: [
          {
            role: 'user',
            parts: [{ text: 'What is 2+2?' }]
          },
          {
            role: 'model',
            parts: [{ text: '2+2 equals 4.' }]
          },
          {
            role: 'user',
            parts: [{ text: 'What about 3+3?' }]
          }
        ],
        config: {
          temperature: undefined,
          maxOutputTokens: undefined,
          topP: undefined,
          topK: undefined,
        }
      })
      expect(result).toBe('3+3 equals 6.')
    })

    it('should handle conversation streaming', async () => {
      const messages: LLMMessage[] = [
        {
          id: '1',
          role: 'user',
          content: 'Tell me a story',
          timestamp: new Date(),
        }
      ]

      const chunks = ['Once', ' upon', ' a time...']
      const mockStreamResponse = (async function* () {
        for (const chunk of chunks) {
          yield { text: chunk }
        }
      })()

      mockModels.generateContentStream.mockResolvedValue(mockStreamResponse)

      const onStreamMock = vi.fn()
      const result = await provider.sendConversation(messages, undefined, onStreamMock)

      expect(onStreamMock).toHaveBeenCalledTimes(3)
      expect(result).toBe('Once upon a time...')
    })

    it('should handle conversation errors', async () => {
      const messages: LLMMessage[] = [
        { id: '1', role: 'user', content: 'Hello', timestamp: new Date() }
      ]

      const error = new Error('Conversation context too long')
      mockModels.generateContent.mockRejectedValue(error)

      await expect(provider.sendConversation(messages)).rejects.toThrow(
        'Failed to continue conversation with Gemini: Conversation context too long'
      )
    })
  })
})
