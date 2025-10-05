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

export default function AdminDashboard() {
  const { t } = useI18n();
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalProducts: 0,
    totalOrders: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      setIsLoading(true);
      const now = Date.now();
      
      // Helper function to safely extract count from various response formats
      const extractCount = (response: unknown): number => {
        if (!response) return 0;
        
        interface ApiResponse {
          total?: number;
          count?: number;
          items?: unknown[];
          data?: {
            total?: number;
            count?: number;
            items?: unknown[];
          } | unknown[];
          [key: string]: unknown;
        }
        
        const data = response as ApiResponse;
        
        // Try different possible response structures
        let count = 0;
        
        // Direct total/count properties
        if (typeof data.total === 'number') count = data.total;
        else if (typeof data.count === 'number') count = data.count;
        
        // Nested in data object
        else if (data.data && !Array.isArray(data.data)) {
          const nestedData = data.data as { total?: number; count?: number; items?: unknown[] };
          if (typeof nestedData.total === 'number') count = nestedData.total;
          else if (typeof nestedData.count === 'number') count = nestedData.count;
          else if (Array.isArray(nestedData.items)) count = nestedData.items.length;
        }
        else if (Array.isArray(data.data)) count = data.data.length;
        
        // Direct items array
        else if (Array.isArray(data.items)) count = data.items.length;
        else if (Array.isArray(data)) count = data.length;
        
        // Fallback: try to find any array or count-like property
        else {
          const keys = Object.keys(data);
          for (const key of keys) {
            const value = data[key];
            if (Array.isArray(value)) {
              count = value.length;
              break;
            }
            if (typeof value === 'number' && (key.includes('total') || key.includes('count'))) {
              count = value;
              break;
            }
          }
        }
        
        return count;
      };
      
      // Fetch stats with individual error handling
      const fetchStat = async (endpoint: string, params?: Record<string, unknown>) => {
        try {
          const response = await modernApiClient.get(endpoint, { ...params, limit: 1, _nc: now }, { cache: false, force: true });
          return extractCount(response);
        } catch (error) {
          console.error(`Error fetching stats from ${endpoint}:`, error);
          return 0;
        }
      };

      const [
        totalUsers,
        totalProducts,
        totalOrders,
      ] = await Promise.all([
        fetchStat(API_ENDPOINTS.USERS),
        fetchStat(API_ENDPOINTS.SLIPPERS),
        fetchStat(API_ENDPOINTS.ORDERS),
      ]);

      setStats({
        totalUsers,
        totalProducts,
        totalOrders,
      });
      
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const statCards = [
    { title: t('admin.dashboard.stats.totalUsers'), value: stats.totalUsers, icon: Users, color: 'bg-blue-500' },
    { title: t('admin.dashboard.stats.totalProducts'), value: stats.totalProducts, icon: Package, color: 'bg-green-500' },
    { title: t('admin.dashboard.stats.totalOrders'), value: stats.totalOrders, icon: ShoppingCart, color: 'bg-purple-500' },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{t('admin.dashboard.title')}</h1>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
          {statCards.map((card, index) => {
            const Icon = card.icon;
            
            return (
              <div key={index} className="bg-white rounded-lg shadow p-4 sm:p-6">
                <div className="flex items-center">
                  <div className={`${card.color} rounded-md p-2 sm:p-3`}>
                    <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                  </div>
                  <div className="ml-3 sm:ml-4 flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">
                      {card.title}
                    </p>
                    <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">
                      {isLoading ? "..." : card.value.toLocaleString()}
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