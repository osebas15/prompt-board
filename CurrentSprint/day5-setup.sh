#!/bin/bash

# Day 5 Setup Script - LLM Service Integration
# This script sets up Google Gemini API integration and chat components

set -e

echo "🤖 Day 5 Setup: LLM Service Integration"
echo "======================================="

echo "📦 Installing LLM and API dependencies..."

# Install Google Gemini API and related dependencies
npm install --save \
    @google/generative-ai \
    eventsource-parser \
    uuid

echo "📦 Installing additional utilities..."

# Install utilities for API handling and streaming
npm install --save \
    @types/uuid \
    react-use \
    use-debounce

echo "📦 Installing development dependencies..."

# Install testing utilities for API mocking
npm install --save-dev \
    msw \
    @types/eventsource

echo "📁 Creating LLM service structure..."

# Create comprehensive LLM service structure
mkdir -p src/lib/llm/{providers/gemini,providers/base,services,hooks,types,utils,__tests__}
mkdir -p src/features/chat/{components,hooks,types,services,__tests__}

echo "📄 Creating LLM base types and interfaces..."

# Create base LLM types
cat > src/lib/llm/types/index.ts << 'EOF'
// Base LLM types and interfaces
export interface LLMMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface LLMConversation {
  id: string;
  title: string;
  messages: LLMMessage[];
  created_at: Date;
  updated_at: Date;
  metadata?: Record<string, any>;
}

export interface LLMConfig {
  model: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  topK?: number;
  systemPrompt?: string;
}

export interface LLMProvider {
  name: string;
  sendMessage(
    message: string, 
    config?: LLMConfig,
    onStream?: (chunk: string) => void
  ): Promise<string>;
  
  sendConversation(
    messages: LLMMessage[],
    config?: LLMConfig,
    onStream?: (chunk: string) => void
  ): Promise<string>;
}

export interface LLMResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model: string;
  finishReason?: string;
}

export interface StreamingOptions {
  onStart?: () => void;
  onChunk?: (chunk: string) => void;
  onComplete?: (fullResponse: string) => void;
  onError?: (error: Error) => void;
}
EOF

# Create Gemini provider
cat > src/lib/llm/providers/gemini/GeminiProvider.ts << 'EOF'
import { GoogleGenerativeAI } from '@google/generative-ai';
import type { LLMProvider, LLMMessage, LLMConfig, StreamingOptions } from '../../types';

export class GeminiProvider implements LLMProvider {
  name = 'gemini';
  private client: GoogleGenerativeAI;

  constructor(apiKey: string) {
    this.client = new GoogleGenerativeAI(apiKey);
  }

  async sendMessage(
    message: string,
    config?: LLMConfig,
    onStream?: (chunk: string) => void
  ): Promise<string> {
    const model = this.client.getGenerativeModel({ 
      model: config?.model || 'gemini-pro',
      generationConfig: {
        temperature: config?.temperature,
        maxOutputTokens: config?.maxTokens,
        topP: config?.topP,
        topK: config?.topK,
      }
    });

    try {
      if (onStream) {
        const result = await model.generateContentStream(message);
        let fullResponse = '';
        
        for await (const chunk of result.stream) {
          const chunkText = chunk.text();
          fullResponse += chunkText;
          onStream(chunkText);
        }
        
        return fullResponse;
      } else {
        const result = await model.generateContent(message);
        return result.response.text();
      }
    } catch (error) {
      console.error('Gemini API error:', error);
      throw new Error(`Failed to get response from Gemini: ${error.message}`);
    }
  }

  async sendConversation(
    messages: LLMMessage[],
    config?: LLMConfig,
    onStream?: (chunk: string) => void
  ): Promise<string> {
    const model = this.client.getGenerativeModel({ 
      model: config?.model || 'gemini-pro',
      generationConfig: {
        temperature: config?.temperature,
        maxOutputTokens: config?.maxTokens,
        topP: config?.topP,
        topK: config?.topK,
      }
    });

    try {
      // Convert messages to Gemini format
      const history = messages.slice(0, -1).map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }],
      }));

      const chat = model.startChat({ history });
      const lastMessage = messages[messages.length - 1];

      if (onStream) {
        const result = await chat.sendMessageStream(lastMessage.content);
        let fullResponse = '';
        
        for await (const chunk of result.stream) {
          const chunkText = chunk.text();
          fullResponse += chunkText;
          onStream(chunkText);
        }
        
        return fullResponse;
      } else {
        const result = await chat.sendMessage(lastMessage.content);
        return result.response.text();
      }
    } catch (error) {
      console.error('Gemini conversation error:', error);
      throw new Error(`Failed to continue conversation with Gemini: ${error.message}`);
    }
  }
}
EOF

# Create LLM service
cat > src/lib/llm/services/LLMService.ts << 'EOF'
import { GeminiProvider } from '../providers/gemini/GeminiProvider';
import type { LLMProvider, LLMMessage, LLMConfig } from '../types';

export class LLMService {
  private provider: LLMProvider;

  constructor() {
    const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!geminiApiKey) {
      throw new Error('VITE_GEMINI_API_KEY environment variable is required');
    }
    
    this.provider = new GeminiProvider(geminiApiKey);
  }

  async sendMessage(
    message: string,
    config?: LLMConfig,
    onStream?: (chunk: string) => void
  ): Promise<string> {
    return this.provider.sendMessage(message, config, onStream);
  }

  async sendConversation(
    messages: LLMMessage[],
    config?: LLMConfig,
    onStream?: (chunk: string) => void
  ): Promise<string> {
    return this.provider.sendConversation(messages, config, onStream);
  }

  getProviderName(): string {
    return this.provider.name;
  }
}

// Singleton instance
export const llmService = new LLMService();
EOF

# Create conversation types
cat > src/features/chat/types/index.ts << 'EOF'
// Chat feature types
export interface ChatState {
  messages: LLMMessage[];
  isLoading: boolean;
  error: string | null;
  conversationId?: string;
}

export interface SendMessageOptions {
  promptTemplate?: string;
  variables?: Record<string, string>;
  config?: LLMConfig;
  saveToHistory?: boolean;
}

export interface ConversationMetadata {
  title: string;
  description?: string;
  tags: string[];
  model: string;
  tokenCount: number;
  lastActivity: Date;
}
EOF

# Create React hook for LLM
cat > src/lib/llm/hooks/useLLM.ts << 'EOF'
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
EOF

echo "⚙️  Updating environment variables..."

# Add Gemini API key to .env.example
if ! grep -q "VITE_GEMINI_API_KEY" .env.example; then
    echo "" >> .env.example
    echo "# Google Gemini API" >> .env.example
    echo "VITE_GEMINI_API_KEY=your_gemini_api_key" >> .env.example
fi

echo "✅ Day 5 setup complete!"
echo ""
echo "Files created:"
echo "- src/lib/llm/types/index.ts"
echo "- src/lib/llm/providers/gemini/GeminiProvider.ts"
echo "- src/lib/llm/services/LLMService.ts"
echo "- src/features/chat/types/index.ts"
echo "- src/lib/llm/hooks/useLLM.ts"
echo ""
echo "⚠️  Important: Add your Gemini API key to .env.local:"
echo "   VITE_GEMINI_API_KEY=your_actual_api_key"
echo ""
echo "Next steps:"
echo "1. Get Gemini API key from Google AI Studio"
echo "2. Implement chat interface components"
echo "3. Add conversation management"
echo "4. Test LLM integration"
echo ""
echo "Ready for Day 5 development! 🚀"
