import axios, { AxiosRequestConfig } from "axios";
import Cookies from "js-cookie";
import { API_BASE_URL } from "./constants";

// Single direct axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
});

const buildUrl = (endpoint: string, params?: Record<string, unknown>) => {
  // In the browser, route via Next.js proxy to avoid CORS
  if (typeof window !== 'undefined') {
    const url = new URL('/api/proxy', window.location.origin);
    const ep = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    url.searchParams.set('endpoint', ep);
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null) url.searchParams.append(k, String(v));
      });
    }
    const finalUrl = url.toString();
    
    // Debug URL construction for auth endpoints
    if (endpoint.includes('/auth/')) {
      console.log("Built URL for auth endpoint:", { endpoint, finalUrl });
    }
    
    return finalUrl;
  }
  // On server (SSR/route handlers), call backend directly
  const url = new URL(endpoint.replace(/^\/+/, '/'), API_BASE_URL + '/');
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null) url.searchParams.append(k, String(v));
    });
  }
  return url.toString();
};

api.interceptors.request.use(
  (config) => {
    let token = Cookies.get("access_token");
    
    // Fallback to localStorage if cookies are not available (mobile browsers)
    if (!token && typeof window !== "undefined") {
      try {
        token = localStorage.getItem("access_token") || undefined;
      } catch (error) {
        console.warn("Failed to access localStorage:", error);
      }
    }
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Don't attempt token refresh for login/register endpoints
    const requestUrl = originalRequest.url || '';
    const isAuthEndpoint = requestUrl.includes('endpoint=%2Fauth%2Flogin') ||
      requestUrl.includes('endpoint=%2Fauth%2Fregister') ||
      requestUrl.includes('endpoint=/auth/login') ||
      requestUrl.includes('endpoint=/auth/register') ||
      requestUrl.includes('/auth/login') ||
      requestUrl.includes('/auth/register');

    // Removed verbose development logging for performance

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      originalRequest._retry = true;

      try {
        let refreshToken = Cookies.get("refresh_token");
        
        // Fallback to localStorage for mobile browsers
        if (!refreshToken && typeof window !== "undefined") {
          try {
            refreshToken = localStorage.getItem("refresh_token") || undefined;
          } catch (error) {
            console.warn("Failed to access localStorage for refresh token:", error);
          }
        }
        
        if (!refreshToken) {
          throw new Error("No refresh token");
        }

        // Create a fresh axios instance without interceptors for refresh to avoid infinite loops
        const refreshResponse = await fetch(buildUrl("/auth/refresh"), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            refresh_token: refreshToken,
            refreshToken: refreshToken, // backend compatibility
          }),
        });

        if (!refreshResponse.ok) {
          const errorText = await refreshResponse.text();
          console.error("Token refresh failed:", {
            status: refreshResponse.status,
            statusText: refreshResponse.statusText,
            body: errorText
          });
          throw new Error(`Refresh failed: ${refreshResponse.status} - ${errorText}`);
        }

        const responseData = await refreshResponse.json();
        const { access_token, refresh_token: newRefreshToken } = responseData;

        if (!access_token) {
          throw new Error("No access token received from refresh");
        }

        const cookieOptions = {
          sameSite: 'lax' as const,
          secure: typeof window !== "undefined" ? window.location.protocol === "https:" : process.env.NODE_ENV === 'production',
          path: '/',
          // Fix domain handling for mobile browsers
          ...(typeof window !== "undefined" && 
              !window.location.hostname.includes("localhost") && 
              !window.location.hostname.includes("127.0.0.1") &&
              window.location.hostname.includes(".") 
              ? { domain: window.location.hostname } : {})
        };
        
        try {
          Cookies.set("access_token", access_token, { ...cookieOptions, expires: 1 });
          if (newRefreshToken) {
            Cookies.set("refresh_token", newRefreshToken, { ...cookieOptions, expires: 30 });
          }
          
          // Also update localStorage for mobile compatibility
          localStorage.setItem("access_token", access_token);
          if (newRefreshToken) {
            localStorage.setItem("refresh_token", newRefreshToken);
          }
        } catch (storageError) {
          console.warn("Failed to store tokens:", storageError);
        }

        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Don't immediately logout during payment flows
        const isPaymentFlow = typeof window !== "undefined" &&
          (window.location.pathname.includes('/payment/') ||
            window.location.search.includes('transfer_id') ||
            window.location.search.includes('payment_uuid') ||
            window.location.search.includes('octo_payment_UUID') ||
            window.location.search.includes('octo-status'));

        if (!isPaymentFlow) {
          Cookies.remove("access_token");
          Cookies.remove("refresh_token");
          Cookies.remove("user");
          // Dispatch custom event for AuthContext to handle
          if (typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent("auth:logout"));
          }
          // Don't redirect to login if already on login page
          if (typeof window !== "undefined" && !window.location.pathname.includes('/auth/login')) {
            setTimeout(() => (window.location.href = "/auth/login"), 100);
          }
        } else {
          if (process.env.NODE_ENV !== 'production') {
            console.warn("Token refresh failed during payment flow - preserving session", refreshError);
          }
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// (Removed duplicate second interceptor set – single instance handles refresh above)
api.interceptors.response.use((r) => r, (e) => Promise.reject(e));

// API methods that automatically handle proxy formatting
export const apiClient = {
  get: (endpoint: string, params?: Record<string, unknown>, config?: AxiosRequestConfig) => api.get(buildUrl(endpoint, params), config),
  post: (endpoint: string, data?: unknown, params?: Record<string, unknown>, config?: AxiosRequestConfig) => api.post(buildUrl(endpoint, params), data, config),
  put: (endpoint: string, data?: unknown, params?: Record<string, unknown>, config?: AxiosRequestConfig) => api.put(buildUrl(endpoint, params), data, config),
  delete: (endpoint: string, params?: Record<string, unknown>, config?: AxiosRequestConfig) => api.delete(buildUrl(endpoint, params), config),
};

export default api;
