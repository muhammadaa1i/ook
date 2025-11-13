import Cookies from "js-cookie";

export function hasValidToken(): boolean {
  if (typeof window === "undefined") return false;
  
  let accessToken = Cookies.get("access_token");
  
  // Check localStorage as fallback for mobile browsers
  if (!accessToken) {
    try {
      accessToken = localStorage.getItem("auth_token") || undefined;
      // If found in localStorage, restore to cookies
      if (accessToken) {
        Cookies.set("access_token", accessToken, { sameSite: "lax", expires: 1, path: "/" });
      }
    } catch {
      // localStorage not available
    }
  }
  
  // At minimum, we need an access token
  if (!accessToken) {
    return false;
  }
  
  // Basic token format validation (should be a JWT-like string)
  if (accessToken.length < 10 || !accessToken.includes('.')) {
    return false;
  }
  
  return true;
}

export function getTokenInfo() {
  let accessToken = Cookies.get("access_token");
  let refreshToken = Cookies.get("refresh_token");
  
  // Check localStorage as fallback
  if (typeof window !== "undefined") {
    try {
      if (!accessToken) {
        accessToken = localStorage.getItem("auth_token") || undefined;
      }
      if (!refreshToken) {
        refreshToken = localStorage.getItem("refresh_token") || undefined;
      }
    } catch {
      // localStorage not available
    }
  }
  
  return {
    hasAccessToken: !!accessToken,
    hasRefreshToken: !!refreshToken,
    accessTokenLength: accessToken?.length || 0,
    refreshTokenLength: refreshToken?.length || 0,
  };
}

export function clearInvalidTokens() {
  const accessToken = Cookies.get("access_token");
  const refreshToken = Cookies.get("refresh_token");
  
  // Remove tokens if they appear invalid
  if (accessToken && (accessToken.length < 10 || !accessToken.includes('.'))) {
    Cookies.remove("access_token");
  }
  
  if (refreshToken && (refreshToken.length < 10 || !refreshToken.includes('.'))) {
    Cookies.remove("refresh_token");
  }
}