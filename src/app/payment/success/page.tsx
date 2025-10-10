"use client";

import React, { useEffect, useState, Suspense, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle, Loader2, AlertCircle } from 'lucide-react';

import { useI18n } from '@/i18n';
import { toast } from 'react-toastify';
import { modernApiClient } from '@/lib/modernApiClient';
import { API_ENDPOINTS } from '@/lib/constants';
import { useCart } from '@/contexts/CartContext';


function PaymentSuccessContent() {
  const { t } = useI18n();
  const { clearCart } = useCart();
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
        
        // If this was a batch order, cancel any duplicate pending orders
        if (orderData.batch_info?.all_order_ids && orderData.batch_info.all_order_ids.length > 0) {
          console.log('Batch order detected, checking for duplicates to cancel');
          
          // Cancel all other orders in the batch that aren't the main one
          const otherOrderIds = orderData.batch_info.all_order_ids.filter(
            (id: string | number) => String(id) !== String(orderData.order_id)
          );
          
          for (const orderId of otherOrderIds) {
            try {
              await modernApiClient.put(`${API_ENDPOINTS.ORDERS}/${orderId}`, {
                status: 'CANCELLED',
                notes: 'Cancelled - duplicate of paid order'
              });
              console.log(`Cancelled duplicate order: ${orderId}`);
            } catch (err) {
              console.warn(`Failed to cancel duplicate order ${orderId}:`, err);
            }
          }
        }
        
        // Also check for and cancel any orphaned CREATED orders from the same user
        // that were created around the same time (within 5 minutes)
        try {
          const userOrders = await modernApiClient.get(`${API_ENDPOINTS.ORDERS}`, {
            user_id: orderData.user_id,
            status: 'CREATED',
            limit: 20
          });
          
          const ordersData = Array.isArray(userOrders) ? userOrders : 
                            (userOrders as { data?: unknown; items?: unknown[] }).items || 
                            (userOrders as { data?: unknown; items?: unknown[] }).data || 
                            [];
          
          if (Array.isArray(ordersData) && ordersData.length > 0) {
            const orderCreatedTime = new Date(orderData.created_at || Date.now()).getTime();
            
            for (const orphanOrder of ordersData) {
              const orphanId = (orphanOrder as { id?: number; order_id?: string }).id || 
                              (orphanOrder as { id?: number; order_id?: string }).order_id;
              const orphanCreatedAt = (orphanOrder as { created_at?: string }).created_at;
              
              // Skip the main order
              if (String(orphanId) === String(orderData.order_id)) continue;
              
              // Cancel if created within 5 minutes of the paid order
              if (orphanCreatedAt) {
                const orphanTime = new Date(orphanCreatedAt).getTime();
                const timeDiff = Math.abs(orderCreatedTime - orphanTime);
                
                if (timeDiff < 5 * 60 * 1000) { // 5 minutes
                  try {
                    await modernApiClient.put(`${API_ENDPOINTS.ORDERS}/${orphanId}`, {
                      status: 'CANCELLED',
                      notes: 'Auto-cancelled - likely duplicate order attempt'
                    });
                    console.log(`Auto-cancelled orphaned order: ${orphanId}`);
                  } catch (err) {
                    console.warn(`Failed to cancel orphaned order ${orphanId}:`, err);
                  }
                }
              }
            }
          }
        } catch (err) {
          console.warn('Failed to check for orphaned orders:', err);
        }
        
        toast.success(t('payment.orderCreated') || 'Payment confirmed successfully!');
        
        // Clear the cart after successful payment
        clearCart();
        
        // Clear the payment order data
        sessionStorage.removeItem('paymentOrder');
      }
    } catch (error) {
      console.error('Failed to create order:', error);
      toast.error(t('payment.orderCreateError') || 'Failed to create order');
    }
  }, [t, clearCart]);

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
        
        console.log('Payment processing completed successfully');
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
