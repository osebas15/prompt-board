# Phase 5: Integration Testing and Validation

## 5.1 Fix Unit Tests

### Update Test Mocks for New SDK

#### Update `geminiProvider.test.ts`:
```typescript
// Replace old GoogleGenerativeAI mock with new GoogleGenAI mock
vi.mock('@google/genai', () => ({
  GoogleGenAI: vi.fn().mockImplementation(() => ({
    models: {
      generateContent: vi.fn(),
      generateContentStream: vi.fn()
    }
  }))
}))
```

#### Update `llmService.test.ts`:
```typescript
// Fix module path and mock structure
// Update environment variable mocking
// Test new error handling patterns
```

#### Update `useLLM.test.ts`:
```typescript
// Fix React Testing Library setup
// Update mock patterns for new hooks
// Test streaming functionality properly
```

### Add New Test Cases:
- API key validation edge cases
- Network error handling and retries
- Rate limiting responses
- Streaming interruption scenarios
- Conversation context management

## 5.2 Integration Tests

### LLM Service Integration Tests
```typescript
// File: src/lib/llm/__tests__/llm.integration.test.ts

describe('LLM Service Integration', () => {
  // Test with real API (conditional on API key)
  // Test streaming with actual Gemini responses
  // Test conversation continuity
  // Test error scenarios (rate limits, invalid requests)
  // Test performance benchmarks
})
```

### Chat Component Integration Tests
```typescript
// File: src/features/chat/__tests__/chat.integration.test.ts

describe('Chat Integration', () => {
  // Test full user flow: input → LLM → response → display
  // Test streaming message display
  // Test conversation persistence
  // Test error recovery
  // Test offline/online transitions
})
```

### Database Integration Tests
```typescript
// File: src/lib/llm/__tests__/conversation.integration.test.ts

describe('Conversation Management Integration', () => {
  // Test conversation CRUD with real Supabase instance
  // Test real-time subscription updates
  // Test RLS policy enforcement
  // Test search functionality
  // Test pagination with large datasets
})
```

## 5.3 Performance Testing

### Response Time Benchmarks
```typescript
describe('Performance Tests', () => {
  it('should respond to simple prompts within 3 seconds', async () => {
    const startTime = performance.now();
    await llmService.sendMessage('Hello');
    const endTime = performance.now();
    expect(endTime - startTime).toBeLessThan(3000);
  });

  it('should start streaming within 500ms', async () => {
    const startTime = performance.now();
    let firstChunkTime: number;
    
    await llmService.sendMessage('Tell me a story', undefined, () => {
      if (!firstChunkTime) {
        firstChunkTime = performance.now();
      }
    });
    
    expect(firstChunkTime - startTime).toBeLessThan(500);
  });
})
```

### Memory and Resource Usage
```typescript
describe('Resource Usage Tests', () => {
  it('should handle 100 concurrent conversations without memory leaks', async () => {
    // Test multiple simultaneous conversations
    // Monitor memory usage
    // Ensure cleanup after conversations end
  });

  it('should handle very long conversations efficiently', async () => {
    // Test conversation with 1000+ messages
    // Ensure pagination works properly
    // Test performance doesn't degrade
  });
})
```

## 5.4 Error Handling Validation

### Network Error Scenarios
```typescript
describe('Error Handling', () => {
  it('should handle network timeouts gracefully', async () => {
    // Mock network timeout
    // Verify user-friendly error message
    // Test retry mechanism
  });

  it('should handle API rate limits with backoff', async () => {
    // Mock 429 rate limit response
    // Verify exponential backoff
    // Test user notification
  });

  it('should handle invalid API responses', async () => {
    // Mock malformed API response
    // Verify error parsing
    // Test fallback behavior
  });
})
```

### User Experience Error Testing
```typescript
describe('UX Error Handling', () => {
  it('should show clear error messages to users', async () => {
    // Test various error conditions
    // Verify error messages are user-friendly
    // Test error recovery options
  });

  it('should maintain conversation state during errors', async () => {
    // Simulate error during conversation
    // Verify previous messages remain
    // Test ability to retry/continue
  });
})
```

## 5.5 End-to-End Testing

### User Journey Tests
```typescript
describe('Complete User Journeys', () => {
  it('should complete full conversation flow', async () => {
    // 1. User opens chat interface
    // 2. User types message
    // 3. Message sent to LLM
    // 4. Streaming response displays
    // 5. Conversation saves to database
    // 6. User can view conversation history
  });

  it('should handle prompt template integration', async () => {
    // 1. User selects prompt template
    // 2. Variables are substituted
    // 3. Template sent to LLM
    // 4. Response relates to template context
  });
})
```

### Accessibility Testing
```typescript
describe('Accessibility', () => {
  it('should be navigable with keyboard only', async () => {
    // Test tab navigation
    // Test keyboard shortcuts
    // Test screen reader compatibility
  });

  it('should meet WCAG 2.1 AA standards', async () => {
    // Test color contrast
    // Test focus indicators
    // Test alternative text
  });
})
```

## 5.6 Security Testing

### Input Validation
```typescript
describe('Security Tests', () => {
  it('should sanitize user inputs', async () => {
    // Test XSS prevention
    // Test injection attacks
    // Test malformed input handling
  });

  it('should protect API keys', async () => {
    // Test API key is not exposed in responses
    // Test environment variable security
    // Test client-side key protection
  });
})
```

### Data Privacy
```typescript
describe('Privacy Tests', () => {
  it('should enforce conversation privacy', async () => {
    // Test RLS policies
    // Test user data isolation
    // Test conversation access controls
  });
})
```

## 5.7 Test Automation and CI/CD

### GitHub Actions Integration
```yaml
# .github/workflows/llm-tests.yml
name: LLM Integration Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        # Supabase test database setup
    
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
      - name: Install dependencies
        run: npm ci
      - name: Run unit tests
        run: npm run test:run
      - name: Run integration tests
        run: npm run test:integration:run
        env:
          VITE_GEMINI_API_KEY: ${{ secrets.GEMINI_TEST_API_KEY }}
```

### Test Coverage Requirements
- Unit tests: 90% coverage minimum
- Integration tests: Cover all critical paths
- E2E tests: Cover primary user journeys
- Performance tests: Meet established benchmarks

## Success Criteria
- [ ] All unit tests pass with updated mocks
- [ ] Integration tests cover full LLM flow
- [ ] Performance meets established benchmarks
- [ ] Error handling provides clear user feedback
- [ ] Security tests validate data protection
- [ ] Accessibility requirements met
- [ ] CI/CD pipeline runs all tests successfully
- [ ] Test coverage meets minimum thresholds
- [ ] No memory leaks or resource issues
- [ ] Real-time features work reliably
