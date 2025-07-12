import React from 'react';
import type { Prompt } from '../../utils/validation';

export interface PromptCardProps {
  prompt: Prompt;
  variant?: 'grid' | 'list' | 'compact';
  showActions?: boolean;
  isSelected?: boolean;
  onSelect?: (selected: boolean) => void;
  onClick?: (prompt: Prompt) => void;
  onEdit?: (prompt: Prompt) => void;
  onDuplicate?: (prompt: Prompt) => void;
  onDelete?: (promptId: string) => void;
}

export const PromptCard: React.FC<PromptCardProps> = ({
  prompt,
  variant = 'grid',
  showActions = true,
  isSelected = false,
  onSelect,
  onClick,
  onEdit,
  onDuplicate,
  onDelete
}) => {
  const handleClick = () => {
    onClick?.(prompt);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit?.(prompt);
  };

  const handleDuplicate = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDuplicate?.(prompt);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.(prompt.id);
  };

  const handleSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    onSelect?.(e.target.checked);
  };

  return (
    <div
      className={`
        bg-white border border-gray-200 rounded-lg p-4 cursor-pointer
        hover:border-gray-300 hover:shadow-sm transition-all
        ${isSelected ? 'border-blue-500 bg-blue-50' : ''}
        ${variant === 'list' ? 'flex items-center space-x-4' : ''}
      `}
      onClick={handleClick}
      data-testid={`prompt-card-${prompt.id}`}
      tabIndex={0}
    >
      {/* Selection checkbox */}
      {onSelect && (
        <div className="flex items-center mb-2">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={handleSelect}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            data-testid="prompt-checkbox"
          />
        </div>
      )}

      {/* Prompt content */}
      <div className="flex-1">
        <h3 className="text-lg font-semibold text-gray-900 mb-2" data-testid="prompt-title">
          {prompt.title}
        </h3>
        
        <p className="text-gray-600 text-sm mb-3 line-clamp-3" data-testid="prompt-content">
          {prompt.content}
        </p>

        {/* Tags */}
        {prompt.tags && prompt.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3" data-testid="prompt-tags">
            {prompt.tags.map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center text-sm text-gray-500 space-x-4" data-testid="prompt-stats">
          <span>{prompt.usage_count} uses</span>
          {prompt.category && (
            <span className="text-blue-600">{prompt.category}</span>
          )}
          {prompt.is_public && (
            <span className="text-green-600">Public</span>
          )}
          {prompt.is_favorite && (
            <span className="text-yellow-600">★ Favorite</span>
          )}
        </div>
      </div>

      {/* Actions */}
      {showActions && (
        <div className="flex items-center space-x-2 mt-3" data-testid="prompt-actions">
          <button
            onClick={handleEdit}
            className="text-sm text-blue-600 hover:text-blue-800"
            data-testid="edit-button"
          >
            Edit
          </button>
          <button
            onClick={handleDuplicate}
            className="text-sm text-gray-600 hover:text-gray-800"
            data-testid="duplicate-button"
          >
            Duplicate
          </button>
          <button
            onClick={handleDelete}
            className="text-sm text-red-600 hover:text-red-800"
            data-testid="delete-button"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
};
