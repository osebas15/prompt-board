import { useCallback, useEffect } from 'react';
import { ContextService } from '../services/ContextService';
import { useContextStore } from '../stores/contextStore';
import type { Context, CreateContextData, UpdateContextData } from '../types';

export function useContext(contextService?: ContextService) {
  const {
    currentContext,
    contexts,
    loading,
    error,
    setCurrentContext,
    setContexts,
    addContext,
    updateContext: updateContextInStore,
    removeContext,
    setLoading,
    setError,
    getContextById,
    getDefaultContext,
    getActiveContexts,
  } = useContextStore();

  const service = contextService || new ContextService();

  // Load contexts on hook initialization
  const loadContexts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const fetchedContexts = await service.getContexts();
      setContexts(fetchedContexts);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load contexts';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError, setContexts]);

  // Initialize contexts on first load
  useEffect(() => {
    if (contexts.length === 0 && !loading) {
      loadContexts();
    }
  }, [contexts.length, loading, loadContexts]);

  // Create new context
  const createContext = useCallback(async (data: CreateContextData): Promise<Context> => {
    try {
      setLoading(true);
      setError(null);
      
      const newContext = await service.createContext(data);
      if (!newContext) {
        throw new Error('Failed to create context - no context returned');
      }
      
      addContext(newContext);
      
      // Set as current context if it's the default or no current context
      if (newContext.is_default || !currentContext) {
        setCurrentContext(newContext);
      }
      
      return newContext;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create context';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [service, addContext, currentContext, setCurrentContext, setLoading, setError]);

  // Switch active context
  const switchContext = useCallback(async (contextOrId: string | Context): Promise<void> => {
    try {
      const context = typeof contextOrId === 'string' 
        ? getContextById(contextOrId)
        : contextOrId;
        
      if (!context) {
        throw new Error('Context not found');
      }
      
      setCurrentContext(context);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to switch context';
      setError(errorMessage);
      throw err;
    }
  }, [getContextById, setCurrentContext, setError]);

  // Update context
  const updateContext = useCallback(async (contextId: string, data: UpdateContextData): Promise<Context> => {
    try {
      setLoading(true);
      setError(null);
      
      const updatedContext = await service.updateContext(contextId, data);
      updateContextInStore(contextId, updatedContext);
      
      return updatedContext;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update context';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [service, updateContextInStore, setLoading, setError]);

  // Delete context
  const deleteContext = useCallback(async (contextId: string): Promise<void> => {
    // Confirm deletion
    if (!window.confirm('Are you sure you want to delete this context? This action cannot be undone.')) {
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      await service.deleteContext(contextId);
      removeContext(contextId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete context';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [service, removeContext, setLoading, setError]);

  // Set default context
  const setDefaultContext = useCallback(async (contextId: string): Promise<Context> => {
    try {
      setLoading(true);
      setError(null);
      
      const defaultContext = await service.setDefaultContext(contextId);
      
      // Update store to reflect new default status
      await loadContexts();
      setCurrentContext(defaultContext);
      
      return defaultContext;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to set default context';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [service, loadContexts, setCurrentContext, setLoading, setError]);

  // Add prompt to context
  const addPromptToContext = useCallback(async (contextId: string, promptId: string): Promise<void> => {
    try {
      setError(null);
      await service.addPromptToContext(contextId, promptId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add prompt to context';
      setError(errorMessage);
      throw err;
    }
  }, [service, setError]);

  // Remove prompt from context
  const removePromptFromContext = useCallback(async (contextId: string, promptId: string): Promise<void> => {
    try {
      setError(null);
      await service.removePromptFromContext(contextId, promptId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove prompt from context';
      setError(errorMessage);
      throw err;
    }
  }, [service, setError]);

  // Filter prompts by current context (utility function)
  const filterPromptsByContext = useCallback((prompts: any[], contextId?: string) => {
    if (!contextId) {
      return prompts;
    }
    return prompts.filter(prompt => prompt.context_id === contextId);
  }, []);

  return {
    // State
    currentContext,
    contexts,
    loading,
    error,
    
    // Computed values
    activeContexts: getActiveContexts(),
    defaultContext: getDefaultContext(),
    
    // Actions
    createContext,
    switchContext,
    updateContext,
    deleteContext,
    setDefaultContext,
    addPromptToContext,
    removePromptFromContext,
    loadContexts,
    
    // Utilities
    getContextById,
    filterPromptsByContext,
  };
}
