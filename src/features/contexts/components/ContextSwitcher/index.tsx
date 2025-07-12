import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Folder, Check } from 'lucide-react';
import { useContext } from '../../hooks/useContext';
import type { Context } from '../../types';

interface ContextSwitcherProps {
  className?: string;
  compact?: boolean;
}

export function ContextSwitcher({ className = '', compact = false }: ContextSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const {
    currentContext,
    contexts,
    loading,
    error,
    switchContext,
  } = useContext();

  // Check if we're in mobile viewport
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Filter contexts based on search query
  const filteredContexts = contexts.filter(context =>
    context.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
        setFocusedIndex(-1);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Focus management for options
  useEffect(() => {
    if (isOpen && focusedIndex >= 0 && optionRefs.current[focusedIndex]) {
      optionRefs.current[focusedIndex]?.focus();
    }
  }, [isOpen, focusedIndex]);

  // Handle keyboard navigation
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (!isOpen) return;
    
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setFocusedIndex(prev => 
          prev < filteredContexts.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        event.preventDefault();
        setFocusedIndex(prev => 
          prev > 0 ? prev - 1 : filteredContexts.length - 1
        );
        break;
      case 'Enter':
        event.preventDefault();
        if (focusedIndex >= 0 && filteredContexts[focusedIndex]) {
          handleContextSelect(filteredContexts[focusedIndex]);
        }
        break;
      case 'Escape':
        event.preventDefault();
        setIsOpen(false);
        setSearchQuery('');
        setFocusedIndex(-1);
        triggerRef.current?.focus();
        break;
      default:
        // Handle search typing
        if (event.key.length === 1) {
          setSearchQuery(prev => prev + event.key);
        } else if (event.key === 'Backspace') {
          setSearchQuery(prev => prev.slice(0, -1));
        }
        break;
    }
  };

  // Handle context selection
  const handleContextSelect = async (context: Context) => {
    try {
      await switchContext(context.id);
      setIsOpen(false);
      setSearchQuery('');
      setFocusedIndex(-1);
      triggerRef.current?.focus();
    } catch (err) {
      console.error('Failed to switch context:', err);
    }
  };

  // Handle dropdown toggle
  const handleToggle = () => {
    if (loading) return;
    const wasOpen = isOpen;
    setIsOpen(!isOpen);
    if (!wasOpen) {
      setSearchQuery('');
      // Set initial focus to current context when opening
      const currentIndex = filteredContexts.findIndex(ctx => ctx.id === currentContext?.id);
      setFocusedIndex(currentIndex >= 0 ? currentIndex : 0);
    } else {
      setFocusedIndex(-1);
    }
  };

  // Get display name based on compact mode
  const getDisplayName = (context: Context | null) => {
    if (!context) return 'No Context Selected';
    if ((compact || isMobile) && context.name.length > 15) {
      return context.name.substring(0, 12) + '...';
    }
    return context.name;
  };

  return (
    <div 
      className={`relative ${className} ${isMobile ? 'mobile-layout mobile-compact' : ''}`} 
      ref={dropdownRef}
      data-testid="context-switcher"
      onKeyDown={handleKeyDown}
    >
      {/* Trigger Button */}
      <button
        ref={triggerRef}
        type="button"
        onClick={handleToggle}
        disabled={loading}
        className={`
          flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-md
          hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          disabled:opacity-50 disabled:cursor-not-allowed
          ${compact ? 'text-sm' : ''}
        `}
        aria-label="Context switcher"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        {/* Context Color Indicator */}
        {currentContext && (
          <div
            data-testid="context-color-indicator"
            className="w-3 h-3 rounded-full flex-shrink-0"
            style={{ backgroundColor: currentContext.color }}
          />
        )}

        {/* Context Icon */}
        <div className="flex-shrink-0">
          <Folder data-testid="folder-icon" className="w-4 h-4 text-gray-500" />
        </div>

        {/* Context Name */}
        <span className="flex-1 text-left truncate">
          {loading 
            ? 'Loading...' 
            : searchQuery 
              ? `Searching: ${searchQuery}` 
              : isOpen 
                ? 'Select context...' 
                : getDisplayName(currentContext)
          }
        </span>

        {/* Loading indicator or chevron */}
        {loading ? (
          <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
        ) : (
          <ChevronDown
            data-testid="chevron-down"
            className={`w-4 h-4 text-gray-500 transition-transform ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        )}
      </button>

      {/* Error State */}
      {error && (
        <div className="absolute top-full left-0 right-0 mt-1 p-2 bg-red-50 border border-red-200 rounded-md text-sm text-red-600">
          Error loading contexts
        </div>
      )}

      {/* Dropdown */}
      {isOpen && !loading && (
        <div
          className={`
            absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-50
            max-h-64 overflow-y-auto
          `}
          role="listbox"
          aria-label="Available contexts"
        >
          {/* Search query display (hidden but for testing) */}
          {searchQuery && (
            <div className="px-3 py-2 text-xs text-gray-500 border-b border-gray-200">
              Search: "{searchQuery}"
            </div>
          )}

          {/* Context List */}
          {filteredContexts.length > 0 ? (
            filteredContexts.map((context, index) => (
              <button
                key={context.id}
                ref={(el) => {
                  optionRefs.current[index] = el;
                }}
                type="button"
                onClick={() => handleContextSelect(context)}
                className={`
                  w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-50
                  ${focusedIndex === index ? 'bg-blue-50' : ''}
                  ${currentContext?.id === context.id ? 'bg-blue-100' : ''}
                `}
                role="option"
                aria-selected={currentContext?.id === context.id}
              >
                {/* Color indicator */}
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: context.color }}
                />

                {/* Context info */}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {context.name}
                  </div>
                  {context.description && (
                    <div className="text-xs text-gray-500 truncate">
                      {context.description}
                    </div>
                  )}
                </div>

                {/* Current context indicator */}
                {currentContext?.id === context.id && (
                  <Check data-testid="check-icon" className="w-4 h-4 text-blue-600 flex-shrink-0" />
                )}
              </button>
            ))
          ) : (
            <div className="px-3 py-4 text-sm text-gray-500 text-center">
              {searchQuery ? 'No contexts found' : 'No contexts available'}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
