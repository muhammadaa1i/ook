"use client";

import React, { useState, useEffect, useCallback } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Users, Package, ShoppingCart, TrendingUp, RefreshCw } from "lucide-react";
import modernApiClient from "@/lib/modernApiClient";
import { API_ENDPOINTS } from "@/lib/constants";
import { toast } from "react-toastify";
import { useI18n } from "@/i18n";

interface DashboardStats {
  totalUsers: number;
  totalProducts: number;
  totalOrders: number;
  pendingOrders: number;
}

interface StatsState {
  stats: DashboardStats;
  hasErrors: boolean;
  lastUpdated: Date | null;
  changedStats: Set<keyof DashboardStats>;
}

export default function AdminDashboard() {
  const { t } = useI18n();
  const [statsState, setStatsState] = useState<StatsState>({
    stats: {
      totalUsers: 0,
      totalProducts: 0,
      totalOrders: 0,
      pendingOrders: 0,
    },
    hasErrors: false,
    lastUpdated: null,
    changedStats: new Set(),
  });
  const [isLoading, setIsLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      setIsLoading(true);
      const now = Date.now();
      
      console.log('🔍 Fetching admin dashboard stats...');
      
      // Helper function to safely extract count from various response formats
      const extractCount = (response: unknown, name: string): number => {
        console.log(`📊 ${name} Raw Response:`, response);
        
        if (!response) return 0;
        
        const data = (response as any);
        
        // Try different possible response structures
        let count = 0;
        
        // Direct total/count properties
        if (typeof data.total === 'number') count = data.total;
        else if (typeof data.count === 'number') count = data.count;
        
        // Nested in data object
        else if (data.data) {
          if (typeof data.data.total === 'number') count = data.data.total;
          else if (typeof data.data.count === 'number') count = data.data.count;
          else if (Array.isArray(data.data.items)) count = data.data.items.length;
          else if (Array.isArray(data.data)) count = data.data.length;
        }
        
        // Direct items array
        else if (Array.isArray(data.items)) count = data.items.length;
        else if (Array.isArray(data)) count = data.length;
        
        // Fallback: try to find any array or count-like property
        else {
          const keys = Object.keys(data);
          for (const key of keys) {
            if (Array.isArray(data[key])) {
              count = data[key].length;
              break;
            }
            if (typeof data[key] === 'number' && (key.includes('total') || key.includes('count'))) {
              count = data[key];
              break;
            }
          }
        }
        
        console.log(`✅ ${name} Count:`, count);
        return count;
      };
      
      // Fetch stats with individual error handling
      const fetchStat = async (name: string, endpoint: string, params?: Record<string, unknown>) => {
        try {
          const response = await modernApiClient.get(endpoint, { ...params, limit: 1, _nc: now }, { cache: false, force: true });
          return extractCount(response, name);
        } catch (error) {
          console.error(`❌ Error fetching ${name}:`, error);
          toast.error(`Failed to fetch ${name.toLowerCase()}`);
          return 0;
        }
      };

      const [
        totalUsers,
        totalProducts,
        totalOrders,
        pendingOrders,
      ] = await Promise.all([
        fetchStat('Users', API_ENDPOINTS.USERS),
        fetchStat('Products', API_ENDPOINTS.SLIPPERS),
        fetchStat('Orders', API_ENDPOINTS.ORDERS),
        fetchStat('Pending Orders', API_ENDPOINTS.ORDERS, { status: 'pending' }),
      ]);

      const newStats = {
        totalUsers,
        totalProducts,
        totalOrders,
        pendingOrders,
      };

      console.log('✅ Final Stats:', newStats);
      
      // Detect which stats have changed
      const changedStats = new Set<keyof DashboardStats>();
      Object.keys(newStats).forEach(key => {
        const statKey = key as keyof DashboardStats;
        if (statsState.stats[statKey] !== newStats[statKey]) {
          changedStats.add(statKey);
        }
      });

      setStatsState({
        stats: newStats,
        hasErrors: false,
        lastUpdated: new Date(),
        changedStats,
      });
      
      // Clear changed indicators after 3 seconds
      setTimeout(() => {
        setStatsState(prev => ({
          ...prev,
          changedStats: new Set(),
        }));
      }, 3000);
      
      // Show success message only if we got some data
      if (totalUsers > 0 || totalProducts > 0 || totalOrders > 0) {
        toast.success('Stats updated successfully');
      } else {
        toast.warning('Stats updated but all counts are zero - this might indicate no data or API issues');
      }
      
    } catch (error) {
      console.error("❌ Error fetching stats:", error);
      setStatsState(prev => ({
        ...prev,
        hasErrors: true,
        lastUpdated: new Date(),
        changedStats: new Set(),
      }));
      toast.error(t('admin.dashboard.loadError'));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchStats();
    
    // Set up automatic refresh every 30 seconds
    let interval: NodeJS.Timeout;
    
    const startAutoRefresh = () => {
      if (autoRefresh && !interval) {
        interval = setInterval(() => {
          // Only refresh if page is visible
          if (!document.hidden) {
            console.log('🔄 Auto-refreshing admin stats...');
            fetchStats();
          }
        }, 30000); // 30 seconds
      }
    };

    const stopAutoRefresh = () => {
      if (interval) {
        clearInterval(interval);
        interval = undefined as any;
      }
    };

    // Page visibility change handler
    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log('📴 Page hidden, pausing auto-refresh');
        stopAutoRefresh();
      } else {
        console.log('👁️ Page visible, resuming auto-refresh');
        if (autoRefresh) {
          // Refresh immediately when page becomes visible
          fetchStats();
          startAutoRefresh();
        }
      }
    };

    startAutoRefresh();
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      stopAutoRefresh();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchStats, autoRefresh]);

  const statCards = [
    { title: t('admin.dashboard.stats.totalUsers'), value: statsState.stats.totalUsers, icon: Users, color: 'bg-blue-500' },
    { title: t('admin.dashboard.stats.totalProducts'), value: statsState.stats.totalProducts, icon: Package, color: 'bg-green-500' },
    { title: t('admin.dashboard.stats.totalOrders'), value: statsState.stats.totalOrders, icon: ShoppingCart, color: 'bg-purple-500' },
    { title: t('admin.dashboard.stats.pendingOrders'), value: statsState.stats.pendingOrders, icon: TrendingUp, color: 'bg-orange-500' },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{t('admin.dashboard.title')}</h1>
              <p className="text-gray-600 mt-2">{t('admin.dashboard.welcome')}</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 text-sm text-gray-600">
                  <input
                    type="checkbox"
                    checked={autoRefresh}
                    onChange={(e) => setAutoRefresh(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  Auto-refresh (30s)
                </label>
              </div>
              <button
                onClick={fetchStats}
                disabled={isLoading}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                Manual Refresh
              </button>
            </div>
          </div>
          
          {/* Status indicator */}
          {statsState.lastUpdated && (
            <div className="mt-2 flex items-center gap-4 text-sm text-gray-500">
              <span>Last updated: {statsState.lastUpdated.toLocaleTimeString()}</span>
              {autoRefresh && (
                <span className="flex items-center gap-1 text-green-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  Auto-updating every 30s
                </span>
              )}
              {statsState.hasErrors && (
                <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs">
                  Some data may be incomplete due to API errors
                </span>
              )}
            </div>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((card, index) => {
            const Icon = card.icon;
            const statKey = ['totalUsers', 'totalProducts', 'totalOrders', 'pendingOrders'][index] as keyof DashboardStats;
            const hasChanged = statsState.changedStats.has(statKey);
            
            return (
              <div key={index} className={`bg-white rounded-lg shadow p-6 transition-all duration-300 ${hasChanged ? 'ring-2 ring-blue-500 bg-blue-50' : ''}`}>
                <div className="flex items-center">
                  <div className={`${card.color} rounded-md p-3`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-4 flex-1">
                    <p className="text-sm font-medium text-gray-600">
                      {card.title}
                    </p>
                    <div className="flex items-center gap-2">
                      <p className="text-2xl font-bold text-gray-900">
                        {isLoading ? "..." : card.value.toLocaleString()}
                      </p>
                      {hasChanged && (
                        <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded-full animate-pulse">
                          Updated!
                        </span>
                      )}
                    </div>
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
