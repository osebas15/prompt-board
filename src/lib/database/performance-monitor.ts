/**
 * Performance Monitoring for Database Operations
 * Tracks query performance, caching efficiency, and system health
 */
import { DatabaseClient } from './database-client'
import type { PromptFilters } from './database-client'

// Performance metrics types
export interface QueryMetrics {
  operation: string
  duration: number
  timestamp: number
  success: boolean
  error?: string
  metadata?: Record<string, any>
}

export interface PerformanceStats {
  averageDuration: number
  p95Duration: number
  successRate: number
  totalQueries: number
  errorCount: number
  lastUpdated: number
}

export interface CacheMetrics {
  hits: number
  misses: number
  hitRate: number
  totalRequests: number
}

export interface HealthCheck {
  healthy: boolean
  issues: string[]
  stats: PerformanceStats
  cacheStats: CacheMetrics
}

export interface HealthCheck {
  healthy: boolean
  issues: string[]
  stats: PerformanceStats
  cacheStats: CacheMetrics
}

// Performance thresholds (Day 2 success criteria)
export const PERFORMANCE_THRESHOLDS = {
  QUERY_MAX_DURATION: 100, // 100ms max
  SEARCH_MAX_DURATION: 150, // 150ms max for search
  CACHE_MIN_HIT_RATE: 0.8, // 80% cache hit rate
  SUCCESS_MIN_RATE: 0.99, // 99% success rate
} as const

export class PerformanceMonitor {
  private metrics: QueryMetrics[] = []
  private maxMetricsSize = 1000 // Keep last 1000 operations
  private cacheMetrics: CacheMetrics = {
    hits: 0,
    misses: 0,
    hitRate: 0,
    totalRequests: 0
  }
  private dbClient: DatabaseClient

  constructor(dbClient: DatabaseClient) {
    this.dbClient = dbClient
  }

  // Record a database operation performance
  recordOperation(
    operation: string,
    duration: number,
    success: boolean,
    error?: string,
    metadata?: Record<string, any>
  ): void {
    const metric: QueryMetrics = {
      operation,
      duration,
      timestamp: Date.now(),
      success,
      error,
      metadata
    }

    this.metrics.push(metric)

    // Keep only the last N metrics to prevent memory issues
    if (this.metrics.length > this.maxMetricsSize) {
      this.metrics = this.metrics.slice(-this.maxMetricsSize)
    }

    // Log slow queries
    const threshold = operation.includes('search') 
      ? PERFORMANCE_THRESHOLDS.SEARCH_MAX_DURATION 
      : PERFORMANCE_THRESHOLDS.QUERY_MAX_DURATION

    if (duration > threshold) {
      console.warn(`Slow ${operation} query: ${duration}ms (threshold: ${threshold}ms)`, metadata)
    }

    if (!success && error) {
      console.error(`Failed ${operation} query:`, error, metadata)
    }
  }

  // Record cache hit/miss
  recordCacheHit(): void {
    this.cacheMetrics.hits++
    this.cacheMetrics.totalRequests++
    this.updateCacheHitRate()
  }

  recordCacheMiss(): void {
    this.cacheMetrics.misses++
    this.cacheMetrics.totalRequests++
    this.updateCacheHitRate()
  }

  private updateCacheHitRate(): void {
    this.cacheMetrics.hitRate = this.cacheMetrics.totalRequests > 0
      ? this.cacheMetrics.hits / this.cacheMetrics.totalRequests
      : 0
  }

  // Get performance statistics
  getStats(operation?: string): PerformanceStats {
    const filteredMetrics = operation 
      ? this.metrics.filter(m => m.operation === operation)
      : this.metrics

    if (filteredMetrics.length === 0) {
      return {
        averageDuration: 0,
        p95Duration: 0,
        successRate: 0,
        totalQueries: 0,
        errorCount: 0,
        lastUpdated: Date.now()
      }
    }

    const durations = filteredMetrics.map(m => m.duration).sort((a, b) => a - b)
    const successCount = filteredMetrics.filter(m => m.success).length
    const errorCount = filteredMetrics.filter(m => !m.success).length

    return {
      averageDuration: durations.reduce((sum, d) => sum + d, 0) / durations.length,
      p95Duration: durations[Math.floor(durations.length * 0.95)] || 0,
      successRate: successCount / filteredMetrics.length,
      totalQueries: filteredMetrics.length,
      errorCount,
      lastUpdated: Date.now()
    }
  }

  // Get cache metrics
  getCacheStats(): CacheMetrics {
    return { ...this.cacheMetrics }
  }

  // Check if performance meets Day 2 criteria
  isPerformanceHealthy(): {
    healthy: boolean
    issues: string[]
    stats: PerformanceStats
    cacheStats: CacheMetrics
  } {
    const stats = this.getStats()
    const cacheStats = this.getCacheStats()
    const issues: string[] = []

    // Check query performance
    if (stats.averageDuration > PERFORMANCE_THRESHOLDS.QUERY_MAX_DURATION) {
      issues.push(`Average query duration ${stats.averageDuration.toFixed(1)}ms exceeds ${PERFORMANCE_THRESHOLDS.QUERY_MAX_DURATION}ms threshold`)
    }

    if (stats.p95Duration > PERFORMANCE_THRESHOLDS.QUERY_MAX_DURATION * 1.5) {
      issues.push(`P95 query duration ${stats.p95Duration.toFixed(1)}ms exceeds ${PERFORMANCE_THRESHOLDS.QUERY_MAX_DURATION * 1.5}ms threshold`)
    }

    // Check success rate
    if (stats.successRate < PERFORMANCE_THRESHOLDS.SUCCESS_MIN_RATE) {
      issues.push(`Success rate ${(stats.successRate * 100).toFixed(1)}% below ${PERFORMANCE_THRESHOLDS.SUCCESS_MIN_RATE * 100}% threshold`)
    }

    // Check cache performance
    if (cacheStats.totalRequests > 10 && cacheStats.hitRate < PERFORMANCE_THRESHOLDS.CACHE_MIN_HIT_RATE) {
      issues.push(`Cache hit rate ${(cacheStats.hitRate * 100).toFixed(1)}% below ${PERFORMANCE_THRESHOLDS.CACHE_MIN_HIT_RATE * 100}% threshold`)
    }

    return {
      healthy: issues.length === 0,
      issues,
      stats,
      cacheStats
    }
  }

  // Performance-monitored wrapper methods
  async monitoredGetPrompts(filters: PromptFilters = {}) {
    const startTime = performance.now()
    const operation = 'getPrompts'
    
    try {
      const result = await this.dbClient.getPrompts(filters)
      const duration = performance.now() - startTime
      
      this.recordOperation(operation, duration, !result.error, result.error?.message, {
        filtersCount: Object.keys(filters).length,
        hasUserId: !!filters.userId,
        hasOrganizationId: !!filters.organizationId,
        hasVisibility: !!filters.visibility,
        limit: filters.limit,
        resultCount: result.data?.length || 0
      })

      return result
    } catch (error) {
      const duration = performance.now() - startTime
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      
      this.recordOperation(operation, duration, false, errorMessage, filters)
      throw error
    }
  }

  async monitoredSearchPrompts(searchQuery: string, filters: PromptFilters = {}) {
    const startTime = performance.now()
    const operation = 'searchPrompts'
    
    try {
      const result = await this.dbClient.searchPrompts(searchQuery, filters)
      const duration = performance.now() - startTime
      
      this.recordOperation(operation, duration, !result.error, result.error?.message, {
        queryLength: searchQuery.length,
        hasFilters: Object.keys(filters).length > 0,
        resultCount: result.data?.length || 0
      })

      return result
    } catch (error) {
      const duration = performance.now() - startTime
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      
      this.recordOperation(operation, duration, false, errorMessage, {
        searchQuery,
        filters
      })
      throw error
    }
  }

  async monitoredCreatePrompt(data: any) {
    const startTime = performance.now()
    const operation = 'createPrompt'
    
    try {
      const result = await this.dbClient.createPrompt(data)
      const duration = performance.now() - startTime
      
      this.recordOperation(operation, duration, !result.error, result.error?.message, {
        contentLength: data.content?.length || 0,
        hasCategory: !!data.category_id,
        visibility: data.visibility
      })

      return result
    } catch (error) {
      const duration = performance.now() - startTime
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      
      this.recordOperation(operation, duration, false, errorMessage, data)
      throw error
    }
  }

  async monitoredUpdatePrompt(id: string, data: any) {
    const startTime = performance.now()
    const operation = 'updatePrompt'
    
    try {
      const result = await this.dbClient.updatePrompt(id, data)
      const duration = performance.now() - startTime
      
      this.recordOperation(operation, duration, !result.error, result.error?.message, {
        promptId: id,
        updateFields: Object.keys(data).length,
        hasContentUpdate: 'content' in data
      })

      return result
    } catch (error) {
      const duration = performance.now() - startTime
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      
      this.recordOperation(operation, duration, false, errorMessage, { id, data })
      throw error
    }
  }

  async monitoredDeletePrompt(id: string) {
    const startTime = performance.now()
    const operation = 'deletePrompt'
    
    try {
      const result = await this.dbClient.deletePrompt(id)
      const duration = performance.now() - startTime
      
      this.recordOperation(operation, duration, !result.error, result.error?.message, {
        promptId: id
      })

      return result
    } catch (error) {
      const duration = performance.now() - startTime
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      
      this.recordOperation(operation, duration, false, errorMessage, { id })
      throw error
    }
  }

  // Clear old metrics
  clearMetrics(): void {
    this.metrics = []
    this.cacheMetrics = {
      hits: 0,
      misses: 0,
      hitRate: 0,
      totalRequests: 0
    }
  }

  // Get performance report
  getPerformanceReport(): {
    overall: PerformanceStats
    byOperation: Record<string, PerformanceStats>
    cache: CacheMetrics
    health: HealthCheck
    recentSlowQueries: QueryMetrics[]
  } {
    const overall = this.getStats()
    const cache = this.getCacheStats()
    const health = this.isPerformanceHealthy()

    // Get stats by operation
    const operations = ['getPrompts', 'searchPrompts', 'createPrompt', 'updatePrompt', 'deletePrompt']
    const byOperation: Record<string, PerformanceStats> = {}
    
    operations.forEach(op => {
      byOperation[op] = this.getStats(op)
    })

    // Get recent slow queries (last 10)
    const threshold = PERFORMANCE_THRESHOLDS.QUERY_MAX_DURATION
    const recentSlowQueries = this.metrics
      .filter((m: QueryMetrics) => m.duration > threshold)
      .slice(-10)
      .sort((a, b) => b.timestamp - a.timestamp)

    return {
      overall,
      byOperation,
      cache,
      health,
      recentSlowQueries
    }
  }
}

// Export singleton instance utility
let performanceMonitorInstance: PerformanceMonitor | null = null

export function createPerformanceMonitor(dbClient: DatabaseClient): PerformanceMonitor {
  if (!performanceMonitorInstance) {
    performanceMonitorInstance = new PerformanceMonitor(dbClient)
  }
  return performanceMonitorInstance
}

export function getPerformanceMonitor(): PerformanceMonitor | null {
  return performanceMonitorInstance
}
