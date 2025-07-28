// Performance Monitoring Types

export type PerformanceMetadataValue = string | number | boolean | null;
export type PerformanceMetadata = Record<string, PerformanceMetadataValue>;

export interface LayoutShiftEntry extends PerformanceEntry {
  value: number;
  hadRecentInput: boolean;
}

export interface PerformanceAnalyticsData {
  type: string;
  metric: {
    name: string;
    value: number;
    rating: string;
    delta: number;
    id: string;
    timestamp: number;
  };
  url: string;
  userAgent: string;
  timestamp: number;
}
