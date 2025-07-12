import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { LLMService } from '../services/LLMService'
import type { LLMConfig, LLMMessage } from '../types'

// Mock the GeminiProvider
vi.mock('../providers/gemini/GeminiProvider', () => ({
  GeminiProvider: vi.fn(() => ({
    name: 'gemini',
    sendMessage: vi.fn(),
    sendConversation: vi.fn()
  }))
}))

// Mock environment variables
const mockEnv = vi.hoisted(() => ({
  VITE_GEMINI_API_KEY: 'test-api-key'
}))

vi.stubGlobal('import.meta.env', mockEnv)

describe('LLMService', () => {
  let service: LLMService
  let mockProvider: any

  beforeEach(() => {
    vi.clearAllMocks()
    service = new LLMService()
    // Access the mocked provider instance
    mockProvider = (service as any).provider
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('constructor', () => {
    it('should initialize with Gemini provider', () => {
      expect(service.getProviderName()).toBe('gemini')
    })

    it.skip('should throw error when API key is missing', () => {
      // TODO: Fix environment variable mocking in tests
      // This test needs to be run in isolation to properly test env var validation
      // Mock empty environment variables for this test
      const originalMockEnv = import.meta.env
      vi.stubGlobal('import.meta.env', {
        VITE_GEMINI_API_KEY: undefined,
        VITE_GOOGLE_API_KEY: undefined
      })

      expect(() => new LLMService()).toThrow('API key required: Set VITE_GOOGLE_API_KEY or VITE_GEMINI_API_KEY environment variable')

      // Restore original mock
      vi.stubGlobal('import.meta.env', originalMockEnv)
    })
  })

  describe('sendMessage', () => {
    it('should delegate to provider sendMessage', async () => {
      const expectedResponse = 'Hello from Gemini!'
      mockProvider.sendMessage.mockResolvedValue(expectedResponse)

      const config: LLMConfig = {
        model: 'gemini-2.0-flash-exp',
        temperature: 0.7
      }

      const onStreamMock = vi.fn()
      const result = await service.sendMessage('Hello', config, onStreamMock)

      expect(mockProvider.sendMessage).toHaveBeenCalledWith('Hello', config, onStreamMock)
      expect(result).toBe(expectedResponse)
    })

    it('should handle provider errors', async () => {
      const error = new Error('Provider error')
      mockProvider.sendMessage.mockRejectedValue(error)

      await expect(service.sendMessage('Hello')).rejects.toThrow('Provider error')
    })
  })

  describe('sendConversation', () => {
    it('should delegate to provider sendConversation', async () => {
      const messages: LLMMessage[] = [
        {
          id: '1',
          role: 'user',
          content: 'Hello',
          timestamp: new Date()
        }
      ]

      const expectedResponse = 'Hi there!'
      mockProvider.sendConversation.mockResolvedValue(expectedResponse)

      const config: LLMConfig = {
        model: 'gemini-2.0-flash-exp',
        temperature: 0.5
      }

      const onStreamMock = vi.fn()
      const result = await service.sendConversation(messages, config, onStreamMock)

      expect(mockProvider.sendConversation).toHaveBeenCalledWith(messages, config, onStreamMock)
      expect(result).toBe(expectedResponse)
    })

    it('should handle conversation errors', async () => {
      const messages: LLMMessage[] = [
        { id: '1', role: 'user', content: 'Hello', timestamp: new Date() }
      ]

      const error = new Error('Conversation error')
      mockProvider.sendConversation.mockRejectedValue(error)

      await expect(service.sendConversation(messages)).rejects.toThrow('Conversation error')
    })
  })

  describe('getProviderName', () => {
    it('should return provider name', () => {
      expect(service.getProviderName()).toBe('gemini')
    })
  })
})
