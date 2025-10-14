"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { modernApiClient } from "@/lib/modernApiClient";
import { API_ENDPOINTS } from "@/lib/constants";
import { AUTH_DEBUG, getAuthDebugInfo, logAuthStatus } from "@/lib/authDebug";
import Cookies from "js-cookie";

export default function AuthDebugPage() {
  const { user, isAuthenticated, login, logout } = useAuth();
  const [debugInfo, setDebugInfo] = useState<ReturnType<typeof getAuthDebugInfo> | null>(null);
  const [testResults, setTestResults] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    refreshDebugInfo();
  }, [user, isAuthenticated]);

  const refreshDebugInfo = () => {
    const info = getAuthDebugInfo();
    setDebugInfo(info);
    logAuthStatus();
  };

  const testLogin = async () => {
    setIsLoading(true);
    try {
      await login({ name: "admin", password: "password" });
      setTestResults(prev => ({ ...prev, login: "✅ Success" }));
    } catch (error) {
      setTestResults(prev => ({ ...prev, login: `❌ Failed: ${error}` }));
    } finally {
      setIsLoading(false);
    }
  };

  const testCartAccess = async () => {
    setIsLoading(true);
    try {
      const cartData = await modernApiClient.get(API_ENDPOINTS.CART_ITEMS);
      setTestResults(prev => ({ ...prev, cart: `✅ Success: ${JSON.stringify(cartData).substring(0, 100)}...` }));
    } catch (error) {
      setTestResults(prev => ({ ...prev, cart: `❌ Failed: ${error}` }));
    } finally {
      setIsLoading(false);
    }
  };

  const testBackendHealth = async () => {
    setIsLoading(true);
    try {
      const healthy = await AUTH_DEBUG.checkBackendHealth();
      setTestResults(prev => ({ ...prev, health: healthy ? "✅ Backend is healthy" : "❌ Backend is down" }));
    } catch (error) {
      setTestResults(prev => ({ ...prev, health: `❌ Backend error: ${error}` }));
    } finally {
      setIsLoading(false);
    }
  };

  const testProxyAuth = async () => {
    setIsLoading(true);
    try {
      const result = await AUTH_DEBUG.testProxyEndpoint();
      setTestResults(prev => ({ ...prev, proxy: `Status: ${result.status}, Data: ${JSON.stringify(result.data)}` }));
    } catch (error) {
      setTestResults(prev => ({ ...prev, proxy: `❌ Failed: ${error}` }));
    } finally {
      setIsLoading(false);
    }
  };

  const clearAuthData = () => {
    Cookies.remove("access_token");
    Cookies.remove("refresh_token");
    Cookies.remove("user");
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user");
    localStorage.removeItem("refresh_token");
    logout();
    refreshDebugInfo();
    setTestResults({});
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Authentication Debug Console</h1>
      
      {/* Current Status */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Current Auth Status</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p><strong>Authenticated:</strong> {isAuthenticated ? "✅ Yes" : "❌ No"}</p>
            <p><strong>User:</strong> {user ? `${user.name} (ID: ${user.id})` : "None"}</p>
          </div>
          <div>
            <p><strong>Access Token:</strong> {debugInfo?.hasAccessToken ? "✅ Present" : "❌ Missing"}</p>
            <p><strong>Refresh Token:</strong> {debugInfo?.hasRefreshToken ? "✅ Present" : "❌ Missing"}</p>
          </div>
        </div>
      </div>

      {/* Debug Information */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Debug Information</h2>
        <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
          {JSON.stringify(debugInfo, null, 2)}
        </pre>
        <button 
          onClick={refreshDebugInfo}
          className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Refresh Debug Info
        </button>
      </div>

      {/* Test Actions */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Test Actions</h2>
        <div className="grid grid-cols-2 gap-4">
          <button 
            onClick={testLogin}
            disabled={isLoading}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
          >
            Test Login (admin/password)
          </button>
          <button 
            onClick={testCartAccess}
            disabled={isLoading}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
          >
            Test Cart Access
          </button>
          <button 
            onClick={testBackendHealth}
            disabled={isLoading}
            className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 disabled:opacity-50"
          >
            Test Backend Health
          </button>
          <button 
            onClick={testProxyAuth}
            disabled={isLoading}
            className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600 disabled:opacity-50"
          >
            Test Proxy Auth
          </button>
        </div>
        <button 
          onClick={clearAuthData}
          className="mt-4 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
        >
          Clear All Auth Data
        </button>
      </div>

      {/* Test Results */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Test Results</h2>
        {Object.keys(testResults).length === 0 ? (
          <p className="text-gray-500">Run tests to see results</p>
        ) : (
          <div className="space-y-2">
            {Object.entries(testResults).map(([test, result]) => (
              <div key={test} className="p-3 bg-gray-50 rounded">
                <strong>{test}:</strong> {result}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}