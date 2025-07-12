import { useState, useRef, useEffect } from 'react';

export interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
  maxLength?: number;
  className?: string;
}

export function ChatInput({ 
  onSend, 
  disabled = false, 
  placeholder = 'Type your message...', 
  maxLength = 4000,
  className = '' 
}: ChatInputProps) {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  }, [message]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedMessage = message.trim();
    if (trimmedMessage && !disabled) {
      onSend(trimmedMessage);
      setMessage('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (value.length <= maxLength) {
      setMessage(value);
    }
  };

  return (
    <div className={`border-t bg-white p-4 ${className}`}>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            rows={1}
            className={`
              w-full resize-none border border-gray-300 rounded-lg px-3 py-2 
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
              disabled:bg-gray-100 disabled:cursor-not-allowed
              max-h-[200px] overflow-y-auto
            `}
          />
          
          {/* Character count */}
          <div className="absolute bottom-1 right-2 text-xs text-gray-400">
            {message.length}/{maxLength}
          </div>
        </div>

        <button
          type="submit"
          disabled={disabled || !message.trim()}
          className={`
            px-4 py-2 rounded-lg font-medium transition-colors
            ${disabled || !message.trim()
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-500 hover:bg-blue-600 text-white'
            }
          `}
        >
          {disabled ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Sending...
            </div>
          ) : (
            'Send'
          )}
        </button>
      </form>
      
      <div className="text-xs text-gray-500 mt-2">
        Press Enter to send, Shift+Enter for new line
      </div>
    </div>
  );
}
