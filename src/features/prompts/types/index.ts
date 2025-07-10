// Prompt types and interfaces
export interface Prompt {
  id: string;
  user_id: string;
  title: string;
  content: string;
  category_id?: string;
  category?: Category;
  tags: string[];
  is_public: boolean;
  usage_count: number;
  last_used_at?: string;
  version: number;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface CreatePromptData {
  title: string;
  content: string;
  category_id?: string;
  tags: string[];
  is_public?: boolean;
}

export interface UpdatePromptData {
  title?: string;
  content?: string;
  category_id?: string;
  tags?: string[];
  is_public?: boolean;
}

export interface PromptFilters {
  category_id?: string;
  tags?: string[];
  search?: string;
  is_public?: boolean;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
