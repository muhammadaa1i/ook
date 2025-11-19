"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
} from "react";
import Cookies from "js-cookie";
import { User, LoginRequest, RegisterRequest } from "@/types";
import { apiClient } from "@/lib/apiClient";
import { extractErrorMessage } from "@/lib/utils";
import { API_ENDPOINTS } from "@/lib/constants";
import { toast } from "react-toastify";
import { useI18n } from "@/i18n";
import { debugMobileAuth, isMobileDevice } from "@/lib/mobileDebug";
import { mobileStorage } from "@/lib/mobileStorage";
import { mobileErrorHandler } from "@/lib/mobileErrorHandler";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  register: (userData: RegisterRequest) => Promise<void>;
  forgotPassword: (payload: { name: string; password?: string; confirm_password?: string }) => Promise<void>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isInitializedRef = useRef(false);
  const tokenVerificationRef = useRef<boolean>(false);
  const { t } = useI18n();

  const isAuthenticated = useMemo(() => !!user, [user]);

  // Set a maximum loading time to prevent infinite loading
  useEffect(() => {
    const isMobile = typeof window !== "undefined" && 
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // Force loading to false after a short timeout
    const maxLoadingTime = isMobile ? 500 : 1000; // 500ms for mobile, 1s for desktop
    
    const timeoutId = setTimeout(() => {
      setIsLoading(false);
    }, maxLoadingTime);

    return () => clearTimeout(timeoutId);
  }, []);

  const clearAuthData = useCallback(() => {
    setUser(null);
    Cookies.remove("access_token");
    Cookies.remove("refresh_token");
    Cookies.remove("user");
    // Enhanced mobile storage cleanup
    mobileStorage.removeAuthToken();
    mobileStorage.removeUser();
    tokenVerificationRef.current = false;
  }, []);

  useEffect(() => {
    const initializeAuth = async () => {
      // Prevent multiple initialization calls and avoid init during browser navigation
      const navigationType = typeof window !== "undefined" && 
        (performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming)?.type;
      const isBackForwardNavigation = navigationType === "back_forward";
      
      if (isInitializedRef.current || isBackForwardNavigation) return;
      isInitializedRef.current = true;

      // Debug mobile issues in production
      if (process.env.NODE_ENV === "production" && isMobileDevice()) {
        debugMobileAuth();
      }

      try {
        let storedUser = Cookies.get("user");
        let accessToken = Cookies.get("access_token");

        // Fallback to localStorage if cookies are missing (for better persistence)
        if (!storedUser || !accessToken) {
          const localUser = mobileStorage.getUser();
          const localAccessToken = mobileStorage.getAuthToken();
          
          if (localUser && localAccessToken) {
            storedUser = JSON.stringify(localUser);
            accessToken = localAccessToken;
            
            // Restore to cookies for consistency with mobile-friendly options
            const cookieOptions = {
              sameSite: "lax" as const,
              secure: typeof window !== "undefined" ? window.location.protocol === "https:" : process.env.NODE_ENV === "production",
              path: "/",
              // Fix domain handling for mobile browsers - don't set domain for localhost, and handle subdomain properly
              ...(typeof window !== "undefined" && 
                  !window.location.hostname.includes("localhost") && 
                  !window.location.hostname.includes("127.0.0.1") &&
                  window.location.hostname.includes(".") 
                  ? { domain: window.location.hostname } : {})
            };
            
            try {
              const { getTokenCookieExpiry } = await import('@/lib/tokenUtils');
              
              const localRefreshToken = localStorage.getItem('refresh_token');
              
              Cookies.set("access_token", accessToken, { 
                ...cookieOptions, 
                expires: getTokenCookieExpiry(accessToken, false)
              });
              
              if (localRefreshToken) {
                Cookies.set("refresh_token", localRefreshToken, { 
                  ...cookieOptions, 
                  expires: getTokenCookieExpiry(localRefreshToken, true)
                });
                Cookies.set("user", storedUser, { 
                  ...cookieOptions, 
                  expires: getTokenCookieExpiry(localRefreshToken, true)
                });
              } else {
                Cookies.set("user", storedUser, { ...cookieOptions, expires: 7 });
              }
            } catch (cookieError) {
              mobileErrorHandler.log(cookieError as Error, 'cookie-restoration');
            }
          }
        }

        if (storedUser && accessToken) {
          const userData = JSON.parse(storedUser);
          setUser(userData);
          
          // Set token as verified to prevent immediate logout during initialization
          tokenVerificationRef.current = true;
          
          // Set loading to false immediately on mobile for better UX
          const isMobile = typeof window !== "undefined" && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
          if (isMobile) {
            setIsLoading(false);
          }

          // Only verify token if we're not in a critical flow and user wants fresh data
          // Skip verification on hard refresh to prevent immediate logout
          const navigationType = typeof window !== "undefined" && 
            (performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming)?.type;
          const isHardRefresh = navigationType === "reload";
          const isBackForward = navigationType === "back_forward";
          
          if (!isHardRefresh && !isBackForward && !tokenVerificationRef.current) {
            try {
              // Add a delay to ensure the app is fully loaded
              await new Promise((resolve) => setTimeout(resolve, 500));

              // Use base API client for token verification to avoid circular dependencies
              const response = await apiClient.get(API_ENDPOINTS.USER_PROFILE);
              setUser(response.data);
              Cookies.set("user", JSON.stringify(response.data), {
                expires: 7,
                sameSite: "lax",
                secure: typeof window !== "undefined" ? window.location.protocol === "https:" : process.env.NODE_ENV === "production",
                path: "/",
                domain: typeof window !== "undefined" ? window.location.hostname.includes("localhost") ? undefined : `.${window.location.hostname}` : undefined
              });
            } catch {
              // Token verification failed - this is normal for expired tokens
              // The interceptors will handle token refresh automatically

              // Don't clear auth data immediately - let the interceptors try to refresh
              // Only clear if refresh also fails (handled by interceptors)
            }
          }
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
        // Only clear auth data if there's a serious parsing error
        if (error instanceof SyntaxError) {
          clearAuthData();
        }
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, [clearAuthData]);

  // Listen for logout events from interceptors
  useEffect(() => {
    const handleAutoLogout = () => {
      // Don't logout if user is on payment pages or just returned from payment
      const isPaymentPage = window.location.pathname.includes('/payment/') ||
        window.location.search.includes('transfer_id') ||
        window.location.search.includes('payment_uuid') ||
        window.location.search.includes('octo_payment_UUID') ||
        window.location.search.includes('octo-status');

      // Also don't logout during navigation events to prevent back button logout
      const isNavigating = document.readyState !== 'complete' || 
                           document.visibilityState === 'hidden';

      if (!isPaymentPage && !isNavigating) {
        setUser(null);
        tokenVerificationRef.current = false;
      }
    };

    if (typeof window !== "undefined") {
      window.addEventListener("auth:logout", handleAutoLogout);
      return () => window.removeEventListener("auth:logout", handleAutoLogout);
    }
  }, []);

  // Proactive token refresh before expiration
  useEffect(() => {
    if (!user) return;

    const checkAndRefreshToken = async () => {
      try {
        const { getTokenExpiration } = await import('@/lib/tokenUtils');
        const accessToken = Cookies.get("access_token");
        
        if (!accessToken) return;
        
        const expiration = getTokenExpiration(accessToken);
        if (!expiration) return;
        
        const timeUntilExpiry = expiration - Date.now();
        const fiveMinutes = 5 * 60 * 1000;
        
        // Refresh token if it expires in less than 5 minutes
        if (timeUntilExpiry < fiveMinutes && timeUntilExpiry > 0) {
          const modernApiClient = (await import('@/lib/modernApiClient')).default;
          await modernApiClient.refreshAccessToken();
        }
      } catch (error) {
        console.error('Error checking token expiration:', error);
      }
    };

    // Check immediately
    checkAndRefreshToken();

    // Check every 2 minutes
    const interval = setInterval(checkAndRefreshToken, 2 * 60 * 1000);

    return () => clearInterval(interval);
  }, [user]);

  // Detect payment returns and restore session
  useEffect(() => {
    const handlePaymentReturn = async () => {
      const isPaymentReturn = window.location.pathname.includes('/payment/') &&
        (window.location.search.includes('transfer_id') ||
          window.location.search.includes('payment_uuid') ||
          window.location.search.includes('octo_payment_UUID') ||
          window.location.search.includes('octo-status'));

      if (isPaymentReturn) {

        
        // If user is already set, don't do anything
        if (user) {

          return;
        }

        // Try to restore user session from stored data
        const storedUser = Cookies.get("user");
        const accessToken = Cookies.get("access_token");

        // If cookies are missing, try to restore from session backup
        if (!storedUser || !accessToken) {
          const userBackup = sessionStorage.getItem('userBackup');
          const redirectTime = sessionStorage.getItem('paymentRedirectTime');
          
          if (userBackup && redirectTime) {
            const timeSinceRedirect = Date.now() - parseInt(redirectTime);
            // Only restore if redirect was recent (within 30 minutes)
            if (timeSinceRedirect < 30 * 60 * 1000) {
              try {
                const backupUserData = JSON.parse(userBackup);
                setUser(backupUserData);

                
                // Re-store in cookies with longer expiration
                const cookieOptions = {
                  sameSite: "lax" as const,
                  secure: typeof window !== "undefined" ? window.location.protocol === "https:" : process.env.NODE_ENV === "production",
                  domain: typeof window !== "undefined" ? window.location.hostname.includes("localhost") ? undefined : `.${window.location.hostname}` : undefined
                };
                
                Cookies.set("user", userBackup, {
                  ...cookieOptions,
                  expires: 7,
                });
                
                // Mark token as verified to avoid unnecessary verification
                tokenVerificationRef.current = true;
                
                // Clean up backup data
                sessionStorage.removeItem('userBackup');
                sessionStorage.removeItem('paymentRedirectTime');
                return;
              } catch (error) {
                console.error("Failed to restore user from backup:", error);
              }
            }
          }
        }

        if (storedUser && accessToken) {
          try {
            const userData = JSON.parse(storedUser);
            setUser(userData);

            
            // Mark token as verified to avoid unnecessary verification
            tokenVerificationRef.current = true;
          } catch (error) {
            console.error("Failed to restore user session:", error);
          }
        } else {
          console.warn("No stored user data found after payment return");
        }
      }
    };

    if (typeof window !== "undefined") {
      handlePaymentReturn();
    }
  }, [user]);

  // clearAuthData moved above for stable reference

  const login = useCallback(async (credentials: LoginRequest) => {
    try {
      setIsLoading(true);

      // Use proxy-enabled apiClient to avoid CORS and keep behavior consistent
      const resp = await apiClient.post(API_ENDPOINTS.LOGIN, credentials);
      
      // Handle different response formats from the backend
      let responseData = resp.data || resp || {};
      
      // If the response is wrapped in additional layers, unwrap it
      if (responseData.data) {
        responseData = responseData.data;
      }
      
      const { access_token, refresh_token, user: userData } = responseData as { access_token?: string; refresh_token?: string; user?: User };

      if (!access_token || !refresh_token || !userData) {
        // Invalid server response structure
        toast.error(t('auth.errors.invalidServerResponse'));
        throw new Error('invalid server response');
      }
      // Store tokens and user data with enhanced persistence for payment flows
      const cookieOptions = {
        sameSite: "lax" as const, // Changed from "strict" to "lax" for better mobile compatibility
        secure: typeof window !== "undefined" ? window.location.protocol === "https:" : process.env.NODE_ENV === "production",
        path: "/", // Ensure cookies are available across all paths
        // Fix domain handling for mobile browsers - don't set domain for localhost, and handle subdomain properly
        ...(typeof window !== "undefined" && 
            !window.location.hostname.includes("localhost") && 
            !window.location.hostname.includes("127.0.0.1") &&
            window.location.hostname.includes(".") 
            ? { domain: window.location.hostname } : {})
      };
      
      // Store auth data in both cookies and localStorage for mobile compatibility
      // Import token utilities dynamically to avoid circular dependencies
      try {
        const { getTokenCookieExpiry } = await import('@/lib/tokenUtils');
        
        // Set cookies with dynamic expiration based on actual token lifetime
        Cookies.set("access_token", access_token, { 
          ...cookieOptions, 
          expires: getTokenCookieExpiry(access_token, false) // 15 minutes
        });
        Cookies.set("refresh_token", refresh_token, { 
          ...cookieOptions, 
          expires: getTokenCookieExpiry(refresh_token, true) // 8 hours
        });
        Cookies.set("user", JSON.stringify(userData), { 
          ...cookieOptions, 
          expires: getTokenCookieExpiry(refresh_token, true) // Match refresh token lifetime
        });
      } catch {
        // Using localStorage fallback if cookies fail
      }
      
      // Always set localStorage as fallback for mobile
      try {
        mobileStorage.setAuthToken(access_token);
        mobileStorage.setUser(userData);
        localStorage.setItem('refresh_token', refresh_token);
      } catch (localStorageError) {
        mobileErrorHandler.log(localStorageError as Error, 'auth-storage');
      }
      setUser(userData);
      tokenVerificationRef.current = true;
      setTimeout(() => {
        toast.success(t('auth.toasts.loginSuccess'));
      }, 100);
    } catch (error: unknown) {
      // Enhanced error logging for debugging
      console.error("Login error:", error);
      
      const axiosError = error as { response?: { data?: unknown; status?: number; statusText?: string } };
      console.error("Login error details:", {
        status: axiosError.response?.status,
        statusText: axiosError.response?.statusText,
        data: axiosError.response?.data
      });
      
      // Prefer server-provided reason when available
      const serverMsg = extractErrorMessage(axiosError.response?.data);
      let message = serverMsg || t('auth.toasts.loginInvalid');
      if (serverMsg && serverMsg.toLowerCase().includes('incorrect name or password')) {
        message = t('auth.serverMessages.incorrectCredentials');
      }
      
      console.error("Final error message:", message);
      toast.error(message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  const register = useCallback(async (userData: RegisterRequest) => {
    try {
      setIsLoading(true);
      const response = await apiClient.post(API_ENDPOINTS.REGISTER, userData);

      const { access_token, refresh_token, user: newUser } = response.data;

      // Store tokens and user data
      const cookieOptions = {
        sameSite: "strict" as const,
        secure: process.env.NODE_ENV === "production",
      };

      Cookies.set("access_token", access_token, {
        ...cookieOptions,
        expires: 7,
      });
      Cookies.set("refresh_token", refresh_token, {
        ...cookieOptions,
        expires: 30,
      });
      Cookies.set("user", JSON.stringify(newUser), {
        ...cookieOptions,
        expires: 7,
      });
      try {
        localStorage.setItem('access_token', access_token);
        localStorage.setItem('refresh_token', refresh_token);
      } catch {}

      setUser(newUser);
      tokenVerificationRef.current = true; // Mark as verified since we just registered
      toast.success(t('auth.toasts.registrationSuccess'));
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: unknown; status?: number; statusText?: string }; message?: string };
      // Prefer structured server error message
      let message = extractErrorMessage(
        axiosError.response?.data,
        t('auth.errors.registrationFailed')
      );
      // Fallbacks with diagnostics
      if (!message || message === t('auth.errors.registrationFailed')) {
        if (axiosError.response) {
          // Include status code text if available
          const code = axiosError.response.status ? ` (HTTP ${axiosError.response.status}${axiosError.response.statusText ? ' ' + axiosError.response.statusText : ''})` : '';
          message = `${t('auth.errors.registrationFailed')}${code}`;
        } else if (axiosError.message && /network|failed|cors|fetch/i.test(axiosError.message)) {
          message = `${t('auth.errors.registrationFailedNetwork')}`;
        }
      }
      if (/user with this phone number already exists/i.test(message)) {
        message = t('auth.errors.existingPhone');
      }
      toast.error(message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  const forgotPassword = useCallback(async (payload: { name: string; password?: string; confirm_password?: string }) => {
    try {
      setIsLoading(true);

      // Backend expects all fields at once: name, new_password, confirm_new_password
      if (payload.password) {
        const resetBody = {
          name: payload.name,
          new_password: payload.password,
          confirm_new_password: payload.confirm_password,
        };
        await apiClient.post(API_ENDPOINTS.FORGOT_PASSWORD, resetBody);
      } else {
        // Step 1: Just validate the username exists (skip API call, proceed to step 2)
        // Since backend expects full payload, we'll do client-side validation only
        return;
      }
      if (payload.password) {
        toast.success(t('auth.toasts.passwordChangeSuccess'));
      } else {
        toast.success(t('auth.toasts.userFoundEnterNewPassword'));
      }
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: unknown } };
      // Debug log for 422 validation issues so we can inspect expected fields
      if (process.env.NODE_ENV !== 'production') {
        console.error('[forgotPassword][debug] payload sent:', payload);
        console.error('[forgotPassword][debug] transformed body:', payload.password ? {
          name: payload.name,
          new_password: payload.password,
          confirm_new_password: payload.confirm_password,
        } : { name: payload.name });
        console.error('[forgotPassword][debug] server response:', axiosError.response?.data);
      }
      const message = extractErrorMessage(
        axiosError.response?.data,
        payload.password ? t('auth.errors.passwordChangeFailed') : t('auth.errors.userSearchFailed')
      );
      toast.error(message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  const logout = useCallback(() => {
    clearAuthData();
    // Dispatch custom event to clear cart with intentional flag
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("cart:clear", { detail: { intentional: true } }));
    }
    toast.success(t('auth.toasts.logoutSuccess'));
  }, [clearAuthData, t]);

  const updateUser = useCallback(
    (userData: Partial<User>) => {
      if (user) {
        const updatedUser = { ...user, ...userData };
        setUser(updatedUser);
        Cookies.set("user", JSON.stringify(updatedUser), {
          expires: 7,
          sameSite: "strict",
          secure: process.env.NODE_ENV === "production",
        });
      }
    },
    [user]
  );

  const value: AuthContextType = useMemo(
    () => ({
      user,
      isLoading,
      isAuthenticated,
      login,
      register,
      forgotPassword,
      logout,
      updateUser,
    }),
    [user, isLoading, isAuthenticated, login, register, forgotPassword, logout, updateUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
