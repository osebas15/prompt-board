import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/supabase';
import type { 
  Prompt, 
  CreatePrompt, 
  UpdatePrompt, 
  PromptFilters, 
  Pagination, 
  PromptsListResponse
} from '../utils/validation';
import {
  validatePrompt,
  validateCreatePrompt,
  validateUpdatePrompt,
  validatePromptFilters,
  validatePagination
} from '../utils/validation';

type PromptInsert = Database['public']['Tables']['prompts']['Insert'];
type PromptUpdate = Database['public']['Tables']['prompts']['Update'];

export class PromptService {
  private static instance: PromptService;

  private constructor() {}

  public static getInstance(): PromptService {
    if (!PromptService.instance) {
      PromptService.instance = new PromptService();
    }
    return PromptService.instance;
  }

  /**
   * Create a new prompt
   */
  async createPrompt(promptData: CreatePrompt): Promise<Prompt> {
    // Validate input data
    const validatedData = validateCreatePrompt(promptData);
    
    // Prepare data for insertion
    const insertData: PromptInsert = {
      ...validatedData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      usage_count: 0,
      version: 1
    };

    const { data, error } = await supabase
      .from('prompts')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create prompt: ${error.message}`);
    }

    if (!data) {
      throw new Error('No data returned from prompt creation');
    }

    return validatePrompt(data);
  }

  /**
   * Get a prompt by ID
   */
  async getPrompt(id: string): Promise<Prompt | null> {
    const { data, error } = await supabase
      .from('prompts')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      throw new Error(`Failed to get prompt: ${error.message}`);
    }

    return validatePrompt(data);
  }

  /**
   * Update a prompt
   */
  async updatePrompt(id: string, updates: UpdatePrompt): Promise<Prompt> {
    // Validate input data
    const validatedUpdates = validateUpdatePrompt(updates);
    
    // Prepare update data
    const updateData: PromptUpdate = {
      ...validatedUpdates,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('prompts')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update prompt: ${error.message}`);
    }

    if (!data) {
      throw new Error('No data returned from prompt update');
    }

    return validatePrompt(data);
  }

  /**
   * Delete a prompt
   */
  async deletePrompt(id: string): Promise<void> {
    const { error } = await supabase
      .from('prompts')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete prompt: ${error.message}`);
    }
  }

  /**
   * List prompts with filters and pagination
   */
  async listPrompts(
    filters: PromptFilters = {}, 
    pagination: Pagination = { page: 1, limit: 10, sort_by: 'created_at', sort_order: 'desc' }
  ): Promise<PromptsListResponse> {
    // Validate inputs
    const validatedFilters = validatePromptFilters(filters);
    const validatedPagination = validatePagination(pagination);

    // Build query
    let query = supabase.from('prompts').select('*', { count: 'exact' });

    // Apply filters
    if (validatedFilters.category) {
      query = query.eq('category', validatedFilters.category);
    }

    if (validatedFilters.is_public !== undefined) {
      query = query.eq('is_public', validatedFilters.is_public);
    }

    if (validatedFilters.is_favorite !== undefined) {
      query = query.eq('is_favorite', validatedFilters.is_favorite);
    }

    if (validatedFilters.is_template !== undefined) {
      query = query.eq('is_template', validatedFilters.is_template);
    }

    if (validatedFilters.user_id) {
      query = query.eq('user_id', validatedFilters.user_id);
    }

    if (validatedFilters.folder_id) {
      query = query.eq('folder_id', validatedFilters.folder_id);
    }

    if (validatedFilters.parent_id) {
      query = query.eq('parent_id', validatedFilters.parent_id);
    }

    if (validatedFilters.tags && validatedFilters.tags.length > 0) {
      query = query.overlaps('tags', validatedFilters.tags);
    }

    if (validatedFilters.model_compatibility && validatedFilters.model_compatibility.length > 0) {
      query = query.overlaps('model_compatibility', validatedFilters.model_compatibility);
    }

    if (validatedFilters.rating_min !== undefined) {
      query = query.gte('rating', validatedFilters.rating_min);
    }

    if (validatedFilters.rating_max !== undefined) {
      query = query.lte('rating', validatedFilters.rating_max);
    }

    if (validatedFilters.created_after) {
      query = query.gte('created_at', validatedFilters.created_after);
    }

    if (validatedFilters.created_before) {
      query = query.lte('created_at', validatedFilters.created_before);
    }

    if (validatedFilters.updated_after) {
      query = query.gte('updated_at', validatedFilters.updated_after);
    }

    if (validatedFilters.updated_before) {
      query = query.lte('updated_at', validatedFilters.updated_before);
    }

    if (validatedFilters.search) {
      query = query.or(`title.ilike.%${validatedFilters.search}%,content.ilike.%${validatedFilters.search}%,description.ilike.%${validatedFilters.search}%`);
    }

    // Apply sorting
    query = query.order(validatedPagination.sort_by, { ascending: validatedPagination.sort_order === 'asc' });

    // Apply pagination
    const from = (validatedPagination.page - 1) * validatedPagination.limit;
    const to = from + validatedPagination.limit - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Failed to list prompts: ${error.message}`);
    }

    if (!data) {
      throw new Error('No data returned from prompt list');
    }

    // Validate each prompt
    const validatedPrompts = data.map(validatePrompt);

    // Calculate pagination info
    const total = count || 0;
    const totalPages = Math.ceil(total / validatedPagination.limit);
    const hasNext = validatedPagination.page < totalPages;
    const hasPrev = validatedPagination.page > 1;

    return {
      data: validatedPrompts,
      pagination: {
        page: validatedPagination.page,
        limit: validatedPagination.limit,
        total,
        total_pages: totalPages,
        has_next: hasNext,
        has_prev: hasPrev
      },
      success: true
    };
  }

  /**
   * Get prompts by user ID
   */
  async getPromptsByUser(userId: string, pagination?: Pagination): Promise<PromptsListResponse> {
    return this.listPrompts({ user_id: userId }, pagination);
  }

  /**
   * Get public prompts
   */
  async getPublicPrompts(pagination?: Pagination): Promise<PromptsListResponse> {
    return this.listPrompts({ is_public: true }, pagination);
  }

  /**
   * Get favorite prompts for a user
   */
  async getFavoritePrompts(userId: string, pagination?: Pagination): Promise<PromptsListResponse> {
    return this.listPrompts({ user_id: userId, is_favorite: true }, pagination);
  }

  /**
   * Get prompts by category
   */
  async getPromptsByCategory(category: string, pagination?: Pagination): Promise<PromptsListResponse> {
    return this.listPrompts({ category }, pagination);
  }

  /**
   * Get prompts by tags
   */
  async getPromptsByTags(tags: string[], pagination?: Pagination): Promise<PromptsListResponse> {
    return this.listPrompts({ tags }, pagination);
  }

  /**
   * Search prompts
   */
  async searchPrompts(searchTerm: string, pagination?: Pagination): Promise<PromptsListResponse> {
    return this.listPrompts({ search: searchTerm }, pagination);
  }

  /**
   * Increment usage count for a prompt
   */
  async incrementUsageCount(id: string): Promise<Prompt> {
    const { error } = await supabase.rpc('increment_prompt_usage', { prompt_id: id });

    if (error) {
      throw new Error(`Failed to increment usage count: ${error.message}`);
    }

    // Get the updated prompt
    const updatedPrompt = await this.getPrompt(id);
    if (!updatedPrompt) {
      throw new Error('Prompt not found after usage count increment');
    }

    return updatedPrompt;
  }

  /**
   * Update rating for a prompt
   */
  async updateRating(id: string, rating: number): Promise<Prompt> {
    if (rating < 0 || rating > 5) {
      throw new Error('Rating must be between 0 and 5');
    }

    const { data, error } = await supabase
      .from('prompts')
      .update({ 
        rating,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update rating: ${error.message}`);
    }

    if (!data) {
      throw new Error('No data returned from rating update');
    }

    return validatePrompt(data);
  }

  /**
   * Toggle favorite status for a prompt
   */
  async toggleFavorite(id: string): Promise<Prompt> {
    const { error } = await supabase.rpc('toggle_prompt_favorite', { prompt_id: id });

    if (error) {
      throw new Error(`Failed to toggle favorite: ${error.message}`);
    }

    // Get the updated prompt
    const updatedPrompt = await this.getPrompt(id);
    if (!updatedPrompt) {
      throw new Error('Prompt not found after favorite toggle');
    }

    return updatedPrompt;
  }

  /**
   * Duplicate a prompt
   */
  async duplicatePrompt(id: string, updates: Partial<CreatePrompt> = {}): Promise<Prompt> {
    const originalPrompt = await this.getPrompt(id);
    
    if (!originalPrompt) {
      throw new Error('Prompt not found');
    }

    const duplicateData: CreatePrompt = {
      title: `${originalPrompt.title} (Copy)`,
      content: originalPrompt.content,
      category: originalPrompt.category,
      category_id: originalPrompt.category_id,
      tags: originalPrompt.tags,
      is_public: false, // Duplicates are private by default
      user_id: originalPrompt.user_id,
      last_used_at: null,
      rating: null,
      description: originalPrompt.description,
      model_compatibility: originalPrompt.model_compatibility,
      parameters: originalPrompt.parameters,
      is_favorite: false,
      folder_id: originalPrompt.folder_id,
      parent_id: originalPrompt.id, // Link to original
      is_template: originalPrompt.is_template,
      template_variables: originalPrompt.template_variables,
      ...updates
    };

    return this.createPrompt(duplicateData);
  }

  /**
   * Get prompt templates
   */
  async getTemplates(pagination?: Pagination): Promise<PromptsListResponse> {
    return this.listPrompts({ is_template: true }, pagination);
  }

  /**
   * Get prompt versions (children of a parent prompt)
   */
  async getPromptVersions(parentId: string, pagination?: Pagination): Promise<PromptsListResponse> {
    return this.listPrompts({ parent_id: parentId }, pagination);
  }

  /**
   * Get prompts with filters and pagination (alias for listPrompts for test compatibility)
   */
  async getPrompts(filters: PromptFilters = {}, pagination: Pagination = { page: 1, limit: 10, sort_by: 'created_at', sort_order: 'desc' }): Promise<PromptsListResponse> {
    return this.listPrompts(filters, pagination);
  }

  /**
   * Get prompt by ID (alias for getPrompt for test compatibility)
   */
  async getPromptById(id: string): Promise<Prompt | null> {
    return this.getPrompt(id);
  }

  /**
   * Increment usage (alias for incrementUsageCount for test compatibility)
   */
  async incrementUsage(id: string): Promise<Prompt> {
    return this.incrementUsageCount(id);
  }
}

// Export singleton instance
export const promptService = PromptService.getInstance();
