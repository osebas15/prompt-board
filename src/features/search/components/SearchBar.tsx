import React, { useState, useRef, useEffect } from 'react';
import { clsx } from 'clsx';
import { useGlobalSearch } from '../hooks/useGlobalSearch';
import type { SearchFilters, GlobalSearchItem, SearchResult } from '../types';

interface SearchBarProps {
  className?: string;
  placeholder?: string;
  onResultSelect?: (result: SearchResult<GlobalSearchItem>) => void;
  filters?: SearchFilters;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  className,
  placeholder = "Search prompts, contexts, and more...",
  onResultSelect,
  filters = {}
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const {
    query,
    results,
    isLoading,
    suggestions,
    updateQuery,
    performSearch
  } = useGlobalSearch(filters);

  // Handle search input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    updateQuery(value);
    setShowResults(value.length > 0);
  };

  // Handle result selection
  const handleResultClick = (result: SearchResult<GlobalSearchItem>) => {
    setShowResults(false);
    setIsExpanded(false);
    onResultSelect?.(result);
    if (inputRef.current) {
      inputRef.current.blur();
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setShowResults(false);
      setIsExpanded(false);
      inputRef.current?.blur();
    }
  };

  // Close results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        resultsRef.current &&
        !resultsRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={clsx('relative', className)}>
      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg
            className="h-5 w-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            setIsExpanded(true);
            if (query.length > 0) setShowResults(true);
          }}
          placeholder={placeholder}
          className={clsx(
            'block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg',
            'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
            'transition-all duration-200',
            isExpanded ? 'bg-white shadow-lg' : 'bg-gray-50',
            isLoading && 'animate-pulse'
          )}
        />
      </div>

      {/* Search Results Dropdown */}
      {showResults && (
        <div
          ref={resultsRef}
          className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto"
        >
          {isLoading ? (
            <div className="p-4 text-center text-gray-500">
              <div className="animate-spin inline-block w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full mr-2"></div>
              Searching...
            </div>
          ) : results.length > 0 ? (
            <div className="py-2">
              {results.slice(0, 10).map((result, index) => (
                <button
                  key={`${result.item.type || 'item'}-${result.item.id || index}`}
                  onClick={() => handleResultClick(result)}
                  className="w-full px-4 py-2 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={clsx(
                          'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
                          result.item.type === 'prompt' && 'bg-blue-100 text-blue-800',
                          result.item.type === 'context' && 'bg-green-100 text-green-800',
                          result.item.type === 'conversation' && 'bg-purple-100 text-purple-800'
                        )}>
                          {result.item.type || 'unknown'}
                        </span>
                        <div className="truncate">
                          <div className="font-medium text-gray-900 truncate">
                            {result.item.title || 'Untitled'}
                          </div>
                          {result.item.content && (
                            <div className="text-sm text-gray-500 truncate">
                              {result.item.content.substring(0, 100)}...
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    {result.score && (
                      <div className="text-xs text-gray-400 ml-2">
                        {Math.round(result.score * 100)}%
                      </div>
                    )}
                  </div>
                </button>
              ))}
              
              {/* Show suggestions if available */}
              {suggestions.length > 0 && (
                <div className="border-t border-gray-100 mt-2 pt-2">
                  <div className="px-4 py-1 text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Suggestions
                  </div>
                  {suggestions.slice(0, 3).map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        updateQuery(suggestion);
                        performSearch(suggestion);
                      }}
                      className="w-full px-4 py-1 text-left text-sm text-gray-600 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : query.length > 0 ? (
            <div className="p-4 text-center text-gray-500">
              No results found for "{query}"
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};
