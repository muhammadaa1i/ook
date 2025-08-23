/**
 * Advanced caching layer for API responses
 * Provides memory caching, request deduplication, and cache invalidation
 */

interface CacheEntry<T = unknown> {
  data: T;
  timestamp: number;
  ttl: number;
}

interface PendingRequest {
  promise: Promise<unknown>;
  timestamp: number;
}

class AdvancedCache {
  private cache = new Map<string, CacheEntry>();
  private pendingRequests = new Map<string, PendingRequest>();
  private readonly defaultTTL = 5 * 60 * 1000; // 5 minutes
  private readonly maxCacheSize = 100;

  /**
   * Generate cache key from endpoint and params
   */
  private generateKey(
    endpoint: string,
    params?: Record<string, unknown>
  ): string {
    const sortedParams = params
      ? Object.keys(params)
          .sort()
          .reduce((result, key) => {
            result[key] = params[key];
            return result;
          }, {} as Record<string, unknown>)
      : {};

    return `${endpoint}:${JSON.stringify(sortedParams)}`;
  }

  /**
   * Check if cache entry is valid
   */
  private isValid(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp < entry.ttl;
  }

  /**
   * Clean up expired entries and maintain cache size
   */
  private cleanup(): void {
    const now = Date.now();

    // Remove expired entries
    for (const [key, entry] of this.cache.entries()) {
      if (!this.isValid(entry)) {
        this.cache.delete(key);
      }
    }

    // Remove oldest entries if cache is too large
    if (this.cache.size > this.maxCacheSize) {
      const entries = Array.from(this.cache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);

      const toRemove = entries.slice(0, entries.length - this.maxCacheSize);
      toRemove.forEach(([key]) => this.cache.delete(key));
    }

    // Clean up old pending requests (older than 30 seconds)
    for (const [key, pending] of this.pendingRequests.entries()) {
      if (now - pending.timestamp > 30000) {
        this.pendingRequests.delete(key);
      }
    }
  }

  /**
   * Get data from cache
   */
  get<T>(endpoint: string, params?: Record<string, unknown>): T | null {
    const key = this.generateKey(endpoint, params);
    const entry = this.cache.get(key);

    if (entry && this.isValid(entry)) {
      return entry.data as T;
    }

    if (entry) {
      this.cache.delete(key); // Remove expired entry
    }

    return null;
  }

  /**
   * Set data in cache
   */
  set<T>(
    endpoint: string,
    data: T,
    params?: Record<string, unknown>,
    ttl?: number
  ): void {
    const key = this.generateKey(endpoint, params);

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL,
    });

    // Periodically cleanup
    if (Math.random() < 0.1) {
      // 10% chance
      this.cleanup();
    }
  }

  /**
   * Check if request is already pending
   */
  hasPendingRequest(
    endpoint: string,
    params?: Record<string, unknown>
  ): boolean {
    const key = this.generateKey(endpoint, params);
    const pending = this.pendingRequests.get(key);

    if (pending && Date.now() - pending.timestamp < 30000) {
      return true;
    }

    if (pending) {
      this.pendingRequests.delete(key);
    }

    return false;
  }

  /**
   * Get pending request promise
   */
  getPendingRequest(
    endpoint: string,
    params?: Record<string, unknown>
  ): Promise<unknown> | null {
    const key = this.generateKey(endpoint, params);
    return this.pendingRequests.get(key)?.promise || null;
  }

  /**
   * Set pending request
   */
  setPendingRequest(
    endpoint: string,
    promise: Promise<unknown>,
    params?: Record<string, unknown>
  ): void {
    const key = this.generateKey(endpoint, params);

    this.pendingRequests.set(key, {
      promise,
      timestamp: Date.now(),
    });

    // Clean up when promise resolves or rejects
    promise.finally(() => {
      this.pendingRequests.delete(key);
    });
  }

  /**
   * Invalidate cache entries by pattern
   */
  invalidate(pattern?: string): void {
    if (!pattern) {
      this.cache.clear();
      return;
    }

    for (const [key] of this.cache.entries()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get cache stats
   */
  getStats(): { size: number; pendingRequests: number; hitRate: number } {
    return {
      size: this.cache.size,
      pendingRequests: this.pendingRequests.size,
      hitRate: 0, // Could implement hit rate tracking if needed
    };
  }

  /**
   * Clear all cache and pending requests
   */
  clear(): void {
    this.cache.clear();
    this.pendingRequests.clear();
  }
}

// Export singleton instance
export const cache = new AdvancedCache();

/**
 * Cache configuration for different endpoints
 */
export const CACHE_CONFIG = {
  // Static data - cache for longer
  CATEGORIES: { ttl: 30 * 60 * 1000 }, // 30 minutes
  PRODUCTS_LIST: { ttl: 5 * 60 * 1000 }, // 5 minutes
  PRODUCT_DETAIL: { ttl: 10 * 60 * 1000 }, // 10 minutes

  // Dynamic data - shorter cache
  USER_PROFILE: { ttl: 2 * 60 * 1000 }, // 2 minutes
  ORDERS: { ttl: 1 * 60 * 1000 }, // 1 minute

  // Very dynamic data - no cache or very short
  SEARCH: { ttl: 30 * 1000 }, // 30 seconds
  CART: { ttl: 0 }, // No cache
} as const;
