"use client";

import React, { useState, useEffect, useCallback } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { TableSkeleton } from "@/components/ui/skeleton";
import { Order, SearchParams } from "@/types";
import modernApiClient from "@/lib/modernApiClient";
import { API_ENDPOINTS, PAGINATION } from "@/lib/constants";
import { toast } from "react-toastify";
import { ChevronLeft, ChevronRight, Package, Check, X, Clock, Truck, RefreshCcw } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { formatDate } from "@/lib/utils";
import { useI18n } from "@/i18n";
import { AdminRefundService } from "@/services/adminRefundService";
import RefundConfirmDialog from "@/components/admin/RefundConfirmDialog";

const statusIcons: Record<string, React.ReactElement> = {
  // Lowercase statuses
  pending: <Clock className="h-4 w-4 text-yellow-500" />,
  processing: <Package className="h-4 w-4 text-blue-500" />,
  shipped: <Truck className="h-4 w-4 text-purple-500" />,
  delivered: <Check className="h-4 w-4 text-green-500" />,
  cancelled: <X className="h-4 w-4 text-red-500" />,
  confirmed: <Check className="h-4 w-4 text-green-500" />,
  created: <Clock className="h-4 w-4 text-gray-500" />,
  paid: <Check className="h-4 w-4 text-green-500" />,
  failed: <X className="h-4 w-4 text-red-500" />,
  refunded: <X className="h-4 w-4 text-purple-500" />,
  // Uppercase statuses (backend compatibility)
  PENDING: <Clock className="h-4 w-4 text-yellow-500" />,
  PROCESSING: <Package className="h-4 w-4 text-blue-500" />,
  SHIPPED: <Truck className="h-4 w-4 text-purple-500" />,
  DELIVERED: <Check className="h-4 w-4 text-green-500" />,
  CANCELLED: <X className="h-4 w-4 text-red-500" />,
  CONFIRMED: <Check className="h-4 w-4 text-green-500" />,
  CREATED: <Clock className="h-4 w-4 text-gray-500" />,
  PAID: <Check className="h-4 w-4 text-green-500" />,
  FAILED: <X className="h-4 w-4 text-red-500" />,
  REFUNDED: <X className="h-4 w-4 text-purple-500" />,
};

const statusColors: Record<string, string> = {
  // Lowercase statuses
  pending: "bg-yellow-100 text-yellow-800",
  processing: "bg-blue-100 text-blue-800",
  shipped: "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
  confirmed: "bg-green-100 text-green-800",
  created: "bg-gray-100 text-gray-800",
  paid: "bg-green-100 text-green-800",
  failed: "bg-red-100 text-red-800",
  refunded: "bg-purple-100 text-purple-800",
  // Uppercase statuses (backend compatibility)
  PENDING: "bg-yellow-100 text-yellow-800",
  PROCESSING: "bg-blue-100 text-blue-800",
  SHIPPED: "bg-purple-100 text-purple-800",
  DELIVERED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
  CONFIRMED: "bg-green-100 text-green-800",
  CREATED: "bg-gray-100 text-gray-800",
  PAID: "bg-green-100 text-green-800",
  FAILED: "bg-red-100 text-red-800",
  REFUNDED: "bg-purple-100 text-purple-800",
};

// statusLabels removed (localized through t)

export default function AdminOrdersPage() {
  const { t, locale } = useI18n();
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
  // Refund state
  const [showRefundDialog, setShowRefundDialog] = useState(false);
  const [selectedOrderForRefund, setSelectedOrderForRefund] = useState<Order | null>(null);
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

      // Normalize to ensure user, items and total_amount are present
      type RawOrderItem = Partial<import("@/types").OrderItem> & {
        unit_price?: number;
        quantity?: number;
        total_price?: number;
      };
      type RawOrder = Partial<Order> & {
        order_items?: RawOrderItem[];
        items?: RawOrderItem[];
        user?: import("@/types").User;
        customer?: import("@/types").User;
        total_amount?: number;
        user_name?: string;
      };

      const normalizedOrders: Order[] = (Array.isArray(ordersData) ? ordersData : [])
        .map((rawUnknown) => rawUnknown as RawOrder)
        .map((raw) => {
          const rawItems: RawOrderItem[] = Array.isArray(raw.items)
            ? raw.items
            : Array.isArray(raw.order_items)
              ? raw.order_items
              : [];

          const computedTotal = typeof raw.total_amount === "number" && !Number.isNaN(raw.total_amount)
            ? raw.total_amount
            : rawItems.reduce((sum, it) => {
                const unit = Number(it.unit_price ?? 0);
                const qty = Number(it.quantity ?? 0);
                const line = typeof it.total_price === "number" ? it.total_price : unit * qty;
                return sum + (Number.isFinite(line) ? line : 0);
              }, 0);

          const user = raw.user ?? raw.customer ?? (raw.user_name
            ? {
                id: undefined,
                name: String(raw.user_name || ""),
                surname: "",
                phone_number: "",
                is_admin: false,
              }
            : undefined);

          return {
            ...(raw as Order),
            user,
            items: ((rawItems as import("@/types").OrderItem[]) ?? []),
            total_amount: computedTotal,
          } as Order;
        });
      // Directly use normalized list without per-order hydration (avoid CORS/500)
      setOrders(normalizedOrders);
      const paginationData = data as {
        total?: number;
        pages?: number;
        total_pages?: number;
      };
      // If API doesn't provide total, use the actual orders count
      const actualTotal = paginationData?.total ?? normalizedOrders.length;
      setPagination({
        total: actualTotal,
        page:
          Math.floor(
            (filters.skip || 0) / (filters.limit || PAGINATION.DEFAULT_LIMIT)
          ) + 1,
        limit: Number(filters.limit || PAGINATION.DEFAULT_LIMIT),
        totalPages:
          paginationData?.pages ||
          paginationData?.total_pages ||
          Math.ceil(
            actualTotal / (filters.limit || PAGINATION.DEFAULT_LIMIT)
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

  // Search effect removed

  const handlePageChange = useCallback(
    (page: number) => {
      const skip = (page - 1) * pagination.limit;
      setFilters((prev) => ({ ...prev, skip }));
    },
    [pagination.limit]
  );

  // Refund handling functions
  const handleRefundClick = useCallback((order: Order) => {
    if (!AdminRefundService.canOrderBeRefunded(order.status)) {
      toast.error(t('admin.orders.toasts.refundNotAllowed'));
      return;
    }
    setSelectedOrderForRefund(order);
    setShowRefundDialog(true);
  }, [t]);

  const handleRefundConfirm = useCallback(async (orderId: number) => {
    if (!selectedOrderForRefund) return;

    try {
      console.log('Processing refund for order ID:', orderId);

      const result = await AdminRefundService.processRefund({
        order_id: orderId
      });

      if (result.success) {
        // Enhanced success message with order details
        toast.success(t('admin.orders.toasts.refundSuccess'));
        // Refresh orders to update status
        fetchOrders();
        // Close the dialog
        setShowRefundDialog(false);
        setSelectedOrderForRefund(null);
      } else {
        console.error('Refund failed:', result);
        toast.error(result.message || t('admin.orders.toasts.refundError'));
      }
    } catch (error) {
      console.error('Refund processing error:', error);
      toast.error(t('admin.orders.toasts.refundError'));
    }
  }, [selectedOrderForRefund, t, fetchOrders]);

  const handleRefundCancel = useCallback(() => {
    setShowRefundDialog(false);
    setSelectedOrderForRefund(null);
  }, []);

  // Status change dropdown removed from UI; handler not needed

  const renderPagination = () => {
    if (pagination.totalPages <= 1) return null;

    return (
      <div className="mt-6 bg-white rounded-lg shadow-sm border p-4">
        {/* Mobile/Tablet Pagination */}
        <div className="xl:hidden">
          <div className="text-sm text-gray-600 text-center mb-4">
            {t('admin.products.pagination.shown', { count: orders.length.toString(), total: pagination.total.toString() })}
          </div>
          <div className="flex justify-between items-center">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1 || isLoading}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 hover:border-gray-400 rounded-lg shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] focus:ring-2 focus:ring-gray-300 focus:ring-offset-1"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Previous</span>
              <span className="sm:hidden">Prev</span>
            </button>
            
            <span className="text-sm text-gray-700">
              <span className="hidden sm:inline">Page {pagination.page} of {pagination.totalPages}</span>
              <span className="sm:hidden">{pagination.page}/{pagination.totalPages}</span>
            </span>
            
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages || isLoading}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 hover:border-gray-400 rounded-lg shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] focus:ring-2 focus:ring-gray-300 focus:ring-offset-1"
            >
              <span className="hidden sm:inline">Next</span>
              <span className="sm:hidden">Next</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Desktop Pagination */}
        <div className="hidden xl:flex justify-between items-center">
          <div className="text-sm text-gray-600">
            {t('admin.products.pagination.shown', { count: orders.length.toString(), total: pagination.total.toString() })}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1 || isLoading}
              className="p-3 rounded-lg border border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.05] active:scale-[0.95] focus:ring-2 focus:ring-gray-300 focus:ring-offset-1"
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
                      className={`px-4 py-2 rounded-lg border font-medium text-sm shadow-sm transition-all duration-200 transform hover:scale-[1.05] active:scale-[0.95] focus:ring-2 focus:ring-offset-1 ${
                        pagination.page === pageNumber
                          ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white border-blue-500 shadow-md focus:ring-blue-300"
                          : "bg-white border-gray-300 hover:border-gray-400 text-gray-700 hover:bg-gray-50 hover:shadow-md focus:ring-gray-300"
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
              className="p-3 rounded-lg border border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.05] active:scale-[0.95] focus:ring-2 focus:ring-gray-300 focus:ring-offset-1"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{t('admin.orders.title')}</h1>
            <p className="text-gray-600 mt-2 text-sm sm:text-base">{t('admin.orders.subtitle')}</p>
          </div>
        </div>

        {/* Info bar */}
        <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border">
          <div className="flex flex-col sm:flex-row sm:justify-between space-y-2 sm:space-y-0 text-sm text-gray-600">
            <span>{t('admin.orders.info.orders', { total: pagination.total.toString() })}</span>
            {pagination.total > 0 && (
              <span className="text-xs sm:text-sm">{t('admin.orders.info.page', { page: pagination.page.toString(), pages: pagination.totalPages.toString() })}</span>
            )}
          </div>
        </div>

        {/* Orders Table/Cards */}
        <div className="bg-white rounded-lg shadow-sm border">
          {isLoading ? (
            <TableSkeleton />
          ) : orders.length > 0 ? (
            <>
              {/* Desktop Table */}
              <div className="hidden xl:block overflow-x-auto">
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
                        {t('admin.orders.table.date')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
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
                            {order.user?.name || (order as unknown as { user_name?: string }).user_name || t('admin.orders.unspecifiedUser')}{" "}
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
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(order.created_at, locale)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {AdminRefundService.canOrderBeRefunded(order.status) ? (
                            <button
                              onClick={() => handleRefundClick(order)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 hover:border-red-300 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                              title={t('admin.orders.actions.adminRefund')}
                            >
                              <RefreshCcw className="h-3 w-3" />
                              {t('admin.orders.actions.adminRefund')}
                            </button>
                          ) : (
                            <span className="text-xs text-gray-400">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Tablet/Mobile Cards */}
              <div className="xl:hidden divide-y divide-gray-900">
                {orders.map((order) => (
                  <div key={order.id} className="p-4 lg:p-6 hover:bg-gray-50 transition-colors">
                    {/* Order Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-sm lg:text-base font-medium text-gray-900">
                        #{order.id}
                      </div>
                      <span
                        className={`inline-flex items-center px-2 py-1 text-xs lg:text-sm font-semibold rounded-full ${
                          statusColors[order.status]
                        }`}
                      >
                        {statusIcons[order.status]}
                        <span className="ml-1">
                          {t(`admin.orders.status.${order.status}`)}
                        </span>
                      </span>
                    </div>

                    {/* Customer Info */}
                    <div className="mb-4">
                      <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                        {t('admin.orders.table.client')}
                      </div>
                      <div className="text-sm lg:text-base text-gray-900">
                        {order.user?.name || (order as unknown as { user_name?: string }).user_name || t('admin.orders.unspecifiedUser')}{" "}
                        {order.user?.surname || ""}
                      </div>
                      {order.user?.phone_number && (
                        <div className="text-sm text-gray-500">
                          {order.user.phone_number}
                        </div>
                      )}
                    </div>

                    {/* Order Details Grid - Better for tablet screens */}
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 text-sm lg:text-base">
                      <div>
                        <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                          {t('admin.orders.table.items')}
                        </div>
                        <div className="text-gray-900">
                          {t('admin.orders.itemsCount', { count: (order.items?.length || 0).toString() })}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                          {t('admin.orders.table.amount')}
                        </div>
                        <div className="font-medium text-gray-900">
                          {formatPrice(order.total_amount)}
                        </div>
                      </div>
                      <div className="lg:block hidden">
                        <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                          {t('admin.orders.table.date')}
                        </div>
                        <div className="text-gray-500">
                          {formatDate(order.created_at, locale)}
                        </div>
                      </div>
                    </div>

                    {/* Date for mobile only */}
                    <div className="mt-3 pt-3 lg:hidden">
                      <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                        {t('admin.orders.table.date')}
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatDate(order.created_at, locale)}
                      </div>
                    </div>

                    {/* Action buttons */}
                    {AdminRefundService.canOrderBeRefunded(order.status) && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <button
                          onClick={() => handleRefundClick(order)}
                          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 hover:border-red-300 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                        >
                          <RefreshCcw className="h-4 w-4" />
                          {t('admin.orders.actions.adminRefund')}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
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

      {/* Refund Confirmation Dialog */}
      <RefundConfirmDialog
        isOpen={showRefundDialog}
        order={selectedOrderForRefund}
        onConfirm={handleRefundConfirm}
        onCancel={handleRefundCancel}
      />
    </AdminLayout>
  );
}
