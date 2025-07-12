# Phase 4: Conversation Management

## 4.1 Database Schema Updates

### Location: `supabase/migrations/`

### New Tables Required:

#### conversations table
```sql
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}',
  
  -- Indexes for performance
  INDEX idx_conversations_user_id ON conversations(user_id),
  INDEX idx_conversations_updated_at ON conversations(updated_at DESC)
);
```

#### conversation_messages table
```sql
CREATE TABLE conversation_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}',
  
  -- Indexes for performance
  INDEX idx_conversation_messages_conversation_id ON conversation_messages(conversation_id),
  INDEX idx_conversation_messages_order ON conversation_messages(conversation_id, order_index)
);
```

### Row Level Security (RLS)
```sql
-- Enable RLS
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_messages ENABLE ROW LEVEL SECURITY;

-- Policies for conversations
CREATE POLICY "Users can view their own conversations" ON conversations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own conversations" ON conversations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own conversations" ON conversations
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own conversations" ON conversations
  FOR DELETE USING (auth.uid() = user_id);

-- Similar policies for conversation_messages
```

## 4.2 ConversationService

### Location: `src/lib/llm/services/ConversationService.ts`

### Purpose:
Database operations for conversation management with caching and real-time updates.

### Implementation Plan:
```typescript
export class ConversationService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = supabase; // Import from lib/supabase
  }

  async createConversation(title: string, description?: string): Promise<string> {
    // Create new conversation record
    // Return conversation ID
  }

  async getConversation(id: string): Promise<LLMConversation | null> {
    // Fetch conversation with messages
    // Handle ordering and pagination
  }

  async updateConversation(id: string, updates: Partial<LLMConversation>): Promise<void> {
    // Update conversation metadata
    // Update timestamps
  }

  async deleteConversation(id: string): Promise<void> {
    // Delete conversation and all messages (CASCADE)
  }

  async addMessage(conversationId: string, message: Omit<LLMMessage, 'id'>): Promise<string> {
    // Add message to conversation
    // Handle order_index automatically
    // Update conversation updated_at
  }

  async getUserConversations(userId: string, limit = 50, offset = 0): Promise<LLMConversation[]> {
    // Get user's conversations with pagination
    // Include message counts and last message preview
  }

  async searchConversations(userId: string, query: string): Promise<LLMConversation[]> {
    // Full-text search across conversations and messages
  }
}
```

## 4.3 useConversation Hook

### Location: `src/lib/llm/hooks/useConversation.ts`

### Purpose:
React hook for conversation state management with real-time updates.

### Implementation Plan:
```typescript
export interface UseConversationOptions {
  conversationId?: string;
  autoSave?: boolean;
  saveInterval?: number; // milliseconds
}

export function useConversation(options: UseConversationOptions = {}) {
  const [conversation, setConversation] = useState<LLMConversation | null>(null);
  const [messages, setMessages] = useState<LLMMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Auto-save functionality
  // Real-time subscription to conversation updates
  // Message management (add, update, delete)
  // Optimistic updates with rollback on error
  // Offline support with sync when online

  return {
    conversation,
    messages,
    isLoading,
    error,
    hasUnsavedChanges,
    createConversation,
    loadConversation,
    addMessage,
    updateMessage,
    deleteMessage,
    saveConversation,
    deleteConversation,
    clearError
  };
}
```

## 4.4 useConversationList Hook

### Location: `src/lib/llm/hooks/useConversationList.ts`

### Purpose:
Hook for managing list of user conversations with search and pagination.

### Implementation Plan:
```typescript
export function useConversationList() {
  const [conversations, setConversations] = useState<LLMConversation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Infinite scroll pagination
  // Real-time updates via Supabase subscriptions
  // Search functionality with debouncing
  // Optimistic updates for better UX

  return {
    conversations,
    isLoading,
    error,
    hasMore,
    searchQuery,
    setSearchQuery,
    loadMore,
    refresh,
    clearError
  };
}
```

## 4.5 Context Management Integration

### Integration with Prompt Templates:
- Link conversations to specific prompt templates
- Store template variables used in conversation metadata
- Enable conversation replication with different templates

### Integration with User Context:
- Automatic conversation title generation from first message
- Tagging and categorization system
- Export/import functionality for conversations

## 4.6 Real-time Features

### Supabase Realtime Integration:
```typescript
// Subscribe to conversation updates
const subscription = supabase
  .channel('conversations')
  .on('postgres_changes', 
    { 
      event: 'INSERT', 
      schema: 'public', 
      table: 'conversation_messages',
      filter: `conversation_id=eq.${conversationId}`
    }, 
    (payload) => {
      // Handle new message in real-time
    }
  )
  .subscribe();
```

### Collaboration Features (Future):
- Multiple users can view same conversation
- Typing indicators for other users
- Real-time message updates

## Success Criteria
- [ ] Database schema created and deployed
- [ ] RLS policies properly secure data
- [ ] ConversationService handles all CRUD operations
- [ ] useConversation hook manages state correctly
- [ ] Real-time updates work smoothly
- [ ] Search functionality is fast and accurate
- [ ] Pagination handles large conversation lists
- [ ] Auto-save prevents data loss
- [ ] Offline support with sync capability
