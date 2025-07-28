// Base LLM types and interfaces

// Define more specific types for LLM metadata
export type LLMMetadataValue = string | number | boolean | null;
export type LLMMetadata = Record<string, LLMMetadataValue>;

export interface LLMMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: LLMMetadata;
}

export interface LLMConversation {
  id: string;
  title: string;
  messages: LLMMessage[];
  created_at: Date;
  updated_at: Date;
  metadata?: LLMMetadata;
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
