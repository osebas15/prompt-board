import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useKeyboardShortcuts, type KeyboardShortcut } from '../hooks/useKeyboardShortcuts';
import { useHotkeys } from 'react-hotkeys-hook';

// Mock react-hotkeys-hook
vi.mock('react-hotkeys-hook', () => ({
  useHotkeys: vi.fn(),
}));

describe('useKeyboardShortcuts', () => {
  let mockUseHotkeys: any;

  beforeEach(() => {
    mockUseHotkeys = vi.mocked(useHotkeys);
    vi.clearAllMocks();
  });

  it('should register enabled shortcuts', () => {
    const shortcuts: KeyboardShortcut[] = [
      {
        key: 'cmd+k',
        description: 'Open command palette',
        action: vi.fn(),
        enabled: true,
      },
      {
        key: 'cmd+n',
        description: 'New prompt',
        action: vi.fn(),
        enabled: true,
      },
    ];

    renderHook(() => useKeyboardShortcuts(shortcuts));

    // Hook always calls useHotkeys 10 times (maxShortcuts)
    expect(mockUseHotkeys).toHaveBeenCalledTimes(10);
    
    // First two calls should be with the actual shortcuts and enabled: true
    expect(mockUseHotkeys).toHaveBeenNthCalledWith(1,
      'cmd+k',
      shortcuts[0].action,
      expect.objectContaining({
        enableOnFormTags: ['INPUT', 'TEXTAREA', 'SELECT'],
        enabled: true,
      }),
      expect.any(Array)
    );
    expect(mockUseHotkeys).toHaveBeenNthCalledWith(2,
      'cmd+n',
      shortcuts[1].action,
      expect.objectContaining({
        enableOnFormTags: ['INPUT', 'TEXTAREA', 'SELECT'],
        enabled: true,
      }),
      expect.any(Array)
    );
    
    // Remaining calls should be disabled
    for (let i = 3; i <= 10; i++) {
      expect(mockUseHotkeys).toHaveBeenNthCalledWith(i,
        '',
        expect.any(Function),
        expect.objectContaining({
          enabled: false,
        }),
        expect.any(Array)
      );
    }
  });

  it('should not register disabled shortcuts', () => {
    const shortcuts: KeyboardShortcut[] = [
      {
        key: 'cmd+k',
        description: 'Open command palette',
        action: vi.fn(),
        enabled: true,
      },
      {
        key: 'cmd+n',
        description: 'New prompt',
        action: vi.fn(),
        enabled: false,
      },
    ];

    renderHook(() => useKeyboardShortcuts(shortcuts));

    // Hook always calls useHotkeys 10 times (maxShortcuts)
    expect(mockUseHotkeys).toHaveBeenCalledTimes(10);
    
    // First call should be with the enabled shortcut
    expect(mockUseHotkeys).toHaveBeenNthCalledWith(1,
      'cmd+k',
      shortcuts[0].action,
      expect.objectContaining({
        enableOnFormTags: ['INPUT', 'TEXTAREA', 'SELECT'],
        enabled: true,
      }),
      expect.any(Array)
    );
    
    // Remaining calls should be disabled (no more enabled shortcuts)
    for (let i = 2; i <= 10; i++) {
      expect(mockUseHotkeys).toHaveBeenNthCalledWith(i,
        '',
        expect.any(Function),
        expect.objectContaining({
          enabled: false,
        }),
        expect.any(Array)
      );
    }
  });

  it('should return shortcuts list', () => {
    const shortcuts: KeyboardShortcut[] = [
      {
        key: 'cmd+k',
        description: 'Open command palette',
        action: vi.fn(),
      },
      {
        key: 'cmd+n',
        description: 'New prompt',
        action: vi.fn(),
      },
    ];

    const { result } = renderHook(() => useKeyboardShortcuts(shortcuts));

    expect(result.current.shortcuts).toEqual([
      { key: 'cmd+k', description: 'Open command palette' },
      { key: 'cmd+n', description: 'New prompt' },
    ]);
  });

  it('should treat undefined enabled as true', () => {
    const shortcuts: KeyboardShortcut[] = [
      {
        key: 'cmd+k',
        description: 'Open command palette',
        action: vi.fn(),
        // enabled is undefined
      },
    ];

    renderHook(() => useKeyboardShortcuts(shortcuts));

    // Hook always calls useHotkeys 10 times (maxShortcuts)
    expect(mockUseHotkeys).toHaveBeenCalledTimes(10);
    
    // First call should be with the shortcut (enabled defaults to true)
    expect(mockUseHotkeys).toHaveBeenNthCalledWith(1,
      'cmd+k',
      shortcuts[0].action,
      expect.objectContaining({
        enableOnFormTags: ['INPUT', 'TEXTAREA', 'SELECT'],
        enabled: true,
      }),
      expect.any(Array)
    );
  });

  it('should handle empty shortcuts array', () => {
    const { result } = renderHook(() => useKeyboardShortcuts([]));

    // Hook always calls useHotkeys 10 times (maxShortcuts), but all disabled
    expect(mockUseHotkeys).toHaveBeenCalledTimes(10);
    
    // All calls should be disabled since no shortcuts provided
    for (let i = 1; i <= 10; i++) {
      expect(mockUseHotkeys).toHaveBeenNthCalledWith(i,
        '',
        expect.any(Function),
        expect.objectContaining({
          enabled: false,
        }),
        expect.any(Array)
      );
    }
    
    expect(result.current.shortcuts).toEqual([]);
  });

  it('should call action when shortcut is triggered', () => {
    const action = vi.fn();
    const shortcuts: KeyboardShortcut[] = [
      {
        key: 'cmd+k',
        description: 'Open command palette',
        action,
      },
    ];

    renderHook(() => useKeyboardShortcuts(shortcuts));

    // Get the action function passed to useHotkeys
    const hotkeyAction = mockUseHotkeys.mock.calls[0][1];
    
    act(() => {
      hotkeyAction();
    });

    expect(action).toHaveBeenCalledTimes(1);
  });
});
