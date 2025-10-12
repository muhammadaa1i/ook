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
  Eye,
  Calendar,
  CreditCard,
  Truck,
  ImageIcon,
} from "lucide-react";
import { useI18n } from "@/i18n";
import { Order, OrderItem } from "@/types";

import { RefundContactModal } from "@/components/ui/RefundContactModal";

/* ------------------------- Carousel ------------------------- */
function ProductCarousel({ item }: { item: { image?: string; name?: string } }) {
  // Use only image provided by order item
  const imageSource = item.image || null;
  const alt = item.name || "Product";

  if (!imageSource) {
    return (
      <div className="relative h-16 w-16 flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 rounded-md border text-gray-400">
        <ImageIcon className="h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="h-16 w-16 rounded-md overflow-hidden border">
      <Image
        src={getFullImageUrl(imageSource)}
        alt={alt}
        width={64}
        height={64}
        className="object-cover"
      />
    </div>
  );
}

export default function OrdersPage() {
  const { isAuthenticated } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"date" | "amount">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null);
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

      // Agar API ro'yxat qaytarsa:
      const data: Order[] = Array.isArray(response) ? response : [];

      // Preserve original lines; prefer backend totals and compute fallback
      const normalizedOrders: Order[] = (data || []).map((order) => {
        const originalItems = Array.isArray(order.items) ? order.items : [];
        const items: OrderItem[] = originalItems.map((it: any) => {
          const quantity = Number(it?.quantity ?? (it as any)?.qty ?? 0) || 0;
          const unit_price = Number(it?.unit_price ?? (it as any)?.price ?? (it as any)?.unitPrice ?? 0) || 0;
          const declaredTotal = Number(it?.total_price ?? (it as any)?.total ?? (it as any)?.amount ?? 0) || 0;
          const total_price = declaredTotal > 0 ? declaredTotal : (unit_price > 0 && quantity > 0 ? unit_price * quantity : 0);
          const name = String(it?.name ?? (it as any)?.slipper_name ?? "");
          const image = (it as any)?.image ?? it?.image;
          const slipper_id = Number((it as any)?.slipper_id ?? (it as any)?.product_id ?? it?.slipper_id ?? 0) || 0;
          return { ...it, slipper_id, name, quantity, unit_price, total_price, image } as OrderItem;
        });

        const serverTotalAny = (order as any)?.total_amount ?? (order as any)?.total ?? (order as any)?.amount ?? (order as any)?.sum;
        const serverTotal = Number(serverTotalAny ?? 0) || 0;
        const computedTotal = items.reduce((sum, it) => sum + (Number(it.total_price ?? 0) || 0), 0);
        const total_amount = serverTotal > 0 ? serverTotal : computedTotal;

        return { ...order, items, total_amount } as Order;
      });
      setOrders(normalizedOrders);
      setLastUpdatedAt(Date.now());
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

  /* ------------------------- Filter & Sort ------------------------- */
  const filterAndSortOrders = useCallback(() => {
    let filtered = [...orders];
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((order) => {
        const orderNum = String(order.id).toLowerCase();
        const hasOrderNum = orderNum.includes(term);
        const hasItemMatch = order.items?.some((item) =>
          String(item.name || "").toLowerCase().includes(term)
        );
        return hasOrderNum || hasItemMatch;
      });
    }
    if (statusFilter !== "all") {
      filtered = filtered.filter((o) => o.status === statusFilter);
    }
    filtered.sort((a, b) => {
      let aValue: number, bValue: number;
      if (sortBy === "date") {
        aValue = new Date(a.created_at).getTime();
        bValue = new Date(b.created_at).getTime();
      } else {
        aValue = a.total_amount;
        bValue = b.total_amount;
      }
      return sortOrder === "asc" ? aValue - bValue : bValue - aValue;
    });
    setFilteredOrders(filtered);
  }, [orders, searchTerm, statusFilter, sortBy, sortOrder]);

  useEffect(() => {
    filterAndSortOrders();
  }, [filterAndSortOrders]);

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

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("ru-RU", {
      style: "currency",
      currency: "UZS",
      minimumFractionDigits: 0,
    }).format(price);

  /* ------------------------- Components ------------------------- */
  const OrderCard = ({ order }: { order: Order }) => {
    const StatusIcon = statusConfig[order.status]?.icon ?? Clock;

    return (
      <div className="card p-6 hover:shadow-lg transition">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold">
              {t("ordersPage.title")} #{order.id}
            </h3>
            <div className="text-sm text-gray-500 flex items-center">
              <Calendar className="h-4 w-4 mr-1" />
              {formatDate(order.created_at)}
            </div>
          </div>
          <div className="text-right">
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${statusConfig[order.status]?.color}`}
            >
              <StatusIcon className="h-3 w-3 mr-1" />
              {statusConfig[order.status]?.label}
            </span>
            <div className="text-lg font-bold">{formatPrice(order.total_amount)}</div>
          </div>
        </div>

        {/* product preview */}
        <div className="flex gap-2 overflow-x-auto mb-4">
          {order.items
            .filter(item => {
              // Only show items with valid product data from order response
              const hasValidProduct = !!item.name;
              const unit = Number(item.unit_price ?? 0);
              const qty = Number(item.quantity ?? 0);
              const line = Number(item.total_price ?? 0);
              const hasValidPrice = (Number.isFinite(line) && line > 0) || (unit > 0 && qty > 0);
              return hasValidProduct && hasValidPrice;
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
            const hasValidProduct = !!item.name;
            const unit = Number(item.unit_price ?? 0);
            const qty = Number(item.quantity ?? 0);
            const line = Number(item.total_price ?? 0);
            const hasValidPrice = (Number.isFinite(line) && line > 0) || (unit > 0 && qty > 0);
            return hasValidProduct && hasValidPrice;
          }).length > 3 && (
            <div className="flex-shrink-0 h-16 w-16 bg-gray-100 rounded-md flex items-center justify-center text-xs font-medium text-gray-600">
              +{order.items.filter(item => {
                const hasValidProduct = !!item.name;
                const unit = Number(item.unit_price ?? 0);
                const qty = Number(item.quantity ?? 0);
                const line = Number(item.total_price ?? 0);
                const hasValidPrice = (Number.isFinite(line) && line > 0) || (unit > 0 && qty > 0);
                return hasValidProduct && hasValidPrice;
              }).length - 3}
            </div>
          )}
        </div>

        <div className="border-t pt-4 flex justify-between items-center">
          <div className="text-sm text-gray-600 flex items-center gap-4">
            <span>
              <Package className="h-4 w-4 inline mr-1" />
              {order.items.filter(item => {
                const hasValidProduct = !!item.name;
                const unit = Number(item.unit_price ?? 0);
                const qty = Number(item.quantity ?? 0);
                const line = Number(item.total_price ?? 0);
                const hasValidPrice = (Number.isFinite(line) && line > 0) || (unit > 0 && qty > 0);
                return hasValidProduct && hasValidPrice;
              }).length}
            </span>
            {order.payment_method && (
              <span>
                <CreditCard className="h-4 w-4 inline mr-1" />
                {order.payment_method}
              </span>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setSelectedOrder(order)}
              className="group inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 text-blue-700 hover:text-blue-800 font-medium text-sm rounded-lg border border-blue-200 hover:border-blue-300 shadow-sm hover:shadow-md transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
            >
              <Eye className="h-4 w-4 group-hover:scale-110 transition-transform duration-200" /> 
              {t("orders.viewDetails")}
            </button>
            {/* Refund button - show for delivered/paid orders that haven't been refunded */}
            {(['delivered', 'DELIVERED', 'PAID', 'confirmed'].includes(order.status as string)) && 
             !(['REFUNDED', 'refunded'].includes(order.status as string)) && (
              <button
                onClick={() => handleRefundRequest()}
                className="group inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-50 to-red-100 hover:from-red-100 hover:to-red-200 text-red-700 hover:text-red-800 font-medium text-sm rounded-lg border border-red-200 hover:border-red-300 shadow-sm hover:shadow-md transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
              >
                <XCircle className="h-4 w-4 group-hover:scale-110 transition-transform duration-200" />
                {t('orders.refund.request') || 'Refund'}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const OrderModal = () => {
    if (!selectedOrder) return null;

    return (
      <div
        className="fixed inset-0 flex items-center justify-center z-50"
        style={{ backgroundColor: "rgba(0, 0, 0, .5)" }}
        onClick={(e) => e.target === e.currentTarget && setSelectedOrder(null)}
      >
        <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-xl font-bold">
              {t("orders.modal.title", { id: selectedOrder.id })}
            </h2>
            <button 
              onClick={() => setSelectedOrder(null)}
              className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-all duration-200 transform hover:scale-110 active:scale-95 focus:ring-2 focus:ring-gray-300 focus:ring-offset-1"
            >
              <XCircle className="h-6 w-6" />
            </button>
          </div>
          <div className="space-y-4">
            {selectedOrder.items
              .filter(item => {
                // Only show items with valid product data from order response
                const hasValidProduct = !!item.name;
                const unit = Number(item.unit_price ?? 0);
                const qty = Number(item.quantity ?? 0);
                const line = Number(item.total_price ?? 0);
                const hasValidPrice = (Number.isFinite(line) && line > 0) || (unit > 0 && qty > 0);
                return hasValidProduct && hasValidPrice;
              })
              .map((item, index) => (
              <div key={`${item.slipper_id}-${index}`} className="flex gap-4 items-center p-2 border rounded">
                <ProductCarousel item={item} />
                <div className="flex-1">
                  <div className="font-medium">{item.name}</div>
                  <div className="text-sm text-gray-600">
                    {t("orders.modal.quantity")}: {item.quantity} × {formatPrice(item.unit_price)}
                  </div>
                </div>
                <div className="font-semibold">
                  {formatPrice(
                    Number.isFinite(Number(item.total_price ?? 0)) && Number(item.total_price ?? 0) > 0
                      ? Number(item.total_price ?? 0)
                      : (Number(item.unit_price ?? 0) * Number(item.quantity ?? 0))
                  )}
                </div>
              </div>
            ))}
            <div className="border-t pt-4">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>{t("orders.modal.itemsTotal")}:</span>
                <span>{selectedOrder.items
                  .filter(item => {
                    const hasValidProduct = !!item.name;
                    const unit = Number(item.unit_price ?? 0);
                    const qty = Number(item.quantity ?? 0);
                    const line = Number(item.total_price ?? 0);
                    const hasValidPrice = (Number.isFinite(line) && line > 0) || (unit > 0 && qty > 0);
                    return hasValidProduct && hasValidPrice;
                  })
                  .reduce((total, item) => total + item.quantity, 0)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg">
                <span>{t("orders.modal.total")}:</span>
                <span>{formatPrice(selectedOrder.total_amount)}</span>
              </div>
            </div>
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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-3xl font-bold mb-6">{t("ordersPage.title")}</h1>
        {isLoading ? (
          <div>Loading...</div>
        ) : filteredOrders.length > 0 ? (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">{t("ordersPage.noneYet")}</div>
        )}
        
  </div>
      <OrderModal />
      
      {/* Refund Contact Modal */}
      <RefundContactModal
        isOpen={showRefundModal}
        onClose={() => setShowRefundModal(false)}
      />
    </div>
  );
}
