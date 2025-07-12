import { useState } from 'react';
import { MoreVertical, Tag, Copy, Share2, Trash2, Archive, Download } from 'lucide-react';

interface BulkActionMenuProps {
  selectedCount: number;
  onBulkTag: () => void;
  onBulkDuplicate: () => void;
  onBulkShare: () => void;
  onBulkDelete: () => void;
  onBulkArchive: () => void;
  onBulkExport: () => void;
  disabled?: boolean;
}

export function BulkActionMenu({
  selectedCount,
  onBulkTag,
  onBulkDuplicate,
  onBulkShare,
  onBulkDelete,
  onBulkArchive,
  onBulkExport,
  disabled = false,
}: BulkActionMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (selectedCount === 0) {
    return null;
  }

  const actions = [
    {
      label: 'Add Tags',
      icon: Tag,
      onClick: onBulkTag,
      shortcut: 'Cmd+T',
      variant: 'default' as const,
    },
    {
      label: 'Duplicate',
      icon: Copy,
      onClick: onBulkDuplicate,
      shortcut: 'Cmd+D',
      variant: 'default' as const,
    },
    {
      label: 'Share',
      icon: Share2,
      onClick: onBulkShare,
      shortcut: 'Cmd+Shift+S',
      variant: 'default' as const,
    },
    {
      label: 'Export',
      icon: Download,
      onClick: onBulkExport,
      shortcut: 'Cmd+E',
      variant: 'default' as const,
    },
    {
      label: 'Archive',
      icon: Archive,
      onClick: onBulkArchive,
      shortcut: 'Cmd+Shift+A',
      variant: 'warning' as const,
    },
    {
      label: 'Delete',
      icon: Trash2,
      onClick: onBulkDelete,
      shortcut: 'Delete',
      variant: 'danger' as const,
    },
  ];

  const handleActionClick = (action: typeof actions[0]) => {
    action.onClick();
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className={`flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors ${
          disabled
            ? 'text-gray-400 cursor-not-allowed'
            : 'text-gray-600 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-700'
        }`}
        title="Bulk Actions"
      >
        <MoreVertical className="w-4 h-4" />
        <span>Actions</span>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Menu */}
          <div className="absolute right-0 top-full mt-1 z-20 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 py-2 min-w-48">
            <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              {selectedCount} {selectedCount === 1 ? 'item' : 'items'} selected
            </div>
            
            <div className="border-t border-gray-100 dark:border-gray-700 mt-1 pt-1">
              {actions.map((action) => (
                <button
                  key={action.label}
                  onClick={() => handleActionClick(action)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-sm transition-colors ${
                    action.variant === 'danger'
                      ? 'text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20'
                      : action.variant === 'warning'
                      ? 'text-orange-700 hover:bg-orange-50 dark:text-orange-400 dark:hover:bg-orange-900/20'
                      : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <action.icon className="w-4 h-4" />
                    <span>{action.label}</span>
                  </div>
                  
                  <kbd className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 rounded text-gray-600 dark:text-gray-300">
                    {action.shortcut}
                  </kbd>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
