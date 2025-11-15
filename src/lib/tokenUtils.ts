import Cookies from "js-cookie";

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
}