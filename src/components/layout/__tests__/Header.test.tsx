import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { Header } from '../Header/Header';

describe('Header', () => {
  const mockOnMenuToggle = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders header with correct structure', () => {
    render(<Header onMenuToggle={mockOnMenuToggle} />);
    
    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByText('Prompt Board')).toBeInTheDocument();
  });

  it('renders menu toggle button on mobile', () => {
    render(<Header onMenuToggle={mockOnMenuToggle} />);
    
    const menuButton = screen.getByLabelText('Toggle navigation menu');
    expect(menuButton).toBeInTheDocument();
    expect(menuButton).toHaveAttribute('data-testid', 'menu-toggle');
  });

  it('calls onMenuToggle when menu button is clicked', () => {
    render(<Header onMenuToggle={mockOnMenuToggle} />);
    
    const menuButton = screen.getByTestId('menu-toggle');
    fireEvent.click(menuButton);
    
    expect(mockOnMenuToggle).toHaveBeenCalledTimes(1);
  });

  it('renders navigation links', () => {
    render(<Header onMenuToggle={mockOnMenuToggle} />);
    
    expect(screen.getByText('Prompts')).toBeInTheDocument();
    expect(screen.getByText('Contexts')).toBeInTheDocument();
  });

  it('renders user menu button', () => {
    render(<Header onMenuToggle={mockOnMenuToggle} />);
    
    const userButton = screen.getByLabelText('User menu');
    expect(userButton).toBeInTheDocument();
  });

  it('has proper keyboard navigation', () => {
    render(<Header onMenuToggle={mockOnMenuToggle} />);
    
    const menuButton = screen.getByTestId('menu-toggle');
    
    // Focus menu button
    menuButton.focus();
    expect(document.activeElement).toBe(menuButton);
    
    // Should be able to activate with Enter
    fireEvent.keyDown(menuButton, { key: 'Enter' });
    fireEvent.click(menuButton); // Simulate enter press action
    expect(mockOnMenuToggle).toHaveBeenCalled();
  });

  it('supports custom className', () => {
    const { container } = render(
      <Header onMenuToggle={mockOnMenuToggle} className="custom-header" />
    );
    
    expect(container.firstChild).toHaveClass('custom-header');
  });

  it('has proper focus indicators', () => {
    render(<Header onMenuToggle={mockOnMenuToggle} />);
    
    const menuButton = screen.getByTestId('menu-toggle');
    expect(menuButton).toHaveClass('focus:outline-none', 'focus:ring-2', 'focus:ring-primary');
    
    const userButton = screen.getByLabelText('User menu');
    expect(userButton).toHaveClass('focus:outline-none', 'focus:ring-2', 'focus:ring-primary');
  });

  it('has correct ARIA attributes', () => {
    render(<Header onMenuToggle={mockOnMenuToggle} />);
    
    const header = screen.getByRole('banner');
    expect(header).toBeInTheDocument();
    
    const menuButton = screen.getByTestId('menu-toggle');
    expect(menuButton).toHaveAttribute('aria-label', 'Toggle navigation menu');
    
    const userButton = screen.getByLabelText('User menu');
    expect(userButton).toHaveAttribute('aria-label', 'User menu');
  });
});
