import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { Input } from '../Input/Input';

describe('Input', () => {
  it('renders basic input correctly', () => {
    render(<Input placeholder="Enter text" />);
    
    const input = screen.getByRole('textbox');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('placeholder', 'Enter text');
  });

  it('renders with label', () => {
    render(<Input label="Username" placeholder="Enter username" />);
    
    const label = screen.getByText('Username');
    const input = screen.getByRole('textbox');
    
    expect(label).toBeInTheDocument();
    expect(label).toHaveAttribute('for', input.id);
    expect(input).toHaveAccessibleName('Username');
  });

  it('renders with error state', () => {
    render(<Input label="Email" error="Invalid email format" />);
    
    const input = screen.getByRole('textbox');
    const errorMessage = screen.getByText('Invalid email format');
    
    expect(input).toHaveClass('border-red-300', 'focus:border-red-500', 'focus:ring-red-500');
    expect(errorMessage).toBeInTheDocument();
    expect(errorMessage).toHaveClass('text-red-600');
  });

  it('renders with helper text', () => {
    render(<Input label="Password" helperText="Must be at least 8 characters" />);
    
    const helperText = screen.getByText('Must be at least 8 characters');
    expect(helperText).toBeInTheDocument();
    expect(helperText).toHaveClass('text-gray-500');
  });

  it('shows error message instead of helper text when both are provided', () => {
    render(
      <Input 
        label="Password" 
        helperText="Must be at least 8 characters"
        error="Password too short"
      />
    );
    
    expect(screen.getByText('Password too short')).toBeInTheDocument();
    expect(screen.queryByText('Must be at least 8 characters')).not.toBeInTheDocument();
  });

  it('renders with left icon', () => {
    const LeftIcon = () => <span data-testid="left-icon">@</span>;
    render(<Input leftIcon={<LeftIcon />} placeholder="Email" />);
    
    const input = screen.getByRole('textbox');
    const icon = screen.getByTestId('left-icon');
    
    expect(icon).toBeInTheDocument();
    expect(input).toHaveClass('pl-10');
  });

  it('renders with right icon', () => {
    const RightIcon = () => <span data-testid="right-icon">👁</span>;
    render(<Input rightIcon={<RightIcon />} placeholder="Password" />);
    
    const input = screen.getByRole('textbox');
    const icon = screen.getByTestId('right-icon');
    
    expect(icon).toBeInTheDocument();
    expect(input).toHaveClass('pr-10');
  });

  it('renders with both left and right icons', () => {
    const LeftIcon = () => <span data-testid="left-icon">@</span>;
    const RightIcon = () => <span data-testid="right-icon">👁</span>;
    
    render(
      <Input 
        leftIcon={<LeftIcon />} 
        rightIcon={<RightIcon />} 
        placeholder="Email"
      />
    );
    
    const input = screen.getByRole('textbox');
    
    expect(screen.getByTestId('left-icon')).toBeInTheDocument();
    expect(screen.getByTestId('right-icon')).toBeInTheDocument();
    expect(input).toHaveClass('pl-10', 'pr-10');
  });

  it('handles input changes', () => {
    const handleChange = vi.fn();
    render(<Input onChange={handleChange} />);
    
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'test input' } });
    
    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(input).toHaveValue('test input');
  });

  it('supports different input types', () => {
    const { rerender } = render(<Input type="email" />);
    expect(screen.getByRole('textbox')).toHaveAttribute('type', 'email');

    rerender(<Input type="password" />);
    expect(screen.getByDisplayValue('')).toHaveAttribute('type', 'password');

    rerender(<Input type="number" />);
    expect(screen.getByRole('spinbutton')).toHaveAttribute('type', 'number');
  });

  it('supports disabled state', () => {
    render(<Input disabled placeholder="Disabled input" />);
    
    const input = screen.getByRole('textbox');
    expect(input).toBeDisabled();
  });

  it('supports readonly state', () => {
    render(<Input readOnly value="Read only value" />);
    
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('readonly');
    expect(input).toHaveValue('Read only value');
  });

  it('generates unique IDs for multiple inputs', () => {
    render(
      <div>
        <Input label="First input" />
        <Input label="Second input" />
      </div>
    );
    
    const inputs = screen.getAllByRole('textbox');
    expect(inputs[0].id).not.toBe(inputs[1].id);
    expect(inputs[0].id).toBeTruthy();
    expect(inputs[1].id).toBeTruthy();
  });

  it('uses provided ID when given', () => {
    render(<Input id="custom-input" label="Custom ID" />);
    
    const input = screen.getByRole('textbox');
    const label = screen.getByText('Custom ID');
    
    expect(input).toHaveAttribute('id', 'custom-input');
    expect(label).toHaveAttribute('for', 'custom-input');
  });

  it('supports custom className', () => {
    render(<Input className="custom-input-class" />);
    
    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('custom-input-class');
  });

  it('passes through HTML input attributes', () => {
    render(
      <Input 
        data-testid="test-input"
        maxLength={10}
        autoComplete="email"
        required
      />
    );
    
    const input = screen.getByTestId('test-input');
    expect(input).toHaveAttribute('maxlength', '10');
    expect(input).toHaveAttribute('autocomplete', 'email');
    expect(input).toBeRequired();
  });

  it('has proper focus styles', () => {
    render(<Input />);
    
    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('focus:border-blue-500', 'focus:ring-blue-500');
  });

  it('handles focus and blur events', () => {
    const handleFocus = vi.fn();
    const handleBlur = vi.fn();
    
    render(<Input onFocus={handleFocus} onBlur={handleBlur} />);
    
    const input = screen.getByRole('textbox');
    
    fireEvent.focus(input);
    expect(handleFocus).toHaveBeenCalledTimes(1);
    
    fireEvent.blur(input);
    expect(handleBlur).toHaveBeenCalledTimes(1);
  });

  it('has correct label styling', () => {
    render(<Input label="Test Label" />);
    
    const label = screen.getByText('Test Label');
    expect(label).toHaveClass('block', 'text-sm', 'font-medium', 'text-gray-700', 'mb-1');
  });

  it('maintains proper spacing with icons', () => {
    const LeftIcon = () => <span data-testid="left-icon">🔍</span>;
    render(<Input leftIcon={<LeftIcon />} />);
    
    const iconContainer = screen.getByTestId('left-icon').parentElement;
    expect(iconContainer).toHaveClass('absolute', 'inset-y-0', 'left-0', 'pl-3', 'flex', 'items-center', 'pointer-events-none');
  });
});
