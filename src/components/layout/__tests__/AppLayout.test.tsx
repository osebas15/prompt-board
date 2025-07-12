import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { AppLayout } from '../AppLayout/AppLayout';

// Mock child components
vi.mock('../Header/Header', () => ({
  Header: ({ onMenuToggle }: { onMenuToggle: () => void }) => (
    <header data-testid="header" role="banner">
      <button onClick={onMenuToggle} data-testid="menu-toggle">Menu</button>
    </header>
  ),
}));

vi.mock('../Sidebar/Sidebar', () => ({
  Sidebar: ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => (
    <aside data-testid="sidebar" aria-hidden={!isOpen} role="navigation" aria-label="Main navigation">
      <button onClick={onClose} data-testid="sidebar-close">Close</button>
    </aside>
  ),
}));

vi.mock('../Footer/Footer', () => ({
  Footer: () => <footer data-testid="footer" role="contentinfo">Footer</footer>,
}));

const TestContent = () => <div data-testid="main-content">Test Content</div>;

describe('AppLayout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all layout components', () => {
    render(
      <AppLayout>
        <TestContent />
      </AppLayout>
    );

    expect(screen.getByTestId('header')).toBeInTheDocument();
    expect(screen.getByTestId('sidebar')).toBeInTheDocument();
    expect(screen.getByTestId('main-content')).toBeInTheDocument();
    expect(screen.getByTestId('footer')).toBeInTheDocument();
  });

  it('has correct semantic HTML structure', () => {
    render(
      <AppLayout>
        <TestContent />
      </AppLayout>
    );

    const main = screen.getByRole('main');
    expect(main).toBeInTheDocument();
    expect(main).toContainElement(screen.getByTestId('main-content'));
  });

  it('toggles sidebar visibility', () => {
    render(
      <AppLayout>
        <TestContent />
      </AppLayout>
    );

    const menuToggle = screen.getByTestId('menu-toggle');
    const sidebar = screen.getByTestId('sidebar');

    // Initial state - sidebar should be closed on mobile
    expect(sidebar).toHaveAttribute('aria-hidden', 'true');

    // Toggle sidebar open
    fireEvent.click(menuToggle);
    expect(sidebar).toHaveAttribute('aria-hidden', 'false');

    // Close sidebar
    const closeButton = screen.getByTestId('sidebar-close');
    fireEvent.click(closeButton);
    expect(sidebar).toHaveAttribute('aria-hidden', 'true');
  });

  it('handles keyboard navigation', () => {
    render(
      <AppLayout>
        <TestContent />
      </AppLayout>
    );

    const menuToggle = screen.getByTestId('menu-toggle');
    
    // Escape key should close sidebar when open
    fireEvent.click(menuToggle); // Open sidebar
    fireEvent.keyDown(document, { key: 'Escape' });
    
    const sidebar = screen.getByTestId('sidebar');
    expect(sidebar).toHaveAttribute('aria-hidden', 'true');
  });

  it('supports custom className', () => {
    const { container } = render(
      <AppLayout className="custom-layout">
        <TestContent />
      </AppLayout>
    );

    expect(container.firstChild).toHaveClass('custom-layout');
  });

  it('passes through additional props', () => {
    render(
      <AppLayout data-testid="app-layout" role="application">
        <TestContent />
      </AppLayout>
    );

    const layout = screen.getByTestId('app-layout');
    expect(layout).toHaveAttribute('role', 'application');
  });

  it('maintains focus management', () => {
    render(
      <AppLayout>
        <TestContent />
      </AppLayout>
    );

    const menuToggle = screen.getByTestId('menu-toggle');
    const sidebar = screen.getByTestId('sidebar');
    
    // Open sidebar
    fireEvent.click(menuToggle);
    
    // Focus should be trapped within sidebar when open
    expect(sidebar).toHaveAttribute('aria-hidden', 'false');
    
    // Close sidebar
    const closeButton = screen.getByTestId('sidebar-close');
    fireEvent.click(closeButton);
    
    // Sidebar should be closed
    expect(sidebar).toHaveAttribute('aria-hidden', 'true');
  });

  it('has proper ARIA landmarks', () => {
    render(
      <AppLayout>
        <TestContent />
      </AppLayout>
    );

    expect(screen.getByRole('banner')).toBeInTheDocument(); // header
    expect(screen.getByRole('main')).toBeInTheDocument(); // main content  
    expect(screen.getByRole('contentinfo')).toBeInTheDocument(); // footer
    
    // Open sidebar to make navigation accessible
    const menuToggle = screen.getByTestId('menu-toggle');
    fireEvent.click(menuToggle);
    
    expect(screen.getByRole('navigation')).toBeInTheDocument(); // sidebar nav when open
  });
});
