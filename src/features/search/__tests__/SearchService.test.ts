import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SearchService } from '../services/SearchService';
import type { SearchableItem, SearchOptions, SearchResult } from '../types';

describe('SearchService', () => {
  let searchService: SearchService;
  
  const mockData: SearchableItem[] = [
    {
      id: '1',
      type: 'prompt',
      title: 'React Component Creation',
      content: 'Create a reusable React component for user authentication',
      category: 'development',
      tags: ['react', 'component', 'auth'],
      createdAt: new Date('2024-01-01'),
      metadata: { author: 'user1', difficulty: 'medium' }
    },
    {
      id: '2',
      type: 'conversation',
      title: 'API Integration Discussion',
      content: 'Discussion about integrating third-party APIs',
      category: 'backend',
      tags: ['api', 'integration', 'backend'],
      createdAt: new Date('2024-01-02'),
      metadata: { author: 'user2', participants: 3 }
    },
    {
      id: '3',
      type: 'context',
      title: 'Project Requirements',
      content: 'Detailed requirements for the new project',
      category: 'planning',
      tags: ['requirements', 'planning', 'documentation'],
      createdAt: new Date('2024-01-03'),
      metadata: { author: 'user1', version: '1.0' }
    }
  ];

  beforeEach(() => {
    searchService = new SearchService();
    searchService.indexItems(mockData);
  });

  describe('Basic Search Functionality', () => {
    it('should perform basic text search', async () => {
      const results = await searchService.search('React component');
      
      expect(results).toHaveLength(1);
      expect(results[0].item.id).toBe('1');
      expect(results[0].score).toBeGreaterThan(0);
    });

    it('should return empty results for non-matching query', async () => {
      const results = await searchService.search('nonexistent query');
      
      expect(results).toHaveLength(0);
    });

    it('should handle empty query gracefully', async () => {
      const results = await searchService.search('');
      
      expect(results).toHaveLength(0);
    });

    it('should perform case-insensitive search', async () => {
      const results = await searchService.search('REACT COMPONENT');
      
      expect(results).toHaveLength(1);
      expect(results[0].item.id).toBe('1');
    });
  });

  describe('Advanced Search Options', () => {
    it('should filter by content type', async () => {
      const options: SearchOptions = {
        filters: { type: 'prompt' }
      };
      
      const results = await searchService.search('', options);
      
      expect(results).toHaveLength(1);
      expect(results[0].item.type).toBe('prompt');
    });

    it('should filter by category', async () => {
      const options: SearchOptions = {
        filters: { category: 'development' }
      };
      
      const results = await searchService.search('', options);
      
      expect(results).toHaveLength(1);
      expect(results[0].item.category).toBe('development');
    });

    it('should filter by tags', async () => {
      const options: SearchOptions = {
        filters: { tags: ['react'] }
      };
      
      const results = await searchService.search('', options);
      
      expect(results).toHaveLength(1);
      expect(results[0].item.tags).toContain('react');
    });

    it('should filter by date range', async () => {
      const options: SearchOptions = {
        filters: {
          dateRange: {
            start: new Date('2024-01-01'),
            end: new Date('2024-01-02')
          }
        }
      };
      
      const results = await searchService.search('', options);
      
      expect(results).toHaveLength(2);
    });

    it('should apply multiple filters simultaneously', async () => {
      const options: SearchOptions = {
        filters: {
          type: 'prompt',
          category: 'development',
          tags: ['react']
        }
      };
      
      const results = await searchService.search('component', options);
      
      expect(results).toHaveLength(1);
      expect(results[0].item.id).toBe('1');
    });
  });

  describe('Search Result Ranking', () => {
    it('should rank exact title matches higher', async () => {
      const results = await searchService.search('React Component Creation');
      
      expect(results[0].item.id).toBe('1');
      expect(results[0].score).toBeGreaterThan(0.8);
    });

    it('should rank partial content matches appropriately', async () => {
      const results = await searchService.search('authentication');
      
      expect(results[0].item.id).toBe('1');
      expect(results[0].score).toBeLessThan(0.8);
      expect(results[0].score).toBeGreaterThan(0.3);
    });

    it('should sort results by relevance score', async () => {
      const results = await searchService.search('API');
      
      // Should find results, ordered by relevance
      expect(results.length).toBeGreaterThan(0);
      for (let i = 1; i < results.length; i++) {
        expect(results[i - 1].score).toBeGreaterThanOrEqual(results[i].score);
      }
    });
  });

  describe('Search Performance', () => {
    it('should return results within 200ms', async () => {
      const startTime = Date.now();
      
      await searchService.search('React component');
      
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(200);
    });

    it('should handle large datasets efficiently', async () => {
      // Create large dataset
      const largeDataset: SearchableItem[] = [];
      for (let i = 0; i < 1000; i++) {
        largeDataset.push({
          id: `item-${i}`,
          type: 'prompt',
          title: `Test Item ${i}`,
          content: `Content for test item ${i} with various keywords`,
          category: 'test',
          tags: [`tag${i % 10}`],
          createdAt: new Date(),
          metadata: {}
        });
      }
      
      searchService.indexItems(largeDataset);
      
      const startTime = Date.now();
      const results = await searchService.search('test');
      const duration = Date.now() - startTime;
      
      expect(results.length).toBeGreaterThan(0);
      expect(duration).toBeLessThan(500);
    });
  });

  describe('Search Suggestions', () => {
    it('should provide search suggestions', async () => {
      const suggestions = await searchService.getSuggestions('reac');
      
      expect(suggestions).toContain('React');
      expect(suggestions).toContain('react');
    });

    it('should limit suggestion count', async () => {
      const suggestions = await searchService.getSuggestions('a', { limit: 3 });
      
      expect(suggestions.length).toBeLessThanOrEqual(3);
    });

    it('should return empty array for very short queries', async () => {
      const suggestions = await searchService.getSuggestions('a');
      
      expect(suggestions).toHaveLength(0);
    });
  });

  describe('Search History', () => {
    it('should track search history', async () => {
      await searchService.search('React component');
      await searchService.search('API integration');
      
      const history = searchService.getSearchHistory();
      
      expect(history).toContain('React component');
      expect(history).toContain('API integration');
    });

    it('should limit search history size', async () => {
      // Perform more searches than the limit
      for (let i = 0; i < 15; i++) {
        await searchService.search(`query ${i}`);
      }
      
      const history = searchService.getSearchHistory();
      
      expect(history.length).toBeLessThanOrEqual(10);
    });

    it('should clear search history', async () => {
      await searchService.search('test query');
      searchService.clearSearchHistory();
      
      const history = searchService.getSearchHistory();
      
      expect(history).toHaveLength(0);
    });
  });

  describe('Search Index Management', () => {
    it('should add new items to the index', async () => {
      const newItem: SearchableItem = {
        id: '4',
        type: 'prompt',
        title: 'New Test Item',
        content: 'This is a new test item',
        category: 'test',
        tags: ['new'],
        createdAt: new Date(),
        metadata: {}
      };
      
      searchService.addItem(newItem);
      
      const results = await searchService.search('new test');
      expect(results.some(r => r.item.id === '4')).toBe(true);
    });

    it('should update existing items in the index', async () => {
      const updatedItem: SearchableItem = {
        id: '1',
        type: 'prompt',
        title: 'Updated React Component Creation',
        content: 'Updated content for React component',
        category: 'development',
        tags: ['react', 'component', 'updated'],
        createdAt: new Date('2024-01-01'),
        metadata: { author: 'user1', difficulty: 'medium' }
      };
      
      searchService.updateItem(updatedItem);
      
      const results = await searchService.search('updated');
      expect(results.some(r => r.item.id === '1')).toBe(true);
    });

    it('should remove items from the index', async () => {
      searchService.removeItem('1');
      
      const results = await searchService.search('React component');
      expect(results.some(r => r.item.id === '1')).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed search queries', async () => {
      const results = await searchService.search('[]{}()');
      
      expect(results).toEqual([]);
    });

    it('should handle null/undefined queries', async () => {
      const results1 = await searchService.search(null as any);
      const results2 = await searchService.search(undefined as any);
      
      expect(results1).toEqual([]);
      expect(results2).toEqual([]);
    });

    it('should handle search service errors gracefully', async () => {
      // Mock a search service error
      const errorService = new SearchService();
      vi.spyOn(errorService as any, 'fuseInstance', 'get').mockImplementation(() => {
        throw new Error('Search service error');
      });
      
      const results = await errorService.search('test');
      
      expect(results).toEqual([]);
    });
  });
});
