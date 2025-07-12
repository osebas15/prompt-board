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
      console.log('Command palette');
    },
  },
  {
    key: 'ctrl+n,cmd+n',
    description: 'Create new prompt',
    action: () => {
      console.log('New prompt');
    },
  },
  {
    key: 'ctrl+shift+n,cmd+shift+n',
    description: 'Create new context',
    action: () => {
      console.log('New context');
    },
  },
  {
    key: 'ctrl+/,cmd+/',
    description: 'Show keyboard shortcuts',
    action: () => {
      console.log('Show shortcuts');
    },
  },
  {
    key: 'ctrl+shift+p,cmd+shift+p',
    description: 'Open prompt library',
    action: () => {
      console.log('Prompt library');
    },
  },
];
