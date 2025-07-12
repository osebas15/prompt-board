import { describe, it, expect, beforeEach, vi } from 'vitest';
import { WorkflowEngine } from '../services/WorkflowEngine';
import type { Workflow, WorkflowStep } from '../types';

// Mock the LLM service
vi.mock('../../../lib/llm/services/LLMService', () => ({
  llmService: {
    sendMessage: vi.fn().mockResolvedValue('Mocked LLM response'),
  },
}));

describe('WorkflowEngine', () => {
  let engine: WorkflowEngine;
  let mockWorkflow: Workflow;

  beforeEach(() => {
    engine = new WorkflowEngine();
    vi.clearAllMocks();

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
            variableName: 'userInput',
            variableValue: 'Hello World',
          },
          position: { x: 0, y: 0 },
          connections: ['step-2'],
        },
        {
          id: 'step-2',
          type: 'prompt',
          name: 'Generate Response',
          config: {
            promptTemplate: 'Respond to: {{userInput}}',
            variables: { userInput: '{{userInput}}' },
            model: 'gpt-3.5-turbo',
            temperature: 0.7,
            maxTokens: 100,
          },
          position: { x: 0, y: 100 },
          connections: [],
        },
      ],
      variables: {},
      is_active: true,
      is_template: false,
      tags: [],
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      run_count: 0,
    };
  });

  describe('executeWorkflow', () => {
    it('should execute a simple linear workflow', async () => {
      const execution = await engine.executeWorkflow(mockWorkflow);

      expect(execution.status).toBe('completed');
      expect(execution.steps_completed).toBe(2);
      expect(execution.total_steps).toBe(2);
      expect(execution.results['step-1']).toEqual({
        success: true,
        variables: { userInput: 'Hello World' },
      });
    });

    it('should handle workflow execution with variables', async () => {
      const initialVariables = { customInput: 'Test Input' };
      const execution = await engine.executeWorkflow(mockWorkflow, initialVariables);

      expect(execution.status).toBe('completed');
      expect(execution.results['step-1'].variables).toEqual({
        userInput: 'Hello World',
        customInput: 'Test Input',
      });
    });

    it('should handle workflow execution errors', async () => {
      // Create a workflow with an invalid step
      const invalidWorkflow: Workflow = {
        ...mockWorkflow,
        steps: [
          {
            id: 'invalid-step',
            type: 'prompt',
            name: 'Invalid Prompt',
            config: {
              promptTemplate: '', // Empty template should cause error
            },
            position: { x: 0, y: 0 },
            connections: [],
          },
        ],
      };

      const execution = await engine.executeWorkflow(invalidWorkflow);

      expect(execution.status).toBe('failed');
      expect(execution.error).toBeDefined();
    });

    it('should execute conditional steps correctly', async () => {
      const conditionalWorkflow: Workflow = {
        ...mockWorkflow,
        steps: [
          {
            id: 'step-1',
            type: 'variable',
            name: 'Set Score',
            config: {
              variableName: 'score',
              variableValue: '85',
            },
            position: { x: 0, y: 0 },
            connections: ['step-2'],
          },
          {
            id: 'step-2',
            type: 'condition',
            name: 'Check Score',
            config: {
              condition: '{{score}}',
              operator: 'greater',
              value: '80',
            },
            position: { x: 0, y: 100 },
            connections: ['step-3'],
          },
          {
            id: 'step-3',
            type: 'variable',
            name: 'Set Result',
            config: {
              variableName: 'result',
              variableValue: 'Pass',
            },
            position: { x: 0, y: 200 },
            connections: [],
          },
        ],
      };

      const execution = await engine.executeWorkflow(conditionalWorkflow);

      expect(execution.status).toBe('completed');
      expect(execution.steps_completed).toBe(3);
      expect(execution.results['step-3'].variables.result).toBe('Pass');
    });

    it('should skip steps when condition fails', async () => {
      const conditionalWorkflow: Workflow = {
        ...mockWorkflow,
        steps: [
          {
            id: 'step-1',
            type: 'variable',
            name: 'Set Score',
            config: {
              variableName: 'score',
              variableValue: '70',
            },
            position: { x: 0, y: 0 },
            connections: ['step-2'],
          },
          {
            id: 'step-2',
            type: 'condition',
            name: 'Check Score',
            config: {
              condition: '{{score}}',
              operator: 'greater',
              value: '80',
            },
            position: { x: 0, y: 100 },
            connections: ['step-3'],
          },
          {
            id: 'step-3',
            type: 'variable',
            name: 'Set Result',
            config: {
              variableName: 'result',
              variableValue: 'Pass',
            },
            position: { x: 0, y: 200 },
            connections: [],
          },
        ],
      };

      const execution = await engine.executeWorkflow(conditionalWorkflow);

      expect(execution.status).toBe('completed');
      expect(execution.steps_completed).toBe(2); // Only first two steps executed
      expect(execution.results['step-3']).toBeUndefined();
    });
  });

  describe('executeStep', () => {
    it('should execute variable step correctly', async () => {
      const step: WorkflowStep = {
        id: 'var-step',
        type: 'variable',
        name: 'Set Variable',
        config: {
          variableName: 'testVar',
          variableValue: 'testValue',
        },
        position: { x: 0, y: 0 },
        connections: [],
      };

      const result = await engine.executeStep(step, {});

      expect(result.success).toBe(true);
      expect(result.variables.testVar).toBe('testValue');
    });

    it('should execute delay step correctly', async () => {
      const step: WorkflowStep = {
        id: 'delay-step',
        type: 'delay',
        name: 'Wait',
        config: {
          delayMs: 100,
        },
        position: { x: 0, y: 0 },
        connections: [],
      };

      const startTime = Date.now();
      const result = await engine.executeStep(step, {});
      const endTime = Date.now();

      expect(result.success).toBe(true);
      // Allow for timing imprecision - test should pass if delay is at least 90ms
      expect(endTime - startTime).toBeGreaterThanOrEqual(90);
    });

    it('should handle step execution errors', async () => {
      const step: WorkflowStep = {
        id: 'invalid-step',
        type: 'webhook',
        name: 'Invalid Webhook',
        config: {
          url: '', // Invalid URL
          method: 'GET',
        },
        position: { x: 0, y: 0 },
        connections: [],
      };

      const result = await engine.executeStep(step, {});

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('variable interpolation', () => {
    it('should interpolate variables in templates', () => {
      const template = 'Hello {{name}}, your score is {{score}}';
      const variables = { name: 'John', score: '95' };

      const result = engine.interpolateVariables(template, variables);

      expect(result).toBe('Hello John, your score is 95');
    });

    it('should handle missing variables gracefully', () => {
      const template = 'Hello {{name}}, your score is {{missing}}';
      const variables = { name: 'John' };

      const result = engine.interpolateVariables(template, variables);

      expect(result).toBe('Hello John, your score {{missing}}');
    });

    it('should handle nested variable references', () => {
      const template = 'Value: {{{{variableName}}}}';
      const variables = { variableName: 'actualVar', actualVar: 'finalValue' };

      const result = engine.interpolateVariables(template, variables);

      expect(result).toBe('Value: finalValue');
    });
  });

  describe('condition evaluation', () => {
    it('should evaluate equals condition correctly', () => {
      expect(engine.evaluateCondition('test', 'equals', 'test')).toBe(true);
      expect(engine.evaluateCondition('test', 'equals', 'other')).toBe(false);
    });

    it('should evaluate contains condition correctly', () => {
      expect(engine.evaluateCondition('hello world', 'contains', 'world')).toBe(true);
      expect(engine.evaluateCondition('hello world', 'contains', 'xyz')).toBe(false);
    });

    it('should evaluate numeric conditions correctly', () => {
      expect(engine.evaluateCondition('10', 'greater', '5')).toBe(true);
      expect(engine.evaluateCondition('3', 'greater', '5')).toBe(false);
      expect(engine.evaluateCondition('3', 'less', '5')).toBe(true);
      expect(engine.evaluateCondition('10', 'less', '5')).toBe(false);
    });

    it('should evaluate regex condition correctly', () => {
      expect(engine.evaluateCondition('test123', 'regex', '\\d+')).toBe(true);
      expect(engine.evaluateCondition('testABC', 'regex', '\\d+')).toBe(false);
    });
  });

  describe('workflow validation', () => {
    it('should validate workflow structure', () => {
      const isValid = engine.validateWorkflow(mockWorkflow);
      expect(isValid.valid).toBe(true);
    });

    it('should detect circular dependencies', () => {
      const circularWorkflow: Workflow = {
        ...mockWorkflow,
        steps: [
          {
            id: 'step-1',
            type: 'variable',
            name: 'Step 1',
            config: { variableName: 'test', variableValue: 'value' },
            position: { x: 0, y: 0 },
            connections: ['step-2'],
          },
          {
            id: 'step-2',
            type: 'variable',
            name: 'Step 2',
            config: { variableName: 'test2', variableValue: 'value2' },
            position: { x: 0, y: 100 },
            connections: ['step-1'], // Circular reference
          },
        ],
      };

      const isValid = engine.validateWorkflow(circularWorkflow);
      expect(isValid.valid).toBe(false);
      expect(isValid.errors).toContain('Circular dependency detected');
    });

    it('should detect missing step references', () => {
      const invalidWorkflow: Workflow = {
        ...mockWorkflow,
        steps: [
          {
            id: 'step-1',
            type: 'variable',
            name: 'Step 1',
            config: { variableName: 'test', variableValue: 'value' },
            position: { x: 0, y: 0 },
            connections: ['missing-step'], // References non-existent step
          },
        ],
      };

      const isValid = engine.validateWorkflow(invalidWorkflow);
      expect(isValid.valid).toBe(false);
      expect(isValid.errors).toContain('Step "step-1" references non-existent step "missing-step"');
    });
  });
});
