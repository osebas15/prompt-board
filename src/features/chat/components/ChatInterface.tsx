import { useState, useRef, useEffect } from 'react';
import { useLLM } from '../../../lib/llm/hooks/useLLM';
import { MessageBubble } from './MessageBubble';
import { ChatInput } from './ChatInput';
import { StreamingMessage } from './StreamingMessage';
import type { LLMMessage, LLMConfig } from '../../../lib/llm/types';

export interface ChatInterfaceProps {
  conversationId?: string;
  promptTemplate?: string;
  config?: LLMConfig;
  onMessageSent?: (message: string, response: string) => void;
  className?: string;
}

export function ChatInterface({ 
  conversationId, 
  promptTemplate, 
  config,
  onMessageSent, 
  className = '' 
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<LLMMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { 
    sendMessage, 
    isLoading, 
    error, 
    streamingResponse, 
    clearError, 
    clearStreaming 
  } = useLLM({
    onError: (error) => {
      console.error('LLM Error:', error);
    }
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingResponse]);

  const handleSendMessage = async (messageContent: string) => {
    const userMessage: LLMMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: messageContent,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    clearError();
    clearStreaming();
    setIsStreaming(true);

    try {
      // Use conversation mode if we have existing messages
      let response: string;
      if (messages.length > 0) {
        response = await sendMessage(messageContent, config, true);
      } else {
        // Apply prompt template if provided for first message
        const finalMessage = promptTemplate 
          ? `${promptTemplate}\n\nUser: ${messageContent}`
          : messageContent;
        response = await sendMessage(finalMessage, config, true);
      }

      // Add assistant response to messages
      const assistantMessage: LLMMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
      onMessageSent?.(messageContent, response);
    } catch (error) {
      console.error('Failed to send message:', error);
      // Add error message
      const errorMessage: LLMMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsStreaming(false);
      clearStreaming();
    }
  };

  const handleCopyMessage = () => {
    // Could show a toast notification here
    console.log('Message copied to clipboard');
  };

  const handleRegenerateResponse = async () => {
    if (messages.length < 2) return;
    
    // Remove the last assistant message
    const messagesWithoutLast = messages.slice(0, -1);
    setMessages(messagesWithoutLast);
    
    // Get the last user message
    const lastUserMessage = messagesWithoutLast[messagesWithoutLast.length - 1];
    if (lastUserMessage?.role === 'user') {
      await handleSendMessage(lastUserMessage.content);
    }
  };

  return (
    <div className={`flex flex-col h-full max-w-4xl mx-auto ${className}`}>
      {/* Chat Header */}
      <div className="border-b bg-white px-4 py-3">
        <h2 className="text-lg font-semibold text-gray-900">
          Chat {conversationId ? `#${conversationId}` : ''}
        </h2>
        {promptTemplate && (
          <p className="text-sm text-gray-600 mt-1">
            Using template: {promptTemplate.slice(0, 100)}...
          </p>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 bg-gray-50">
        {messages.length === 0 && !isStreaming && (
          <div className="text-center text-gray-500 mt-8">
            <p>Start a conversation by typing a message below.</p>
            {promptTemplate && (
              <p className="mt-2 text-sm">Your message will be processed with the selected prompt template.</p>
            )}
          </div>
        )}

        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            onCopy={handleCopyMessage}
            onRegenerate={message.role === 'assistant' ? handleRegenerateResponse : undefined}
          />
        ))}

        {/* Streaming Response */}
        {isStreaming && streamingResponse && (
          <StreamingMessage
            content={streamingResponse}
            isComplete={!isLoading}
          />
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p className="text-red-800 text-sm">{error}</p>
            <button
              onClick={clearError}
              className="text-red-600 hover:text-red-800 text-sm underline mt-2"
            >
              Dismiss
            </button>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input */}
      <ChatInput
        onSend={handleSendMessage}
        disabled={isLoading}
        placeholder={
          messages.length === 0 && promptTemplate
            ? "Type your message (will be processed with the template)..."
            : "Type your message..."
        }
      />
    </div>
  );
}
