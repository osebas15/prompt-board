import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import { WorkflowStorage } from '../services/WorkflowStorage';
import { supabase } from '../../../lib/supabase';
import type { Workflow, WorkflowExecution, WorkflowTemplate } from '../types';
import { v4 as uuidv4 } from 'uuid';

describe.skip('WorkflowStorage Integration Tests', () => {
  let storage: WorkflowStorage;
  let testUserId: string;
  let createdWorkflowIds: string[] = [];
  let createdExecutionIds: string[] = [];
  let createdTemplateIds: string[] = [];

  beforeAll(async () => {
    // Verify Supabase client is properly initialized
    if (!supabase) {
      throw new Error('Supabase client is not initialized');
    }

    if (!supabase.auth) {
      throw new Error('Supabase auth is not available');
    }

    // Wait a bit for the client to be fully initialized
    await new Promise(resolve => setTimeout(resolve, 1000));

    try {
      // Create a test user for our integration tests
      console.log('🧪 Creating test user for integration tests...');
      const email = `workflow-test-${Date.now()}@example.com`;
      console.log('📧 Using email:', email);
      
      const signUpResponse = await supabase.auth.signUp({
        email,
        password: 'test-password-123',
      });

      console.log('📝 SignUp response:', signUpResponse);

      // Check if the response is defined
      if (!signUpResponse) {
        throw new Error('SignUp response is undefined - check if Supabase is running locally');
      }

      const { data: authData, error: authError } = signUpResponse;

      if (authError) {
        console.error('❌ Auth error:', authError);
        throw new Error(`Failed to create test user: ${authError.message}`);
      }

      if (!authData || !authData.user) {
        console.error('❌ No user data in response:', authData);
        throw new Error('No user data returned from signUp');
      }

      testUserId = authData.user.id;
      console.log('✅ Test user created with ID:', testUserId);
    } catch (error) {
      console.error('❌ Error in beforeAll:', error);
      throw error;
    }
  }, 30000); // Increase timeout to 30 seconds

  beforeEach(async () => {
    storage = new WorkflowStorage();
    
    // Clear any existing test data
    createdWorkflowIds = [];
    createdExecutionIds = [];
    createdTemplateIds = [];
  });

  afterEach(async () => {
    // Clean up created test data
    try {
      // Clean up workflow executions first (due to foreign key constraints)
      if (createdExecutionIds.length > 0) {
        await supabase
          .from('workflow_executions')
          .delete()
          .in('id', createdExecutionIds);
      }

      // Clean up workflows
      if (createdWorkflowIds.length > 0) {
        await supabase
          .from('workflows')
          .delete()
          .in('id', createdWorkflowIds);
      }

      // Clean up templates
      if (createdTemplateIds.length > 0) {
        await supabase
          .from('workflow_templates')
          .delete()
          .in('id', createdTemplateIds);
      }
    } catch (error) {
      console.warn('Cleanup failed:', error);
    }
  });

  afterAll(async () => {
    // Cleanup test user (if admin functions are available)
    if (testUserId) {
      try {
        await supabase.auth.admin.deleteUser(testUserId);
      } catch (error) {
        // Admin functions might not be available in local setup, that's okay
        console.warn('Could not delete test user (admin functions not available):', error);
      }
    }
  });

  describe('Workflow CRUD Operations', () => {
    it('should save and load a workflow', async () => {
      const workflow: Workflow = {
        id: uuidv4(),
        user_id: testUserId,
        name: 'Test Workflow',
        description: 'A test workflow for integration testing',
        steps: [
          {
            id: 'step-1',
            type: 'variable',
            name: 'Set Variable',
            config: {
              variableName: 'testVar',
              variableValue: 'testValue',
            },
            position: { x: 0, y: 0 },
            connections: [],
          },
        ],
        variables: { testVar: 'testValue' },
        is_active: true,
        is_template: false,
        tags: ['integration', 'test'],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        run_count: 0,
      };

      createdWorkflowIds.push(workflow.id);

      // Save workflow
      const savedWorkflow = await storage.saveWorkflow(workflow);
      expect(savedWorkflow).toMatchObject({
        id: workflow.id,
        user_id: workflow.user_id,
        name: workflow.name,
        description: workflow.description,
        is_active: workflow.is_active,
      });

      // Load workflow
      const loadedWorkflow = await storage.loadWorkflow(workflow.id);
      expect(loadedWorkflow).toMatchObject({
        id: workflow.id,
        user_id: workflow.user_id,
        name: workflow.name,
        description: workflow.description,
        steps: workflow.steps,
        variables: workflow.variables,
        is_active: workflow.is_active,
        tags: workflow.tags,
      });
    });

    it('should load workflows by user', async () => {
      const workflow1: Workflow = {
        id: uuidv4(),
        user_id: testUserId,
        name: 'Test Workflow 1',
        description: 'First test workflow',
        steps: [],
        variables: {},
        is_active: true,
        is_template: false,
        tags: ['test'],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        run_count: 0,
      };

      const workflow2: Workflow = {
        id: uuidv4(),
        user_id: testUserId,
        name: 'Test Workflow 2',
        description: 'Second test workflow',
        steps: [],
        variables: {},
        is_active: false,
        is_template: false,
        tags: ['test'],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        run_count: 0,
      };

      createdWorkflowIds.push(workflow1.id, workflow2.id);

      // Save both workflows
      await storage.saveWorkflow(workflow1);
      await storage.saveWorkflow(workflow2);

      // Load workflows by user
      const userWorkflows = await storage.loadWorkflowsByUser(testUserId);
      
      expect(userWorkflows).toHaveLength(2);
      expect(userWorkflows.map(w => w.id)).toContain(workflow1.id);
      expect(userWorkflows.map(w => w.id)).toContain(workflow2.id);
      
      // Should be ordered by created_at desc (most recent first)
      expect(userWorkflows[0].created_at).toBeDefined();
    });

    it('should update a workflow', async () => {
      const workflow: Workflow = {
        id: uuidv4(),
        user_id: testUserId,
        name: 'Original Name',
        description: 'Original description',
        steps: [],
        variables: {},
        is_active: true,
        is_template: false,
        tags: ['original'],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        run_count: 0,
      };

      createdWorkflowIds.push(workflow.id);

      // Save original workflow
      await storage.saveWorkflow(workflow);

      // Update workflow
      const updates = {
        name: 'Updated Name',
        description: 'Updated description',
        is_active: false,
        tags: ['updated', 'test'],
      };

      const updatedWorkflow = await storage.updateWorkflow(workflow.id, updates);

      expect(updatedWorkflow).toMatchObject({
        id: workflow.id,
        name: 'Updated Name',
        description: 'Updated description',
        is_active: false,
        tags: ['updated', 'test'],
      });
      expect(new Date(updatedWorkflow.updated_at).getTime()).toBeGreaterThan(
        new Date(workflow.updated_at).getTime()
      );
    });

    it('should delete a workflow', async () => {
      const workflow: Workflow = {
        id: uuidv4(),
        user_id: testUserId,
        name: 'To Be Deleted',
        description: 'This workflow will be deleted',
        steps: [],
        variables: {},
        is_active: true,
        is_template: false,
        tags: ['delete-test'],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        run_count: 0,
      };

      createdWorkflowIds.push(workflow.id);

      // Save workflow
      await storage.saveWorkflow(workflow);

      // Verify it exists
      const loadedWorkflow = await storage.loadWorkflow(workflow.id);
      expect(loadedWorkflow.id).toBe(workflow.id);

      // Delete workflow
      await storage.deleteWorkflow(workflow.id);

      // Remove from cleanup list since it's deleted
      createdWorkflowIds = createdWorkflowIds.filter(id => id !== workflow.id);

      // Verify it's deleted
      await expect(storage.loadWorkflow(workflow.id)).rejects.toThrow();
    });
  });

  describe('Workflow Execution Operations', () => {
    it('should save and load workflow executions', async () => {
      // First create a workflow
      const workflow: Workflow = {
        id: uuidv4(),
        user_id: testUserId,
        name: 'Execution Test Workflow',
        description: 'For testing executions',
        steps: [],
        variables: {},
        is_active: true,
        is_template: false,
        tags: ['execution-test'],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        run_count: 0,
      };

      createdWorkflowIds.push(workflow.id);
      await storage.saveWorkflow(workflow);

      // Create execution
      const execution: WorkflowExecution = {
        id: uuidv4(),
        workflow_id: workflow.id,
        status: 'running',
        started_at: new Date().toISOString(),
        steps_completed: 0,
        total_steps: 2,
        results: { step1: 'completed' },
      };

      createdExecutionIds.push(execution.id);

      // Save execution
      const savedExecution = await storage.saveWorkflowExecution(execution);
      expect(savedExecution).toMatchObject({
        id: execution.id,
        workflow_id: execution.workflow_id,
        status: execution.status,
        steps_completed: execution.steps_completed,
        total_steps: execution.total_steps,
      });

      // Load executions for workflow
      const executions = await storage.loadWorkflowExecutions(workflow.id);
      expect(executions).toHaveLength(1);
      expect(executions[0].id).toBe(execution.id);
    });

    it('should update workflow execution status', async () => {
      // Create workflow and execution
      const workflow: Workflow = {
        id: uuidv4(),
        user_id: testUserId,
        name: 'Update Execution Test',
        description: 'For testing execution updates',
        steps: [],
        variables: {},
        is_active: true,
        is_template: false,
        tags: ['update-test'],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        run_count: 0,
      };

      createdWorkflowIds.push(workflow.id);
      await storage.saveWorkflow(workflow);

      const execution: WorkflowExecution = {
        id: uuidv4(),
        workflow_id: workflow.id,
        status: 'running',
        started_at: new Date().toISOString(),
        steps_completed: 1,
        total_steps: 3,
        results: {},
      };

      createdExecutionIds.push(execution.id);
      await storage.saveWorkflowExecution(execution);

      // Update execution
      const updates = {
        status: 'completed' as const,
        completed_at: new Date().toISOString(),
        steps_completed: 3,
        results: { final: 'success' },
      };

      const updatedExecution = await storage.updateWorkflowExecution(execution.id, updates);
      
      expect(updatedExecution).toMatchObject({
        id: execution.id,
        status: 'completed',
        steps_completed: 3,
        results: { final: 'success' },
      });
      expect(updatedExecution.completed_at).toBeDefined();
    });
  });

  describe('Workflow Template Operations', () => {
    it('should save and load workflow templates', async () => {
      const template: WorkflowTemplate = {
        id: uuidv4(),
        name: 'Basic Automation Template',
        description: 'A basic template for workflow automation',
        category: 'General',
        steps: [
          {
            type: 'variable',
            name: 'Initialize Variable',
            config: {
              variableName: 'input',
              variableValue: '',
            },
            position: { x: 100, y: 100 },
            connections: [],
          },
        ],
        variables: {
          input: { type: 'string', required: true },
        },
        tags: ['basic', 'automation'],
      };

      createdTemplateIds.push(template.id);

      // Save template
      const savedTemplate = await storage.saveWorkflowTemplate(template);
      expect(savedTemplate).toMatchObject({
        id: template.id,
        name: template.name,
        description: template.description,
        category: template.category,
      });

      // Load all templates
      const templates = await storage.loadWorkflowTemplates();
      const ourTemplate = templates.find(t => t.id === template.id);
      expect(ourTemplate).toBeDefined();
      expect(ourTemplate!.name).toBe(template.name);

      // Load templates by category
      const generalTemplates = await storage.loadWorkflowTemplatesByCategory('General');
      const ourCategoryTemplate = generalTemplates.find(t => t.id === template.id);
      expect(ourCategoryTemplate).toBeDefined();
    });

    it('should create workflow from template', async () => {
      const template: WorkflowTemplate = {
        id: uuidv4(),
        name: 'Variable Template',
        description: 'Template with variable substitution',
        category: 'Testing',
        steps: [
          {
            type: 'variable',
            name: 'Set Dynamic Variable',
            config: {
              variableName: 'dynamicVar',
              variableValue: '',
            },
            position: { x: 0, y: 0 },
            connections: [],
          },
        ],
        variables: {
          dynamicVar: { type: 'string', required: true },
        },
        tags: ['dynamic', 'template'],
      };

      createdTemplateIds.push(template.id);
      await storage.saveWorkflowTemplate(template);

      // Create workflow from template
      const variables = { dynamicVar: 'test-value' };
      const workflowFromTemplate = await storage.createWorkflowFromTemplate(
        template,
        testUserId,
        'Generated Workflow',
        variables
      );

      expect(workflowFromTemplate).toMatchObject({
        user_id: testUserId,
        name: 'Generated Workflow',
        description: template.description,
        is_active: true,
        is_template: false,
        variables: variables,
        tags: template.tags,
      });

      expect(workflowFromTemplate.steps).toHaveLength(1);
      expect(workflowFromTemplate.steps[0].id).toBeDefined();
      expect(workflowFromTemplate.steps[0].config.variableValue).toBe('test-value');
    });
  });

  describe('Search and Analytics', () => {
    it('should search workflows by name', async () => {
      const workflow1: Workflow = {
        id: uuidv4(),
        user_id: testUserId,
        name: 'Searchable Workflow Alpha',
        description: 'First searchable workflow',
        steps: [],
        variables: {},
        is_active: true,
        is_template: false,
        tags: ['search'],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        run_count: 0,
      };

      const workflow2: Workflow = {
        id: uuidv4(),
        user_id: testUserId,
        name: 'Another Alpha Workflow',
        description: 'Second searchable workflow',
        steps: [],
        variables: {},
        is_active: true,
        is_template: false,
        tags: ['search'],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        run_count: 0,
      };

      createdWorkflowIds.push(workflow1.id, workflow2.id);
      await storage.saveWorkflow(workflow1);
      await storage.saveWorkflow(workflow2);

      // Search for workflows containing "Alpha"
      const searchResults = await storage.searchWorkflows(testUserId, 'Alpha');
      
      expect(searchResults).toHaveLength(2);
      expect(searchResults.map(w => w.id)).toContain(workflow1.id);
      expect(searchResults.map(w => w.id)).toContain(workflow2.id);
    });

    it('should filter workflows by tags', async () => {
      const workflow1: Workflow = {
        id: uuidv4(),
        user_id: testUserId,
        name: 'Tagged Workflow 1',
        description: 'Workflow with automation tag',
        steps: [],
        variables: {},
        is_active: true,
        is_template: false,
        tags: ['automation', 'production'],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        run_count: 0,
      };

      const workflow2: Workflow = {
        id: uuidv4(),
        user_id: testUserId,
        name: 'Tagged Workflow 2',
        description: 'Workflow with different tags',
        steps: [],
        variables: {},
        is_active: true,
        is_template: false,
        tags: ['testing', 'development'],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        run_count: 0,
      };

      createdWorkflowIds.push(workflow1.id, workflow2.id);
      await storage.saveWorkflow(workflow1);
      await storage.saveWorkflow(workflow2);

      // Filter by automation tag
      const automationWorkflows = await storage.getWorkflowsByTags(testUserId, ['automation']);
      expect(automationWorkflows).toHaveLength(1);
      expect(automationWorkflows[0].id).toBe(workflow1.id);

      // Filter by testing tag
      const testingWorkflows = await storage.getWorkflowsByTags(testUserId, ['testing']);
      expect(testingWorkflows).toHaveLength(1);
      expect(testingWorkflows[0].id).toBe(workflow2.id);
    });

    it('should generate workflow statistics', async () => {
      // Create workflows
      const activeWorkflow: Workflow = {
        id: uuidv4(),
        user_id: testUserId,
        name: 'Active Workflow',
        description: 'An active workflow',
        steps: [],
        variables: {},
        is_active: true,
        is_template: false,
        tags: ['stats'],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        run_count: 0,
      };

      const inactiveWorkflow: Workflow = {
        id: uuidv4(),
        user_id: testUserId,
        name: 'Inactive Workflow',
        description: 'An inactive workflow',
        steps: [],
        variables: {},
        is_active: false,
        is_template: false,
        tags: ['stats'],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        run_count: 0,
      };

      createdWorkflowIds.push(activeWorkflow.id, inactiveWorkflow.id);
      await storage.saveWorkflow(activeWorkflow);
      await storage.saveWorkflow(inactiveWorkflow);

      // Create executions
      const successfulExecution: WorkflowExecution = {
        id: uuidv4(),
        workflow_id: activeWorkflow.id,
        status: 'completed',
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        steps_completed: 1,
        total_steps: 1,
        results: {},
      };

      const failedExecution: WorkflowExecution = {
        id: uuidv4(),
        workflow_id: activeWorkflow.id,
        status: 'failed',
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        steps_completed: 0,
        total_steps: 1,
        results: {},
        error: 'Test error',
      };

      createdExecutionIds.push(successfulExecution.id, failedExecution.id);
      await storage.saveWorkflowExecution(successfulExecution);
      await storage.saveWorkflowExecution(failedExecution);

      // Get statistics
      const stats = await storage.getWorkflowStats(testUserId);

      expect(stats).toMatchObject({
        totalWorkflows: 2,
        activeWorkflows: 1,
        totalExecutions: 2,
        successfulExecutions: 1,
        failedExecutions: 1,
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle workflow not found', async () => {
      await expect(storage.loadWorkflow('non-existent-workflow')).rejects.toThrow();
    });

    it('should handle execution not found for update', async () => {
      await expect(
        storage.updateWorkflowExecution('non-existent-execution', { status: 'completed' })
      ).rejects.toThrow();
    });

    it('should handle invalid workflow data gracefully', async () => {
      const invalidWorkflow = {
        // Missing required fields
        name: 'Invalid Workflow',
      } as any;

      await expect(storage.saveWorkflow(invalidWorkflow)).rejects.toThrow();
    });
  });
});
