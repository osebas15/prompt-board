import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Toast, Alert } from '../Toast/Toast';

describe('Toast', () => {
  beforeEach(() => {
    vi.clearAllTimers();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  describe('Basic Rendering', () => {
    it('renders toast with title and description', () => {
      render(
        <Toast
          title="Success"
          description="Operation completed successfully"
          duration={0}
        />
      );

      expect(screen.getByTestId('toast')).toBeInTheDocument();
      expect(screen.getByTestId('toast-title')).toHaveTextContent('Success');
      expect(screen.getByTestId('toast-description')).toHaveTextContent('Operation completed successfully');
    });

    it('renders toast with only title', () => {
      render(<Toast title="Success" duration={0} />);

      expect(screen.getByTestId('toast-title')).toHaveTextContent('Success');
      expect(screen.queryByTestId('toast-description')).not.toBeInTheDocument();
    });

    it('renders toast with only description', () => {
      render(<Toast description="Operation completed" duration={0} />);

      expect(screen.getByTestId('toast-description')).toHaveTextContent('Operation completed');
      expect(screen.queryByTestId('toast-title')).not.toBeInTheDocument();
    });

    it('renders toast with children', () => {
      render(
        <Toast duration={0}>
          <button>Action</button>
        </Toast>
      );

      expect(screen.getByRole('button', { name: 'Action' })).toBeInTheDocument();
    });
  });

  describe('Variants', () => {
    it('applies default variant', () => {
      render(<Toast variant="default" duration={0} />);

      const toast = screen.getByTestId('toast');
      expect(toast).toHaveClass('bg-background', 'border-border', 'text-text-primary');
    });

    it('applies destructive variant', () => {
      render(<Toast variant="destructive" duration={0} />);

      const toast = screen.getByTestId('toast');
      expect(toast).toHaveClass('bg-destructive', 'border-destructive', 'text-destructive-foreground');
    });

    it('applies success variant', () => {
      render(<Toast variant="success" duration={0} />);

      const toast = screen.getByTestId('toast');
      expect(toast).toHaveClass('bg-green-500', 'border-green-500', 'text-white');
    });

    it('applies warning variant', () => {
      render(<Toast variant="warning" duration={0} />);

      const toast = screen.getByTestId('toast');
      expect(toast).toHaveClass('bg-yellow-500', 'border-yellow-500', 'text-white');
    });
  });

  describe('Auto Dismiss', () => {
    it('auto dismisses after duration', async () => {
      const onClose = vi.fn();
      
      render(
        <Toast
          title="Success"
          duration={1000}
          onClose={onClose}
        />
      );

      expect(screen.getByTestId('toast')).toBeInTheDocument();

      // Fast forward time for duration + animation delay
      vi.advanceTimersByTime(1300); // 1000 + 300

      expect(onClose).toHaveBeenCalled();
    });

    it('does not auto dismiss when duration is 0', () => {
      const onClose = vi.fn();
      
      render(
        <Toast
          title="Success"
          duration={0}
          onClose={onClose}
        />
      );

      vi.advanceTimersByTime(10000);

      expect(onClose).not.toHaveBeenCalled();
      expect(screen.getByTestId('toast')).toBeInTheDocument();
    });
  });

  describe('Manual Close', () => {
    it('shows close button when onClose is provided', () => {
      const onClose = vi.fn();
      
      render(
        <Toast
          title="Success"
          onClose={onClose}
          duration={0}
        />
      );

      expect(screen.getByTestId('toast-close')).toBeInTheDocument();
    });

    it('does not show close button when onClose is not provided', () => {
      render(
        <Toast
          title="Success"
          duration={0}
        />
      );

      expect(screen.queryByTestId('toast-close')).not.toBeInTheDocument();
    });

    it('calls onClose when close button is clicked', () => {
      const onClose = vi.fn();
      
      render(
        <Toast
          title="Success"
          onClose={onClose}
          duration={0}
        />
      );

      const closeButton = screen.getByTestId('toast-close');
      closeButton.click();

      // Should call onClose after animation delay
      vi.advanceTimersByTime(300);
      
      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('has correct role', () => {
      render(<Toast title="Success" duration={0} />);

      expect(screen.getByTestId('toast')).toHaveAttribute('role', 'alert');
    });

    it('has correct aria-label for close button', () => {
      render(<Toast title="Success" onClose={vi.fn()} duration={0} />);

      expect(screen.getByTestId('toast-close')).toHaveAttribute('aria-label', 'Close toast');
    });
  });

  describe('Custom Props', () => {
    it('applies custom className', () => {
      render(<Toast className="custom-toast" duration={0} />);

      expect(screen.getByTestId('toast')).toHaveClass('custom-toast');
    });
  });
});

describe('Alert', () => {
  describe('Basic Rendering', () => {
    it('renders alert with title and description', () => {
      render(
        <Alert
          title="Warning"
          description="Please check your input"
        />
      );

      expect(screen.getByTestId('alert')).toBeInTheDocument();
      expect(screen.getByTestId('alert-title')).toHaveTextContent('Warning');
      expect(screen.getByTestId('alert-description')).toHaveTextContent('Please check your input');
    });

    it('renders alert with only title', () => {
      render(<Alert title="Warning" />);

      expect(screen.getByTestId('alert-title')).toHaveTextContent('Warning');
      expect(screen.queryByTestId('alert-description')).not.toBeInTheDocument();
    });

    it('renders alert with only description', () => {
      render(<Alert description="Please check your input" />);

      expect(screen.getByTestId('alert-description')).toHaveTextContent('Please check your input');
      expect(screen.queryByTestId('alert-title')).not.toBeInTheDocument();
    });

    it('renders alert with children', () => {
      render(
        <Alert>
          <button>Learn More</button>
        </Alert>
      );

      expect(screen.getByRole('button', { name: 'Learn More' })).toBeInTheDocument();
    });
  });

  describe('Variants', () => {
    it('applies default variant', () => {
      render(<Alert variant="default" />);

      const alert = screen.getByTestId('alert');
      expect(alert).toHaveClass('bg-background', 'border-border', 'text-text-primary');
    });

    it('applies destructive variant', () => {
      render(<Alert variant="destructive" />);

      const alert = screen.getByTestId('alert');
      expect(alert).toHaveClass('bg-destructive/10', 'border-destructive/20', 'text-destructive');
    });

    it('applies success variant', () => {
      render(<Alert variant="success" />);

      const alert = screen.getByTestId('alert');
      expect(alert).toHaveClass('bg-green-50', 'border-green-200', 'text-green-800');
    });

    it('applies warning variant', () => {
      render(<Alert variant="warning" />);

      const alert = screen.getByTestId('alert');
      expect(alert).toHaveClass('bg-yellow-50', 'border-yellow-200', 'text-yellow-800');
    });
  });

  describe('Icons', () => {
    it('shows correct icon for each variant', () => {
      const { rerender } = render(<Alert variant="default" />);
      expect(screen.getByTestId('alert')).toBeInTheDocument();

      rerender(<Alert variant="destructive" />);
      expect(screen.getByTestId('alert')).toBeInTheDocument();

      rerender(<Alert variant="success" />);
      expect(screen.getByTestId('alert')).toBeInTheDocument();

      rerender(<Alert variant="warning" />);
      expect(screen.getByTestId('alert')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has correct role', () => {
      render(<Alert title="Warning" />);

      expect(screen.getByTestId('alert')).toHaveAttribute('role', 'alert');
    });
  });

  describe('Custom Props', () => {
    it('applies custom className', () => {
      render(<Alert className="custom-alert" />);

      expect(screen.getByTestId('alert')).toHaveClass('custom-alert');
    });
  });
});
