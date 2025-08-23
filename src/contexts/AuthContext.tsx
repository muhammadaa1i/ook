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
import { API_ENDPOINTS } from "@/lib/constants";
import { toast } from "react-toastify";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  register: (userData: RegisterRequest) => Promise<void>;
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

  const isAuthenticated = useMemo(() => !!user, [user]);

  useEffect(() => {
    const initializeAuth = async () => {
      // Prevent multiple initialization calls
      if (isInitializedRef.current) return;
      isInitializedRef.current = true;

      try {
        const storedUser = Cookies.get("user");
        const accessToken = Cookies.get("access_token");

        if (storedUser && accessToken) {
          const userData = JSON.parse(storedUser);
          setUser(userData);

          // Only verify token if not already verified in this session
          // Skip verification if we just logged in (already verified)
          if (!tokenVerificationRef.current) {
            tokenVerificationRef.current = true;
            try {
              // Add a small delay to ensure cookies are properly available
              await new Promise((resolve) => setTimeout(resolve, 200));

              // Use base API client for token verification to avoid circular dependencies
              const response = await apiClient.get(API_ENDPOINTS.USER_PROFILE);
              setUser(response.data);
              Cookies.set("user", JSON.stringify(response.data), {
                expires: 7,
                sameSite: "strict",
                secure: process.env.NODE_ENV === "production",
              });
            } catch (error) {
              // Token verification failed - this is normal for expired tokens
              // The interceptors will handle token refresh automatically
              console.warn(
                "Token verification failed during initialization:",
                error
              );

              // Don't clear auth data immediately - let the interceptors try to refresh
              // Only clear if refresh also fails (handled by interceptors)
            }
          }
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
        clearAuthData();
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Listen for logout events from interceptors
  useEffect(() => {
    const handleAutoLogout = () => {
      setUser(null);
      tokenVerificationRef.current = false;
      toast.error("Сессия истекла. Пожалуйста, войдите снова.");
    };

    if (typeof window !== "undefined") {
      window.addEventListener("auth:logout", handleAutoLogout);
      return () => window.removeEventListener("auth:logout", handleAutoLogout);
    }
  }, []);

  const clearAuthData = useCallback(() => {
    setUser(null);
    Cookies.remove("access_token");
    Cookies.remove("refresh_token");
    Cookies.remove("user");
    tokenVerificationRef.current = false;
  }, []);

  const login = useCallback(async (credentials: LoginRequest) => {
    try {
      setIsLoading(true);
      const response = await apiClient.post(API_ENDPOINTS.LOGIN, credentials);

      const { access_token, refresh_token, user: userData } = response.data;

      // Store tokens and user data
      const cookieOptions = {
        sameSite: "strict" as const,
        secure: process.env.NODE_ENV === "production",
      };

      Cookies.set("access_token", access_token, {
        ...cookieOptions,
        expires: 1, // Access token should expire in 1 day, not 7
      });
      Cookies.set("refresh_token", refresh_token, {
        ...cookieOptions,
        expires: 30,
      });
      Cookies.set("user", JSON.stringify(userData), {
        ...cookieOptions,
        expires: 7,
      });

      setUser(userData);
      tokenVerificationRef.current = true; // Mark as verified since we just logged in

      // Give a small delay to ensure cookies are properly set before verification
      setTimeout(() => {
        toast.success("Успешный вход в систему!");
      }, 100);
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { detail?: string } } };
      const message = axiosError.response?.data?.detail || "Ошибка входа";
      toast.error(message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

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

      setUser(newUser);
      tokenVerificationRef.current = true; // Mark as verified since we just registered
      toast.success("Регистрация прошла успешно!");
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { detail?: string } } };
      const message = axiosError.response?.data?.detail || "Ошибка регистрации";
      toast.error(message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    clearAuthData();
    toast.success("Вы вышли из системы");
  }, [clearAuthData]);

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
      logout,
      updateUser,
    }),
    [user, isLoading, isAuthenticated, login, register, logout, updateUser]
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
