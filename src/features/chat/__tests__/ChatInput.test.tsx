import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ChatInput } from '../components/ChatInput';

describe('ChatInput', () => {
  it('should render with default props', () => {
    const onSendMock = vi.fn();
    render(<ChatInput onSend={onSendMock} />);
    
    const textarea = screen.getByPlaceholderText('Type your message...');
    expect(textarea).toBeInTheDocument();
    
    const sendButton = screen.getByText('Send');
    expect(sendButton).toBeInTheDocument();
  });

  it('should handle text input', () => {
    const onSendMock = vi.fn();
    render(<ChatInput onSend={onSendMock} />);
    
    const textarea = screen.getByPlaceholderText('Type your message...');
    fireEvent.change(textarea, { target: { value: 'Hello world' } });
    
    expect(textarea).toHaveValue('Hello world');
  });

  it('should send message on form submit', () => {
    const onSendMock = vi.fn();
    render(<ChatInput onSend={onSendMock} />);
    
    const textarea = screen.getByPlaceholderText('Type your message...');
    const sendButton = screen.getByText('Send');
    
    fireEvent.change(textarea, { target: { value: 'Test message' } });
    fireEvent.click(sendButton);
    
    expect(onSendMock).toHaveBeenCalledWith('Test message');
    expect(textarea).toHaveValue(''); // Should clear after sending
  });

  it('should send message on Enter key press', () => {
    const onSendMock = vi.fn();
    render(<ChatInput onSend={onSendMock} />);
    
    const textarea = screen.getByPlaceholderText('Type your message...');
    
    fireEvent.change(textarea, { target: { value: 'Test message' } });
    fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: false });
    
    expect(onSendMock).toHaveBeenCalledWith('Test message');
    expect(textarea).toHaveValue(''); // Should clear after sending
  });

  it('should not send message on Shift+Enter', () => {
    const onSendMock = vi.fn();
    render(<ChatInput onSend={onSendMock} />);
    
    const textarea = screen.getByPlaceholderText('Type your message...');
    
    fireEvent.change(textarea, { target: { value: 'Test message' } });
    fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: true });
    
    expect(onSendMock).not.toHaveBeenCalled();
    expect(textarea).toHaveValue('Test message'); // Should not clear
  });

  it('should disable input when disabled prop is true', () => {
    const onSendMock = vi.fn();
    render(<ChatInput onSend={onSendMock} disabled={true} />);
    
    const textarea = screen.getByPlaceholderText('Type your message...');
    const sendButton = screen.getByRole('button', { name: /sending/i });
    
    expect(textarea).toBeDisabled();
    expect(sendButton).toBeDisabled();
  });

  it('should not send empty messages', () => {
    const onSendMock = vi.fn();
    render(<ChatInput onSend={onSendMock} />);
    
    const sendButton = screen.getByText('Send');
    
    // Try to send with empty message
    fireEvent.click(sendButton);
    expect(onSendMock).not.toHaveBeenCalled();
    
    // Try to send with only whitespace
    const textarea = screen.getByPlaceholderText('Type your message...');
    fireEvent.change(textarea, { target: { value: '   ' } });
    fireEvent.click(sendButton);
    expect(onSendMock).not.toHaveBeenCalled();
  });

  it('should respect maxLength prop', () => {
    const onSendMock = vi.fn();
    render(<ChatInput onSend={onSendMock} maxLength={10} />);
    
    const textarea = screen.getByPlaceholderText('Type your message...') as HTMLTextAreaElement;
    
    // Try to enter text longer than maxLength
    fireEvent.change(textarea, { target: { value: 'This is a very long message' } });
    
    // Should be truncated to maxLength
    expect(textarea.value.length).toBeLessThanOrEqual(10);
  });

  it('should display character count', () => {
    const onSendMock = vi.fn();
    render(<ChatInput onSend={onSendMock} maxLength={100} />);
    
    const textarea = screen.getByPlaceholderText('Type your message...');
    fireEvent.change(textarea, { target: { value: 'Hello' } });
    
    expect(screen.getByText('5/100')).toBeInTheDocument();
  });

  it('should show custom placeholder', () => {
    const onSendMock = vi.fn();
    const customPlaceholder = 'Enter your custom message...';
    render(<ChatInput onSend={onSendMock} placeholder={customPlaceholder} />);
    
    expect(screen.getByPlaceholderText(customPlaceholder)).toBeInTheDocument();
  });
});
