// Automation and workflow types
export interface WorkflowStep {
  id: string;
  type: 'prompt' | 'condition' | 'variable' | 'delay' | 'webhook';
  name: string;
  config: WorkflowStepConfig;
  position: { x: number; y: number };
  connections: string[]; // IDs of connected steps
}

export interface WorkflowStepConfig {
  // Prompt step
  promptTemplate?: string;
  variables?: Record<string, string>;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  
  // Condition step
  condition?: string;
  operator?: 'equals' | 'contains' | 'greater' | 'less' | 'regex';
  value?: string;
  
  // Variable step
  variableName?: string;
  variableValue?: string;
  
  // Delay step
  delayMs?: number;
  
  // Webhook step
  url?: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: string;
}

export interface Workflow {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  steps: WorkflowStep[];
  variables: Record<string, any>;
  is_active: boolean;
  is_template: boolean;
  schedule?: string; // Cron expression
  tags: string[];
  created_at: string;
  updated_at: string;
  last_run_at?: string;
  run_count: number;
}

export interface WorkflowExecution {
  id: string;
  workflow_id: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  started_at: string;
  completed_at?: string;
  error?: string;
  steps_completed: number;
  total_steps: number;
  results: Record<string, any>;
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  steps: Omit<WorkflowStep, 'id'>[];
  variables: Record<string, { type: string; default?: any; required?: boolean }>;
  tags: string[];
}
