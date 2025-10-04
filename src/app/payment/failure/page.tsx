"use client";

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { XCircle, Loader2, RefreshCw } from 'lucide-react';

import { useI18n } from '@/i18n';

function PaymentFailureContent() {
  const { t } = useI18n();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  const transferId = searchParams.get('transfer_id') || 
                     searchParams.get('octo_payment_UUID') || 
                     searchParams.get('payment_uuid') || 
                     searchParams.get('octo-status');

  useEffect(() => {
    if (!transferId) {
      setLoading(false);
      return;
    }

    // Payment failed - no need to check status
    setLoading(false);
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



        <div className="space-y-3">
          <button
            onClick={handleRetry}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-3 px-6 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center justify-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            {t('payment.retry')}
          </button>
          <button
            onClick={handleContinueShopping}
            className="w-full bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white py-3 px-6 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
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
