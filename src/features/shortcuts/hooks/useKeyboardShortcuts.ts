import { useHotkeys } from 'react-hotkeys-hook';
import { useCallback } from 'react';

export interface KeyboardShortcut {
  key: string;
  description: string;
  action: () => void;
  enabled?: boolean;
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  const enabledShortcuts = shortcuts.filter(s => s.enabled !== false);

  enabledShortcuts.forEach(({ key, action }) => {
    useHotkeys(key, action, {
      enableOnFormTags: ['INPUT', 'TEXTAREA', 'SELECT'],
    });
  });

  const getShortcutsList = useCallback(() => {
    return enabledShortcuts.map(({ key, description }) => ({
      key,
      description,
    }));
  }, [enabledShortcuts]);

  return { shortcuts: getShortcutsList() };
}

// Global shortcuts configuration
export const globalShortcuts: KeyboardShortcut[] = [
  {
    key: 'ctrl+k,cmd+k',
    description: 'Open command palette',
    action: () => {
      // Will be implemented with command palette component
      // Command palette action
    },
  },
  {
    key: 'ctrl+n,cmd+n',
    description: 'Create new prompt',
    action: () => {
      // New prompt action
    },
  },
  {
    key: 'ctrl+shift+n,cmd+shift+n',
    description: 'Create new context',
    action: () => {
      // New context action
    },
  },
  {
    key: 'ctrl+/,cmd+/',
    description: 'Show keyboard shortcuts',
    action: () => {
      // Show shortcuts action
    },
  },
  {
    key: 'ctrl+shift+p,cmd+shift+p',
    description: 'Open prompt library',
    action: () => {
      // Prompt library action
    },
  },
];
