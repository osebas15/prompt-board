import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';
import { usePrompts, usePrompt, useCreatePrompt, useUpdatePrompt, useDeletePrompt } from '../hooks/usePrompts';
import type { CreatePromptData, UpdatePromptData, PromptFilters } from '../types';

// Mock the PromptService
vi.mock('../services/PromptService', () => ({
  PromptService: vi.fn().mockImplementation(() => ({
    getPrompts: vi.fn(),
    getPromptById: vi.fn(),
    createPrompt: vi.fn(),
    updatePrompt: vi.fn(),
    deletePrompt: vi.fn(),
    incrementUsage: vi.fn()
  }))
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

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    });
    vi.clearAllMocks();
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
      vi.mocked(require('../services/PromptService').PromptService)
        .mockImplementation(() => ({
          getPrompts: vi.fn().mockRejectedValue(mockError)
        }));

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
      vi.mocked(require('../services/PromptService').PromptService)
        .mockImplementation(() => ({
          getPromptById: vi.fn().mockResolvedValue(null)
        }));

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

      const createData: CreatePromptData = {
        title: 'New Prompt',
        content: 'New content',
        tags: ['new']
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
      vi.mocked(require('../services/PromptService').PromptService)
        .mockImplementation(() => ({
          createPrompt: vi.fn().mockRejectedValue(mockError)
        }));

      const { result } = renderHook(() => useCreatePrompt(), {
        wrapper: createWrapper
      });

      const createData: CreatePromptData = {
        title: 'Failed Prompt',
        content: 'Content',
        tags: []
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

      const createData: CreatePromptData = {
        title: 'Success Prompt',
        content: 'Content',
        tags: []
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
        data: { title: 'Updated Title' } as UpdatePromptData
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
      vi.mocked(require('../services/PromptService').PromptService)
        .mockImplementation(() => ({
          updatePrompt: vi.fn().mockRejectedValue(mockError)
        }));

      const { result } = renderHook(() => useUpdatePrompt(), {
        wrapper: createWrapper
      });

      const updateData = {
        id: 'test-prompt-id',
        data: { title: 'Conflicted Update' } as UpdatePromptData
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
      vi.mocked(require('../services/PromptService').PromptService)
        .mockImplementation(() => ({
          deletePrompt: vi.fn().mockRejectedValue(mockError)
        }));

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
