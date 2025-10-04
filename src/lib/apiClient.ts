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
        const refreshToken = Cookies.get("refresh_token");
        if (!refreshToken) {
          throw new Error("No refresh token");
        }

        const response = await axios.post(buildUrl("/auth/refresh"), {
          refresh_token: refreshToken,
          refreshToken: refreshToken, // backend compatibility
        });

        const { access_token, refresh_token: newRefreshToken } = response.data;

        const cookieOptions = {
          sameSite: 'lax' as const,
          secure: process.env.NODE_ENV === 'production',
          path: '/',
        };
        Cookies.set("access_token", access_token, { ...cookieOptions, expires: 1 });
        if (newRefreshToken) {
          Cookies.set("refresh_token", newRefreshToken, { ...cookieOptions, expires: 30 });
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
