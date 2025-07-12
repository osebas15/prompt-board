# Phase 2: Implement Core LLM Architecture

## 2.1 Update GeminiProvider.ts

### Current Issues:
- Using deprecated `@google/generative-ai` package
- Constructor may be missing error handling
- Methods may not handle all edge cases

### New Implementation:
```typescript
import { GoogleGenAI } from '@google/genai';
import type { LLMProvider, LLMMessage, LLMConfig } from '../../types';

export class GeminiProvider implements LLMProvider {
  name = 'gemini';
  private client: GoogleGenAI;

  constructor(apiKey: string) {
    if (!apiKey || apiKey.trim().length === 0) {
      throw new Error('Gemini API key is required and cannot be empty');
    }
    this.client = new GoogleGenAI({ apiKey });
  }

  // Update sendMessage to use new SDK
  // Update sendConversation to use new SDK
  // Add proper error handling and retry logic
}
```

### Key Changes:
- New SDK initialization pattern
- Better input validation
- Updated streaming implementation
- Enhanced error handling

## 2.2 Update LLMService.ts

### Current Issues:
- Missing environment variable validation
- Constructor error handling needs improvement
- Methods should have better error propagation

### Implementation Plan:
```typescript
export class LLMService {
  private provider: LLMProvider;

  constructor() {
    // Support both old and new env var names for compatibility
    const geminiApiKey = import.meta.env.VITE_GOOGLE_API_KEY || 
                        import.meta.env.VITE_GEMINI_API_KEY;
    
    if (!geminiApiKey) {
      throw new Error('API key required: Set VITE_GOOGLE_API_KEY or VITE_GEMINI_API_KEY');
    }
    
    this.provider = new GeminiProvider(geminiApiKey);
  }

  // Add request/response logging
  // Add rate limiting logic
  // Add retry mechanisms
}
```

## 2.3 Update useLLM.ts Hook

### Current Issues:
- Error handling could be more robust
- Loading states need better management
- Streaming state management needs improvement

### Implementation Plan:
```typescript
export function useLLM(options: UseLLMOptions = {}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [streamingResponse, setStreamingResponse] = useState<string>('');
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  // Add abort functionality
  // Improve error state management  
  // Add request/response caching
  // Add typing indicators
}
```

## 2.4 Update Type Definitions

### Files to Update:
- `src/lib/llm/types/index.ts`

### Potential Updates:
```typescript
export interface LLMProvider {
  name: string;
  sendMessage(
    message: string, 
    config?: LLMConfig,
    onStream?: (chunk: string) => void,
    signal?: AbortSignal
  ): Promise<string>;
  
  sendConversation(
    messages: LLMMessage[],
    config?: LLMConfig,
    onStream?: (chunk: string) => void,
    signal?: AbortSignal
  ): Promise<string>;
}

// Add new types for better error handling
export interface LLMError extends Error {
  code?: string;
  statusCode?: number;
  retryAfter?: number;
}
```

## Success Criteria
- [ ] GeminiProvider uses new SDK successfully
- [ ] All methods handle errors gracefully
- [ ] Streaming works with new SDK
- [ ] Unit tests pass for all components
- [ ] TypeScript compilation successful
- [ ] API key validation works properly
