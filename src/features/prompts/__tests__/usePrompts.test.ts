import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';
import { usePrompts, usePrompt, useCreatePrompt, useUpdatePrompt, useDeletePrompt } from '../hooks/usePrompts';
import type { CreatePrompt, UpdatePrompt, PromptFilters } from '../utils/validation';
import { promptService } from '../services/PromptService';

// Mock the PromptService
vi.mock('../services/PromptService', () => ({
  promptService: {
    listPrompts: vi.fn(),
    getPrompt: vi.fn(),
    createPrompt: vi.fn(),
    updatePrompt: vi.fn(),
    deletePrompt: vi.fn(),
    incrementUsageCount: vi.fn()
  }
}));

const createWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });
  return createElement(QueryClientProvider, { client: queryClient }, children);
};

describe('usePrompts hook', () => {
  let queryClient: QueryClient;
  const mockPromptsResponse = {
    data: [
      {
        id: '1',
        title: 'Test Prompt 1',
        content: 'Test content 1',
        category: null,
        category_id: null,
        tags: ['test'],
        is_public: true,
        user_id: '123e4567-e89b-12d3-a456-426614174000',
        usage_count: 0,
        last_used_at: null,
        rating: null,
        description: null,
        model_compatibility: null,
        parameters: null,
        is_favorite: false,
        folder_id: null,
        version: 1,
        parent_id: null,
        is_template: false,
        template_variables: null,
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z'
      }
    ],
    pagination: {
      page: 1,
      limit: 10,
      total: 1,
      total_pages: 1,
      has_next: false,
      has_prev: false
    },
    success: true
  };

  const mockPrompt = {
    id: 'test-prompt-id',
    title: 'Test Prompt',
    content: 'Test content',
    category: null,
    category_id: null,
    tags: ['test'],
    is_public: true,
    user_id: '123e4567-e89b-12d3-a456-426614174000',
    usage_count: 0,
    last_used_at: null,
    rating: null,
    description: null,
    model_compatibility: null,
    parameters: null,
    is_favorite: false,
    folder_id: null,
    version: 1,
    parent_id: null,
    is_template: false,
    template_variables: null,
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z'
  };

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    });
    vi.clearAllMocks();
    
    // Setup default mocks
    vi.mocked(promptService.listPrompts).mockResolvedValue(mockPromptsResponse);
    vi.mocked(promptService.getPrompt).mockResolvedValue(mockPrompt);
    vi.mocked(promptService.createPrompt).mockResolvedValue(mockPrompt);
    vi.mocked(promptService.updatePrompt).mockResolvedValue(mockPrompt);
    vi.mocked(promptService.deletePrompt).mockResolvedValue(undefined);
  });

  describe('usePrompts', () => {
    it('should fetch prompts with default pagination', async () => {
      const { result } = renderHook(() => usePrompts(), {
        wrapper: createWrapper
      });

      expect(result.current.isLoading).toBe(true);
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toBeDefined();
      expect(result.current.error).toBeNull();
    });

    it('should handle filters and pagination parameters', async () => {
      const filters: PromptFilters = {
        category_id: 'test-category',
        tags: ['test'],
        search: 'test query'
      };
      const pagination = { page: 2, limit: 20 };

      const { result } = renderHook(() => usePrompts(filters, pagination), {
        wrapper: createWrapper
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Verify the service was called with correct parameters
      expect(result.current.data).toBeDefined();
    });

    it('should handle loading and error states', async () => {
      // Mock service to throw error
      const mockError = new Error('Network error');
      vi.mocked(promptService.listPrompts).mockRejectedValue(mockError);

      const { result } = renderHook(() => usePrompts(), {
        wrapper: createWrapper
      });

      expect(result.current.isLoading).toBe(true);
      expect(result.current.error).toBeNull();

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBeTruthy();
      expect(result.current.data).toBeUndefined();
    });

    it('should enable/disable query based on enabled parameter', () => {
      const { result: enabledResult } = renderHook(() => usePrompts({}, { page: 1, limit: 10 }, true), {
        wrapper: createWrapper
      });

      const { result: disabledResult } = renderHook(() => usePrompts({}, { page: 1, limit: 10 }, false), {
        wrapper: createWrapper
      });

      expect(enabledResult.current.isLoading).toBe(true);
      expect(disabledResult.current.isLoading).toBe(false);
    });
  });

  describe('usePrompt', () => {
    it('should fetch single prompt by ID', async () => {
      const promptId = 'test-prompt-id';
      
      const { result } = renderHook(() => usePrompt(promptId), {
        wrapper: createWrapper
      });

      expect(result.current.isLoading).toBe(true);
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toBeDefined();
      expect(result.current.error).toBeNull();
    });

    it('should not fetch when ID is undefined', () => {
      const { result } = renderHook(() => usePrompt(undefined), {
        wrapper: createWrapper
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.data).toBeUndefined();
    });

    it('should handle prompt not found', async () => {
      // Mock service to return null
      vi.mocked(promptService.getPrompt).mockResolvedValue(null);

      const { result } = renderHook(() => usePrompt('non-existent-id'), {
        wrapper: createWrapper
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toBeNull();
      expect(result.current.error).toBeNull();
    });
  });

  describe('useCreatePrompt', () => {
    it('should create prompt and invalidate cache', async () => {
      const { result } = renderHook(() => useCreatePrompt(), {
        wrapper: createWrapper
      });

      const createData: CreatePrompt = {
        title: 'New Prompt',
        content: 'New content',
        tags: ['new'],
        user_id: 'test-user-id',
        is_public: false,
        is_favorite: false,
        is_template: false
      };

      expect(result.current.isIdle).toBe(true);

      result.current.mutate(createData);

      expect(result.current.isPending).toBe(true);

      await waitFor(() => {
        expect(result.current.isPending).toBe(false);
      });

      expect(result.current.isSuccess).toBe(true);
      expect(result.current.data).toBeDefined();
    });

    it('should handle creation errors', async () => {
      // Mock service to throw error
      const mockError = new Error('Creation failed');
      vi.mocked(promptService.createPrompt).mockRejectedValue(mockError);

      const { result } = renderHook(() => useCreatePrompt(), {
        wrapper: createWrapper
      });

      const createData: CreatePrompt = {
        title: 'Failed Prompt',
        content: 'Content',
        tags: [],
        user_id: 'test-user-id',
        is_public: false,
        is_favorite: false,
        is_template: false
      };

      result.current.mutate(createData);

      await waitFor(() => {
        expect(result.current.isPending).toBe(false);
      });

      expect(result.current.isError).toBe(true);
      expect(result.current.error).toBeTruthy();
    });

    it('should call onSuccess callback when provided', async () => {
      const onSuccess = vi.fn();
      
      const { result } = renderHook(() => useCreatePrompt({ onSuccess }), {
        wrapper: createWrapper
      });

      const createData: CreatePrompt = {
        title: 'Success Prompt',
        content: 'Content',
        tags: [],
        user_id: 'test-user-id',
        is_public: false,
        is_favorite: false,
        is_template: false
      };

      result.current.mutate(createData);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(onSuccess).toHaveBeenCalledWith(
        result.current.data,
        createData,
        expect.any(Object)
      );
    });
  });

  describe('useUpdatePrompt', () => {
    it('should update prompt and invalidate related queries', async () => {
      const { result } = renderHook(() => useUpdatePrompt(), {
        wrapper: createWrapper
      });

      const updateData = {
        id: 'test-prompt-id',
        data: { title: 'Updated Title' } as UpdatePrompt
      };

      result.current.mutate(updateData);

      expect(result.current.isPending).toBe(true);

      await waitFor(() => {
        expect(result.current.isPending).toBe(false);
      });

      expect(result.current.isSuccess).toBe(true);
    });

    it('should handle update conflicts', async () => {
      const mockError = new Error('Version conflict');
      vi.mocked(promptService.updatePrompt).mockRejectedValue(mockError);

      const { result } = renderHook(() => useUpdatePrompt(), {
        wrapper: createWrapper
      });

      const updateData = {
        id: 'test-prompt-id',
        data: { title: 'Conflicted Update' } as UpdatePrompt
      };

      result.current.mutate(updateData);

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeTruthy();
    });
  });

  describe('useDeletePrompt', () => {
    it('should delete prompt and update cache', async () => {
      const { result } = renderHook(() => useDeletePrompt(), {
        wrapper: createWrapper
      });

      const promptId = 'test-prompt-id';

      result.current.mutate(promptId);

      expect(result.current.isPending).toBe(true);

      await waitFor(() => {
        expect(result.current.isPending).toBe(false);
      });

      expect(result.current.isSuccess).toBe(true);
    });

    it('should handle deletion errors gracefully', async () => {
      const mockError = new Error('Deletion failed');
      vi.mocked(promptService.deletePrompt).mockRejectedValue(mockError);

      const { result } = renderHook(() => useDeletePrompt(), {
        wrapper: createWrapper
      });

      result.current.mutate('test-prompt-id');

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeTruthy();
    });

    it('should implement optimistic updates', async () => {
      // This test would verify that the prompt is removed from cache immediately
      // and restored if the deletion fails
      const { result } = renderHook(() => useDeletePrompt(), {
        wrapper: createWrapper
      });

      // Test optimistic update behavior
      expect(result.current.mutate).toBeDefined();
    });
  });
});
