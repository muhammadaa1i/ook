"use client";

import React, { useState, useEffect, useCallback } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Users, Package, ShoppingCart, TrendingUp, CreditCard } from "lucide-react";
import modernApiClient from "@/lib/modernApiClient";
import { API_ENDPOINTS } from "@/lib/constants";
import { toast } from "react-toastify";
import { useI18n } from "@/i18n";

interface DashboardStats {
  totalUsers: number;
  totalProducts: number;
  totalOrders: number;
  pendingOrders: number;
  totalPayments: number;
  successfulPayments: number;
}

export default function AdminDashboard() {
  const { t } = useI18n();
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalProducts: 0,
    totalOrders: 0,
    pendingOrders: 0,
    totalPayments: 0,
    successfulPayments: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      setIsLoading(true);
      const now = Date.now();
      const [
        usersResponse,
        productsResponse,
        ordersResponse,
        pendingOrdersResponse,
      ] = await Promise.all([
        modernApiClient.get(API_ENDPOINTS.USERS, { limit: 1, _nc: now }, { cache: false, force: true }),
        modernApiClient.get(API_ENDPOINTS.SLIPPERS, { limit: 1, _nc: now }, { cache: false, force: true }),
        modernApiClient.get(API_ENDPOINTS.ORDERS, { limit: 1, _nc: now }, { cache: false, force: true }),
        modernApiClient.get(API_ENDPOINTS.ORDERS, {
          limit: 1,
          status: "pending",
          _nc: now,
        }, { cache: false, force: true }),
      ]);

      // Handle modernApiClient response structure
      const getUsersData = (response: unknown) =>
        (response as Record<string, unknown>).data || response;
      const getProductsData = (response: unknown) =>
        (response as Record<string, unknown>).data || response;
      const getOrdersData = (response: unknown) =>
        (response as Record<string, unknown>).data || response;
      const getPendingOrdersData = (response: unknown) =>
        (response as Record<string, unknown>).data || response;

      // Get payment statistics from localStorage
      const getPaymentStats = () => {
        if (typeof window === 'undefined') return { total: 0, successful: 0 };
        try {
          const stored = localStorage.getItem('admin_payments');
          if (!stored) return { total: 0, successful: 0 };
          const payments = JSON.parse(stored);
          const total = payments.length;
          const successful = payments.filter((p: any) => p.status === 'success').length;
          return { total, successful };
        } catch {
          return { total: 0, successful: 0 };
        }
      };

      const paymentStats = getPaymentStats();

      setStats({
        totalUsers:
          ((getUsersData(usersResponse) as Record<string, unknown>)
            .total as number) || 0,
        totalProducts:
          ((getProductsData(productsResponse) as Record<string, unknown>)
            .total as number) || 0,
        totalOrders:
          ((getOrdersData(ordersResponse) as Record<string, unknown>)
            .total as number) || 0,
        pendingOrders:
          ((
            getPendingOrdersData(pendingOrdersResponse) as Record<
              string,
              unknown
            >
          ).total as number) || 0,
        totalPayments: paymentStats.total,
        successfulPayments: paymentStats.successful,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
  toast.error(t('admin.dashboard.loadError'));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const statCards = [
    { title: t('admin.dashboard.stats.totalUsers'), value: stats.totalUsers, icon: Users, color: 'bg-blue-500' },
    { title: t('admin.dashboard.stats.totalProducts'), value: stats.totalProducts, icon: Package, color: 'bg-green-500' },
    { title: t('admin.dashboard.stats.totalOrders'), value: stats.totalOrders, icon: ShoppingCart, color: 'bg-purple-500' },
    { title: t('admin.dashboard.stats.pendingOrders'), value: stats.pendingOrders, icon: TrendingUp, color: 'bg-orange-500' },
    { title: t('admin.dashboard.stats.totalPayments') || 'Total Payments', value: stats.totalPayments, icon: CreditCard, color: 'bg-indigo-500' },
    { title: t('admin.dashboard.stats.successfulPayments') || 'Successful Payments', value: stats.successfulPayments, icon: CreditCard, color: 'bg-emerald-500' },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('admin.dashboard.title')}</h1>
          <p className="text-gray-600 mt-2">{t('admin.dashboard.welcome')}</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {statCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <div key={index} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className={`${card.color} rounded-md p-3`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">
                      {card.title}
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {isLoading ? "..." : card.value.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">{t('admin.dashboard.quickActions.title')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <a
              href="/admin/products"
              className="flex items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 transition-colors"
            >
              <Package className="h-8 w-8 text-gray-400 mr-3" />
              <div>
                <p className="font-medium text-gray-900">{t('admin.dashboard.quickActions.products.title')}</p>
                <p className="text-sm text-gray-600">{t('admin.dashboard.quickActions.products.subtitle')}</p>
              </div>
            </a>

            <a
              href="/admin/orders"
              className="flex items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 transition-colors"
            >
              <ShoppingCart className="h-8 w-8 text-gray-400 mr-3" />
              <div>
                <p className="font-medium text-gray-900">{t('admin.dashboard.quickActions.orders.title')}</p>
                <p className="text-sm text-gray-600">{t('admin.dashboard.quickActions.orders.subtitle')}</p>
              </div>
            </a>

            <a
              href="/admin/users"
              className="flex items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 transition-colors"
            >
              <Users className="h-8 w-8 text-gray-400 mr-3" />
              <div>
                <p className="font-medium text-gray-900">{t('admin.dashboard.quickActions.users.title')}</p>
                <p className="text-sm text-gray-600">{t('admin.dashboard.quickActions.users.subtitle')}</p>
              </div>
            </a>

            <a
              href="/admin/payments"
              className="flex items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 transition-colors"
            >
              <CreditCard className="h-8 w-8 text-gray-400 mr-3" />
              <div>
                <p className="font-medium text-gray-900">{t('admin.dashboard.quickActions.payments.title') || 'Manage Payments'}</p>
                <p className="text-sm text-gray-600">{t('admin.dashboard.quickActions.payments.subtitle') || 'Monitor payment transactions'}</p>
              </div>
            </a>
          </div>
        </div>

      </div>
    </AdminLayout>
  );
}
