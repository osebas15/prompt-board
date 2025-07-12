import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { Context, ContextState } from '../types';

interface ContextStore extends ContextState {
  // Actions
  setCurrentContext: (context: Context | null) => void;
  setContexts: (contexts: Context[]) => void;
  addContext: (context: Context) => void;
  updateContext: (id: string, updates: Partial<Context>) => void;
  removeContext: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Selectors
  getContextById: (id: string) => Context | undefined;
  getDefaultContext: () => Context | undefined;
  getActiveContexts: () => Context[];
}

export const useContextStore = create<ContextStore>()(
  persist(
    immer((set, get) => ({
      // Initial state
      currentContext: null,
      contexts: [],
      loading: false,
      error: null,

      // Actions
      setCurrentContext: (context) =>
        set((state) => {
          state.currentContext = context;
        }),

      setContexts: (contexts) =>
        set((state) => {
          state.contexts = contexts;
          // Set default context as current if none selected
          if (!state.currentContext && contexts.length > 0) {
            const defaultContext = contexts.find(c => c.is_default) || contexts[0];
            state.currentContext = defaultContext;
          }
        }),

      addContext: (context) =>
        set((state) => {
          state.contexts.push(context);
        }),

      updateContext: (id, updates) =>
        set((state) => {
          const index = state.contexts.findIndex(c => c.id === id);
          if (index !== -1) {
            state.contexts[index] = { ...state.contexts[index], ...updates };
            
            // Update current context if it's the one being updated
            if (state.currentContext?.id === id) {
              state.currentContext = state.contexts[index];
            }
          }
        }),

      removeContext: (id) =>
        set((state) => {
          state.contexts = state.contexts.filter(c => c.id !== id);
          
          // Clear current context if it was removed
          if (state.currentContext?.id === id) {
            const defaultContext = state.contexts.find(c => c.is_default);
            state.currentContext = defaultContext || state.contexts[0] || null;
          }
        }),

      setLoading: (loading) =>
        set((state) => {
          state.loading = loading;
        }),

      setError: (error) =>
        set((state) => {
          state.error = error;
        }),

      // Selectors
      getContextById: (id) => {
        return get().contexts.find(c => c.id === id);
      },

      getDefaultContext: () => {
        return get().contexts.find(c => c.is_default);
      },

      getActiveContexts: () => {
        return get().contexts.filter(c => !c.is_archived);
      },
    })),
    {
      name: 'context-store',
      partialize: (state) => ({
        currentContext: state.currentContext,
        contexts: state.contexts,
      }),
    }
  )
);
