import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SelectionCounter } from '../components/BulkOperations/SelectionCounter';

describe('SelectionCounter', () => {
  let mockOnToggleSelectAll: any;

  beforeEach(() => {
    mockOnToggleSelectAll = vi.fn();
  });

  it('should render total count when nothing is selected', () => {
    render(
      <SelectionCounter
        selectedCount={0}
        totalCount={10}
        onToggleSelectAll={mockOnToggleSelectAll}
      />
    );

    expect(screen.getByText('10 items')).toBeInTheDocument();
  });

  it('should render selected count when items are selected', () => {
    render(
      <SelectionCounter
        selectedCount={3}
        totalCount={10}
        onToggleSelectAll={mockOnToggleSelectAll}
      />
    );

    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('selected')).toBeInTheDocument();
  });

  it('should show empty checkbox when nothing is selected', () => {
    render(
      <SelectionCounter
        selectedCount={0}
        totalCount={10}
        onToggleSelectAll={mockOnToggleSelectAll}
      />
    );

    const checkbox = screen.getByTitle('Select All');
    expect(checkbox).toBeInTheDocument();
    expect(checkbox).not.toHaveClass('bg-blue-600');
  });

  it('should show partial selection state', () => {
    render(
      <SelectionCounter
        selectedCount={3}
        totalCount={10}
        onToggleSelectAll={mockOnToggleSelectAll}
      />
    );

    const checkbox = screen.getByTitle('Select All');
    expect(checkbox).toHaveClass('bg-blue-100', 'border-blue-600');
  });

  it('should show full selection state', () => {
    render(
      <SelectionCounter
        selectedCount={10}
        totalCount={10}
        onToggleSelectAll={mockOnToggleSelectAll}
      />
    );

    const checkbox = screen.getByTitle('Deselect All');
    expect(checkbox).toHaveClass('bg-blue-600', 'border-blue-600');
  });

  it('should call toggle handler when clicked', async () => {
    const user = userEvent.setup();
    render(
      <SelectionCounter
        selectedCount={3}
        totalCount={10}
        onToggleSelectAll={mockOnToggleSelectAll}
      />
    );

    const checkbox = screen.getByTitle('Select All');
    await user.click(checkbox);

    expect(mockOnToggleSelectAll).toHaveBeenCalled();
  });

  it('should handle empty state', () => {
    render(
      <SelectionCounter
        selectedCount={0}
        totalCount={0}
        onToggleSelectAll={mockOnToggleSelectAll}
      />
    );

    expect(screen.getByText('0 items')).toBeInTheDocument();
  });
});
