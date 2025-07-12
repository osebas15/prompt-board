import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Modal } from '../Modal/Modal';

describe('Modal', () => {
  const mockOnClose = vi.fn();
  
  beforeEach(() => {
    mockOnClose.mockClear();
    // Reset body overflow
    document.body.style.overflow = '';
  });

  afterEach(() => {
    // Clean up body overflow
    document.body.style.overflow = '';
  });

  describe('Rendering', () => {
    it('renders when open', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose}>
          <p>Modal content</p>
        </Modal>
      );

      expect(screen.getByTestId('modal')).toBeInTheDocument();
      expect(screen.getByText('Modal content')).toBeInTheDocument();
    });

    it('does not render when closed', () => {
      render(
        <Modal isOpen={false} onClose={mockOnClose}>
          <p>Modal content</p>
        </Modal>
      );

      expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
    });

    it('renders with title', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose} title="Test Modal">
          <p>Modal content</p>
        </Modal>
      );

      expect(screen.getByText('Test Modal')).toBeInTheDocument();
      expect(screen.getByTestId('modal-close')).toBeInTheDocument();
    });

    it('renders without title', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose}>
          <p>Modal content</p>
        </Modal>
      );

      expect(screen.queryByText('Test Modal')).not.toBeInTheDocument();
      expect(screen.queryByTestId('modal-close')).not.toBeInTheDocument();
    });
  });

  describe('Sizes', () => {
    it('applies correct size classes', () => {
      const { rerender } = render(
        <Modal isOpen={true} onClose={mockOnClose} size="sm">
          <p>Content</p>
        </Modal>
      );

      expect(screen.getByTestId('modal')).toHaveClass('max-w-md');

      rerender(
        <Modal isOpen={true} onClose={mockOnClose} size="md">
          <p>Content</p>
        </Modal>
      );
      expect(screen.getByTestId('modal')).toHaveClass('max-w-lg');

      rerender(
        <Modal isOpen={true} onClose={mockOnClose} size="lg">
          <p>Content</p>
        </Modal>
      );
      expect(screen.getByTestId('modal')).toHaveClass('max-w-2xl');

      rerender(
        <Modal isOpen={true} onClose={mockOnClose} size="xl">
          <p>Content</p>
        </Modal>
      );
      expect(screen.getByTestId('modal')).toHaveClass('max-w-4xl');
    });
  });

  describe('Closing Behavior', () => {
    it('calls onClose when close button is clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <Modal isOpen={true} onClose={mockOnClose} title="Test Modal">
          <p>Modal content</p>
        </Modal>
      );

      await user.click(screen.getByTestId('modal-close'));
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when overlay is clicked', async () => {
      const user = userEvent.setup();
      const testOnClose = vi.fn();
      
      render(
        <Modal isOpen={true} onClose={testOnClose}>
          <p>Modal content</p>
        </Modal>
      );

      await user.click(screen.getByTestId('modal-overlay'));
      expect(testOnClose).toHaveBeenCalledTimes(1);
    });

    it('does not close when overlay click is disabled', async () => {
      const user = userEvent.setup();
      
      render(
        <Modal isOpen={true} onClose={mockOnClose} closeOnOverlayClick={false}>
          <p>Modal content</p>
        </Modal>
      );

      await user.click(screen.getByTestId('modal-overlay'));
      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('does not close when clicking modal content', async () => {
      const user = userEvent.setup();
      
      render(
        <Modal isOpen={true} onClose={mockOnClose}>
          <p>Modal content</p>
        </Modal>
      );

      await user.click(screen.getByTestId('modal'));
      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('calls onClose when Escape key is pressed', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose}>
          <p>Modal content</p>
        </Modal>
      );

      fireEvent.keyDown(document, { key: 'Escape' });
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('does not close on Escape when disabled', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose} closeOnEscape={false}>
          <p>Modal content</p>
        </Modal>
      );

      fireEvent.keyDown(document, { key: 'Escape' });
      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('has correct ARIA attributes', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose} title="Test Modal">
          <p>Modal content</p>
        </Modal>
      );

      const modal = screen.getByTestId('modal');
      expect(modal).toHaveAttribute('role', 'dialog');
      expect(modal).toHaveAttribute('aria-modal', 'true');
      expect(modal).toHaveAttribute('aria-labelledby', 'modal-title');
    });

    it('focuses modal when opened', async () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose}>
          <p>Modal content</p>
        </Modal>
      );

      await waitFor(() => {
        expect(screen.getByTestId('modal')).toHaveFocus();
      });
    });

    it('prevents body scroll when open', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose}>
          <p>Modal content</p>
        </Modal>
      );

      expect(document.body.style.overflow).toBe('hidden');
    });

    it('restores body scroll when closed', () => {
      const { rerender } = render(
        <Modal isOpen={true} onClose={mockOnClose}>
          <p>Modal content</p>
        </Modal>
      );

      expect(document.body.style.overflow).toBe('hidden');

      rerender(
        <Modal isOpen={false} onClose={mockOnClose}>
          <p>Modal content</p>
        </Modal>
      );

      expect(document.body.style.overflow).toBe('');
    });
  });

  describe('Focus Management', () => {
    it('traps focus within modal', async () => {
      const user = userEvent.setup();
      
      render(
        <Modal isOpen={true} onClose={mockOnClose} title="Test Modal">
          <button>First button</button>
          <button>Second button</button>
        </Modal>
      );

      const firstButton = screen.getByText('First button');
      const secondButton = screen.getByText('Second button');
      const closeButton = screen.getByTestId('modal-close');

      // Focus should start on first focusable element
      firstButton.focus();
      expect(firstButton).toHaveFocus();

      // Tab should move to next element
      await user.tab();
      expect(secondButton).toHaveFocus();

      // Tab should move to close button
      await user.tab();
      expect(closeButton).toHaveFocus();

      // Tab should wrap to first element
      await user.tab();
      expect(firstButton).toHaveFocus();

      // Shift+Tab should go backward
      await user.tab({ shift: true });
      expect(closeButton).toHaveFocus();
    });
  });

  describe('Custom Props', () => {
    it('applies custom className', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose} className="custom-modal">
          <p>Modal content</p>
        </Modal>
      );

      expect(screen.getByTestId('modal')).toHaveClass('custom-modal');
    });
  });
});
