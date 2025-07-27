import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ContextSwitcher } from '../ContextSwitcher';
import { useContextStore } from '../../stores/contextStore';
import type { Context } from '../../types';

// Mock the context store
vi.mock('../../stores/contextStore');

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  ChevronDown: () => <div data-testid="chevron-down" />,
  Folder: () => <div data-testid="folder-icon" />,
  Check: () => <div data-testid="check-icon" />
}));

describe('ContextSwitcher', () => {
  let mockStore: any;
  let mockContexts: Context[];

  beforeEach(() => {
    vi.clearAllMocks();

    mockContexts = [
      {
        id: 'context-1',
        user_id: 'user-123',
        name: 'Work Context',
        description: 'Work-related prompts',
        color: '#3B82F6',
        icon: 'briefcase',
        settings: {},
        is_default: true,
        is_archived: false,
        sort_order: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'context-2',
        user_id: 'user-123',
        name: 'Personal Context',
        description: 'Personal prompts',
        color: '#10B981',
        icon: 'user',
        settings: {},
        is_default: false,
        is_archived: false,
        sort_order: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'context-3',
        user_id: 'user-123',
        name: 'Learning Context',
        description: 'Educational content',
        color: '#8B5CF6',
        icon: 'book',
        settings: {},
        is_default: false,
        is_archived: false,
        sort_order: 2,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];

    mockStore = {
      currentContext: mockContexts[0],
      contexts: mockContexts,
      loading: false,
      error: null,
      setCurrentContext: vi.fn(),
      setContexts: vi.fn(),
      addContext: vi.fn(),
      updateContext: vi.fn(),
      removeContext: vi.fn(),
      setLoading: vi.fn(),
      setError: vi.fn(),
      getContextById: vi.fn((id: string) => mockContexts.find(c => c.id === id)),
      getDefaultContext: vi.fn(() => mockContexts[0]),
      getActiveContexts: vi.fn().mockReturnValue(mockContexts)
    };

    vi.mocked(useContextStore).mockReturnValue(mockStore);
  });

  describe('rendering', () => {
    it('should display current context name', () => {
      render(<ContextSwitcher />);
      
      expect(screen.getByText('Work Context')).toBeInTheDocument();
    });

    it('should show context color indicator', () => {
      render(<ContextSwitcher />);
      
      const colorIndicator = screen.getByTestId('context-color-indicator');
      expect(colorIndicator).toHaveStyle('background-color: rgb(59, 130, 246)'); // #3B82F6
    });

    it('should display context icon', () => {
      render(<ContextSwitcher />);
      
      expect(screen.getByTestId('folder-icon')).toBeInTheDocument();
    });

    it('should handle empty context gracefully', () => {
      mockStore.currentContext = null;
      vi.mocked(useContextStore).mockReturnValue(mockStore);

      render(<ContextSwitcher />);
      
      expect(screen.getByText('No Context Selected')).toBeInTheDocument();
    });
  });

  describe('context selection', () => {
    it('should open context dropdown on click', async () => {
      const user = userEvent.setup();
      render(<ContextSwitcher />);
      
      const switcherButton = screen.getByRole('button', { name: /context switcher/i });
      await user.click(switcherButton);
      
      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });

    it('should list available contexts', async () => {
      const user = userEvent.setup();
      render(<ContextSwitcher />);
      
      const switcherButton = screen.getByRole('button');
      await user.click(switcherButton);
      
      expect(screen.getByText('Work Context')).toBeInTheDocument();
      expect(screen.getByText('Personal Context')).toBeInTheDocument();
      expect(screen.getByText('Learning Context')).toBeInTheDocument();
    });

    it('should highlight current context', async () => {
      const user = userEvent.setup();
      render(<ContextSwitcher />);
      
      const switcherButton = screen.getByRole('button');
      await user.click(switcherButton);
      
      const currentContextOption = screen.getByRole('option', { name: /work context/i });
      expect(currentContextOption).toHaveAttribute('aria-selected', 'true');
      expect(screen.getByTestId('check-icon')).toBeInTheDocument();
    });

    it('should switch context on selection', async () => {
      const user = userEvent.setup();
      render(<ContextSwitcher />);
      
      const switcherButton = screen.getByRole('button');
      await user.click(switcherButton);
      
      const personalContextOption = screen.getByRole('option', { name: /personal context/i });
      await user.click(personalContextOption);
      
      expect(mockStore.setCurrentContext).toHaveBeenCalledWith(mockContexts[1]);
    });

    it('should close dropdown after selection', async () => {
      const user = userEvent.setup();
      render(<ContextSwitcher />);
      
      const switcherButton = screen.getByRole('button');
      await user.click(switcherButton);
      
      const personalContextOption = screen.getByRole('option', { name: /personal context/i });
      await user.click(personalContextOption);
      
      await waitFor(() => {
        expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
      });
    });
  });

  describe('keyboard navigation', () => {
    it('should support arrow key navigation', async () => {
      const user = userEvent.setup();
      render(<ContextSwitcher />);
      
      const switcherButton = screen.getByRole('button');
      await user.click(switcherButton);
      
      // Focus should start on the current context
      const workContextOption = screen.getByRole('option', { name: /work context/i });
      expect(workContextOption).toHaveFocus();
      
      // Arrow down should move to next option
      await user.keyboard('{ArrowDown}');
      const personalContextOption = screen.getByRole('option', { name: /personal context/i });
      expect(personalContextOption).toHaveFocus();
      
      // Arrow up should move back
      await user.keyboard('{ArrowUp}');
      expect(workContextOption).toHaveFocus();
    });

    it('should select context with Enter key', async () => {
      const user = userEvent.setup();
      render(<ContextSwitcher />);
      
      const switcherButton = screen.getByRole('button');
      await user.click(switcherButton);
      
      // Navigate to personal context
      await user.keyboard('{ArrowDown}');
      await user.keyboard('{Enter}');
      
      expect(mockStore.setCurrentContext).toHaveBeenCalledWith(mockContexts[1]);
    });

    it('should close dropdown with Escape key', async () => {
      const user = userEvent.setup();
      render(<ContextSwitcher />);
      
      const switcherButton = screen.getByRole('button');
      await user.click(switcherButton);
      
      await user.keyboard('{Escape}');
      
      await waitFor(() => {
        expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
      });
    });

    it('should support search/filter with typing', async () => {
      const user = userEvent.setup();
      render(<ContextSwitcher />);
      
      const switcherButton = screen.getByRole('button');
      await user.click(switcherButton);
      
      // Type to filter contexts
      await user.keyboard('personal');
      
      // Should show only matching contexts
      expect(screen.getByText('Personal Context')).toBeInTheDocument();
      expect(screen.queryByText('Work Context')).not.toBeInTheDocument();
      expect(screen.queryByText('Learning Context')).not.toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<ContextSwitcher />);
      
      const switcherButton = screen.getByRole('button');
      expect(switcherButton).toHaveAttribute('aria-haspopup', 'listbox');
      expect(switcherButton).toHaveAttribute('aria-expanded', 'false');
    });

    it('should update ARIA attributes when dropdown is open', async () => {
      const user = userEvent.setup();
      render(<ContextSwitcher />);
      
      const switcherButton = screen.getByRole('button');
      await user.click(switcherButton);
      
      expect(switcherButton).toHaveAttribute('aria-expanded', 'true');
    });

    it('should have proper focus management', async () => {
      const user = userEvent.setup();
      render(<ContextSwitcher />);
      
      const switcherButton = screen.getByRole('button');
      await user.click(switcherButton);
      
      // Current context should be focused when dropdown opens
      const currentContextOption = screen.getByRole('option', { name: /work context/i });
      expect(currentContextOption).toHaveFocus();
    });

    it('should return focus to trigger after selection', async () => {
      const user = userEvent.setup();
      render(<ContextSwitcher />);
      
      const switcherButton = screen.getByRole('button');
      await user.click(switcherButton);
      
      const personalContextOption = screen.getByRole('option', { name: /personal context/i });
      await user.click(personalContextOption);
      
      await waitFor(() => {
        expect(switcherButton).toHaveFocus();
      });
    });
  });

  describe('loading and error states', () => {
    it('should show loading state', () => {
      mockStore.loading = true;
      vi.mocked(useContextStore).mockReturnValue(mockStore);

      render(<ContextSwitcher />);
      
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('should show error state', () => {
      mockStore.error = 'Failed to load contexts';
      vi.mocked(useContextStore).mockReturnValue(mockStore);

      render(<ContextSwitcher />);
      
      expect(screen.getByText('Error loading contexts')).toBeInTheDocument();
    });

    it('should be disabled during loading', () => {
      mockStore.loading = true;
      vi.mocked(useContextStore).mockReturnValue(mockStore);

      render(<ContextSwitcher />);
      
      const switcherButton = screen.getByRole('button');
      expect(switcherButton).toBeDisabled();
    });
  });

  describe('responsive behavior', () => {
    it('should adapt to mobile viewport', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375
      });

      render(<ContextSwitcher />);
      
      const switcher = screen.getByTestId('context-switcher');
      expect(switcher).toHaveClass('mobile-layout');
    });

    it('should show full context name on desktop', () => {
      // Mock desktop viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024
      });

      render(<ContextSwitcher />);
      
      expect(screen.getByText('Work Context')).toBeInTheDocument();
    });

    it('should show abbreviated name on mobile', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375
      });

      render(<ContextSwitcher />);
      
      // Should show first letter or icon only
      const switcher = screen.getByTestId('context-switcher');
      expect(switcher).toHaveClass('mobile-compact');
    });
  });
});
