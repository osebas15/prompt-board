import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { Select } from '../Select/Select';

const mockOptions = [
  { value: 'option1', label: 'Option 1' },
  { value: 'option2', label: 'Option 2' },
  { value: 'option3', label: 'Option 3', disabled: true },
  { value: 'option4', label: 'Option 4' },
];

describe('Select', () => {
  describe('Basic Rendering', () => {
    it('renders select with placeholder', () => {
      render(<Select options={mockOptions} placeholder="Choose option" />);

      expect(screen.getByTestId('select-trigger')).toBeInTheDocument();
      expect(screen.getByText('Choose option')).toBeInTheDocument();
    });

    it('renders with default value', () => {
      render(<Select options={mockOptions} defaultValue="option2" />);

      expect(screen.getByText('Option 2')).toBeInTheDocument();
    });

    it('renders with controlled value', () => {
      render(<Select options={mockOptions} value="option1" />);

      expect(screen.getByText('Option 1')).toBeInTheDocument();
    });

    it('does not render options initially', () => {
      render(<Select options={mockOptions} />);

      expect(screen.queryByTestId('select-options')).not.toBeInTheDocument();
    });
  });

  describe('Opening and Closing', () => {
    it('opens dropdown when clicked', async () => {
      const user = userEvent.setup();
      render(<Select options={mockOptions} />);

      await user.click(screen.getByTestId('select-trigger'));
      
      expect(screen.getByTestId('select-options')).toBeInTheDocument();
      expect(screen.getByTestId('select-trigger')).toHaveAttribute('aria-expanded', 'true');
    });

    it('closes dropdown when clicked outside', async () => {
      const user = userEvent.setup();
      render(
        <div>
          <Select options={mockOptions} />
          <button>Outside button</button>
        </div>
      );

      // Open dropdown
      await user.click(screen.getByTestId('select-trigger'));
      expect(screen.getByTestId('select-options')).toBeInTheDocument();

      // Click outside
      await user.click(screen.getByText('Outside button'));
      await waitFor(() => {
        expect(screen.queryByTestId('select-options')).not.toBeInTheDocument();
      });
    });

    it('closes dropdown when Escape is pressed', async () => {
      const user = userEvent.setup();
      render(<Select options={mockOptions} />);

      await user.click(screen.getByTestId('select-trigger'));
      expect(screen.getByTestId('select-options')).toBeInTheDocument();

      await user.keyboard('{Escape}');
      expect(screen.queryByTestId('select-options')).not.toBeInTheDocument();
    });
  });

  describe('Option Selection', () => {
    it('selects option when clicked', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      
      render(<Select options={mockOptions} onChange={onChange} />);

      await user.click(screen.getByTestId('select-trigger'));
      await user.click(screen.getByTestId('select-option-option2'));

      expect(onChange).toHaveBeenCalledWith('option2');
      expect(screen.getByText('Option 2')).toBeInTheDocument();
      expect(screen.queryByTestId('select-options')).not.toBeInTheDocument();
    });

    it('does not select disabled option', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      
      render(<Select options={mockOptions} onChange={onChange} />);

      await user.click(screen.getByTestId('select-trigger'));
      await user.click(screen.getByTestId('select-option-option3'));

      expect(onChange).not.toHaveBeenCalled();
      expect(screen.getByTestId('select-options')).toBeInTheDocument(); // Should stay open
    });
  });

  describe('Keyboard Navigation', () => {
    it('opens dropdown with Enter key', async () => {
      const user = userEvent.setup();
      render(<Select options={mockOptions} />);

      const trigger = screen.getByTestId('select-trigger');
      trigger.focus();
      await user.keyboard('{Enter}');

      expect(screen.getByTestId('select-options')).toBeInTheDocument();
    });

    it('opens dropdown with Space key', async () => {
      const user = userEvent.setup();
      render(<Select options={mockOptions} />);

      const trigger = screen.getByTestId('select-trigger');
      trigger.focus();
      await user.keyboard(' ');

      expect(screen.getByTestId('select-options')).toBeInTheDocument();
    });

    it('navigates options with arrow keys', async () => {
      const user = userEvent.setup();
      render(<Select options={mockOptions} />);

      const trigger = screen.getByTestId('select-trigger');
      trigger.focus();
      
      // Open with Enter
      await user.keyboard('{Enter}');
      
      // Arrow down should focus first option
      await user.keyboard('{ArrowDown}');
      expect(screen.getByTestId('select-option-option1')).toHaveClass('bg-primary');

      // Arrow down should focus second option
      await user.keyboard('{ArrowDown}');
      expect(screen.getByTestId('select-option-option2')).toHaveClass('bg-primary');

      // Arrow up should go back to first option
      await user.keyboard('{ArrowUp}');
      expect(screen.getByTestId('select-option-option1')).toHaveClass('bg-primary');
    });

    it('selects focused option with Enter', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      
      render(<Select options={mockOptions} onChange={onChange} />);

      const trigger = screen.getByTestId('select-trigger');
      trigger.focus();
      
      await user.keyboard('{Enter}'); // Open
      await user.keyboard('{ArrowDown}'); // Focus first option
      await user.keyboard('{Enter}'); // Select

      expect(onChange).toHaveBeenCalledWith('option1');
      expect(screen.queryByTestId('select-options')).not.toBeInTheDocument();
    });

    it('navigates to first option with Home key', async () => {
      const user = userEvent.setup();
      render(<Select options={mockOptions} />);

      const trigger = screen.getByTestId('select-trigger');
      trigger.focus();
      
      await user.keyboard('{Enter}'); // Open
      await user.keyboard('{ArrowDown}{ArrowDown}'); // Focus third option
      await user.keyboard('{Home}'); // Go to first

      expect(screen.getByTestId('select-option-option1')).toHaveClass('bg-primary');
    });

    it('navigates to last option with End key', async () => {
      const user = userEvent.setup();
      render(<Select options={mockOptions} />);

      const trigger = screen.getByTestId('select-trigger');
      trigger.focus();
      
      await user.keyboard('{Enter}'); // Open
      await user.keyboard('{End}'); // Go to last

      expect(screen.getByTestId('select-option-option4')).toHaveClass('bg-primary');
    });
  });

  describe('Disabled State', () => {
    it('does not open when disabled', async () => {
      const user = userEvent.setup();
      render(<Select options={mockOptions} disabled />);

      await user.click(screen.getByTestId('select-trigger'));
      
      expect(screen.queryByTestId('select-options')).not.toBeInTheDocument();
    });

    it('applies disabled styles', () => {
      render(<Select options={mockOptions} disabled />);

      const trigger = screen.getByTestId('select-trigger');
      expect(trigger).toHaveClass('bg-surface', 'text-text-disabled', 'cursor-not-allowed');
      expect(trigger).toBeDisabled();
    });

    it('ignores keyboard events when disabled', async () => {
      const user = userEvent.setup();
      render(<Select options={mockOptions} disabled />);

      const trigger = screen.getByTestId('select-trigger');
      trigger.focus();
      await user.keyboard('{Enter}');

      expect(screen.queryByTestId('select-options')).not.toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('applies error styles', () => {
      render(<Select options={mockOptions} error />);

      const trigger = screen.getByTestId('select-trigger');
      expect(trigger).toHaveClass('border-destructive');
    });
  });

  describe('Sizes', () => {
    it('applies small size', () => {
      render(<Select options={mockOptions} size="sm" />);

      const trigger = screen.getByTestId('select-trigger');
      expect(trigger).toHaveClass('px-3', 'py-1.5', 'text-sm');
    });

    it('applies medium size (default)', () => {
      render(<Select options={mockOptions} size="md" />);

      const trigger = screen.getByTestId('select-trigger');
      expect(trigger).toHaveClass('px-3', 'py-2', 'text-base');
    });

    it('applies large size', () => {
      render(<Select options={mockOptions} size="lg" />);

      const trigger = screen.getByTestId('select-trigger');
      expect(trigger).toHaveClass('px-4', 'py-3', 'text-lg');
    });
  });

  describe('Accessibility', () => {
    it('has correct ARIA attributes', () => {
      render(<Select options={mockOptions} aria-label="Test select" />);

      const trigger = screen.getByTestId('select-trigger');
      expect(trigger).toHaveAttribute('aria-haspopup', 'listbox');
      expect(trigger).toHaveAttribute('aria-expanded', 'false');
      expect(trigger).toHaveAttribute('aria-label', 'Test select');
    });

    it('has correct ARIA attributes when open', async () => {
      const user = userEvent.setup();
      render(<Select options={mockOptions} />);

      await user.click(screen.getByTestId('select-trigger'));

      expect(screen.getByTestId('select-trigger')).toHaveAttribute('aria-expanded', 'true');
      expect(screen.getByTestId('select-options')).toHaveAttribute('role', 'listbox');
    });

    it('sets aria-selected on selected option', async () => {
      const user = userEvent.setup();
      render(<Select options={mockOptions} value="option2" />);

      await user.click(screen.getByTestId('select-trigger'));

      expect(screen.getByTestId('select-option-option2')).toHaveAttribute('aria-selected', 'true');
      expect(screen.getByTestId('select-option-option1')).toHaveAttribute('aria-selected', 'false');
    });
  });

  describe('Custom Props', () => {
    it('applies custom className', () => {
      render(<Select options={mockOptions} className="custom-select" />);

      expect(screen.getByTestId('select')).toHaveClass('custom-select');
    });

    it('calls onBlur when clicking outside', async () => {
      const user = userEvent.setup();
      const onBlur = vi.fn();
      
      render(
        <div>
          <Select options={mockOptions} onBlur={onBlur} />
          <button>Outside</button>
        </div>
      );

      await user.click(screen.getByTestId('select-trigger'));
      await user.click(screen.getByText('Outside'));

      await waitFor(() => {
        expect(onBlur).toHaveBeenCalled();
      });
    });
  });

  describe('Controlled vs Uncontrolled', () => {
    it('works as uncontrolled component', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      
      render(<Select options={mockOptions} defaultValue="option1" onChange={onChange} />);

      expect(screen.getByText('Option 1')).toBeInTheDocument();

      await user.click(screen.getByTestId('select-trigger'));
      await user.click(screen.getByTestId('select-option-option2'));

      expect(onChange).toHaveBeenCalledWith('option2');
      expect(screen.getByText('Option 2')).toBeInTheDocument();
    });

    it('works as controlled component', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      
      const { rerender } = render(
        <Select options={mockOptions} value="option1" onChange={onChange} />
      );

      expect(screen.getByText('Option 1')).toBeInTheDocument();

      await user.click(screen.getByTestId('select-trigger'));
      await user.click(screen.getByTestId('select-option-option2'));

      expect(onChange).toHaveBeenCalledWith('option2');
      // Value shouldn't change until parent re-renders with new value
      expect(screen.getByText('Option 1')).toBeInTheDocument();

      // Simulate parent updating the value
      rerender(<Select options={mockOptions} value="option2" onChange={onChange} />);
      expect(screen.getByText('Option 2')).toBeInTheDocument();
    });
  });
});
