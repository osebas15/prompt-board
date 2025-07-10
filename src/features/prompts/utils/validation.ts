import { z } from 'zod';

// Base prompt validation schema
export const PromptSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1, 'Title is required').max(255, 'Title must be less than 255 characters'),
  content: z.string().min(1, 'Content is required').max(10000, 'Content must be less than 10000 characters'),
  category: z.string().nullable().default(null),
  category_id: z.string().uuid().nullable().default(null),
  tags: z.array(z.string().max(30, 'Tag must be less than 30 characters')).nullable().default(null),
  is_public: z.boolean().nullable().default(false),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  user_id: z.string().uuid(),
  usage_count: z.number().int().min(0).nullable().default(0),
  last_used_at: z.string().datetime().nullable().default(null),
  rating: z.number().min(0).max(5).nullable().default(null),
  description: z.string().max(500, 'Description must be less than 500 characters').nullable().default(null),
  model_compatibility: z.array(z.string()).nullable().default(null),
  parameters: z.record(z.any()).nullable().default(null),
  is_favorite: z.boolean().nullable().default(false),
  folder_id: z.string().uuid().nullable().default(null),
  version: z.number().int().min(1).nullable().default(1),
  parent_id: z.string().uuid().nullable().default(null),
  is_template: z.boolean().nullable().default(false),
  template_variables: z.array(z.string()).nullable().default(null)
});

// Schema for creating new prompts (without generated fields)
export const CreatePromptSchema = PromptSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
  usage_count: true,
  version: true
});

// Schema for updating prompts (all fields optional except those that shouldn't be changed)
export const UpdatePromptSchema = PromptSchema.partial().omit({
  id: true,
  created_at: true,
  user_id: true
});

// Schema for prompt filters/search
export const PromptFiltersSchema = z.object({
  category: z.string().optional(),
  category_id: z.string().uuid().optional(),
  tags: z.array(z.string()).optional(),
  is_public: z.boolean().optional(),
  is_favorite: z.boolean().optional(),
  folder_id: z.string().uuid().optional(),
  parent_id: z.string().uuid().optional(),
  is_template: z.boolean().optional(),
  search: z.string().optional(),
  user_id: z.string().uuid().optional(),
  model_compatibility: z.array(z.string()).optional(),
  rating_min: z.number().min(0).max(5).optional(),
  rating_max: z.number().min(0).max(5).optional(),
  created_after: z.string().datetime().optional(),
  created_before: z.string().datetime().optional(),
  updated_after: z.string().datetime().optional(),
  updated_before: z.string().datetime().optional()
});

// Schema for pagination
export const PaginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(10),
  sort_by: z.enum(['created_at', 'updated_at', 'title', 'usage_count', 'rating']).default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc')
});

// Combined schema for listing prompts with filters and pagination
export const ListPromptsSchema = z.object({
  filters: PromptFiltersSchema.optional(),
  pagination: PaginationSchema.optional()
});

// Schema for API responses
export const PromptResponseSchema = z.object({
  data: PromptSchema,
  success: z.boolean().default(true),
  message: z.string().optional()
});

export const PromptsListResponseSchema = z.object({
  data: z.array(PromptSchema),
  pagination: z.object({
    page: z.number().int(),
    limit: z.number().int(),
    total: z.number().int(),
    total_pages: z.number().int(),
    has_next: z.boolean(),
    has_prev: z.boolean()
  }),
  success: z.boolean().default(true),
  message: z.string().optional()
});

// Error schema
export const ErrorResponseSchema = z.object({
  error: z.string(),
  message: z.string(),
  success: z.boolean().default(false),
  code: z.string().optional()
});

// Type exports
export type Prompt = z.infer<typeof PromptSchema>;
export type CreatePrompt = z.infer<typeof CreatePromptSchema>;
export type UpdatePrompt = z.infer<typeof UpdatePromptSchema>;
export type PromptFilters = z.infer<typeof PromptFiltersSchema>;
export type Pagination = z.infer<typeof PaginationSchema>;
export type ListPromptsParams = z.infer<typeof ListPromptsSchema>;
export type PromptResponse = z.infer<typeof PromptResponseSchema>;
export type PromptsListResponse = z.infer<typeof PromptsListResponseSchema>;
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;

// Export individual schemas with both upper and lower case names for compatibility
export const createPromptSchema = CreatePromptSchema;
export const updatePromptSchema = UpdatePromptSchema;
export const promptFiltersSchema = PromptFiltersSchema;
export const validatePrompt = (data: unknown): Prompt => {
  return PromptSchema.parse(data);
};

export const validateCreatePrompt = (data: unknown): CreatePrompt => {
  return CreatePromptSchema.parse(data);
};

export const validateUpdatePrompt = (data: unknown): UpdatePrompt => {
  return UpdatePromptSchema.parse(data);
};

export const validatePromptFilters = (data: unknown): PromptFilters => {
  return PromptFiltersSchema.parse(data);
};

export const validatePagination = (data: unknown): Pagination => {
  return PaginationSchema.parse(data);
};

export const validateListPromptsParams = (data: unknown): ListPromptsParams => {
  return ListPromptsSchema.parse(data);
};

// Safe validation functions (return success/error instead of throwing)
export const safeValidatePrompt = (data: unknown) => {
  return PromptSchema.safeParse(data);
};

export const safeValidateCreatePrompt = (data: unknown) => {
  return CreatePromptSchema.safeParse(data);
};

export const safeValidateUpdatePrompt = (data: unknown) => {
  return UpdatePromptSchema.safeParse(data);
};
