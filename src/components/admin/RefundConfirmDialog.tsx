import React, { useState } from 'react';
import { Order } from '@/types';
import { formatPrice } from '@/lib/utils';
import { useI18n } from '@/i18n';
import { X, AlertCircle, CheckCircle } from 'lucide-react';

interface RefundConfirmDialogProps {
  isOpen: boolean;
  order: Order | null;
  onConfirm: (orderId: number) => Promise<void>;
  onCancel: () => void;
}

export default function RefundConfirmDialog({
  isOpen,
  order,
  onConfirm,
  onCancel
}: RefundConfirmDialogProps) {
  const { t } = useI18n();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleConfirm = async () => {
    if (!order || isProcessing) return;
    
    try {
      setIsProcessing(true);
      console.log('Processing refund for order ID:', order.id);
      await onConfirm(order.id);
      
      // Show success state briefly before closing
      setIsSuccess(true);
      setTimeout(() => {
        onCancel(); // Close dialog after showing success
      }, 1500);
    } catch {
      // Error handling is done in parent component
      setIsProcessing(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onCancel();
    }
  };

  if (!isOpen || !order) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${isSuccess ? 'bg-green-100' : 'bg-red-100'}`}>
              {isSuccess ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600" />
              )}
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              {isSuccess 
                ? t('admin.orders.refundConfirm.successTitle') 
                : t('admin.orders.refundConfirm.title')
              }
            </h3>
          </div>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            disabled={isProcessing || isSuccess}
          >
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {isSuccess ? (
            <div className="text-center space-y-3">
              <div className="text-green-600 font-medium">
                {t('admin.orders.refundConfirm.successMessage', { amount: formatPrice(order.total_amount) })}
              </div>
              <div className="text-sm text-gray-600">
                {t('admin.orders.refundConfirm.processingMessage', { orderId: order.id })}
              </div>
            </div>
          ) : (
            <>
              <p className="text-gray-600">
                {t('admin.orders.refundConfirm.message')}
              </p>

              {/* Order Info */}
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">{t('admin.orders.refundConfirm.orderIdLabel')}</span>
                  <span className="text-sm font-medium">#{order.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">{t('admin.orders.refundConfirm.customerLabel')}</span>
                  <span className="text-sm font-medium">
                    {order.user?.name} {order.user?.surname}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">{t('admin.orders.refundConfirm.originalAmountLabel')}</span>
                  <span className="text-sm font-medium">{formatPrice(order.total_amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">{t('admin.orders.refundConfirm.statusLabel')}</span>
                  <span className="text-sm font-medium">{t(`admin.orders.status.${order.status}`)}</span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 p-6 bg-gray-50 rounded-b-lg">
          {!isSuccess && (
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isProcessing}
            >
              {t('admin.orders.refundConfirm.cancel')}
            </button>
          )}
          <button
            onClick={isSuccess ? onCancel : handleConfirm}
            className={`${isSuccess ? 'w-full' : 'flex-1'} px-4 py-2 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
              isSuccess 
                ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500' 
                : 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
            }`}
            disabled={isProcessing && !isSuccess}
          >
            {isSuccess ? (
              <div className="flex items-center justify-center gap-2">
                <CheckCircle className="h-4 w-4" />
                {t('admin.orders.refundConfirm.close')}
              </div>
            ) : isProcessing ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {t('admin.orders.refundConfirm.processing')}
              </div>
            ) : (
              t('admin.orders.refundConfirm.confirm')
            )}
          </button>
        </div>
      </div>
    </div>
  );
}