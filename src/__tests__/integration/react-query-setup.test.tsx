import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@/test/utils/testUtils';
import { usePrompts } from '@/features/prompts/hooks/usePrompts';
import { promptService } from '@/features/prompts/services/PromptService';
import React from 'react';

import { vi, describe, it, beforeEach, afterEach, expect } from 'vitest';
vi.mock('@/features/prompts/services/PromptService', () => {
  const actual = vi.importActual('@/features/prompts/services/PromptService');
  return {
    ...actual,
    promptService: {
      // Cast to unknown first, then to the expected shape for mock compatibility
      ...(actual as unknown as { promptService: object }).promptService,
      listPrompts: vi.fn(),
    },
  };
});

function PromptsList() {
  const { data, isLoading, isError } = usePrompts();
  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Error!</div>;
  return (
    <ul>
      {data?.data.map((prompt) => (
        <li key={prompt.id}>{prompt.title}</li>
      ))}
    </ul>
  );
}

describe('React Query Integration', () => {
  const fakePrompts = [
    { id: '1', title: 'Integration Test Prompt', content: '', category: null, tags: [], is_public: false, user_id: 'user1', created_at: new Date().toISOString(), updated_at: new Date().toISOString(), usage_count: 0, version: 1 },
  ];
  const fakePagination = { page: 1, limit: 10, total: 1, total_pages: 1, has_next: false, has_prev: false };

  beforeEach(() => {
    (promptService.listPrompts as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ data: fakePrompts, pagination: fakePagination, success: true });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should configure query client properly', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          staleTime: 5 * 60 * 1000,
          cacheTime: 10 * 60 * 1000,
        },
        mutations: {
          retry: 1,
        },
      },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <PromptsList />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Integration Test Prompt')).toBeInTheDocument();
    });
  });

  it('should handle query invalidation across hooks', () => {
    // TODO: Implement cache invalidation integration test
  });
  it('should manage cache persistence', () => {
    // TODO: Implement cache persistence test
  });
  it('should handle network status changes', () => {
    // TODO: Implement offline/online behavior test
  });
  it('should implement proper error boundaries', () => {
    // TODO: Implement error boundary integration test
  });
});
