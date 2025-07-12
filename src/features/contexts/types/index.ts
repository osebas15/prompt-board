// Context management types
export interface Context {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  color: string;
  icon: string;
  settings: ContextSettings;
  is_default: boolean;
  is_archived: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface ContextSettings {
  auto_save?: boolean;
  default_model?: string;
  default_temperature?: number;
  max_tokens?: number;
  system_prompt?: string;
  tags?: string[];
}

export interface ContextFile {
  id: string;
  context_id: string;
  file_name: string;
  file_size?: number;
  file_type?: string;
  file_url?: string;
  file_content?: string;
  metadata: Record<string, any>;
  uploaded_at: string;
}

export interface ContextPrompt {
  id: string;
  context_id: string;
  prompt_id: string;
  added_at: string;
  sort_order: number;
}

export interface CreateContextData {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  settings?: Partial<ContextSettings>;
}

export interface UpdateContextData {
  name?: string;
  description?: string;
  color?: string;
  icon?: string;
  settings?: Partial<ContextSettings>;
  is_archived?: boolean;
  is_default?: boolean;
  sort_order?: number;
}

export interface ContextState {
  currentContext: Context | null;
  contexts: Context[];
  loading: boolean;
  error: string | null;
}
