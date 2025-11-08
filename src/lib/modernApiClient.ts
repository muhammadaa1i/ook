/**
 * Modern API Client with advanced caching, request deduplication, and performance optimization
 */

import Cookies from "js-cookie";
import { API_BASE_URL } from "./constants";

interface CacheEntry<T = unknown> {
  data: T;
  timestamp: number;
  expiry: number;
}

interface RequestConfig {
  cache?: boolean;
  ttl?: number;
  retries?: number;
  timeout?: number;
  /** Force network fetch (skip reading existing cache) but still write result if cache=true */
  force?: boolean;
}

class ModernApiClient {
  // Caching disabled: keep empty maps but never read/write
  private cache = new Map<string, CacheEntry>();
  private pendingRequests = new Map<string, Promise<unknown>>();
  private readonly baseURL = API_BASE_URL; // direct backend base URL
  private refreshPromise: Promise<boolean> | null = null; // shared in-flight refresh
  private lastNavigationTime = 0; // Track last navigation to prevent premature logout

  constructor() {
    // Track navigation events to prevent logout during browser back/forward/reload
    if (typeof window !== "undefined") {
      const updateNavigationTime = () => {
        this.lastNavigationTime = Date.now();
      };
      
      window.addEventListener('popstate', updateNavigationTime);
      window.addEventListener('pageshow', updateNavigationTime);
      window.addEventListener('beforeunload', updateNavigationTime); // Track hard refresh
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          updateNavigationTime();
        }
      });
      
      // Also update on initial load to handle hard refresh
      updateNavigationTime();
    }
  }

  // Cache TTL configurations (in milliseconds) - optimized for better performance
  private readonly cacheTTL = {
    categories: 30 * 60 * 1000, // 30 minutes (categories rarely change)
    products: 3 * 60 * 1000, // 3 minutes (balance between freshness and performance)
    productDetail: 10 * 60 * 1000, // 10 minutes
    profile: 1 * 60 * 1000, // 1 minute (user data can change)
    orders: 30 * 1000, // 30 seconds (orders change frequently)
    search: 2 * 60 * 1000, // 2 minutes (search results can be cached longer)
  };

  private getCacheKey(
    endpoint: string,
    params?: Record<string, unknown>
  ): string {
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

  private setCache(key: string, data: unknown, ttl: number): void {
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
      params?: Record<string, unknown>;
      timeout?: number;
    } = {}
  ): Promise<unknown> {
    const {
      params,
      headers: optionHeaders,
      timeout = 4000, // Ultra-fast timeout for maximum speed
      ...fetchOptions
    } = options;

    const attemptRequest = async (): Promise<Response> => {
      // Build URL. In browser, route via Next.js proxy to avoid CORS.
      let url: URL;
      if (typeof window !== "undefined") {
        // Same-origin proxy
        url = new URL("/api/proxy", window.location.origin);
        const ep = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
        url.searchParams.set("endpoint", ep);
        if (params) {
          Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null)
              url.searchParams.append(key, String(value));
          });
        }
      } else {
        // Server-side direct backend call
        url = new URL(endpoint.replace(/^\/+/, "/"), this.baseURL + "/");
        if (params) {
          Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null)
              url.searchParams.append(key, String(value));
          });
        }
      }

      // Get auth token from cookies each attempt (may change after refresh)
      const token = Cookies.get("access_token");
      const defaultHeaders: Record<string, string> = {
        Accept: "application/json",
      };
      if (token) {
        defaultHeaders.Authorization = `Bearer ${token}`;
      }
      const headers = {
        ...defaultHeaders,
        ...(optionHeaders as Record<string, string>),
      };

      // Only set Content-Type automatically for non-GET requests when a body is present
      const method = (options.method || "GET").toUpperCase();
      if (method !== "GET" && !headers["Content-Type"]) {
        headers["Content-Type"] = "application/json";
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      try {
        
        const response = await fetch(url.toString(), {
          method: options.method || "GET",
          headers,
          signal: controller.signal,
          // Performance optimizations
          keepalive: true,
          cache: method === "GET" ? "default" : "no-cache",
          ...fetchOptions,
        });
        clearTimeout(timeoutId);
        return response;
      } catch (err) {
        clearTimeout(timeoutId);
        throw err;
      }
    };

    let response: Response | null = null;
    try {
      response = await attemptRequest();
      // Skip automatic refresh to avoid CORS issues - let user log in again
      // if (
      //   response.status === 401 &&
      //   Cookies.get("refresh_token") &&
      //   !triedRefresh
      // ) {
      //   const refreshed = await this.refreshAccessToken();
      //   triedRefresh = true;
      //   if (refreshed) {
      //     response = await attemptRequest();
      //   }
      // }

      if (!response.ok) {
        // Enhanced 401 debugging and automatic logout
        if (response.status === 401) {
          const hasRefreshToken = !!Cookies.get("refresh_token");
          const hasAccessToken = !!Cookies.get("access_token");
          const isAdminEndpoint = endpoint.includes('/admin') || endpoint.includes('/orders');
          
          console.log('🔐 401 Error Details:', {
            endpoint,
            hasRefreshToken,
            hasAccessToken,
            isAdminEndpoint,
            timestamp: new Date().toISOString()
          });
          
          // Try token refresh if available
          if (hasRefreshToken && !endpoint.includes('/auth/refresh')) {
            try {
              console.log('🔄 Attempting token refresh for:', endpoint);
              const refreshed = await this.refreshAccessToken();
              if (refreshed) {
                console.log('✅ Token refreshed successfully, retrying request:', endpoint);
                // Retry the original request with new token
                return this.makeRequest(endpoint, options);
              } else {
                console.error('❌ Token refresh returned false');
              }
            } catch (refreshError) {
              console.error("❌ Token refresh failed:", refreshError);
            }
          } else if (!hasRefreshToken) {
            console.error('❌ No refresh token available');
          }
          
          // Clear invalid tokens and redirect to login only if refresh failed
          // But don't do this during navigation or hard refresh to prevent logout
          const isRecentNavigation = (Date.now() - this.lastNavigationTime) < 5000;
          const isNavigatingNow = document.readyState !== 'complete' || 
                                  document.visibilityState === 'hidden';
          const isHardRefresh = typeof window !== "undefined" && 
            (performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming)?.type === "reload";
          
          if (!isRecentNavigation && !isNavigatingNow && !isHardRefresh) {
            Cookies.remove("access_token");
            Cookies.remove("refresh_token");
            Cookies.remove("user");
            
            // Clear localStorage as well
            try {
              localStorage.removeItem("auth_token");
              localStorage.removeItem("user");
              localStorage.removeItem("refresh_token");
            } catch {}
            
            // Only redirect to login if we're not already on auth pages
            if (typeof window !== "undefined" && 
                !window.location.pathname.includes('/auth/') &&
                !window.location.pathname.includes('/login')) {
              setTimeout(() => {
                window.location.href = '/auth/login?message=Session expired, please log in again';
              }, 1000);
            }
          }
        }

        // Log error response for debugging refund issues
        if (endpoint.includes('/payments/octo/refund')) {
          try {
            const errorText = await response.clone().text();
            // Make error more visible for refund debugging
            alert(`REFUND ERROR:\nStatus: ${response.status}\nResponse: ${errorText}`);
          } catch {
            // Ignore errors when reading response body
          }
        }

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
        (error as Error & { status?: number; statusText?: string }).status =
          response.status;
        (error as Error & { status?: number; statusText?: string }).statusText =
          response.statusText;
        throw error;
      }
      return response.json();
    } catch (error: unknown) {
      if (error instanceof DOMException && error.name === "AbortError") {
        throw new Error(
          "Request timeout - Please check your connection and try again"
        );
      }
      throw error;
    }
  }

  /** Attempt to refresh access token using refresh_token cookie */
  async refreshAccessToken(): Promise<boolean> {
    if (this.refreshPromise) return this.refreshPromise;
    const refreshToken = Cookies.get("refresh_token");
    if (!refreshToken) return false;

    this.refreshPromise = (async () => {
      try {
        // Helper: parse tokens from body + headers
        const parseTokens = async (resp: Response): Promise<{ access?: string; refresh?: string }> => {
          let body: Record<string, unknown> = {};
          try { body = await resp.clone().json(); } catch {}
          const headers = resp.headers;
          let access = (body["access_token"] || body["accessToken"] || body["access"]) as string | undefined;
          if (!access) {
            const authH = headers.get("Authorization") || headers.get("authorization");
            if (authH && /bearer/i.test(authH)) {
              const parts = authH.split(/\s+/);
              if (parts.length === 2) access = parts[1];
            }
          }
            let refresh = (body["refresh_token"] || body["refreshToken"] || body["refresh"]) as string | undefined;
            if (!refresh) refresh = headers.get("Refresh-Token") || headers.get("refresh-token") || undefined;
          return { access, refresh };
        };

        // Direct API calls for refresh token (different from regular API calls)
        const build = (suffix: string) => new URL(suffix.replace(/^\/+/, "/"), this.baseURL + "/").toString();
        const strategies: Array<{ label: string; run: () => Promise<Response> }> = [
          {
            label: "json-double-field",
            run: () => fetch(build("/auth/refresh"), {
              method: "POST",
              headers: { "Content-Type": "application/json", Accept: "application/json" },
              body: JSON.stringify({ refresh_token: refreshToken, refreshToken }),
            }),
          },
          {
            label: "header-refresh-token",
            run: () => fetch(build("/auth/refresh"), {
              method: "POST",
              headers: { "Refresh-Token": refreshToken, Accept: "application/json" },
            }),
          },
          {
            label: "form-urlencoded",
            run: () => fetch(build("/auth/refresh"), {
              method: "POST",
              headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
              body: new URLSearchParams({ refresh_token: refreshToken }).toString(),
            }),
          },
        ];

        let lastErr: unknown = null;
        for (const strat of strategies) {
          let resp = await strat.run();
          if (!resp.ok && (resp.status === 404 || resp.status === 422)) {
            // attempt with trailing slash variant
            resp = await fetch(build("/auth/refresh/"), { 
              method: "POST", 
              headers: { "Content-Type": "application/json", "Accept": "application/json" }
            });
          }
          if (resp.ok) {
            const { access, refresh } = await parseTokens(resp);
            const cookieOptions = { sameSite: "lax" as const, secure: process.env.NODE_ENV === "production", path: "/" };
            if (access) Cookies.set("access_token", access, { ...cookieOptions, expires: 1 });
            if (refresh) Cookies.set("refresh_token", refresh, { ...cookieOptions, expires: 30 });
            if (access || refresh) return !!access;
            lastErr = new Error(`Refresh strategy '${strat.label}' returned no tokens`);
            continue;
          } else {
            if (resp.status === 422) {
              // Refresh strategy failed with validation error
            }
            lastErr = new Error(`Refresh strategy '${strat.label}' failed status ${resp.status}`);
            continue;
          }
        }
        throw lastErr || new Error("All refresh strategies failed");
      } catch {
        // Don't immediately logout during payment flows or navigation - could be temporary network issues
        const isPaymentFlow = typeof window !== "undefined" && 
          (window.location.pathname.includes('/payment/') || 
           window.location.search.includes('transfer_id') ||
           window.location.search.includes('payment_uuid') ||
           window.location.search.includes('octo_payment_UUID') ||
           window.location.search.includes('octo-status'));

        // Check if we're in the middle of navigation (browser back/forward/reload)
        const isNavigating = typeof window !== "undefined" && 
          (document.readyState !== 'complete' || 
           document.visibilityState === 'hidden' ||
           // Check if this is a browser navigation event (including reload/hard refresh)
           (performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming)?.type === "back_forward" ||
           (performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming)?.type === "reload" ||
           // Don't logout within 5 seconds of navigation to avoid race conditions (increased from 3s)
           (Date.now() - this.lastNavigationTime) < 5000);
           
        if (!isPaymentFlow && !isNavigating) {
          // Clear auth data & notify app to logout only if not in payment flow or navigation
          Cookies.remove("access_token");
          Cookies.remove("refresh_token");
          Cookies.remove("user");
          if (typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent("auth:logout"));
          }
        } else {
          // During payment flow, just log the error but don't logout
          
          // Try to restore from backup if available
          const userBackup = sessionStorage.getItem('userBackup');
          if (userBackup) {
            try {
              const cookieOptions = {
                sameSite: "strict" as const,
                secure: process.env.NODE_ENV === "production",
              };
              Cookies.set("user", userBackup, {
                ...cookieOptions,
                expires: 7,
              });

            } catch {
              // Failed to restore user from backup
            }
          }
        }
        return false;
      } finally {
        // Reset promise holder shortly after to allow future attempts
        const p = this.refreshPromise; // keep reference
        setTimeout(() => {
          if (this.refreshPromise === p) this.refreshPromise = null;
        }, 50);
      }
    })();
    return this.refreshPromise;
  }

  async get(
    endpoint: string,
    params?: Record<string, unknown>,
    config: RequestConfig = {}
  ): Promise<unknown> {
    // Caching & dedupe disabled: strip related config
    const { retries = 1, timeout = 3000 } = config; // Ultra-fast for GET requests
    // Global safeguard: disable caching for admin product & order endpoints automatically when on /admin route
    // Admin override no longer needed since cache fully disabled

    // Check cache first
    // Cache read disabled globally

    // Check if request is already pending (request deduplication)
    // Request deduplication disabled (always new network request)

    // Create new request
    const requestPromise = this.executeWithRetries(
      () => this.makeRequest(endpoint, { params }),
      retries,
      timeout
    );

    // Skip storing pending request (dedupe disabled)

    try {
      const data = await requestPromise;

      // Cache the result
      // Skip cache write

      return data;
    } finally {
      // Remove from pending requests
      // No pending request cleanup needed
    }
  }

  async post(
    endpoint: string,
    data?: unknown,
    config: RequestConfig = {}
  ): Promise<unknown> {
    const { retries = 1, timeout = 5000 } = config; // Ultra-fast for POST requests

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
    data?: unknown,
    config: RequestConfig = {}
  ): Promise<unknown> {
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

  async delete(endpoint: string, config: RequestConfig = {}): Promise<unknown> {
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
    fn: () => Promise<unknown>,
    retries: number,
    timeout: number
  ): Promise<unknown> {
    for (let i = 0; i <= retries; i++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const result = await fn();
        clearTimeout(timeoutId);
        return result;
      } catch (error: unknown) {
        if (i === retries) throw error;

        // Don't retry on certain error types
        if (
          error &&
          typeof error === "object" &&
          "status" in error &&
          (error as { status: number }).status &&
          [400, 401, 403, 404, 422].includes(
            (error as { status: number }).status
          )
        ) {
          throw error; // Client errors - don't retry
        }

        // For server errors (5xx) and network errors, use exponential backoff
        const errorWithStatus = error as { status?: number; name?: string };
        const isServerError =
          errorWithStatus.status && errorWithStatus.status >= 500;
        const isNetworkError =
          !errorWithStatus.status || errorWithStatus.name === "AbortError";

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
    requests: Array<{ endpoint: string; params?: Record<string, unknown> }>
  ): Promise<unknown[]> {
    const promises = requests.map(({ endpoint, params }) =>
      this.get(endpoint, params).catch((error) => ({ error }))
    );

    return Promise.all(promises);
  }

  // Preload data for better UX
  preload(endpoint: string, params?: Record<string, unknown>): void {
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
