import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { Checkbox } from '../Checkbox/Checkbox';

describe('Checkbox', () => {
  describe('Basic Rendering', () => {
    it('renders checkbox input', () => {
      render(<Checkbox />);

      expect(screen.getByTestId('checkbox')).toBeInTheDocument();
      expect(screen.getByTestId('checkbox')).toHaveAttribute('type', 'checkbox');
    });

    it('renders with label', () => {
      render(<Checkbox label="Accept terms" />);

      expect(screen.getByTestId('checkbox-label')).toBeInTheDocument();
      expect(screen.getByText('Accept terms')).toBeInTheDocument();
    });

    it('renders with description', () => {
      render(<Checkbox description="This is required for signup" />);

      expect(screen.getByTestId('checkbox-description')).toBeInTheDocument();
      expect(screen.getByText('This is required for signup')).toBeInTheDocument();
    });

    it('renders with both label and description', () => {
      render(
        <Checkbox
          label="Accept terms"
          description="Please read our terms and conditions"
        />
      );

      expect(screen.getByTestId('checkbox-label')).toBeInTheDocument();
      expect(screen.getByTestId('checkbox-description')).toBeInTheDocument();
    });
  });

  describe('States', () => {
    it('can be checked and unchecked', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      
      render(<Checkbox onChange={onChange} />);

      const checkbox = screen.getByTestId('checkbox');
      expect(checkbox).not.toBeChecked();

      await user.click(checkbox);
      expect(onChange).toHaveBeenCalledTimes(1);
    });

    it('can be controlled', () => {
      const { rerender } = render(<Checkbox checked={false} onChange={vi.fn()} />);

      expect(screen.getByTestId('checkbox')).not.toBeChecked();

      rerender(<Checkbox checked={true} onChange={vi.fn()} />);
      expect(screen.getByTestId('checkbox')).toBeChecked();
    });

    it('can be disabled', () => {
      render(<Checkbox disabled />);

      const checkbox = screen.getByTestId('checkbox');
      expect(checkbox).toBeDisabled();
      expect(checkbox).toHaveClass('cursor-not-allowed');
    });

    it('can be indeterminate', () => {
      render(<Checkbox indeterminate />);

      expect(screen.getByTestId('checkbox-icon')).toHaveClass('opacity-100');
    });
  });

  describe('Sizes', () => {
    it('applies small size', () => {
      render(<Checkbox size="sm" label="Small checkbox" />);

      expect(screen.getByTestId('checkbox')).toHaveClass('w-4', 'h-4');
      expect(screen.getByTestId('checkbox-label')).toHaveClass('text-sm');
    });

    it('applies medium size (default)', () => {
      render(<Checkbox size="md" label="Medium checkbox" />);

      expect(screen.getByTestId('checkbox')).toHaveClass('w-5', 'h-5');
      expect(screen.getByTestId('checkbox-label')).toHaveClass('text-base');
    });

    it('applies large size', () => {
      render(<Checkbox size="lg" label="Large checkbox" />);

      expect(screen.getByTestId('checkbox')).toHaveClass('w-6', 'h-6');
      expect(screen.getByTestId('checkbox-label')).toHaveClass('text-lg');
    });
  });

  describe('Error State', () => {
    it('applies error styles', () => {
      render(<Checkbox error />);

      const checkbox = screen.getByTestId('checkbox');
      expect(checkbox).toHaveClass('border-destructive');
    });

    it('applies error styles to label', () => {
      render(<Checkbox error label="Error checkbox" />);

      expect(screen.getByTestId('checkbox-label')).toHaveClass('text-destructive');
    });
  });

  describe('Disabled State', () => {
    it('applies disabled styles', () => {
      render(<Checkbox disabled />);

      const checkbox = screen.getByTestId('checkbox');
      expect(checkbox).toHaveClass('bg-surface', 'text-text-disabled', 'cursor-not-allowed');
    });

    it('applies disabled styles to label', () => {
      render(<Checkbox disabled label="Disabled checkbox" />);

      expect(screen.getByTestId('checkbox-label')).toHaveClass('text-text-disabled');
    });

    it('applies disabled styles to description', () => {
      render(<Checkbox disabled description="Disabled description" />);

      expect(screen.getByTestId('checkbox-description')).toHaveClass('text-text-disabled');
    });

    it('does not respond to clicks when disabled', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      
      render(<Checkbox disabled onChange={onChange} />);

      await user.click(screen.getByTestId('checkbox'));
      expect(onChange).not.toHaveBeenCalled();
    });
  });

  describe('Label Association', () => {
    it('associates label with checkbox using id', () => {
      render(<Checkbox id="test-checkbox" label="Test label" />);

      const checkbox = screen.getByTestId('checkbox');
      const label = screen.getByTestId('checkbox-label');
      
      expect(checkbox).toHaveAttribute('id', 'test-checkbox');
      expect(label).toHaveAttribute('for', 'test-checkbox');
    });

    it('can be clicked via label', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      
      render(<Checkbox id="clickable-checkbox" label="Clickable label" onChange={onChange} />);

      await user.click(screen.getByTestId('checkbox-label'));
      expect(onChange).toHaveBeenCalledTimes(1);
    });
  });

  describe('Icons', () => {
    it('shows check icon when checked', () => {
      render(<Checkbox checked readOnly />);

      const icon = screen.getByTestId('checkbox-icon');
      expect(icon).toHaveClass('peer-checked:opacity-100');
    });

    it('shows indeterminate icon when indeterminate', () => {
      render(<Checkbox indeterminate />);

      const icon = screen.getByTestId('checkbox-icon');
      expect(icon).toHaveClass('opacity-100');
    });
  });

  describe('Accessibility', () => {
    it('supports keyboard navigation', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      
      render(<Checkbox onChange={onChange} />);

      const checkbox = screen.getByTestId('checkbox');
      checkbox.focus();
      
      await user.keyboard(' ');
      expect(onChange).toHaveBeenCalledTimes(1);
    });

    it('has proper focus styles', () => {
      render(<Checkbox />);

      const checkbox = screen.getByTestId('checkbox');
      expect(checkbox).toHaveClass('focus:ring-2', 'focus:ring-primary');
    });
  });

  describe('Custom Props', () => {
    it('applies custom className', () => {
      render(<Checkbox className="custom-checkbox" />);

      expect(screen.getByTestId('checkbox-wrapper')).toHaveClass('custom-checkbox');
    });

    it('passes through HTML attributes', () => {
      render(<Checkbox data-custom="test" name="checkbox-name" />);

      const checkbox = screen.getByTestId('checkbox');
      expect(checkbox).toHaveAttribute('data-custom', 'test');
      expect(checkbox).toHaveAttribute('name', 'checkbox-name');
    });
  });

  describe('Forward Ref', () => {
    it('forwards ref to input element', () => {
      const ref = { current: null };
      
      render(<Checkbox ref={ref} />);

      expect(ref.current).toBe(screen.getByTestId('checkbox'));
    });
  });
});
