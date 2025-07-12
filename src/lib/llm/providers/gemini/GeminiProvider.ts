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

  async sendMessage(
    message: string,
    config?: LLMConfig,
    onStream?: (chunk: string) => void
  ): Promise<string> {
    try {
      if (onStream) {
        // Streaming mode using new SDK
        const response = await this.client.models.generateContentStream({
          model: config?.model || 'gemini-2.0-flash-exp',
          contents: message,
          config: {
            temperature: config?.temperature,
            maxOutputTokens: config?.maxTokens,
            topP: config?.topP,
            topK: config?.topK,
          }
        });

        let fullResponse = '';
        for await (const chunk of response) {
          const chunkText = chunk.text || '';
          fullResponse += chunkText;
          onStream(chunkText);
        }
        
        return fullResponse;
      } else {
        // Non-streaming mode
        const response = await this.client.models.generateContent({
          model: config?.model || 'gemini-2.0-flash-exp',
          contents: message,
          config: {
            temperature: config?.temperature,
            maxOutputTokens: config?.maxTokens,
            topP: config?.topP,
            topK: config?.topK,
          }
        });
        
        return response.text || '';
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Gemini API error:', error);
      throw new Error(`Failed to get response from Gemini: ${errorMessage}`);
    }
  }

  async sendConversation(
    messages: LLMMessage[],
    config?: LLMConfig,
    onStream?: (chunk: string) => void
  ): Promise<string> {
    try {
      // Convert messages to new SDK format
      const contents = messages.map(msg => ({
        role: msg.role === 'assistant' ? 'model' : msg.role,
        parts: [{ text: msg.content }]
      }));

      if (onStream) {
        // Streaming conversation mode
        const response = await this.client.models.generateContentStream({
          model: config?.model || 'gemini-2.0-flash-exp',
          contents,
          config: {
            temperature: config?.temperature,
            maxOutputTokens: config?.maxTokens,
            topP: config?.topP,
            topK: config?.topK,
          }
        });

        let fullResponse = '';
        for await (const chunk of response) {
          const chunkText = chunk.text || '';
          fullResponse += chunkText;
          onStream(chunkText);
        }
        
        return fullResponse;
      } else {
        // Non-streaming conversation mode
        const response = await this.client.models.generateContent({
          model: config?.model || 'gemini-2.0-flash-exp',
          contents,
          config: {
            temperature: config?.temperature,
            maxOutputTokens: config?.maxTokens,
            topP: config?.topP,
            topK: config?.topK,
          }
        });
        
        return response.text || '';
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Gemini conversation error:', error);
      throw new Error(`Failed to continue conversation with Gemini: ${errorMessage}`);
    }
  }
}
