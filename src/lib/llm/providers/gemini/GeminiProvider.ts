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
