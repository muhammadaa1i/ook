/**
 * Performance monitoring component for development and debugging
 */

"use client";

import React, { useState, useEffect, useCallback } from "react";
import { modernApiClient } from "@/lib/modernApiClient";
import { BarChart3, Activity, Clock, Zap, X } from "lucide-react";

interface PerformanceMonitorProps {
  enabled?: boolean;
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left";
}

const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  enabled = process.env.NODE_ENV === "development",
  position = "bottom-right",
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [metrics, setMetrics] = useState<{
    averageResponseTime: number;
    cacheHitRate: number;
    errorRate: number;
    totalRequests: number;
    recentMetrics: Array<{
      endpoint: string;
      duration: number;
      cached: boolean;
      error?: boolean;
      timestamp: number;
    }>;
  } | null>(null);
  const [cacheStats, setCacheStats] = useState<{
    size: number;
    pendingRequests: number;
    hitRate: number;
  } | null>(null);

  const updateMetrics = useCallback(() => {
    const apiMetrics = {
      totalRequests: 0,
      averageResponseTime: 0,
      cacheHitRate: 0,
      errorRate: 0,
      recentMetrics: [],
    };
    const cache = {
      size: 0,
      pendingRequests: 0,
      hitRate: 0,
    };
    setMetrics(apiMetrics);
    setCacheStats(cache);
  }, []);

  useEffect(() => {
    if (!enabled) return;

    setIsVisible(true);

    // Update metrics every 5 seconds
    const interval = setInterval(updateMetrics, 5000);
    updateMetrics(); // Initial update

    return () => clearInterval(interval);
  }, [enabled, updateMetrics]);

  if (!enabled || !isVisible) return null;

  const positionClasses = {
    "bottom-right": "bottom-4 right-4",
    "bottom-left": "bottom-4 left-4",
    "top-right": "top-4 right-4",
    "top-left": "top-4 left-4",
  };

  const getStatusColor = (
    value: number,
    thresholds: { good: number; warning: number }
  ) => {
    if (value <= thresholds.good) return "text-green-600";
    if (value <= thresholds.warning) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className={`fixed ${positionClasses[position]} z-50`}>
      {!isExpanded ? (
        // Collapsed view
        <button
          onClick={() => setIsExpanded(true)}
          className="bg-gray-900 text-white p-2 rounded-full shadow-lg hover:bg-gray-800 transition-colors"
          title="Performance Monitor"
        >
          <Activity className="h-5 w-5" />
        </button>
      ) : (
        // Expanded view
        <div className="bg-white border border-gray-200 rounded-lg shadow-xl p-4 w-80 max-h-96 overflow-y-auto">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              <h3 className="text-sm font-semibold text-gray-900">
                Performance
              </h3>
            </div>
            <button
              onClick={() => setIsExpanded(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {metrics && (
            <div className="space-y-3">
              {/* API Metrics */}
              <div>
                <h4 className="text-xs font-medium text-gray-700 mb-2">
                  API Performance
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-gray-50 p-2 rounded">
                    <div className="text-gray-600">Avg Response</div>
                    <div
                      className={`font-medium ${getStatusColor(
                        metrics.averageResponseTime,
                        { good: 500, warning: 1000 }
                      )}`}
                    >
                      {metrics.averageResponseTime}ms
                    </div>
                  </div>
                  <div className="bg-gray-50 p-2 rounded">
                    <div className="text-gray-600">Cache Hit Rate</div>
                    <div
                      className={`font-medium ${getStatusColor(
                        100 - metrics.cacheHitRate,
                        { good: 30, warning: 60 }
                      )}`}
                    >
                      {metrics.cacheHitRate}%
                    </div>
                  </div>
                  <div className="bg-gray-50 p-2 rounded">
                    <div className="text-gray-600">Error Rate</div>
                    <div
                      className={`font-medium ${getStatusColor(
                        metrics.errorRate,
                        { good: 1, warning: 5 }
                      )}`}
                    >
                      {metrics.errorRate}%
                    </div>
                  </div>
                  <div className="bg-gray-50 p-2 rounded">
                    <div className="text-gray-600">Total Requests</div>
                    <div className="font-medium text-gray-900">
                      {metrics.totalRequests}
                    </div>
                  </div>
                </div>
              </div>

              {/* Cache Stats */}
              {cacheStats && (
                <div>
                  <h4 className="text-xs font-medium text-gray-700 mb-2">
                    Cache Stats
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-blue-50 p-2 rounded">
                      <div className="text-blue-600">Cache Size</div>
                      <div className="font-medium text-blue-900">
                        {cacheStats.size} entries
                      </div>
                    </div>
                    <div className="bg-blue-50 p-2 rounded">
                      <div className="text-blue-600">Pending Requests</div>
                      <div className="font-medium text-blue-900">
                        {cacheStats.pendingRequests}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Recent Requests */}
              {metrics.recentMetrics && metrics.recentMetrics.length > 0 && (
                <div>
                  <h4 className="text-xs font-medium text-gray-700 mb-2">
                    Recent Requests
                  </h4>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {metrics.recentMetrics.slice(-5).map(
                      (
                        metric: {
                          endpoint: string;
                          duration: number;
                          cached: boolean;
                          error?: boolean;
                          timestamp: number;
                        },
                        index: number
                      ) => (
                        <div
                          key={index}
                          className="flex items-center justify-between text-xs bg-gray-50 p-1 rounded"
                        >
                          <div className="flex items-center space-x-1">
                            {metric.cached ? (
                              <div title="Cached">
                                <Zap className="h-3 w-3 text-green-500" />
                              </div>
                            ) : (
                              <div title="API Call">
                                <Clock className="h-3 w-3 text-blue-500" />
                              </div>
                            )}
                            <span className="text-gray-600 truncate max-w-24">
                              {metric.endpoint.split("/").pop() || "unknown"}
                            </span>
                          </div>
                          <span
                            className={`font-medium ${
                              metric.error ? "text-red-600" : "text-gray-900"
                            }`}
                          >
                            {metric.error ? "ERROR" : `${metric.duration}ms`}
                          </span>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="pt-2 border-t border-gray-200">
                <button
                  onClick={() => {
                    // Note: Cache clearing functionality not available in modernApiClient
                    updateMetrics();
                  }}
                  className="w-full text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 py-1 px-2 rounded transition-colors"
                >
                  Clear Cache
                </button>
              </div>
            </div>
          )}

          {!metrics && (
            <div className="text-center text-gray-500 text-sm py-4">
              No performance data available
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PerformanceMonitor;
