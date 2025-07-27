import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useDebounce } from 'use-debounce';
import { 
  usePrompt, 
  useCreatePrompt, 
  useUpdatePrompt 
} from '../../hooks/usePrompts';
import { CreatePromptSchema, UpdatePromptSchema, type CreatePrompt, type UpdatePrompt, type Prompt } from '../../utils/validation';
import { logger } from '../../../../lib/debug/logger';

export interface PromptEditorProps {
  promptId?: string;
  initialData?: Partial<CreatePrompt>;
  mode?: 'create' | 'edit' | 'template';
  onSave?: (prompt: Prompt) => void;
  onCancel?: () => void;
  autoSave?: boolean;
  className?: string;
}

type FormData = CreatePrompt | UpdatePrompt;

export const PromptEditor: React.FC<PromptEditorProps> = ({
  promptId,
  initialData,
  mode = 'create',
  onSave,
  onCancel,
  autoSave = false,
  className = ''
}) => {
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [templateVariables, setTemplateVariables] = useState<Record<string, string>>({});

  // Fetch existing prompt for edit mode
  const { data: existingPrompt, isLoading: isLoadingPrompt } = usePrompt(promptId, {
    enabled: !!promptId
  });

  // Mutations
  const createPromptMutation = useCreatePrompt({
    onSuccess: (prompt) => {
      setLastSaved(new Date());
      onSave?.(prompt);
    }
  });

  const updatePromptMutation = useUpdatePrompt({
    onSuccess: (prompt) => {
      setLastSaved(new Date());
      onSave?.(prompt);
    }
  });

  // Form setup
  const schema = mode === 'create' ? CreatePromptSchema : UpdatePromptSchema;
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isDirty, isValid }
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: initialData || (mode === 'create' ? {
      title: '',
      content: '',
      tags: [],
      is_public: false,
      is_template: false,
      description: '',
      user_id: 'current-user' // This should come from auth context
    } : {})
  });

  // Watch form values for auto-save and preview
  const watchedValues = watch();
  const [debouncedValues] = useDebounce(watchedValues, 2000);

  // Update form when existing prompt loads
  useEffect(() => {
    if (existingPrompt && mode === 'edit') {
      reset({
        title: existingPrompt.title,
        content: existingPrompt.content,
        tags: existingPrompt.tags || [],
        is_public: existingPrompt.is_public || false,
        is_template: existingPrompt.is_template || false,
        description: existingPrompt.description || '',
        category_id: existingPrompt.category_id || undefined,
        model_compatibility: existingPrompt.model_compatibility || undefined,
        parameters: existingPrompt.parameters || undefined
      });
    }
  }, [existingPrompt, mode, reset]);

  const handleAutoSave = useCallback(async () => {
    if (!promptId || !isValid) return;

    try {
      await updatePromptMutation.mutateAsync({
        id: promptId,
        updates: debouncedValues as UpdatePrompt
      });
    } catch (error) {
      logger.error('Auto-save failed:', error);
    }
  }, [promptId, isValid, updatePromptMutation, debouncedValues]);

  // Auto-save effect
  useEffect(() => {
    if (autoSave && isDirty && promptId && debouncedValues) {
      handleAutoSave();
    }
  }, [debouncedValues, autoSave, isDirty, promptId, handleAutoSave]);

  // Extract template variables from content
  useEffect(() => {
    const content = watchedValues.content || '';
    const variables = content.match(/{{(\w+)}}/g) || [];
    const variableMap: Record<string, string> = {};
    variables.forEach(variable => {
      const key = variable.replace(/[{}]/g, '');
      if (!templateVariables[key]) {
        variableMap[key] = '';
      } else {
        variableMap[key] = templateVariables[key];
      }
    });
    setTemplateVariables(variableMap);
  }, [watchedValues.content, templateVariables]);

  const onSubmit = async (data: FormData) => {
    try {
      if (mode === 'create') {
        await createPromptMutation.mutateAsync(data as CreatePrompt);
      } else if (promptId) {
        await updatePromptMutation.mutateAsync({
          id: promptId,
          updates: data as UpdatePrompt
        });
      }
    } catch (error) {
      logger.error('Save failed:', error);
    }
  };

  const handleTemplateVariableChange = (key: string, value: string) => {
    setTemplateVariables(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const renderPreview = () => {
    let content = watchedValues.content || '';
    Object.entries(templateVariables).forEach(([key, value]) => {
      content = content.replace(new RegExp(`{{${key}}}`, 'g'), value || `{{${key}}}`);
    });
    return content;
  };

  if (isLoadingPrompt) {
    return (
      <div className={`flex items-center justify-center h-64 ${className}`} data-testid="prompt-editor-loading">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className={`max-w-6xl mx-auto ${className}`} data-testid="prompt-editor">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {mode === 'create' ? 'Create New Prompt' : 'Edit Prompt'}
            </h2>
            {lastSaved && (
              <p className="text-sm text-gray-500 mt-1">
                Last saved: {lastSaved.toLocaleTimeString()}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowPreview(!showPreview)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
              data-testid="toggle-preview"
            >
              {showPreview ? 'Hide Preview' : 'Show Preview'}
            </button>
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                data-testid="cancel-button"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={!isValid || createPromptMutation.isPending || updatePromptMutation.isPending}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              data-testid="save-button"
            >
              {createPromptMutation.isPending || updatePromptMutation.isPending ? 'Saving...' : 'Save Prompt'}
            </button>
          </div>
        </div>

        <div className={`grid gap-6 ${showPreview ? 'grid-cols-2' : 'grid-cols-1'}`}>
          {/* Editor Panel */}
          <div className="space-y-6">
            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Title *
              </label>
              <input
                {...register('title')}
                type="text"
                id="title"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter prompt title..."
                data-testid="title-input"
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600" data-testid="title-error">
                  {errors.title.message}
                </p>
              )}
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                {...register('description')}
                id="description"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Brief description of this prompt..."
                data-testid="description-input"
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
              )}
            </div>

            {/* Content */}
            <div>
              <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
                Prompt Content *
              </label>
              <textarea
                {...register('content')}
                id="content"
                rows={12}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                placeholder="Enter your prompt content here. Use {{variable}} for template variables..."
                data-testid="content-input"
              />
              {errors.content && (
                <p className="mt-1 text-sm text-red-600" data-testid="content-error">
                  {errors.content.message}
                </p>
              )}
              <div className="mt-1 text-xs text-gray-500">
                {watchedValues.content?.length || 0} characters
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags
              </label>
              <input
                {...register('tags')}
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter tags separated by commas..."
                data-testid="tags-input"
              />
              {errors.tags && (
                <p className="mt-1 text-sm text-red-600">{errors.tags.message}</p>
              )}
            </div>

            {/* Options */}
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  {...register('is_public')}
                  type="checkbox"
                  id="is_public"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  data-testid="public-checkbox"
                />
                <label htmlFor="is_public" className="ml-2 block text-sm text-gray-900">
                  Make this prompt public
                </label>
              </div>

              <div className="flex items-center">
                <input
                  {...register('is_template')}
                  type="checkbox"
                  id="is_template"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  data-testid="template-checkbox"
                />
                <label htmlFor="is_template" className="ml-2 block text-sm text-gray-900">
                  Mark as template
                </label>
              </div>
            </div>

            {/* Template Variables */}
            {Object.keys(templateVariables).length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Template Variables</h3>
                <div className="space-y-2" data-testid="template-variables">
                  {Object.entries(templateVariables).map(([key, value]) => (
                    <div key={key} className="flex items-center gap-2">
                      <label className="text-sm text-gray-600 w-24">{`{{${key}}}:`}</label>
                      <input
                        type="text"
                        value={value}
                        onChange={(e) => handleTemplateVariableChange(key, e.target.value)}
                        className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Default value..."
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Preview Panel */}
          {showPreview && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Preview</h3>
              <div className="bg-gray-50 rounded-lg p-4" data-testid="prompt-preview">
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-900">{watchedValues.title || 'Untitled Prompt'}</h4>
                  {watchedValues.description && (
                    <p className="text-sm text-gray-600">{watchedValues.description}</p>
                  )}
                  <div className="mt-4">
                    <h5 className="text-sm font-medium text-gray-700 mb-2">Rendered Content:</h5>
                    <div className="whitespace-pre-wrap text-sm bg-white p-3 rounded border font-mono">
                      {renderPreview()}
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    {renderPreview().length} characters (rendered)
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </form>
    </div>
  );
};
