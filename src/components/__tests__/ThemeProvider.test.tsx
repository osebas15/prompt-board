import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { ThemeProvider } from '../providers/ThemeProvider';
import { useTheme } from '../providers/useTheme';

// Test component that uses the theme hook
const TestComponent = () => {
  const { theme, setTheme, toggleTheme, isDark } = useTheme();
  
  return (
    <div>
      <div data-testid="current-theme">{theme}</div>
      <div data-testid="is-dark">{isDark ? 'dark' : 'light'}</div>
      <button onClick={() => setTheme('dark')} data-testid="set-dark">
        Set Dark
      </button>
      <button onClick={() => setTheme('light')} data-testid="set-light">
        Set Light
      </button>
      <button onClick={toggleTheme} data-testid="toggle-theme">
        Toggle Theme
      </button>
    </div>
  );
};

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock matchMedia
const matchMediaMock = vi.fn((query) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
}));

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: matchMediaMock,
});

describe('ThemeProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    matchMediaMock.mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
    
    // Clear any existing theme classes
    document.documentElement.classList.remove('light', 'dark');
  });

  it('provides default theme context', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    expect(screen.getByTestId('current-theme')).toHaveTextContent('light');
    expect(screen.getByTestId('is-dark')).toHaveTextContent('light');
  });

  it('uses custom default theme', () => {
    render(
      <ThemeProvider defaultTheme="dark">
        <TestComponent />
      </ThemeProvider>
    );

    expect(screen.getByTestId('current-theme')).toHaveTextContent('dark');
    expect(screen.getByTestId('is-dark')).toHaveTextContent('dark');
  });

  it('loads theme from localStorage', () => {
    localStorageMock.getItem.mockReturnValue('dark');
    
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    expect(screen.getByTestId('current-theme')).toHaveTextContent('dark');
    expect(localStorageMock.getItem).toHaveBeenCalledWith('prompt-board-theme');
  });

  it('uses custom storage key', () => {
    localStorageMock.getItem.mockReturnValue('dark');
    
    render(
      <ThemeProvider storageKey="custom-theme-key">
        <TestComponent />
      </ThemeProvider>
    );

    expect(localStorageMock.getItem).toHaveBeenCalledWith('custom-theme-key');
  });

  it('detects system preference when no stored theme', () => {
    matchMediaMock.mockImplementation((query) => ({
      matches: query === '(prefers-color-scheme: dark)',
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    expect(screen.getByTestId('current-theme')).toHaveTextContent('dark');
  });

  it('allows theme switching', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    // Initial state
    expect(screen.getByTestId('current-theme')).toHaveTextContent('light');

    // Switch to dark
    fireEvent.click(screen.getByTestId('set-dark'));
    expect(screen.getByTestId('current-theme')).toHaveTextContent('dark');
    expect(screen.getByTestId('is-dark')).toHaveTextContent('dark');

    // Switch to light
    fireEvent.click(screen.getByTestId('set-light'));
    expect(screen.getByTestId('current-theme')).toHaveTextContent('light');
    expect(screen.getByTestId('is-dark')).toHaveTextContent('light');
  });

  it('toggles between themes', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    // Initial state (light)
    expect(screen.getByTestId('current-theme')).toHaveTextContent('light');

    // Toggle to dark
    fireEvent.click(screen.getByTestId('toggle-theme'));
    expect(screen.getByTestId('current-theme')).toHaveTextContent('dark');

    // Toggle back to light
    fireEvent.click(screen.getByTestId('toggle-theme'));
    expect(screen.getByTestId('current-theme')).toHaveTextContent('light');
  });

  it('saves theme to localStorage when changed', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    fireEvent.click(screen.getByTestId('set-dark'));
    
    expect(localStorageMock.setItem).toHaveBeenCalledWith('prompt-board-theme', 'dark');
  });

  it('applies theme classes to document element', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    // Should apply light theme class
    expect(document.documentElement.classList.contains('light')).toBe(true);

    // Switch to dark theme
    fireEvent.click(screen.getByTestId('set-dark'));
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(document.documentElement.classList.contains('light')).toBe(false);
  });

  it('applies CSS custom properties', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    const root = document.documentElement;
    
    // Check that some CSS variables are set
    expect(root.style.getPropertyValue('--color-primary')).toBeTruthy();
    expect(root.style.getPropertyValue('--color-background')).toBeTruthy();
    expect(root.style.getPropertyValue('--color-text-primary')).toBeTruthy();
  });

  it('throws error when useTheme is used outside provider', () => {
    const TestComponentWithoutProvider = () => {
      useTheme();
      return <div>Test</div>;
    };

    // Suppress console error for this test
    const originalError = console.error;
    console.error = vi.fn();

    expect(() => render(<TestComponentWithoutProvider />)).toThrow(
      'useTheme must be used within a ThemeProvider'
    );

    console.error = originalError;
  });

  it('listens for system theme changes', () => {
    const mockAddEventListener = vi.fn();
    const mockRemoveEventListener = vi.fn();
    
    matchMediaMock.mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: mockAddEventListener,
      removeEventListener: mockRemoveEventListener,
      dispatchEvent: vi.fn(),
    }));

    const { unmount } = render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    expect(mockAddEventListener).toHaveBeenCalledWith('change', expect.any(Function));

    unmount();
    expect(mockRemoveEventListener).toHaveBeenCalledWith('change', expect.any(Function));
  });

  it('handles invalid stored theme gracefully', () => {
    localStorageMock.getItem.mockReturnValue('invalid-theme');
    
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    // Should fall back to default theme
    expect(screen.getByTestId('current-theme')).toHaveTextContent('light');
  });

  it('applies typography CSS variables', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    const root = document.documentElement;
    
    expect(root.style.getPropertyValue('--font-size-base')).toBeTruthy();
    expect(root.style.getPropertyValue('--font-weight-normal')).toBeTruthy();
    expect(root.style.getPropertyValue('--line-height-normal')).toBeTruthy();
  });

  it('applies spacing and other design token CSS variables', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    const root = document.documentElement;
    
    expect(root.style.getPropertyValue('--spacing-md')).toBeTruthy();
    expect(root.style.getPropertyValue('--border-radius-md')).toBeTruthy();
    expect(root.style.getPropertyValue('--shadow-md')).toBeTruthy();
  });
});
