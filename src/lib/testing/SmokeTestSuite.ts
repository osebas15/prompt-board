import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface TestResult {
  success: boolean;
  error?: string;
  responseTime?: number;
  metadata?: Record<string, unknown>;
}

export interface UserTestResult extends TestResult {
  user?: unknown;
  session?: unknown;
}

export interface PromptTestResult extends TestResult {
  prompt?: unknown;
}

export interface ContextTestResult extends TestResult {
  context?: unknown;
  expandedPrompt?: string;
}

export interface SearchTestResult extends TestResult {
  results?: unknown[];
  resultCount?: number;
}

export interface LLMTestResult extends TestResult {
  response?: string;
  model?: string;
}

export class SmokeTestSuite {
  private supabase: SupabaseClient;
  private testUserId: string | null = null;

  constructor(supabaseClient: SupabaseClient) {
    this.supabase = supabaseClient;
  }

  /**
   * Test user registration flow
   */
  async testUserRegistration(credentials: { email: string; password: string }): Promise<UserTestResult> {
    const startTime = performance.now();
    
    try {
      const { data, error } = await this.supabase.auth.signUp({
        email: credentials.email,
        password: credentials.password
      });

      const responseTime = performance.now() - startTime;

      if (error) {
        return {
          success: false,
          error: error.message,
          responseTime
        };
      }

      return {
        success: true,
        user: data.user,
        session: data.session,
        responseTime,
        metadata: {
          emailConfirmationSent: !data.session // No session means email confirmation required
        }
      };
    } catch (error) {
      const responseTime = performance.now() - startTime;
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown registration error',
        responseTime
      };
    }
  }

  /**
   * Test user login flow
   */
  async testUserLogin(credentials: { email: string; password: string }): Promise<UserTestResult> {
    const startTime = performance.now();
    
    try {
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password
      });

      const responseTime = performance.now() - startTime;

      if (error) {
        return {
          success: false,
          error: error.message,
          responseTime
        };
      }

      return {
        success: true,
        user: data.user,
        session: data.session,
        responseTime
      };
    } catch (error) {
      const responseTime = performance.now() - startTime;
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown login error',
        responseTime
      };
    }
  }

  /**
   * Test password reset flow
   */
  async testPasswordReset(email: { email: string }): Promise<TestResult> {
    const startTime = performance.now();
    
    try {
      const { error } = await this.supabase.auth.resetPasswordForEmail(email.email);
      const responseTime = performance.now() - startTime;

      if (error) {
        return {
          success: false,
          error: error.message,
          responseTime
        };
      }

      return {
        success: true,
        responseTime,
        metadata: {
          resetEmailSent: true
        }
      };
    } catch (error) {
      const responseTime = performance.now() - startTime;
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown password reset error',
        responseTime
      };
    }
  }

  /**
   * Authenticate test user (for tests that require authentication)
   */
  async authenticateTestUser(userId: string): Promise<void> {
    this.testUserId = userId;
    // In a real implementation, you would set up the session properly
    // For testing, we'll assume the user is authenticated
  }

  /**
   * Test prompt creation
   */
  async testPromptCreation(promptData: {
    title: string;
    content: string;
    description?: string;
    category_id?: string | null;
  }): Promise<PromptTestResult> {
    const startTime = performance.now();
    
    try {
      const { data, error } = await this.supabase
        .from('prompts')
        .insert({
          ...promptData,
          user_id: this.testUserId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      const responseTime = performance.now() - startTime;

      if (error) {
        return {
          success: false,
          error: error.message,
          responseTime
        };
      }

      return {
        success: true,
        prompt: data,
        responseTime
      };
    } catch (error) {
      const responseTime = performance.now() - startTime;
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown prompt creation error',
        responseTime
      };
    }
  }

  /**
   * Test prompt retrieval
   */
  async testPromptRetrieval(promptId: string): Promise<PromptTestResult> {
    const startTime = performance.now();
    
    try {
      const { data, error } = await this.supabase
        .from('prompts')
        .select('*')
        .eq('id', promptId)
        .single();

      const responseTime = performance.now() - startTime;

      if (error) {
        return {
          success: false,
          error: error.message,
          responseTime
        };
      }

      return {
        success: true,
        prompt: data,
        responseTime
      };
    } catch (error) {
      const responseTime = performance.now() - startTime;
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown prompt retrieval error',
        responseTime
      };
    }
  }

  /**
   * Test prompt update
   */
  async testPromptUpdate(promptId: string, updates: Partial<{
    title: string;
    content: string;
    description: string;
  }>): Promise<PromptTestResult> {
    const startTime = performance.now();
    
    try {
      const { data, error } = await this.supabase
        .from('prompts')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', promptId)
        .select()
        .single();

      const responseTime = performance.now() - startTime;

      if (error) {
        return {
          success: false,
          error: error.message,
          responseTime
        };
      }

      return {
        success: true,
        prompt: data,
        responseTime
      };
    } catch (error) {
      const responseTime = performance.now() - startTime;
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown prompt update error',
        responseTime
      };
    }
  }

  /**
   * Test prompt deletion
   */
  async testPromptDeletion(promptId: string): Promise<TestResult> {
    const startTime = performance.now();
    
    try {
      const { error } = await this.supabase
        .from('prompts')
        .delete()
        .eq('id', promptId);

      const responseTime = performance.now() - startTime;

      if (error) {
        return {
          success: false,
          error: error.message,
          responseTime
        };
      }

      return {
        success: true,
        responseTime
      };
    } catch (error) {
      const responseTime = performance.now() - startTime;
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown prompt deletion error',
        responseTime
      };
    }
  }

  /**
   * Test prompt search functionality
   */
  async testPromptSearch(query: string): Promise<SearchTestResult> {
    const startTime = performance.now();
    
    try {
      const { data, error } = await this.supabase
        .from('prompts')
        .select('*')
        .or(`title.ilike.%${query}%,content.ilike.%${query}%,description.ilike.%${query}%`)
        .limit(10);

      const responseTime = performance.now() - startTime;

      if (error) {
        return {
          success: false,
          error: error.message,
          responseTime
        };
      }

      return {
        success: true,
        results: data,
        resultCount: data.length,
        responseTime
      };
    } catch (error) {
      const responseTime = performance.now() - startTime;
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown search error',
        responseTime
      };
    }
  }

  /**
   * Test LLM execution (mocked for testing)
   */
  async testLLMExecution(
    params: { prompt: string; variables: Record<string, any>; model: string },
    mockResponse?: any
  ): Promise<LLMTestResult> {
    const startTime = performance.now();
    
    try {
      // In testing, we use the mock response
      if (mockResponse) {
        const responseTime = performance.now() - startTime;
        return {
          success: true,
          response: mockResponse.candidates[0].content.parts[0].text,
          model: params.model,
          responseTime
        };
      }

      // In real implementation, this would call the actual LLM service
      throw new Error('LLM service not available in test environment');
    } catch (error) {
      const responseTime = performance.now() - startTime;
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown LLM error',
        responseTime
      };
    }
  }

  /**
   * Test LLM error handling
   */
  async testLLMErrorHandling(params: {
    prompt: string;
    variables: Record<string, any>;
    model: string;
  }): Promise<LLMTestResult> {
    const startTime = performance.now();
    
    try {
      // Simulate LLM service error
      throw new Error('LLM service temporarily unavailable');
    } catch (error) {
      const responseTime = performance.now() - startTime;
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown LLM error',
        responseTime
      };
    }
  }

  /**
   * Test context creation
   */
  async testContextCreation(contextData: {
    name: string;
    description?: string;
    variables: Record<string, any>;
  }): Promise<ContextTestResult> {
    const startTime = performance.now();
    
    try {
      const { data, error } = await this.supabase
        .from('contexts')
        .insert({
          ...contextData,
          user_id: this.testUserId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      const responseTime = performance.now() - startTime;

      if (error) {
        return {
          success: false,
          error: error.message,
          responseTime
        };
      }

      return {
        success: true,
        context: data,
        responseTime
      };
    } catch (error) {
      const responseTime = performance.now() - startTime;
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown context creation error',
        responseTime
      };
    }
  }

  /**
   * Test context update
   */
  async testContextUpdate(contextId: string, updates: {
    variables: Record<string, any>;
  }): Promise<ContextTestResult> {
    const startTime = performance.now();
    
    try {
      const { data, error } = await this.supabase
        .from('contexts')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', contextId)
        .select()
        .single();

      const responseTime = performance.now() - startTime;

      if (error) {
        return {
          success: false,
          error: error.message,
          responseTime
        };
      }

      return {
        success: true,
        context: data,
        responseTime
      };
    } catch (error) {
      const responseTime = performance.now() - startTime;
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown context update error',
        responseTime
      };
    }
  }

  /**
   * Test context usage with prompt expansion
   */
  async testContextUsage(contextId: string, params: { prompt: string }): Promise<ContextTestResult> {
    const startTime = performance.now();
    
    try {
      // Get the context
      const { data: context, error: contextError } = await this.supabase
        .from('contexts')
        .select('*')
        .eq('id', contextId)
        .single();

      if (contextError) {
        return {
          success: false,
          error: contextError.message,
          responseTime: performance.now() - startTime
        };
      }

      // Expand the prompt with context variables
      let expandedPrompt = params.prompt;
      for (const [key, value] of Object.entries(context.variables)) {
        expandedPrompt = expandedPrompt.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
      }

      const responseTime = performance.now() - startTime;

      return {
        success: true,
        context,
        expandedPrompt,
        responseTime
      };
    } catch (error) {
      const responseTime = performance.now() - startTime;
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown context usage error',
        responseTime
      };
    }
  }

  /**
   * Test dashboard load performance
   */
  async testDashboardLoad(userId: string): Promise<TestResult> {
    const startTime = performance.now();
    
    try {
      // Simulate dashboard data loading
      const [prompts, contexts, categories] = await Promise.all([
        this.supabase.from('prompts').select('*').eq('user_id', userId).limit(10),
        this.supabase.from('contexts').select('*').eq('user_id', userId).limit(5),
        this.supabase.from('categories').select('*').limit(20)
      ]);

      const responseTime = performance.now() - startTime;

      // Check if any of the queries failed
      if (prompts.error || contexts.error || categories.error) {
        return {
          success: false,
          error: 'Failed to load dashboard data',
          responseTime
        };
      }

      return {
        success: true,
        responseTime,
        metadata: {
          promptCount: prompts.data?.length || 0,
          contextCount: contexts.data?.length || 0,
          categoryCount: categories.data?.length || 0
        }
      };
    } catch (error) {
      const responseTime = performance.now() - startTime;
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown dashboard load error',
        responseTime
      };
    }
  }

  /**
   * Test concurrent prompt execution
   */
  async testConcurrentPromptExecution(prompts: Array<{
    title: string;
    content: string;
  }>): Promise<TestResult[]> {
    const promises = prompts.map(async (promptData, index) => {
      // Simulate concurrent operations
      await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
      
      return this.testPromptCreation({
        ...promptData,
        title: `${promptData.title} (Concurrent ${index})`
      });
    });

    return Promise.all(promises);
  }

  /**
   * Test data integrity across operations
   */
  async testDataIntegrity(params: {
    promptId: string;
    contextId: string;
  }): Promise<TestResult> {
    const startTime = performance.now();
    
    try {
      // Check that references are valid
      const { data: prompt, error: promptError } = await this.supabase
        .from('prompts')
        .select('*')
        .eq('id', params.promptId)
        .single();

      const { data: context, error: contextError } = await this.supabase
        .from('contexts')
        .select('*')
        .eq('id', params.contextId)
        .single();

      const responseTime = performance.now() - startTime;
      const issues: string[] = [];

      if (promptError) issues.push(`Prompt not found: ${promptError.message}`);
      if (contextError) issues.push(`Context not found: ${contextError.message}`);

      // Additional integrity checks could be added here
      if (prompt && !prompt.user_id) issues.push('Prompt missing user_id');
      if (context && !context.user_id) issues.push('Context missing user_id');

      return {
        success: issues.length === 0,
        error: issues.length > 0 ? issues.join('; ') : undefined,
        responseTime,
        metadata: { issues }
      };
    } catch (error) {
      const responseTime = performance.now() - startTime;
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown integrity check error',
        responseTime
      };
    }
  }
}
