// Development authentication helper
// This file helps debug authentication issues

export const AUTH_DEBUG = {
  // Test credentials that should work
  TEST_CREDENTIALS: {
    name: "admin",
    password: "password"
  },
  
  // Alternative test credentials if the backend expects different format
  ALT_CREDENTIALS: {
    name: "test",
    password: "test123456"
  },
  
  // Common username/password combinations to try
  COMMON_COMBINATIONS: [
    { name: "admin", password: "admin" },
    { name: "admin", password: "password" },
    { name: "admin", password: "admin123" },
    { name: "test", password: "test" },
    { name: "test", password: "test123" },
    { name: "user", password: "password" },
    { name: "demo", password: "demo" },
  ],
  
  // Check if backend is responding
  async checkBackendHealth() {
    try {
      const response = await fetch('/api/health');
      const data = await response.json();
      console.log('Backend health check:', data);
      return response.ok;
    } catch (error) {
      console.error('Backend health check failed:', error);
      return false;
    }
  },
  
  // Test direct proxy endpoint
  async testProxyEndpoint() {
    try {
      const response = await fetch('/api/proxy?endpoint=/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(this.TEST_CREDENTIALS)
      });
      
      const data = await response.json();
      console.log('Proxy test response:', { status: response.status, data });
      return { status: response.status, data };
    } catch (error) {
      console.error('Proxy test failed:', error);
      return { error };
    }
  },
  
  // Enable test mode temporarily
  enableTestMode() {
    console.log('To enable test mode, set USE_TEST_AUTH=true in your environment');
    console.log('Test credentials:', this.TEST_CREDENTIALS);
  }
};

// Make it available globally for debugging
if (typeof window !== 'undefined') {
  (window as unknown as Record<string, unknown>).AUTH_DEBUG = AUTH_DEBUG;
}