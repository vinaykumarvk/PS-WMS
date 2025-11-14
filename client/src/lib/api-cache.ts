/**
 * Module 7: Frontend-Backend Integration Enhancement
 * 7.4 Caching Strategy
 * 
 * Enhanced API Response Caching Utility with invalidation strategies,
 * cache persistence, cache warming, and metrics
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiry: number;
  accessCount: number;
  lastAccessed: number;
}

interface CacheMetrics {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  hitRate: number;
}

class APICache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private defaultTTL: number = 5 * 60 * 1000; // 5 minutes default
  private maxSize: number = 1000; // Maximum cache entries
  private metrics: CacheMetrics = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    hitRate: 0,
  };
  private invalidationPatterns: Map<string, RegExp[]> = new Map();
  private persistenceEnabled: boolean = false;
  private persistenceKey: string = 'api-cache';

  /**
   * Get cached data if available and not expired
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.metrics.misses++;
      this.updateHitRate();
      return null;
    }

    const now = Date.now();
    if (now > entry.timestamp + entry.expiry) {
      // Expired, remove from cache
      this.cache.delete(key);
      this.metrics.misses++;
      this.updateHitRate();
      return null;
    }

    // Update access statistics
    entry.accessCount++;
    entry.lastAccessed = now;
    this.metrics.hits++;
    this.updateHitRate();
    
    return entry.data as T;
  }

  /**
   * Set cache entry with optional TTL
   */
  set<T>(key: string, data: T, ttl?: number): void {
    // Evict least recently used if cache is full
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      this.evictLRU();
    }
    
    const expiry = ttl || this.defaultTTL;
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiry,
      accessCount: 0,
      lastAccessed: Date.now(),
    });
    
    this.metrics.sets++;
    this.updateHitRate();
    
    // Persist to localStorage if enabled
    if (this.persistenceEnabled) {
      this.persist();
    }
  }

  /**
   * Remove cache entry
   */
  delete(key: string): void {
    this.cache.delete(key);
    this.metrics.deletes++;
    
    if (this.persistenceEnabled) {
      this.persist();
    }
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
    this.metrics = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      hitRate: 0,
    };
    
    if (this.persistenceEnabled) {
      localStorage.removeItem(this.persistenceKey);
    }
  }

  /**
   * Clear expired entries
   */
  clearExpired(): void {
    const now = Date.now();
    let cleared = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.timestamp + entry.expiry) {
        this.cache.delete(key);
        cleared++;
      }
    }
    
    if (cleared > 0 && this.persistenceEnabled) {
      this.persist();
    }
    
    return cleared;
  }

  /**
   * Invalidate cache entries matching pattern
   */
  invalidate(pattern: string | RegExp): number {
    let cleared = 0;
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
    
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        cleared++;
      }
    }
    
    if (cleared > 0 && this.persistenceEnabled) {
      this.persist();
    }
    
    return cleared;
  }

  /**
   * Register invalidation pattern for a query key
   */
  registerInvalidationPattern(queryKey: string, patterns: RegExp[]): void {
    this.invalidationPatterns.set(queryKey, patterns);
  }

  /**
   * Invalidate cache based on query key
   */
  invalidateByQueryKey(queryKey: string): number {
    const patterns = this.invalidationPatterns.get(queryKey);
    if (!patterns) {
      return 0;
    }
    
    let totalCleared = 0;
    for (const pattern of patterns) {
      totalCleared += this.invalidate(pattern);
    }
    
    return totalCleared;
  }

  /**
   * Evict least recently used entry
   */
  private evictLRU(): void {
    let lruKey: string | null = null;
    let lruTime = Infinity;
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < lruTime) {
        lruTime = entry.lastAccessed;
        lruKey = key;
      }
    }
    
    if (lruKey) {
      this.cache.delete(lruKey);
    }
  }

  /**
   * Update hit rate metric
   */
  private updateHitRate(): void {
    const total = this.metrics.hits + this.metrics.misses;
    this.metrics.hitRate = total > 0 ? this.metrics.hits / total : 0;
  }

  /**
   * Get cache metrics
   */
  getMetrics(): CacheMetrics {
    return { ...this.metrics };
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Enable persistence to localStorage
   */
  enablePersistence(key?: string): void {
    this.persistenceEnabled = true;
    if (key) {
      this.persistenceKey = key;
    }
    this.restore();
  }

  /**
   * Disable persistence
   */
  disablePersistence(): void {
    this.persistenceEnabled = false;
    localStorage.removeItem(this.persistenceKey);
  }

  /**
   * Persist cache to localStorage
   */
  private persist(): void {
    try {
      const serializable: Array<[string, Omit<CacheEntry<any>, 'data'> & { data: any }]> = [];
      
      for (const [key, entry] of this.cache.entries()) {
        serializable.push([key, entry]);
      }
      
      localStorage.setItem(this.persistenceKey, JSON.stringify(serializable));
    } catch (error) {
      console.warn('Failed to persist cache:', error);
    }
  }

  /**
   * Restore cache from localStorage
   */
  private restore(): void {
    try {
      const stored = localStorage.getItem(this.persistenceKey);
      if (!stored) {
        return;
      }
      
      const entries: Array<[string, CacheEntry<any>]> = JSON.parse(stored);
      
      for (const [key, entry] of entries) {
        // Only restore if not expired
        const now = Date.now();
        if (now <= entry.timestamp + entry.expiry) {
          this.cache.set(key, entry);
        }
      }
    } catch (error) {
      console.warn('Failed to restore cache:', error);
    }
  }

  /**
   * Warm cache with data
   */
  warmCache<T>(key: string, data: T, ttl?: number): void {
    this.set(key, data, ttl);
  }

  /**
   * Warm cache with multiple entries
   */
  warmCacheBatch<T>(entries: Array<{ key: string; data: T; ttl?: number }>): void {
    for (const entry of entries) {
      this.set(entry.key, entry.data, entry.ttl);
    }
  }

  /**
   * Set maximum cache size
   */
  setMaxSize(size: number): void {
    this.maxSize = size;
    
    // Evict entries if over limit
    while (this.cache.size > this.maxSize) {
      this.evictLRU();
    }
  }
}

// Singleton instance
export const apiCache = new APICache();

// Cache key generators
export const cacheKeys = {
  products: () => 'api:products',
  product: (id: number) => `api:product:${id}`,
  portfolio: (clientId: number) => `api:portfolio:${clientId}`,
  holdings: (clientId: number) => `api:holdings:${clientId}`,
  favorites: (userId: number) => `api:favorites:${userId}`,
  recentOrders: (userId: number) => `api:recent-orders:${userId}`,
  sipPlans: (clientId: number) => `api:sip-plans:${clientId}`,
};

// Cache TTLs (in milliseconds)
export const cacheTTLs = {
  products: 10 * 60 * 1000, // 10 minutes
  product: 30 * 60 * 1000, // 30 minutes
  portfolio: 2 * 60 * 1000, // 2 minutes
  holdings: 2 * 60 * 1000, // 2 minutes
  favorites: 5 * 60 * 1000, // 5 minutes
  recentOrders: 1 * 60 * 1000, // 1 minute
  sipPlans: 5 * 60 * 1000, // 5 minutes
};

// Clean up expired entries periodically
if (typeof window !== 'undefined') {
  setInterval(() => {
    apiCache.clearExpired();
  }, 60 * 1000); // Every minute
  
  // Enable persistence by default in browser
  apiCache.enablePersistence();
}

