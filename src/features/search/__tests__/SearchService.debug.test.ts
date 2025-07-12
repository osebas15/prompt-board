import { describe, it, expect } from 'vitest';
import { SearchService } from '../services/SearchService';
import type { GlobalSearchItem } from '../types';

describe('SearchService Debug', () => {
  it('should find authentication in content', async () => {
    const service = new SearchService();
    const items: GlobalSearchItem[] = [
      {
        id: '1',
        type: 'prompt',
        title: 'React Component Creation',
        content: 'Create a reusable React component for user authentication',
        category: 'development',
        tags: ['react', 'component', 'auth'],
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        metadata: { author: 'user1', difficulty: 'medium' }
      }
    ];
    
    service.updateItems(items);
    console.log('Items updated:', items.length);
    
    // Test different search terms
    let results = await service.search('auth');
    console.log('Search results for "auth":', results.length);
    
    results = await service.search('authentication');
    console.log('Search results for "authentication":', results.length);
    
    results = await service.search('user');
    console.log('Search results for "user":', results.length);
    
    results = await service.search('React');
    console.log('Search results for "React":', results.length);
    
    results = await service.search('component');
    console.log('Search results for "component":', results.length);
    
    // Test the original exact term
    results = await service.search('authentication');
    console.log('Final results:', results);
    
    expect(results.length).toBeGreaterThan(0);
  });
});
