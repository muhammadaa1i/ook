/**
 * Modern API Client with advanced caching, request deduplication, and performance optimization
 */

import Cookies from "js-cookie";

interface CacheEntry {
  data: any;
  timestamp: number;
  expiry: number;
}

interface RequestConfig {
  cache?: boolean;
  ttl?: number;
  retries?: number;
  timeout?: number;
}

class ModernApiClient {
  private cache = new Map<string, CacheEntry>();
  private pendingRequests = new Map<string, Promise<any>>();
  private readonly baseURL = "/api/proxy";

  // Cache TTL configurations (in milliseconds) - optimized for better performance
  private readonly cacheTTL = {
    categories: 30 * 60 * 1000, // 30 minutes (categories rarely change)
    products: 3 * 60 * 1000, // 3 minutes (balance between freshness and performance)
    productDetail: 10 * 60 * 1000, // 10 minutes
    profile: 1 * 60 * 1000, // 1 minute (user data can change)
    orders: 30 * 1000, // 30 seconds (orders change frequently)
    search: 2 * 60 * 1000, // 2 minutes (search results can be cached longer)
  };

  private getCacheKey(endpoint: string, params?: Record<string, any>): string {
    const paramString = params ? JSON.stringify(params) : "";
    return `${endpoint}:${paramString}`;
  }

  private getCacheTTL(endpoint: string): number {
    if (endpoint.includes("/categories")) return this.cacheTTL.categories;
    if (endpoint.includes("/slippers/") && endpoint.match(/\/slippers\/\d+$/))
      return this.cacheTTL.productDetail;
    if (endpoint.includes("/slippers")) return this.cacheTTL.products;
    if (endpoint.includes("/profile") || endpoint.includes("/users/me"))
      return this.cacheTTL.profile;
    if (endpoint.includes("/orders")) return this.cacheTTL.orders;
    if (endpoint.includes("/search")) return this.cacheTTL.search;
    return 30 * 1000; // Default 30 seconds
  }

  private isValidCache(entry: CacheEntry): boolean {
    return Date.now() < entry.expiry;
  }

  private setCache(key: string, data: any, ttl: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiry: Date.now() + ttl,
    });

    // Cleanup old cache entries more aggressively (keep only last 50 for better memory management)
    if (this.cache.size > 50) {
      const entries = Array.from(this.cache.entries());
      entries.sort((a, b) => b[1].timestamp - a[1].timestamp);
      this.cache.clear();
      entries.slice(0, 50).forEach(([key, value]) => {
        this.cache.set(key, value);
      });
    }
  }

  private async makeRequest(
    endpoint: string,
    options: RequestInit & {
      params?: Record<string, any>;
      timeout?: number;
    } = {}
  ): Promise<any> {
    const {
      params,
      headers: optionHeaders,
      timeout = 8000,
      ...fetchOptions
    } = options;

    const url = new URL(this.baseURL, window.location.origin);
    url.searchParams.append("endpoint", endpoint);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    // Get auth token from cookies
    const token = Cookies.get("access_token");

    const defaultHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };

    // Add Authorization header if token exists
    if (token) {
      defaultHeaders.Authorization = `Bearer ${token}`;
    }

    // Merge default headers with provided headers
    const headers = {
      ...defaultHeaders,
      ...(optionHeaders as Record<string, string>),
    };

    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url.pathname + url.search, {
        method: options.method || "GET",
        headers,
        signal: controller.signal,
        ...fetchOptions,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        // Handle specific HTTP status codes with user-friendly messages
        let errorMessage = `HTTP error! status: ${response.status}`;

        switch (response.status) {
          case 503:
            errorMessage =
              "Server is temporarily unavailable. Please try again in a few moments.";
            break;
          case 502:
            errorMessage = "Server gateway error. Please try again later.";
            break;
          case 500:
            errorMessage = "Internal server error. Please try again later.";
            break;
          case 404:
            errorMessage = "Requested resource not found.";
            break;
          case 401:
            errorMessage = "Authentication required. Please log in again.";
            break;
          case 403:
            errorMessage =
              "Access denied. You don't have permission to access this resource.";
            break;
          case 429:
            errorMessage =
              "Too many requests. Please wait a moment before trying again.";
            break;
          default:
            errorMessage = `Server error (${response.status}). Please try again later.`;
        }

        const error = new Error(errorMessage);
        (error as any).status = response.status;
        (error as any).statusText = response.statusText;
        throw error;
      }

      return response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof DOMException && error.name === "AbortError") {
        throw new Error(
          "Request timeout - Please check your connection and try again"
        );
      }
      throw error;
    }
  }

  async get(
    endpoint: string,
    params?: Record<string, any>,
    config: RequestConfig = {}
  ): Promise<any> {
    const { cache = true, ttl, retries = 2, timeout = 10000 } = config;
    const cacheKey = this.getCacheKey(endpoint, params);

    // Check cache first
    if (cache) {
      const cached = this.cache.get(cacheKey);
      if (cached && this.isValidCache(cached)) {
        return cached.data;
      }
    }

    // Check if request is already pending (request deduplication)
    if (this.pendingRequests.has(cacheKey)) {
      return this.pendingRequests.get(cacheKey);
    }

    // Create new request
    const requestPromise = this.executeWithRetries(
      () => this.makeRequest(endpoint, { params }),
      retries,
      timeout
    );

    // Store pending request
    this.pendingRequests.set(cacheKey, requestPromise);

    try {
      const data = await requestPromise;

      // Cache the result
      if (cache) {
        const cacheTTL = ttl || this.getCacheTTL(endpoint);
        this.setCache(cacheKey, data, cacheTTL);
      }

      return data;
    } finally {
      // Remove from pending requests
      this.pendingRequests.delete(cacheKey);
    }
  }

  async post(
    endpoint: string,
    data?: any,
    config: RequestConfig = {}
  ): Promise<any> {
    const { retries = 2, timeout = 10000 } = config;

    return this.executeWithRetries(
      () =>
        this.makeRequest(endpoint, {
          method: "POST",
          body: data ? JSON.stringify(data) : undefined,
        }),
      retries,
      timeout
    );
  }

  async put(
    endpoint: string,
    data?: any,
    config: RequestConfig = {}
  ): Promise<any> {
    const { retries = 2, timeout = 10000 } = config;

    return this.executeWithRetries(
      () =>
        this.makeRequest(endpoint, {
          method: "PUT",
          body: data ? JSON.stringify(data) : undefined,
        }),
      retries,
      timeout
    );
  }

  async delete(endpoint: string, config: RequestConfig = {}): Promise<any> {
    const { retries = 2, timeout = 10000 } = config;

    return this.executeWithRetries(
      () =>
        this.makeRequest(endpoint, {
          method: "DELETE",
        }),
      retries,
      timeout
    );
  }

  private async executeWithRetries(
    fn: () => Promise<any>,
    retries: number,
    timeout: number
  ): Promise<any> {
    for (let i = 0; i <= retries; i++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const result = await fn();
        clearTimeout(timeoutId);
        return result;
      } catch (error: any) {
        if (i === retries) throw error;

        // Don't retry on certain error types
        if (error.status && [400, 401, 403, 404, 422].includes(error.status)) {
          throw error; // Client errors - don't retry
        }

        // For server errors (5xx) and network errors, use exponential backoff
        const isServerError = error.status && error.status >= 500;
        const isNetworkError = !error.status || error.name === "AbortError";

        if (isServerError || isNetworkError) {
          // Exponential backoff with jitter for server errors
          const baseDelay = Math.pow(2, i) * 1000;
          const jitter = Math.random() * 1000; // Add randomness to prevent thundering herd
          await new Promise((resolve) =>
            setTimeout(resolve, baseDelay + jitter)
          );
        } else {
          throw error; // Other errors - don't retry
        }
      }
    }
  }

  // Batch requests for better performance
  async batch(
    requests: Array<{ endpoint: string; params?: Record<string, any> }>
  ): Promise<any[]> {
    const promises = requests.map(({ endpoint, params }) =>
      this.get(endpoint, params).catch((error) => ({ error }))
    );

    return Promise.all(promises);
  }

  // Preload data for better UX
  preload(endpoint: string, params?: Record<string, any>): void {
    this.get(endpoint, params).catch(() => {
      // Silently fail for preloading
    });
  }

  // Clear cache
  clearCache(pattern?: string): void {
    if (!pattern) {
      this.cache.clear();
      return;
    }

    for (const [key] of this.cache) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  // Get cache stats for debugging
  getCacheStats(): { size: number; entries: string[] } {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys()),
    };
  }
}

export const modernApiClient = new ModernApiClient();
export default modernApiClient;
