"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { PaymentCreateRequest, PaymentCreateResponse, PaymentStatusResponse, paymentService } from '@/services/paymentService';
import { toast } from 'react-toastify';

interface PaymentState {
  isProcessing: boolean;
  currentPayment: PaymentCreateResponse | null;
  paymentStatus: PaymentStatusResponse | null;
  error: string | null;
}

interface PaymentContextType extends PaymentState {
  createPayment: (data: PaymentCreateRequest) => Promise<PaymentCreateResponse | null>;
  checkPaymentStatus: (transferId: string) => Promise<PaymentStatusResponse | null>;
  cancelPayment: (transferId: string) => Promise<boolean>;
  clearPaymentState: () => void;
  startPaymentPolling: (transferId: string) => void;
  stopPaymentPolling: () => void;
}

const PaymentContext = createContext<PaymentContextType | undefined>(undefined);

interface PaymentProviderProps {
  children: ReactNode;
}

export function PaymentProvider({ children }: PaymentProviderProps) {
  const [state, setState] = useState<PaymentState>({
    isProcessing: false,
    currentPayment: null,
    paymentStatus: null,
    error: null,
  });

  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);

  const createPayment = useCallback(async (data: PaymentCreateRequest): Promise<PaymentCreateResponse | null> => {
    try {
      setState(prev => ({ ...prev, isProcessing: true, error: null }));
      
      const response = await paymentService.createPayment(data);
      
      setState(prev => ({ 
        ...prev, 
        currentPayment: response,
        isProcessing: false 
      }));
      
      toast.success('Payment created successfully');
      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create payment';
      setState(prev => ({ 
        ...prev, 
        error: errorMessage,
        isProcessing: false 
      }));
      toast.error(errorMessage);
      return null;
    }
  }, []);

  const checkPaymentStatus = useCallback(async (transferId: string): Promise<PaymentStatusResponse | null> => {
    try {
      const response = await paymentService.getPaymentStatus(transferId);
      
      setState(prev => ({ 
        ...prev, 
        paymentStatus: response,
        error: null 
      }));
      
      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to check payment status';
      setState(prev => ({ 
        ...prev, 
        error: errorMessage 
      }));
      toast.error(errorMessage);
      return null;
    }
  }, []);

  const cancelPayment = useCallback(async (transferId: string): Promise<boolean> => {
    try {
      setState(prev => ({ ...prev, isProcessing: true, error: null }));
      
      await paymentService.cancelPayment(transferId);
      
      setState(prev => ({ 
        ...prev, 
        isProcessing: false,
        currentPayment: null,
        paymentStatus: null 
      }));
      
      toast.success('Payment cancelled successfully');
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to cancel payment';
      setState(prev => ({ 
        ...prev, 
        error: errorMessage,
        isProcessing: false 
      }));
      toast.error(errorMessage);
      return false;
    }
  }, []);

  const clearPaymentState = useCallback(() => {
    setState({
      isProcessing: false,
      currentPayment: null,
      paymentStatus: null,
      error: null,
    });
  }, []);

  const startPaymentPolling = useCallback((transferId: string) => {
    // Clear existing polling
    if (pollingInterval) {
      clearInterval(pollingInterval);
    }

    const interval = setInterval(async () => {
      const status = await checkPaymentStatus(transferId);
      
      if (status && (status.status === 'completed' || status.status === 'failed' || status.status === 'cancelled')) {
        clearInterval(interval);
        setPollingInterval(null);
        
        if (status.status === 'completed') {
          toast.success('Payment completed successfully!');
        } else if (status.status === 'failed') {
          toast.error('Payment failed');
        } else if (status.status === 'cancelled') {
          toast.info('Payment was cancelled');
        }
      }
    }, 3000);

    setPollingInterval(interval);
  }, [checkPaymentStatus, pollingInterval]);

  const stopPaymentPolling = useCallback(() => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }
  }, [pollingInterval]);

  // Cleanup polling on unmount
  React.useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [pollingInterval]);

  const value: PaymentContextType = {
    ...state,
    createPayment,
    checkPaymentStatus,
    cancelPayment,
    clearPaymentState,
    startPaymentPolling,
    stopPaymentPolling,
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