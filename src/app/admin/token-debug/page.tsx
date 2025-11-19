"use client";

import React, { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { getTokenDebugInfo, TOKEN_EXPIRY } from "@/lib/tokenUtils";
import { Clock, CheckCircle, XCircle, RefreshCw } from "lucide-react";

export default function TokenDebugPage() {
  const [tokenInfo, setTokenInfo] = useState<ReturnType<typeof getTokenDebugInfo> | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const refreshTokenInfo = () => {
    const info = getTokenDebugInfo();
    setTokenInfo(info);
  };

  useEffect(() => {
    refreshTokenInfo();

    if (autoRefresh) {
      const interval = setInterval(refreshTokenInfo, 1000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const formatDuration = (ms: number | null) => {
    if (ms === null) return "N/A";
    
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Token Debug Dashboard
            </h1>
            <p className="text-gray-600 mt-1 text-sm sm:text-base">
              Monitor JWT token expiration and automatic refresh
            </p>
          </div>
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
              autoRefresh
                ? "bg-green-500 text-white"
                : "bg-gray-300 text-gray-700"
            }`}
          >
            <RefreshCw className={`h-4 w-4 ${autoRefresh ? "animate-spin" : ""}`} />
            {autoRefresh ? "Auto-Refresh ON" : "Auto-Refresh OFF"}
          </button>
        </div>

        {/* Token Configuration */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h2 className="text-lg font-semibold text-blue-900 mb-2">
            Token Configuration
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-blue-800">Access Token Lifetime:</span>
              <span className="ml-2 text-blue-600">
                {TOKEN_EXPIRY.ACCESS_TOKEN / (60 * 1000)} minutes
              </span>
            </div>
            <div>
              <span className="font-medium text-blue-800">Refresh Token Lifetime:</span>
              <span className="ml-2 text-blue-600">
                {TOKEN_EXPIRY.REFRESH_TOKEN / (60 * 60 * 1000)} hours
              </span>
            </div>
          </div>
        </div>

        {/* Access Token Status */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Access Token
            </h2>
            {tokenInfo?.accessToken.valid ? (
              <CheckCircle className="h-6 w-6 text-green-500" />
            ) : (
              <XCircle className="h-6 w-6 text-red-500" />
            )}
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-gray-600">Status:</span>
              <span
                className={`font-semibold ${
                  tokenInfo?.accessToken.exists
                    ? tokenInfo?.accessToken.valid
                      ? "text-green-600"
                      : "text-red-600"
                    : "text-gray-400"
                }`}
              >
                {tokenInfo?.accessToken.exists
                  ? tokenInfo?.accessToken.valid
                    ? "Valid"
                    : "Expired"
                  : "Not Found"}
              </span>
            </div>

            {tokenInfo?.accessToken.expiresAt && (
              <>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-gray-600">Expires At:</span>
                  <span className="font-mono text-sm">
                    {new Date(tokenInfo.accessToken.expiresAt).toLocaleString()}
                  </span>
                </div>

                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-gray-600">Time Remaining:</span>
                  <span className={`font-semibold ${
                    tokenInfo.accessToken.expiresIn && tokenInfo.accessToken.expiresIn < 5 * 60 * 1000
                      ? "text-red-600"
                      : "text-green-600"
                  }`}>
                    {formatDuration(tokenInfo.accessToken.expiresIn)}
                  </span>
                </div>

                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600">Minutes Left:</span>
                  <span className="font-semibold text-blue-600">
                    {tokenInfo.accessToken.expiresInMinutes ?? 0} min
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Refresh Token Status */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              Refresh Token
            </h2>
            {tokenInfo?.refreshToken.valid ? (
              <CheckCircle className="h-6 w-6 text-green-500" />
            ) : (
              <XCircle className="h-6 w-6 text-red-500" />
            )}
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-gray-600">Status:</span>
              <span
                className={`font-semibold ${
                  tokenInfo?.refreshToken.exists
                    ? tokenInfo?.refreshToken.valid
                      ? "text-green-600"
                      : "text-red-600"
                    : "text-gray-400"
                }`}
              >
                {tokenInfo?.refreshToken.exists
                  ? tokenInfo?.refreshToken.valid
                    ? "Valid"
                    : "Expired"
                  : "Not Found"}
              </span>
            </div>

            {tokenInfo?.refreshToken.expiresAt && (
              <>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-gray-600">Expires At:</span>
                  <span className="font-mono text-sm">
                    {new Date(tokenInfo.refreshToken.expiresAt).toLocaleString()}
                  </span>
                </div>

                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-gray-600">Time Remaining:</span>
                  <span className={`font-semibold ${
                    tokenInfo.refreshToken.expiresIn && tokenInfo.refreshToken.expiresIn < 1 * 60 * 60 * 1000
                      ? "text-red-600"
                      : "text-green-600"
                  }`}>
                    {formatDuration(tokenInfo.refreshToken.expiresIn)}
                  </span>
                </div>

                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600">Hours Left:</span>
                  <span className="font-semibold text-blue-600">
                    {tokenInfo.refreshToken.expiresInHours ?? 0} hours
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Auto-Refresh Info */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-yellow-900 mb-2">
            Automatic Token Refresh
          </h3>
          <p className="text-sm text-yellow-800">
            The system automatically refreshes the access token when it expires in less than 5 minutes.
            Refresh tokens are automatically renewed when they expire in less than 1 hour.
            Check every 2 minutes ensures seamless authentication.
          </p>
        </div>
      </div>
    </AdminLayout>
  );
}
