"use client";

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle, Package, Home, Receipt } from 'lucide-react';
import { usePayment } from '@/contexts/PaymentContext';
import { PaymentStatusResponse } from '@/services/paymentService';

export default function PaymentSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { checkPaymentStatus, clearPaymentState } = usePayment();
  const [paymentDetails, setPaymentDetails] = useState<PaymentStatusResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const transferId = searchParams.get('transfer_id');

  useEffect(() => {
    const verifyPayment = async () => {
      if (!transferId) {
        router.push('/');
        return;
      }

      try {
        setIsLoading(true);
        const status = await checkPaymentStatus(transferId);
        
        if (status) {
          setPaymentDetails(status);
          
          // If payment is not actually completed, redirect to failure page
          if (status.status !== 'completed') {
            router.push(`/payment/failure?transfer_id=${transferId}&reason=payment_not_completed`);
            return;
          }
        } else {
          router.push(`/payment/failure?transfer_id=${transferId}&reason=status_check_failed`);
        }
      } catch (error) {
        console.error('Error verifying payment:', error);
        router.push(`/payment/failure?transfer_id=${transferId}&reason=verification_error`);
      } finally {
        setIsLoading(false);
      }
    };

    verifyPayment();
  }, [transferId, checkPaymentStatus, router]);

  const handleViewOrders = () => {
    clearPaymentState();
    router.push('/orders');
  };

  const handleContinueShopping = () => {
    clearPaymentState();
    router.push('/catalog');
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
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
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

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Success Header */}
          <div className="bg-green-50 px-6 py-8 text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Платеж успешно выполнен!
            </h1>
            <p className="text-gray-600">
              Спасибо за покупку! Ваш заказ принят и будет обработан в ближайшее время.
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
                  <span className="text-gray-600">Дата платежа:</span>
                  <span className="text-gray-900">
                    {formatDate(paymentDetails.updated_at)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Статус:</span>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Завершен
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Next Steps */}
          <div className="px-6 py-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Что дальше?
            </h2>
            <div className="space-y-3 text-sm text-gray-600 mb-6">
              <div className="flex items-start space-x-3">
                <Receipt className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <span>
                  Мы отправили подтверждение заказа на вашу электронную почту
                </span>
              </div>
              <div className="flex items-start space-x-3">
                <Package className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <span>
                  Ваш заказ будет обработан и отправлен в течение 1-2 рабочих дней
                </span>
              </div>
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <span>
                  Вы можете отслеживать статус заказа в разделе "Мои заказы"
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={handleViewOrders}
                className="w-full bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors font-medium"
              >
                Посмотреть мои заказы
              </button>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={handleContinueShopping}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Продолжить покупки
                </button>
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