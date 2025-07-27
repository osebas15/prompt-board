// Core Analytics Data Types

export interface BaseEvent {
  id: string;
  userId: string;
  sessionId: string;
  timestamp: Date;
  type: string;
  category: string;
}

export interface PromptEvent extends BaseEvent {
  type: 'prompt_created' | 'prompt_edited' | 'prompt_deleted' | 'prompt_used' | 'prompt_shared';
  promptId: string;
  promptCategory?: string;
  promptTags?: string[];
  metadata?: Record<string, string | number | boolean | null>;
}

export interface SearchEvent extends BaseEvent {
  type: 'search_performed' | 'search_result_clicked' | 'search_filter_applied';
  query: string;
  resultsCount: number;
  filters?: Record<string, string | number | boolean | string[]>;
}

export interface NavigationEvent extends BaseEvent {
  type: 'page_viewed' | 'feature_accessed' | 'action_performed';
  page: string;
  feature?: string;
  action?: string;
  duration?: number;
}

export interface PerformanceEvent extends BaseEvent {
  type: 'performance_metric';
  metric: string;
  value: number;
  unit: string;
  context?: Record<string, string | number | boolean>;
}

export interface ErrorEvent extends BaseEvent {
  type: 'error_occurred' | 'error_resolved';
  errorCode: string;
  errorMessage: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  stackTrace?: string;
}

export type AnalyticsEvent = PromptEvent | SearchEvent | NavigationEvent | PerformanceEvent | ErrorEvent;

// Metrics and Aggregations

export interface UsageMetrics {
  totalPrompts: number;
  activeUsers: number;
  dailyActiveUsers: number;
  weeklyActiveUsers: number;
  monthlyActiveUsers: number;
  avgSessionDuration: number;
  featuresUsed: Record<string, number>;
  errorRate: number;
  performanceScore: number;
  generatedAt: Date;
}

export interface PromptAnalytics {
  promptId: string;
  usageCount: number;
  successRate: number;
  avgResponseTime: number;
  userRating?: number;
  categories: string[];
  tags: string[];
  lastUsed: Date;
  createdAt: Date;
  updatedAt: Date;
  performanceMetrics: {
    averageExecutionTime: number;
    errorRate: number;
    userSatisfaction: number;
  };
}

export interface UserInsights {
  userId: string;
  activityLevel: 'low' | 'medium' | 'high';
  preferredCategories: string[];
  mostUsedFeatures: string[];
  optimizationSuggestions: string[];
  performanceTrends: MetricTrend[];
  engagementScore: number;
  lastActive: Date;
}

export interface MetricTrend {
  metric: string;
  timeframe: 'hour' | 'day' | 'week' | 'month' | 'year';
  dataPoints: {
    timestamp: Date;
    value: number;
  }[];
  trend: 'increasing' | 'decreasing' | 'stable';
  changePercentage: number;
}

export interface Dashboard {
  id: string;
  name: string;
  description?: string;
  widgets: DashboardWidget[];
  layout: DashboardLayout;
  filters: DashboardFilters;
  refreshInterval?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface DashboardWidget {
  id: string;
  type: 'metric' | 'chart' | 'table' | 'heatmap' | 'progress' | 'alert';
  title: string;
  description?: string;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  config: WidgetConfig;
  dataSource: string;
  refreshInterval?: number;
}

export interface WidgetConfig {
  chartType?: 'line' | 'bar' | 'pie' | 'doughnut' | 'area' | 'scatter';
  metrics: string[];
  dimensions?: string[];
  filters?: Record<string, string | number | boolean | string[]>;
  aggregation?: 'sum' | 'avg' | 'count' | 'min' | 'max';
  timeframe?: {
    start: Date;
    end: Date;
    granularity: 'minute' | 'hour' | 'day' | 'week' | 'month';
  };
  formatting?: {
    numberFormat?: string;
    colorScheme?: string[];
    showLegend?: boolean;
    showTooltips?: boolean;
  };
}

export interface DashboardLayout {
  columns: number;
  rowHeight: number;
  margin: [number, number];
  padding: [number, number];
}

export interface DashboardFilters {
  dateRange?: {
    start: Date;
    end: Date;
  };
  userId?: string;
  category?: string[];
  tags?: string[];
  custom?: Record<string, string | number | boolean | string[]>;
}

// Insights and Recommendations

export interface Insight {
  id: string;
  type: 'trend' | 'anomaly' | 'opportunity' | 'risk' | 'recommendation';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  description: string;
  category: string;
  confidence: number; // 0-1
  impact: 'low' | 'medium' | 'high';
  actionable: boolean;
  recommendations?: string[];
  relatedMetrics: string[];
  generatedAt: Date;
  expiresAt?: Date;
  metadata?: Record<string, string | number | boolean>;
}

export interface PerformanceMetrics {
  responseTime: {
    p50: number;
    p95: number;
    p99: number;
    avg: number;
  };
  throughput: {
    requestsPerSecond: number;
    requestsPerMinute: number;
    requestsPerHour: number;
  };
  errorRates: {
    client: number; // 4xx errors
    server: number; // 5xx errors
    total: number;
  };
  userExperience: {
    satisfaction: number;
    taskCompletionRate: number;
    bounceRate: number;
    engagementTime: number;
  };
  systemHealth: {
    memoryUsage: number;
    cpuUsage: number;
    diskUsage: number;
    networkLatency: number;
  };
}

// Report Types

export interface Report {
  id: string;
  name: string;
  description?: string;
  type: 'usage' | 'performance' | 'insights' | 'custom';
  format: 'pdf' | 'csv' | 'json' | 'excel';
  schedule?: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
    time?: string;
    timezone?: string;
    recipients?: string[];
  };
  config: ReportConfig;
  lastGenerated?: Date;
  nextScheduled?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReportConfig {
  timeframe: {
    start: Date;
    end: Date;
    relative?: string; // e.g., "last_30_days", "this_month"
  };
  metrics: string[];
  dimensions?: string[];
  filters?: Record<string, string | number | boolean | string[]>;
  groupBy?: string[];
  sortBy?: {
    field: string;
    direction: 'asc' | 'desc';
  };
  includeCharts?: boolean;
  includeInsights?: boolean;
  includeRawData?: boolean;
}

// Real-time Monitoring

export interface LiveMetrics {
  timestamp: Date;
  activeUsers: number;
  requestsPerSecond: number;
  averageResponseTime: number;
  errorRate: number;
  systemLoad: number;
  memoryUsage: number;
  onlineStatus: 'healthy' | 'degraded' | 'down';
}

export interface Alert {
  id: string;
  name: string;
  description?: string;
  type: 'threshold' | 'anomaly' | 'trend' | 'custom';
  severity: 'info' | 'warning' | 'critical';
  condition: AlertCondition;
  actions: AlertAction[];
  status: 'active' | 'suppressed' | 'resolved';
  triggeredAt?: Date;
  resolvedAt?: Date;
  metadata?: Record<string, string | number | boolean>;
}

export interface AlertCondition {
  metric: string;
  operator: '>' | '<' | '=' | '!=' | '>=' | '<=';
  threshold: number;
  timeWindow?: number; // minutes
  evaluationInterval?: number; // minutes
}

export interface AlertAction {
  type: 'email' | 'webhook' | 'slack' | 'push';
  target: string;
  message?: string;
  enabled: boolean;
}

// Query and Aggregation Types

export interface AnalyticsQuery {
  metrics: string[];
  dimensions?: string[];
  filters?: QueryFilter[];
  timeframe: {
    start: Date;
    end: Date;
    granularity?: 'minute' | 'hour' | 'day' | 'week' | 'month';
  };
  groupBy?: string[];
  orderBy?: {
    field: string;
    direction: 'asc' | 'desc';
  };
  limit?: number;
  offset?: number;
}

export interface QueryFilter {
  field: string;
  operator: '=' | '!=' | '>' | '<' | '>=' | '<=' | 'in' | 'not_in' | 'like' | 'not_like';
  value: string | number | boolean | string[] | number[] | Date;
}

export interface AnalyticsResult {
  data: Record<string, string | number | boolean | Date>[];
  totalCount: number;
  aggregations?: Record<string, number>;
  metadata: {
    query: AnalyticsQuery;
    executionTime: number;
    generatedAt: Date;
    cached: boolean;
  };
}
