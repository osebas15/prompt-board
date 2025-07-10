import { 
  useQuery, 
  useMutation, 
  useQueryClient, 
  useInfiniteQuery,
  type UseQueryOptions,
  type UseMutationOptions,
  type UseInfiniteQueryOptions
} from '@tanstack/react-query';
import { promptService } from '../services/PromptService';
import type { 
  Prompt, 
  CreatePrompt, 
  UpdatePrompt, 
  PromptFilters, 
  Pagination, 
  PromptsListResponse 
} from '../utils/validation';

// Query keys
export const promptQueryKeys = {
  all: ['prompts'] as const,
  lists: () => [...promptQueryKeys.all, 'list'] as const,
  list: (filters: PromptFilters, pagination: Pagination) => [...promptQueryKeys.lists(), filters, pagination] as const,
  infinite: (filters: PromptFilters) => [...promptQueryKeys.all, 'infinite', filters] as const,
  details: () => [...promptQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...promptQueryKeys.details(), id] as const,
  userPrompts: (userId: string) => [...promptQueryKeys.all, 'user', userId] as const,
  publicPrompts: () => [...promptQueryKeys.all, 'public'] as const,
  favorites: (userId: string) => [...promptQueryKeys.all, 'favorites', userId] as const,
  byCategory: (category: string) => [...promptQueryKeys.all, 'category', category] as const,
  byTags: (tags: string[]) => [...promptQueryKeys.all, 'tags', tags] as const,
  templates: () => [...promptQueryKeys.all, 'templates'] as const,
  versions: (parentId: string) => [...promptQueryKeys.all, 'versions', parentId] as const,
  search: (searchTerm: string) => [...promptQueryKeys.all, 'search', searchTerm] as const
};

// Hook to get a single prompt
export function usePrompt(
  id: string,
  options?: Omit<UseQueryOptions<Prompt | null, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: promptQueryKeys.detail(id),
    queryFn: () => promptService.getPrompt(id),
    ...options
  });
}

// Hook to list prompts with filters and pagination
export function usePrompts(
  filters: PromptFilters = {},
  pagination: Pagination = { page: 1, limit: 10, sort_by: 'created_at', sort_order: 'desc' },
  options?: Omit<UseQueryOptions<PromptsListResponse, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: promptQueryKeys.list(filters, pagination),
    queryFn: () => promptService.listPrompts(filters, pagination),
    ...options
  });
}

// Hook for infinite scrolling prompts
export function useInfinitePrompts(
  filters: PromptFilters = {},
  options?: Omit<UseInfiniteQueryOptions<PromptsListResponse, Error>, 'queryKey' | 'queryFn' | 'getNextPageParam' | 'initialPageParam'>
) {
  return useInfiniteQuery({
    queryKey: promptQueryKeys.infinite(filters),
    queryFn: ({ pageParam = 1 }) => 
      promptService.listPrompts(filters, { 
        page: pageParam as number, 
        limit: 10, 
        sort_by: 'created_at', 
        sort_order: 'desc' 
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => 
      lastPage.pagination.has_next ? lastPage.pagination.page + 1 : undefined,
    ...options
  });
}

// Hook to get user's prompts
export function useUserPrompts(
  userId: string,
  pagination?: Pagination,
  options?: Omit<UseQueryOptions<PromptsListResponse, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: promptQueryKeys.userPrompts(userId),
    queryFn: () => promptService.getPromptsByUser(userId, pagination),
    ...options
  });
}

// Hook to get public prompts
export function usePublicPrompts(
  pagination?: Pagination,
  options?: Omit<UseQueryOptions<PromptsListResponse, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: promptQueryKeys.publicPrompts(),
    queryFn: () => promptService.getPublicPrompts(pagination),
    ...options
  });
}

// Hook to get favorite prompts
export function useFavoritePrompts(
  userId: string,
  pagination?: Pagination,
  options?: Omit<UseQueryOptions<PromptsListResponse, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: promptQueryKeys.favorites(userId),
    queryFn: () => promptService.getFavoritePrompts(userId, pagination),
    ...options
  });
}

// Hook to get prompts by category
export function usePromptsByCategory(
  category: string,
  pagination?: Pagination,
  options?: Omit<UseQueryOptions<PromptsListResponse, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: promptQueryKeys.byCategory(category),
    queryFn: () => promptService.getPromptsByCategory(category, pagination),
    ...options
  });
}

// Hook to get prompts by tags
export function usePromptsByTags(
  tags: string[],
  pagination?: Pagination,
  options?: Omit<UseQueryOptions<PromptsListResponse, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: promptQueryKeys.byTags(tags),
    queryFn: () => promptService.getPromptsByTags(tags, pagination),
    ...options
  });
}

// Hook to search prompts
export function useSearchPrompts(
  searchTerm: string,
  pagination?: Pagination,
  options?: Omit<UseQueryOptions<PromptsListResponse, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: promptQueryKeys.search(searchTerm),
    queryFn: () => promptService.searchPrompts(searchTerm, pagination),
    enabled: searchTerm.length > 0,
    ...options
  });
}

// Hook to get prompt templates
export function usePromptTemplates(
  pagination?: Pagination,
  options?: Omit<UseQueryOptions<PromptsListResponse, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: promptQueryKeys.templates(),
    queryFn: () => promptService.getTemplates(pagination),
    ...options
  });
}

// Hook to get prompt versions
export function usePromptVersions(
  parentId: string,
  pagination?: Pagination,
  options?: Omit<UseQueryOptions<PromptsListResponse, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: promptQueryKeys.versions(parentId),
    queryFn: () => promptService.getPromptVersions(parentId, pagination),
    ...options
  });
}

// Hook to create a prompt
export function useCreatePrompt(
  options?: Omit<UseMutationOptions<Prompt, Error, CreatePrompt>, 'mutationFn'>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePrompt) => promptService.createPrompt(data),
    onSuccess: (data) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: promptQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: promptQueryKeys.userPrompts(data.user_id) });
      if (data.is_public) {
        queryClient.invalidateQueries({ queryKey: promptQueryKeys.publicPrompts() });
      }
      if (data.is_template) {
        queryClient.invalidateQueries({ queryKey: promptQueryKeys.templates() });
      }
    },
    ...options
  });
}

// Hook to update a prompt
export function useUpdatePrompt(
  options?: Omit<UseMutationOptions<Prompt, Error, { id: string; updates: UpdatePrompt }>, 'mutationFn'>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: UpdatePrompt }) => 
      promptService.updatePrompt(id, updates),
    onSuccess: (data) => {
      // Update the specific prompt in cache
      queryClient.setQueryData(promptQueryKeys.detail(data.id), data);
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: promptQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: promptQueryKeys.userPrompts(data.user_id) });
      if (data.is_public) {
        queryClient.invalidateQueries({ queryKey: promptQueryKeys.publicPrompts() });
      }
      if (data.is_template) {
        queryClient.invalidateQueries({ queryKey: promptQueryKeys.templates() });
      }
    },
    ...options
  });
}

// Hook to delete a prompt
export function useDeletePrompt(
  options?: Omit<UseMutationOptions<void, Error, string>, 'mutationFn'>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => promptService.deletePrompt(id),
    onSuccess: (_, id) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: promptQueryKeys.detail(id) });
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: promptQueryKeys.all });
    },
    ...options
  });
}

// Hook to increment usage count
export function useIncrementUsage(
  options?: Omit<UseMutationOptions<Prompt, Error, string>, 'mutationFn'>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => promptService.incrementUsageCount(id),
    onSuccess: (data) => {
      // Update the specific prompt in cache
      queryClient.setQueryData(promptQueryKeys.detail(data.id), data);
      
      // Invalidate relevant queries to reflect usage count changes
      queryClient.invalidateQueries({ queryKey: promptQueryKeys.all });
    },
    ...options
  });
}

// Hook to update rating
export function useUpdateRating(
  options?: Omit<UseMutationOptions<Prompt, Error, { id: string; rating: number }>, 'mutationFn'>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, rating }: { id: string; rating: number }) => 
      promptService.updateRating(id, rating),
    onSuccess: (data) => {
      // Update the specific prompt in cache
      queryClient.setQueryData(promptQueryKeys.detail(data.id), data);
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: promptQueryKeys.all });
    },
    ...options
  });
}

// Hook to toggle favorite
export function useToggleFavorite(
  options?: Omit<UseMutationOptions<Prompt, Error, string>, 'mutationFn'>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => promptService.toggleFavorite(id),
    onSuccess: (data) => {
      // Update the specific prompt in cache
      queryClient.setQueryData(promptQueryKeys.detail(data.id), data);
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: promptQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: promptQueryKeys.favorites(data.user_id) });
    },
    ...options
  });
}

// Hook to duplicate a prompt
export function useDuplicatePrompt(
  options?: Omit<UseMutationOptions<Prompt, Error, { id: string; updates?: Partial<CreatePrompt> }>, 'mutationFn'>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates?: Partial<CreatePrompt> }) => 
      promptService.duplicatePrompt(id, updates),
    onSuccess: (data) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: promptQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: promptQueryKeys.userPrompts(data.user_id) });
      if (data.parent_id) {
        queryClient.invalidateQueries({ queryKey: promptQueryKeys.versions(data.parent_id) });
      }
    },
    ...options
  });
}

// Optimistic update helpers
export function useOptimisticPromptUpdate() {
  const queryClient = useQueryClient();

  return {
    optimisticUpdate: (id: string, updates: Partial<Prompt>) => {
      queryClient.setQueryData(promptQueryKeys.detail(id), (old: Prompt | undefined) => {
        if (!old) return old;
        return { ...old, ...updates };
      });
    },
    revert: (id: string, previousData: Prompt) => {
      queryClient.setQueryData(promptQueryKeys.detail(id), previousData);
    }
  };
}

// Prefetch helpers
export function usePrefetchPrompts() {
  const queryClient = useQueryClient();

  return {
    prefetchPrompt: (id: string) => {
      queryClient.prefetchQuery({
        queryKey: promptQueryKeys.detail(id),
        queryFn: () => promptService.getPrompt(id)
      });
    },
    prefetchUserPrompts: (userId: string) => {
      queryClient.prefetchQuery({
        queryKey: promptQueryKeys.userPrompts(userId),
        queryFn: () => promptService.getPromptsByUser(userId)
      });
    },
    prefetchPublicPrompts: () => {
      queryClient.prefetchQuery({
        queryKey: promptQueryKeys.publicPrompts(),
        queryFn: () => promptService.getPublicPrompts()
      });
    }
  };
}
