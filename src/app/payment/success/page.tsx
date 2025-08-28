"use client";

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { PaymentService, PaymentStatus } from '@/services/paymentService';
import { useI18n } from '@/i18n';
import { toast } from 'react-toastify';
import { API_ENDPOINTS } from '@/lib/constants';
import modernApiClient from '@/lib/modernApiClient';

function PaymentSuccessContent() {
  const { t } = useI18n();
  const searchParams = useSearchParams();
  const backendOrderId = searchParams?.get('backend_order_id');
  const router = useRouter();
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const transferId = searchParams.get('transfer_id');

  useEffect(() => {
    if (!transferId) {
      setError('Transfer ID not found');
      setLoading(false);
      return;
    }

    const checkPaymentStatus = async () => {
      try {
        const status = await PaymentService.getPaymentStatus(transferId);
        setPaymentStatus(status);
        
        if (status.status === 'completed' || status.status === 'success') {
          toast.success(t('payment.success.message'));
          
          // Update backend order if backend_order_id is provided
          if (backendOrderId) {
            try {
              try {
                await modernApiClient.patch(API_ENDPOINTS.ORDER_BY_ID(parseInt(backendOrderId)), {
                  payment_status: 'success'
                });
              } catch (patchError) {
                console.log('PATCH failed, trying PUT:', patchError);
                await modernApiClient.put(API_ENDPOINTS.ORDER_BY_ID(parseInt(backendOrderId)), {
                  payment_status: 'success'
                });
              }
            } catch (error) {
              console.error('Failed to update order payment status:', error);
            }
          }
          
          // Clear cart after successful payment
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('cart:clear'));
          }
        } else if (status.status === 'failed' || status.status === 'cancelled') {
          setError(t('payment.error.failed'));
          
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
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : t('payment.error.statusCheck'));
      } finally {
        setLoading(false);
      }
    };

    checkPaymentStatus();
  }, [transferId, t]);

  const handleContinueShopping = () => {
    router.push('/catalog');
  };

  const handleViewOrders = () => {
    router.push('/orders');
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

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center bg-white p-8 rounded-lg shadow-md">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {t('payment.error.title')}
          </h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={handleContinueShopping}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
          >
            {t('payment.continueShopping')}
          </button>
        </div>
      </div>
    );
  }

  const isSuccessful = paymentStatus?.status === 'completed' || paymentStatus?.status === 'success';

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md mx-auto text-center bg-white p-8 rounded-lg shadow-md">
        {isSuccessful ? (
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
        ) : (
          <AlertCircle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
        )}
        
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          {isSuccessful ? t('payment.success.title') : t('payment.pending.title')}
        </h2>
        
        <p className="text-gray-600 mb-4">
          {isSuccessful ? t('payment.success.message') : t('payment.pending.message')}
        </p>

        {paymentStatus && (
          <div className="bg-gray-50 p-4 rounded-lg mb-6 text-left">
            <div className="text-sm">
              <p><strong>{t('payment.orderId')}:</strong> {paymentStatus.order_id}</p>
              <p><strong>{t('payment.amount')}:</strong> {paymentStatus.amount.toLocaleString()} {t('common.currencySom')}</p>
              <p><strong>{t('payment.status')}:</strong> 
                <span className={`ml-2 px-2 py-1 rounded text-xs ${
                  isSuccessful ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {paymentStatus.status}
                </span>
              </p>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {isSuccessful && (
            <button
              onClick={handleViewOrders}
              className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
            >
              {t('payment.viewOrders')}
            </button>
          )}
          <button
            onClick={handleContinueShopping}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
          >
            {t('payment.continueShopping')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
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
      <PaymentSuccessContent />
    </Suspense>
  );
}
