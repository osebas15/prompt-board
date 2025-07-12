import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CommandPalette } from '../components/CommandPalette/CommandPalette';
import type { Command } from '../types/shortcuts';

describe('CommandPalette Debug', () => {
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

  it('should debug keyboard navigation state', async () => {
    render(
      <CommandPalette
        isOpen={true}
        commands={mockCommands}
        onExecute={mockOnExecute}
        onClose={mockOnClose}
      />
    );

    const searchInput = screen.getByPlaceholderText(/search commands/i);
    
    // Check initial state
    console.log('\n=== INITIAL STATE ===');
    const allOptions = screen.getAllByRole('option');
    console.log('Number of options:', allOptions.length);
    
    allOptions.forEach((option, index) => {
      const text = option.textContent;
      const ariaSelected = option.getAttribute('aria-selected');
      console.log(`Option ${index}: "${text}" - aria-selected: ${ariaSelected}`);
    });
    
    // Press arrow down
    console.log('\n=== PRESSING ARROW DOWN ===');
    fireEvent.keyDown(searchInput, { key: 'ArrowDown' });
    
    // Wait for state update to complete
    await waitFor(() => {
      const firstOption = screen.getAllByRole('option')[0];
      expect(firstOption.getAttribute('aria-selected')).toBe('true');
    });
    
    console.log('\n=== AFTER ARROW DOWN (after waitFor) ===');
    const allOptionsAfter = screen.getAllByRole('option');
    allOptionsAfter.forEach((option, index) => {
      const text = option.textContent;
      const ariaSelected = option.getAttribute('aria-selected');
      console.log(`Option ${index}: "${text}" - aria-selected: ${ariaSelected}`);
    });

    // Try to find the "New Prompt" option specifically
    const newPromptOption = screen.getByText('New Prompt').closest('[role="option"]');
    console.log('New Prompt aria-selected:', newPromptOption?.getAttribute('aria-selected'));
    
    // Press Enter
    console.log('\n=== PRESSING ENTER ===');
    fireEvent.keyDown(searchInput, { key: 'Enter' });
    
    console.log('mockOnExecute call count:', mockOnExecute.mock.calls.length);
    if (mockOnExecute.mock.calls.length > 0) {
      console.log('mockOnExecute called with:', mockOnExecute.mock.calls[0][0]);
    }
  });
});
