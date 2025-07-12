import { Check } from 'lucide-react';

interface SelectionCounterProps {
  selectedCount: number;
  totalCount: number;
  onToggleSelectAll: () => void;
  className?: string;
}

export function SelectionCounter({
  selectedCount,
  totalCount,
  onToggleSelectAll,
  className = '',
}: SelectionCounterProps) {
  const isAllSelected = selectedCount === totalCount && totalCount > 0;
  const isPartiallySelected = selectedCount > 0 && selectedCount < totalCount;

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Select All Checkbox */}
      <button
        onClick={onToggleSelectAll}
        className={`relative w-5 h-5 rounded border-2 transition-colors ${
          isAllSelected
            ? 'bg-blue-600 border-blue-600 text-white'
            : isPartiallySelected
            ? 'bg-blue-100 border-blue-600 text-blue-600'
            : 'border-gray-300 hover:border-gray-400 dark:border-gray-600 dark:hover:border-gray-500'
        }`}
        title={isAllSelected ? 'Deselect All' : 'Select All'}
      >
        {isAllSelected && <Check className="w-3 h-3 absolute inset-0 m-auto" />}
        {isPartiallySelected && (
          <div className="w-2 h-2 bg-blue-600 rounded-sm absolute inset-0 m-auto" />
        )}
      </button>

      {/* Selection Count */}
      <div className="text-sm text-gray-600 dark:text-gray-400">
        {selectedCount > 0 ? (
          <span>
            <span className="font-medium text-gray-900 dark:text-white">
              {selectedCount}
            </span>{' '}
            selected
          </span>
        ) : (
          <span>{totalCount} items</span>
        )}
      </div>
    </div>
  );
}
