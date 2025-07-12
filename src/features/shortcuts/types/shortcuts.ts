export interface KeyboardShortcut {
  key: string;
  description: string;
  action: () => void;
  enabled?: boolean;
}

export interface Command {
  id: string;
  label: string;
  description?: string;
  category: string;
  shortcut?: string;
  action: () => void;
  icon?: string;
  disabled?: boolean;
}

export interface CommandGroup {
  category: string;
  commands: Command[];
}

export interface ShortcutConfig {
  [key: string]: string; // action id -> key combination
}

export interface ShortcutManager {
  register: (shortcuts: KeyboardShortcut[]) => void;
  unregister: (keys: string[]) => void;
  execute: (key: string) => boolean;
  getAll: () => KeyboardShortcut[];
  getByKey: (key: string) => KeyboardShortcut | undefined;
}

export interface BulkOperation {
  id: string;
  label: string;
  description?: string;
  icon?: string;
  action: (selectedIds: string[]) => Promise<void>;
  confirmMessage?: string;
  destructive?: boolean;
}

export interface BulkSelectionState {
  selectedIds: Set<string>;
  isSelecting: boolean;
  totalCount: number;
}

export type ActionCategory = 
  | 'Create'
  | 'Navigation'
  | 'Edit'
  | 'Delete'
  | 'Search'
  | 'Settings'
  | 'Help'
  | 'Bulk'
  | 'Other';

export interface QuickAction extends Command {
  keywords?: string[];
  recent?: boolean;
  frequency?: number;
}

export interface CommandPaletteState {
  isOpen: boolean;
  query: string;
  selectedIndex: number;
  filteredCommands: Command[];
  recentCommands: Command[];
}
