import { format } from 'date-fns';
import type { LLMMessage } from '../../../lib/llm/types';

export interface MessageBubbleProps {
  message: LLMMessage;
  isLoading?: boolean;
  onCopy?: () => void;
  onRegenerate?: () => void;
  className?: string;
}

export function MessageBubble({ 
  message, 
  isLoading = false, 
  onCopy, 
  onRegenerate, 
  className = '' 
}: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      onCopy?.();
    } catch (error) {
      console.error('Failed to copy message:', error);
    }
  };

  return (
    <div
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4 ${className}`}
    >
      <div
        className={`max-w-[70%] rounded-lg px-4 py-2 ${
          isUser
            ? 'bg-blue-500 text-white ml-auto'
            : 'bg-gray-100 text-gray-900 mr-auto'
        }`}
      >
        {/* Message Content */}
        <div className="whitespace-pre-wrap break-words">
          {message.content}
          {isLoading && isAssistant && (
            <span className="inline-block w-2 h-2 bg-gray-400 rounded-full animate-pulse ml-2" />
          )}
        </div>

        {/* Timestamp */}
        <div
          className={`text-xs mt-1 ${
            isUser ? 'text-blue-100' : 'text-gray-500'
          }`}
        >
          {format(message.timestamp, 'HH:mm')}
        </div>

        {/* Message Actions */}
        {!isLoading && (
          <div className="flex gap-2 mt-2">
            <button
              onClick={handleCopy}
              className={`text-xs px-2 py-1 rounded ${
                isUser
                  ? 'bg-blue-400 hover:bg-blue-300 text-white'
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
              }`}
              title="Copy message"
            >
              Copy
            </button>
            {isAssistant && onRegenerate && (
              <button
                onClick={onRegenerate}
                className="text-xs px-2 py-1 rounded bg-gray-200 hover:bg-gray-300 text-gray-700"
                title="Regenerate response"
              >
                Regenerate
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
