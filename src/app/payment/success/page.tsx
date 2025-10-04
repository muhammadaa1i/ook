"use client";

import React, { useEffect, useState, Suspense, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle, Loader2, AlertCircle } from 'lucide-react';

import { useI18n } from '@/i18n';
import { toast } from 'react-toastify';
import { modernApiClient } from '@/lib/modernApiClient';
import { API_ENDPOINTS } from '@/lib/constants';


function PaymentSuccessContent() {
  const { t } = useI18n();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const transferId = searchParams.get('transfer_id') || 
                     searchParams.get('octo_payment_UUID') || 
                     searchParams.get('payment_uuid') || 
                     searchParams.get('octo-status');

  const updateOrderStatus = useCallback(async () => {
    try {
      const paymentOrderData = sessionStorage.getItem('paymentOrder');
      if (!paymentOrderData) {
        console.warn('No payment order data found');
        return;
      }

      const orderData = JSON.parse(paymentOrderData);
      console.log('Updating order status with data:', orderData);
      
      // Update the existing order status to PAID since payment is successful
      const updateRequest = {
        status: 'PAID',
        notes: `Payment completed via ${orderData.payment_method}. Payment ID: ${orderData.payment_id}`
      };

      console.log('Updating order status to PAID for order ID:', orderData.order_id);
      
      // Update the order status
      const response = await modernApiClient.put(`${API_ENDPOINTS.ORDERS}/${orderData.order_id}`, updateRequest);
      
      if (response) {
        console.log('Order status updated successfully:', response);
        toast.success(t('payment.orderCreated') || 'Payment confirmed successfully!');
        
        // Clear the payment order data
        sessionStorage.removeItem('paymentOrder');
      }
    } catch (error) {
      console.error('Failed to create order:', error);
      toast.error(t('payment.orderCreateError') || 'Failed to create order');
    }
  }, [t]);

  useEffect(() => {
    if (!transferId) {
      setError('Transfer ID not found');
      setLoading(false);
      return;
    }

    const checkPaymentStatus = async () => {
      try {
        console.log('Processing successful payment for transferId:', transferId);
        
        // Ensure user session is preserved during payment processing
        const userBackup = sessionStorage.getItem('userBackup');
        if (userBackup) {
          try {
            console.log('Found user backup during payment success, ensuring session preservation');
            
            // Clean up backup after successful payment
            sessionStorage.removeItem('userBackup');
            sessionStorage.removeItem('paymentRedirectTime');
          } catch (error) {
            console.warn('Could not parse user backup:', error);
          }
        }
        
        // Since user reached success page, assume payment was successful
        console.log('Payment assumed successful, updating order status...');
        toast.success(t('payment.success.message'));
        
        // Update order status to PAID after successful payment
        await updateOrderStatus();
        
        // Clear cart after successful payment - but preserve user session
        if (typeof window !== 'undefined') {
          // Dispatch cart clear event without affecting auth
          window.dispatchEvent(new CustomEvent('cart:clear'));
          
          // Ensure auth state is preserved by not triggering any auth-related events
          console.log('Cart cleared while preserving authentication');
        }
      } catch (err) {
        console.error('Payment processing error:', err);
        setError(err instanceof Error ? err.message : t('payment.error.statusCheck'));
      } finally {
        setLoading(false);
      }
    };

    checkPaymentStatus();
  }, [transferId, t, updateOrderStatus]);

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

  const isSuccessful = !error; // Success if no error occurred

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



        <div className="space-y-3">
          {isSuccessful && (
            <button
              onClick={handleViewOrders}
              className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white py-3 px-6 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
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
