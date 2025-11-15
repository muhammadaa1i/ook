"use client";

import React, { useState } from "react";
import Image from "next/image";
import { X, Package, Calendar, CreditCard, MapPin, Clock, ImageIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { Order } from "@/types";
import { useI18n } from "@/i18n";
import { getFullImageUrl } from "@/lib/utils";

interface OrderDetailsModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  formatDate: (dateString: string) => string;
  statusConfig: Record<string, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }>;
}

export function OrderDetailsModal({
  order,
  isOpen,
  onClose,
  formatDate,
  statusConfig,
}: OrderDetailsModalProps) {
  const { t } = useI18n();
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!isOpen || !order) return null;

  const StatusIcon = statusConfig[order.status]?.icon ?? Clock;

  // Filter valid items
  const validItems = order.items.filter(item => {
    const hasValidProduct = !!item.name && item.name.trim().length > 0;
    const qty = Number(item.quantity ?? 0);
    return hasValidProduct && qty > 0;
  });

  const totalItems = validItems.length;

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? totalItems - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === totalItems - 1 ? 0 : prev + 1));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 bg-opacity-50" onClick={onClose}>
      <div
        className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl sm:text-2xl font-bold">
            {t("orders.details.title")} #{order.id}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label={t("common.close") || "Close"}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4 space-y-6">
          {/* Order Status and Date */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-5 w-5 text-gray-500" />
                <span className="text-sm text-gray-600">{t("orders.details.orderDate")}</span>
              </div>
              <p className="text-lg font-semibold ml-7">{formatDate(order.created_at)}</p>
            </div>
            <div>
              <span
                className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${statusConfig[order.status]?.color}`}
              >
                <StatusIcon className="h-4 w-4 mr-2" />
                {statusConfig[order.status]?.label}
              </span>
            </div>
          </div>

          {/* Order Information Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 border-b">
            {order.payment_method && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <CreditCard className="h-5 w-5 text-gray-500" />
                  <span className="text-sm text-gray-600">{t("orders.details.paymentMethod")}</span>
                </div>
                <p className="font-medium ml-7">{order.payment_method}</p>
              </div>
            )}
            
            {order.shipping_address && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="h-5 w-5 text-gray-500" />
                  <span className="text-sm text-gray-600">{t("orders.details.shippingAddress")}</span>
                </div>
                <p className="font-medium ml-7">{order.shipping_address}</p>
              </div>
            )}

            <div>
              <div className="flex items-center gap-2 mb-2">
                <Package className="h-5 w-5 text-gray-500" />
                <span className="text-sm text-gray-600">{t("orders.details.totalItems")}</span>
              </div>
              <p className="font-medium ml-7">
                {totalItems} {t("common.items")}
              </p>
            </div>

            {order.user_name && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm text-gray-600">{t("orders.details.customerName")}</span>
                </div>
                <p className="font-medium">{order.user_name}</p>
              </div>
            )}
          </div>

          {/* Order Items Carousel */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Package className="h-5 w-5" />
              {t("orders.details.orderItems")}
            </h3>
            {totalItems > 0 ? (
              <div className="relative">
                {/* Carousel Container */}
                <div className="overflow-hidden rounded-lg">
                  <div
                    className="flex transition-transform duration-300 ease-in-out"
                    style={{ transform: `translateX(-${currentIndex * 100}%)` }}
                  >
                    {validItems.map((item, index) => (
                      <div
                        key={index}
                        className="min-w-full flex flex-col items-center justify-center p-8 bg-linear-to-br from-gray-50 to-gray-100"
                      >
                        {/* Product Image */}
                        <div className="mb-4">
                          {item.image ? (
                            <div className="h-48 w-48 sm:h-64 sm:w-64 rounded-lg overflow-hidden border-2 border-gray-200 shadow-lg">
                              <Image
                                src={getFullImageUrl(item.image)}
                                alt={item.name || "Product"}
                                width={256}
                                height={256}
                                className="object-cover w-full h-full"
                              />
                            </div>
                          ) : (
                            <div className="h-48 w-48 sm:h-64 sm:w-64 flex items-center justify-center bg-linear-to-br from-gray-200 to-gray-300 rounded-lg border-2 border-gray-200 shadow-lg text-gray-400">
                              <ImageIcon className="h-24 w-24" />
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Navigation Arrows */}
                {totalItems > 1 && (
                  <>
                    <button
                      onClick={handlePrevious}
                      className="absolute left-2 top-1/2 -translate-y-1/2 p-2 sm:p-3 bg-white/90 hover:bg-white rounded-full shadow-lg transition-all hover:scale-110"
                      aria-label="Previous item"
                    >
                      <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6 text-gray-700" />
                    </button>
                    <button
                      onClick={handleNext}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 sm:p-3 bg-white/90 hover:bg-white rounded-full shadow-lg transition-all hover:scale-110"
                      aria-label="Next item"
                    >
                      <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6 text-gray-700" />
                    </button>
                  </>
                )}

                {/* Dots Indicator */}
                {totalItems > 1 && (
                  <div className="flex justify-center gap-2 mt-4">
                    {validItems.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentIndex(index)}
                        className={`h-2 rounded-full transition-all ${
                          index === currentIndex
                            ? "w-8 bg-blue-600"
                            : "w-2 bg-gray-300 hover:bg-gray-400"
                        }`}
                        aria-label={`Go to item ${index + 1}`}
                      />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">{t("orders.details.noItems") || "No items"}</p>
            )}
          </div>

          {/* Order Notes */}
          {order.notes && (
            <div className="pb-4 border-b">
              <h3 className="text-lg font-semibold mb-2">{t("orders.details.notes")}</h3>
              <p className="text-gray-700 bg-yellow-50 p-3 rounded-md">{order.notes}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t px-6 py-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
          >
            {t("common.close") || "Close"}
          </button>
        </div>
      </div>
    </div>
  );
}
