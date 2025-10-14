/**
 * Mobile-specific authentication utilities for debugging and handling mobile browser quirks
 */

import Cookies from "js-cookie";
import { mobileStorage } from "./mobileStorage";

export interface MobileAuthState {
  hasTokensInCookies: boolean;
  hasTokensInLocalStorage: boolean;
  isMobileDevice: boolean;
  userAgent: string;
  cookiesEnabled: boolean;
  localStorageEnabled: boolean;
  authRecommendation: string;
}

export function getMobileAuthState(): MobileAuthState {
  const isMobile = typeof window !== "undefined" && 
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  const hasTokensInCookies = !!(Cookies.get("access_token") && Cookies.get("user"));
  
  let hasTokensInLocalStorage = false;
  let localStorageEnabled = false;
  
  try {
    const authToken = mobileStorage.getAuthToken();
    const user = mobileStorage.getUser();
    hasTokensInLocalStorage = !!(authToken && user);
    localStorageEnabled = true;
  } catch {
    localStorageEnabled = false;
  }
  
  let cookiesEnabled = false;
  try {
    // Test cookie functionality
    Cookies.set("test_cookie", "test", { expires: 1 });
    cookiesEnabled = Cookies.get("test_cookie") === "test";
    Cookies.remove("test_cookie");
  } catch {
    cookiesEnabled = false;
  }
  
  let authRecommendation = "Unknown";
  if (hasTokensInCookies && hasTokensInLocalStorage) {
    authRecommendation = "Auth tokens found in both storage methods - Good!";
  } else if (hasTokensInCookies) {
    authRecommendation = "Auth tokens only in cookies - Should work but consider localStorage backup";
  } else if (hasTokensInLocalStorage) {
    authRecommendation = "Auth tokens only in localStorage - Should work but cookies preferred";
  } else {
    authRecommendation = "No auth tokens found - User needs to log in";
  }
  
  return {
    hasTokensInCookies,
    hasTokensInLocalStorage,
    isMobileDevice: isMobile,
    userAgent: typeof window !== "undefined" ? navigator.userAgent : "Server",
    cookiesEnabled,
    localStorageEnabled,
    authRecommendation
  };
}

export function logMobileAuthState(): void {
  const state = getMobileAuthState();
  console.log("📱 Mobile Auth State:", state);
}

/**
 * Attempt to restore authentication from the most reliable source available
 * Optimized for speed - prioritizes immediate availability over validation
 */
export function attemptMobileAuthRestore(): boolean {
  try {
    const state = getMobileAuthState();
    
    // If tokens are already in cookies, we're good to go
    if (state.hasTokensInCookies) {
      return true;
    }
    
    // Fast path: restore from localStorage to cookies without validation
    if (state.hasTokensInLocalStorage && state.cookiesEnabled) {
      const user = mobileStorage.getUser();
      const authToken = mobileStorage.getAuthToken();
      const refreshToken = localStorage.getItem("refresh_token");
      
      if (user && authToken) {
        // Use minimal cookie options for speed
        const cookieOptions = {
          sameSite: "lax" as const,
          secure: typeof window !== "undefined" ? window.location.protocol === "https:" : false,
          path: "/",
        };
        
        try {
          Cookies.set("user", JSON.stringify(user), { ...cookieOptions, expires: 7 });
          Cookies.set("access_token", authToken, { ...cookieOptions, expires: 1 });
          if (refreshToken) {
            Cookies.set("refresh_token", refreshToken, { ...cookieOptions, expires: 30 });
          }
          return true;
        } catch {
          // Cookie setting failed, but don't block - let API handle validation
          return false;
        }
      }
    }
    
    return false;
  } catch {
    // Don't block on errors - let the app handle auth validation
    return false;
  }
}

/**
 * Mobile-friendly auth check that works with various browser limitations
 */
export function isMobileAuthenticated(): boolean {
  const state = getMobileAuthState();
  return state.hasTokensInCookies || state.hasTokensInLocalStorage;
}