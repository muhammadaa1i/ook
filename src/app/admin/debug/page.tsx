/**
 * Test script to check API endpoints and debug the admin dashboard stats issue
 */

"use client";

import { useEffect, useState } from "react";
import modernApiClient from "@/lib/modernApiClient";
import { API_ENDPOINTS } from "@/lib/constants";

export default function AdminDebugPage() {
  const [apiTests, setApiTests] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(false);

  const testEndpoint = async (name: string, endpoint: string, params?: Record<string, unknown>) => {
    try {
      const response = await modernApiClient.get(endpoint, params, { cache: false, force: true }); 
      setApiTests(prev => ({
        ...prev,
        [name]: {
          status: 'success',
          data: response,
          endpoint,
          params
        }
      }));
    } catch (error) {
     
      setApiTests(prev => ({
        ...prev,
        [name]: {
          status: 'error',
          error: error,
          endpoint,
          params
        }
      }));
    }
  };

  const runAllTests = async () => {
    setIsLoading(true);
    setApiTests({});

    const now = Date.now();
    
    // Test all endpoints
    await Promise.all([
      testEndpoint('Users', API_ENDPOINTS.USERS, { limit: 1, _nc: now }),
      testEndpoint('Products', API_ENDPOINTS.SLIPPERS, { limit: 1, _nc: now }),
      testEndpoint('Orders', API_ENDPOINTS.ORDERS, { limit: 1, _nc: now }),
      testEndpoint('Pending Orders', API_ENDPOINTS.ORDERS, { limit: 1, status: 'pending', _nc: now }),
      testEndpoint('Categories', API_ENDPOINTS.CATEGORIES, { limit: 1, _nc: now }),
    ]);

    setIsLoading(false);
  };

  useEffect(() => {
    runAllTests();
  }, []);

  return (
    <div className="max-w-6xl mx-auto p-8">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Admin API Debug</h1>
          <button
            onClick={runAllTests}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {isLoading ? 'Testing...' : 'Re-run Tests'}
          </button>
        </div>

        <div className="space-y-6">
          {Object.entries(apiTests).map(([name, result]) => (
            <div key={name} className="border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <h2 className="text-lg font-semibold">{name}</h2>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  result.status === 'success' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {result.status}
                </span>
              </div>
              
              <div className="text-sm text-gray-600 mb-2">
                <strong>Endpoint:</strong> {result.endpoint}
                {result.params && (
                  <div><strong>Params:</strong> {JSON.stringify(result.params)}</div>
                )}
              </div>

              <div className="bg-gray-50 p-3 rounded overflow-auto">
                <pre className="text-xs">
                  {JSON.stringify(result.status === 'success' ? result.data : result.error, null, 2)}
                </pre>
              </div>
            </div>
          ))}
        </div>

        {Object.keys(apiTests).length === 0 && !isLoading && (
          <div className="text-center text-gray-500 py-8">
            No test results yet. Click "Re-run Tests" to start.
          </div>
        )}
      </div>
    </div>
  );
}