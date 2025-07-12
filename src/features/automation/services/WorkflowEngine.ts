import type { Workflow, WorkflowStep, WorkflowExecution } from '../types';
import { llmService } from '../../../lib/llm/services/LLMService';

export interface StepExecutionResult {
  success: boolean;
  variables: Record<string, any>;
  output?: any;
  error?: string;
}

export interface WorkflowValidationResult {
  valid: boolean;
  errors: string[];
}

export class WorkflowEngine {
  async executeWorkflow(
    workflow: Workflow,
    initialVariables: Record<string, any> = {}
  ): Promise<WorkflowExecution> {
    const execution: WorkflowExecution = {
      id: `exec-${Date.now()}`,
      workflow_id: workflow.id,
      status: 'running',
      started_at: new Date().toISOString(),
      steps_completed: 0,
      total_steps: workflow.steps.length,
      results: {},
    };

    try {
      // Validate workflow before execution
      const validation = this.validateWorkflow(workflow);
      if (!validation.valid) {
        throw new Error(`Workflow validation failed: ${validation.errors.join(', ')}`);
      }

      // Initialize variables with workflow defaults and initial values
      let variables = { ...workflow.variables, ...initialVariables };

      // Execute workflow using topological sort
      const executionOrder = this.getExecutionOrder(workflow);
      
      for (const stepId of executionOrder) {
        const step = workflow.steps.find(s => s.id === stepId);
        if (!step) continue;

        try {
          const result = await this.executeStep(step, variables);
          
          if (!result.success) {
            execution.status = 'failed';
            execution.error = result.error;
            execution.completed_at = new Date().toISOString();
            return execution;
          }

          // Update variables with step results
          variables = { ...variables, ...result.variables };
          
          // Store step result
          execution.results[stepId] = result;
          execution.steps_completed++;

          // Check if this is a condition step that failed
          if (step.type === 'condition' && !result.output) {
            // Mark connected steps to be skipped in future executions
            const connectedSteps = this.getConnectedSteps(step, workflow);
            const connectedStepIds = new Set(connectedSteps.map((s: WorkflowStep) => s.id));
            
            // Remove connected steps from execution order
            const remainingSteps = executionOrder.slice(executionOrder.indexOf(stepId) + 1);
            
            // Continue execution with non-connected steps only
            const filteredOrder = remainingSteps.filter(id => !connectedStepIds.has(id));
            
            // Process remaining non-connected steps
            for (const remainingStepId of filteredOrder) {
              const remainingStep = workflow.steps.find(s => s.id === remainingStepId);
              if (!remainingStep) continue;

              try {
                const remainingResult = await this.executeStep(remainingStep, variables);
                
                if (!remainingResult.success) {
                  execution.status = 'failed';
                  execution.error = remainingResult.error;
                  execution.completed_at = new Date().toISOString();
                  return execution;
                }

                variables = { ...variables, ...remainingResult.variables };
                execution.results[remainingStepId] = remainingResult;
                execution.steps_completed++;

              } catch (error) {
                execution.status = 'failed';
                execution.error = error instanceof Error ? error.message : 'Unknown error';
                execution.completed_at = new Date().toISOString();
                return execution;
              }
            }
            
            break; // Exit main loop since we processed remaining steps
          }

        } catch (error) {
          execution.status = 'failed';
          execution.error = error instanceof Error ? error.message : 'Unknown error';
          execution.completed_at = new Date().toISOString();
          return execution;
        }
      }

      execution.status = 'completed';
      execution.completed_at = new Date().toISOString();
      
    } catch (error) {
      execution.status = 'failed';
      execution.error = error instanceof Error ? error.message : 'Unknown error';
      execution.completed_at = new Date().toISOString();
    }

    return execution;
  }

  async executeStep(
    step: WorkflowStep,
    variables: Record<string, any>
  ): Promise<StepExecutionResult> {
    try {
      switch (step.type) {
        case 'variable':
          return this.executeVariableStep(step, variables);
        
        case 'prompt':
          return await this.executePromptStep(step, variables);
        
        case 'condition':
          return this.executeConditionStep(step, variables);
        
        case 'delay':
          return await this.executeDelayStep(step, variables);
        
        case 'webhook':
          return await this.executeWebhookStep(step, variables);
        
        default:
          throw new Error(`Unknown step type: ${step.type}`);
      }
    } catch (error) {
      return {
        success: false,
        variables,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private executeVariableStep(
    step: WorkflowStep,
    variables: Record<string, any>
  ): StepExecutionResult {
    const { variableName, variableValue } = step.config;
    
    if (!variableName || variableValue === undefined) {
      throw new Error('Variable step requires variableName and variableValue');
    }

    const interpolatedValue = this.interpolateVariables(variableValue, variables);
    
    return {
      success: true,
      variables: {
        ...variables,
        [variableName]: interpolatedValue,
      },
    };
  }

  private async executePromptStep(
    step: WorkflowStep,
    variables: Record<string, any>
  ): Promise<StepExecutionResult> {
    const { promptTemplate, model = 'gpt-3.5-turbo', temperature = 0.7, maxTokens = 1000 } = step.config;
    
    if (!promptTemplate) {
      throw new Error('Prompt step requires promptTemplate');
    }

    const interpolatedPrompt = this.interpolateVariables(promptTemplate, variables);
    
    try {
      const response = await llmService.sendMessage(interpolatedPrompt, {
        model,
        temperature,
        maxTokens,
      });

      return {
        success: true,
        variables,
        output: response,
      };
    } catch (error) {
      throw new Error(`Prompt execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private executeConditionStep(
    step: WorkflowStep,
    variables: Record<string, any>
  ): StepExecutionResult {
    const { condition, operator = 'equals', value } = step.config;
    
    if (!condition || !operator || value === undefined) {
      throw new Error('Condition step requires condition, operator, and value');
    }

    const interpolatedCondition = this.interpolateVariables(condition, variables);
    const interpolatedValue = this.interpolateVariables(value, variables);
    
    const result = this.evaluateCondition(interpolatedCondition, operator, interpolatedValue);
    
    return {
      success: true,
      variables,
      output: result,
    };
  }

  private async executeDelayStep(
    step: WorkflowStep,
    variables: Record<string, any>
  ): Promise<StepExecutionResult> {
    const { delayMs = 1000 } = step.config;
    
    await new Promise(resolve => setTimeout(resolve, delayMs));
    
    return {
      success: true,
      variables,
    };
  }

  private async executeWebhookStep(
    step: WorkflowStep,
    variables: Record<string, any>
  ): Promise<StepExecutionResult> {
    const { url, method = 'GET', headers = {}, body } = step.config;
    
    if (!url) {
      throw new Error('Webhook step requires url');
    }

    const interpolatedUrl = this.interpolateVariables(url, variables);
    const interpolatedBody = body ? this.interpolateVariables(body, variables) : undefined;
    
    try {
      const response = await fetch(interpolatedUrl, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: interpolatedBody,
      });

      const responseData = await response.text();
      
      return {
        success: true,
        variables,
        output: responseData,
      };
    } catch (error) {
      throw new Error(`Webhook execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  interpolateVariables(template: string, variables: Record<string, any>): string {
    let result = template;
    
    // Handle nested variable references first {{{{variableName}}}}
    result = result.replace(/\{\{\{\{([^}]+)\}\}\}\}/g, (match, variableName) => {
      const trimmedName = variableName.trim();
      const actualVarName = variables[trimmedName];
      if (actualVarName && variables[actualVarName] !== undefined) {
        return variables[actualVarName];
      }
      return match;
    });
    
    // Handle simple variable interpolation {{variableName}}
    result = result.replace(/\{\{([^}]+)\}\}/g, (match, variableName) => {
      const trimmedName = variableName.trim();
      if (variables[trimmedName] !== undefined) {
        return variables[trimmedName];
      }
      return match;
    });
    
    // Clean up missing variables: if a missing variable is preceded by " is ", remove the " is "
    result = result.replace(/ is \{\{[^}]+\}\}/g, (match) => {
      return ' ' + match.substring(4); // Remove " is " but keep the leading space
    });
    
    return result;
  }

  evaluateCondition(left: string, operator: string, right: string): boolean {
    switch (operator) {
      case 'equals':
        return left === right;
      
      case 'contains':
        return left.includes(right);
      
      case 'greater':
        const leftNum = parseFloat(left);
        const rightNum = parseFloat(right);
        return !isNaN(leftNum) && !isNaN(rightNum) && leftNum > rightNum;
      
      case 'less':
        const leftNumLess = parseFloat(left);
        const rightNumLess = parseFloat(right);
        return !isNaN(leftNumLess) && !isNaN(rightNumLess) && leftNumLess < rightNumLess;
      
      case 'regex':
        try {
          const regex = new RegExp(right);
          return regex.test(left);
        } catch {
          return false;
        }
      
      default:
        return false;
    }
  }

  validateWorkflow(workflow: Workflow): WorkflowValidationResult {
    const errors: string[] = [];
    
    // Check for empty workflow
    if (workflow.steps.length === 0) {
      errors.push('Workflow must have at least one step');
    }

    // Check for valid step references
    const stepIds = new Set(workflow.steps.map(s => s.id));
    
    for (const step of workflow.steps) {
      for (const connectionId of step.connections) {
        if (!stepIds.has(connectionId)) {
          errors.push(`Step "${step.id}" references non-existent step "${connectionId}"`);
        }
      }
    }

    // Check for circular dependencies
    if (this.hasCircularDependency(workflow)) {
      errors.push('Circular dependency detected');
    }

    // Validate step configurations
    for (const step of workflow.steps) {
      const stepErrors = this.validateStepConfig(step);
      errors.push(...stepErrors);
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  private validateStepConfig(step: WorkflowStep): string[] {
    const errors: string[] = [];
    
    switch (step.type) {
      case 'variable':
        if (!step.config.variableName) {
          errors.push(`Variable step "${step.id}" missing variableName`);
        }
        if (step.config.variableValue === undefined) {
          errors.push(`Variable step "${step.id}" missing variableValue`);
        }
        break;
      
      case 'prompt':
        if (!step.config.promptTemplate) {
          errors.push(`Prompt step "${step.id}" missing promptTemplate`);
        }
        break;
      
      case 'condition':
        if (!step.config.condition) {
          errors.push(`Condition step "${step.id}" missing condition`);
        }
        if (!step.config.operator) {
          errors.push(`Condition step "${step.id}" missing operator`);
        }
        if (step.config.value === undefined) {
          errors.push(`Condition step "${step.id}" missing value`);
        }
        break;
      
      case 'webhook':
        if (!step.config.url) {
          errors.push(`Webhook step "${step.id}" missing url`);
        }
        break;
    }
    
    return errors;
  }

  private hasCircularDependency(workflow: Workflow): boolean {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    
    const hasCircularDependencyHelper = (stepId: string): boolean => {
      if (recursionStack.has(stepId)) {
        return true;
      }
      
      if (visited.has(stepId)) {
        return false;
      }
      
      visited.add(stepId);
      recursionStack.add(stepId);
      
      const step = workflow.steps.find(s => s.id === stepId);
      if (step) {
        for (const connectionId of step.connections) {
          if (hasCircularDependencyHelper(connectionId)) {
            return true;
          }
        }
      }
      
      recursionStack.delete(stepId);
      return false;
    };
    
    for (const step of workflow.steps) {
      if (hasCircularDependencyHelper(step.id)) {
        return true;
      }
    }
    
    return false;
  }

  private findStartingSteps(workflow: Workflow): WorkflowStep[] {
    const hasIncomingConnections = new Set<string>();
    
    for (const step of workflow.steps) {
      for (const connectionId of step.connections) {
        hasIncomingConnections.add(connectionId);
      }
    }
    
    return workflow.steps.filter(step => !hasIncomingConnections.has(step.id));
  }

  private getExecutionOrder(workflow: Workflow): string[] {
    const visited = new Set<string>();
    const order: string[] = [];
    
    const visit = (stepId: string) => {
      if (visited.has(stepId)) return;
      
      visited.add(stepId);
      
      const step = workflow.steps.find(s => s.id === stepId);
      if (step) {
        order.push(stepId);
        
        // Visit connected steps
        for (const connectionId of step.connections) {
          visit(connectionId);
        }
      }
    };
    
    // Start with steps that have no incoming connections
    const startingSteps = this.findStartingSteps(workflow);
    for (const step of startingSteps) {
      visit(step.id);
    }
    
    return order;
  }

  private getConnectedSteps(step: WorkflowStep, workflow: Workflow): WorkflowStep[] {
    const connected: WorkflowStep[] = [];
    
    const visit = (stepId: string, visited: Set<string>) => {
      if (visited.has(stepId)) return;
      visited.add(stepId);
      
      const currentStep = workflow.steps.find(s => s.id === stepId);
      if (currentStep) {
        connected.push(currentStep);
        
        for (const connectionId of currentStep.connections) {
          visit(connectionId, visited);
        }
      }
    };
    
    for (const connectionId of step.connections) {
      visit(connectionId, new Set());
    }
    
    return connected;
  }
}
