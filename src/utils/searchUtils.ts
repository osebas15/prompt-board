import Fuse from 'fuse.js';
import type { Prompt } from '../features/prompts/types';

export interface SearchOptions {
  threshold?: number;
  includeScore?: boolean;
  shouldSort?: boolean;
}

export function createPromptSearcher(prompts: Prompt[], options: SearchOptions = {}) {
  const fuseOptions = {
    keys: [
      { name: 'title', weight: 2 },
      { name: 'content', weight: 1 },
      { name: 'tags', weight: 1.5 },
      { name: 'category.name', weight: 1.2 },
    ],
    threshold: options.threshold ?? 0.3,
    includeScore: options.includeScore ?? false,
    shouldSort: options.shouldSort ?? true,
  };

  return new Fuse(prompts, fuseOptions);
}

export function searchPrompts(
  searcher: Fuse<Prompt>,
  query: string
): Prompt[] {
  if (!query.trim()) {
    return searcher.getIndex().docs as Prompt[];
  }

  const results = searcher.search(query);
  return results.map(result => result.item);
}
