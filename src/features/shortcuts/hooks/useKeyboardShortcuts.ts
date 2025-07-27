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

  // Register each shortcut individually with fixed number of hook calls
  const maxShortcuts = 10; // Set a reasonable maximum
  
  for (let i = 0; i < maxShortcuts; i++) {
    const shortcut = enabledShortcuts[i];
    useHotkeys(
      shortcut?.key || '',
      shortcut?.action || (() => {}),
      {
        enableOnFormTags: ['INPUT', 'TEXTAREA', 'SELECT'],
        enabled: !!shortcut,
      },
      [shortcut?.key, shortcut?.action]
    );
  }

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
