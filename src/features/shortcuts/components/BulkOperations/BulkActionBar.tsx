import { X, Tag, Trash2, Copy, Share2 } from 'lucide-react';

interface BulkActionBarProps {
  selectedCount: number;
  totalCount: number;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onBulkDelete: () => void;
  onBulkTag: () => void;
  onBulkDuplicate: () => void;
  onBulkShare: () => void;
  onCancel: () => void;
  isVisible: boolean;
}

export function BulkActionBar({
  selectedCount,
  totalCount,
  onSelectAll,
  onDeselectAll,
  onBulkDelete,
  onBulkTag,
  onBulkDuplicate,
  onBulkShare,
  onCancel,
  isVisible,
}: BulkActionBarProps) {
  if (!isVisible || selectedCount === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 p-4 flex items-center gap-4 min-w-max">
        {/* Selection Info */}
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
          <span className="font-medium">{selectedCount}</span>
          <span>of</span>
          <span>{totalCount}</span>
          <span>selected</span>
        </div>

        {/* Divider */}
        <div className="w-px h-6 bg-gray-200 dark:bg-gray-600" />

        {/* Selection Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={onSelectAll}
            className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            title="Select All (Cmd+A)"
          >
            Select All
          </button>
          <button
            onClick={onDeselectAll}
            className="text-sm text-gray-600 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            title="Deselect All (Cmd+Shift+A)"
          >
            Deselect All
          </button>
        </div>

        {/* Divider */}
        <div className="w-px h-6 bg-gray-200 dark:bg-gray-600" />

        {/* Bulk Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={onBulkTag}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-md transition-colors"
            title="Add Tags (Cmd+T)"
          >
            <Tag className="w-4 h-4" />
            Tag
          </button>

          <button
            onClick={onBulkDuplicate}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/30 text-green-700 dark:text-green-300 rounded-md transition-colors"
            title="Duplicate (Cmd+D)"
          >
            <Copy className="w-4 h-4" />
            Duplicate
          </button>

          <button
            onClick={onBulkShare}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-purple-50 hover:bg-purple-100 dark:bg-purple-900/20 dark:hover:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-md transition-colors"
            title="Share (Cmd+Shift+S)"
          >
            <Share2 className="w-4 h-4" />
            Share
          </button>

          <button
            onClick={onBulkDelete}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30 text-red-700 dark:text-red-300 rounded-md transition-colors"
            title="Delete (Delete)"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>

        {/* Divider */}
        <div className="w-px h-6 bg-gray-200 dark:bg-gray-600" />

        {/* Cancel */}
        <button
          onClick={onCancel}
          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 rounded-md transition-colors"
          title="Cancel (Esc)"
        >
          <X className="w-4 h-4" />
          Cancel
        </button>
      </div>
    </div>
  );
}
