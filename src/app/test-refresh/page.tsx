"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export default function RefreshTokenTestPage() {
  const { user, isAuthenticated } = useAuth();
  const [testOutput, setTestOutput] = useState<string>('');
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    // Capture console output
    const originalLog = console.log;
    const originalError = console.error;
    const logs: string[] = [];

    console.log = (...args) => {
      logs.push(args.join(' '));
      originalLog(...args);
    };

    console.error = (...args) => {
      logs.push(`ERROR: ${args.join(' ')}`);
      originalError(...args);
    };

    return () => {
      console.log = originalLog;
      console.error = originalError;
      setTestOutput(logs.join('\n'));
    };
  }, []);

  const runTests = async () => {
    setIsRunning(true);
    setTestOutput('Starting tests...\n');

    try {
      // Dynamically import the test suite
      const RefreshTokenTester = (await import('@/lib/__tests__/refreshTokenTest')).default;
      const tester = new RefreshTokenTester();
      await tester.runAll();
    } catch (error) {
      setTestOutput(prev => prev + '\nError running tests: ' + String(error));
    } finally {
      setIsRunning(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-2xl font-bold text-center mb-4">🔐 Refresh Token Test</h1>
          <p className="text-gray-600 text-center mb-6">
            Please log in first to test the refresh token functionality.
          </p>
          <a
            href="/auth/login"
            className="block w-full text-center bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition"
          >
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-center mb-2">🧪 Refresh Token Test Suite</h1>
          <p className="text-center text-gray-600 mb-8">
            Testing refresh token storage, validation, and automatic refresh flow
          </p>

          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <h2 className="font-semibold mb-2">Current Auth Status:</h2>
            <p className="text-sm">✅ Logged in as: {user?.name}</p>
            <p className="text-sm">📧 Phone: {user?.phone_number}</p>
            <p className="text-sm">🔑 User ID: {user?.id}</p>
          </div>

          <button
            onClick={runTests}
            disabled={isRunning}
            className="w-full bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed mb-6"
          >
            {isRunning ? '⏳ Running Tests...' : '▶️ Run Refresh Token Tests'}
          </button>

          {testOutput && (
            <div className="bg-gray-900 text-green-400 p-6 rounded-lg overflow-auto max-h-96 font-mono text-sm whitespace-pre-wrap">
              {testOutput}
            </div>
          )}

          <div className="mt-8 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <h3 className="font-semibold mb-2">📋 Tests Performed:</h3>
            <ul className="text-sm space-y-1 list-disc list-inside">
              <li>Token Storage (cookies & localStorage)</li>
              <li>localStorage Fallback Mechanism</li>
              <li>Token Validation Utilities</li>
              <li>Direct Refresh Endpoint Call</li>
              <li>Automatic Token Refresh on 401</li>
              <li>Expired Refresh Token Handling</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
