"use client";

import React from 'react';
import { XCircle, DollarSign, Package, AlertTriangle } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { useI18n } from '@/i18n';
import { Order } from '@/types';

interface RefundConfirmDialogProps {
  isOpen: boolean;
  order: Order | null;
  onConfirm: () => void;
  onCancel: () => void;
  isProcessing?: boolean;
}

export const RefundConfirmDialog: React.FC<RefundConfirmDialogProps> = ({
  isOpen,
  order,
  onConfirm,
  onCancel,
  isProcessing = false
}) => {
  const { t } = useI18n();

  if (!isOpen || !order) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
      onClick={(e) => e.target === e.currentTarget && !isProcessing && onCancel()}
    >
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-full">
                <DollarSign className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">
                  {t('orders.refund.confirmTitle')}
                </h3>
                <p className="text-red-100 text-sm">
                  {t('orders.refund.confirmSubtitle') || 'Process refund request'}
                </p>
              </div>
            </div>
            {!isProcessing && (
              <button
                onClick={onCancel}
                className="p-1 hover:bg-white/20 rounded-full transition-colors"
              >
                <XCircle className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Warning Message */}
          <div className="flex items-start gap-3 mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-amber-800">
              <p className="font-medium mb-1">
                {t('orders.refund.warningTitle') || 'Important Notice'}
              </p>
              <p>
                {t('orders.refund.confirmMessage')}
              </p>
            </div>
          </div>

          {/* Order Details */}
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Package className="h-4 w-4" />
                {t('orders.refund.orderDetails') || 'Order Details'}
              </h4>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">
                    {t('orders.refund.orderNumber')}:
                  </span>
                  <span className="font-medium">#{order.id}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">
                    {t('orders.refund.itemCount') || 'Items'}:
                  </span>
                  <span className="font-medium">
                    {order.items.length} {t('common.items')}
                  </span>
                </div>
                
                <div className="flex justify-between pt-2 border-t border-gray-200">
                  <span className="text-gray-900 font-semibold">
                    {t('orders.refund.refundAmount') || 'Refund Amount'}:
                  </span>
                  <span className="font-bold text-lg text-red-600">
                    {formatPrice(order.total_amount)}
                  </span>
                </div>
              </div>
            </div>

            {/* Processing Notice */}
            <div className="text-center text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
              <p>
                {t('orders.refund.processingNotice') || 'Refund will be processed within 24-48 hours'}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-5 flex gap-4 border-t border-gray-200">
          <button
            onClick={onCancel}
            disabled={isProcessing}
            className="flex-1 px-5 py-3 text-gray-700 bg-white hover:bg-gray-50 border-2 border-gray-300 hover:border-gray-400 rounded-xl font-medium shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] focus:ring-2 focus:ring-gray-300 focus:ring-offset-2"
          >
            {t('common.cancel')}
          </button>
          
          <button
            onClick={onConfirm}
            disabled={isProcessing}
            className="flex-1 px-5 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-xl font-medium shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] focus:ring-2 focus:ring-red-500 focus:ring-offset-2 flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span className="font-medium">{t('orders.refund.requesting')}</span>
              </>
            ) : (
              <>
                <DollarSign className="h-5 w-5" />
                <span className="font-medium">{t('orders.refund.confirmButton') || 'Confirm Refund'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
