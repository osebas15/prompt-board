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
