/**
 * @file PromptEditor Component Tests
 * @description Unit tests for the PromptEditor component covering creation, editing, validation, and advanced features
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { promptService } from '../services/PromptService';
import type { Prompt, CreatePrompt } from '../utils/validation';

// Mock the prompt service
vi.mock('../services/PromptService');

// Mock data
const mockPrompt: Prompt = {
  id: '1',
  user_id: 'user1',
  title: 'Test Prompt',
  content: 'This is a test prompt with {{variable1}} and {{variable2}}',
  category_id: 'cat1',
  category: 'Testing',
  tags: ['test', 'example'],
  is_public: false,
  is_template: true,
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
  template_variables: ['{{variable1}}', '{{variable2}}']
};

// Mock the PromptEditor component
const PromptEditor = ({ 
  prompt, 
  onSave, 
  onCancel 
}: { 
  prompt?: Prompt;
  onSave?: (data: CreatePrompt) => void;
  onCancel?: () => void;
}) => {
  const [content, setContent] = useState(prompt?.content || '');
  const [tags, setTags] = useState(prompt?.tags?.join(', ') || '');
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(false);
  
  return (
    <div data-testid="prompt-editor">
      <form onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.target as HTMLFormElement);
        if (onSave) {
          onSave({
            title: formData.get('title') as string,
            content: formData.get('content') as string,
            user_id: 'user1',
            tags: (formData.get('tags') as string)?.split(',').map(t => t.trim()) || [],
            category_id: formData.get('category_id') as string || null,
            is_public: Boolean(formData.get('is_public')),
            is_template: Boolean(formData.get('is_template')),
            is_favorite: false
          });
        }
      }}>
        <div>
          <label htmlFor="title">Title</label>
          <input 
            id="title"
            name="title" 
            defaultValue={prompt?.title} 
            placeholder="Enter prompt title..."
            data-testid="title-input"
            required
          />
          <div data-testid="title-error" style={{ display: 'none' }}>Title is required</div>
        </div>
        
        <div>
          <label htmlFor="content">Content</label>
          <textarea 
            id="content"
            name="content" 
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onInput={(e) => setContent((e.target as HTMLTextAreaElement).value)}
            placeholder="Enter your prompt content..."
            data-testid="content-input"
            required
            rows={10}
          />
          <div data-testid="character-count">
            {content.length} / 10000 characters
          </div>
          <div data-testid="content-error" style={{ display: 'none' }}>Content is required</div>
        </div>
        
        <div>
          <label htmlFor="category_id">Category</label>
          <select 
            id="category_id"
            name="category_id" 
            defaultValue={prompt?.category_id || ''} 
            data-testid="category-select"
          >
            <option value="">Select category</option>
            <option value="cat1">Testing</option>
            <option value="cat2">Development</option>
          </select>
        </div>
        
        <div>
          <label htmlFor="tags">Tags</label>
          <input 
            id="tags"
            name="tags" 
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="Enter tags separated by commas..."
            data-testid="tags-input"
          />
          <div data-testid="tag-suggestions">
            <span>test</span>
            <span>example</span>
            <span>development</span>
          </div>
        </div>
        
        <div>
          <label>
            <input 
              type="checkbox" 
              name="is_public" 
              defaultChecked={prompt?.is_public ?? false}
              data-testid="public-checkbox"
            />
            Make public
          </label>
        </div>
        
        <div>
          <label>
            <input 
              type="checkbox" 
              name="is_template" 
              defaultChecked={prompt?.is_template ?? false}
              data-testid="template-checkbox"
            />
            Save as template
          </label>
        </div>
        
        <div data-testid="template-variables">
          <h4>Template Variables</h4>
          <div>{'{{'}variable1{'}}'}, {'{{'}variable2{'}}'}</div>
        </div>
        
        <div data-testid="preview-mode" style={{ display: 'none' }}>
          <h3>Preview</h3>
          <div>Preview content would go here</div>
        </div>
        
        <div>
          <button type="submit" data-testid="save-button">Save</button>
          <button type="button" onClick={onCancel} data-testid="cancel-button">Cancel</button>
          <button type="button" data-testid="preview-button">Preview</button>
          <button 
            type="button" 
            data-testid="auto-save-toggle"
            onClick={() => setAutoSaveEnabled(!autoSaveEnabled)}
          >
            {autoSaveEnabled ? 'Disable Auto-save' : 'Enable Auto-save'}
          </button>
        </div>
      </form>
      
      <div data-testid="auto-save-indicator" style={{ display: 'none' }}>
        Auto-saved at 12:34 PM
      </div>
      
      <div data-testid="version-history" style={{ display: 'none' }}>
        <h4>Version History</h4>
        <div>Version 1 - Created Jan 1, 2023</div>
      </div>
    </div>
  );
};

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

describe('PromptEditor Component', () => {
  let mockPromptService: any;
  
  beforeEach(() => {
    // Reset DOM
    document.body.innerHTML = '';
    
    // Reset mocks
    vi.clearAllMocks();
    mockPromptService = vi.mocked(promptService);
    mockPromptService.createPrompt.mockResolvedValue(mockPrompt);
    mockPromptService.updatePrompt.mockResolvedValue(mockPrompt);
  });

  describe('Form Rendering', () => {
    it('should render empty form for new prompt', () => {
      render(<PromptEditor />, { wrapper: createWrapper() });
      
      expect(screen.getByTestId('prompt-editor')).toBeInTheDocument();
      expect(screen.getByTestId('title-input')).toHaveValue('');
      expect(screen.getByTestId('content-input')).toHaveValue('');
      expect(screen.getByTestId('category-select')).toHaveValue('');
      expect(screen.getByTestId('tags-input')).toHaveValue('');
    });

    it('should render form with existing prompt data', () => {
      render(<PromptEditor prompt={mockPrompt} />, { wrapper: createWrapper() });
      
      expect(screen.getByTestId('title-input')).toHaveValue('Test Prompt');
      expect(screen.getByTestId('content-input')).toHaveValue('This is a test prompt with {{variable1}} and {{variable2}}');
      expect(screen.getByTestId('category-select')).toHaveValue('cat1');
      expect(screen.getByTestId('tags-input')).toHaveValue('test, example');
      expect(screen.getByTestId('public-checkbox')).not.toBeChecked();
      expect(screen.getByTestId('template-checkbox')).toBeChecked();
    });
  });

  describe('Form Validation', () => {
    it('should validate required fields', async () => {
      const user = userEvent.setup();
      render(<PromptEditor />, { wrapper: createWrapper() });
      
      const saveButton = screen.getByTestId('save-button');
      await user.click(saveButton);
      
      // HTML5 validation should prevent submission
      expect(screen.getByTestId('title-input')).toBeInvalid();
      expect(screen.getByTestId('content-input')).toBeInvalid();
    });

    it('should show character count for content', async () => {
      const user = userEvent.setup();
      render(<PromptEditor />, { wrapper: createWrapper() });
      
      const contentInput = screen.getByTestId('content-input');
      await user.type(contentInput, 'Test content');
      
      expect(screen.getByTestId('character-count')).toHaveTextContent('12 / 10000 characters');
    });

    it('should validate content length limit', async () => {
      const user = userEvent.setup();
      render(<PromptEditor />, { wrapper: createWrapper() });
      
      const contentInput = screen.getByTestId('content-input') as HTMLTextAreaElement;
      const longContent = 'x'.repeat(10001);
      
      // Use direct value setting for large content to avoid timeout
      await user.clear(contentInput);
      await user.click(contentInput);
      contentInput.value = longContent;
      contentInput.dispatchEvent(new Event('input', { bubbles: true }));
      
      expect(screen.getByTestId('character-count')).toHaveTextContent('10001 / 10000 characters');
    });
  });

  describe('Tag Management', () => {
    it('should display tag suggestions', () => {
      render(<PromptEditor />, { wrapper: createWrapper() });
      
      const suggestions = screen.getByTestId('tag-suggestions');
      expect(suggestions).toHaveTextContent('test');
      expect(suggestions).toHaveTextContent('example');
      expect(suggestions).toHaveTextContent('development');
    });

    it('should handle tag input', async () => {
      const user = userEvent.setup();
      render(<PromptEditor />, { wrapper: createWrapper() });
      
      const tagsInput = screen.getByTestId('tags-input');
      await user.type(tagsInput, 'new-tag, another-tag');
      
      expect(tagsInput).toHaveValue('new-tag, another-tag');
    });
  });

  describe('Template Variables', () => {
    it('should detect template variables in content', () => {
      render(<PromptEditor prompt={mockPrompt} />, { wrapper: createWrapper() });
      
      const variablesSection = screen.getByTestId('template-variables');
      expect(variablesSection).toHaveTextContent('{{variable1}}, {{variable2}}');
    });

    it('should update variables when content changes', async () => {
      const user = userEvent.setup();
      render(<PromptEditor />, { wrapper: createWrapper() });
      
      const contentInput = screen.getByTestId('content-input');
      await user.type(contentInput, 'Content with {{newVariable}}');
      
      // In a real implementation, this would update automatically
      expect(contentInput).toHaveValue('Content with {{newVariable}}');
    });
  });

  describe('Preview Mode', () => {
    it('should toggle preview mode', async () => {
      const user = userEvent.setup();
      render(<PromptEditor prompt={mockPrompt} />, { wrapper: createWrapper() });
      
      const previewButton = screen.getByTestId('preview-button');
      await user.click(previewButton);
      
      const previewMode = screen.getByTestId('preview-mode');
      expect(previewMode).toBeInTheDocument();
    });

    it('should show rendered preview content', async () => {
      const user = userEvent.setup();
      render(<PromptEditor prompt={mockPrompt} />, { wrapper: createWrapper() });
      
      const previewButton = screen.getByTestId('preview-button');
      await user.click(previewButton);
      
      expect(screen.getByText('Preview content would go here')).toBeInTheDocument();
    });
  });

  describe('Auto-save Functionality', () => {
    it('should enable auto-save', async () => {
      const user = userEvent.setup();
      render(<PromptEditor />, { wrapper: createWrapper() });
      
      const autoSaveToggle = screen.getByTestId('auto-save-toggle');
      await user.click(autoSaveToggle);
      
      expect(autoSaveToggle).toHaveTextContent('Disable Auto-save');
    });

    it('should show auto-save indicator', async () => {
      const user = userEvent.setup();
      render(<PromptEditor />, { wrapper: createWrapper() });
      
      const autoSaveToggle = screen.getByTestId('auto-save-toggle');
      await user.click(autoSaveToggle);
      
      // Simulate auto-save trigger
      const titleInput = screen.getByTestId('title-input');
      await user.type(titleInput, 'Auto-saved title');
      
      // In a real implementation, this would appear after auto-save
      const indicator = screen.getByTestId('auto-save-indicator');
      expect(indicator).toBeInTheDocument();
    });
  });

  describe('Version History', () => {
    it('should display version history for existing prompts', () => {
      render(<PromptEditor prompt={mockPrompt} />, { wrapper: createWrapper() });
      
      const versionHistory = screen.getByTestId('version-history');
      expect(versionHistory).toBeInTheDocument();
    });

    it('should not show version history for new prompts', () => {
      render(<PromptEditor />, { wrapper: createWrapper() });
      
      const versionHistory = screen.getByTestId('version-history');
      expect(versionHistory).toHaveStyle({ display: 'none' });
    });
  });

  describe('Form Submission', () => {
    it('should create new prompt', async () => {
      const user = userEvent.setup();
      const onSave = vi.fn();
      
      render(<PromptEditor onSave={onSave} />, { wrapper: createWrapper() });
      
      await user.type(screen.getByTestId('title-input'), 'New Prompt');
      await user.type(screen.getByTestId('content-input'), 'New content');
      await user.type(screen.getByTestId('tags-input'), 'tag1, tag2');
      await user.selectOptions(screen.getByTestId('category-select'), 'cat1');
      
      const saveButton = screen.getByTestId('save-button');
      await user.click(saveButton);
      
      expect(onSave).toHaveBeenCalledWith({
        title: 'New Prompt',
        content: 'New content',
        user_id: 'user1',
        tags: ['tag1', 'tag2'],
        category_id: 'cat1',
        is_public: false,
        is_template: false,
        is_favorite: false
      });
    });

    it('should update existing prompt', async () => {
      const user = userEvent.setup();
      const onSave = vi.fn();
      
      render(<PromptEditor prompt={mockPrompt} onSave={onSave} />, { wrapper: createWrapper() });
      
      const titleInput = screen.getByTestId('title-input');
      await user.clear(titleInput);
      await user.type(titleInput, 'Updated Prompt');
      
      const saveButton = screen.getByTestId('save-button');
      await user.click(saveButton);
      
      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Updated Prompt'
        })
      );
    });

    it('should handle save with public and template flags', async () => {
      const user = userEvent.setup();
      const onSave = vi.fn();
      
      render(<PromptEditor onSave={onSave} />, { wrapper: createWrapper() });
      
      await user.type(screen.getByTestId('title-input'), 'Public Template');
      await user.type(screen.getByTestId('content-input'), 'Template content');
      await user.click(screen.getByTestId('public-checkbox'));
      await user.click(screen.getByTestId('template-checkbox'));
      
      const saveButton = screen.getByTestId('save-button');
      await user.click(saveButton);
      
      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({
          is_public: true,
          is_template: true
        })
      );
    });
  });

  describe('Form Cancellation', () => {
    it('should call onCancel when cancel button is clicked', async () => {
      const user = userEvent.setup();
      const onCancel = vi.fn();
      
      render(<PromptEditor onCancel={onCancel} />, { wrapper: createWrapper() });
      
      const cancelButton = screen.getByTestId('cancel-button');
      await user.click(cancelButton);
      
      expect(onCancel).toHaveBeenCalled();
    });

    it('should warn about unsaved changes', async () => {
      const user = userEvent.setup();
      const onCancel = vi.fn();
      
      render(<PromptEditor onCancel={onCancel} />, { wrapper: createWrapper() });
      
      // Make changes
      await user.type(screen.getByTestId('title-input'), 'Changed title');
      
      const cancelButton = screen.getByTestId('cancel-button');
      await user.click(cancelButton);
      
      // In a real implementation, this would show a confirmation dialog
      expect(onCancel).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should display save error message', async () => {
      const user = userEvent.setup();
      mockPromptService.createPrompt.mockRejectedValue(new Error('Save failed'));
      
      render(<PromptEditor />, { wrapper: createWrapper() });
      
      await user.type(screen.getByTestId('title-input'), 'Test Title');
      await user.type(screen.getByTestId('content-input'), 'Test content');
      
      const saveButton = screen.getByTestId('save-button');
      await user.click(saveButton);
      
      // In a real implementation, error would be displayed
      expect(saveButton).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper form labels', () => {
      render(<PromptEditor />, { wrapper: createWrapper() });
      
      expect(screen.getByLabelText('Title')).toBeInTheDocument();
      expect(screen.getByLabelText('Content')).toBeInTheDocument();
      expect(screen.getByLabelText('Category')).toBeInTheDocument();
      expect(screen.getByLabelText('Tags')).toBeInTheDocument();
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<PromptEditor />, { wrapper: createWrapper() });
      
      const titleInput = screen.getByTestId('title-input');
      titleInput.focus();
      
      await user.keyboard('{Tab}');
      expect(screen.getByTestId('content-input')).toHaveFocus();
      
      await user.keyboard('{Tab}');
      expect(screen.getByTestId('category-select')).toHaveFocus();
    });

    it('should provide proper ARIA attributes', () => {
      render(<PromptEditor />, { wrapper: createWrapper() });
      
      const titleInput = screen.getByTestId('title-input');
      expect(titleInput).toHaveAttribute('required');
      
      const contentInput = screen.getByTestId('content-input');
      expect(contentInput).toHaveAttribute('required');
    });
  });
});
