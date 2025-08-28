"use client";

import React, { useState, useEffect, useCallback } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { TableSkeleton } from "@/components/ui/skeleton";
import { PaymentService, PaymentStatus } from "@/services/paymentService";
import { toast } from "react-toastify";
import { 
  CreditCard, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle,
  RefreshCw,
  Eye,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { useI18n } from "@/i18n";

interface PaymentRecord extends PaymentStatus {
  id: string;
  created_at: string;
  updated_at: string;
}

const statusIcons = {
  success: <CheckCircle className="h-4 w-4 text-green-500" />,
  failed: <XCircle className="h-4 w-4 text-red-500" />,
  pending: <Clock className="h-4 w-4 text-yellow-500" />,
  cancelled: <XCircle className="h-4 w-4 text-gray-500" />,
  processing: <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />,
  expired: <AlertCircle className="h-4 w-4 text-orange-500" />,
};

const statusColors = {
  success: "bg-green-100 text-green-800",
  failed: "bg-red-100 text-red-800",
  pending: "bg-yellow-100 text-yellow-800",
  cancelled: "bg-gray-100 text-gray-800",
  processing: "bg-blue-100 text-blue-800",
  expired: "bg-orange-100 text-orange-800",
};

export default function AdminPaymentsPage() {
  const { t } = useI18n();
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 1,
  });
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [refreshing, setRefreshing] = useState<string | null>(null);

  // Mock data storage (in real app, this would come from backend)
  const [paymentStorage, setPaymentStorage] = useState<PaymentRecord[]>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('admin_payments');
      return stored ? JSON.parse(stored) : [];
    }
    return [];
  });

  const saveToStorage = useCallback((updatedPayments: PaymentRecord[]) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('admin_payments', JSON.stringify(updatedPayments));
    }
    setPaymentStorage(updatedPayments);
  }, []);

  const addPaymentRecord = useCallback((transferId: string, initialData: Partial<PaymentStatus>) => {
    const newPayment: PaymentRecord = {
      id: transferId,
      transfer_id: transferId,
      status: 'pending',
      amount: 0,
      order_id: '',
      description: '',
      expires_at: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...initialData,
    };

    const updated = [newPayment, ...paymentStorage];
    saveToStorage(updated);
    return newPayment;
  }, [paymentStorage, saveToStorage]);

  const updatePaymentRecord = useCallback((transferId: string, statusData: PaymentStatus) => {
    const updated = paymentStorage.map(payment => 
      payment.transfer_id === transferId 
        ? { ...payment, ...statusData, updated_at: new Date().toISOString() }
        : payment
    );
    saveToStorage(updated);
  }, [paymentStorage, saveToStorage]);

  const fetchPayments = useCallback(() => {
    setIsLoading(true);
    
    // Filter payments based on status
    let filteredPayments = paymentStorage;
    if (statusFilter !== "all") {
      filteredPayments = paymentStorage.filter(payment => payment.status === statusFilter);
    }

    // Apply pagination
    const startIndex = (pagination.page - 1) * pagination.limit;
    const endIndex = startIndex + pagination.limit;
    const paginatedPayments = filteredPayments.slice(startIndex, endIndex);

    setPayments(paginatedPayments);
    setPagination(prev => ({
      ...prev,
      total: filteredPayments.length,
      totalPages: Math.ceil(filteredPayments.length / prev.limit),
    }));

    setIsLoading(false);
  }, [paymentStorage, statusFilter, pagination.page, pagination.limit]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const handleRefreshStatus = async (transferId: string) => {
    try {
      setRefreshing(transferId);
      const statusData = await PaymentService.getPaymentStatus(transferId);
      updatePaymentRecord(transferId, statusData);
      toast.success(t('admin.payments.toasts.statusRefreshed') || 'Payment status refreshed');
    } catch (error) {
      console.error('Error refreshing payment status:', error);
      toast.error(t('admin.payments.toasts.refreshError') || 'Failed to refresh payment status');
    } finally {
      setRefreshing(null);
    }
  };

  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, page }));
  };

  const handleStatusFilterChange = (status: string) => {
    setStatusFilter(status);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const createTestPayment = () => {
    const testStatuses = ['pending', 'success', 'failed', 'processing', 'cancelled'];
    const randomStatus = testStatuses[Math.floor(Math.random() * testStatuses.length)];
    const transferId = `TEST_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const orderId = PaymentService.generateOrderId();
    const amount = Math.floor(Math.random() * 100000) + 10000; // Random amount between 100 and 1000

    const testPayment = addPaymentRecord(transferId, {
      transfer_id: transferId,
      status: randomStatus,
      amount,
      order_id: orderId,
      description: `Test payment for order ${orderId}`,
      expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutes from now
    });

    toast.success(`Test payment created: ${transferId} (${randomStatus})`);
    
    // If it's pending or processing, simulate status changes
    if (randomStatus === 'pending' || randomStatus === 'processing') {
      setTimeout(() => {
        const finalStatuses = ['success', 'failed', 'cancelled'];
        const finalStatus = finalStatuses[Math.floor(Math.random() * finalStatuses.length)];
        updatePaymentRecord(transferId, {
          ...testPayment,
          status: finalStatus,
        });
        toast.info(`Payment ${transferId} status updated to: ${finalStatus}`);
      }, 5000 + Math.random() * 15000); // Update after 5-20 seconds
    }
  };

  const renderPagination = () => {
    if (pagination.totalPages <= 1) return null;

    return (
      <div className="flex justify-between items-center mt-8">
        <div className="text-sm text-gray-600">
          {t('admin.payments.pagination.shown', { 
            count: payments.length.toString(), 
            total: pagination.total.toString() 
          }) || `Showing ${payments.length} of ${pagination.total} payments`}
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
            {Array.from({ length: Math.min(5, pagination.totalPages) }).map((_, i) => {
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
            })}
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

  // Expose functions globally for PaymentService to use
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).addPaymentRecord = addPaymentRecord;
      (window as any).updatePaymentRecord = updatePaymentRecord;
    }
  }, [addPaymentRecord, updatePaymentRecord]);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {t('admin.payments.title') || 'Payment Management'}
            </h1>
            <p className="text-gray-600 mt-2">
              {t('admin.payments.subtitle') || 'Monitor and manage payment transactions'}
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={fetchPayments}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span>{t('admin.payments.refresh') || 'Refresh'}</span>
            </button>
            <button
              onClick={() => createTestPayment()}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center space-x-2"
            >
              <CreditCard className="h-4 w-4" />
              <span>Create Test Payment</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">
                {t('admin.payments.filters.status') || 'Status:'}
              </label>
              <select
                value={statusFilter}
                onChange={(e) => handleStatusFilterChange(e.target.value)}
                className="border border-gray-300 rounded px-3 py-1 text-sm"
              >
                <option value="all">{t('admin.payments.filters.all') || 'All'}</option>
                <option value="success">{t('admin.payments.status.success') || 'Success'}</option>
                <option value="pending">{t('admin.payments.status.pending') || 'Pending'}</option>
                <option value="failed">{t('admin.payments.status.failed') || 'Failed'}</option>
                <option value="cancelled">{t('admin.payments.status.cancelled') || 'Cancelled'}</option>
                <option value="processing">{t('admin.payments.status.processing') || 'Processing'}</option>
                <option value="expired">{t('admin.payments.status.expired') || 'Expired'}</option>
              </select>
            </div>
            <div className="text-sm text-gray-600">
              {t('admin.payments.info.total', { total: pagination.total.toString() }) || 
               `${pagination.total} payments found`}
            </div>
          </div>
        </div>

        {/* Payments Table */}
        <div className="bg-white rounded-lg shadow-sm border">
          {isLoading ? (
            <TableSkeleton />
          ) : payments.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('admin.payments.table.transferId') || 'Transfer ID'}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('admin.payments.table.orderId') || 'Order ID'}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('admin.payments.table.amount') || 'Amount'}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('admin.payments.table.status') || 'Status'}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('admin.payments.table.description') || 'Description'}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('admin.payments.table.expiresAt') || 'Expires At'}
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('admin.payments.table.actions') || 'Actions'}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {payments.map((payment) => (
                    <tr key={payment.transfer_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {payment.transfer_id}
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(payment.created_at).toLocaleDateString("ru-RU")}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {payment.order_id || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {payment.amount ? formatPrice(payment.amount) : '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${
                            statusColors[payment.status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {statusIcons[payment.status as keyof typeof statusIcons] || 
                           <AlertCircle className="h-4 w-4 text-gray-500" />}
                          <span className="ml-1">
                            {t(`admin.payments.status.${payment.status}`) || payment.status}
                          </span>
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs truncate">
                          {payment.description || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {payment.expires_at ? 
                          new Date(payment.expires_at).toLocaleString("ru-RU") : 
                          '-'
                        }
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button 
                            className="text-blue-600 hover:text-blue-900"
                            title={t('admin.payments.actions.view') || 'View details'}
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleRefreshStatus(payment.transfer_id)}
                            disabled={refreshing === payment.transfer_id}
                            className="text-green-600 hover:text-green-900 disabled:opacity-50"
                            title={t('admin.payments.actions.refresh') || 'Refresh status'}
                          >
                            <RefreshCw className={`h-4 w-4 ${refreshing === payment.transfer_id ? 'animate-spin' : ''}`} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <CreditCard className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                {t('admin.payments.empty.title') || 'No payments found'}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {t('admin.payments.empty.subtitle') || 'Payment transactions will appear here once created.'}
              </p>
            </div>
          )}
        </div>

        {renderPagination()}
      </div>
    </AdminLayout>
  );
}