import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BulkActionBar } from '../components/BulkOperations/BulkActionBar';

describe('BulkActionBar', () => {
  let mockProps: any;

  beforeEach(() => {
    mockProps = {
      selectedCount: 3,
      totalCount: 10,
      onSelectAll: vi.fn(),
      onDeselectAll: vi.fn(),
      onBulkDelete: vi.fn(),
      onBulkTag: vi.fn(),
      onBulkDuplicate: vi.fn(),
      onBulkShare: vi.fn(),
      onCancel: vi.fn(),
      isVisible: true,
    };
  });

  it('should render when visible and items are selected', () => {
    render(<BulkActionBar {...mockProps} />);

    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('of')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('selected')).toBeInTheDocument();
  });

  it('should not render when not visible', () => {
    render(<BulkActionBar {...mockProps} isVisible={false} />);

    expect(screen.queryByText('3')).not.toBeInTheDocument();
  });

  it('should not render when no items are selected', () => {
    render(<BulkActionBar {...mockProps} selectedCount={0} />);

    expect(screen.queryByText('selected')).not.toBeInTheDocument();
  });

  it('should call selection handlers', async () => {
    const user = userEvent.setup();
    render(<BulkActionBar {...mockProps} />);

    await user.click(screen.getByText('Select All'));
    expect(mockProps.onSelectAll).toHaveBeenCalled();

    await user.click(screen.getByText('Deselect All'));
    expect(mockProps.onDeselectAll).toHaveBeenCalled();
  });

  it('should call bulk action handlers', async () => {
    const user = userEvent.setup();
    render(<BulkActionBar {...mockProps} />);

    await user.click(screen.getByText('Tag'));
    expect(mockProps.onBulkTag).toHaveBeenCalled();

    await user.click(screen.getByText('Duplicate'));
    expect(mockProps.onBulkDuplicate).toHaveBeenCalled();

    await user.click(screen.getByText('Share'));
    expect(mockProps.onBulkShare).toHaveBeenCalled();

    await user.click(screen.getByText('Delete'));
    expect(mockProps.onBulkDelete).toHaveBeenCalled();
  });

  it('should call cancel handler', async () => {
    const user = userEvent.setup();
    render(<BulkActionBar {...mockProps} />);

    await user.click(screen.getByText('Cancel'));
    expect(mockProps.onCancel).toHaveBeenCalled();
  });

  it('should display correct tooltips for shortcuts', () => {
    render(<BulkActionBar {...mockProps} />);

    expect(screen.getByTitle('Select All (Cmd+A)')).toBeInTheDocument();
    expect(screen.getByTitle('Deselect All (Cmd+Shift+A)')).toBeInTheDocument();
    expect(screen.getByTitle('Add Tags (Cmd+T)')).toBeInTheDocument();
    expect(screen.getByTitle('Duplicate (Cmd+D)')).toBeInTheDocument();
    expect(screen.getByTitle('Share (Cmd+Shift+S)')).toBeInTheDocument();
    expect(screen.getByTitle('Delete (Delete)')).toBeInTheDocument();
    expect(screen.getByTitle('Cancel (Esc)')).toBeInTheDocument();
  });
});
