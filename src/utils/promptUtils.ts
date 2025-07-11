// Utility functions for prompt operations
export interface PromptVariable {
  name: string;
  defaultValue?: string;
  required?: boolean;
}

export function extractVariables(content: string): PromptVariable[] {
  const variableRegex = /\{\{(\w+)(?:\|([^}]+))?\}\}/g;
  const variables: PromptVariable[] = [];
  const seen = new Set<string>();
  
  let match;
  while ((match = variableRegex.exec(content)) !== null) {
    const [, name, defaultValue] = match;
    if (!seen.has(name)) {
      variables.push({
        name,
        defaultValue: defaultValue?.trim(),
        required: !defaultValue,
      });
      seen.add(name);
    }
  }
  
  return variables;
}

export function substituteVariables(
  content: string,
  variables: Record<string, string>
): string {
  return content.replace(/\{\{(\w+)(?:\|([^}]+))?\}\}/g, (match, name, defaultValue) => {
    return variables[name] ?? defaultValue ?? match;
  });
}

export function validatePromptContent(content: string): string[] {
  const errors: string[] = [];
  
  if (!content.trim()) {
    errors.push('Prompt content cannot be empty');
  }
  
  if (content.length > 10000) {
    errors.push('Prompt content cannot exceed 10,000 characters');
  }
  
  // Check for unclosed variable brackets
  const openBrackets = (content.match(/\{\{/g) || []).length;
  const closeBrackets = (content.match(/\}\}/g) || []).length;
  
  if (openBrackets !== closeBrackets) {
    errors.push('Mismatched variable brackets detected');
  }
  
  return errors;
}
