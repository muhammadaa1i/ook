import Cookies from "js-cookie";

/**
 * Token expiration times (in milliseconds)
 * These match the backend JWT configuration
 */
export const TOKEN_EXPIRY = {
  ACCESS_TOKEN: 15 * 60 * 1000, // 15 minutes
  REFRESH_TOKEN: 8 * 60 * 60 * 1000, // 8 hours
} as const;

/**
 * Convert milliseconds to days for cookie expiration
 */
function msToFractionalDays(ms: number): number {
  return ms / (24 * 60 * 60 * 1000);
}

// Decode base64url safely
function decodeBase64Url(input: string): string {
  try {
    const base64 = input.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "===".slice((base64.length + 3) % 4);
    return typeof window === "undefined"
      ? Buffer.from(padded, "base64").toString("utf-8")
      : atob(padded);
  } catch {
    return "";
  }
}

/**
 * Extract expiration time from JWT token
 */
export function getTokenExpiration(token: string): number | null {
  if (!token || token.length < 10 || token.split(".").length < 2) return null;
  const parts = token.split(".");
  const payloadRaw = decodeBase64Url(parts[1] || "");
  if (!payloadRaw) return null;
  try {
    const payload = JSON.parse(payloadRaw) as { exp?: number };
    if (typeof payload.exp === "number") {
      return payload.exp * 1000; // Convert to milliseconds
    }
    return null;
  } catch {
    return null;
  }
}

function isJwtNotExpired(token: string, skewSeconds = 10): boolean {
  if (!token || token.length < 10 || token.split(".").length < 2) return false;
  const parts = token.split(".");
  const payloadRaw = decodeBase64Url(parts[1] || "");
  if (!payloadRaw) return false;
  try {
    const payload = JSON.parse(payloadRaw) as { exp?: number };
    if (typeof payload.exp === "number") {
      const now = Math.floor(Date.now() / 1000);
      return payload.exp > now + skewSeconds; // still valid a bit into future
    }
    // If no exp provided, fall back to conservative false
    return false;
  } catch {
    return false;
  }
}

/**
 * Get the appropriate cookie expiration for a token
 * Returns fractional days based on token expiration or defaults
 */
export function getTokenCookieExpiry(token: string, isRefreshToken: boolean): number {
  const tokenExp = getTokenExpiration(token);
  
  if (tokenExp) {
    // Use actual token expiration
    const msUntilExpiry = tokenExp - Date.now();
    return msToFractionalDays(Math.max(msUntilExpiry, 60000)); // Minimum 1 minute
  }
  
  // Fallback to defaults
  return isRefreshToken 
    ? msToFractionalDays(TOKEN_EXPIRY.REFRESH_TOKEN)
    : msToFractionalDays(TOKEN_EXPIRY.ACCESS_TOKEN);
}

export function hasValidToken(): boolean {
  if (typeof window === "undefined") return false;

  let accessToken = Cookies.get("access_token");

  // Check localStorage as fallback for mobile browsers
  if (!accessToken) {
    try {
      accessToken =
        localStorage.getItem("auth_token") ||
        localStorage.getItem("access_token") ||
        undefined;
      // If found in localStorage, restore to cookies
      if (accessToken) {
        Cookies.set("access_token", accessToken, {
          sameSite: "lax",
          expires: 1,
          path: "/",
        });
      }
    } catch {
      // localStorage not available
    }
  }

  if (!accessToken) return false;

  // Prefer strict JWT expiration check; if not a valid JWT with exp, treat as invalid
  return isJwtNotExpired(accessToken);
}

export function getTokenInfo() {
  let accessToken = Cookies.get("access_token");
  let refreshToken = Cookies.get("refresh_token");
  
  // Check localStorage as fallback
  if (typeof window !== "undefined") {
    try {
      if (!accessToken) {
        accessToken = localStorage.getItem("auth_token") || localStorage.getItem("access_token") || undefined;
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
  if (accessToken && !isJwtNotExpired(accessToken)) {
    Cookies.remove("access_token");
  }
  
  if (refreshToken && (refreshToken.length < 10 || !refreshToken.includes('.'))) {
    Cookies.remove("refresh_token");
  }
  
  // Also clear from localStorage
  if (typeof window !== "undefined") {
    try {
      if (accessToken && !isJwtNotExpired(accessToken)) {
        localStorage.removeItem("auth_token");
        localStorage.removeItem("access_token");
      }
      if (refreshToken && (refreshToken.length < 10 || !refreshToken.includes('.'))) {
        localStorage.removeItem("refresh_token");
      }
    } catch {
      // localStorage not available
    }
  }
}

/**
 * Get detailed token information for debugging
 */
export function getTokenDebugInfo() {
  const accessToken = Cookies.get("access_token");
  const refreshToken = Cookies.get("refresh_token");
  
  const accessExpiration = accessToken ? getTokenExpiration(accessToken) : null;
  const refreshExpiration = refreshToken ? getTokenExpiration(refreshToken) : null;
  
  const now = Date.now();
  
  return {
    accessToken: {
      exists: !!accessToken,
      valid: accessToken ? isJwtNotExpired(accessToken) : false,
      expiresAt: accessExpiration ? new Date(accessExpiration).toISOString() : null,
      expiresIn: accessExpiration ? Math.max(0, accessExpiration - now) : null,
      expiresInMinutes: accessExpiration ? Math.max(0, Math.floor((accessExpiration - now) / 60000)) : null,
    },
    refreshToken: {
      exists: !!refreshToken,
      valid: refreshToken ? isJwtNotExpired(refreshToken) : false,
      expiresAt: refreshExpiration ? new Date(refreshExpiration).toISOString() : null,
      expiresIn: refreshExpiration ? Math.max(0, refreshExpiration - now) : null,
      expiresInHours: refreshExpiration ? Math.max(0, Math.floor((refreshExpiration - now) / 3600000)) : null,
    },
  };
}