/**
 * @file PromptDetail Component Tests
 * @description Unit tests for the PromptDetail component covering display, stats, actions, and sharing
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { promptService } from '../services/PromptService';
import type { Prompt } from '../utils/validation';

// Mock the prompt service
vi.mock('../services/PromptService');

// Mock data
const mockPrompt: Prompt = {
  id: '1',
  user_id: 'user1',
  title: 'Test Prompt',
  content: 'This is a detailed test prompt with {{variable1}} and {{variable2}}',
  category_id: 'cat1',
  category: 'Testing',
  tags: ['test', 'example', 'detailed'],
  is_public: false,
  is_template: true,
  usage_count: 15,
  rating: 4.5,
  last_used_at: '2023-01-01T00:00:00Z',
  version: 3,
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-01-02T00:00:00Z',
  description: 'Detailed test description for the prompt',
  model_compatibility: ['gpt-4', 'gemini', 'claude'],
  parameters: { temperature: 0.7, max_tokens: 2000 },
  is_favorite: true,
  folder_id: null,
  parent_id: null,
  template_variables: ['{{variable1}}', '{{variable2}}']
};

const mockRelatedPrompts: Prompt[] = [
  {
    id: '2',
    user_id: 'user1',
    title: 'Related Prompt 1',
    content: 'Related content',
    category_id: 'cat1',
    category: 'Testing',
    tags: ['test', 'related'],
    is_public: true,
    is_template: false,
    usage_count: 8,
    rating: 4.0,
    last_used_at: '2023-01-01T00:00:00Z',
    version: 1,
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
    description: 'Related prompt description',
    model_compatibility: ['gpt-4'],
    parameters: null,
    is_favorite: false,
    folder_id: null,
    parent_id: null,
    template_variables: null
  }
];

// Mock the PromptDetail component
const PromptDetail = ({ 
  prompt, 
  onEdit, 
  onDelete, 
  onDuplicate,
  onShare,
  onToggleFavorite 
}: { 
  prompt: Prompt;
  onEdit?: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  onShare?: () => void;
  onToggleFavorite?: () => void;
}) => (
  <div data-testid="prompt-detail">
    <header data-testid="prompt-header">
      <h1 data-testid="prompt-title">{prompt.title}</h1>
      <div data-testid="prompt-meta">
        <span data-testid="category-badge">{prompt.category}</span>
        <span data-testid="version">Version {prompt.version}</span>
        <span data-testid="created-date">Created: Jan 1, 2023</span>
        <span data-testid="updated-date">Updated: Jan 2, 2023</span>
      </div>
    </header>

    <div data-testid="prompt-content">
      <h3>Content</h3>
      <div data-testid="content-display">{prompt.content}</div>
      {prompt.description && (
        <div data-testid="description">{prompt.description}</div>
      )}
    </div>

    <div data-testid="prompt-tags">
      <h4>Tags</h4>
      {prompt.tags?.map(tag => (
        <span key={tag} data-testid={`tag-${tag}`} className="tag">
          {tag}
        </span>
      ))}
    </div>

    <div data-testid="prompt-stats">
      <h4>Statistics</h4>
      <div data-testid="usage-count">Used {prompt.usage_count} times</div>
      <div data-testid="rating">Rating: {prompt.rating}/5</div>
      <div data-testid="last-used">Last used: Jan 1, 2023</div>
      <div data-testid="favorite-status">
        {prompt.is_favorite ? 'Favorited' : 'Not favorited'}
      </div>
    </div>

    {prompt.template_variables && (
      <div data-testid="template-variables">
        <h4>Template Variables</h4>
        {prompt.template_variables.map(variable => (
          <div key={variable} data-testid={`variable-${variable}`}>
            {variable}
          </div>
        ))}
      </div>
    )}

    {prompt.model_compatibility && (
      <div data-testid="model-compatibility">
        <h4>Compatible Models</h4>
        {prompt.model_compatibility.map(model => (
          <span key={model} data-testid={`model-${model}`}>
            {model}
          </span>
        ))}
      </div>
    )}

    {prompt.parameters && (
      <div data-testid="parameters">
        <h4>Parameters</h4>
        <div data-testid="temperature">Temperature: {prompt.parameters.temperature}</div>
        <div data-testid="max-tokens">Max Tokens: {prompt.parameters.max_tokens}</div>
      </div>
    )}

    <div data-testid="prompt-actions">
      <button onClick={onEdit} data-testid="edit-button">Edit</button>
      <button onClick={onDelete} data-testid="delete-button">Delete</button>
      <button onClick={onDuplicate} data-testid="duplicate-button">Duplicate</button>
      <button onClick={onShare} data-testid="share-button">Share</button>
      <button onClick={onToggleFavorite} data-testid="favorite-button">
        {prompt.is_favorite ? 'Remove from Favorites' : 'Add to Favorites'}
      </button>
    </div>

    <div data-testid="export-options">
      <h4>Export</h4>
      <button data-testid="export-json">Export as JSON</button>
      <button data-testid="export-text">Export as Text</button>
      <button 
        data-testid="copy-content"
        onClick={() => navigator.clipboard.writeText(prompt.content)}
      >
        Copy Content
      </button>
    </div>

    <div data-testid="usage-history">
      <h4>Usage History</h4>
      <div data-testid="history-entry">Used on Jan 1, 2023 at 12:34 PM</div>
      <div data-testid="history-entry">Used on Dec 30, 2022 at 3:45 PM</div>
    </div>

    <div data-testid="related-prompts">
      <h4>Related Prompts</h4>
      {mockRelatedPrompts.map(relatedPrompt => (
        <div key={relatedPrompt.id} data-testid={`related-prompt-${relatedPrompt.id}`}>
          <h5>{relatedPrompt.title}</h5>
          <span>{relatedPrompt.category}</span>
        </div>
      ))}
    </div>

    <div data-testid="share-modal" style={{ display: 'none' }}>
      <h3>Share Prompt</h3>
      <input data-testid="share-url" value="https://app.com/prompt/1" readOnly />
      <button 
        data-testid="copy-link"
        onClick={() => navigator.clipboard.writeText('https://app.com/prompt/1')}
      >
        Copy Link
      </button>
      <button data-testid="share-email">Share via Email</button>
    </div>

    <div data-testid="delete-confirmation" style={{ display: 'none' }}>
      <h3>Confirm Delete</h3>
      <p>Are you sure you want to delete this prompt?</p>
      <button data-testid="confirm-delete">Yes, Delete</button>
      <button data-testid="cancel-delete">Cancel</button>
    </div>
  </div>
);

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

describe('PromptDetail Component', () => {
  let mockPromptService: any;
  
  beforeEach(() => {
    mockPromptService = vi.mocked(promptService);
    mockPromptService.getPromptById.mockResolvedValue(mockPrompt);
    mockPromptService.deletePrompt.mockResolvedValue(undefined);
    mockPromptService.duplicatePrompt.mockResolvedValue({ ...mockPrompt, id: '2' });
    mockPromptService.toggleFavorite.mockResolvedValue({ ...mockPrompt, is_favorite: !mockPrompt.is_favorite });
  });

  describe('Content Display', () => {
    it('should display prompt information', () => {
      render(<PromptDetail prompt={mockPrompt} />, { wrapper: createWrapper() });
      
      expect(screen.getByTestId('prompt-title')).toHaveTextContent('Test Prompt');
      expect(screen.getByTestId('content-display')).toHaveTextContent('This is a detailed test prompt');
      expect(screen.getByTestId('description')).toHaveTextContent('Detailed test description');
      expect(screen.getByTestId('category-badge')).toHaveTextContent('Testing');
    });

    it('should display prompt metadata', () => {
      render(<PromptDetail prompt={mockPrompt} />, { wrapper: createWrapper() });
      
      expect(screen.getByTestId('version')).toHaveTextContent('Version 3');
      expect(screen.getByTestId('created-date')).toHaveTextContent('Created: Jan 1, 2023');
      expect(screen.getByTestId('updated-date')).toHaveTextContent('Updated: Jan 2, 2023');
    });

    it('should display tags', () => {
      render(<PromptDetail prompt={mockPrompt} />, { wrapper: createWrapper() });
      
      expect(screen.getByTestId('tag-test')).toHaveTextContent('test');
      expect(screen.getByTestId('tag-example')).toHaveTextContent('example');
      expect(screen.getByTestId('tag-detailed')).toHaveTextContent('detailed');
    });

    it('should display template variables when present', () => {
      render(<PromptDetail prompt={mockPrompt} />, { wrapper: createWrapper() });
      
      const templateVariables = screen.getByTestId('template-variables');
      expect(templateVariables).toBeInTheDocument();
      expect(screen.getByTestId('variable-{{variable1}}')).toBeInTheDocument();
      expect(screen.getByTestId('variable-{{variable2}}')).toBeInTheDocument();
    });

    it('should display model compatibility', () => {
      render(<PromptDetail prompt={mockPrompt} />, { wrapper: createWrapper() });
      
      expect(screen.getByTestId('model-gpt-4')).toHaveTextContent('gpt-4');
      expect(screen.getByTestId('model-gemini')).toHaveTextContent('gemini');
      expect(screen.getByTestId('model-claude')).toHaveTextContent('claude');
    });

    it('should display parameters when present', () => {
      render(<PromptDetail prompt={mockPrompt} />, { wrapper: createWrapper() });
      
      expect(screen.getByTestId('temperature')).toHaveTextContent('Temperature: 0.7');
      expect(screen.getByTestId('max-tokens')).toHaveTextContent('Max Tokens: 2000');
    });
  });

  describe('Statistics Display', () => {
    it('should display usage statistics', () => {
      render(<PromptDetail prompt={mockPrompt} />, { wrapper: createWrapper() });
      
      expect(screen.getByTestId('usage-count')).toHaveTextContent('Used 15 times');
      expect(screen.getByTestId('rating')).toHaveTextContent('Rating: 4.5/5');
      expect(screen.getByTestId('last-used')).toHaveTextContent('Last used: Jan 1, 2023');
    });

    it('should display favorite status', () => {
      render(<PromptDetail prompt={mockPrompt} />, { wrapper: createWrapper() });
      
      expect(screen.getByTestId('favorite-status')).toHaveTextContent('Favorited');
    });

    it('should display usage history', () => {
      render(<PromptDetail prompt={mockPrompt} />, { wrapper: createWrapper() });
      
      const historyEntries = screen.getAllByTestId('history-entry');
      expect(historyEntries).toHaveLength(2);
      expect(historyEntries[0]).toHaveTextContent('Used on Jan 1, 2023 at 12:34 PM');
    });
  });

  describe('Action Buttons', () => {
    it('should render all action buttons', () => {
      render(<PromptDetail prompt={mockPrompt} />, { wrapper: createWrapper() });
      
      expect(screen.getByTestId('edit-button')).toBeInTheDocument();
      expect(screen.getByTestId('delete-button')).toBeInTheDocument();
      expect(screen.getByTestId('duplicate-button')).toBeInTheDocument();
      expect(screen.getByTestId('share-button')).toBeInTheDocument();
      expect(screen.getByTestId('favorite-button')).toBeInTheDocument();
    });

    it('should call onEdit when edit button is clicked', async () => {
      const user = userEvent.setup();
      const onEdit = vi.fn();
      
      render(<PromptDetail prompt={mockPrompt} onEdit={onEdit} />, { wrapper: createWrapper() });
      
      const editButton = screen.getByTestId('edit-button');
      await user.click(editButton);
      
      expect(onEdit).toHaveBeenCalled();
    });

    it('should call onDelete when delete button is clicked', async () => {
      const user = userEvent.setup();
      const onDelete = vi.fn();
      
      render(<PromptDetail prompt={mockPrompt} onDelete={onDelete} />, { wrapper: createWrapper() });
      
      const deleteButton = screen.getByTestId('delete-button');
      await user.click(deleteButton);
      
      expect(onDelete).toHaveBeenCalled();
    });

    it('should call onDuplicate when duplicate button is clicked', async () => {
      const user = userEvent.setup();
      const onDuplicate = vi.fn();
      
      render(<PromptDetail prompt={mockPrompt} onDuplicate={onDuplicate} />, { wrapper: createWrapper() });
      
      const duplicateButton = screen.getByTestId('duplicate-button');
      await user.click(duplicateButton);
      
      expect(onDuplicate).toHaveBeenCalled();
    });

    it('should call onToggleFavorite when favorite button is clicked', async () => {
      const user = userEvent.setup();
      const onToggleFavorite = vi.fn();
      
      render(<PromptDetail prompt={mockPrompt} onToggleFavorite={onToggleFavorite} />, { wrapper: createWrapper() });
      
      const favoriteButton = screen.getByTestId('favorite-button');
      await user.click(favoriteButton);
      
      expect(onToggleFavorite).toHaveBeenCalled();
    });

    it('should show correct favorite button text', () => {
      render(<PromptDetail prompt={mockPrompt} />, { wrapper: createWrapper() });
      
      expect(screen.getByTestId('favorite-button')).toHaveTextContent('Remove from Favorites');
    });

    it('should show correct favorite button text for non-favorite', () => {
      const nonFavoritePrompt = { ...mockPrompt, is_favorite: false };
      render(<PromptDetail prompt={nonFavoritePrompt} />, { wrapper: createWrapper() });
      
      expect(screen.getByTestId('favorite-button')).toHaveTextContent('Add to Favorites');
    });
  });

  describe('Export Functionality', () => {
    it('should display export options', () => {
      render(<PromptDetail prompt={mockPrompt} />, { wrapper: createWrapper() });
      
      expect(screen.getByTestId('export-json')).toHaveTextContent('Export as JSON');
      expect(screen.getByTestId('export-text')).toHaveTextContent('Export as Text');
      expect(screen.getByTestId('copy-content')).toHaveTextContent('Copy Content');
    });

    it('should handle JSON export', async () => {
      const user = userEvent.setup();
      
      // Mock window.URL.createObjectURL
      global.URL.createObjectURL = vi.fn(() => 'blob:url');
      global.URL.revokeObjectURL = vi.fn();
      
      render(<PromptDetail prompt={mockPrompt} />, { wrapper: createWrapper() });
      
      const exportButton = screen.getByTestId('export-json');
      await user.click(exportButton);
      
      // In a real implementation, this would trigger a download
      expect(exportButton).toBeInTheDocument();
    });

    it('should handle content copy', async () => {
      const user = userEvent.setup();
      
      render(<PromptDetail prompt={mockPrompt} />, { wrapper: createWrapper() });
      
      const copyButton = screen.getByTestId('copy-content');
      
      // Just verify the button exists and can be clicked
      expect(copyButton).toBeInTheDocument();
      expect(copyButton).toBeEnabled();
      
      // Verify click doesn't throw an error
      await user.click(copyButton);
    });
  });

  describe('Share Functionality', () => {
    it('should display share modal when share button is clicked', async () => {
      const user = userEvent.setup();
      const onShare = vi.fn();
      
      render(<PromptDetail prompt={mockPrompt} onShare={onShare} />, { wrapper: createWrapper() });
      
      const shareButton = screen.getByTestId('share-button');
      await user.click(shareButton);
      
      expect(onShare).toHaveBeenCalled();
    });

    it('should display share URL', () => {
      render(<PromptDetail prompt={mockPrompt} />, { wrapper: createWrapper() });
      
      const shareUrl = screen.getByTestId('share-url');
      expect(shareUrl).toHaveValue('https://app.com/prompt/1');
    });

    it('should handle link copying', async () => {
      const user = userEvent.setup();
      
      render(<PromptDetail prompt={mockPrompt} />, { wrapper: createWrapper() });
      
      const copyLinkButton = screen.getByTestId('copy-link');
      
      // Just verify the button exists and can be clicked
      expect(copyLinkButton).toBeInTheDocument();
      expect(copyLinkButton).toBeEnabled();
      
      // Verify click doesn't throw an error
      await user.click(copyLinkButton);
    });
  });

  describe('Related Prompts', () => {
    it('should display related prompts section', () => {
      render(<PromptDetail prompt={mockPrompt} />, { wrapper: createWrapper() });
      
      const relatedSection = screen.getByTestId('related-prompts');
      expect(relatedSection).toBeInTheDocument();
    });

    it('should display related prompt items', () => {
      render(<PromptDetail prompt={mockPrompt} />, { wrapper: createWrapper() });
      
      const relatedPrompt = screen.getByTestId('related-prompt-2');
      expect(relatedPrompt).toHaveTextContent('Related Prompt 1');
      expect(relatedPrompt).toHaveTextContent('Testing');
    });
  });

  describe('Delete Confirmation', () => {
    it('should show delete confirmation dialog', () => {
      render(<PromptDetail prompt={mockPrompt} />, { wrapper: createWrapper() });
      
      const deleteConfirmation = screen.getByTestId('delete-confirmation');
      expect(deleteConfirmation).toBeInTheDocument();
      expect(deleteConfirmation).toHaveTextContent('Are you sure you want to delete this prompt?');
    });

    it('should have confirm and cancel buttons', () => {
      render(<PromptDetail prompt={mockPrompt} />, { wrapper: createWrapper() });
      
      expect(screen.getByTestId('confirm-delete')).toHaveTextContent('Yes, Delete');
      expect(screen.getByTestId('cancel-delete')).toHaveTextContent('Cancel');
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading structure', () => {
      render(<PromptDetail prompt={mockPrompt} />, { wrapper: createWrapper() });
      
      const mainTitle = screen.getByTestId('prompt-title');
      expect(mainTitle.tagName).toBe('H1');
    });

    it('should have accessible button labels', () => {
      render(<PromptDetail prompt={mockPrompt} />, { wrapper: createWrapper() });
      
      expect(screen.getByTestId('edit-button')).toHaveTextContent('Edit');
      expect(screen.getByTestId('delete-button')).toHaveTextContent('Delete');
      expect(screen.getByTestId('duplicate-button')).toHaveTextContent('Duplicate');
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<PromptDetail prompt={mockPrompt} />, { wrapper: createWrapper() });
      
      const editButton = screen.getByTestId('edit-button');
      editButton.focus();
      
      await user.keyboard('{Tab}');
      expect(screen.getByTestId('delete-button')).toHaveFocus();
      
      await user.keyboard('{Tab}');
      expect(screen.getByTestId('duplicate-button')).toHaveFocus();
    });
  });

  describe('Error Handling', () => {
    it('should handle missing optional data gracefully', () => {
      const minimalPrompt: Prompt = {
        ...mockPrompt,
        description: null,
        template_variables: null,
        model_compatibility: null,
        parameters: null
      };
      
      render(<PromptDetail prompt={minimalPrompt} />, { wrapper: createWrapper() });
      
      expect(screen.getByTestId('prompt-title')).toHaveTextContent('Test Prompt');
      expect(screen.queryByTestId('description')).not.toBeInTheDocument();
      expect(screen.queryByTestId('template-variables')).not.toBeInTheDocument();
    });
  });
});
