import axios from "axios";
import Cookies from "js-cookie";
import { API_BASE_URL } from "./constants";

// Unified token manager (cookies + localStorage backup for post-payment restores)
const tokenStorage = {
  get access() {
    let v = Cookies.get("access_token");
    if (!v) try { v = localStorage.getItem("access_token") || undefined; } catch {}
    return v;
  },
  get refresh() {
    let v = Cookies.get("refresh_token");
    if (!v) try { v = localStorage.getItem("refresh_token") || undefined; } catch {}
    return v;
  },
  set(access?: string, refresh?: string) {
    const cookieOptions = { sameSite: "lax" as const, secure: process.env.NODE_ENV === "production", path: "/" };
    if (access) {
      Cookies.set("access_token", access, { ...cookieOptions, expires: 1 });
      try { localStorage.setItem("access_token", access); } catch {}
    }
    if (refresh) {
      Cookies.set("refresh_token", refresh, { ...cookieOptions, expires: 30 });
      try { localStorage.setItem("refresh_token", refresh); } catch {}
    }
  },
  clear() {
    Cookies.remove("access_token");
    Cookies.remove("refresh_token");
    Cookies.remove("user");
    try { localStorage.removeItem("access_token"); localStorage.removeItem("refresh_token"); } catch {}
  }
};

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 35000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = tokenStorage.access;
    if (token) config.headers.Authorization = `Bearer ${token}`;
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

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = tokenStorage.refresh;
        if (!refreshToken || refreshToken.trim() === '') {
          console.warn('[api.ts] No valid refresh token available');
          throw new Error("No refresh token");
        }
        // Multi-strategy refresh attempts based on backend guidance
        interface StrategyResult { access?: string; refresh?: string }
        const parseTokens = (resp: any): StrategyResult => {
          if (!resp) return {};
          const data = resp.data || {};
          let access = data.access_token || data.accessToken || data.access;
          let refresh = data.refresh_token || data.refreshToken || data.refresh;
          // Header fallbacks
          const authH = resp.headers?.["authorization"] || resp.headers?.["Authorization"];
          if (!access && authH && /bearer/i.test(authH)) {
            const parts = authH.split(/\s+/); if (parts.length === 2) access = parts[1];
          }
          if (!refresh) refresh = resp.headers?.["refresh-token"] || resp.headers?.["Refresh-Token"];
          return { access, refresh };
        };

        const endpoint = `${API_BASE_URL.replace(/\/$/,'')}/auth/refresh`;
        const attempts: Array<{ label: string; exec: () => Promise<any> }> = [
          { // both body + header (safest approach)
            label: 'body-and-header',
            exec: () => axios.post(endpoint, { refresh_token: refreshToken }, { headers: { 'Refresh-Token': refreshToken } })
          },
          { // trailing slash variant with both
            label: 'body-and-header-slash',
            exec: () => axios.post(endpoint + '/', { refresh_token: refreshToken }, { headers: { 'Refresh-Token': refreshToken } })
          },
          { // header only fallback
            label: 'header-only',
            exec: () => axios.post(endpoint, {}, { headers: { 'Refresh-Token': refreshToken } })
          },
          { // body only fallback
            label: 'body-only',
            exec: () => axios.post(endpoint, { refresh_token: refreshToken })
          }
        ];

        let tokens: StrategyResult | null = null;
        let lastErr: unknown = null;
        for (const a of attempts) {
          try {
            const resp = await a.exec();
            tokens = parseTokens(resp);
            if (tokens.access || tokens.refresh) break; // success
          } catch (e:any) {
            lastErr = e;
            const status = e?.response?.status;
            // 400/422 mean invalid format or token -> try next strategy
            if (status === 400 || status === 422) continue; else throw e;
          }
        }
        if (!tokens || !tokens.access) {
          throw lastErr || new Error('Unable to refresh token');
        }
        tokenStorage.set(tokens.access, tokens.refresh);
        originalRequest.headers.Authorization = `Bearer ${tokens.access}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed, redirect to login
        // Graceful handling: avoid nuking session during payment flow
        const isPaymentFlow = typeof window !== 'undefined' && (
          window.location.pathname.includes('/payment/') ||
          window.location.search.includes('transfer_id') ||
          window.location.search.includes('payment_uuid')
        );
        if (!isPaymentFlow) {
          tokenStorage.clear();
          window.location.href = "/auth/login";
        } else if (process.env.NODE_ENV !== 'production') {
          console.warn('[api.ts] refresh failed during payment flow – preserving session');
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
