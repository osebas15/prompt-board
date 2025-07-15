import React, { useState } from 'react';
import { usePrompt, useDeletePrompt, useUpdatePrompt } from '../../hooks/usePrompts';
import type { Prompt } from '../../utils/validation';
import { logger } from '../../../../lib/debug/logger';

export interface PromptDetailProps {
  promptId: string;
  onEdit?: (prompt: Prompt) => void;
  onDuplicate?: (prompt: Prompt) => void;
  onDelete?: (promptId: string) => void;
  onClose?: () => void;
  showRelated?: boolean;
  showVersions?: boolean;
  className?: string;
}

export const PromptDetail: React.FC<PromptDetailProps> = ({
  promptId,
  onEdit,
  onDuplicate,
  onDelete,
  onClose,
  showRelated = false,
  showVersions = false,
  className = ''
}) => {
  const [templateVariables, setTemplateVariables] = useState<Record<string, string>>({});
  const [showCopyFeedback, setShowCopyFeedback] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);

  // Fetch prompt data
  const { data: prompt, isLoading, error } = usePrompt(promptId);
  
  // Mutations
  const deletePromptMutation = useDeletePrompt({
    onSuccess: () => {
      onDelete?.(promptId);
    }
  });

  const updatePromptMutation = useUpdatePrompt();

  // Extract template variables from content
  React.useEffect(() => {
    if (prompt?.content) {
      const variables = prompt.content.match(/{{(\w+)}}/g) || [];
      const variableMap: Record<string, string> = {};
      variables.forEach(variable => {
        const key = variable.replace(/[{}]/g, '');
        variableMap[key] = '';
      });
      setTemplateVariables(variableMap);
    }
  }, [prompt?.content]);

  const handleTemplateVariableChange = (key: string, value: string) => {
    setTemplateVariables(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const renderContent = () => {
    if (!prompt?.content) return '';
    
    let content = prompt.content;
    Object.entries(templateVariables).forEach(([key, value]) => {
      if (value) {
        content = content.replace(new RegExp(`{{${key}}}`, 'g'), value);
      }
    });
    return content;
  };

  const handleCopyContent = async () => {
    try {
      await navigator.clipboard.writeText(renderContent());
      setShowCopyFeedback(true);
      setTimeout(() => setShowCopyFeedback(false), 2000);
    } catch (error) {
      logger.error('Failed to copy content:', error);
    }
  };

  const handleFavoriteToggle = async () => {
    if (!prompt) return;
    
    try {
      await updatePromptMutation.mutateAsync({
        id: promptId,
        updates: { is_favorite: !prompt.is_favorite }
      });
    } catch (error) {
      logger.error('Failed to toggle favorite:', error);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this prompt? This action cannot be undone.')) {
      try {
        await deletePromptMutation.mutateAsync(promptId);
      } catch (error) {
        logger.error('Failed to delete prompt:', error);
      }
    }
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/prompts/${promptId}`;
    try {
      await navigator.share({
        title: prompt?.title,
        text: prompt?.description || '',
        url: shareUrl
      });
    } catch (error) {
      // Fallback to copying URL
      await navigator.clipboard.writeText(shareUrl);
      alert('Link copied to clipboard!');
    }
  };

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center h-64 ${className}`} data-testid="prompt-detail-loading">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !prompt) {
    return (
      <div className={`text-center py-8 ${className}`} data-testid="prompt-detail-error">
        <div className="text-red-600 mb-4">Failed to load prompt</div>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  const containerClass = isFullScreen 
    ? 'fixed inset-0 z-50 bg-white overflow-auto'
    : `max-w-4xl mx-auto ${className}`;

  return (
    <div className={containerClass} data-testid="prompt-detail">
      {/* Header */}
      <div className="flex justify-between items-start mb-6 p-6 bg-white border-b">
        <div className="flex-1">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 mb-2" data-testid="prompt-title">
                {prompt.title}
              </h1>
              {prompt.description && (
                <p className="text-gray-600 mb-4" data-testid="prompt-description">
                  {prompt.description}
                </p>
              )}
              
              {/* Tags */}
              {prompt.tags && prompt.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4" data-testid="prompt-tags">
                  {prompt.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Favorite star */}
            <button
              onClick={handleFavoriteToggle}
              className={`p-2 rounded-full ${prompt.is_favorite ? 'text-yellow-500' : 'text-gray-400'} hover:bg-gray-100`}
              data-testid="favorite-button"
            >
              <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            </button>
          </div>

          {/* Metadata */}
          <div className="flex items-center gap-4 text-sm text-gray-500" data-testid="prompt-metadata">
            <span>Created: {new Date(prompt.created_at).toLocaleDateString()}</span>
            <span>•</span>
            <span>Updated: {new Date(prompt.updated_at).toLocaleDateString()}</span>
            {prompt.usage_count && (
              <>
                <span>•</span>
                <span>{prompt.usage_count} uses</span>
              </>
            )}
            {prompt.last_used_at && (
              <>
                <span>•</span>
                <span>Last used: {new Date(prompt.last_used_at).toLocaleDateString()}</span>
              </>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 ml-6">
          <button
            onClick={() => setIsFullScreen(!isFullScreen)}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
            data-testid="fullscreen-button"
            title={isFullScreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isFullScreen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              )}
            </svg>
          </button>

          <button
            onClick={handleShare}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
            data-testid="share-button"
            title="Share"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
            </svg>
          </button>

          {onEdit && (
            <button
              onClick={() => onEdit(prompt)}
              className="px-3 py-2 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
              data-testid="edit-button"
            >
              Edit
            </button>
          )}

          {onDuplicate && (
            <button
              onClick={() => onDuplicate(prompt)}
              className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded"
              data-testid="duplicate-button"
            >
              Duplicate
            </button>
          )}

          <button
            onClick={handleDelete}
            className="px-3 py-2 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
            data-testid="delete-button"
          >
            Delete
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
              data-testid="close-button"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Template Variables */}
        {Object.keys(templateVariables).length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Template Variables</h3>
            <div className="bg-gray-50 rounded-lg p-4" data-testid="template-variables">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(templateVariables).map(([key, value]) => (
                  <div key={key} className="flex items-center gap-3">
                    <label className="text-sm font-medium text-gray-700 w-20">
                      {`{{${key}}}:`}
                    </label>
                    <input
                      type="text"
                      value={value}
                      onChange={(e) => handleTemplateVariableChange(key, e.target.value)}
                      className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter value..."
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Prompt Content */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-medium text-gray-900">Content</h3>
            <button
              onClick={handleCopyContent}
              className={`px-3 py-2 text-sm rounded transition-colors ${
                showCopyFeedback 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
              }`}
              data-testid="copy-content-button"
            >
              {showCopyFeedback ? 'Copied!' : 'Copy Content'}
            </button>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4 border" data-testid="prompt-content">
            <pre className="whitespace-pre-wrap font-mono text-sm text-gray-900 leading-relaxed">
              {renderContent()}
            </pre>
          </div>
          
          <div className="mt-2 text-xs text-gray-500 text-right">
            {renderContent().length} characters
          </div>
        </div>

        {/* Additional Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Technical Details */}
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-3">Details</h4>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-600">Version:</dt>
                <dd className="text-gray-900">{prompt.version}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-600">Visibility:</dt>
                <dd className="text-gray-900">{prompt.is_public ? 'Public' : 'Private'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-600">Template:</dt>
                <dd className="text-gray-900">{prompt.is_template ? 'Yes' : 'No'}</dd>
              </div>
              {prompt.rating && (
                <div className="flex justify-between">
                  <dt className="text-gray-600">Rating:</dt>
                  <dd className="text-gray-900">{prompt.rating}/5</dd>
                </div>
              )}
            </dl>
          </div>

          {/* Model Compatibility */}
          {prompt.model_compatibility && prompt.model_compatibility.length > 0 && (
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-3">Compatible Models</h4>
              <div className="flex flex-wrap gap-2">
                {prompt.model_compatibility.map((model, index) => (
                  <span
                    key={index}
                    className="inline-block px-2 py-1 text-xs bg-green-100 text-green-800 rounded"
                  >
                    {model}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
