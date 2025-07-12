import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MessageBubble } from '../components/MessageBubble';
import type { LLMMessage } from '../../../lib/llm/types';

// Mock date-fns
vi.mock('date-fns', () => ({
  format: vi.fn(() => '12:34')
}));

// Mock clipboard API
const mockWriteText = vi.fn(() => Promise.resolve());
Object.assign(navigator, {
  clipboard: {
    writeText: mockWriteText
  }
});

describe('MessageBubble', () => {
  const mockUserMessage: LLMMessage = {
    id: '1',
    role: 'user',
    content: 'Hello, how are you?',
    timestamp: new Date('2023-01-01T12:34:00Z')
  };

  const mockAssistantMessage: LLMMessage = {
    id: '2',
    role: 'assistant',
    content: 'Hello! I am doing well, thank you for asking.',
    timestamp: new Date('2023-01-01T12:35:00Z')
  };

  it('should render user message with correct styling', () => {
    render(<MessageBubble message={mockUserMessage} />);
    
    const messageElement = screen.getByText('Hello, how are you?');
    expect(messageElement).toBeInTheDocument();
    
    // Check user message styling (should be on the right)
    const messageContainer = messageElement.closest('.max-w-\\[70\\%\\]');
    expect(messageContainer).toHaveClass('bg-blue-500', 'text-white');
  });

  it('should render assistant message with correct styling', () => {
    render(<MessageBubble message={mockAssistantMessage} />);
    
    const messageElement = screen.getByText('Hello! I am doing well, thank you for asking.');
    expect(messageElement).toBeInTheDocument();
    
    // Check assistant message styling (should be on the left)
    const messageContainer = messageElement.closest('.max-w-\\[70\\%\\]');
    expect(messageContainer).toHaveClass('bg-gray-100', 'text-gray-900');
  });

  it('should display timestamp', () => {
    render(<MessageBubble message={mockUserMessage} />);
    
    expect(screen.getByText('12:34')).toBeInTheDocument();
  });

  it('should show loading indicator when isLoading is true', () => {
    render(<MessageBubble message={mockAssistantMessage} isLoading={true} />);
    
    const loadingIndicator = document.querySelector('.animate-pulse');
    expect(loadingIndicator).toBeInTheDocument();
  });

  it('should handle copy functionality', async () => {
    const onCopyMock = vi.fn();
    render(<MessageBubble message={mockUserMessage} onCopy={onCopyMock} isLoading={false} />);
    
    const copyButton = screen.getByText('Copy');
    await fireEvent.click(copyButton);
    
    expect(mockWriteText).toHaveBeenCalledWith('Hello, how are you?');
    expect(onCopyMock).toHaveBeenCalled();
  });

  it('should show regenerate button for assistant messages', () => {
    const onRegenerateMock = vi.fn();
    render(
      <MessageBubble 
        message={mockAssistantMessage} 
        onRegenerate={onRegenerateMock} 
      />
    );
    
    const regenerateButton = screen.getByText('Regenerate');
    expect(regenerateButton).toBeInTheDocument();
    
    fireEvent.click(regenerateButton);
    expect(onRegenerateMock).toHaveBeenCalled();
  });

  it('should not show regenerate button for user messages', () => {
    const onRegenerateMock = vi.fn();
    render(
      <MessageBubble 
        message={mockUserMessage} 
        onRegenerate={onRegenerateMock} 
      />
    );
    
    expect(screen.queryByText('Regenerate')).not.toBeInTheDocument();
  });

  it('should hide action buttons when loading', () => {
    render(<MessageBubble message={mockUserMessage} isLoading={true} />);
    
    expect(screen.queryByText('Copy')).not.toBeInTheDocument();
  });
});
