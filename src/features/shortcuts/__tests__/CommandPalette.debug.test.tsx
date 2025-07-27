import { render, screen, fireEvent } from '@testing-library/react';
import { CommandPalette } from '../components/CommandPalette/CommandPalette';
import type { Command } from '../types/shortcuts';

describe('CommandPalette Debug', () => {
  it('should debug selection state', () => {
    const commands: Command[] = [
      {
        id: 'test-1',
        label: 'Test Command 1',
        category: 'Test',
        action: () => {},
      },
      {
        id: 'test-2',
        label: 'Test Command 2',
        category: 'Test',
        action: () => {},
      },
    ];

    render(
      <CommandPalette
        isOpen={true}
        commands={commands}
        onExecute={() => {}}
        onClose={() => {}}
      />
    );

    // Check initial state - no item should be selected
    const option1 = screen.getByText('Test Command 1').closest('[role="option"]');
    const option2 = screen.getByText('Test Command 2').closest('[role="option"]');
    
    console.log('Initial option1 aria-selected:', option1?.getAttribute('aria-selected'));
    console.log('Initial option2 aria-selected:', option2?.getAttribute('aria-selected'));

    expect(option1).toHaveAttribute('aria-selected', 'false');
    expect(option2).toHaveAttribute('aria-selected', 'false');

    // Press arrow down - first item should be selected
    const searchInput = screen.getByPlaceholderText(/search commands/i);
    fireEvent.keyDown(searchInput, { key: 'ArrowDown' });

    console.log('After ArrowDown option1 aria-selected:', option1?.getAttribute('aria-selected'));
    console.log('After ArrowDown option2 aria-selected:', option2?.getAttribute('aria-selected'));

    expect(option1).toHaveAttribute('aria-selected', 'true');
    expect(option2).toHaveAttribute('aria-selected', 'false');
  });
});
