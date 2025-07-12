/**
 * @file PromptList Component Tests
 * @description Unit tests for the PromptList component covering display, search, filtering, and interaction features
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PromptList } from '../components/PromptList';
import { promptService } from '../services/PromptService';
import type { Prompt } from '../utils/validation';

// Mock the prompt service
vi.mock('../services/PromptService');

// Mock prompts data with complete interface
const mockPrompts: Prompt[] = [
  {
    id: '1',
    user_id: 'user1',
    title: 'Test Prompt 1',
    content: 'This is a test prompt content',
    category_id: 'cat1',
    category: 'Testing',
    tags: ['test', 'example'],
    is_public: false,
    is_template: false,
    usage_count: 5,
    rating: 4.5,
    last_used_at: '2023-01-01T00:00:00Z',
    version: 1,
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
    description: 'Test description',
    model_compatibility: ['gpt-4', 'gemini'],
    parameters: { temperature: 0.7 },
    is_favorite: false,
    folder_id: null,
    parent_id: null,
    template_variables: null
  },
  {
    id: '2', 
    user_id: 'user1',
    title: 'Another Test Prompt',
    content: 'Different content here',
    category_id: 'cat2',
    category: 'Development',
    tags: ['dev', 'code'],
    is_public: true,
    is_template: true,
    usage_count: 10,
    rating: 3.8,
    last_used_at: '2023-01-02T00:00:00Z',
    version: 2,
    created_at: '2023-01-02T00:00:00Z',
    updated_at: '2023-01-02T00:00:00Z',
    description: 'Development prompt',
    model_compatibility: ['gemini'],
    parameters: { temperature: 0.5 },
    is_favorite: true,
    folder_id: null,
    parent_id: null,
    template_variables: ['{{variable1}}', '{{variable2}}']
  }
];

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('PromptList Component', () => {
  let mockPromptService: any;
  
  beforeEach(() => {
    mockPromptService = vi.mocked(promptService);
    mockPromptService.listPrompts.mockResolvedValue({
      data: mockPrompts,
      pagination: {
        page: 1,
        limit: 10,
        total: 2,
        totalPages: 1
      }
    });
  });

  describe('Display and Rendering', () => {
    it('should display list of prompts', async () => {
      render(<PromptList />, { wrapper: createWrapper() });
      
      await waitFor(() => {
        expect(screen.getByText('Test Prompt 1')).toBeInTheDocument();
        expect(screen.getByText('Another Test Prompt')).toBeInTheDocument();
      });
    });

    it('should show loading state initially', () => {
      render(<PromptList />, { wrapper: createWrapper() });
      
      expect(screen.getByTestId('prompt-list-loading')).toBeInTheDocument();
    });

    it('should display prompt cards with correct information', async () => {
      render(<PromptList />, { wrapper: createWrapper() });
      
      await waitFor(() => {
        // Check first prompt details
        expect(screen.getByText('Test Prompt 1')).toBeInTheDocument();
        expect(screen.getAllByText('Testing')).toHaveLength(2); // One in dropdown, one in category display
        expect(screen.getByText('test')).toBeInTheDocument();
        expect(screen.getByText('example')).toBeInTheDocument();
        expect(screen.getByText('5 uses')).toBeInTheDocument();
      });
    });

    it('should toggle between grid and list view', async () => {
      const user = userEvent.setup();
      render(<PromptList />, { wrapper: createWrapper() });
      
      await waitFor(() => {
        expect(screen.getByTestId('prompt-grid')).toBeInTheDocument();
      });
      
      const listViewButton = screen.getByTestId('list-view-button');
      await user.click(listViewButton);
      
      expect(screen.getByTestId('prompt-list-view')).toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    it('should perform search with debounced input', async () => {
      const user = userEvent.setup();
      render(<PromptList />, { wrapper: createWrapper() });
      
      const searchInput = screen.getByPlaceholderText('Search prompts...');
      await user.type(searchInput, 'test prompt');
      
      await waitFor(() => {
        expect(mockPromptService.listPrompts).toHaveBeenCalledWith(
          expect.objectContaining({
            search: 'test prompt'
          }),
          expect.any(Object)
        );
      }, { timeout: 1000 });
    });

    it('should clear search results', async () => {
      const user = userEvent.setup();
      render(<PromptList />, { wrapper: createWrapper() });
      
      const searchInput = screen.getByPlaceholderText('Search prompts...');
      await user.type(searchInput, 'test');
      
      const clearButton = screen.getByTestId('clear-search');
      await user.click(clearButton);
      
      expect(searchInput).toHaveValue('');
    });

    it('should highlight search terms in results', async () => {
      const user = userEvent.setup();
      render(<PromptList />, { wrapper: createWrapper() });
      
      const searchInput = screen.getByPlaceholderText('Search prompts...');
      await user.type(searchInput, 'test');
      
      await waitFor(() => {
        expect(screen.getByTestId('highlighted-text')).toBeInTheDocument();
      });
    });
  });

  describe('Filtering', () => {
    it('should filter by category', async () => {
      const user = userEvent.setup();
      render(<PromptList />, { wrapper: createWrapper() });
      
      const categoryFilter = screen.getByTestId('category-filter');
      await user.selectOptions(categoryFilter, 'cat1');
      
      await waitFor(() => {
        expect(mockPromptService.listPrompts).toHaveBeenCalledWith(
          expect.objectContaining({
            category_id: 'cat1'
          }),
          expect.any(Object)
        );
      });
    });

    it('should filter by tags', async () => {
      const user = userEvent.setup();
      render(<PromptList />, { wrapper: createWrapper() });
      
      const tagFilter = screen.getByTestId('tag-filter');
      await user.click(tagFilter);
      
      const testTag = screen.getByText('test');
      await user.click(testTag);
      
      await waitFor(() => {
        expect(mockPromptService.listPrompts).toHaveBeenCalledWith(
          expect.objectContaining({
            tags: ['test']
          }),
          expect.any(Object)
        );
      });
    });

    it('should combine search and filters', async () => {
      const user = userEvent.setup();
      render(<PromptList />, { wrapper: createWrapper() });
      
      const searchInput = screen.getByPlaceholderText('Search prompts...');
      await user.type(searchInput, 'prompt');
      
      const categoryFilter = screen.getByTestId('category-filter');
      await user.selectOptions(categoryFilter, 'cat1');
      
      await waitFor(() => {
        expect(mockPromptService.listPrompts).toHaveBeenCalledWith(
          expect.objectContaining({
            search: 'prompt',
            category_id: 'cat1'
          }),
          expect.any(Object)
        );
      });
    });
  });

  describe('Sorting', () => {
    it('should sort by date', async () => {
      const user = userEvent.setup();
      render(<PromptList />, { wrapper: createWrapper() });
      
      const sortSelect = screen.getByTestId('sort-select');
      await user.selectOptions(sortSelect, 'created_at');
      
      await waitFor(() => {
        expect(mockPromptService.listPrompts).toHaveBeenCalledWith(
          expect.any(Object),
          expect.objectContaining({
            sort_by: 'created_at',
            sort_order: 'desc'
          })
        );
      });
    });

    it('should toggle sort order', async () => {
      const user = userEvent.setup();
      render(<PromptList />, { wrapper: createWrapper() });
      
      const sortOrderButton = screen.getByTestId('sort-order-toggle');
      await user.click(sortOrderButton);
      
      await waitFor(() => {
        expect(mockPromptService.listPrompts).toHaveBeenCalledWith(
          expect.any(Object),
          expect.objectContaining({
            sort_order: 'asc'
          })
        );
      });
    });
  });

  describe('Pagination', () => {
    it('should handle pagination', async () => {
      const user = userEvent.setup();
      mockPromptService.listPrompts.mockResolvedValue({
        data: mockPrompts,
        pagination: {
          page: 1,
          limit: 10,
          total: 25,
          total_pages: 3,
          has_next: true,
          has_prev: false
        }
      });
      
      render(<PromptList />, { wrapper: createWrapper() });
      
      await waitFor(() => {
        expect(screen.getByText('Page 1 of 3')).toBeInTheDocument();
      });
      
      const nextButton = screen.getByTestId('next-page');
      await user.click(nextButton);
      
      expect(mockPromptService.listPrompts).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          page: 2
        })
      );
    });
  });

  describe('Bulk Operations', () => {
    it('should support bulk selection', async () => {
      const user = userEvent.setup();
      render(<PromptList enableBulkActions={true} />, { wrapper: createWrapper() });
      
      await waitFor(() => {
        expect(screen.getByText('Test Prompt 1')).toBeInTheDocument();
      });
      
      const selectAllCheckbox = screen.getByTestId('select-all-button');
      await user.click(selectAllCheckbox);
      
      expect(screen.getByText('Delete Selected (2)')).toBeInTheDocument();
    });

    it('should perform bulk delete', async () => {
      const user = userEvent.setup();
      mockPromptService.deletePrompt = vi.fn().mockResolvedValue(undefined);
      
      render(<PromptList enableBulkActions={true} />, { wrapper: createWrapper() });
      
      await waitFor(() => {
        expect(screen.getByText('Test Prompt 1')).toBeInTheDocument();
      });
      
      const selectAllCheckbox = screen.getByTestId('select-all-button');
      await user.click(selectAllCheckbox);
      
      const bulkDeleteButton = screen.getByTestId('bulk-delete-button');
      await user.click(bulkDeleteButton);
      
      await waitFor(() => {
        expect(mockPromptService.deletePrompt).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error message when loading fails', async () => {
      mockPromptService.listPrompts.mockRejectedValue(new Error('Failed to load'));
      
      render(<PromptList />, { wrapper: createWrapper() });
      
      await waitFor(() => {
        expect(screen.getByText('Failed to load prompts')).toBeInTheDocument();
      });
    });

    it('should show retry button on error', async () => {
      const user = userEvent.setup();
      mockPromptService.listPrompts.mockRejectedValue(new Error('Failed to load'));
      
      render(<PromptList />, { wrapper: createWrapper() });
      
      await waitFor(() => {
        expect(screen.getByTestId('retry-button')).toBeInTheDocument();
      });
      
      mockPromptService.listPrompts.mockResolvedValue({
        data: mockPrompts,
        pagination: { page: 1, limit: 10, total: 2, totalPages: 1 }
      });
      
      const retryButton = screen.getByTestId('retry-button');
      await user.click(retryButton);
      
      await waitFor(() => {
        expect(screen.getByText('Test Prompt 1')).toBeInTheDocument();
      });
    });
  });

  describe('Empty States', () => {
    it('should show empty state when no prompts exist', async () => {
      mockPromptService.listPrompts.mockResolvedValue({
        data: [],
        pagination: { page: 1, limit: 10, total: 0, totalPages: 0 }
      });
      
      render(<PromptList />, { wrapper: createWrapper() });
      
      await waitFor(() => {
        expect(screen.getByTestId('empty-state')).toBeInTheDocument();
        expect(screen.getByText('No prompts found')).toBeInTheDocument();
      });
    });

    it('should show empty search results', async () => {
      const user = userEvent.setup();
      render(<PromptList />, { wrapper: createWrapper() });
      
      mockPromptService.listPrompts.mockResolvedValue({
        data: [],
        pagination: { page: 1, limit: 10, total: 0, totalPages: 0 }
      });
      
      const searchInput = screen.getByPlaceholderText('Search prompts...');
      await user.type(searchInput, 'nonexistent');
      
      await waitFor(() => {
        expect(screen.getByText('No prompts match your search')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', async () => {
      render(<PromptList />, { wrapper: createWrapper() });
      
      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getByRole('search')).toBeInTheDocument();
      expect(screen.getByLabelText('Search prompts')).toBeInTheDocument();
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<PromptList />, { wrapper: createWrapper() });
      
      await waitFor(() => {
        expect(screen.getByText('Test Prompt 1')).toBeInTheDocument();
      });
      
      const firstPrompt = screen.getByTestId('prompt-card-1');
      firstPrompt.focus();
      
      await user.keyboard('{Enter}');
      
      // Should navigate to prompt detail
      expect(screen.getByTestId('prompt-detail-modal')).toBeInTheDocument();
    });
  });
});
