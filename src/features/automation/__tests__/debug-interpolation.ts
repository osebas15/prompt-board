import { WorkflowEngine } from '../services/WorkflowEngine';

const engine = new WorkflowEngine();

const template = 'Hello {{name}}, your score is {{missing}}';
const variables = { name: 'John' };

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const result = engine.interpolateVariables(template, variables);

// Debug test file - logs removed for cleaner output
