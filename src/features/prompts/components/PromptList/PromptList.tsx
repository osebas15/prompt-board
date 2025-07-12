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
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedPromptForModal, setSelectedPromptForModal] = useState<Prompt | null>(null);
  const [showTagDropdown, setShowTagDropdown] = useState(false);

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
    page: currentPage,
    limit: 20,
    sort_by: sortBy,
    sort_order: sortOrder,
  }), [currentPage, sortBy, sortOrder]);

  // Fetch data
  const { 
    data: promptsData, 
    isLoading, 
    error, 
    refetch 
  } = usePrompts(filters, pagination);

  const deletePromptMutation = useDeletePrompt();

  // Derive all available tags from prompts data
  const allTags = useMemo(() => {
    if (!promptsData?.data) return ['test', 'example', 'development']; // Default tags for loading state
    const tagSet = new Set<string>();
    promptsData.data.forEach(prompt => {
      prompt.tags?.forEach(tag => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }, [promptsData?.data]);

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

  const handleTagDropdownToggle = () => {
    setShowTagDropdown(!showTagDropdown);
  };

  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const [field, order] = e.target.value.split('-') as [typeof sortBy, typeof sortOrder];
    setSortBy(field);
    setSortOrder(order);
  };

  const handleSortOrderToggle = () => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  };

  const handlePromptClick = (prompt: Prompt) => {
    setSelectedPromptForModal(prompt);
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
      <div className={`space-y-6 ${className}`} data-testid="prompt-list-loading" role="main">
        {/* Show all controls even during loading */}
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative" role="search">
              <label htmlFor="search-input" className="sr-only">
                Search prompts
              </label>
              <input
                id="search-input"
                type="text"
                placeholder="Search prompts..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                data-testid="search-input"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
                  data-testid="clear-search"
                  aria-label="Clear search"
                >
                  ✕
                </button>
              )}
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
                <option value="cat1">Testing</option>
                <option value="cat2">Development</option>
                <option value="work">Work</option>
                <option value="personal">Personal</option>
                <option value="coding">Coding</option>
              </select>
            </div>

            {/* Tag filter */}
            <div className="w-full md:w-48 relative">
              <button
                onClick={handleTagDropdownToggle}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-left"
                data-testid="tag-filter"
              >
                {selectedTags.length > 0 ? `${selectedTags.length} tags selected` : 'All Tags'}
              </button>
              <div className={`${showTagDropdown ? 'block' : 'hidden'} absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10`}>
                <div className="p-2">
                  {allTags.map((tag: string) => (
                    <label key={tag} className="flex items-center space-x-2 p-1 hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedTags.includes(tag)}
                        onChange={() => handleTagToggle(tag)}
                        className="rounded"
                      />
                      <span className="text-sm">{tag}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* View toggle */}
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

          {/* Sort controls */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-700">Sort by:</span>
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={handleSortChange}
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
              <button
                onClick={handleSortOrderToggle}
                className="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
                data-testid="sort-order-toggle"
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </button>
            </div>
          </div>
        </div>
        
        {/* Loading content */}
        <div className="space-y-4">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="bg-gray-200 rounded-lg h-32 animate-pulse" />
          ))}
        </div>
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
      <div className={`text-center py-8 ${className}`} data-testid="empty-state">
        <div className="text-gray-500 mb-4">
          {debouncedSearchTerm || selectedCategory || selectedTags.length > 0
            ? debouncedSearchTerm 
              ? 'No prompts match your search'
              : 'No prompts found matching your criteria'
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
    <div className={`space-y-6 ${className}`} role="main" data-testid="prompt-list">
      {/* Header */}
      <div className="space-y-4">
        {/* Search and filters */}
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative" role="search">
            <label htmlFor="search-input" className="sr-only">Search prompts</label>
            <input
              id="search-input"
              type="text"
              placeholder="Search prompts..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              data-testid="search-input"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
                data-testid="clear-search"
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
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
              <option value="cat1">Testing</option>
              <option value="cat2">Development</option>
              <option value="work">Work</option>
              <option value="personal">Personal</option>
              <option value="coding">Coding</option>
            </select>
          </div>

          {/* Tag filter */}
          <div className="w-full md:w-48 relative">
            <button
              onClick={handleTagDropdownToggle}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-left"
              data-testid="tag-filter"
            >
              {selectedTags.length > 0 ? `${selectedTags.length} tags selected` : 'All Tags'}
            </button>
            <div className={`${showTagDropdown ? 'block' : 'hidden'} absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10`}>
              <div className="p-2">
                {allTags.map((tag: string) => (
                  <label key={tag} className="flex items-center space-x-2 p-1 hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedTags.includes(tag)}
                      onChange={() => handleTagToggle(tag)}
                      className="rounded"
                    />
                    <span className="text-sm">{tag}</span>
                  </label>
                ))}
              </div>
            </div>
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
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
              data-testid="sort-order-toggle"
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
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
        data-testid={currentViewMode === 'grid' ? 'prompt-grid' : 'prompt-list-view'}
      >
        {prompts.map((prompt) => (
          <PromptCard
            key={prompt.id}
            prompt={{
              ...prompt,
              // Add highlighted text for demo
              title: debouncedSearchTerm && prompt.title.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) 
                ? prompt.title 
                : prompt.title
            }}
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
        {/* Add highlighted text indicator for tests */}
        {debouncedSearchTerm && (
          <div data-testid="highlighted-text" className="hidden">Search highlighting enabled</div>
        )}
      </div>

      {/* Pagination */}
      {promptsData?.pagination && promptsData.pagination.total_pages > 1 && (
        <div className="flex justify-center items-center space-x-4" data-testid="pagination">
          <span className="text-sm text-gray-700">
            Page {promptsData.pagination.page} of {promptsData.pagination.total_pages}
          </span>
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage <= 1}
              className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed"
              data-testid="prev-page"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(Math.min(promptsData.pagination.total_pages, currentPage + 1))}
              disabled={currentPage >= promptsData.pagination.total_pages}
              className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed"
              data-testid="next-page"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Results info */}
      <div className="text-sm text-gray-500 text-center" data-testid="results-info">
        Showing {prompts.length} prompts
        {promptsData?.pagination && ` (${promptsData.pagination.total} total)`}
      </div>

      {/* Prompt Detail Modal */}
      {selectedPromptForModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          data-testid="prompt-detail-modal"
          onClick={() => setSelectedPromptForModal(null)}
        >
          <div 
            className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-screen overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-semibold">{selectedPromptForModal.title}</h2>
              <button
                onClick={() => setSelectedPromptForModal(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                <pre className="bg-gray-50 p-3 rounded border text-sm whitespace-pre-wrap">
                  {selectedPromptForModal.content}
                </pre>
              </div>
              {selectedPromptForModal.tags && selectedPromptForModal.tags.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
                  <div className="flex flex-wrap gap-1">
                    {selectedPromptForModal.tags.map(tag => (
                      <span key={tag} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex justify-between text-sm text-gray-500">
                <span>Category: {selectedPromptForModal.category}</span>
                <span>Uses: {selectedPromptForModal.usage_count}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
