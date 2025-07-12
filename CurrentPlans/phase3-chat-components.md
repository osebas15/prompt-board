# Phase 3: Create Chat Components

## 3.1 ChatInterface Component

### Location: `src/features/chat/components/ChatInterface.tsx`

### Purpose:
Main container component for the chat experience with message history, input, and real-time updates.

### Features:
- Message history display
- Real-time streaming responses
- Loading and error states
- Auto-scroll to latest message
- Message actions (copy, regenerate)

### Implementation Plan:
```typescript
export interface ChatInterfaceProps {
  conversationId?: string;
  promptTemplate?: string;
  onMessageSent?: (message: string, response: string) => void;
  className?: string;
}

export function ChatInterface({ conversationId, promptTemplate, onMessageSent, className }: ChatInterfaceProps) {
  // State management for messages, loading, errors
  // Integration with useLLM hook
  // Integration with useConversation hook
  // Auto-scroll functionality
  // Keyboard shortcuts (Enter to send, Shift+Enter for new line)
}
```

## 3.2 MessageBubble Component

### Location: `src/features/chat/components/MessageBubble.tsx`

### Purpose:
Individual message display with role-based styling and actions.

### Features:
- User vs Assistant message styling
- Markdown rendering for assistant responses
- Copy to clipboard functionality
- Timestamp display
- Message actions menu
- Loading/typing indicators

### Implementation Plan:
```typescript
export interface MessageBubbleProps {
  message: LLMMessage;
  isStreaming?: boolean;
  onCopy?: () => void;
  onRegenerate?: () => void;
  onEdit?: (newContent: string) => void;
  className?: string;
}

export function MessageBubble({ message, isStreaming, onCopy, onRegenerate, onEdit, className }: MessageBubbleProps) {
  // Role-based styling (user vs assistant)
  // Markdown rendering for code blocks, lists, etc.
  // Copy button with success feedback
  // Action menu with edit/regenerate options
  // Streaming text animation
}
```

## 3.3 ChatInput Component

### Location: `src/features/chat/components/ChatInput.tsx`

### Purpose:
Message input with prompt template support and enhanced UX.

### Features:
- Multi-line text input with auto-resize
- Prompt template variable substitution
- Send button with loading state
- Character/token count display
- Keyboard shortcuts
- Paste handling for files/images

### Implementation Plan:
```typescript
export interface ChatInputProps {
  onSendMessage: (message: string, config?: LLMConfig) => Promise<void>;
  isLoading?: boolean;
  placeholder?: string;
  promptTemplate?: string;
  maxLength?: number;
  className?: string;
}

export function ChatInput({ onSendMessage, isLoading, placeholder, promptTemplate, maxLength, className }: ChatInputProps) {
  // Auto-resizing textarea
  // Template variable detection and substitution
  // Character count with warnings
  // Submit handling (Enter vs Shift+Enter)
  // File upload integration (future feature)
}
```

## 3.4 StreamingMessage Component

### Location: `src/features/chat/components/StreamingMessage.tsx`

### Purpose:
Real-time display of streaming LLM responses with smooth animations.

### Features:
- Character-by-character streaming display
- Smooth typing animation
- Cursor blinking effect
- Markdown rendering as content streams
- Stream interruption handling

### Implementation Plan:
```typescript
export interface StreamingMessageProps {
  content: string;
  isComplete: boolean;
  speed?: number; // Characters per second for animation
  className?: string;
}

export function StreamingMessage({ content, isComplete, speed = 30, className }: StreamingMessageProps) {
  // Animated text display with typing effect
  // Real-time markdown parsing and rendering
  // Cursor animation that disappears when complete
  // Smooth scrolling as content grows
}
```

## 3.5 Supporting Components

### MessageActions Component
```typescript
// Location: src/features/chat/components/MessageActions.tsx
// Copy, regenerate, edit functionality
```

### TypingIndicator Component  
```typescript
// Location: src/features/chat/components/TypingIndicator.tsx
// Animated dots showing LLM is thinking
```

### ConversationList Component
```typescript
// Location: src/features/chat/components/ConversationList.tsx
// Sidebar for conversation history
```

## 3.6 Styling and Responsive Design

### Tailwind CSS Classes:
- Mobile-first responsive design
- Dark mode support
- Smooth animations and transitions
- Accessible color contrast
- Focus states for keyboard navigation

### Key Design Elements:
- Clean, modern chat interface
- Clear visual distinction between user/assistant messages  
- Smooth scrolling and animations
- Loading states that don't block the UI
- Error states with retry options

## Success Criteria
- [ ] Chat interface displays messages correctly
- [ ] Streaming animation works smoothly
- [ ] Message actions (copy, regenerate) function
- [ ] Input handles keyboard shortcuts properly
- [ ] Responsive design works on mobile/desktop
- [ ] Accessibility requirements met
- [ ] Integration with LLM service successful
