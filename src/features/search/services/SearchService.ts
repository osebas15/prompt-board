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
