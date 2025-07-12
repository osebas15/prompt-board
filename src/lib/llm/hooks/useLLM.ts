import { useState, useCallback } from 'react';
import { llmService } from '../services/LLMService';
import type { LLMMessage, LLMConfig } from '../types';

export interface UseLLMOptions {
  onError?: (error: Error) => void;
  autoSave?: boolean;
}

export function useLLM(options: UseLLMOptions = {}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [streamingResponse, setStreamingResponse] = useState<string>('');

  const sendMessage = useCallback(async (
    message: string,
    config?: LLMConfig,
    enableStreaming: boolean = true
  ): Promise<string> => {
    setIsLoading(true);
    setError(null);
    setStreamingResponse('');

    try {
      const onStream = enableStreaming ? (chunk: string) => {
        setStreamingResponse(prev => prev + chunk);
      } : undefined;

      const response = await llmService.sendMessage(message, config, onStream);
      
      if (!enableStreaming) {
        setStreamingResponse(response);
      }
      
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      options.onError?.(err instanceof Error ? err : new Error(errorMessage));
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [options]);

  const sendConversation = useCallback(async (
    messages: LLMMessage[],
    config?: LLMConfig,
    enableStreaming: boolean = true
  ): Promise<string> => {
    setIsLoading(true);
    setError(null);
    setStreamingResponse('');

    try {
      const onStream = enableStreaming ? (chunk: string) => {
        setStreamingResponse(prev => prev + chunk);
      } : undefined;

      const response = await llmService.sendConversation(messages, config, onStream);
      
      if (!enableStreaming) {
        setStreamingResponse(response);
      }
      
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      options.onError?.(err instanceof Error ? err : new Error(errorMessage));
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [options]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const clearStreaming = useCallback(() => {
    setStreamingResponse('');
  }, []);

  return {
    sendMessage,
    sendConversation,
    isLoading,
    error,
    streamingResponse,
    clearError,
    clearStreaming,
  };
}
