"use client";

import React, { useState, useEffect, useCallback } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Users, Package, ShoppingCart } from "lucide-react";
import { useI18n } from "@/i18n";
import modernApiClient from "@/lib/modernApiClient";
import { API_ENDPOINTS } from "@/lib/constants";

interface DashboardStats {
  totalUsers: number;
  totalProducts: number;
  totalOrders: number;
}

interface ApiResponse {
  total?: number;
  count?: number;
  items?: unknown[];
  data?: {
    total?: number;
    count?: number;
    items?: unknown[];
    total_count?: number;
  } | unknown[];
  meta?: {
    total?: number;
    count?: number;
  };
  [key: string]: unknown;
}

export default function AdminDashboard() {
  const { t } = useI18n();
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalProducts: 0,
    totalOrders: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  /**
   * Extract count from various API response formats
   * Handles different backend response structures gracefully
   */
  const extractCount = useCallback((response: unknown): number => {
    if (!response) return 0;
    
    const data = response as ApiResponse;
    
    // Priority order for extracting count:
    // 1. meta.total (most reliable for paginated endpoints)
    if (data.meta?.total !== undefined) return data.meta.total;
    if (data.meta?.count !== undefined) return data.meta.count;
    
    // 2. Direct total/count properties
    if (data.total !== undefined) return data.total;
    if (data.count !== undefined) return data.count;
    
    // 3. Nested in data object
    if (data.data && typeof data.data === 'object' && !Array.isArray(data.data)) {
      const nested = data.data as { total?: number; count?: number; total_count?: number };
      if (nested.total !== undefined) return nested.total;
      if (nested.count !== undefined) return nested.count;
      if (nested.total_count !== undefined) return nested.total_count;
    }
    
    // 4. Array length (least reliable, used as last resort)
    if (Array.isArray(data.items)) return data.items.length;
    if (Array.isArray(data.data)) return data.data.length;
    if (Array.isArray(data)) return data.length;
    
    return 0;
  }, []);

  /**
   * Fetch count for a specific endpoint with optimized parameters
   */
  const fetchEndpointCount = useCallback(async (endpoint: string): Promise<number> => {
    try {
      // Use minimal parameters to get just the count/total
      const params: Record<string, unknown> = {
        limit: 1, // Minimize data transfer
        skip: 0,
        _t: Date.now(), // Cache buster
      };

      const response = await modernApiClient.get(endpoint, params, {
        cache: false,
        force: true,
        timeout: 10000,
      });

      return extractCount(response);
    } catch (error) {
      console.error(`Failed to fetch count from ${endpoint}:`, error);
      return 0;
    }
  }, [extractCount]);

  /**
   * Fetch all dashboard statistics
   */
  const fetchStats = useCallback(async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      // Fetch all stats in parallel for better performance
      const [totalUsers, totalProducts, totalOrders] = await Promise.all([
        fetchEndpointCount(API_ENDPOINTS.USERS),
        fetchEndpointCount(API_ENDPOINTS.SLIPPERS),
        fetchEndpointCount(API_ENDPOINTS.ORDERS),
      ]);

      setStats({
        totalUsers,
        totalProducts,
        totalOrders,
      });
      setLastUpdated(new Date());
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load statistics';
      setError(errorMessage);
      console.error("Error fetching dashboard stats:", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [fetchEndpointCount]);

  useEffect(() => {
    fetchStats();
    
    // Auto-refresh every 60 seconds to keep dashboard up-to-date
    const interval = setInterval(() => fetchStats(), 60000);
    
    return () => clearInterval(interval);
  }, [fetchStats]);

  const handleManualRefresh = () => {
    fetchStats(true);
  };

  const statCards = [
    { 
      title: t('admin.dashboard.stats.totalUsers'), 
      value: stats.totalUsers, 
      icon: Users, 
      color: 'bg-blue-500' 
    },
    { 
      title: t('admin.dashboard.stats.totalProducts'), 
      value: stats.totalProducts, 
      icon: Package, 
      color: 'bg-green-500' 
    },
    { 
      title: t('admin.dashboard.stats.totalOrders'), 
      value: stats.totalOrders, 
      icon: ShoppingCart, 
      color: 'bg-purple-500' 
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header Section */}
        <div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                {t('admin.dashboard.title')}
              </h1>
              <p className="text-gray-600 mt-1 sm:mt-2 text-sm sm:text-base">
                {t('admin.dashboard.welcome')}
              </p>
            </div>
            
            <button
              type="button"
              onClick={handleManualRefresh}
              disabled={isRefreshing || isLoading}
              className="flex items-center gap-2 text-sm px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              <svg 
                className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`}
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {isRefreshing ? (t('common.refreshing') || 'Refreshing...') : (t('common.refresh') || 'Refresh')}
            </button>
          </div>
          
          {error && (
            <div className="mt-3">
              <span className="text-xs text-red-600 bg-red-50 px-3 py-1.5 rounded-lg inline-block">
                {t('common.errorFetching') || 'Error loading data'}
              </span>
            </div>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
          {statCards.map((card, index) => {
            const Icon = card.icon;
            
            return (
              <div 
                key={index} 
                className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-4 sm:p-6"
              >
                <div className="flex items-center">
                  <div className={`${card.color} rounded-md p-2 sm:p-3`}>
                    <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                  </div>
                  <div className="ml-3 sm:ml-4 flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">
                      {card.title}
                    </p>
                    <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mt-1">
                      {isLoading ? (
                        <span className="animate-pulse">...</span>
                      ) : (
                        card.value.toLocaleString()
                      )}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AdminLayout>
  );
}