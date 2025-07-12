# Analytics Dashboard Implementation Plan

## Overview

Create React components and hooks for the analytics dashboard, building on the completed `AnalyticsService`.

## Components to Implement

### 1. Dashboard Container Components

**`AnalyticsDashboard.tsx`**
```typescript
// Main dashboard container with layout and state management
interface AnalyticsDashboardProps {
  timeframe?: TimeframeOption;
  refreshInterval?: number;
}
```

**`DashboardLayout.tsx`**
```typescript
// Responsive grid layout for dashboard widgets
interface DashboardLayoutProps {
  widgets: DashboardWidget[];
  columns: number;
  onWidgetResize?: (widgetId: string, size: Size) => void;
}
```

### 2. Metric Display Components

**`MetricCard.tsx`**
```typescript
// Individual metric display with trends and sparklines
interface MetricCardProps {
  title: string;
  value: number | string;
  unit?: string;
  trend?: MetricTrend;
  loading?: boolean;
  error?: string;
}
```

**`MetricChart.tsx`**
```typescript
// Chart component using recharts for metric visualization
interface MetricChartProps {
  data: MetricDataPoint[];
  type: 'line' | 'bar' | 'area' | 'pie';
  timeframe: Timeframe;
  loading?: boolean;
}
```

### 3. Specialized Analytics Components

**`UsageOverview.tsx`**
```typescript
// Overview of key usage metrics
- Total prompts
- Active users (DAU/WAU/MAU)
- Feature usage breakdown
- Error rate trends
```

**`PromptAnalyticsSummary.tsx`**
```typescript
// Prompt-specific analytics
- Most used prompts
- Success rates
- Performance metrics
- Category breakdowns
```

**`LiveMetricsPanel.tsx`**
```typescript
// Real-time system health
- Current active users
- Requests per second
- Response times
- System status
```

**`InsightsPanel.tsx`**
```typescript
// AI-generated insights and recommendations
- Trend analysis
- Anomaly detection
- Optimization suggestions
- Performance alerts
```

## Custom Hooks

### 1. Data Fetching Hooks

**`useAnalyticsMetrics.ts`**
```typescript
export function useAnalyticsMetrics(
  timeframe: Timeframe,
  refreshInterval?: number
) {
  // Fetch and cache general analytics metrics
  // Auto-refresh on interval
  // Handle loading and error states
}
```

**`useUsageMetrics.ts`**
```typescript
export function useUsageMetrics(timeframe: Timeframe) {
  // Fetch usage-specific metrics
  // Integrate with AnalyticsService.getUsageMetrics()
}
```

**`usePromptAnalytics.ts`**
```typescript
export function usePromptAnalytics(promptId?: string) {
  // Fetch prompt-specific analytics
  // Support both single prompt and aggregate views
}
```

**`useLiveMetrics.ts`**
```typescript
export function useLiveMetrics(refreshInterval: number = 30000) {
  // Real-time metrics with auto-refresh
  // WebSocket integration for live updates
}
```

### 2. State Management Hooks

**`useDashboardConfig.ts`**
```typescript
export function useDashboardConfig() {
  // Manage dashboard layout and widget configuration
  // Persist user preferences
  // Handle widget add/remove/resize
}
```

**`useTimeframeSelector.ts`**
```typescript
export function useTimeframeSelector(defaultTimeframe?: Timeframe) {
  // Manage timeframe selection across dashboard
  // Handle custom date ranges
  // Sync with URL parameters
}
```

## Utility Components

### 1. Time Selection

**`TimeframeSelector.tsx`**
```typescript
// Dropdown for selecting analysis timeframe
interface TimeframeSelectorProps {
  value: Timeframe;
  onChange: (timeframe: Timeframe) => void;
  options: TimeframeOption[];
}
```

**`DateRangePicker.tsx`**
```typescript
// Custom date range selection
interface DateRangePickerProps {
  startDate: Date;
  endDate: Date;
  onChange: (range: DateRange) => void;
  maxRange?: number; // days
}
```

### 2. Export and Sharing

**`ExportButton.tsx`**
```typescript
// Export analytics data in various formats
interface ExportButtonProps {
  data: any;
  format: 'csv' | 'json' | 'pdf';
  filename?: string;
}
```

**`ShareDashboard.tsx`**
```typescript
// Share dashboard configuration and snapshots
interface ShareDashboardProps {
  dashboardId: string;
  config: DashboardConfig;
  onShare: (shareUrl: string) => void;
}
```

## Implementation Priority

### Phase 1: Core Dashboard (2-3 hours)
1. `AnalyticsDashboard` container
2. `MetricCard` components
3. `useAnalyticsMetrics` hook
4. Basic layout and styling

### Phase 2: Advanced Metrics (2-3 hours)
1. `MetricChart` with recharts
2. `UsageOverview` component
3. `PromptAnalyticsSummary` component
4. Time range selection

### Phase 3: Live Features (1-2 hours)
1. `LiveMetricsPanel` 
2. `useLiveMetrics` hook
3. Real-time updates
4. Status indicators

### Phase 4: Enhancement (1-2 hours)
1. Export functionality
2. Dashboard customization
3. Responsive design
4. Loading states and error handling

## Testing Strategy

### Unit Tests
- Component rendering
- Hook functionality
- Data transformation
- Error handling

### Integration Tests
- Dashboard data flow
- Real-time updates
- Export functionality
- Time range changes

### Visual Tests
- Chart rendering
- Responsive layout
- Loading states
- Error states

## Example Implementation

```typescript
// AnalyticsDashboard.tsx
export function AnalyticsDashboard({ timeframe = 'last_7_days' }: AnalyticsDashboardProps) {
  const { data: usageMetrics, loading: usageLoading, error: usageError } = useUsageMetrics(timeframe);
  const { data: liveMetrics, loading: liveLoading } = useLiveMetrics();
  const [selectedTimeframe, setSelectedTimeframe] = useTimeframeSelector(timeframe);

  return (
    <div className="analytics-dashboard">
      <DashboardHeader>
        <TimeframeSelector 
          value={selectedTimeframe}
          onChange={setSelectedTimeframe}
        />
      </DashboardHeader>
      
      <DashboardGrid>
        <MetricCard
          title="Total Prompts"
          value={usageMetrics?.totalPrompts}
          loading={usageLoading}
          error={usageError}
        />
        
        <MetricCard
          title="Active Users"
          value={usageMetrics?.activeUsers}
          trend={/* calculate trend */}
          loading={usageLoading}
        />
        
        <LiveMetricsPanel 
          metrics={liveMetrics}
          loading={liveLoading}
        />
        
        <UsageOverview 
          data={usageMetrics}
          timeframe={selectedTimeframe}
        />
      </DashboardGrid>
    </div>
  );
}
```

This implementation plan provides a complete analytics dashboard that leverages the existing `AnalyticsService` and follows React best practices for state management, component composition, and testing.
