import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useLLM } from '../hooks/useLLM'
import type { LLMMessage } from '../types'

// Create hoisted mock functions
const mockSendMessage = vi.hoisted(() => vi.fn())
const mockSendConversation = vi.hoisted(() => vi.fn())

// Mock the LLM service
vi.mock('../services/LLMService', () => ({
  llmService: {
    sendMessage: mockSendMessage,
    sendConversation: mockSendConversation,
    getProviderName: () => 'gemini'
  }
}))

describe('useLLM hook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('initialization', () => {
    it('should provide initial state', () => {
      const { result } = renderHook(() => useLLM())

      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBe(null)
      expect(result.current.streamingResponse).toBe('')
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

    it('should handle errors gracefully', async () => {
      const error = new Error('API Error')
      mockSendMessage.mockRejectedValue(error)

      const onErrorMock = vi.fn()
      const { result } = renderHook(() => useLLM({ onError: onErrorMock }))

      await act(async () => {
        await expect(result.current.sendMessage('Hello')).rejects.toThrow('API Error')
      })

      expect(result.current.error).toBe('API Error')
      expect(onErrorMock).toHaveBeenCalledWith(error)
      expect(result.current.isLoading).toBe(false)
    })
  })

  describe('sendConversation', () => {
    it('should send conversation and handle response', async () => {
      const messages: LLMMessage[] = [
        { id: '1', role: 'user', content: 'Hello', timestamp: new Date() }
      ]
      const expectedResponse = 'Hello there!'
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
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBe(null)
    })
  })

  describe('utility functions', () => {
    it('should clear error state', () => {
      const { result } = renderHook(() => useLLM())

      act(() => {
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
})
