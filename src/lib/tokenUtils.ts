import Cookies from "js-cookie";

export function hasValidToken(): boolean {
  if (typeof window === "undefined") return false;
  
  const accessToken = Cookies.get("access_token");
  
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
  const accessToken = Cookies.get("access_token");
  const refreshToken = Cookies.get("refresh_token");
  
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