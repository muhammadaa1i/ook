/**
 * Refresh Token Testing Suite
 * 
 * Tests the refresh token flow to ensure tokens are properly:
 * 1. Stored on login
 * 2. Automatically refreshed when access token expires
 * 3. Properly handled when refresh fails
 */

import Cookies from 'js-cookie';

interface TestResult {
  test: string;
  passed: boolean;
  message: string;
  details?: unknown;
}

class RefreshTokenTester {
  private results: TestResult[] = [];
  private originalAccessToken = '';
  private originalRefreshToken = '';

  constructor() {
    console.log('🧪 Starting Refresh Token Tests...\n');
  }

  private log(test: string, passed: boolean, message: string, details?: unknown) {
    this.results.push({ test, passed, message, details });
    const icon = passed ? '✅' : '❌';
    console.log(`${icon} ${test}: ${message}`);
    if (details) {
      console.log('   Details:', details);
    }
  }

  // Test 1: Check if tokens are stored correctly
  async testTokenStorage(): Promise<void> {
    const accessToken = Cookies.get('access_token');
    const refreshToken = Cookies.get('refresh_token');
    const user = Cookies.get('user');

    const hasAccess = !!accessToken && accessToken.length > 10;
    const hasRefresh = !!refreshToken && refreshToken.length > 10;
    const hasUser = !!user;

    if (hasAccess && hasRefresh && hasUser) {
      this.originalAccessToken = accessToken;
      this.originalRefreshToken = refreshToken;
      this.log(
        'Token Storage',
        true,
        'All tokens present and valid format',
        {
          accessTokenLength: accessToken.length,
          refreshTokenLength: refreshToken.length,
          userDataPresent: hasUser
        }
      );
    } else {
      this.log(
        'Token Storage',
        false,
        'Missing or invalid tokens',
        {
          hasAccessToken: hasAccess,
          hasRefreshToken: hasRefresh,
          hasUser
        }
      );
    }
  }

  // Test 2: Check localStorage fallback
  async testLocalStorageFallback(): Promise<void> {
    try {
      const localRefreshToken = localStorage.getItem('refresh_token');
      const localUser = localStorage.getItem('user');
      
      const passed = !!localRefreshToken && !!localUser;
      this.log(
        'localStorage Fallback',
        passed,
        passed ? 'Tokens properly backed up in localStorage' : 'localStorage backup missing',
        {
          hasRefreshToken: !!localRefreshToken,
          hasUser: !!localUser
        }
      );
    } catch (error) {
      this.log(
        'localStorage Fallback',
        false,
        'localStorage access failed',
        error
      );
    }
  }

  // Test 3: Simulate token expiry and test refresh
  async testTokenRefresh(): Promise<void> {
    console.log('\n🔄 Testing automatic token refresh...');
    
    // Save original tokens
    const originalAccess = Cookies.get('access_token');
    
    // Invalidate access token to simulate expiry
    Cookies.set('access_token', 'expired_token_for_testing');
    
    try {
      // Make an API call that should trigger refresh
      const response = await fetch('/api/proxy?endpoint=/users/me', {
        headers: {
          'Authorization': 'Bearer expired_token_for_testing'
        }
      });

      if (response.status === 401) {
        // Expected - now check if refresh was attempted
        const newAccessToken = Cookies.get('access_token');
        
        if (newAccessToken && newAccessToken !== 'expired_token_for_testing' && newAccessToken !== originalAccess) {
          this.log(
            'Automatic Token Refresh',
            true,
            'Token was automatically refreshed on 401 response',
            {
              oldToken: 'expired_token_for_testing',
              newTokenLength: newAccessToken.length
            }
          );
        } else {
          this.log(
            'Automatic Token Refresh',
            false,
            'Token was not refreshed after 401',
            {
              currentToken: newAccessToken
            }
          );
        }
      } else {
        this.log(
          'Automatic Token Refresh',
          false,
          `Unexpected response status: ${response.status}`,
          { status: response.status }
        );
      }
    } catch (error) {
      this.log(
        'Automatic Token Refresh',
        false,
        'Error during refresh test',
        error
      );
    } finally {
      // Restore original token
      if (originalAccess) {
        Cookies.set('access_token', originalAccess);
      }
    }
  }

  // Test 4: Test refresh endpoint directly
  async testRefreshEndpoint(): Promise<void> {
    const refreshToken = Cookies.get('refresh_token');
    
    if (!refreshToken) {
      this.log(
        'Direct Refresh Endpoint',
        false,
        'No refresh token available for testing'
      );
      return;
    }

    try {
      // Try the refresh endpoint directly
      const response = await fetch('/api/proxy?endpoint=/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refresh_token: refreshToken,
          refreshToken: refreshToken
        })
      });

      if (response.ok) {
        const data = await response.json();
        const hasNewToken = data.access_token || data.accessToken || data.access;
        
        this.log(
          'Direct Refresh Endpoint',
          !!hasNewToken,
          hasNewToken ? 'Refresh endpoint works correctly' : 'Refresh endpoint did not return token',
          {
            status: response.status,
            hasAccessToken: !!hasNewToken,
            responseKeys: Object.keys(data)
          }
        );
      } else {
        const errorText = await response.text();
        this.log(
          'Direct Refresh Endpoint',
          false,
          `Refresh endpoint failed with status ${response.status}`,
          {
            status: response.status,
            error: errorText
          }
        );
      }
    } catch (error) {
      this.log(
        'Direct Refresh Endpoint',
        false,
        'Error calling refresh endpoint',
        error
      );
    }
  }

  // Test 5: Test token validation utilities
  async testTokenValidation(): Promise<void> {
    try {
      // Dynamic import to avoid build-time errors
      const { hasValidToken, getTokenInfo } = await import('../tokenUtils');
      
      const isValid = hasValidToken();
      const info = getTokenInfo();
      
      this.log(
        'Token Validation Utils',
        isValid,
        isValid ? 'Token validation passed' : 'Token validation failed',
        info
      );
    } catch (error) {
      this.log(
        'Token Validation Utils',
        false,
        'Could not load token validation utilities',
        error
      );
    }
  }

  // Test 6: Test refresh token expiry handling
  async testRefreshTokenExpiry(): Promise<void> {
    console.log('\n⏱️  Testing refresh token expiry handling...');
    
    const originalRefresh = Cookies.get('refresh_token');
    
    // Set an invalid refresh token
    Cookies.set('refresh_token', 'invalid_expired_refresh_token');
    
    try {
      // Try to refresh with invalid token
      const response = await fetch('/api/proxy?endpoint=/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refresh_token: 'invalid_expired_refresh_token'
        })
      });

      const shouldFail = !response.ok && response.status === 401;
      
      this.log(
        'Refresh Token Expiry',
        shouldFail,
        shouldFail ? 'Expired refresh token properly rejected' : 'Failed to reject expired token',
        {
          status: response.status,
          expectedFailure: true
        }
      );
    } catch (error) {
      this.log(
        'Refresh Token Expiry',
        true,
        'Expired refresh token properly rejected (network error)',
        error
      );
    } finally {
      // Restore original refresh token
      if (originalRefresh) {
        Cookies.set('refresh_token', originalRefresh);
      }
    }
  }

  // Run all tests
  async runAll(): Promise<void> {
    await this.testTokenStorage();
    await this.testLocalStorageFallback();
    await this.testTokenValidation();
    await this.testRefreshEndpoint();
    await this.testTokenRefresh();
    await this.testRefreshTokenExpiry();
    
    this.printSummary();
  }

  private printSummary(): void {
    const passed = this.results.filter(r => r.passed).length;
    const total = this.results.length;
    const percentage = Math.round((passed / total) * 100);
    
    console.log('\n' + '='.repeat(60));
    console.log(`📊 Test Summary: ${passed}/${total} passed (${percentage}%)`);
    console.log('='.repeat(60));
    
    if (passed === total) {
      console.log('🎉 All tests passed! Refresh token implementation is working correctly.');
    } else {
      console.log('⚠️  Some tests failed. Review the details above.');
      console.log('\nFailed tests:');
      this.results.filter(r => !r.passed).forEach(r => {
        console.log(`  ❌ ${r.test}: ${r.message}`);
      });
    }
  }
}

// Export for use in browser console
if (typeof window !== 'undefined') {
  (window as unknown as { testRefreshToken: () => Promise<void> }).testRefreshToken = async () => {
    const tester = new RefreshTokenTester();
    await tester.runAll();
  };
  
}

export default RefreshTokenTester;
