"use client";

import { useState, useEffect, useCallback } from 'react';
import { PaymentService, PaymentStatus } from '@/services/paymentService';
import { API_ENDPOINTS } from '@/lib/constants';
import modernApiClient from '@/lib/modernApiClient';

interface PaymentStatusHookReturn {
  checkPaymentStatus: (transferId: string, orderId: number) => Promise<void>;
  isChecking: boolean;
  error: string | null;
}

export function usePaymentStatus(): PaymentStatusHookReturn {
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkPaymentStatus = useCallback(async (transferId: string, orderId: number) => {
    if (!transferId || isChecking) return;

    setIsChecking(true);
    setError(null);

    try {
      // Get payment status from payment gateway
      const paymentStatus = await PaymentService.getPaymentStatus(transferId);
      
      // Map payment status to our internal status
      const mappedStatus = mapPaymentStatus(paymentStatus);
      
      // Update order with payment status - try PATCH first, then PUT
      try {
        await modernApiClient.patch(API_ENDPOINTS.ORDER_BY_ID(orderId), {
          payment_status: mappedStatus
        });
      } catch (patchError) {
        console.log('PATCH failed, trying PUT:', patchError);
        await modernApiClient.put(API_ENDPOINTS.ORDER_BY_ID(orderId), {
          payment_status: mappedStatus
        });
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to check payment status';
      setError(errorMessage);
      console.error('Payment status check failed:', err);
    } finally {
      setIsChecking(false);
    }
  }, [isChecking]);

  return {
    checkPaymentStatus,
    isChecking,
    error
  };
}

function mapPaymentStatus(paymentStatus: PaymentStatus): string {
  if (paymentStatus.status === 'success') {
    return 'success';
  } else if (paymentStatus.cancelled) {
    return 'cancelled';
  } else if (paymentStatus.status === 'failed') {
    return 'failed';
  } else {
    return 'pending';
  }
}

// Hook for bulk payment status checking
export function useBulkPaymentStatus() {
  const [isChecking, setIsChecking] = useState(false);
  const [checkedCount, setCheckedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  const checkMultiplePaymentStatuses = useCallback(async (orders: Array<{id: number, transfer_id?: string}>) => {
    const ordersWithTransferId = orders.filter(order => order.transfer_id);
    
    if (ordersWithTransferId.length === 0) return;

    setIsChecking(true);
    setCheckedCount(0);
    setTotalCount(ordersWithTransferId.length);

    for (const order of ordersWithTransferId) {
      try {
        const paymentStatus = await PaymentService.getPaymentStatus(order.transfer_id!);
        const mappedStatus = mapPaymentStatus(paymentStatus);
        
        try {
          await modernApiClient.patch(API_ENDPOINTS.ORDER_BY_ID(order.id), {
            payment_status: mappedStatus
          });
        } catch (patchError) {
          console.log('PATCH failed, trying PUT for order', order.id, ':', patchError);
          await modernApiClient.put(API_ENDPOINTS.ORDER_BY_ID(order.id), {
            payment_status: mappedStatus
          });
        }

        setCheckedCount(prev => prev + 1);
      } catch (error) {
        console.error(`Failed to check payment status for order ${order.id}:`, error);
        setCheckedCount(prev => prev + 1);
      }
    }

    setIsChecking(false);
  }, []);

  return {
    checkMultiplePaymentStatuses,
    isChecking,
    checkedCount,
    totalCount,
    progress: totalCount > 0 ? (checkedCount / totalCount) * 100 : 0
  };
}