/**
 * React Query Hooks for Database Operations
 * Type-safe hooks with proper caching, error handling, and optimistic updates
 */
import { 
  useQuery, 
  useMutation, 
  useQueryClient,
  type UseQueryOptions,
  type UseMutationOptions
} from '@tanstack/react-query'
import { DatabaseClient, type Prompt, type PromptInsert, type PromptUpdate, type PromptFilters } from '../lib/database/database-client'
import { DatabaseError } from '../lib/database/database-error-handling'

// Query keys factory
export const promptKeys = {
  all: ['prompts'] as const,
  lists: () => [...promptKeys.all, 'list'] as const,
  list: (filters: PromptFilters) => [...promptKeys.lists(), filters] as const,
  search: (query: string, filters: PromptFilters) => [...promptKeys.all, 'search', query, filters] as const,
  details: () => [...promptKeys.all, 'detail'] as const,
  detail: (id: string) => [...promptKeys.details(), id] as const,
}

// Hook options types
type UsePromptsOptions = Omit<UseQueryOptions<Prompt[], DatabaseError>, 'queryKey' | 'queryFn'>
type UsePromptOptions = Omit<UseQueryOptions<Prompt | null, DatabaseError>, 'queryKey' | 'queryFn'>
type UseSearchPromptsOptions = Omit<UseQueryOptions<Prompt[], DatabaseError>, 'queryKey' | 'queryFn'>

type UseCreatePromptOptions = Omit<UseMutationOptions<Prompt, DatabaseError, PromptInsert>, 'mutationFn'>
type UseUpdatePromptOptions = Omit<UseMutationOptions<Prompt, DatabaseError, { id: string; data: PromptUpdate }>, 'mutationFn'>
type UseDeletePromptOptions = Omit<UseMutationOptions<void, DatabaseError, string>, 'mutationFn'>

// React Query Hooks
export function usePrompts(
  dbClient: DatabaseClient,
  filters: PromptFilters = {},
  options: UsePromptsOptions = {}
) {
  return useQuery({
    queryKey: promptKeys.list(filters),
    queryFn: async () => {
      const result = await dbClient.getPrompts(filters)
      if (result.error) {
        throw result.error
      }
      return result.data || []
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    ...options
  })
}

export function usePrompt(
  dbClient: DatabaseClient,
  id: string,
  options: UsePromptOptions = {}
) {
  return useQuery({
    queryKey: promptKeys.detail(id),
    queryFn: async () => {
      const result = await dbClient.getPrompt(id)
      if (result.error) {
        throw result.error
      }
      return result.data
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    enabled: !!id,
    ...options
  })
}

export function useSearchPrompts(
  dbClient: DatabaseClient,
  searchQuery: string,
  filters: PromptFilters = {},
  options: UseSearchPromptsOptions = {}
) {
  return useQuery({
    queryKey: promptKeys.search(searchQuery, filters),
    queryFn: async () => {
      const result = await dbClient.searchPrompts(searchQuery, filters)
      if (result.error) {
        throw result.error
      }
      return result.data || []
    },
    staleTime: 2 * 60 * 1000, // 2 minutes (shorter for search)
    gcTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!searchQuery.trim(),
    ...options
  })
}

export function useCreatePrompt(
  dbClient: DatabaseClient,
  options: UseCreatePromptOptions = {}
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: PromptInsert) => {
      const result = await dbClient.createPrompt(data)
      if (result.error) {
        throw result.error
      }
      return result.data!
    },
    onSuccess: (newPrompt) => {
      // Invalidate and refetch all prompt lists
      queryClient.invalidateQueries({ queryKey: promptKeys.lists() })
      
      // Add the new prompt to all relevant cached lists
      queryClient.setQueriesData<Prompt[]>(
        { queryKey: promptKeys.lists() },
        (oldData) => {
          if (!oldData) return [newPrompt]
          return [newPrompt, ...oldData]
        }
      )
    },
    onError: (error) => {
      console.error('Create prompt error:', error)
    },
    ...options
  })
}

export function useUpdatePrompt(
  dbClient: DatabaseClient,
  options: UseUpdatePromptOptions = {}
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: PromptUpdate }) => {
      const result = await dbClient.updatePrompt(id, data)
      if (result.error) {
        throw result.error
      }
      return result.data!
    },
    onMutate: async ({ id, data }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: promptKeys.detail(id) })

      // Snapshot the previous value
      const previousPrompt = queryClient.getQueryData<Prompt>(promptKeys.detail(id))

      // Optimistically update to the new value
      if (previousPrompt) {
        const updatedPrompt = { ...previousPrompt, ...data, updated_at: new Date().toISOString() }
        queryClient.setQueryData(promptKeys.detail(id), updatedPrompt)

        // Update the prompt in any cached lists
        queryClient.setQueriesData<Prompt[]>(
          { queryKey: promptKeys.lists() },
          (oldData) => {
            if (!oldData) return oldData
            return oldData.map(prompt => 
              prompt.id === id ? updatedPrompt : prompt
            )
          }
        )
      }

      return { previousPrompt }
    },
    onError: (error, { id }, context) => {
      // Rollback on error
      if (context?.previousPrompt) {
        queryClient.setQueryData(promptKeys.detail(id), context.previousPrompt)
      }
      console.error('Update prompt error:', error)
    },
    onSuccess: (updatedPrompt) => {
      // Update the cached data with the server response
      queryClient.setQueryData(promptKeys.detail(updatedPrompt.id), updatedPrompt)
      
      // Update the prompt in any cached lists
      queryClient.setQueriesData<Prompt[]>(
        { queryKey: promptKeys.lists() },
        (oldData) => {
          if (!oldData) return oldData
          return oldData.map(prompt => 
            prompt.id === updatedPrompt.id ? updatedPrompt : prompt
          )
        }
      )
    },
    onSettled: (_data, _error, { id }) => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: promptKeys.detail(id) })
    },
    ...options
  })
}

export function useDeletePrompt(
  dbClient: DatabaseClient,
  options: UseDeletePromptOptions = {}
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await dbClient.deletePrompt(id)
      if (result.error) {
        throw result.error
      }
    },
    onMutate: async (id) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: promptKeys.detail(id) })

      // Snapshot the previous value
      const previousPrompt = queryClient.getQueryData<Prompt>(promptKeys.detail(id))

      // Optimistically remove from lists
      queryClient.setQueriesData<Prompt[]>(
        { queryKey: promptKeys.lists() },
        (oldData) => {
          if (!oldData) return oldData
          return oldData.filter(prompt => prompt.id !== id)
        }
      )

      // Remove from detail cache
      queryClient.removeQueries({ queryKey: promptKeys.detail(id) })

      return { previousPrompt }
    },
    onError: (error, id, context) => {
      // Rollback on error
      if (context?.previousPrompt) {
        const { previousPrompt } = context
        queryClient.setQueryData(promptKeys.detail(id), previousPrompt)
        
        // Add back to lists
        queryClient.setQueriesData<Prompt[]>(
          { queryKey: promptKeys.lists() },
          (oldData) => {
            if (!oldData) return [previousPrompt]
            // Only add if not already present to avoid duplicates
            const exists = oldData.some(prompt => prompt.id === previousPrompt.id)
            if (exists) return oldData
            return [previousPrompt, ...oldData]
          }
        )
      }
      console.error('Delete prompt error:', error)
    },
    onSuccess: () => {
      // Invalidate lists to ensure consistency
      queryClient.invalidateQueries({ queryKey: promptKeys.lists() })
    },
    ...options
  })
}

// Prefetch utilities
export function prefetchPrompt(
  dbClient: DatabaseClient,
  queryClient: ReturnType<typeof useQueryClient>,
  id: string
) {
  return queryClient.prefetchQuery({
    queryKey: promptKeys.detail(id),
    queryFn: async () => {
      const result = await dbClient.getPrompt(id)
      if (result.error) {
        throw result.error
      }
      return result.data
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export function prefetchPrompts(
  dbClient: DatabaseClient,
  queryClient: ReturnType<typeof useQueryClient>,
  filters: PromptFilters = {}
) {
  return queryClient.prefetchQuery({
    queryKey: promptKeys.list(filters),
    queryFn: async () => {
      const result = await dbClient.getPrompts(filters)
      if (result.error) {
        throw result.error
      }
      return result.data || []
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Cache invalidation utilities
export function invalidateAllPrompts(queryClient: ReturnType<typeof useQueryClient>) {
  return queryClient.invalidateQueries({ queryKey: promptKeys.all })
}

export function invalidatePromptLists(queryClient: ReturnType<typeof useQueryClient>) {
  return queryClient.invalidateQueries({ queryKey: promptKeys.lists() })
}

export function invalidatePrompt(queryClient: ReturnType<typeof useQueryClient>, id: string) {
  return queryClient.invalidateQueries({ queryKey: promptKeys.detail(id) })
}
