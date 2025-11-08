"use client";

import React, { createContext, useContext, useState, useCallback } from 'react';
import { PaymentService, PaymentStatus } from '@/services/paymentService';
import { toast } from 'react-toastify';
import { useI18n } from '@/i18n';

interface PaymentContextType {
  currentPayment: PaymentStatus | null;
  isProcessing: boolean;
  checkPaymentStatus: (transferId: string) => Promise<PaymentStatus | null>;
  cancelPayment: (transferId: string) => Promise<boolean>;
  clearPaymentState: () => void;
}

const PaymentContext = createContext<PaymentContextType | undefined>(undefined);

export function PaymentProvider({ children }: { children: React.ReactNode }) {
  const [currentPayment, setCurrentPayment] = useState<PaymentStatus | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { t } = useI18n();

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const checkPaymentStatus = useCallback(async (transferId: string): Promise<PaymentStatus | null> => {
    if (isProcessing) return null;
    
    setIsProcessing(true);
    try {
      // Payment status checking not implemented yet

      toast.info(t('payment.statusCheckNotAvailable') || 'Payment status checking not available');
      return null;
    } catch (error) {
      console.error('Payment status check failed:', error);
      toast.error(t('payment.error.statusCheck'));
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing, t]);

  const cancelPayment = useCallback(async (transferId: string): Promise<boolean> => {
    if (isProcessing) return false;
  
    setIsProcessing(true);
    try {
      const result = await PaymentService.refundPayment({ octo_payment_UUID: transferId, reason: 'Payment cancelled' });
      setCurrentPayment(result);
      toast.success(t('payment.success.title'));
      return true;
    } catch (error) {
      console.error('Payment cancellation failed:', error);
      toast.error(t('payment.error.failed'));
      return false;
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing, t]);

  const clearPaymentState = useCallback(() => {
    setCurrentPayment(null);
  }, []);

  const value: PaymentContextType = {
    currentPayment,
    isProcessing,
    checkPaymentStatus,
    cancelPayment,
    clearPaymentState,
  };

  return (
    <PaymentContext.Provider value={value}>
      {children}
    </PaymentContext.Provider>
  );
}

export function usePayment() {
  const context = useContext(PaymentContext);
  if (context === undefined) {
    throw new Error('usePayment must be used within a PaymentProvider');
  }
  return context;
}
