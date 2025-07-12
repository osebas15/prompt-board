import { useState, useEffect, useCallback } from 'react';
import { useDebounce } from 'use-debounce';
import { searchService } from '../services/SearchService';
import type { 
  SearchState, 
  SearchFilters, 
  SearchOptions,
  GlobalSearchItem 
} from '../types';

export function useGlobalSearch(initialFilters: SearchFilters = {}) {
  const [state, setState] = useState<SearchState>({
    query: '',
    filters: initialFilters,
    results: [],
    isLoading: false,
    error: null,
    totalCount: 0,
    suggestions: [],
  });

  const [debouncedQuery] = useDebounce(state.query, 300);

  const updateQuery = useCallback((query: string) => {
    setState(prev => ({ ...prev, query }));
  }, []);

  const updateFilters = useCallback((filters: Partial<SearchFilters>) => {
    setState(prev => ({ 
      ...prev, 
      filters: { ...prev.filters, ...filters } 
    }));
  }, []);

  const performSearch = useCallback(async (
    query: string = debouncedQuery,
    filters: SearchFilters = state.filters,
    options: SearchOptions = {}
  ) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const results = searchService.search(query, filters, options);
      const suggestions = query ? searchService.getSuggestions(query) : [];

      setState(prev => ({
        ...prev,
        results,
        suggestions,
        totalCount: results.length,
        isLoading: false,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Search failed',
        isLoading: false,
      }));
    }
  }, [debouncedQuery, state.filters]);

  const clearSearch = useCallback(() => {
    setState(prev => ({
      ...prev,
      query: '',
      results: [],
      suggestions: [],
      totalCount: 0,
      error: null,
    }));
  }, []);

  // Perform search when query or filters change
  useEffect(() => {
    if (debouncedQuery || Object.keys(state.filters).length > 0) {
      performSearch();
    } else {
      setState(prev => ({ 
        ...prev, 
        results: [], 
        totalCount: 0, 
        suggestions: [] 
      }));
    }
  }, [debouncedQuery, state.filters, performSearch]);

  return {
    ...state,
    updateQuery,
    updateFilters,
    performSearch,
    clearSearch,
  };
}
