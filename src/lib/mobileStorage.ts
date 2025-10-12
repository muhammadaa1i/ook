// Mobile-optimized storage utility
// Handles various mobile browser limitations with localStorage and sessionStorage

export interface StorageOptions {
  useSession?: boolean; // Use sessionStorage instead of localStorage
  fallbackKey?: string; // Alternative key if primary fails
  maxRetries?: number; // Number of retry attempts
  clearOnFail?: boolean; // Clear other data if storage fails
}

export class MobileStorage {
  private static readonly STORAGE_TEST_KEY = '__storage_test__';
  
  // Test if storage is available and working
  static isStorageAvailable(storage: Storage): boolean {
    try {
      storage.setItem(this.STORAGE_TEST_KEY, 'test');
      storage.removeItem(this.STORAGE_TEST_KEY);
      return true;
    } catch {
      return false;
    }
  }

  // Get storage with fallback to alternative
  static getStorage(useSession = false): Storage | null {
    if (typeof window === 'undefined') return null;
    
    const primary = useSession ? sessionStorage : localStorage;
    const fallback = useSession ? localStorage : sessionStorage;
    
    if (this.isStorageAvailable(primary)) {
      return primary;
    }
    
    console.warn(`${useSession ? 'Session' : 'Local'}Storage unavailable, falling back to ${useSession ? 'local' : 'session'}Storage`);
    
    if (this.isStorageAvailable(fallback)) {
      return fallback;
    }
    
    console.error('All storage methods unavailable');
    return null;
  }

  // Enhanced setItem with mobile-specific error handling
  static setItem(key: string, value: string, options: StorageOptions = {}): boolean {
    const {
      useSession = false,
      fallbackKey,
      maxRetries = 2,
      clearOnFail = false
    } = options;

    let attempts = 0;
    const tryStore = (storage: Storage | null, storageKey: string): boolean => {
      if (!storage) return false;
      
      try {
        storage.setItem(storageKey, value);
        return true;
      } catch (error) {
        console.warn(`Storage setItem failed for key ${storageKey}:`, error);
        
        if (clearOnFail && attempts === 0) {
          try {
            // Try to clear some space
            const keysToRemove = ['cart_backup', 'temp_data', 'cache_'];
            keysToRemove.forEach(k => {
              for (let i = 0; i < storage.length; i++) {
                const existingKey = storage.key(i);
                if (existingKey?.startsWith(k)) {
                  storage.removeItem(existingKey);
                }
              }
            });
          } catch (clearError) {
            console.warn('Failed to clear storage space:', clearError);
          }
        }
        
        return false;
      }
    };

    // Try primary storage
    while (attempts < maxRetries) {
      const storage = this.getStorage(useSession);
      if (tryStore(storage, key)) {
        return true;
      }
      attempts++;
    }

    // Try fallback key if provided
    if (fallbackKey) {
      attempts = 0;
      while (attempts < maxRetries) {
        const storage = this.getStorage(useSession);
        if (tryStore(storage, fallbackKey)) {
          console.warn(`Stored under fallback key: ${fallbackKey}`);
          return true;
        }
        attempts++;
      }
    }

    // Try opposite storage type
    const alternateStorage = this.getStorage(!useSession);
    if (tryStore(alternateStorage, key)) {
      console.warn(`Stored in ${useSession ? 'localStorage' : 'sessionStorage'} instead`);
      return true;
    }

    if (fallbackKey && tryStore(alternateStorage, fallbackKey)) {
      console.warn(`Stored in ${useSession ? 'localStorage' : 'sessionStorage'} with fallback key`);
      return true;
    }

    console.error(`Failed to store ${key} in any storage method`);
    return false;
  }

  // Enhanced getItem with mobile-specific error handling
  static getItem(key: string, options: StorageOptions = {}): string | null {
    const { useSession = false, fallbackKey } = options;

    const tryGet = (storage: Storage | null, storageKey: string): string | null => {
      if (!storage) return null;
      
      try {
        return storage.getItem(storageKey);
      } catch (error) {
        console.warn(`Storage getItem failed for key ${storageKey}:`, error);
        return null;
      }
    };

    // Try primary storage
    const primaryStorage = this.getStorage(useSession);
    const value = tryGet(primaryStorage, key);
    if (value !== null) return value;

    // Try fallback key
    if (fallbackKey) {
      const fallbackValue = tryGet(primaryStorage, fallbackKey);
      if (fallbackValue !== null) {
        console.warn(`Retrieved from fallback key: ${fallbackKey}`);
        return fallbackValue;
      }
    }

    // Try opposite storage type
    const alternateStorage = this.getStorage(!useSession);
    const alternateValue = tryGet(alternateStorage, key);
    if (alternateValue !== null) {
      console.warn(`Retrieved from ${useSession ? 'localStorage' : 'sessionStorage'} instead`);
      return alternateValue;
    }

    if (fallbackKey) {
      const alternateFallbackValue = tryGet(alternateStorage, fallbackKey);
      if (alternateFallbackValue !== null) {
        console.warn(`Retrieved from ${useSession ? 'localStorage' : 'sessionStorage'} with fallback key`);
        return alternateFallbackValue;
      }
    }

    return null;
  }

  // Remove item from all possible locations
  static removeItem(key: string, options: StorageOptions = {}): void {
    const { useSession = false, fallbackKey } = options;

    const tryRemove = (storage: Storage | null, storageKey: string): void => {
      if (!storage) return;
      
      try {
        storage.removeItem(storageKey);
      } catch (error) {
        console.warn(`Storage removeItem failed for key ${storageKey}:`, error);
      }
    };

    // Remove from all possible locations
    [true, false].forEach(session => {
      const storage = this.getStorage(session);
      tryRemove(storage, key);
      if (fallbackKey) {
        tryRemove(storage, fallbackKey);
      }
    });
  }

  // Store object with JSON serialization
  static setObject(key: string, obj: unknown, options: StorageOptions = {}): boolean {
    try {
      const serialized = JSON.stringify(obj);
      return this.setItem(key, serialized, options);
    } catch (error) {
      console.error(`Failed to serialize object for key ${key}:`, error);
      return false;
    }
  }

  // Get object with JSON deserialization
  static getObject<T = unknown>(key: string, options: StorageOptions = {}): T | null {
    const value = this.getItem(key, options);
    if (!value) return null;
    
    try {
      return JSON.parse(value) as T;
    } catch (error) {
      console.error(`Failed to parse JSON for key ${key}:`, error);
      return null;
    }
  }

  // Clear all storage with mobile-safe error handling
  static clear(storageType: 'local' | 'session' = 'local'): void {
    const storage = this.getStorage(storageType === 'session');
    if (!storage) return;
    
    try {
      storage.clear();
    } catch (error) {
      console.warn(`Failed to clear ${storageType}Storage:`, error);
      // Try manual cleanup
      try {
        const keys: string[] = [];
        for (let i = 0; i < storage.length; i++) {
          const key = storage.key(i);
          if (key) keys.push(key);
        }
        keys.forEach(key => {
          try {
            storage.removeItem(key);
          } catch {}
        });
      } catch (manualError) {
        console.error('Manual storage cleanup also failed:', manualError);
      }
    }
  }

  // Get storage info for debugging
  static getStorageInfo(): {
    localStorage: { available: boolean; used?: number; total?: number };
    sessionStorage: { available: boolean; used?: number; total?: number };
  } {
    const getInfo = (storage: Storage | null) => {
      if (!storage) return { available: false };
      
      try {
        let used = 0;
        for (let i = 0; i < storage.length; i++) {
          const key = storage.key(i);
          if (key) {
            used += key.length + (storage.getItem(key)?.length || 0);
          }
        }
        
        return {
          available: true,
          used,
          // Most mobile browsers don't expose quota
          total: undefined
        };
      } catch {
        return { available: false };
      }
    };

    return {
      localStorage: getInfo(this.getStorage(false)),
      sessionStorage: getInfo(this.getStorage(true))
    };
  }
}

// Convenience functions for common use cases
export const mobileStorage = {
  // Auth tokens
  setAuthToken: (token: string) => MobileStorage.setItem('access_token', token, { fallbackKey: 'auth_token_backup', clearOnFail: true }),
  getAuthToken: () => MobileStorage.getItem('access_token', { fallbackKey: 'auth_token_backup' }),
  removeAuthToken: () => MobileStorage.removeItem('access_token', { fallbackKey: 'auth_token_backup' }),

  // User data
  setUser: (user: unknown) => MobileStorage.setObject('user', user, { fallbackKey: 'user_backup', clearOnFail: true }),
  getUser: <T = unknown>() => MobileStorage.getObject<T>('user', { fallbackKey: 'user_backup' }),
  removeUser: () => MobileStorage.removeItem('user', { fallbackKey: 'user_backup' }),

  // Cart data
  setCart: (cart: unknown) => MobileStorage.setObject('cart', cart, { fallbackKey: 'cart_backup', clearOnFail: true }),
  getCart: <T = unknown>() => MobileStorage.getObject<T>('cart', { fallbackKey: 'cart_backup' }),
  removeCart: () => MobileStorage.removeItem('cart', { fallbackKey: 'cart_backup' }),

  // Payment data (use session storage for security)
  setPaymentData: (data: unknown) => MobileStorage.setObject('paymentOrder', data, { useSession: true, fallbackKey: 'payment_backup', clearOnFail: true }),
  getPaymentData: <T = unknown>() => MobileStorage.getObject<T>('paymentOrder', { useSession: true, fallbackKey: 'payment_backup' }),
  removePaymentData: () => MobileStorage.removeItem('paymentOrder', { useSession: true, fallbackKey: 'payment_backup' }),
};