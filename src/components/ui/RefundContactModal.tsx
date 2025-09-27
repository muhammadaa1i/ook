"use client";

import React from 'react';
import { X, Phone, Send } from 'lucide-react';
import { useI18n } from '@/i18n';

interface RefundContactModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RefundContactModal: React.FC<RefundContactModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { t } = useI18n();

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-gray-300 flex items-center justify-center z-50 p-4"
      style={{ backgroundColor: 'rgba(156, 163, 175, 0.8)' }}
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 transform transition-all duration-300 scale-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">
            {t('orders.refund.contactModal.title')}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-all duration-200 transform hover:scale-110 active:scale-95 focus:ring-2 focus:ring-gray-300 focus:ring-offset-1"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Message */}
          <div className="text-center">
            <p className="text-gray-700 leading-relaxed">
              {t('orders.refund.contactModal.message')}
            </p>
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
              {t('orders.refund.contactModal.contactInfo')}
            </h3>
            
            <div className="space-y-3">
              {/* Phone */}
              <div className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-full">
                  <Phone className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {t('orders.refund.contactModal.phone')}
                  </p>
                  <a 
                    href="tel:+998950210207" 
                    className="text-blue-600 hover:text-blue-800 font-mono text-sm transition-colors"
                  >
                    +998 95 021 02 07
                  </a>
                </div>
              </div>

              {/* Telegram */}
              <div className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-full">
                  <Send className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {t('orders.refund.contactModal.telegram')}
                  </p>
                  <a 
                    href="https://t.me/elbek_s101" 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 font-mono text-sm transition-colors"
                  >
                    @elbek_s101
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 rounded-b-2xl">
          <button
            onClick={onClose}
            className="w-full px-5 py-3 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            {t('orders.refund.contactModal.closeButton')}
          </button>
        </div>
      </div>
    </div>
  );
};