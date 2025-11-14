/**
 * Performance Monitoring Utility
 * Week 5: Integration Layer - I3: Performance Optimization
 * 
 * Tracks and reports performance metrics for the application
 */

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  tags?: Record<string, string>;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private maxMetrics: number = 1000;

  /**
   * Record a performance metric
   */
  record(name: string, value: number, tags?: Record<string, string>): void {
    this.metrics.push({
      name,
      value,
      timestamp: Date.now(),
      tags,
    });

    // Keep only recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Performance] ${name}: ${value.toFixed(2)}ms`, tags || '');
    }
  }

  /**
   * Measure execution time of a function
   */
  async measure<T>(
    name: string,
    fn: () => Promise<T>,
    tags?: Record<string, string>
  ): Promise<T> {
    const start = performance.now();
    try {
      const result = await fn();
      const duration = performance.now() - start;
      this.record(name, duration, tags);
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      this.record(`${name}:error`, duration, { ...tags, error: String(error) });
      throw error;
    }
  }

  /**
   * Measure synchronous execution time
   */
  measureSync<T>(
    name: string,
    fn: () => T,
    tags?: Record<string, string>
  ): T {
    const start = performance.now();
    try {
      const result = fn();
      const duration = performance.now() - start;
      this.record(name, duration, tags);
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      this.record(`${name}:error`, duration, { ...tags, error: String(error) });
      throw error;
    }
  }

  /**
   * Get metrics by name
   */
  getMetrics(name: string): PerformanceMetric[] {
    return this.metrics.filter(m => m.name === name);
  }

  /**
   * Get average metric value
   */
  getAverage(name: string): number {
    const metrics = this.getMetrics(name);
    if (metrics.length === 0) return 0;
    const sum = metrics.reduce((acc, m) => acc + m.value, 0);
    return sum / metrics.length;
  }

  /**
   * Get all metrics
   */
  getAllMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics = [];
  }

  /**
   * Export metrics as JSON
   */
  export(): string {
    return JSON.stringify(this.metrics, null, 2);
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Helper to measure API calls
export function measureAPICall<T>(
  endpoint: string,
  fn: () => Promise<T>
): Promise<T> {
  return performanceMonitor.measure(`api:${endpoint}`, fn, {
    endpoint,
    type: 'api',
  });
}

// Helper to measure component render time
export function measureRender(
  componentName: string,
  renderFn: () => void
): void {
  performanceMonitor.measureSync(`render:${componentName}`, renderFn, {
    component: componentName,
    type: 'render',
  });
}

// Track page load performance
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navigation) {
      performanceMonitor.record('page:load', navigation.loadEventEnd - navigation.fetchStart);
      performanceMonitor.record('page:dom-content-loaded', navigation.domContentLoadedEventEnd - navigation.fetchStart);
      performanceMonitor.record('page:first-paint', performance.getEntriesByType('paint')[0]?.startTime || 0);
    }
  });
}

