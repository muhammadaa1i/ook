"use client";

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { XCircle, Loader2, RefreshCw } from 'lucide-react';
import { PaymentService, PaymentStatus } from '@/services/paymentService';
import { useI18n } from '@/i18n';
import { API_ENDPOINTS } from '@/lib/constants';
import modernApiClient from '@/lib/modernApiClient';

function PaymentFailureContent() {
  const { t } = useI18n();
  const searchParams = useSearchParams();
  const backendOrderId = searchParams?.get('backend_order_id');
  const router = useRouter();
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const transferId = searchParams.get('transfer_id');

  useEffect(() => {
    if (!transferId) {
      setLoading(false);
      return;
    }

    const checkPaymentStatus = async () => {
      try {
        const status = await PaymentService.getPaymentStatus(transferId);
        setPaymentStatus(status);
        
        // Update backend order if backend_order_id is provided
        if (backendOrderId) {
          try {
            try {
              await modernApiClient.patch(API_ENDPOINTS.ORDER_BY_ID(parseInt(backendOrderId)), {
                payment_status: status.cancelled ? 'cancelled' : 'failed'
              });
            } catch (patchError) {
              console.log('PATCH failed, trying PUT:', patchError);
              await modernApiClient.put(API_ENDPOINTS.ORDER_BY_ID(parseInt(backendOrderId)), {
                payment_status: status.cancelled ? 'cancelled' : 'failed'
              });
            }
          } catch (error) {
            console.error('Failed to update order payment status:', error);
          }
        }
      } catch (err) {
        console.error('Failed to check payment status:', err);
      } finally {
        setLoading(false);
      }
    };

    checkPaymentStatus();
  }, [transferId]);

  const handleRetry = () => {
    router.push('/cart');
  };

  const handleContinueShopping = () => {
    router.push('/catalog');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-16 w-16 animate-spin text-blue-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {t('payment.checking')}
          </h2>
          <p className="text-gray-600">{t('payment.pleaseWait')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md mx-auto text-center bg-white p-8 rounded-lg shadow-md">
        <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
        
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          {t('payment.failure.title')}
        </h2>
        
        <p className="text-gray-600 mb-4">
          {t('payment.failure.message')}
        </p>

        {paymentStatus && (
          <div className="bg-red-50 p-4 rounded-lg mb-6 text-left">
            <div className="text-sm">
              <p><strong>{t('payment.orderId')}:</strong> {paymentStatus.order_id}</p>
              <p><strong>{t('payment.amount')}:</strong> {paymentStatus.amount.toLocaleString()} {t('common.currencySom')}</p>
              <p><strong>{t('payment.status')}:</strong> 
                <span className="ml-2 px-2 py-1 rounded text-xs bg-red-100 text-red-800">
                  {paymentStatus.status}
                </span>
              </p>
            </div>
          </div>
        )}

        <div className="space-y-3">
          <button
            onClick={handleRetry}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            {t('payment.retry')}
          </button>
          <button
            onClick={handleContinueShopping}
            className="w-full bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors"
          >
            {t('payment.continueShopping')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PaymentFailurePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-16 w-16 animate-spin text-blue-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading...</h2>
          <p className="text-gray-600">Please wait</p>
        </div>
      </div>
    }>
      <PaymentFailureContent />
    </Suspense>
  );
}
