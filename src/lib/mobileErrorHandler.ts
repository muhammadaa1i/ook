// Mobile-specific error handling and monitoring
// Handles various mobile browser quirks, network issues, and device limitations

export interface MobileErrorInfo {
  isMobile: boolean;
  userAgent: string;
  viewport: { width: number; height: number };
  connection?: {
    effectiveType?: string;
    downlink?: number;
    rtt?: number;
  };
  storage: {
    localStorage: boolean;
    sessionStorage: boolean;
    cookieEnabled: boolean;
  };
  timestamp: string;
  url: string;
}

export interface ErrorDetails {
  message: string;
  stack?: string;
  name?: string;
  code?: string | number;
  status?: number;
  url?: string;
  method?: string;
}

export class MobileErrorHandler {
  private static errorQueue: Array<{ error: ErrorDetails; context: MobileErrorInfo }> = [];
  private static maxQueueSize = 20;
  private static isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

  // Detect if device is mobile
  static isMobileDevice(): boolean {
    if (typeof window === 'undefined') return false;
    
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile|CriOS/i.test(
      navigator.userAgent
    );
  }

  // Get comprehensive mobile environment info
  static getMobileInfo(): MobileErrorInfo {
    const info: MobileErrorInfo = {
      isMobile: this.isMobileDevice(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      viewport: { width: 0, height: 0 },
      storage: {
        localStorage: false,
        sessionStorage: false,
        cookieEnabled: false
      },
      timestamp: new Date().toISOString(),
      url: typeof window !== 'undefined' ? window.location.href : 'unknown'
    };

    if (typeof window !== 'undefined') {
      info.viewport = {
        width: window.innerWidth || document.documentElement.clientWidth || 0,
        height: window.innerHeight || document.documentElement.clientHeight || 0
      };

      // Test storage availability
      try {
        localStorage.setItem('__test__', 'test');
        localStorage.removeItem('__test__');
        info.storage.localStorage = true;
      } catch {}

      try {
        sessionStorage.setItem('__test__', 'test');
        sessionStorage.removeItem('__test__');
        info.storage.sessionStorage = true;
      } catch {}

      info.storage.cookieEnabled = navigator.cookieEnabled || false;

      // Network connection info (if available)
      const connection = (navigator as unknown as {
        connection?: {
          effectiveType?: string;
          downlink?: number;
          rtt?: number;
        };
        mozConnection?: {
          effectiveType?: string;
          downlink?: number;
          rtt?: number;
        };
        webkitConnection?: {
          effectiveType?: string;
          downlink?: number;
          rtt?: number;
        };
      }).connection || 
      (navigator as unknown as { mozConnection?: { effectiveType?: string; downlink?: number; rtt?: number } }).mozConnection || 
      (navigator as unknown as { webkitConnection?: { effectiveType?: string; downlink?: number; rtt?: number } }).webkitConnection;
      
      if (connection) {
        info.connection = {
          effectiveType: connection.effectiveType,
          downlink: connection.downlink,
          rtt: connection.rtt
        };
      }
    }

    return info;
  }

  // Enhanced error logging for mobile
  static logError(error: Error | ErrorDetails, context: string = 'unknown'): void {
    const errorWithExtra = error as Error & {
      code?: string | number;
      status?: number;
      url?: string;
      method?: string;
    };

    const errorDetails: ErrorDetails = {
      message: error.message || 'Unknown error',
      stack: (error as Error).stack,
      name: (error as Error).name,
      code: errorWithExtra.code,
      status: errorWithExtra.status,
      url: errorWithExtra.url,
      method: errorWithExtra.method
    };

    const mobileInfo = this.getMobileInfo();
    
    // Enhanced mobile error logging
    console.group(`🔴 Mobile Error [${context}]`);
    console.error('Error details:', errorDetails);
    console.warn('Mobile context:', mobileInfo);
    console.groupEnd();

    // Queue error for potential reporting
    this.errorQueue.push({ error: errorDetails, context: mobileInfo });
    
    // Limit queue size
    if (this.errorQueue.length > this.maxQueueSize) {
      this.errorQueue = this.errorQueue.slice(-this.maxQueueSize);
    }

    // Special handling for mobile-specific issues
    this.handleMobileSpecificErrors(errorDetails, mobileInfo);
  }

  // Handle specific mobile browser issues
  private static handleMobileSpecificErrors(error: ErrorDetails, info: MobileErrorInfo): void {
    // iOS Safari specific issues
    if (info.userAgent.includes('Safari') && info.userAgent.includes('Mobile')) {
      if (error.message.includes('QuotaExceededError')) {
        console.warn('🍎 iOS Safari storage quota exceeded - clearing non-essential data');
        this.clearNonEssentialStorage();
      }
      
      if (error.message.includes('SecurityError')) {
        console.warn('🍎 iOS Safari security error - likely private browsing mode');
      }
    }

    // Chrome Mobile specific issues
    if (info.userAgent.includes('Chrome') && info.isMobile) {
      if (error.message.includes('NetworkError')) {
        console.warn('📱 Chrome Mobile network error - checking connection');
        this.checkNetworkStatus();
      }
    }

    // Android WebView specific issues
    if (info.userAgent.includes('wv') || info.userAgent.includes('Version/') && info.userAgent.includes('Android')) {
      if (error.message.includes('CORS')) {
        console.warn('🤖 Android WebView CORS issue - using alternative request method');
      }
    }

    // Low memory devices
    if (info.viewport.width < 400 || (info.connection && info.connection.downlink && info.connection.downlink < 1)) {
      console.warn('📱 Low-end device detected - enabling performance mode');
      this.enablePerformanceMode();
    }
  }

  // Clear non-essential storage to free up space
  private static clearNonEssentialStorage(): void {
    if (typeof window === 'undefined') return;

    const nonEssentialKeys = [
      'temp_', 'cache_', '_backup', 'debug_', 'log_', 'analytics_'
    ];

    [localStorage, sessionStorage].forEach(storage => {
      try {
        for (let i = storage.length - 1; i >= 0; i--) {
          const key = storage.key(i);
          if (key && nonEssentialKeys.some(prefix => key.startsWith(prefix))) {
            storage.removeItem(key);
          }
        }
      } catch (error) {
        console.warn('Failed to clear non-essential storage:', error);
      }
    });
  }

  // Check and monitor network status
  static checkNetworkStatus(): void {
    if (typeof navigator === 'undefined') return;

    this.isOnline = navigator.onLine;
    
    window.addEventListener('online', () => {
      this.isOnline = true;
      console.info('📡 Network connection restored');
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      console.warn('📡 Network connection lost');
    });
  }

  // Enable performance optimizations for low-end devices
  private static enablePerformanceMode(): void {
    // Reduce animation and transition durations
    const style = document.createElement('style');
    style.textContent = `
      *, *::before, *::after {
        transition-duration: 0.1s !important;
        animation-duration: 0.1s !important;
      }
    `;
    document.head.appendChild(style);

    // Reduce image quality for low-end devices
    console.info('📱 Performance mode enabled for low-end device');
  }

  // Create user-friendly error messages for mobile users
  static getMobileErrorMessage(error: Error | ErrorDetails, context: string = ''): string {
    const message = error.message || 'Unknown error';
    const isMobile = this.isMobileDevice();

    if (!isMobile) return message;

    // Mobile-specific error translations
    if (message.includes('QuotaExceededError') || message.includes('storage quota')) {
      return 'Телефоннинг хотираси тўлган. Баъзи маълумотларни ўчириб, қайта уриниб кўринг.';
    }

    if (message.includes('NetworkError') || message.includes('Failed to fetch')) {
      return 'Интернет алоқаси билан муаммо. Алоқани текшириб, қайта уриниб кўринг.';
    }

    if (message.includes('CORS') || message.includes('blocked')) {
      return 'Хавфсизлик хатоси юз берди. Саҳифани янгилаб кўринг.';
    }

    if (message.includes('timeout') || message.includes('timed out')) {
      return 'Сўров жуда узоқ давом этди. Қайта уриниб кўринг.';
    }

    if (message.includes('Unauthorized') || message.includes('401')) {
      return 'Авторизация муддати тугаган. Қайта кириш керак.';
    }

    if (message.includes('Server Error') || message.includes('500')) {
      return 'Сервер хатоси. Бирозга кутиб, қайта уриниб кўринг.';
    }

    // Default mobile-friendly message
    return context ? `${context} хатоси юз берди. Қайта уриниб кўринг.` : message;
  }

  // Retry mechanism for mobile network issues
  static async retryWithBackoff<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000,
    context: string = 'operation'
  ): Promise<T> {
    let lastError: Error;

    for (let i = 0; i <= maxRetries; i++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
        
        if (i === maxRetries) break;

        // Don't retry for certain errors
        if (error instanceof Error) {
          const message = error.message.toLowerCase();
          if (message.includes('401') || 
              message.includes('403') ||
              message.includes('400')) {
            break;
          }
        }

        const delay = baseDelay * Math.pow(2, i) + Math.random() * 1000;
        console.warn(`📱 Retry ${i + 1}/${maxRetries} for ${context} after ${delay}ms`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    this.logError(lastError!, `retry-failed-${context}`);
    throw lastError!;
  }

  // Get error queue for debugging
  static getErrorQueue(): Array<{ error: ErrorDetails; context: MobileErrorInfo }> {
    return [...this.errorQueue];
  }

  // Clear error queue
  static clearErrorQueue(): void {
    this.errorQueue = [];
  }

  // Check if device is online
  static isDeviceOnline(): boolean {
    return this.isOnline;
  }
}

// Global error handlers for mobile
if (typeof window !== 'undefined') {
  // Catch unhandled errors
  window.addEventListener('error', (event) => {
    MobileErrorHandler.logError(
      {
        message: event.message,
        stack: event.error?.stack,
        name: event.error?.name,
        url: event.filename,
      },
      'unhandled-error'
    );
  });

  // Catch unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    MobileErrorHandler.logError(
      {
        message: event.reason?.message || String(event.reason),
        stack: event.reason?.stack,
        name: event.reason?.name,
      },
      'unhandled-promise-rejection'
    );
  });

  // Monitor network status
  MobileErrorHandler.checkNetworkStatus();
}

// Export convenience functions
export const mobileErrorHandler = {
  log: MobileErrorHandler.logError,
  getMessage: MobileErrorHandler.getMobileErrorMessage,
  retry: MobileErrorHandler.retryWithBackoff,
  getInfo: MobileErrorHandler.getMobileInfo,
  isOnline: () => MobileErrorHandler.isDeviceOnline(),
  getErrors: MobileErrorHandler.getErrorQueue,
  clearErrors: MobileErrorHandler.clearErrorQueue,
};