import { WorkflowEngine } from '../services/WorkflowEngine';

const engine = new WorkflowEngine();

const template = 'Hello {{name}}, your score is {{missing}}';
const variables = { name: 'John' };

const result = engine.interpolateVariables(template, variables);

console.log('Template:', template);
console.log('Variables:', variables);
console.log('Result:', result);
console.log('Expected: Hello John, your score {{missing}}');
