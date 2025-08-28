"use client";

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { XCircle, RefreshCw, Home, AlertTriangle, CreditCard } from 'lucide-react';
import { usePayment } from '@/contexts/PaymentContext';
import { PaymentStatusResponse } from '@/services/paymentService';

export default function PaymentFailurePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { checkPaymentStatus, clearPaymentState, cancelPayment } = usePayment();
  const [paymentDetails, setPaymentDetails] = useState<PaymentStatusResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);

  const transferId = searchParams.get('transfer_id');
  const reason = searchParams.get('reason') || 'unknown';

  const getFailureMessage = (reason: string, status?: string) => {
    switch (reason) {
      case 'payment_not_completed':
        return 'Платеж не был завершен';
      case 'status_check_failed':
        return 'Не удалось проверить статус платежа';
      case 'verification_error':
        return 'Ошибка при проверке платежа';
      case 'user_cancelled':
        return 'Платеж был отменен пользователем';
      case 'timeout':
        return 'Время ожидания платежа истекло';
      case 'insufficient_funds':
        return 'Недостаточно средств на счете';
      case 'card_declined':
        return 'Карта была отклонена';
      default:
        if (status === 'failed') {
          return 'Платеж не удался';
        } else if (status === 'cancelled') {
          return 'Платеж был отменен';
        }
        return 'Произошла ошибка при обработке платежа';
    }
  };

  const getFailureDescription = (reason: string, status?: string) => {
    switch (reason) {
      case 'payment_not_completed':
        return 'Платежная операция не была успешно завершена. Пожалуйста, попробуйте еще раз.';
      case 'status_check_failed':
        return 'Не удалось связаться с платежной системой для проверки статуса. Попробуйте позже.';
      case 'verification_error':
        return 'Произошла техническая ошибка при проверке платежа. Обратитесь в службу поддержки.';
      case 'user_cancelled':
        return 'Вы отменили платеж. Вы можете попробовать снова, когда будете готовы.';
      case 'timeout':
        return 'Время ожидания платежа истекло. Попробуйте совершить платеж заново.';
      case 'insufficient_funds':
        return 'На вашем счете недостаточно средств для совершения платежа.';
      case 'card_declined':
        return 'Ваша карта была отклонена банком. Проверьте данные карты или используйте другую карту.';
      default:
        if (status === 'failed') {
          return 'К сожалению, платеж не удался. Попробуйте еще раз или обратитесь в службу поддержки.';
        } else if (status === 'cancelled') {
          return 'Платеж был отменен. Вы можете попробовать снова в любое время.';
        }
        return 'Произошла неожиданная ошибка. Пожалуйста, попробуйте еще раз или обратитесь в службу поддержки.';
    }
  };

  useEffect(() => {
    const checkPayment = async () => {
      if (!transferId) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const status = await checkPaymentStatus(transferId);
        if (status) {
          setPaymentDetails(status);
          
          // If payment actually succeeded, redirect to success page
          if (status.status === 'completed') {
            router.push(`/payment/success?transfer_id=${transferId}`);
            return;
          }
        }
      } catch (error) {
        console.error('Error checking payment status:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkPayment();
  }, [transferId, checkPaymentStatus, router]);

  const handleCancelPayment = async () => {
    if (!transferId) return;
    
    setIsCancelling(true);
    try {
      const success = await cancelPayment(transferId);
      if (success) {
        // Refresh payment details after cancellation
        const status = await checkPaymentStatus(transferId);
        if (status) {
          setPaymentDetails(status);
        }
      }
    } catch (error) {
      console.error('Error cancelling payment:', error);
    } finally {
      setIsCancelling(false);
    }
  };

  const handleRetryPayment = () => {
    clearPaymentState();
    router.push('/cart');
  };

  const handleGoHome = () => {
    clearPaymentState();
    router.push('/');
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("ru-RU", {
      style: "currency",
      currency: "UZS",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ru-RU", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-red-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Проверяем статус платежа...
          </h2>
          <p className="text-gray-600">
            Пожалуйста, подождите
          </p>
        </div>
      </div>
    );
  }

  const currentStatus = paymentDetails?.status;
  const failureMessage = getFailureMessage(reason, currentStatus);
  const failureDescription = getFailureDescription(reason, currentStatus);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Failure Header */}
          <div className="bg-red-50 px-6 py-8 text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {failureMessage}
            </h1>
            <p className="text-gray-600">
              {failureDescription}
            </p>
          </div>

          {/* Payment Details */}
          {paymentDetails && (
            <div className="px-6 py-6 border-b">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Детали платежа
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">ID транзакции:</span>
                  <span className="font-mono text-sm text-gray-900">
                    {paymentDetails.transfer_id}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Номер заказа:</span>
                  <span className="text-gray-900 font-medium">
                    #{paymentDetails.order_id}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Сумма:</span>
                  <span className="text-gray-900 font-semibold">
                    {formatPrice(paymentDetails.amount)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Время попытки:</span>
                  <span className="text-gray-900">
                    {formatDate(paymentDetails.updated_at)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Статус:</span>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    currentStatus === 'failed' 
                      ? 'bg-red-100 text-red-800'
                      : currentStatus === 'cancelled'
                      ? 'bg-gray-100 text-gray-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {currentStatus === 'failed' ? 'Не удался' :
                     currentStatus === 'cancelled' ? 'Отменен' :
                     currentStatus === 'pending' ? 'Ожидает' : 'Обрабатывается'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="px-6 py-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Что можно сделать?
            </h2>
            
            <div className="space-y-3 text-sm text-gray-600 mb-6">
              <div className="flex items-start space-x-3">
                <RefreshCw className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <span>
                  Попробуйте совершить платеж еще раз
                </span>
              </div>
              <div className="flex items-start space-x-3">
                <CreditCard className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <span>
                  Проверьте данные карты или используйте другой способ оплаты
                </span>
              </div>
              <div className="flex items-start space-x-3">
                <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <span>
                  При повторных проблемах обратитесь в службу поддержки
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={handleRetryPayment}
                className="w-full bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors font-medium flex items-center justify-center space-x-2"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Попробовать еще раз</span>
              </button>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {paymentDetails && (currentStatus === 'pending' || currentStatus === 'processing') && (
                  <button
                    onClick={handleCancelPayment}
                    disabled={isCancelling}
                    className="px-6 py-2 border border-red-300 text-red-700 rounded-md hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isCancelling ? 'Отменяем...' : 'Отменить платеж'}
                  </button>
                )}
                <button
                  onClick={handleGoHome}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors flex items-center justify-center space-x-2"
                >
                  <Home className="h-4 w-4" />
                  <span>На главную</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}