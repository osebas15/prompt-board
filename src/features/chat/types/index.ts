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
