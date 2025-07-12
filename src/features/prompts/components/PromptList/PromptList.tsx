import React, { useState, useMemo } from 'react';
import { useDebounce } from 'use-debounce';
import { PromptCard } from '../PromptCard';
import { usePrompts, useDeletePrompt } from '../../hooks/usePrompts';
import type { Prompt, PromptFilters, Pagination } from '../../utils/validation';

export interface PromptListProps {
  initialFilters?: PromptFilters;
  viewMode?: 'grid' | 'list';
  enableBulkActions?: boolean;
  onPromptSelect?: (prompt: Prompt) => void;
  className?: string;
}

export const PromptList: React.FC<PromptListProps> = ({
  initialFilters = {},
  viewMode = 'grid',
  enableBulkActions = false,
  onPromptSelect,
  className = ''
}) => {
  // Local state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedPrompts, setSelectedPrompts] = useState<Set<string>>(new Set());
  const [currentViewMode, setCurrentViewMode] = useState(viewMode);
  const [sortBy, setSortBy] = useState<'created_at' | 'updated_at' | 'usage_count' | 'title'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Debounced search
  const [debouncedSearchTerm] = useDebounce(searchTerm, 300);

  // Build filters
  const filters = useMemo<PromptFilters>(() => ({
    ...initialFilters,
    search: debouncedSearchTerm || undefined,
    category_id: selectedCategory || undefined,
    tags: selectedTags.length > 0 ? selectedTags : undefined,
  }), [initialFilters, debouncedSearchTerm, selectedCategory, selectedTags]);

  // Build pagination
  const pagination = useMemo<Pagination>(() => ({
    page: 1,
    limit: 20,
    sort_by: sortBy,
    sort_order: sortOrder,
  }), [sortBy, sortOrder]);

  // Fetch data
  const { 
    data: promptsData, 
    isLoading, 
    error, 
    refetch 
  } = usePrompts(filters, pagination);

  const deletePromptMutation = useDeletePrompt();

  // Handlers
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCategory(e.target.value);
  };

  const handlePromptSelect = (promptId: string, selected: boolean) => {
    const newSelected = new Set(selectedPrompts);
    if (selected) {
      newSelected.add(promptId);
    } else {
      newSelected.delete(promptId);
    }
    setSelectedPrompts(newSelected);
  };

  const handleSelectAll = () => {
    if (promptsData?.data) {
      const allIds = new Set(promptsData.data.map(p => p.id));
      setSelectedPrompts(allIds);
    }
  };

  const handleSelectNone = () => {
    setSelectedPrompts(new Set());
  };

  const handlePromptClick = (prompt: Prompt) => {
    onPromptSelect?.(prompt);
  };

  const handlePromptEdit = (prompt: Prompt) => {
    // This will be handled by parent component
    console.log('Edit prompt:', prompt.id);
  };

  const handlePromptDuplicate = (prompt: Prompt) => {
    // This will be handled by parent component
    console.log('Duplicate prompt:', prompt.id);
  };

  const handlePromptDelete = async (promptId: string) => {
    if (window.confirm('Are you sure you want to delete this prompt?')) {
      try {
        await deletePromptMutation.mutateAsync(promptId);
        // Remove from selection if it was selected
        const newSelected = new Set(selectedPrompts);
        newSelected.delete(promptId);
        setSelectedPrompts(newSelected);
      } catch (error) {
        console.error('Failed to delete prompt:', error);
      }
    }
  };

  const handleBulkDelete = async () => {
    if (selectedPrompts.size === 0) return;
    
    if (window.confirm(`Are you sure you want to delete ${selectedPrompts.size} prompts?`)) {
      try {
        await Promise.all(
          Array.from(selectedPrompts).map(id => 
            deletePromptMutation.mutateAsync(id)
          )
        );
        setSelectedPrompts(new Set());
      } catch (error) {
        console.error('Failed to delete prompts:', error);
      }
    }
  };

  const prompts = promptsData?.data || [];

  // Loading skeleton
  if (isLoading) {
    return (
      <div className={`space-y-4 ${className}`} data-testid="prompt-list-loading">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="bg-gray-200 rounded-lg h-32 animate-pulse" />
        ))}
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`text-center py-8 ${className}`} data-testid="prompt-list-error">
        <div className="text-red-600 mb-4">Failed to load prompts</div>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          data-testid="retry-button"
        >
          Try Again
        </button>
      </div>
    );
  }

  // Empty state
  if (prompts.length === 0) {
    return (
      <div className={`text-center py-8 ${className}`} data-testid="prompt-list-empty">
        <div className="text-gray-500 mb-4">
          {debouncedSearchTerm || selectedCategory || selectedTags.length > 0
            ? 'No prompts found matching your criteria'
            : 'No prompts found'
          }
        </div>
        {(debouncedSearchTerm || selectedCategory || selectedTags.length > 0) && (
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedCategory('');
              setSelectedTags([]);
            }}
            className="text-blue-600 hover:text-blue-800"
          >
            Clear filters
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`} data-testid="prompt-list">
      {/* Header */}
      <div className="space-y-4">
        {/* Search and filters */}
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search prompts..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              data-testid="search-input"
            />
          </div>

          {/* Category filter */}
          <div className="w-full md:w-48">
            <select
              value={selectedCategory}
              onChange={handleCategoryChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              data-testid="category-filter"
            >
              <option value="">All Categories</option>
              <option value="work">Work</option>
              <option value="personal">Personal</option>
              <option value="coding">Coding</option>
            </select>
          </div>

          {/* View mode toggle */}
          <div className="flex rounded-lg overflow-hidden border border-gray-300">
            <button
              onClick={() => setCurrentViewMode('grid')}
              className={`px-3 py-2 text-sm font-medium ${
                currentViewMode === 'grid'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
              data-testid="grid-view-button"
            >
              Grid
            </button>
            <button
              onClick={() => setCurrentViewMode('list')}
              className={`px-3 py-2 text-sm font-medium ${
                currentViewMode === 'list'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
              data-testid="list-view-button"
            >
              List
            </button>
          </div>
        </div>

        {/* Sort and bulk actions */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          {/* Sort options */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-700">Sort by:</span>
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('-') as [typeof sortBy, typeof sortOrder];
                setSortBy(field);
                setSortOrder(order);
              }}
              className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              data-testid="sort-select"
            >
              <option value="created_at-desc">Newest first</option>
              <option value="created_at-asc">Oldest first</option>
              <option value="updated_at-desc">Recently updated</option>
              <option value="usage_count-desc">Most used</option>
              <option value="title-asc">Title A-Z</option>
              <option value="title-desc">Title Z-A</option>
            </select>
          </div>

          {/* Bulk actions */}
          {enableBulkActions && (
            <div className="flex items-center gap-2" data-testid="bulk-actions">
              <button
                onClick={handleSelectAll}
                className="text-sm text-blue-600 hover:text-blue-800"
                data-testid="select-all-button"
              >
                Select All
              </button>
              <button
                onClick={handleSelectNone}
                className="text-sm text-gray-600 hover:text-gray-800"
                data-testid="select-none-button"
              >
                Select None
              </button>
              {selectedPrompts.size > 0 && (
                <button
                  onClick={handleBulkDelete}
                  className="text-sm text-red-600 hover:text-red-800"
                  data-testid="bulk-delete-button"
                >
                  Delete Selected ({selectedPrompts.size})
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Prompts grid/list */}
      <div
        className={
          currentViewMode === 'grid'
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
            : 'space-y-4'
        }
        data-testid="prompts-container"
      >
        {prompts.map((prompt) => (
          <PromptCard
            key={prompt.id}
            prompt={prompt}
            variant={currentViewMode}
            showActions={true}
            isSelected={selectedPrompts.has(prompt.id)}
            onSelect={enableBulkActions ? (selected) => handlePromptSelect(prompt.id, selected) : undefined}
            onClick={handlePromptClick}
            onEdit={handlePromptEdit}
            onDuplicate={handlePromptDuplicate}
            onDelete={handlePromptDelete}
          />
        ))}
      </div>

      {/* Results info */}
      <div className="text-sm text-gray-500 text-center" data-testid="results-info">
        Showing {prompts.length} prompts
        {promptsData?.pagination && ` (${promptsData.pagination.total} total)`}
      </div>
    </div>
  );
};
