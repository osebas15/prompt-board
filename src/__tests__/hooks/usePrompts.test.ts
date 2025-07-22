
import React from 'react';
import { vi } from 'vitest';

vi.mock('@/features/prompts/services/PromptService', () => {
  const actual = vi.importActual('@/features/prompts/services/PromptService');
  return {
    ...actual,
    promptService: {
      ...(actual as any).promptService,
      listPrompts: vi.fn(),
    },
  };
});

import { renderHook, waitFor } from '@/test/utils/testUtils';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { usePrompts } from '@/features/prompts/hooks/usePrompts';
import { promptService } from '@/features/prompts/services/PromptService';


describe('usePrompts Hook', () => {
  const fakePrompts = [
    { id: '1', title: 'Test Prompt', content: 'Test content', category: null, tags: [], is_public: false, user_id: 'user1', created_at: new Date().toISOString(), updated_at: new Date().toISOString(), usage_count: 0, version: 1 },
  ];
  const fakePagination = { page: 1, limit: 10, total: 1, total_pages: 1, has_next: false, has_prev: false };

  function createWrapper() {
    const queryClient = new QueryClient();
    return function Wrapper({ children }: { children: React.ReactNode }) {
      return React.createElement(QueryClientProvider, { client: queryClient }, children);
    };
  }

  beforeEach(() => {
    vi.clearAllMocks();
    (promptService.listPrompts as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ data: fakePrompts, pagination: fakePagination, success: true });
  });

  it('should fetch prompts for current user', async () => {
    const { result } = renderHook(() => usePrompts(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data?.data).toHaveLength(1);
    expect(result.current.data?.data[0].title).toBe('Test Prompt');
  });

  it('should apply filters and pagination', async () => {
    const filters = { category: 'work' };
    const pagination = { page: 2, limit: 10, sort_by: 'created_at' as const, sort_order: 'desc' as const };
    (promptService.listPrompts as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ data: [], pagination: { ...fakePagination, page: 2 }, success: true });

    const { result } = renderHook(() => usePrompts(filters, pagination), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    expect(result.current.data?.pagination.page).toBe(2);
  });

  it('should handle loading and error states', async () => {
    vi.clearAllMocks();
    (promptService.listPrompts as unknown as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('API Error'));

    const { result } = renderHook(() => usePrompts({}, undefined, { gcTime: 0, retry: false }), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });

  it('should cache results appropriately', () => {
    // TODO: Implement cache test
  });
  it('should invalidate cache on data changes', () => {
    // TODO: Implement cache invalidation test
  });
  it('should retry failed requests', () => {
    // TODO: Implement retry logic test
  });
});
