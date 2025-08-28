"use client";

import React, { useState, useEffect, useCallback } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { TableSkeleton } from "@/components/ui/skeleton";
import { Order, SearchParams } from "@/types";
import modernApiClient from "@/lib/modernApiClient";
import { API_ENDPOINTS, PAGINATION } from "@/lib/constants";
import { toast } from "react-toastify";
import { ChevronLeft, ChevronRight, Eye, Package, Check, X, Clock, Truck, CreditCard, DollarSign, AlertCircle, RefreshCw } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { useI18n } from "@/i18n";
import { usePaymentStatus, useBulkPaymentStatus } from "@/hooks/usePaymentStatus";

const statusIcons = {
  pending: <Clock className="h-4 w-4 text-yellow-500" />,
  processing: <Package className="h-4 w-4 text-blue-500" />,
  shipped: <Truck className="h-4 w-4 text-purple-500" />,
  delivered: <Check className="h-4 w-4 text-green-500" />,
  cancelled: <X className="h-4 w-4 text-red-500" />,
};

const statusColors = {
  pending: "bg-yellow-100 text-yellow-800",
  processing: "bg-blue-100 text-blue-800",
  shipped: "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

const paymentStatusIcons = {
  pending: <Clock className="h-4 w-4 text-yellow-500" />,
  success: <Check className="h-4 w-4 text-green-500" />,
  failed: <X className="h-4 w-4 text-red-500" />,
  cancelled: <X className="h-4 w-4 text-gray-500" />,
  unknown: <AlertCircle className="h-4 w-4 text-gray-500" />,
};

const paymentStatusColors = {
  pending: "bg-yellow-100 text-yellow-800",
  success: "bg-green-100 text-green-800", 
  failed: "bg-red-100 text-red-800",
  cancelled: "bg-gray-100 text-gray-800",
  unknown: "bg-gray-100 text-gray-800",
};

// statusLabels removed (localized through t)

export default function AdminOrdersPage() {
  const { t } = useI18n();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: PAGINATION.DEFAULT_LIMIT as number,
    totalPages: 1,
  });
  const [filters, setFilters] = useState<SearchParams>({
    skip: 0,
    limit: PAGINATION.DEFAULT_LIMIT,
  });

  // Payment status hooks
  const { checkPaymentStatus, isChecking } = usePaymentStatus();
  const { 
    checkMultiplePaymentStatuses, 
    isChecking: isBulkChecking, 
    progress 
  } = useBulkPaymentStatus();
  // Search and global status filter removed

  // Debounced search removed

  const fetchOrders = useCallback(async () => {
    try {
      setIsLoading(true);
  const response = await modernApiClient.get(API_ENDPOINTS.ORDERS, filters as unknown as Record<string, unknown>);

      // Handle response data structure
      const data =
        (
          response as {
            data?: {
              items?: Order[];
              data?: Order[];
              total?: number;
              pages?: number;
              total_pages?: number;
            };
          }
        )?.data ||
        (response as
          | Order[]
          | {
              items?: Order[];
              data?: Order[];
              total?: number;
              pages?: number;
              total_pages?: number;
            });
      const ordersData = Array.isArray(data)
        ? data
        : (data as { items?: Order[]; data?: Order[] })?.items ||
          (data as { items?: Order[]; data?: Order[] })?.data ||
          [];

      setOrders(Array.isArray(ordersData) ? ordersData : []);
      const paginationData = data as {
        total?: number;
        pages?: number;
        total_pages?: number;
      };
      setPagination({
        total: paginationData?.total || 0,
        page:
          Math.floor(
            (filters.skip || 0) / (filters.limit || PAGINATION.DEFAULT_LIMIT)
          ) + 1,
        limit: Number(filters.limit || PAGINATION.DEFAULT_LIMIT),
        totalPages:
          paginationData?.pages ||
          paginationData?.total_pages ||
          Math.ceil(
            (paginationData?.total || 0) /
              (filters.limit || PAGINATION.DEFAULT_LIMIT)
          ),
      });
    } catch (error) {
      console.error("Error fetching orders:", error);
  toast.error(t('admin.orders.toasts.loadError'));
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  }, [filters, t]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Automatic payment status checking for orders with pending payments
  useEffect(() => {
    const checkPendingPayments = async () => {
      const pendingPaymentOrders = orders.filter(order => 
        order.transfer_id && 
        (order.payment_status === 'pending' || !order.payment_status)
      );

      if (pendingPaymentOrders.length > 0) {
        console.log(`Auto-checking payment status for ${pendingPaymentOrders.length} orders`);
        
        for (const order of pendingPaymentOrders) {
          try {
            await checkPaymentStatus(order.transfer_id!, order.id);
          } catch (error) {
            console.error(`Auto payment status check failed for order ${order.id}:`, error);
          }
        }
        
        // Refresh orders after checking
        setTimeout(() => {
          fetchOrders();
        }, 2000);
      }
    };

    // Auto-check payment status when orders are loaded
    if (orders.length > 0 && !isLoading && !isChecking) {
      checkPendingPayments();
    }

    // Set up periodic checking every 30 seconds for pending payments
    const interval = setInterval(() => {
      if (!isLoading && !isChecking && !isBulkChecking) {
        checkPendingPayments();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [orders, isLoading, isChecking, isBulkChecking, checkPaymentStatus, fetchOrders]);

  // Search effect removed

  const handlePageChange = useCallback(
    (page: number) => {
      const skip = (page - 1) * pagination.limit;
      setFilters((prev) => ({ ...prev, skip }));
    },
    [pagination.limit]
  );

  const handleStatusChange = useCallback(
    async (orderId: number, newStatus: string) => {
      const updatePayload = { status: newStatus };
      
      console.log('Attempting to update order:', orderId, 'to status:', newStatus);
      console.log('Update payload:', updatePayload);
      
      // Try multiple approaches to handle different backend requirements
      const endpoints = [
        API_ENDPOINTS.ORDER_BY_ID(orderId),
        API_ENDPOINTS.ORDER_BY_ID_SLASH(orderId)
      ];
      
      const methods = ['put', 'patch'] as const;
      
      for (const endpoint of endpoints) {
        for (const method of methods) {
          try {
            console.log(`Trying ${method.toUpperCase()} ${endpoint}`);
            
            const response = method === 'put' 
              ? await modernApiClient.put(endpoint, updatePayload)
              : await modernApiClient.patch(endpoint, updatePayload);
            console.log('Update response:', response);
            
            toast.success(t('admin.orders.toasts.statusUpdateSuccess'));
            fetchOrders();
            return; // Success, exit early
            
          } catch (error: any) {
            console.log(`${method.toUpperCase()} ${endpoint} failed:`, error.status || error.message);
            
            // If this is the last attempt, show detailed error
            if (endpoint === endpoints[endpoints.length - 1] && method === methods[methods.length - 1]) {
              console.error("All update attempts failed. Full error details:", error);
              console.error("Error response:", error.response);
              console.error("Error status:", error.status);
              console.error("Error message:", error.message);
              
              // Try to get more details from the error
              if (error.response && error.response.data) {
                console.error("Backend error details:", error.response.data);
                toast.error(`Update failed: ${JSON.stringify(error.response.data.detail || error.message)}`);
              } else {
                toast.error(t('admin.orders.toasts.statusUpdateError'));
              }
            }
          }
        }
      }
    },
  [fetchOrders, t]
  );

  const handleCheckPaymentStatus = useCallback(async (orderId: number, transferId: string) => {
    try {
      await checkPaymentStatus(transferId, orderId);
      toast.success('Payment status updated successfully');
      fetchOrders();
    } catch (error) {
      toast.error('Failed to check payment status');
    }
  }, [checkPaymentStatus, fetchOrders]);

  const handleBulkPaymentStatusCheck = useCallback(async () => {
    try {
      await checkMultiplePaymentStatuses(orders);
      toast.success('Payment statuses updated successfully');
      fetchOrders();
    } catch (error) {
      toast.error('Failed to check payment statuses');
    }
  }, [checkMultiplePaymentStatuses, orders, fetchOrders]);

  const renderPagination = () => {
    if (pagination.totalPages <= 1) return null;

    return (
      <div className="flex justify-between items-center mt-8">
        <div className="text-sm text-gray-600">
          {t('admin.products.pagination.shown', { count: orders.length.toString(), total: pagination.total.toString() })}
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page === 1 || isLoading}
            className="p-2 rounded-md border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <div className="flex space-x-1">
            {Array.from({ length: Math.min(5, pagination.totalPages) }).map(
              (_, i) => {
                const pageNumber = i + 1;
                return (
                  <button
                    key={pageNumber}
                    onClick={() => handlePageChange(pageNumber)}
                    className={`px-3 py-2 rounded-md border border-gray-300 ${
                      pagination.page === pageNumber
                        ? "bg-blue-500 text-white border-blue-500"
                        : "hover:bg-gray-50"
                    }`}
                    disabled={isLoading}
                  >
                    {pageNumber}
                  </button>
                );
              }
            )}
          </div>

          <button
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page === pagination.totalPages || isLoading}
            className="p-2 rounded-md border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{t('admin.orders.title')}</h1>
            <p className="text-gray-600 mt-2">{t('admin.orders.subtitle')}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleBulkPaymentStatusCheck}
              disabled={isBulkChecking || isLoading}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isBulkChecking ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Checking {Math.round(progress)}%
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Check All Payments
                </>
              )}
            </button>
          </div>
        </div>

        {/* Info bar (search & global status filter removed) */}
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex justify-between text-sm text-gray-600">
            <span>{t('admin.orders.info.orders', { total: pagination.total.toString() })}</span>
            {pagination.total > 0 && (
              <span>{t('admin.orders.info.page', { page: pagination.page.toString(), pages: pagination.totalPages.toString() })}</span>
            )}
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-lg shadow-sm border">
          {isLoading ? (
            <TableSkeleton />
          ) : orders.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('admin.orders.table.order')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('admin.orders.table.client')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('admin.orders.table.items')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('admin.orders.table.amount')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('admin.orders.table.status')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Payment Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('admin.orders.table.date')}
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('admin.orders.table.actions')}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          #{order.id}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {order.user?.name || t('admin.orders.unspecifiedUser')}{" "}
                          {order.user?.surname || ""}
                        </div>
                        <div className="text-sm text-gray-500">
                          {order.user?.phone_number || ""}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {t('admin.orders.itemsCount', { count: (order.items?.length || 0).toString() })}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {formatPrice(order.total_amount)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${
                            statusColors[order.status]
                          }`}
                        >
                          {statusIcons[order.status]}
                          <span className="ml-1">
                            {t(`admin.orders.status.${order.status}`)}
                          </span>
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${
                              paymentStatusColors[order.payment_status || 'unknown']
                            }`}
                          >
                            {paymentStatusIcons[order.payment_status || 'unknown']}
                            <span className="ml-1">
                              {order.payment_status || 'Unknown'}
                            </span>
                          </span>
                          {order.transfer_id && (
                            <button
                              onClick={() => handleCheckPaymentStatus(order.id, order.transfer_id!)}
                              disabled={isChecking}
                              className="text-blue-600 hover:text-blue-900 disabled:opacity-50"
                              title="Check payment status"
                            >
                              <RefreshCw className={`h-3 w-3 ${isChecking ? 'animate-spin' : ''}`} />
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(order.created_at).toLocaleDateString("ru-RU")}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button className="text-blue-600 hover:text-blue-900">
                            <Eye className="h-4 w-4" />
                          </button>
                          <select
                            value={order.status}
                            onChange={(e) =>
                              handleStatusChange(order.id, e.target.value)
                            }
                            className="text-xs border border-gray-300 rounded px-2 py-1 bg-white text-gray-900"
                          >
                            <option value="pending">{t('admin.orders.status.pending')}</option>
                            <option value="processing">{t('admin.orders.status.processing')}</option>
                            <option value="shipped">{t('admin.orders.status.shipped')}</option>
                            <option value="delivered">{t('admin.orders.status.delivered')}</option>
                            <option value="cancelled">{t('admin.orders.status.cancelled')}</option>
                          </select>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Package className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">{t('admin.orders.empty.title')}</h3>
              <p className="mt-1 text-sm text-gray-500">{t('admin.orders.empty.subtitle')}</p>
            </div>
          )}
        </div>

        {renderPagination()}
      </div>
    </AdminLayout>
  );
}
