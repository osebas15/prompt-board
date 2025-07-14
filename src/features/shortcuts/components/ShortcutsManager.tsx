import React, { useState, useEffect } from 'react';
import { Command } from 'lucide-react';
import { CommandPalette } from './CommandPalette/CommandPalette';
import type { Command as CommandType } from '../types/shortcuts';

interface ShortcutsManagerProps {
  className?: string;
}

export const ShortcutsManager: React.FC<ShortcutsManagerProps> = ({ className }) => {
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [commands] = useState<CommandType[]>([
    {
      id: 'search-prompts',
      label: 'Search Prompts',
      description: 'Search through all prompts',
      shortcut: 'Cmd+K',
      category: 'search',
      icon: '🔍',
      action: () => {
        console.log('Search prompts command executed');
      }
    },
    {
      id: 'new-prompt',
      label: 'New Prompt',
      description: 'Create a new prompt',
      shortcut: 'Cmd+N',
      category: 'prompts',
      icon: '📝',
      action: () => {
        console.log('New prompt command executed');
      }
    },
    {
      id: 'analytics',
      label: 'View Analytics',
      description: 'Open analytics dashboard',
      shortcut: 'Cmd+A',
      category: 'navigation',
      icon: '📊',
      action: () => {
        console.log('Analytics command executed');
      }
    },
    {
      id: 'workflows',
      label: 'Manage Workflows',
      description: 'Create and manage automation workflows',
      shortcut: 'Cmd+W',
      category: 'automation',
      icon: '⚡',
      action: () => {
        console.log('Workflows command executed');
      }
    }
  ]);

  const handleExecuteCommand = (command: CommandType) => {
    command.action();
    setIsCommandPaletteOpen(false);
  };

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(true);
      }
      if (e.key === 'Escape') {
        setIsCommandPaletteOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      <button
        onClick={() => setIsCommandPaletteOpen(true)}
        className={`
          inline-flex items-center px-3 py-2 border border-gray-300 rounded-md 
          bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          ${className}
        `}
      >
        <Command className="w-4 h-4 mr-2" />
        <span className="hidden sm:inline">Commands</span>
        <span className="ml-2 text-xs text-gray-500 hidden lg:inline">⌘K</span>
      </button>

      <CommandPalette
        isOpen={isCommandPaletteOpen}
        commands={commands}
        onExecute={handleExecuteCommand}
        onClose={() => setIsCommandPaletteOpen(false)}
        placeholder="Search commands..."
      />
    </>
  );
};
