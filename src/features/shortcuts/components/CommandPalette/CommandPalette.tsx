import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, Command as CommandIcon } from 'lucide-react';
import type { Command, CommandGroup } from '../../types/shortcuts';

interface CommandPaletteProps {
  isOpen: boolean;
  commands: Command[];
  recentCommands?: Command[];
  onExecute: (command: Command) => void;
  onClose: () => void;
  placeholder?: string;
}

export function CommandPalette({
  isOpen,
  commands,
  recentCommands = [],
  onExecute,
  onClose,
  placeholder = 'Search commands...',
}: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const itemsRef = useRef<(HTMLDivElement | null)[]>([]);
  const selectedIndexRef = useRef(-1);

  // Keep ref in sync with state
  useEffect(() => {
    selectedIndexRef.current = selectedIndex;
  }, [selectedIndex]);

  // Filter and group commands
  const filteredGroups = useMemo(() => {
    if (!query.trim()) {
      // Show recent commands when no query
      if (recentCommands.length > 0) {
        return [
          {
            category: 'Recent',
            commands: recentCommands,
          },
          ...groupCommandsByCategory(commands.slice(0, 8)), // Show first 8 commands
        ];
      }
      return groupCommandsByCategory(commands);
    }

    const filtered = commands.filter(cmd => 
      cmd.label.toLowerCase().includes(query.toLowerCase()) ||
      cmd.description?.toLowerCase().includes(query.toLowerCase()) ||
      cmd.category.toLowerCase().includes(query.toLowerCase())
    );

    return groupCommandsByCategory(filtered);
  }, [commands, recentCommands, query]);

  // Flatten commands for navigation
  const flatCommands = useMemo(() => {
    return filteredGroups.flatMap(group => group.commands);
  }, [filteredGroups]);

  // Reset selection when query changes (meaningful search change)
  useEffect(() => {
    setSelectedIndex(-1);
    selectedIndexRef.current = -1;
  }, [query]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Reset state when closed
  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setSelectedIndex(-1);
      selectedIndexRef.current = -1;
    }
  }, [isOpen]);

  // Update refs array when commands change
  useEffect(() => {
    itemsRef.current = itemsRef.current.slice(0, flatCommands.length);
  }, [flatCommands.length]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => {
          const newIndex = prev === -1 ? 0 : Math.min(prev + 1, flatCommands.length - 1);
          selectedIndexRef.current = newIndex;
          return newIndex;
        });
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => {
          const newIndex = prev === -1 ? flatCommands.length - 1 : Math.max(prev - 1, 0);
          selectedIndexRef.current = newIndex;
          return newIndex;
        });
        break;
      case 'Enter':
        e.preventDefault();
        // Use the ref value which is always current
        const currentIndex = selectedIndexRef.current;
        if (currentIndex >= 0 && currentIndex < flatCommands.length && flatCommands[currentIndex]) {
          onExecute(flatCommands[currentIndex]);
        }
        break;
      case 'Escape':
        onClose();
        break;
    }
  };

  const handleCommandClick = (command: Command) => {
    onExecute(command);
  };

  const formatShortcut = (shortcut: string): string => {
    return shortcut
      .replace(/cmd/g, '⌘')
      .replace(/ctrl/g, '⌃')
      .replace(/shift/g, '⇧')
      .replace(/alt/g, '⌥')
      .replace(/\+/g, '')
      .toUpperCase();
  };

  // Scroll selected item into view
  useEffect(() => {
    const selectedElement = itemsRef.current[selectedIndex];
    if (selectedIndex >= 0 && selectedElement && typeof selectedElement.scrollIntoView === 'function') {
      selectedElement.scrollIntoView({
        block: 'nearest',
        behavior: 'smooth',
      });
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center pt-20"
      style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 50,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '5rem'
      }}
      onClick={(e) => {
        // Close when clicking on backdrop
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-2xl mx-4 max-h-96 flex flex-col"
        style={{
          backgroundColor: 'white',
          borderRadius: '0.5rem',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          width: '100%',
          maxWidth: '42rem',
          margin: '0 1rem',
          maxHeight: '24rem',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Header */}
        <div 
          className="flex items-center gap-3 p-4 border-b border-gray-200 dark:border-gray-600"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '1rem',
            borderBottom: '1px solid #e5e7eb',
            backgroundColor: 'white'
          }}
        >
          <Search className="w-5 h-5 text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="flex-1 bg-transparent text-lg outline-none placeholder-gray-400 dark:text-white"
            style={{
              flex: 1,
              backgroundColor: 'transparent',
              fontSize: '1.125rem',
              outline: 'none',
              border: 'none',
              color: '#111827'
            }}
          />
          <kbd className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 rounded text-gray-600 dark:text-gray-300">
            ESC
          </kbd>
        </div>

        {/* Commands */}
        <div 
          className="flex-1 overflow-y-auto"
          style={{
            flex: 1,
            overflowY: 'auto',
            backgroundColor: 'white'
          }}
        >
          {flatCommands.length === 0 ? (
            <div 
              className="p-8 text-center text-gray-500 dark:text-gray-400"
              style={{
                padding: '2rem',
                textAlign: 'center',
                color: '#6b7280',
                backgroundColor: 'white'
              }}
            >
              <CommandIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No commands found</p>
              <p className="text-sm mt-1">Try a different search term</p>
            </div>
          ) : (
            filteredGroups.map((group, groupIndex) => (
              <div key={group.category}>
                {/* Category Header */}
                <div 
                  className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide bg-gray-50 dark:bg-gray-900"
                  style={{
                    padding: '0.5rem 1rem',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    color: '#6b7280',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    backgroundColor: '#f9fafb'
                  }}
                >
                  {group.category}
                </div>
                
                {/* Commands */}
                {group.commands.map((command: Command, cmdIndex: number) => {
                  const flatIndex = filteredGroups
                    .slice(0, groupIndex)
                    .reduce((acc, g) => acc + g.commands.length, 0) + cmdIndex;
                  
                  const isSelected = flatIndex === selectedIndex;
                  
                  return (
                    <div
                      key={command.id}
                      ref={(el) => {
                        itemsRef.current[flatIndex] = el;
                      }}
                      role="option"
                      aria-selected={isSelected}
                      className={`px-4 py-3 cursor-pointer flex items-center justify-between group ${
                        isSelected
                          ? 'bg-blue-50 dark:bg-blue-900/20 border-l-2 border-blue-500'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                      } ${command.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                      style={{
                        padding: '0.75rem 1rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        backgroundColor: isSelected ? '#eff6ff' : 'white',
                        borderLeft: isSelected ? '2px solid #3b82f6' : 'none',
                        opacity: command.disabled ? 0.5 : 1
                      }}
                      onMouseEnter={() => setSelectedIndex(flatIndex)}
                      onClick={() => !command.disabled && handleCommandClick(command)}
                    >
                      <div className="flex items-center gap-3">
                        {command.icon && (
                          <span className="text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300">
                            {command.icon}
                          </span>
                        )}
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {command.label}
                          </div>
                          {command.description && (
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {command.description}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {command.shortcut && (
                        <kbd className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 rounded text-gray-600 dark:text-gray-300">
                          {formatShortcut(command.shortcut)}
                        </kbd>
                      )}
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div 
          className="px-4 py-2 border-t border-gray-200 dark:border-gray-600 text-xs text-gray-500 dark:text-gray-400 flex items-center justify-between"
          style={{
            padding: '0.5rem 1rem',
            borderTop: '1px solid #e5e7eb',
            fontSize: '0.75rem',
            color: '#6b7280',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'white'
          }}
        >
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">↑↓</kbd>
              to navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">↵</kbd>
              to select
            </span>
          </div>
          <span>{flatCommands.length} commands</span>
        </div>
      </div>
    </div>
  );
}

function groupCommandsByCategory(commands: Command[]): CommandGroup[] {
  const grouped = commands.reduce((acc, command) => {
    if (!acc[command.category]) {
      acc[command.category] = [];
    }
    acc[command.category].push(command);
    return acc;
  }, {} as Record<string, Command[]>);

  return Object.entries(grouped)
    .map(([category, commands]) => ({ category, commands }))
    .sort((a, b) => {
      // Sort categories with predefined order
      const order = ['Recent', 'Create', 'Navigation', 'Edit', 'Search', 'Settings', 'Help', 'Other'];
      const aIndex = order.indexOf(a.category);
      const bIndex = order.indexOf(b.category);
      
      if (aIndex === -1 && bIndex === -1) return a.category.localeCompare(b.category);
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      return aIndex - bIndex;
    });
}
