import { describe, it, expect, beforeAll, beforeEach } from 'vitest'
import { GeminiProvider } from '../providers/gemini/GeminiProvider'
import { LLMService } from '../services/LLMService'
import type { LLMMessage, LLMConfig } from '../types'

// Integration tests require a valid API key or mocked responses
// These tests will be skipped in CI unless VITE_GEMINI_API_KEY is set to a test key

const hasValidApiKey = () => {
  const apiKey = import.meta.env.VITE_GOOGLE_API_KEY || 
                import.meta.env.VITE_GEMINI_API_KEY
  return apiKey && apiKey !== 'your_gemini_api_key' && apiKey !== 'your_google_api_key' && apiKey.length > 10
}

describe('LLM Integration Tests', () => {
  let provider: GeminiProvider
  let service: LLMService

  beforeAll(() => {
    if (!hasValidApiKey()) {
      console.warn('Skipping LLM integration tests - no valid API key found')
    }
  })

  beforeEach(() => {
    if (hasValidApiKey()) {
      const apiKey = import.meta.env.VITE_GOOGLE_API_KEY || 
                    import.meta.env.VITE_GEMINI_API_KEY!
      provider = new GeminiProvider(apiKey)
      service = new LLMService()
    }
  })

  describe('GeminiProvider Integration', () => {
    it.skipIf(!hasValidApiKey())('should successfully send a simple message', async () => {
      const response = await provider.sendMessage('Say "Hello, World!" and nothing else.')
      
      expect(response).toBeTruthy()
      expect(typeof response).toBe('string')
      expect(response.length).toBeGreaterThan(0)
    }, 10000) // 10 second timeout for API calls

    it.skipIf(!hasValidApiKey())('should handle streaming responses', async () => {
      const chunks: string[] = []
      
      const response = await provider.sendMessage(
        'Count from 1 to 3, each number on a new line.',
        undefined,
        (chunk) => chunks.push(chunk)
      )

      expect(chunks.length).toBeGreaterThan(0)
      expect(response).toBeTruthy()
      expect(chunks.join('')).toBe(response)
    }, 10000)

    it.skipIf(!hasValidApiKey())('should maintain conversation context', async () => {
      const messages: LLMMessage[] = [
        {
          id: '1',
          role: 'user',
          content: 'My name is Alice. Remember this.',
          timestamp: new Date()
        },
        {
          id: '2',
          role: 'assistant',
          content: 'Hello Alice! I\'ll remember your name.',
          timestamp: new Date()
        },
        {
          id: '3',
          role: 'user',
          content: 'What is my name?',
          timestamp: new Date()
        }
      ]

      const response = await provider.sendConversation(messages)
      
      expect(response.toLowerCase()).toContain('alice')
    }, 15000)

    it.skipIf(!hasValidApiKey())('should apply configuration parameters', async () => {
      const config: LLMConfig = {
        model: 'gemini-2.0-flash-exp',
        temperature: 0.1, // Very low temperature for consistent output
        maxTokens: 50
      }

      const response = await provider.sendMessage(
        'Say exactly: "This is a test response"',
        config
      )

      expect(response).toBeTruthy()
      expect(response.length).toBeLessThan(200) // Should respect token limit roughly
    }, 10000)
  })

  describe('LLMService Integration', () => {
    it.skipIf(!hasValidApiKey())('should delegate to provider correctly', async () => {
      const response = await service.sendMessage('Say "Service test" and nothing else.')
      
      expect(response).toBeTruthy()
      expect(typeof response).toBe('string')
      expect(service.getProviderName()).toBe('gemini')
    }, 10000)

    it.skipIf(!hasValidApiKey())('should handle conversation through service', async () => {
      const messages: LLMMessage[] = [
        {
          id: '1',
          role: 'user',
          content: 'What is 5 + 5?',
          timestamp: new Date()
        }
      ]

      const response = await service.sendConversation(messages)
      
      expect(response).toBeTruthy()
      expect(response.toLowerCase()).toMatch(/10|ten/)
    }, 10000)
  })

  describe('Error Handling Integration', () => {
    it('should handle invalid API keys gracefully', async () => {
      const invalidProvider = new GeminiProvider('invalid-key')
      
      await expect(
        invalidProvider.sendMessage('Hello')
      ).rejects.toThrow(/Failed to get response from Gemini/)
    }, 10000)

    it.skipIf(!hasValidApiKey())('should handle very long messages appropriately', async () => {
      // Create a moderately long message to test token handling without hitting severe limits
      const longMessage = 'Please summarize this repeated text: ' + 'test content '.repeat(100)
      
      // This should either succeed or fail gracefully with a clear error
      try {
        const response = await provider.sendMessage(longMessage)
        expect(response).toBeTruthy()
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect((error as Error).message).toContain('Gemini')
      }
    }, 20000)
  })

  describe('Performance Tests', () => {
    it.skipIf(!hasValidApiKey())('should respond within reasonable time limits', async () => {
      const startTime = Date.now()
      
      await service.sendMessage('Say "Fast response" and nothing else.')
      
      const endTime = Date.now()
      const responseTime = endTime - startTime
      
      // Should respond within 5 seconds for simple queries
      expect(responseTime).toBeLessThan(5000)
    }, 6000)

    it.skipIf(!hasValidApiKey())('should handle concurrent requests', async () => {
      const promises = Array.from({ length: 3 }, (_, i) =>
        service.sendMessage(`Say "Response ${i + 1}" and nothing else.`)
      )

      const responses = await Promise.all(promises)
      
      expect(responses).toHaveLength(3)
      responses.forEach(response => {
        expect(response).toBeTruthy()
        expect(typeof response).toBe('string')
      })
    }, 15000)
  })
})
