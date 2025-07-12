import { describe, it, expect, beforeEach, vi } from 'vitest';
import { WorkflowStorage } from '../services/WorkflowStorage';
import type { Workflow, WorkflowExecution, WorkflowTemplate } from '../types';

// Mock Supabase
const createMockQuery = () => {
  const mockQuery = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn(),
    ilike: vi.fn().mockReturnThis(),
    contains: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
  };
  
  // These methods can also be terminal methods that return promises
  mockQuery.eq.mockReturnValue(Promise.resolve({ data: null, error: null }));
  mockQuery.order.mockReturnValue(Promise.resolve({ data: null, error: null }));
  mockQuery.limit.mockReturnValue(Promise.resolve({ data: null, error: null }));
  mockQuery.single.mockReturnValue(Promise.resolve({ data: null, error: null }));
  
  return mockQuery;
};

const mockSupabaseQuery = createMockQuery();
const mockSupabaseClient = {
  from: vi.fn(() => mockSupabaseQuery),
};

vi.mock('../../../lib/supabase', () => ({
  supabase: mockSupabaseClient,
}));

describe('WorkflowStorage', () => {
  let storage: WorkflowStorage;
  let mockWorkflow: Workflow;
  let mockExecution: WorkflowExecution;
  let mockTemplate: WorkflowTemplate;

  beforeEach(() => {
    storage = new WorkflowStorage();
    vi.clearAllMocks();
    
    // Reset mock query chain
    mockSupabaseQuery.select.mockReturnThis();
    mockSupabaseQuery.insert.mockReturnThis();
    mockSupabaseQuery.update.mockReturnThis();
    mockSupabaseQuery.delete.mockReturnThis();
    mockSupabaseQuery.eq.mockReturnThis();
    mockSupabaseQuery.order.mockReturnThis();
    mockSupabaseQuery.limit.mockReturnThis();
    mockSupabaseQuery.ilike.mockReturnThis();
    mockSupabaseQuery.contains.mockReturnThis();
    mockSupabaseQuery.in.mockReturnThis();
    
    // Reset terminal methods
    mockSupabaseQuery.eq.mockResolvedValue({ data: null, error: null });
    mockSupabaseQuery.order.mockResolvedValue({ data: null, error: null });
    mockSupabaseQuery.limit.mockResolvedValue({ data: null, error: null });
    mockSupabaseQuery.single.mockResolvedValue({ data: null, error: null });
    
    // Reset client mock
    mockSupabaseClient.from.mockReturnValue(mockSupabaseQuery);

    mockWorkflow = {
      id: 'workflow-1',
      user_id: 'user-1',
      name: 'Test Workflow',
      description: 'A test workflow',
      steps: [
        {
          id: 'step-1',
          type: 'variable',
          name: 'Set Variable',
          config: {
            variableName: 'test',
            variableValue: 'value',
          },
          position: { x: 0, y: 0 },
          connections: [],
        },
      ],
      variables: {},
      is_active: true,
      is_template: false,
      tags: ['test'],
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      run_count: 0,
    };

    mockExecution = {
      id: 'exec-1',
      workflow_id: 'workflow-1',
      status: 'completed',
      started_at: '2024-01-01T00:00:00Z',
      completed_at: '2024-01-01T00:01:00Z',
      steps_completed: 1,
      total_steps: 1,
      results: {},
    };

    mockTemplate = {
      id: 'template-1',
      name: 'Basic Template',
      description: 'A basic workflow template',
      category: 'General',
      steps: [
        {
          type: 'variable',
          name: 'Set Variable',
          config: {
            variableName: 'input',
            variableValue: '',
          },
          position: { x: 0, y: 0 },
          connections: [],
        },
      ],
      variables: {
        input: { type: 'string', required: true },
      },
      tags: ['basic', 'template'],
    };
  });

  describe('workflows', () => {
    it('should save a workflow', async () => {
      mockSupabaseQuery.single.mockResolvedValueOnce({ data: mockWorkflow, error: null });

      const result = await storage.saveWorkflow(mockWorkflow);

      expect(result).toEqual(mockWorkflow);
      expect(mockSupabaseQuery.insert).toHaveBeenCalledWith({
        id: mockWorkflow.id,
        user_id: mockWorkflow.user_id,
        name: mockWorkflow.name,
        description: mockWorkflow.description,
        steps: mockWorkflow.steps,
        variables: mockWorkflow.variables,
        is_active: mockWorkflow.is_active,
        is_template: mockWorkflow.is_template,
        schedule: mockWorkflow.schedule,
        tags: mockWorkflow.tags,
      });
    });

    it('should load a workflow by id', async () => {
      mockSupabaseQuery.single.mockResolvedValueOnce({ data: mockWorkflow, error: null });

      const result = await storage.loadWorkflow(mockWorkflow.id);

      expect(result).toEqual(mockWorkflow);
      expect(mockSupabaseQuery.select).toHaveBeenCalledWith('*');
      expect(mockSupabaseQuery.eq).toHaveBeenCalledWith('id', mockWorkflow.id);
      expect(mockSupabaseQuery.single).toHaveBeenCalled();
    });

    it('should load workflows by user', async () => {
      
      const workflows = [mockWorkflow];
      mockSupabaseQuery.eq.mockResolvedValueOnce({ data: workflows, error: null });

      const result = await storage.loadWorkflowsByUser(mockWorkflow.user_id);

      expect(result).toEqual(workflows);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('workflows');
      expect(mockSupabaseQuery.select).toHaveBeenCalledWith('*');
      expect(mockSupabaseQuery.eq).toHaveBeenCalledWith('user_id', mockWorkflow.user_id);
      expect(mockSupabaseQuery.order).toHaveBeenCalledWith('created_at', { ascending: false });
    });

    it('should update a workflow', async () => {
      const updatedWorkflow = { ...mockWorkflow, name: 'Updated Workflow' };
      
      mockSupabaseQuery.single.mockResolvedValueOnce({ data: updatedWorkflow, error: null });

      const result = await storage.updateWorkflow(mockWorkflow.id, { name: 'Updated Workflow' });

      expect(result).toEqual(updatedWorkflow);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('workflows');
      expect(mockSupabaseQuery.update).toHaveBeenCalledWith({
        name: 'Updated Workflow',
        updated_at: expect.any(String),
      });
      expect(mockSupabaseQuery.eq).toHaveBeenCalledWith('id', mockWorkflow.id);
      expect(mockSupabaseQuery.single).toHaveBeenCalled();
    });

    it('should delete a workflow', async () => {
      
      mockSupabaseQuery.eq.mockResolvedValueOnce({ data: null, error: null });

      await storage.deleteWorkflow(mockWorkflow.id);

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('workflows');
      expect(mockSupabaseQuery.delete).toHaveBeenCalled();
      expect(mockSupabaseQuery.eq).toHaveBeenCalledWith('id', mockWorkflow.id);
    });

    it('should handle workflow not found error', async () => {
      
      mockSupabaseQuery.single.mockResolvedValueOnce({ data: null, error: { message: 'Not found' } });

      await expect(storage.loadWorkflow('non-existent')).rejects.toThrow('Failed to load workflow: Not found');
    });
  });

  describe('workflow executions', () => {
    it('should save a workflow execution', async () => {
      
      mockSupabaseQuery.insert.mockResolvedValueOnce({ data: mockExecution, error: null });

      const result = await storage.saveWorkflowExecution(mockExecution);

      expect(result).toEqual(mockExecution);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('workflow_executions');
      expect(mockSupabaseQuery.insert).toHaveBeenCalledWith({
        id: mockExecution.id,
        workflow_id: mockExecution.workflow_id,
        status: mockExecution.status,
        started_at: mockExecution.started_at,
        completed_at: mockExecution.completed_at,
        steps_completed: mockExecution.steps_completed,
        total_steps: mockExecution.total_steps,
        results: mockExecution.results,
        error: mockExecution.error,
      });
    });

    it('should load workflow executions by workflow id', async () => {
      
      const executions = [mockExecution];
      mockSupabaseQuery.limit.mockResolvedValueOnce({ data: executions, error: null });

      const result = await storage.loadWorkflowExecutions(mockWorkflow.id);

      expect(result).toEqual(executions);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('workflow_executions');
      expect(mockSupabaseQuery.select).toHaveBeenCalledWith('*');
      expect(mockSupabaseQuery.eq).toHaveBeenCalledWith('workflow_id', mockWorkflow.id);
      expect(mockSupabaseQuery.order).toHaveBeenCalledWith('started_at', { ascending: false });
      expect(mockSupabaseQuery.limit).toHaveBeenCalledWith(100);
    });

    it('should update workflow execution status', async () => {
      const updatedExecution = { ...mockExecution, status: 'failed' as const };
      
      mockSupabaseQuery.single.mockResolvedValueOnce({ data: updatedExecution, error: null });

      const result = await storage.updateWorkflowExecution(mockExecution.id, { status: 'failed' });

      expect(result).toEqual(updatedExecution);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('workflow_executions');
      expect(mockSupabaseQuery.update).toHaveBeenCalledWith({ status: 'failed' });
      expect(mockSupabaseQuery.eq).toHaveBeenCalledWith('id', mockExecution.id);
      expect(mockSupabaseQuery.single).toHaveBeenCalled();
    });
  });

  describe('workflow templates', () => {
    it('should save a workflow template', async () => {
      
      mockSupabaseQuery.insert.mockResolvedValueOnce({ data: mockTemplate, error: null });

      const result = await storage.saveWorkflowTemplate(mockTemplate);

      expect(result).toEqual(mockTemplate);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('workflow_templates');
      expect(mockSupabaseQuery.insert).toHaveBeenCalledWith(mockTemplate);
    });

    it('should load workflow templates', async () => {
      
      const templates = [mockTemplate];
      mockSupabaseQuery.order.mockResolvedValueOnce({ data: templates, error: null });

      const result = await storage.loadWorkflowTemplates();

      expect(result).toEqual(templates);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('workflow_templates');
      expect(mockSupabaseQuery.select).toHaveBeenCalledWith('*');
      expect(mockSupabaseQuery.order).toHaveBeenCalledWith('name');
    });

    it('should load workflow templates by category', async () => {
      
      const templates = [mockTemplate];
      mockSupabaseQuery.order.mockResolvedValueOnce({ data: templates, error: null });

      const result = await storage.loadWorkflowTemplatesByCategory('General');

      expect(result).toEqual(templates);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('workflow_templates');
      expect(mockSupabaseQuery.select).toHaveBeenCalledWith('*');
      expect(mockSupabaseQuery.eq).toHaveBeenCalledWith('category', 'General');
      expect(mockSupabaseQuery.order).toHaveBeenCalledWith('name');
    });

    it('should create workflow from template', async () => {
      const workflowFromTemplate = await storage.createWorkflowFromTemplate(
        mockTemplate,
        'user-1',
        'My Workflow',
        { input: 'test value' }
      );

      expect(workflowFromTemplate.name).toBe('My Workflow');
      expect(workflowFromTemplate.user_id).toBe('user-1');
      expect(workflowFromTemplate.variables.input).toBe('test value');
      expect(workflowFromTemplate.steps).toHaveLength(1);
      expect(workflowFromTemplate.steps[0].id).toBeDefined();
      expect(workflowFromTemplate.steps[0].config.variableValue).toBe('test value');
    });
  });

  describe('search and filtering', () => {
    it('should search workflows by name', async () => {
      
      const workflows = [mockWorkflow];
      mockSupabaseQuery.order.mockResolvedValueOnce({ data: workflows, error: null });

      const result = await storage.searchWorkflows('user-1', 'Test');

      expect(result).toEqual(workflows);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('workflows');
      expect(mockSupabaseQuery.select).toHaveBeenCalledWith('*');
      expect(mockSupabaseQuery.eq).toHaveBeenCalledWith('user_id', 'user-1');
      expect(mockSupabaseQuery.order).toHaveBeenCalledWith('updated_at', { ascending: false });
    });

    it('should filter workflows by tags', async () => {
      
      const workflows = [mockWorkflow];
      mockSupabaseQuery.order.mockResolvedValueOnce({ data: workflows, error: null });

      const result = await storage.getWorkflowsByTags('user-1', ['test']);

      expect(result).toEqual(workflows);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('workflows');
      expect(mockSupabaseQuery.select).toHaveBeenCalledWith('*');
      expect(mockSupabaseQuery.eq).toHaveBeenCalledWith('user_id', 'user-1');
      expect(mockSupabaseQuery.order).toHaveBeenCalledWith('updated_at', { ascending: false });
    });
  });

  describe('error handling', () => {
    it('should handle database errors gracefully', async () => {
      
      mockSupabaseQuery.insert.mockResolvedValueOnce({ 
        data: null, 
        error: { message: 'Database error' } 
      });

      await expect(storage.saveWorkflow(mockWorkflow)).rejects.toThrow('Failed to save workflow: Database error');
    });

    it('should handle network errors', async () => {
      
      mockSupabaseQuery.insert.mockRejectedValueOnce(new Error('Network error'));

      await expect(storage.saveWorkflow(mockWorkflow)).rejects.toThrow('Network error');
    });
  });
});
