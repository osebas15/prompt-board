import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BulkActionMenu } from '../components/BulkOperations/BulkActionMenu';

describe('BulkActionMenu', () => {
  let mockProps: any;

  beforeEach(() => {
    mockProps = {
      selectedCount: 3,
      onBulkTag: vi.fn(),
      onBulkDuplicate: vi.fn(),
      onBulkShare: vi.fn(),
      onBulkDelete: vi.fn(),
      onBulkArchive: vi.fn(),
      onBulkExport: vi.fn(),
      disabled: false,
    };
  });

  it('should render when items are selected', () => {
    render(<BulkActionMenu {...mockProps} />);

    expect(screen.getByText('Actions')).toBeInTheDocument();
  });

  it('should not render when no items are selected', () => {
    render(<BulkActionMenu {...mockProps} selectedCount={0} />);

    expect(screen.queryByText('Actions')).not.toBeInTheDocument();
  });

  it('should be disabled when disabled prop is true', () => {
    render(<BulkActionMenu {...mockProps} disabled={true} />);

    const button = screen.getByRole('button', { name: /actions/i });
    expect(button).toBeDisabled();
    expect(button).toHaveClass('text-gray-400', 'cursor-not-allowed');
  });

  it('should open menu when clicked', async () => {
    const user = userEvent.setup();
    render(<BulkActionMenu {...mockProps} />);

    await user.click(screen.getByText('Actions'));

    expect(screen.getByText('3 items selected')).toBeInTheDocument();
    expect(screen.getByText('Add Tags')).toBeInTheDocument();
    expect(screen.getByText('Duplicate')).toBeInTheDocument();
    expect(screen.getByText('Share')).toBeInTheDocument();
    expect(screen.getByText('Export')).toBeInTheDocument();
    expect(screen.getByText('Archive')).toBeInTheDocument();
    expect(screen.getAllByText('Delete')).toHaveLength(2); // Button text and shortcut
  });

  it('should show correct shortcuts in menu', async () => {
    const user = userEvent.setup();
    render(<BulkActionMenu {...mockProps} />);

    await user.click(screen.getByText('Actions'));

    expect(screen.getByText('Cmd+T')).toBeInTheDocument(); // Tag
    expect(screen.getByText('Cmd+D')).toBeInTheDocument(); // Duplicate
    expect(screen.getByText('Cmd+Shift+S')).toBeInTheDocument(); // Share
    expect(screen.getByText('Cmd+E')).toBeInTheDocument(); // Export
    expect(screen.getByText('Cmd+Shift+A')).toBeInTheDocument(); // Archive
    expect(screen.getAllByText('Delete')).toHaveLength(2); // Button text and shortcut
  });

  it('should call action handlers and close menu', async () => {
    const user = userEvent.setup();
    render(<BulkActionMenu {...mockProps} />);

    // Open menu
    await user.click(screen.getByText('Actions'));

    // Click tag action
    await user.click(screen.getByText('Add Tags'));
    expect(mockProps.onBulkTag).toHaveBeenCalled();

    // Menu should be closed now
    expect(screen.queryByText('3 items selected')).not.toBeInTheDocument();
  });

  it('should test all action handlers', async () => {
    const user = userEvent.setup();
    render(<BulkActionMenu {...mockProps} />);

    // Test each action
    const actions = [
      { text: 'Add Tags', handler: 'onBulkTag' },
      { text: 'Duplicate', handler: 'onBulkDuplicate' },
      { text: 'Share', handler: 'onBulkShare' },
      { text: 'Export', handler: 'onBulkExport' },
      { text: 'Archive', handler: 'onBulkArchive' },
    ];

    for (const action of actions) {
      // Open menu
      await user.click(screen.getByText('Actions'));
      
      // Click action
      await user.click(screen.getByText(action.text));
      
      // Verify handler was called
      expect(mockProps[action.handler]).toHaveBeenCalled();
      
      // Reset mock
      mockProps[action.handler].mockClear();
    }

    // Test Delete separately due to multiple elements
    await user.click(screen.getByText('Actions'));
    const deleteButtons = screen.getAllByText('Delete');
    await user.click(deleteButtons[0]); // Click the button, not the kbd element
    expect(mockProps.onBulkDelete).toHaveBeenCalled();
  });

  it('should close menu when backdrop is clicked', async () => {
    const user = userEvent.setup();
    render(<BulkActionMenu {...mockProps} />);

    // Open menu
    await user.click(screen.getByText('Actions'));
    expect(screen.getByText('3 items selected')).toBeInTheDocument();

    // Find and click the backdrop (the fixed inset-0 div)
    const backdrop = document.querySelector('.fixed.inset-0');
    expect(backdrop).toBeInTheDocument();
    await user.click(backdrop as Element);

    // Menu should be closed
    expect(screen.queryByText('3 items selected')).not.toBeInTheDocument();
  });

  it('should show singular item text for single selection', async () => {
    const user = userEvent.setup();
    render(<BulkActionMenu {...mockProps} selectedCount={1} />);

    await user.click(screen.getByText('Actions'));

    expect(screen.getByText('1 item selected')).toBeInTheDocument();
  });

  it('should apply danger styling to delete action', async () => {
    const user = userEvent.setup();
    render(<BulkActionMenu {...mockProps} />);

    await user.click(screen.getByText('Actions'));

    // Find delete button by icon or by finding the button containing the delete text
    const deleteButtons = screen.getAllByText('Delete');
    const deleteButton = deleteButtons[0].closest('button'); // Get the button element
    expect(deleteButton).toHaveClass('text-red-700');
  });

  it('should apply warning styling to archive action', async () => {
    const user = userEvent.setup();
    render(<BulkActionMenu {...mockProps} />);

    await user.click(screen.getByText('Actions'));

    const archiveButton = screen.getByText('Archive').closest('button');
    expect(archiveButton).toHaveClass('text-orange-700');
  });
});
