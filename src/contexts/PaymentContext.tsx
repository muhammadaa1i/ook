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

  const checkPaymentStatus = useCallback(async (transferId: string): Promise<PaymentStatus | null> => {
    if (isProcessing) return null;
    
    setIsProcessing(true);
    try {
      const status = await PaymentService.getPaymentStatus(transferId);
      setCurrentPayment(status);
      return status;
    } catch (error) {
      console.error('Payment status check failed:', error);
      toast.error(t('payment.error.statusCheck'));
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing]);

  const cancelPayment = useCallback(async (transferId: string): Promise<boolean> => {
    if (isProcessing) return false;
    
    setIsProcessing(true);
    try {
      const result = await PaymentService.cancelPayment(transferId);
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
  }, [isProcessing]);

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
