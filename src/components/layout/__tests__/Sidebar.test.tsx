import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { Sidebar } from '../Sidebar/Sidebar';

describe('Sidebar', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders sidebar with correct structure when closed', () => {
    render(<Sidebar isOpen={false} onClose={mockOnClose} />);
    
    const sidebar = screen.getByTestId('sidebar');
    expect(sidebar).toBeInTheDocument();
    expect(sidebar).toHaveAttribute('aria-hidden', 'true');
    expect(sidebar).toHaveClass('-translate-x-full');
  });

  it('renders sidebar with correct structure when open', () => {
    render(<Sidebar isOpen={true} onClose={mockOnClose} />);
    
    const sidebar = screen.getByTestId('sidebar');
    expect(sidebar).toHaveAttribute('aria-hidden', 'false');
    expect(sidebar).toHaveClass('translate-x-0');
  });

  it('renders mobile overlay when open', () => {
    const { container } = render(<Sidebar isOpen={true} onClose={mockOnClose} />);
    
    const overlay = container.querySelector('.fixed.inset-0.bg-black.bg-opacity-50');
    expect(overlay).toBeInTheDocument();
  });

  it('does not render mobile overlay when closed', () => {
    const { container } = render(<Sidebar isOpen={false} onClose={mockOnClose} />);
    
    const overlay = container.querySelector('.fixed.inset-0.bg-black.bg-opacity-50');
    expect(overlay).not.toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    render(<Sidebar isOpen={true} onClose={mockOnClose} />);
    
    const closeButton = screen.getByTestId('sidebar-close');
    fireEvent.click(closeButton);
    
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when overlay is clicked', () => {
    const { container } = render(<Sidebar isOpen={true} onClose={mockOnClose} />);
    
    const overlay = container.querySelector('.fixed.inset-0.bg-black.bg-opacity-50');
    fireEvent.click(overlay!);
    
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('renders navigation links', () => {
    render(<Sidebar isOpen={true} onClose={mockOnClose} />);
    
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Prompts')).toBeInTheDocument();
    expect(screen.getByText('Contexts')).toBeInTheDocument();
    expect(screen.getByText('Categories')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('has proper navigation role and labels', () => {
    render(<Sidebar isOpen={true} onClose={mockOnClose} />);
    
    const sidebar = screen.getByRole('navigation');
    expect(sidebar).toHaveAttribute('aria-label', 'Main navigation');
  });

  it('has correct responsive classes', () => {
    render(<Sidebar isOpen={false} onClose={mockOnClose} />);
    
    const sidebar = screen.getByTestId('sidebar');
    expect(sidebar).toHaveClass('lg:translate-x-0', 'lg:static', 'lg:z-auto');
  });

  it('has proper focus management for close button', () => {
    render(<Sidebar isOpen={true} onClose={mockOnClose} />);
    
    const closeButton = screen.getByTestId('sidebar-close');
    expect(closeButton).toHaveAttribute('aria-label', 'Close navigation menu');
    expect(closeButton).toHaveClass('focus:outline-none', 'focus:ring-2', 'focus:ring-primary');
  });

  it('supports custom className', () => {
    render(<Sidebar isOpen={true} onClose={mockOnClose} className="custom-sidebar" />);
    
    const sidebar = screen.getByTestId('sidebar');
    expect(sidebar).toHaveClass('custom-sidebar');
  });

  it('navigation links have proper hover states', () => {
    render(<Sidebar isOpen={true} onClose={mockOnClose} />);
    
    const dashboardLink = screen.getByText('Dashboard').closest('a');
    expect(dashboardLink).toHaveClass('hover:text-text-primary', 'hover:bg-background');
  });

  it('has proper semantic structure', () => {
    render(<Sidebar isOpen={true} onClose={mockOnClose} />);
    
    // Should have a nav element inside
    const nav = screen.getByRole('navigation');
    expect(nav).toBeInTheDocument();
    
    // Should have proper heading
    expect(screen.getByText('Navigation')).toBeInTheDocument();
  });
});
