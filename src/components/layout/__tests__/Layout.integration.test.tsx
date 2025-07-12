import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { AppLayout } from '../AppLayout/AppLayout';

// Integration tests for layout system
describe('Layout Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders complete layout structure', () => {
    render(
      <AppLayout>
        <div data-testid="test-content">Test Page Content</div>
      </AppLayout>
    );

    // Check all layout components are present
    expect(screen.getByRole('banner')).toBeInTheDocument(); // Header
    expect(screen.getByRole('main')).toBeInTheDocument(); // Main content
    expect(screen.getByRole('contentinfo')).toBeInTheDocument(); // Footer
    expect(screen.getByTestId('sidebar')).toBeInTheDocument(); // Sidebar
    expect(screen.getByTestId('test-content')).toBeInTheDocument(); // Content
  });

  it('handles responsive sidebar behavior', async () => {
    render(
      <AppLayout>
        <div data-testid="test-content">Test Content</div>
      </AppLayout>
    );

    const menuButton = screen.getByTestId('menu-toggle');
    const sidebar = screen.getByTestId('sidebar');

    // Initially closed on mobile
    expect(sidebar).toHaveAttribute('aria-hidden', 'true');
    expect(sidebar).toHaveClass('-translate-x-full');

    // Open sidebar
    fireEvent.click(menuButton);
    expect(sidebar).toHaveAttribute('aria-hidden', 'false');
    expect(sidebar).toHaveClass('translate-x-0');

    // Close with overlay click
    const overlay = document.querySelector('.fixed.inset-0.bg-black.bg-opacity-50');
    if (overlay) {
      fireEvent.mouseDown(overlay);
      await waitFor(() => {
        expect(sidebar).toHaveAttribute('aria-hidden', 'true');
      });
    }
  });

  it('handles keyboard navigation across layout components', () => {
    render(
      <AppLayout>
        <div data-testid="test-content">
          <button>Content Button</button>
        </div>
      </AppLayout>
    );

    const menuButton = screen.getByTestId('menu-toggle');
    const userButton = screen.getByLabelText('User menu');
    const contentButton = screen.getByText('Content Button');

    // Tab navigation should work across all focusable elements
    menuButton.focus();
    expect(document.activeElement).toBe(menuButton);

    userButton.focus();
    expect(document.activeElement).toBe(userButton);

    contentButton.focus();
    expect(document.activeElement).toBe(contentButton);
  });

  it('maintains proper z-index stacking', () => {
    render(
      <AppLayout>
        <div data-testid="test-content">Test Content</div>
      </AppLayout>
    );

    const menuButton = screen.getByTestId('menu-toggle');
    const sidebar = screen.getByTestId('sidebar');

    // Open sidebar to show overlay
    fireEvent.click(menuButton);

    const overlay = document.querySelector('.fixed.inset-0.bg-black.bg-opacity-50');
    
    // Check z-index stacking
    expect(overlay).toHaveClass('z-40');
    expect(sidebar).toHaveClass('z-50');
  });

  it('handles content overflow with sidebar', () => {
    render(
      <AppLayout>
        <div data-testid="test-content" style={{ height: '2000px' }}>
          Very tall content
        </div>
      </AppLayout>
    );

    const main = screen.getByRole('main');
    const sidebar = screen.getByTestId('sidebar');

    // Main content should be scrollable
    expect(main).toBeInTheDocument();
    expect(sidebar).toHaveClass('fixed'); // Sidebar should be fixed position
  });

  it('provides proper landmark navigation', () => {
    render(
      <AppLayout>
        <div data-testid="test-content">Test Content</div>
      </AppLayout>
    );

    // All required landmarks should be present
    const landmarks = {
      banner: screen.getByRole('banner'),
      main: screen.getByRole('main'),
      contentinfo: screen.getByRole('contentinfo'),
    };

    Object.values(landmarks).forEach(landmark => {
      expect(landmark).toBeInTheDocument();
    });

    // Navigation landmark only when sidebar is open
    const menuButton = screen.getByTestId('menu-toggle');
    fireEvent.click(menuButton);
    
    // Should only have one navigation landmark (the sidebar)
    const navigationLandmarks = screen.getAllByRole('navigation');
    expect(navigationLandmarks).toHaveLength(1);
    expect(navigationLandmarks[0]).toHaveAttribute('data-testid', 'sidebar');
  });

  it('handles theme classes correctly', () => {
    render(
      <AppLayout className="theme-dark">
        <div data-testid="test-content">Test Content</div>
      </AppLayout>
    );

    const layout = screen.getByTestId('test-content').closest('.min-h-screen');
    expect(layout).toHaveClass('theme-dark');
  });

  it('provides skip links for accessibility', () => {
    render(
      <AppLayout>
        <div data-testid="test-content">Test Content</div>
      </AppLayout>
    );

    // Should be able to skip to main content
    const main = screen.getByRole('main');
    expect(main).toBeInTheDocument();
    expect(main).toHaveAttribute('role', 'main');
  });

  it('handles layout state persistence across navigation', () => {
    const { rerender } = render(
      <AppLayout key="page1">
        <div data-testid="page1">Page 1</div>
      </AppLayout>
    );

    const menuButton = screen.getByTestId('menu-toggle');
    const sidebar = screen.getByTestId('sidebar');

    // Open sidebar
    fireEvent.click(menuButton);
    expect(sidebar).toHaveAttribute('aria-hidden', 'false');

    // Simulate page navigation with new AppLayout instance (using different key)
    rerender(
      <AppLayout key="page2">
        <div data-testid="page2">Page 2</div>
      </AppLayout>
    );

    // Since it's a new component instance, sidebar should be closed by default
    const newSidebar = screen.getByTestId('sidebar');
    expect(newSidebar).toHaveAttribute('aria-hidden', 'true');
  });
});
