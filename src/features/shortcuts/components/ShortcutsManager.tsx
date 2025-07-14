import React, { useState, useEffect } from 'react';
import { Command } from 'lucide-react';
import { CommandPalette } from './CommandPalette/CommandPalette';
import type { Command as CommandType } from '../types/shortcuts';
import { showToast } from '@/lib/utils/toast';

interface ShortcutsManagerProps {
  className?: string;
  onSearchActivated?: () => void;
  onNewPrompt?: () => void;
  onViewAnalytics?: () => void;
  onManageWorkflows?: () => void;
}

export const ShortcutsManager: React.FC<ShortcutsManagerProps> = ({ 
  className,
  onSearchActivated,
  onNewPrompt,
  onViewAnalytics,
  onManageWorkflows
}) => {
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
        if (onSearchActivated) {
          onSearchActivated();
        } else {
          // Focus on search input if it exists
          const searchInput = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement;
          if (searchInput) {
            searchInput.focus();
            searchInput.select();
            showToast('Search activated! Start typing to search.', { type: 'success' });
          } else {
            showToast('Search activated! No search input found on the page.', { type: 'warning' });
          }
        }
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
        if (onNewPrompt) {
          onNewPrompt();
        } else {
          showToast('New Prompt feature coming soon! This will open the prompt creation form.', { type: 'info' });
        }
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
        if (onViewAnalytics) {
          onViewAnalytics();
        } else {
          // Scroll to analytics section
          const analyticsSection = document.querySelector('[data-testid="analytics-dashboard"]') || 
                                  document.querySelector('[class*="AnalyticsDashboard"]');
          if (analyticsSection) {
            analyticsSection.scrollIntoView({ behavior: 'smooth' });
            showToast('Scrolled to Analytics Dashboard', { type: 'success' });
          } else {
            showToast('Analytics dashboard is already visible on this page!', { type: 'info' });
          }
        }
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
        if (onManageWorkflows) {
          onManageWorkflows();
        } else {
          // Scroll to workflows section
          const workflowsSection = document.querySelector('[data-testid="workflows-manager"]') ||
                                  document.querySelector('[class*="WorkflowsManager"]');
          if (workflowsSection) {
            workflowsSection.scrollIntoView({ behavior: 'smooth' });
            showToast('Scrolled to Workflows Manager', { type: 'success' });
          } else {
            showToast('Workflows section is available below the analytics dashboard!', { type: 'info' });
          }
        }
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
      // Command Palette (Cmd+K)
      if (e.metaKey && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(true);
        return;
      }
      
      // New Prompt (Cmd+N)
      if (e.metaKey && e.key === 'n') {
        e.preventDefault();
        const newPromptCommand = commands.find(cmd => cmd.id === 'new-prompt');
        if (newPromptCommand) newPromptCommand.action();
        return;
      }
      
      // Analytics (Cmd+A) - but not if text is selected
      if (e.metaKey && e.key === 'a' && !window.getSelection()?.toString()) {
        e.preventDefault();
        const analyticsCommand = commands.find(cmd => cmd.id === 'analytics');
        if (analyticsCommand) analyticsCommand.action();
        return;
      }
      
      // Workflows (Cmd+W)
      if (e.metaKey && e.key === 'w') {
        e.preventDefault();
        const workflowsCommand = commands.find(cmd => cmd.id === 'workflows');
        if (workflowsCommand) workflowsCommand.action();
        return;
      }
      
      // Close Command Palette (Escape)
      if (e.key === 'Escape') {
        setIsCommandPaletteOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [commands]);

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
