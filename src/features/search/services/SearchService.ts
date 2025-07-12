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
  private searchHistory: string[] = [];
  private maxHistorySize = 10;

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
      threshold: 0.6, // More permissive for longer partial matches
      includeScore: true,
      includeMatches: true,
      shouldSort: true,
      minMatchCharLength: 2,
    };

    this.searchIndex = new Fuse(this.items, options);
  }

  updateItems(items: GlobalSearchItem[]) {
    this.items = items;
    // Reinitialize the index with the new items
    this.initializeIndex();
  }

  async search(
    query: string | null | undefined, 
    filters: SearchFilters = {}, 
    options: SearchOptions = {}
  ): Promise<SearchResult<GlobalSearchItem>[]> {
    try {
      // Handle null/undefined queries
      if (!query) {
        // If there are filters but no query, return filtered results
        if (Object.keys(filters).length > 0) {
          return this.getFilteredItems(filters, options);
        }
        return [];
      }

      // Handle malformed queries
      if (typeof query !== 'string') {
        return [];
      }

      const trimmedQuery = query.trim();
      
      // Handle empty queries
      if (!trimmedQuery) {
        // If there are filters but no query, return filtered results
        if (Object.keys(filters).length > 0) {
          return this.getFilteredItems(filters, options);
        }
        return [];
      }

      // Add to search history if it's a real search
      this.addToSearchHistory(trimmedQuery);

      if (!this.searchIndex) {
        return this.getFilteredItems(filters, options);
      }

      const results = this.searchIndex.search(trimmedQuery, {
        limit: options.limit || 50,
      });

      // Apply additional filters
      const filteredResults = results.filter(result => 
        this.matchesFilters(result.item, filters)
      );

      return filteredResults.map(result => ({
        item: result.item,
        score: result.score,
        matches: result.matches ? result.matches.map(match => ({
          indices: match.indices.map(([start, end]) => [start, end] as [number, number]),
          value: match.value || '',
          key: match.key,
        })) : undefined,
      }));
    } catch (error) {
      console.error('Search service error:', error);
      return [];
    }
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
      const startDate = new Date(filters.dateRange.from);
      const endDate = new Date(filters.dateRange.to);
      
      if (itemDate < startDate || itemDate > endDate) {
        return false;
      }
    }

    return true;
  }

  async getSuggestions(query: string, limit: number = 5): Promise<string[]> {
    if (!query || query.length < 2) {
      return [];
    }

    // Extract suggestions from item titles and content
    const suggestions = new Set<string>();
    
    this.items.forEach(item => {
      // Add title words
      item.title.split(' ').forEach(word => {
        if (word.toLowerCase().includes(query.toLowerCase()) && word.length > 2) {
          suggestions.add(word);
        }
      });
      
      // Add tags that match
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

  // Search history methods
  private addToSearchHistory(query: string) {
    // Remove if already exists
    const index = this.searchHistory.indexOf(query);
    if (index > -1) {
      this.searchHistory.splice(index, 1);
    }
    
    // Add to beginning
    this.searchHistory.unshift(query);
    
    // Limit size
    if (this.searchHistory.length > this.maxHistorySize) {
      this.searchHistory = this.searchHistory.slice(0, this.maxHistorySize);
    }
  }

  getSearchHistory(): string[] {
    return [...this.searchHistory];
  }

  clearSearchHistory(): void {
    this.searchHistory = [];
  }

  // Index management methods
  addItem(item: GlobalSearchItem): void {
    this.items.push(item);
    this.searchIndex?.add(item);
  }

  updateItem(item: GlobalSearchItem): void {
    const index = this.items.findIndex(i => i.id === item.id);
    if (index > -1) {
      this.items[index] = item;
      this.searchIndex?.remove((doc: GlobalSearchItem) => doc.id === item.id);
      this.searchIndex?.add(item);
    }
  }

  removeItem(id: string): void {
    this.items = this.items.filter(item => item.id !== id);
    this.searchIndex?.remove((doc: GlobalSearchItem) => doc.id === id);
  }
}

export const searchService = new SearchService();
