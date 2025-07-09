#!/bin/bash

# Day 8 Setup Script - Advanced Features & Search
# This script sets up search functionality, automation workflows, and advanced features

set -e

echo "🔍 Day 8 Setup: Advanced Features & Search"
echo "=========================================="

echo "📦 Installing search and automation dependencies..."

# Install search libraries
npm install --save \
    fuse.js \
    flexsearch \
    lunr \
    use-debounce

echo "📦 Installing workflow and automation dependencies..."

# Install workflow management
npm install --save \
    immer \
    uuid \
    cron-parser \
    json-schema

echo "📦 Installing analytics and monitoring dependencies..."

# Install analytics utilities
npm install --save \
    react-hotkeys-hook \
    react-use-measure \
    recharts

echo "📁 Creating search and automation structure..."

# Create comprehensive feature structure
mkdir -p src/features/search/{components,hooks,services,types,utils,__tests__}
mkdir -p src/features/automation/{components,hooks,services,types,utils,__tests__}
mkdir -p src/features/analytics/{components,hooks,services,types}
mkdir -p src/features/shortcuts/{hooks,utils}

echo "🔍 Creating search system..."

# Create search types
cat > src/features/search/types/index.ts << 'EOF'
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
EOF

# Create search service
cat > src/features/search/services/SearchService.ts << 'EOF'
import Fuse from 'fuse.js';
import type { 
  GlobalSearchItem, 
  SearchResult, 
  SearchFilters, 
  SearchOptions 
} from '../types';

export class SearchService {
  private searchIndex: Fuse<GlobalSearchItem> | null = null;
  private items: GlobalSearchItem[] = [];

  constructor() {
    this.initializeIndex();
  }

  private initializeIndex() {
    const options = {
      keys: [
        { name: 'title', weight: 3 },
        { name: 'content', weight: 2 },
        { name: 'description', weight: 1.5 },
        { name: 'tags', weight: 2 },
        { name: 'category', weight: 1.5 },
      ],
      threshold: 0.3,
      includeScore: true,
      includeMatches: true,
      shouldSort: true,
      minMatchCharLength: 2,
    };

    this.searchIndex = new Fuse(this.items, options);
  }

  updateItems(items: GlobalSearchItem[]) {
    this.items = items;
    this.searchIndex?.setCollection(items);
  }

  search(
    query: string, 
    filters: SearchFilters = {}, 
    options: SearchOptions = {}
  ): SearchResult<GlobalSearchItem>[] {
    if (!this.searchIndex || !query.trim()) {
      return this.getFilteredItems(filters, options);
    }

    const results = this.searchIndex.search(query, {
      limit: options.limit || 50,
    });

    // Apply additional filters
    const filteredResults = results.filter(result => 
      this.matchesFilters(result.item, filters)
    );

    return filteredResults.map(result => ({
      item: result.item,
      score: result.score,
      matches: result.matches,
    }));
  }

  private getFilteredItems(
    filters: SearchFilters, 
    options: SearchOptions
  ): SearchResult<GlobalSearchItem>[] {
    let filtered = this.items.filter(item => 
      this.matchesFilters(item, filters)
    );

    // Apply pagination
    if (options.offset || options.limit) {
      const start = options.offset || 0;
      const end = start + (options.limit || filtered.length);
      filtered = filtered.slice(start, end);
    }

    return filtered.map(item => ({ item }));
  }

  private matchesFilters(item: GlobalSearchItem, filters: SearchFilters): boolean {
    if (filters.type && item.type !== filters.type) {
      return false;
    }

    if (filters.category && item.category !== filters.category) {
      return false;
    }

    if (filters.tags && filters.tags.length > 0) {
      const hasMatchingTag = filters.tags.some(tag =>
        item.tags.some(itemTag => 
          itemTag.toLowerCase().includes(tag.toLowerCase())
        )
      );
      if (!hasMatchingTag) {
        return false;
      }
    }

    if (filters.dateRange) {
      const itemDate = new Date(item.created_at);
      if (itemDate < filters.dateRange.from || itemDate > filters.dateRange.to) {
        return false;
      }
    }

    return true;
  }

  getSuggestions(query: string, limit: number = 5): string[] {
    if (!query.trim() || query.length < 2) {
      return [];
    }

    const suggestions = new Set<string>();
    
    // Get suggestions from titles
    this.items.forEach(item => {
      if (item.title.toLowerCase().includes(query.toLowerCase())) {
        suggestions.add(item.title);
      }
      
      // Get suggestions from tags
      item.tags.forEach(tag => {
        if (tag.toLowerCase().includes(query.toLowerCase())) {
          suggestions.add(tag);
        }
      });
    });

    return Array.from(suggestions).slice(0, limit);
  }

  getPopularTags(limit: number = 10): string[] {
    const tagCounts = new Map<string, number>();
    
    this.items.forEach(item => {
      item.tags.forEach(tag => {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      });
    });

    return Array.from(tagCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([tag]) => tag);
  }
}

export const searchService = new SearchService();
EOF

# Create automation types
cat > src/features/automation/types/index.ts << 'EOF'
// Automation and workflow types
export interface WorkflowStep {
  id: string;
  type: 'prompt' | 'condition' | 'variable' | 'delay' | 'webhook';
  name: string;
  config: WorkflowStepConfig;
  position: { x: number; y: number };
  connections: string[]; // IDs of connected steps
}

export interface WorkflowStepConfig {
  // Prompt step
  promptTemplate?: string;
  variables?: Record<string, string>;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  
  // Condition step
  condition?: string;
  operator?: 'equals' | 'contains' | 'greater' | 'less' | 'regex';
  value?: string;
  
  // Variable step
  variableName?: string;
  variableValue?: string;
  
  // Delay step
  delayMs?: number;
  
  // Webhook step
  url?: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: string;
}

export interface Workflow {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  steps: WorkflowStep[];
  variables: Record<string, any>;
  is_active: boolean;
  is_template: boolean;
  schedule?: string; // Cron expression
  tags: string[];
  created_at: string;
  updated_at: string;
  last_run_at?: string;
  run_count: number;
}

export interface WorkflowExecution {
  id: string;
  workflow_id: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  started_at: string;
  completed_at?: string;
  error?: string;
  steps_completed: number;
  total_steps: number;
  results: Record<string, any>;
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  steps: Omit<WorkflowStep, 'id'>[];
  variables: Record<string, { type: string; default?: any; required?: boolean }>;
  tags: string[];
}
EOF

# Create keyboard shortcuts hook
cat > src/features/shortcuts/hooks/useKeyboardShortcuts.ts << 'EOF'
import { useHotkeys } from 'react-hotkeys-hook';
import { useCallback } from 'react';

export interface KeyboardShortcut {
  key: string;
  description: string;
  action: () => void;
  enabled?: boolean;
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  const enabledShortcuts = shortcuts.filter(s => s.enabled !== false);

  enabledShortcuts.forEach(({ key, action }) => {
    useHotkeys(key, action, {
      enableOnFormTags: ['INPUT', 'TEXTAREA', 'SELECT'],
    });
  });

  const getShortcutsList = useCallback(() => {
    return enabledShortcuts.map(({ key, description }) => ({
      key,
      description,
    }));
  }, [enabledShortcuts]);

  return { shortcuts: getShortcutsList() };
}

// Global shortcuts configuration
export const globalShortcuts: KeyboardShortcut[] = [
  {
    key: 'ctrl+k,cmd+k',
    description: 'Open command palette',
    action: () => {
      // Will be implemented with command palette component
      console.log('Command palette');
    },
  },
  {
    key: 'ctrl+n,cmd+n',
    description: 'Create new prompt',
    action: () => {
      console.log('New prompt');
    },
  },
  {
    key: 'ctrl+shift+n,cmd+shift+n',
    description: 'Create new context',
    action: () => {
      console.log('New context');
    },
  },
  {
    key: 'ctrl+/,cmd+/',
    description: 'Show keyboard shortcuts',
    action: () => {
      console.log('Show shortcuts');
    },
  },
  {
    key: 'ctrl+shift+p,cmd+shift+p',
    description: 'Open prompt library',
    action: () => {
      console.log('Prompt library');
    },
  },
];
EOF

# Create analytics types
cat > src/features/analytics/types/index.ts << 'EOF'
// Analytics and metrics types
export interface UsageMetrics {
  promptsCreated: number;
  promptsUsed: number;
  conversationsStarted: number;
  totalTokensUsed: number;
  activeContexts: number;
  dailyActivity: DailyActivity[];
  topPrompts: PromptUsage[];
  topCategories: CategoryUsage[];
}

export interface DailyActivity {
  date: string;
  promptsCreated: number;
  promptsUsed: number;
  conversations: number;
  tokensUsed: number;
}

export interface PromptUsage {
  id: string;
  title: string;
  usageCount: number;
  lastUsed: string;
  category?: string;
}

export interface CategoryUsage {
  name: string;
  promptCount: number;
  usageCount: number;
  percentage: number;
}

export interface PerformanceMetrics {
  avgResponseTime: number;
  errorRate: number;
  successRate: number;
  cacheHitRate: number;
}
EOF

echo "📄 Creating search hook..."

# Create search hook
cat > src/features/search/hooks/useGlobalSearch.ts << 'EOF'
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
EOF

echo "✅ Day 8 setup complete!"
echo ""
echo "Files created:"
echo "- src/features/search/types/index.ts"
echo "- src/features/search/services/SearchService.ts"
echo "- src/features/search/hooks/useGlobalSearch.ts"
echo "- src/features/automation/types/index.ts"
echo "- src/features/shortcuts/hooks/useKeyboardShortcuts.ts"
echo "- src/features/analytics/types/index.ts"
echo ""
echo "Next steps:"
echo "1. Implement search UI components"
echo "2. Create workflow builder interface"
echo "3. Add command palette"
echo "4. Build analytics dashboard"
echo ""
echo "Ready for Day 8 development! 🚀"
