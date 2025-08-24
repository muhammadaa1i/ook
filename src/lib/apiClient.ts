import axios, { AxiosRequestConfig } from "axios";
import Cookies from "js-cookie";

// Create axios instance for our proxy API (with interceptors)
const proxyApi = axios.create({
  timeout: 35000, // Increased timeout for proxy
  headers: {
    "Content-Type": "application/json",
  },
});

// Create separate axios instance for the old api (compatibility)
const api = axios.create({
  baseURL: "/api/proxy",
  timeout: 35000, // Increased timeout for proxy
  headers: {
    "Content-Type": "application/json",
  },
});

// Helper function to build proxy URL
const buildProxyUrl = (endpoint: string, params?: Record<string, unknown>) => {
  const url = new URL("/api/proxy", window.location.origin);
  url.searchParams.append("endpoint", endpoint);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value));
      }
    });
  }

  return url.pathname + url.search;
};

// Request interceptor for proxyApi to add auth token
proxyApi.interceptors.request.use(
  (config) => {
    const token = Cookies.get("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for proxyApi to handle token refresh
proxyApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Don't attempt token refresh for login/register endpoints
    const requestUrl = originalRequest.url || '';
    const isAuthEndpoint = requestUrl.includes('endpoint=/auth/login') || 
                          requestUrl.includes('endpoint=/auth/register');
    
    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      originalRequest._retry = true;

      try {
        const refreshToken = Cookies.get("refresh_token");
        if (!refreshToken) {
          throw new Error("No refresh token");
        }

        const url = new URL("/api/proxy", window.location.origin);
        url.searchParams.append("endpoint", "/auth/refresh");

        const response = await axios.post(url.pathname + url.search, {
          refresh_token: refreshToken,
        });

        const { access_token, refresh_token: newRefreshToken } = response.data;

        Cookies.set("access_token", access_token, { expires: 1 });
        if (newRefreshToken) {
          Cookies.set("refresh_token", newRefreshToken, { expires: 30 });
        }

        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        return proxyApi(originalRequest);
      } catch (refreshError) {
        Cookies.remove("access_token");
        Cookies.remove("refresh_token");
        Cookies.remove("user");
        // Dispatch custom event for AuthContext to handle
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("auth:logout"));
        }
        setTimeout(() => (window.location.href = "/auth/login"), 100);
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Request interceptor to add auth token and format for proxy
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Don't attempt token refresh for login/register endpoints
    const requestUrl = originalRequest.url || '';
    const isAuthEndpoint = requestUrl.includes('endpoint=/auth/login') || 
                          requestUrl.includes('endpoint=/auth/register');

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      originalRequest._retry = true;

      try {
        const refreshToken = Cookies.get("refresh_token");
        if (!refreshToken) {
          throw new Error("No refresh token");
        }

        const response = await axios.post(buildProxyUrl("/auth/refresh"), {
          refresh_token: refreshToken,
        });

        const { access_token, refresh_token: newRefreshToken } = response.data;

        Cookies.set("access_token", access_token, { expires: 1 });
        if (newRefreshToken) {
          Cookies.set("refresh_token", newRefreshToken, { expires: 30 });
        }

        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        return api(originalRequest);
      } catch (refreshError) {
        Cookies.remove("access_token");
        Cookies.remove("refresh_token");
        Cookies.remove("user");
        // Dispatch custom event for AuthContext to handle
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("auth:logout"));
        }
        setTimeout(() => (window.location.href = "/auth/login"), 100);
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// API methods that automatically handle proxy formatting
export const apiClient = {
  get: (
    endpoint: string,
    params?: Record<string, unknown>,
    config?: AxiosRequestConfig
  ) => {
    const url = new URL("/api/proxy", window.location.origin);
    url.searchParams.append("endpoint", endpoint);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    return proxyApi.get(url.pathname + url.search, config);
  },

  post: (
    endpoint: string,
    data?: unknown,
    params?: Record<string, unknown>,
    config?: AxiosRequestConfig
  ) => {
    const url = new URL("/api/proxy", window.location.origin);
    url.searchParams.append("endpoint", endpoint);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    return proxyApi.post(url.pathname + url.search, data, config);
  },

  put: (
    endpoint: string,
    data?: unknown,
    params?: Record<string, unknown>,
    config?: AxiosRequestConfig
  ) => {
    const url = new URL("/api/proxy", window.location.origin);
    url.searchParams.append("endpoint", endpoint);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    return proxyApi.put(url.pathname + url.search, data, config);
  },

  delete: (
    endpoint: string,
    params?: Record<string, unknown>,
    config?: AxiosRequestConfig
  ) => {
    const url = new URL("/api/proxy", window.location.origin);
    url.searchParams.append("endpoint", endpoint);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    return proxyApi.delete(url.pathname + url.search, config);
  },
};

export default api;
