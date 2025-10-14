"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";
import modernApiClient from "@/lib/modernApiClient";
import { API_ENDPOINTS } from "@/lib/constants";
import { getFullImageUrl } from "@/lib/utils";
import { toast } from "react-toastify";
import {
  Package,
  Clock,
  CheckCircle,
  XCircle,
  Calendar,
  CreditCard,
  Truck,
  ImageIcon,
} from "lucide-react";
import { useI18n } from "@/i18n";
import { Order, OrderItem } from "@/types";

import { RefundContactModal } from "@/components/ui/RefundContactModal";
import { OrderDetailsModal } from "@/components/ui/OrderDetailsModal";

/* ------------------------- Carousel ------------------------- */
function ProductCarousel({ item }: { item: { image?: string; name?: string } }) {
  // Use only image provided by order item
  const imageSource = item.image || null;
  const alt = item.name || "Product";

  if (!imageSource) {
    return (
      <div className="relative h-12 w-12 sm:h-16 sm:w-16 flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 rounded-md border text-gray-400 flex-shrink-0">
        <ImageIcon className="h-6 w-6 sm:h-8 sm:w-8" />
      </div>
    );
  }

  return (
    <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-md overflow-hidden border flex-shrink-0">
      <Image
        src={getFullImageUrl(imageSource)}
        alt={alt}
        width={64}
        height={64}
        className="object-cover w-full h-full"
      />
    </div>
  );
}

export default function OrdersPage() {
  const { isAuthenticated } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const lastFetchRef = useRef<number>(0);
  const { t, locale } = useI18n();

  /* ------------------------- Status config ------------------------- */
  const statusConfig = {
    // Lowercase statuses
    pending: { label: t("orders.status.pending"), color: "bg-yellow-100 text-yellow-800", icon: Clock },
    processing: { label: t("orders.status.processing"), color: "bg-blue-100 text-blue-800", icon: Package },
    shipped: { label: t("orders.status.shipped"), color: "bg-indigo-100 text-indigo-800", icon: Truck },
    delivered: { label: t("orders.status.delivered"), color: "bg-green-100 text-green-800", icon: CheckCircle },
    cancelled: { label: t("orders.status.cancelled"), color: "bg-red-100 text-red-800", icon: XCircle },
    confirmed: { label: t("orders.status.confirmed"), color: "bg-green-100 text-green-800", icon: CheckCircle },
    created: { label: t("orders.status.created"), color: "bg-gray-100 text-gray-800", icon: Clock },
    paid: { label: t("orders.status.paid"), color: "bg-green-100 text-green-800", icon: CheckCircle },
    failed: { label: t("orders.status.failed"), color: "bg-red-100 text-red-800", icon: XCircle },
    refunded: { label: t("orders.status.refunded"), color: "bg-purple-100 text-purple-800", icon: XCircle },
    // Uppercase statuses (backend compatibility)
    PENDING: { label: t("orders.status.pending"), color: "bg-yellow-100 text-yellow-800", icon: Clock },
    PROCESSING: { label: t("orders.status.processing"), color: "bg-blue-100 text-blue-800", icon: Package },
    SHIPPED: { label: t("orders.status.shipped"), color: "bg-indigo-100 text-indigo-800", icon: Truck },
    DELIVERED: { label: t("orders.status.delivered"), color: "bg-green-100 text-green-800", icon: CheckCircle },
    CANCELLED: { label: t("orders.status.cancelled"), color: "bg-red-100 text-red-800", icon: XCircle },
    CONFIRMED: { label: t("orders.status.confirmed"), color: "bg-green-100 text-green-800", icon: CheckCircle },
    CREATED: { label: t("orders.status.created"), color: "bg-gray-100 text-gray-800", icon: Clock },
    PAID: { label: t("orders.status.paid"), color: "bg-green-100 text-green-800", icon: CheckCircle },
    FAILED: { label: t("orders.status.failed"), color: "bg-red-100 text-red-800", icon: XCircle },
    REFUNDED: { label: t("orders.status.refunded"), color: "bg-purple-100 text-purple-800", icon: XCircle },
  } as const;

  /* ------------------------- Fetch Orders ------------------------- */

  const fetchOrders = useCallback(async () => {
    try {
      setIsLoading(true);

      // API dan to'g'ridan-to'g'ri keladigan JSON
      const response = await modernApiClient.get(API_ENDPOINTS.ORDERS);

      // Debug: Log the raw response to help diagnose pricing issues
      console.log("Orders API Response:", response);

      // Agar API ro'yxat qaytarsa:
      const data: Order[] = Array.isArray(response) ? response : [];

      // Normalize orders with proper price calculation
      const normalizedOrders: Order[] = (data || []).map((order: unknown) => {
        const orderData = order as Record<string, unknown>;
        const originalItems = Array.isArray(orderData.items) ? orderData.items : [];
        const items: OrderItem[] = originalItems.map((it: unknown) => {
          const itemData = it as Record<string, unknown>;
          // Extract quantity safely
          const quantity = Number(itemData?.quantity ?? itemData?.qty ?? 0) || 0;
          
          // Extract unit price from multiple possible field names
          const unit_price = Number(
            itemData?.unit_price ?? 
            itemData?.price ?? 
            itemData?.unitPrice ?? 
            (itemData?.slipper as Record<string, unknown>)?.price ?? 
            0
          ) || 0;
          
          // Calculate total price: prefer declared total, fallback to quantity * unit_price
          const declaredTotal = Number(
            itemData?.total_price ?? 
            itemData?.total ?? 
            itemData?.amount ?? 
            0
          ) || 0;
          
          // Use declared total if available and valid, otherwise calculate
          const total_price = declaredTotal > 0 ? declaredTotal : (unit_price * quantity);
          
          // Extract name from various possible sources
          const name = String(
            itemData?.name ?? 
            itemData?.slipper_name ?? 
            (itemData?.slipper as Record<string, unknown>)?.name ?? 
            ""
          );
          
          // Extract image
          const image = itemData?.image ?? (itemData?.slipper as Record<string, unknown>)?.image;
          
          // Extract slipper ID
          const slipper_id = Number(
            itemData?.slipper_id ?? 
            itemData?.product_id ?? 
            0
          ) || 0;
          
          return { 
            ...itemData, 
            slipper_id, 
            name, 
            quantity, 
            unit_price, 
            total_price, 
            image 
          } as OrderItem;
        });

        // Calculate total: prefer server total, fallback to sum of item totals
        const serverTotal = Number(orderData?.total_amount ?? orderData?.total ?? orderData?.amount ?? orderData?.sum ?? 0) || 0;
        const computedTotal = items.reduce((sum, it) => sum + (Number(it.total_price ?? 0) || 0), 0);
        
        // Use server total if it exists and is greater than 0, otherwise use computed total
        const total_amount = serverTotal > 0 ? serverTotal : computedTotal;

        return { ...orderData, items, total_amount } as Order;
      });
      setOrders(normalizedOrders);
      setFilteredOrders(normalizedOrders);
      lastFetchRef.current = Date.now();
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error(t("errors.productsLoad"));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  // Refund functionality
  const handleRefundRequest = () => {
    setShowRefundModal(true);
  };

  const handleShowOrderDetails = (order: Order) => {
    setSelectedOrder(order);
    setShowDetailsModal(true);
  };

  const handleCloseDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedOrder(null);
  };

  



  useEffect(() => {
    if (isAuthenticated) fetchOrders();
  }, [isAuthenticated, fetchOrders]);

  // Auto-refresh on focus/visibility with cooldown to avoid 429
  useEffect(() => {
    const COOLDOWN = 15000; // 15s
    const onFocus = () => {
      const now = Date.now();
      if (now - lastFetchRef.current >= COOLDOWN) {
        fetchOrders();
      }
    };
    const onVisibility = () => { if (!document.hidden) onFocus(); };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [fetchOrders]);

  /* ------------------------- Update filtered orders when orders change ------------------------- */
  useEffect(() => {
    setFilteredOrders(orders);
  }, [orders]);

  /* ------------------------- Format helpers ------------------------- */
  const formatDate = (dateString: string) => {
    const dateObj = new Date(dateString);
    return locale === "uz"
      ? `${dateObj.getDate()}-${dateObj.getMonth() + 1}-${dateObj.getFullYear()}`
      : dateObj.toLocaleDateString("ru-RU", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
  };

  const formatPrice = (price: number) => {
    // Ensure price is a valid number
    const numPrice = Number(price) || 0;
    // Format number with locale-specific thousand separators, then append currency after amount
    const formatted = new Intl.NumberFormat(locale === 'uz' ? 'uz-UZ' : 'ru-RU', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numPrice);
    return `${formatted} ${t('common.currencySom')}`;
  };

  /* ------------------------- Components ------------------------- */
  const OrderCard = ({ order }: { order: Order }) => {
    const StatusIcon = statusConfig[order.status]?.icon ?? Clock;

    return (
      <div className="card p-3 sm:p-6 hover:shadow-lg transition mx-2 sm:mx-0">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-4 space-y-2 sm:space-y-0">
          <div className="flex-1">
            <h3 className="text-base sm:text-lg font-semibold">
              {t("ordersPage.title")} #{order.id}
            </h3>
            <div className="text-xs sm:text-sm text-gray-500 flex items-center mt-1">
              <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
              {formatDate(order.created_at)}
            </div>
          </div>
          <div className="flex flex-row sm:flex-col sm:text-right items-center sm:items-end justify-between sm:justify-start space-x-2 sm:space-x-0">
            <span
              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusConfig[order.status]?.color}`}
            >
              <StatusIcon className="h-3 w-3 mr-1" />
              {statusConfig[order.status]?.label}
            </span>
            <div className="text-base sm:text-lg font-bold">{formatPrice(order.total_amount)}</div>
          </div>
        </div>

        {/* product preview */}
        <div className="flex gap-1 sm:gap-2 overflow-x-auto mb-4 pb-2">
          {order.items
            .filter(item => {
              // Only show items with valid product data from order response
              const hasValidProduct = !!item.name && item.name.trim().length > 0;
              const unit = Number(item.unit_price ?? 0);
              const qty = Number(item.quantity ?? 0);
              const line = Number(item.total_price ?? 0);
              const hasValidPrice = (Number.isFinite(line) && line > 0) || (unit > 0 && qty > 0);
              return hasValidProduct && hasValidPrice && qty > 0;
            })
            .slice(0, 3)
            .map((item, index) => {
            return (
              <div key={index} className="flex-shrink-0">
                <ProductCarousel item={item} />
              </div>
            );
          })}
          {order.items.filter(item => {
            const hasValidProduct = !!item.name && item.name.trim().length > 0;
            const unit = Number(item.unit_price ?? 0);
            const qty = Number(item.quantity ?? 0);
            const line = Number(item.total_price ?? 0);
            const hasValidPrice = (Number.isFinite(line) && line > 0) || (unit > 0 && qty > 0);
            return hasValidProduct && hasValidPrice && qty > 0;
          }).length > 3 && (
            <div className="flex-shrink-0 h-12 w-12 sm:h-16 sm:w-16 bg-gray-100 rounded-md flex items-center justify-center text-xs font-medium text-gray-600">
              <span className="text-xs">+{order.items.filter(item => {
                const hasValidProduct = !!item.name && item.name.trim().length > 0;
                const unit = Number(item.unit_price ?? 0);
                const qty = Number(item.quantity ?? 0);
                const line = Number(item.total_price ?? 0);
                const hasValidPrice = (Number.isFinite(line) && line > 0) || (unit > 0 && qty > 0);
                return hasValidProduct && hasValidPrice && qty > 0;
              }).length - 3}</span>
            </div>
          )}
        </div>

        <div className="border-t pt-4 flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0">
          <div className="text-xs sm:text-sm text-gray-600 flex flex-wrap items-center gap-2 sm:gap-4">
            <span className="flex items-center">
              <Package className="h-3 w-3 sm:h-4 sm:w-4 inline mr-1" />
              {order.items.filter(item => {
                const hasValidProduct = !!item.name && item.name.trim().length > 0;
                const unit = Number(item.unit_price ?? 0);
                const qty = Number(item.quantity ?? 0);
                const line = Number(item.total_price ?? 0);
                const hasValidPrice = (Number.isFinite(line) && line > 0) || (unit > 0 && qty > 0);
                return hasValidProduct && hasValidPrice && qty > 0;
              }).length}
            </span>
            {order.payment_method && (
              <span className="flex items-center">
                <CreditCard className="h-3 w-3 sm:h-4 sm:w-4 inline mr-1" />
                <span className="hidden sm:inline">{order.payment_method}</span>
              </span>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
            {/* About button - show for all orders */}
            <button
              onClick={() => handleShowOrderDetails(order)}
              className="group inline-flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 text-blue-700 hover:text-blue-800 font-medium text-xs sm:text-sm rounded-lg border border-blue-200 hover:border-blue-300 shadow-sm hover:shadow-md transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] w-full sm:w-auto"
            >
              <Package className="h-3 w-3 sm:h-4 sm:w-4 group-hover:scale-110 transition-transform duration-200" />
              <span className="text-xs sm:text-sm">{t('orders.about') || 'About'}</span>
            </button>
            {/* Refund button - show for delivered/paid orders that haven't been refunded */}
            {(['delivered', 'DELIVERED', 'PAID', 'confirmed'].includes(order.status as string)) && 
             !(['REFUNDED', 'refunded'].includes(order.status as string)) && (
              <button
                onClick={() => handleRefundRequest()}
                className="group inline-flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-gradient-to-r from-red-50 to-red-100 hover:from-red-100 hover:to-red-200 text-red-700 hover:text-red-800 font-medium text-xs sm:text-sm rounded-lg border border-red-200 hover:border-red-300 shadow-sm hover:shadow-md transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] w-full sm:w-auto"
              >
                <XCircle className="h-3 w-3 sm:h-4 sm:w-4 group-hover:scale-110 transition-transform duration-200" />
                <span className="text-xs sm:text-sm">{t('orders.refund.request') || 'Refund'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  /* ------------------------- Main render ------------------------- */
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold">{t("ordersPage.authRequiredTitle")}</h1>
          <p>{t("ordersPage.authRequiredMessage")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8">
      <div className="max-w-7xl mx-auto px-2 sm:px-4">
        <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 px-2 sm:px-0">{t("ordersPage.title")}</h1>
        {isLoading ? (
          <div className="text-center py-8">Loading...</div>
        ) : filteredOrders.length > 0 ? (
          <div className="space-y-3 sm:space-y-4">
            {filteredOrders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">{t("ordersPage.noneYet")}</div>
        )}
        
  </div>
      
      {/* Refund Contact Modal */}
      <RefundContactModal
        isOpen={showRefundModal}
        onClose={() => setShowRefundModal(false)}
      />

      {/* Order Details Modal */}
      <OrderDetailsModal
        order={selectedOrder}
        isOpen={showDetailsModal}
        onClose={handleCloseDetailsModal}
        formatDate={formatDate}
        statusConfig={statusConfig}
      />
    </div>
  );
}
