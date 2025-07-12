// Analytics and metrics types
export interface UsageMetrics {
  promptsCreated: number;
  promptsUsed: number;
  conversationsStarted: number;
  totalTokensUsed: number;
  activeContexts: number;
  dailyActivity: DailyActivity[];
  topPrompts: PromptUsage[];
  topCategories: CategoryUsage[];
}

export interface DailyActivity {
  date: string;
  promptsCreated: number;
  promptsUsed: number;
  conversations: number;
  tokensUsed: number;
}

export interface PromptUsage {
  id: string;
  title: string;
  usageCount: number;
  lastUsed: string;
  category?: string;
}

export interface CategoryUsage {
  name: string;
  promptCount: number;
  usageCount: number;
  percentage: number;
}

export interface PerformanceMetrics {
  avgResponseTime: number;
  errorRate: number;
  successRate: number;
  cacheHitRate: number;
}
