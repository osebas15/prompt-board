import { supabase } from '../../../lib/supabase';
import type { Workflow, WorkflowExecution, WorkflowTemplate, WorkflowVariables } from '../types';
import { v4 as uuidv4 } from 'uuid';

export class WorkflowStorage {
  // Workflow CRUD operations
  async saveWorkflow(workflow: Workflow): Promise<Workflow> {
    try {
      const { data, error } = await supabase
        .from('workflows')
        .insert({
          id: workflow.id,
          user_id: workflow.user_id,
          name: workflow.name,
          description: workflow.description,
          steps: workflow.steps,
          variables: workflow.variables,
          is_active: workflow.is_active,
          is_template: workflow.is_template,
          schedule: workflow.schedule,
          tags: workflow.tags,
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to save workflow: ${error.message}`);
      }

      return data as Workflow;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Unknown error occurred while saving workflow');
    }
  }

  async loadWorkflow(id: string): Promise<Workflow> {
    try {
      const { data, error } = await supabase
        .from('workflows')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        throw new Error(`Failed to load workflow: ${error.message}`);
      }

      if (!data) {
        throw new Error('Workflow not found');
      }

      return data as Workflow;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Unknown error occurred while loading workflow');
    }
  }

  async loadWorkflowsByUser(userId: string): Promise<Workflow[]> {
    try {
      const { data, error } = await supabase
        .from('workflows')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to load workflows: ${error.message}`);
      }

      return (data || []) as Workflow[];
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Unknown error occurred while loading workflows');
    }
  }

  async updateWorkflow(id: string, updates: Partial<Workflow>): Promise<Workflow> {
    try {
      const { data, error } = await supabase
        .from('workflows')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update workflow: ${error.message}`);
      }

      if (!data) {
        throw new Error('Workflow not found');
      }

      return data as Workflow;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Unknown error occurred while updating workflow');
    }
  }

  async deleteWorkflow(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('workflows')
        .delete()
        .eq('id', id);

      if (error) {
        throw new Error(`Failed to delete workflow: ${error.message}`);
      }
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Unknown error occurred while deleting workflow');
    }
  }

  // Workflow execution operations
  async saveWorkflowExecution(execution: WorkflowExecution): Promise<WorkflowExecution> {
    try {
      const { data, error } = await supabase
        .from('workflow_executions')
        .insert({
          id: execution.id,
          workflow_id: execution.workflow_id,
          status: execution.status,
          started_at: execution.started_at,
          completed_at: execution.completed_at,
          steps_completed: execution.steps_completed,
          total_steps: execution.total_steps,
          results: execution.results,
          error: execution.error,
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to save workflow execution: ${error.message}`);
      }

      return data as WorkflowExecution;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Unknown error occurred while saving workflow execution');
    }
  }

  async loadWorkflowExecutions(workflowId: string, limit = 100): Promise<WorkflowExecution[]> {
    try {
      const { data, error } = await supabase
        .from('workflow_executions')
        .select('*')
        .eq('workflow_id', workflowId)
        .order('started_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw new Error(`Failed to load workflow executions: ${error.message}`);
      }

      return (data || []) as WorkflowExecution[];
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Unknown error occurred while loading workflow executions');
    }
  }

  async updateWorkflowExecution(id: string, updates: Partial<WorkflowExecution>): Promise<WorkflowExecution> {
    try {
      const { data, error } = await supabase
        .from('workflow_executions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update workflow execution: ${error.message}`);
      }

      if (!data) {
        throw new Error('Workflow execution not found');
      }

      return data as WorkflowExecution;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Unknown error occurred while updating workflow execution');
    }
  }

  // Workflow template operations
  async saveWorkflowTemplate(template: WorkflowTemplate): Promise<WorkflowTemplate> {
    try {
      const { data, error } = await supabase
        .from('workflow_templates')
        .insert(template)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to save workflow template: ${error.message}`);
      }

      return data as WorkflowTemplate;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Unknown error occurred while saving workflow template');
    }
  }

  async loadWorkflowTemplates(): Promise<WorkflowTemplate[]> {
    try {
      const { data, error } = await supabase
        .from('workflow_templates')
        .select('*')
        .order('name');

      if (error) {
        throw new Error(`Failed to load workflow templates: ${error.message}`);
      }

      return (data || []) as WorkflowTemplate[];
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Unknown error occurred while loading workflow templates');
    }
  }

  async loadWorkflowTemplatesByCategory(category: string): Promise<WorkflowTemplate[]> {
    try {
      const { data, error } = await supabase
        .from('workflow_templates')
        .select('*')
        .eq('category', category)
        .order('name');

      if (error) {
        throw new Error(`Failed to load workflow templates: ${error.message}`);
      }

      return (data || []) as WorkflowTemplate[];
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Unknown error occurred while loading workflow templates');
    }
  }

  async createWorkflowFromTemplate(
    template: WorkflowTemplate,
    userId: string,
    name: string,
    variables: WorkflowVariables = {}
  ): Promise<Workflow> {
    // Generate unique IDs for steps
    const stepsWithIds = template.steps.map((step) => ({
      ...step,
      id: `step-${uuidv4()}`,
      config: {
        ...step.config,
        // If step has a variable placeholder, replace with actual value
        ...(step.config.variableName && variables[step.config.variableName] ? {
          variableValue: variables[step.config.variableName]
        } : {})
      }
    }));

    const workflow: Workflow = {
      id: uuidv4(),
      user_id: userId,
      name,
      description: template.description,
      steps: stepsWithIds,
      variables,
      is_active: true,
      is_template: false,
      tags: [...template.tags],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      run_count: 0,
    };

    return workflow;
  }

  // Search and filtering operations
  async searchWorkflows(userId: string, query: string): Promise<Workflow[]> {
    try {
      const { data, error } = await supabase
        .from('workflows')
        .select('*')
        .eq('user_id', userId)
        .ilike('name', `%${query}%`)
        .order('updated_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to search workflows: ${error.message}`);
      }

      return (data || []) as Workflow[];
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Unknown error occurred while searching workflows');
    }
  }

  async getWorkflowsByTags(userId: string, tags: string[]): Promise<Workflow[]> {
    try {
      const { data, error } = await supabase
        .from('workflows')
        .select('*')
        .eq('user_id', userId)
        .contains('tags', tags)
        .order('updated_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to get workflows by tags: ${error.message}`);
      }

      return (data || []) as Workflow[];
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Unknown error occurred while getting workflows by tags');
    }
  }

  // Analytics and statistics
  async getWorkflowStats(userId: string): Promise<{
    totalWorkflows: number;
    activeWorkflows: number;
    totalExecutions: number;
    successfulExecutions: number;
    failedExecutions: number;
  }> {
    try {
      // Get workflows first
      const { data: workflows, error: workflowsError } = await supabase
        .from('workflows')
        .select('id, is_active')
        .eq('user_id', userId);

      if (workflowsError) {
        throw new Error(`Failed to get workflow stats: ${workflowsError.message}`);
      }

      const workflowIds = (workflows || []).map(w => w.id);
      
      // Get executions for these workflows
      let executions: { status: string }[] = [];
      if (workflowIds.length > 0) {
        const { data: executionsData, error: executionsError } = await supabase
          .from('workflow_executions')
          .select('status')
          .in('workflow_id', workflowIds);

        if (executionsError) {
          throw new Error(`Failed to get execution stats: ${executionsError.message}`);
        }

        executions = executionsData || [];
      }

      return {
        totalWorkflows: workflows?.length || 0,
        activeWorkflows: workflows?.filter(w => w.is_active).length || 0,
        totalExecutions: executions.length,
        successfulExecutions: executions.filter(e => e.status === 'completed').length,
        failedExecutions: executions.filter(e => e.status === 'failed').length,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Unknown error occurred while getting workflow stats');
    }
  }
}
