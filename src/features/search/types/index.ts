// Search system types
export interface SearchResult<T = any> {
  item: T;
  matches?: SearchMatch[];
  score?: number;
  refIndex?: number;
}

export interface SearchMatch {
  indices: [number, number][];
  value: string;
  key?: string;
  arrayIndex?: number;
}

export interface SearchFilters {
  type?: 'prompt' | 'conversation' | 'context' | 'all';
  category?: string;
  tags?: string[];
  dateRange?: {
    from: Date;
    to: Date;
  };
  author?: string;
  isPublic?: boolean;
}

export interface SearchOptions {
  threshold?: number;
  includeScore?: boolean;
  includeMatches?: boolean;
  shouldSort?: boolean;
  limit?: number;
  offset?: number;
}

export interface SearchState {
  query: string;
  filters: SearchFilters;
  results: SearchResult[];
  isLoading: boolean;
  error: string | null;
  totalCount: number;
  suggestions: string[];
}

export interface GlobalSearchItem {
  id: string;
  type: 'prompt' | 'conversation' | 'context';
  title: string;
  content: string;
  description?: string;
  tags: string[];
  category?: string;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, any>;
}
