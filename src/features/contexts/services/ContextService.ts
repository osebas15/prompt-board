import { supabase } from '@/lib/supabase';
import type { 
  Context, 
  CreateContextData, 
  UpdateContextData
} from '../types';

export class ContextService {
  /**
   * Create a new context for the current user
   */
  async createContext(data: CreateContextData): Promise<Context> {
    const { data: user, error: userError } = await supabase.auth.getUser();
    if (userError || !user.user) {
      throw new Error('User not authenticated');
    }

    // Check if user has any existing contexts to determine if this should be default
    const { data: existingContexts, error: countError } = await supabase
      .from('contexts')
      .select('id')
      .eq('user_id', user.user.id);

    if (countError) {
      throw new Error(`Failed to check existing contexts: ${countError.message}`);
    }

    const isFirstContext = !existingContexts || existingContexts.length === 0;

    // Prepare context data with defaults
    const contextData = {
      user_id: user.user.id,
      name: data.name,
      description: data.description || null,
      color: data.color || '#3B82F6',
      icon: data.icon || 'folder',
      is_default: isFirstContext,
      settings: data.settings || {},
    };

    try {
      const { data: context, error } = await supabase
        .from('contexts')
        .insert(contextData)
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          throw new Error('Context name already exists');
        }
        throw new Error(`Failed to create context: ${error.message}`);
      }

      return context;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to create context');
    }
  }

  /**
   * Get all contexts for the current user
   */
  async getContexts(options: { includeArchived?: boolean } = {}): Promise<Context[]> {
    const { data: user, error: userError } = await supabase.auth.getUser();
    if (userError || !user.user) {
      throw new Error('User not authenticated');
    }

    let query = supabase
      .from('contexts')
      .select('*')
      .eq('user_id', user.user.id);

    // Filter out archived contexts by default
    if (!options.includeArchived) {
      query = query.eq('is_archived', false);
    }

    // Order by default first, then by sort order, then by name
    query = query.order('is_default', { ascending: false });

    const { data: contexts, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch contexts: ${error.message}`);
    }

    return contexts || [];
  }

  /**
   * Update a context
   */
  async updateContext(contextId: string, data: UpdateContextData): Promise<Context> {
    const { data: user, error: userError } = await supabase.auth.getUser();
    if (userError || !user.user) {
      throw new Error('User not authenticated');
    }

    // If setting as default, unset other default contexts first
    if (data.is_default === true) {
      await this.clearDefaultContext(user.user.id);
    }

    const updateData = {
      ...data,
      updated_at: new Date().toISOString(),
    };

    const { data: context, error } = await supabase
      .from('contexts')
      .update(updateData)
      .eq('id', contextId)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new Error('Context not found or access denied');
      }
      throw new Error(`Failed to update context: ${error.message}`);
    }

    return context;
  }

  /**
   * Delete a context (with validation)
   */
  async deleteContext(contextId: string): Promise<void> {
    const { data: user, error: userError } = await supabase.auth.getUser();
    if (userError || !user.user) {
      throw new Error('User not authenticated');
    }

    // Check if this is the default context
    const { data: context, error: getError } = await supabase
      .from('contexts')
      .select('is_default')
      .eq('id', contextId)
      .single();

    if (getError) {
      if (getError.code === 'PGRST116') {
        throw new Error('Context not found');
      }
      throw new Error(`Failed to check context: ${getError.message}`);
    }

    if (context.is_default) {
      throw new Error('Cannot delete default context');
    }

    // Delete the context (cascade will handle related records)
    const { error: deleteError } = await supabase
      .from('contexts')
      .delete()
      .eq('id', contextId);

    if (deleteError) {
      throw new Error(`Failed to delete context: ${deleteError.message}`);
    }
  }

  /**
   * Add a prompt to a context
   */
  async addPromptToContext(contextId: string, promptId: string): Promise<void> {
    const { data: user, error: userError } = await supabase.auth.getUser();
    if (userError || !user.user) {
      throw new Error('User not authenticated');
    }

    // Get the highest sort order for this context
    const { data: existingPrompts, error: getError } = await supabase
      .from('context_prompts')
      .select('sort_order')
      .eq('context_id', contextId);

    if (getError) {
      throw new Error(`Failed to check existing prompts: ${getError.message}`);
    }

    const nextSortOrder = existingPrompts && existingPrompts.length > 0 
      ? existingPrompts[0].sort_order + 1 
      : 0;

    const { error } = await supabase
      .from('context_prompts')
      .insert({
        context_id: contextId,
        prompt_id: promptId,
        sort_order: nextSortOrder,
      });

    if (error) {
      if (error.code === '23505') {
        throw new Error('Prompt already associated with context');
      }
      throw new Error(`Failed to add prompt to context: ${error.message}`);
    }
  }

  /**
   * Remove a prompt from a context
   */
  async removePromptFromContext(contextId: string, promptId: string): Promise<void> {
    const { data: user, error: userError } = await supabase.auth.getUser();
    if (userError || !user.user) {
      throw new Error('User not authenticated');
    }

    const { error } = await supabase
      .from('context_prompts')
      .delete()
      .eq('context_id', contextId)
      .eq('prompt_id', promptId);

    if (error) {
      throw new Error(`Failed to remove prompt from context: ${error.message}`);
    }
  }

  /**
   * Set a context as the default context
   */
  async setDefaultContext(contextId: string): Promise<Context> {
    const { data: user, error: userError } = await supabase.auth.getUser();
    if (userError || !user.user) {
      throw new Error('User not authenticated');
    }

    // Clear existing default context
    await this.clearDefaultContext(user.user.id);

    // Set new default context
    const { data: context, error } = await supabase
      .from('contexts')
      .update({ is_default: true })
      .eq('id', contextId)
      .eq('user_id', user.user.id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new Error('Context not found or access denied');
      }
      throw new Error(`Failed to set default context: ${error.message}`);
    }

    return context;
  }

  /**
   * Clear default status from all contexts for a user
   */
  private async clearDefaultContext(userId: string): Promise<void> {
    const { error } = await supabase
      .from('contexts')
      .update({ is_default: false })
      .eq('user_id', userId)
      .eq('is_default', true);

    if (error) {
      throw new Error(`Failed to clear default context: ${error.message}`);
    }
  }
}
