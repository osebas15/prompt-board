import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CommandPalette } from '../components/CommandPalette/CommandPalette';
import type { Command } from '../types/shortcuts';

describe('CommandPalette', () => {
  let mockCommands: Command[];
  let mockOnExecute: any;
  let mockOnClose: any;

  beforeEach(() => {
    mockOnExecute = vi.fn();
    mockOnClose = vi.fn();
    
    mockCommands = [
      {
        id: 'new-prompt',
        label: 'New Prompt',
        description: 'Create a new prompt',
        category: 'Create',
        shortcut: 'cmd+n',
        action: vi.fn(),
      },
      {
        id: 'search-prompts',
        label: 'Search Prompts',
        description: 'Search through all prompts',
        category: 'Navigation',
        shortcut: 'cmd+f',
        action: vi.fn(),
      },
      {
        id: 'open-settings',
        label: 'Open Settings',
        description: 'Open application settings',
        category: 'Settings',
        action: vi.fn(),
      },
    ];
  });

  it('should render command palette with search input', async () => {
    render(
      <CommandPalette
        isOpen={true}
        commands={mockCommands}
        onExecute={mockOnExecute}
        onClose={mockOnClose}
      />
    );

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/search commands/i)).toBeInTheDocument();
    }, { timeout: 10000 });
    
    expect(screen.getByText('New Prompt')).toBeInTheDocument();
    expect(screen.getByText('Search Prompts')).toBeInTheDocument();
    expect(screen.getByText('Open Settings')).toBeInTheDocument();
  }, 15000);

  it('should not render when closed', () => {
    render(
      <CommandPalette
        isOpen={false}
        commands={mockCommands}
        onExecute={mockOnExecute}
        onClose={mockOnClose}
      />
    );

    expect(screen.queryByPlaceholderText(/search commands/i)).not.toBeInTheDocument();
  });

  it('should filter commands based on search query', async () => {
    const user = userEvent.setup();
    
    render(
      <CommandPalette
        isOpen={true}
        commands={mockCommands}
        onExecute={mockOnExecute}
        onClose={mockOnClose}
      />
    );

    const searchInput = screen.getByPlaceholderText(/search commands/i);
    await user.type(searchInput, 'prompt');

    expect(screen.getByText('New Prompt')).toBeInTheDocument();
    expect(screen.getByText('Search Prompts')).toBeInTheDocument();
    expect(screen.queryByText('Open Settings')).not.toBeInTheDocument();
  });

  it('should handle keyboard navigation', async () => {
    render(
      <CommandPalette
        isOpen={true}
        commands={mockCommands}
        onExecute={mockOnExecute}
        onClose={mockOnClose}
      />
    );

    const searchInput = screen.getByPlaceholderText(/search commands/i);
    
    // Press arrow down to select first item
    fireEvent.keyDown(searchInput, { key: 'ArrowDown' });
    
    // First item should be highlighted
    expect(screen.getByText('New Prompt').closest('[role="option"]')).toHaveAttribute('aria-selected', 'true');

    // Press arrow down again to select second item
    fireEvent.keyDown(searchInput, { key: 'ArrowDown' });
    
    expect(screen.getByText('Search Prompts').closest('[role="option"]')).toHaveAttribute('aria-selected', 'true');
  });

  it('should execute command on Enter key', async () => {
    render(
      <CommandPalette
        isOpen={true}
        commands={mockCommands}
        onExecute={mockOnExecute}
        onClose={mockOnClose}
      />
    );

    const searchInput = screen.getByPlaceholderText(/search commands/i);
    
    // Select first item and press Enter
    fireEvent.keyDown(searchInput, { key: 'ArrowDown' });
    fireEvent.keyDown(searchInput, { key: 'Enter' });

    expect(mockOnExecute).toHaveBeenCalledWith(mockCommands[0]);
  });

  it('should execute command on click', async () => {
    const user = userEvent.setup();
    
    render(
      <CommandPalette
        isOpen={true}
        commands={mockCommands}
        onExecute={mockOnExecute}
        onClose={mockOnClose}
      />
    );

    await user.click(screen.getByText('Search Prompts'));

    expect(mockOnExecute).toHaveBeenCalledWith(mockCommands[1]);
  });

  it('should close on Escape key', () => {
    render(
      <CommandPalette
        isOpen={true}
        commands={mockCommands}
        onExecute={mockOnExecute}
        onClose={mockOnClose}
      />
    );

    const searchInput = screen.getByPlaceholderText(/search commands/i);
    fireEvent.keyDown(searchInput, { key: 'Escape' });

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should display keyboard shortcuts', () => {
    render(
      <CommandPalette
        isOpen={true}
        commands={mockCommands}
        onExecute={mockOnExecute}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('⌘N')).toBeInTheDocument();
    expect(screen.getByText('⌘F')).toBeInTheDocument();
  });

  it('should group commands by category', () => {
    render(
      <CommandPalette
        isOpen={true}
        commands={mockCommands}
        onExecute={mockOnExecute}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('Create')).toBeInTheDocument();
    expect(screen.getByText('Navigation')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('should show "No results" when no commands match search', async () => {
    const user = userEvent.setup();
    
    render(
      <CommandPalette
        isOpen={true}
        commands={mockCommands}
        onExecute={mockOnExecute}
        onClose={mockOnClose}
      />
    );

    const searchInput = screen.getByPlaceholderText(/search commands/i);
    await user.type(searchInput, 'nonexistent');

    await waitFor(() => {
      expect(screen.getByText(/no commands found/i)).toBeInTheDocument();
    });
  });

  it('should handle recent commands', () => {
    const recentCommands = [mockCommands[1]];
    
    render(
      <CommandPalette
        isOpen={true}
        commands={mockCommands}
        recentCommands={recentCommands}
        onExecute={mockOnExecute}
        onClose={mockOnClose}
      />
    );

    // Should show recent section when no search query
    expect(screen.getByText(/recent/i)).toBeInTheDocument();
  });

  it('should focus search input when opened', () => {
    render(
      <CommandPalette
        isOpen={true}
        commands={mockCommands}
        onExecute={mockOnExecute}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByPlaceholderText(/search commands/i)).toHaveFocus();
  });
});
