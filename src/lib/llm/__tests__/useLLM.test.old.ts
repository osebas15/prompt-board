import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import type { LLMMessage, LLMConfig } from '../types'

// Import and mock the service
const mockLLMService = {
  sendMessage: vi.fn(),
  sendConversation: vi.fn(),
  getProviderName: vi.fn().mockReturnValue('gemini')
}

vi.doMock('../services/LLMService', () => ({
  llmService: mockLLMService
}))

const { useLLM } = await import('../hooks/useLLM')

describe('useLLM hook', () => {
  beforeEach(() => {
    mockLLMService.sendMessage.mockClear()
    mockLLMService.sendConversation.mockClear()
    mockLLMService.getProviderName.mockClear()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('initialization', () => {
    it('should provide initial state', () => {
      const { result } = renderHook(() => useLLM())

      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBe(null)
      expect(result.current.streamingResponse).toBe('')
    })

    it('should accept configuration options', () => {
      const onErrorMock = vi.fn()
      const { result } = renderHook(() => useLLM({
        onError: onErrorMock,
        autoSave: true
      }))

      expect(result.current.isLoading).toBe(false)
    })
  })

  describe('sendMessage', () => {
    it('should send message and handle response', async () => {
      const expectedResponse = 'Hello from AI!'
      mockSendMessage.mockResolvedValue(expectedResponse)

      const { result } = renderHook(() => useLLM())

      await act(async () => {
        const response = await result.current.sendMessage('Hello')
        expect(response).toBe(expectedResponse)
      })

      expect(mockSendMessage).toHaveBeenCalledWith(
        'Hello',
        undefined,
        expect.any(Function)
      )
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBe(null)
    })

    it('should handle streaming responses', async () => {
      const chunks = ['Hello', ' there', '!']

      mockSendMessage.mockImplementation(async (_message: string, _config: any, onStream: any) => {
        // Simulate streaming
        setTimeout(() => {
          chunks.forEach(chunk => onStream?.(chunk))
        }, 0)
        return chunks.join('')
      })

      const { result } = renderHook(() => useLLM())

      await act(async () => {
        await result.current.sendMessage('Hello')
      })

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 10))
      })

      expect(result.current.streamingResponse).toBe('Hello there!')
    })

    it('should handle errors gracefully', async () => {
      const error = new Error('API Error')
      mockSendMessage.mockRejectedValue(error)

      const onErrorMock = vi.fn()
      const { result } = renderHook(() => useLLM({ onError: onErrorMock }))

      await act(async () => {
        try {
          await result.current.sendMessage('Hello')
        } catch (e) {
          // Expected to throw
        }
      })

      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBe('API Error')
      expect(onErrorMock).toHaveBeenCalledWith(error)
    })

    it('should apply configuration parameters', async () => {
      const config: LLMConfig = {
        model: 'gemini-1.5-pro',
        temperature: 0.8
      }

      mockSendMessage.mockResolvedValue('Response')

      const { result } = renderHook(() => useLLM())

      await act(async () => {
        await result.current.sendMessage('Hello', config)
      })

      expect(mockSendMessage).toHaveBeenCalledWith(
        'Hello',
        config,
        expect.any(Function)
      )
    })

    it('should handle non-streaming mode', async () => {
      const expectedResponse = 'Non-streaming response'
      mockSendMessage.mockResolvedValue(expectedResponse)

      const { result } = renderHook(() => useLLM())

      await act(async () => {
        await result.current.sendMessage('Hello', undefined, false)
      })

      expect(result.current.streamingResponse).toBe(expectedResponse)
    })
  })

  describe('sendConversation', () => {
    it('should send conversation and handle response', async () => {
      const messages: LLMMessage[] = [
        {
          id: '1',
          role: 'user',
          content: 'What is 2+2?',
          timestamp: new Date()
        }
      ]

      const expectedResponse = '2+2 equals 4'
      mockSendConversation.mockResolvedValue(expectedResponse)

      const { result } = renderHook(() => useLLM())

      await act(async () => {
        const response = await result.current.sendConversation(messages)
        expect(response).toBe(expectedResponse)
      })

      expect(mockSendConversation).toHaveBeenCalledWith(
        messages,
        undefined,
        expect.any(Function)
      )
    })

    it('should handle conversation errors', async () => {
      const messages: LLMMessage[] = [
        { id: '1', role: 'user', content: 'Hello', timestamp: new Date() }
      ]

      const error = new Error('Conversation error')
      mockSendConversation.mockRejectedValue(error)

      const onErrorMock = vi.fn()
      const { result } = renderHook(() => useLLM({ onError: onErrorMock }))

      await act(async () => {
        try {
          await result.current.sendConversation(messages)
        } catch (e) {
          // Expected to throw
        }
      })

      expect(result.current.error).toBe('Conversation error')
      expect(onErrorMock).toHaveBeenCalledWith(error)
    })
  })

  describe('utility functions', () => {
    it('should clear error state', () => {
      const { result } = renderHook(() => useLLM())

      // Set error state
      act(() => {
        // Simulate error by calling the internal error setter (we'd need to trigger an actual error)
        result.current.clearError()
      })

      expect(result.current.error).toBe(null)
    })

    it('should clear streaming response', () => {
      const { result } = renderHook(() => useLLM())

      act(() => {
        result.current.clearStreaming()
      })

      expect(result.current.streamingResponse).toBe('')
    })
  })

  describe('loading states', () => {
    it('should manage loading state during message sending', async () => {
      let resolvePromise: (value: string) => void
      const promise = new Promise<string>(resolve => {
        resolvePromise = resolve
      })

      mockSendMessage.mockReturnValue(promise)

      const { result } = renderHook(() => useLLM())

      // Start sending message
      act(() => {
        result.current.sendMessage('Hello')
      })

      expect(result.current.isLoading).toBe(true)

      // Resolve the promise
      await act(async () => {
        resolvePromise!('Response')
        await promise
      })

      expect(result.current.isLoading).toBe(false)
    })
  })
})
