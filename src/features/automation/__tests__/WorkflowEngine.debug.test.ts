import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock the LLM service
vi.mock('../../../lib/llm/services/LLMService', () => ({
  llmService: {
    sendMessage: vi.fn().mockResolvedValue('Mocked LLM response'),
  },
}));

import { WorkflowEngine } from '../services/WorkflowEngine';

describe('WorkflowEngine Interpolation Debug', () => {
  let engine: WorkflowEngine;

  beforeEach(() => {
    engine = new WorkflowEngine();
    vi.clearAllMocks();
  });

  it('should debug missing variable interpolation', () => {
    const template = 'Hello {{name}}, your score is {{missing}}';
    const variables = { name: 'John' };

    const result = engine.interpolateVariables(template, variables);

    console.log('Template:', template);
    console.log('Variables:', variables);
    console.log('Result:', result);
    console.log('Expected: Hello John, your score {{missing}}');
    
    // This will help us see exactly what we're getting vs what's expected
    expect(result).toBe('Hello John, your score {{missing}}');
  });

  it('should debug nested variable interpolation', () => {
    const template = 'Value: {{{{variableName}}}}';
    const variables = { variableName: 'actualVar', actualVar: 'finalValue' };

    const result = engine.interpolateVariables(template, variables);

    console.log('Nested Template:', template);
    console.log('Nested Variables:', variables);
    console.log('Nested Result:', result);
    console.log('Nested Expected: Value: finalValue');
    
    expect(result).toBe('Value: finalValue');
  });
});
