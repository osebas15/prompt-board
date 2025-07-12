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

    expect(mockUseHotkeys).toHaveBeenCalledTimes(2);
    expect(mockUseHotkeys).toHaveBeenCalledWith(
      'cmd+k',
      shortcuts[0].action,
      expect.objectContaining({
        enableOnFormTags: ['INPUT', 'TEXTAREA', 'SELECT'],
      })
    );
    expect(mockUseHotkeys).toHaveBeenCalledWith(
      'cmd+n',
      shortcuts[1].action,
      expect.objectContaining({
        enableOnFormTags: ['INPUT', 'TEXTAREA', 'SELECT'],
      })
    );
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

    expect(mockUseHotkeys).toHaveBeenCalledTimes(1);
    expect(mockUseHotkeys).toHaveBeenCalledWith(
      'cmd+k',
      shortcuts[0].action,
      expect.any(Object)
    );
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

    expect(mockUseHotkeys).toHaveBeenCalledTimes(1);
  });

  it('should handle empty shortcuts array', () => {
    const { result } = renderHook(() => useKeyboardShortcuts([]));

    expect(mockUseHotkeys).not.toHaveBeenCalled();
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
