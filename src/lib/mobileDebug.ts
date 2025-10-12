// Mobile debugging utilities for production
export const isMobileDevice = () => {
  if (typeof window === "undefined") return false;
  
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
};

export const getMobileInfo = () => {
  if (typeof window === "undefined") return {};
  
  return {
    userAgent: navigator.userAgent,
    cookieEnabled: navigator.cookieEnabled,
    protocol: window.location.protocol,
    hostname: window.location.hostname,
    isMobile: isMobileDevice(),
    storageAvailable: {
      localStorage: (() => {
        try {
          localStorage.setItem('test', 'test');
          localStorage.removeItem('test');
          return true;
        } catch {
          return false;
        }
      })(),
      sessionStorage: (() => {
        try {
          sessionStorage.setItem('test', 'test');
          sessionStorage.removeItem('test');
          return true;
        } catch {
          return false;
        }
      })()
    }
  };
};

export const debugMobileAuth = () => {
  if (typeof window === "undefined") return;
  
  const info = getMobileInfo();
  console.log("Mobile Debug Info:", info);
  
  // Check available cookies
  const cookies = document.cookie;
  console.log("Available cookies:", cookies);
  
  // Check localStorage
  try {
    const authData = {
      access_token: localStorage.getItem('access_token'),
      refresh_token: localStorage.getItem('refresh_token'),
      user: localStorage.getItem('user')
    };
    console.log("LocalStorage auth data:", authData);
  } catch (error) {
    console.error("Failed to read localStorage:", error);
  }
};