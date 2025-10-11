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
import { Order, OrderItem, Slipper } from "@/types";

import { RefundContactModal } from "@/components/ui/RefundContactModal";

/* ------------------------- Carousel ------------------------- */
function ProductCarousel({ item }: {
  item: {
    image?: string;
    slipper?: {
      name?: string;
      image?: string;
      images?: Array<{ image_path: string; is_primary?: boolean }>;
    };
    name?: string;
  };
}) {
  // Try to get image from multiple sources
  const getImageSource = () => {
    // 1. Check if item has direct image
    if (item.image) {
      return item.image;
    }
    
    // 2. Check if slipper has images array with primary image
    if (item.slipper?.images && Array.isArray(item.slipper.images) && item.slipper.images.length > 0) {
      const primaryImage = item.slipper.images.find((img) => img.is_primary);
      if (primaryImage?.image_path) {
        return primaryImage.image_path;
      }
      // Fallback to first image if no primary
      if (item.slipper.images[0]?.image_path) {
        return item.slipper.images[0].image_path;
      }
    }
    
    // 3. Check if slipper has direct image field
    if (item.slipper?.image) {
      return item.slipper.image;
    }
    
    return null;
  };

  const imageSource = getImageSource();
  const alt = item.slipper?.name || item.name || "Product";

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
  const slipperCacheRef = useRef<Map<number, Slipper>>(new Map());
  const pendingRef = useRef<Map<number, Promise<Slipper | null>>>(new Map());

  // Fetch slipper with simple in-memory cache and no over-parallelism
  const fetchSlipperCached = useCallback(async (id: number): Promise<Slipper | null> => {
    const cached = slipperCacheRef.current.get(id);
    if (cached) return cached;
    const pending = pendingRef.current.get(id);
    if (pending) return pending;
    const p = (async () => {
      try {
        const resp = await modernApiClient.get(API_ENDPOINTS.SLIPPER_BY_ID(id), { include_images: true }, { cache: false, timeout: 6000 });
        const data = (resp as { data?: unknown })?.data || resp;
        if (data && typeof data === 'object') {
          slipperCacheRef.current.set(id, data as Slipper);
          return data as Slipper;
        }
        return null;
      } catch {
        return null;
      } finally {
        pendingRef.current.delete(id);
      }
    })();
    pendingRef.current.set(id, p);
    return p;
  }, []);

  // Run tasks with limited concurrency to avoid 429s
  const runWithLimit = async <T,>(limit: number, tasks: Array<() => Promise<T>>): Promise<T[]> => {
    const results: T[] = new Array(tasks.length) as T[];
    let i = 0;
    const workers = new Array(Math.min(limit, tasks.length)).fill(0).map(async () => {
      while (true) {
        const idx = i++;
        if (idx >= tasks.length) break;
        results[idx] = await tasks[idx]();
      }
    });
    await Promise.all(workers);
    return results;
  };

  const fetchOrders = useCallback(async () => {
    try {
      setIsLoading(true);

      // API dan to'g'ridan-to'g'ri keladigan JSON
      const response = await modernApiClient.get(API_ENDPOINTS.ORDERS);

      // Agar API ro'yxat qaytarsa:
      const data: Order[] = Array.isArray(response) ? response : [];

      // Consolidate duplicates and collect ids needing enrichment across all orders
      const ordersConsolidated = data.map((order) => {
        const itemMap = new Map<number, OrderItem>();
        order.items.forEach((item) => {
          const key = item.slipper_id;
          if (itemMap.has(key)) {
            const existing = itemMap.get(key)!;
            const addQty = Number(item.quantity ?? 0);
            existing.quantity = Number(existing.quantity ?? 0) + addQty;
            const unit = Number(existing.unit_price ?? 0);
            existing.total_price = unit * Number(existing.quantity ?? 0);
          } else {
            const qty = Number(item.quantity ?? 0);
            const unit = Number(item.unit_price ?? 0);
            itemMap.set(key, { ...item, quantity: qty, unit_price: unit, total_price: unit * qty });
          }
        });
        const consolidatedItems = Array.from(itemMap.values());
        const validItems = consolidatedItems.filter((item) => {
          const hasValidProduct = item.slipper_id && (item.name || item.slipper?.name);
          const hasValidPrice = Number(item.unit_price) > 0;
          return hasValidProduct && hasValidPrice;
        });
        // Compute total from ORIGINAL items (not consolidated) to preserve mixed prices
        const validOriginal = (order.items || []).filter((item) => {
          const hasValidProduct = item.slipper_id && (item.name || item.slipper?.name);
          const priceNum = Number(item.unit_price ?? (item as unknown as { price?: number }).price ?? 0);
          return hasValidProduct && priceNum > 0;
        });
        const computedTotal = validOriginal.reduce((sum, it) => {
          const unit = Number(it.unit_price ?? (it as unknown as { price?: number }).price ?? 0);
          const qty = Number(it.quantity ?? 0);
          const fallbackTotal = Number((it as unknown as { total_price?: number }).total_price ?? 0);
          const lineTotal = unit > 0 && qty > 0 ? unit * qty : fallbackTotal;
          return sum + (Number.isFinite(lineTotal) ? lineTotal : 0);
        }, 0);
        const serverTotal = Number((order as unknown as { total_amount?: unknown }).total_amount ?? 0);
        const normalizedTotal = Number.isFinite(serverTotal) && Math.abs(serverTotal - computedTotal) <= Math.max(1000, computedTotal * 0.01)
          ? serverTotal
          : computedTotal;
        return { ...order, items: validItems, total_amount: normalizedTotal } as Order;
      });

      const idsNeeding: number[] = [];
      const seen = new Set<number>();
      ordersConsolidated.forEach((order) => {
        order.items.forEach((it) => {
          const needs = !it.slipper || (!it.slipper.images && !it.slipper.image);
          if (needs && !seen.has(it.slipper_id)) { seen.add(it.slipper_id); idsNeeding.push(it.slipper_id); }
        });
      });

      // Fetch missing slippers with limited concurrency (avoid 429)
      if (idsNeeding.length > 0) {
        const tasks = idsNeeding.map((id) => () => fetchSlipperCached(id));
        await runWithLimit(3, tasks); // limit to 3 concurrent requests
      }

      // Build enriched orders using cache (no extra network hits here)
      const enrichedOrders = ordersConsolidated.map((order) => ({
        ...order,
        items: order.items.map((item) => {
          if (!item.slipper || (!item.slipper.images && !item.slipper.image)) {
            const cached = slipperCacheRef.current.get(item.slipper_id);
            if (cached) return { ...item, slipper: cached } as OrderItem;
          }
          return item;
        }),
      }));

      setOrders(enrichedOrders);
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
          (item.slipper?.name || "").toLowerCase().includes(term)
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
              // Only show items with valid product data
              const hasValidProduct = item.slipper_id && (item.name || item.slipper?.name);
              const hasValidPrice = item.unit_price && item.unit_price > 0;
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
            const hasValidProduct = item.slipper_id && (item.name || item.slipper?.name);
            const hasValidPrice = item.unit_price && item.unit_price > 0;
            return hasValidProduct && hasValidPrice;
          }).length > 3 && (
            <div className="flex-shrink-0 h-16 w-16 bg-gray-100 rounded-md flex items-center justify-center text-xs font-medium text-gray-600">
              +{order.items.filter(item => {
                const hasValidProduct = item.slipper_id && (item.name || item.slipper?.name);
                const hasValidPrice = item.unit_price && item.unit_price > 0;
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
                const hasValidProduct = item.slipper_id && (item.name || item.slipper?.name);
                const hasValidPrice = item.unit_price && item.unit_price > 0;
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
                // Only show items with valid product data
                const hasValidProduct = item.slipper_id && (item.name || item.slipper?.name);
                const hasValidPrice = item.unit_price && item.unit_price > 0;
                return hasValidProduct && hasValidPrice;
              })
              .map((item, index) => (
              <div key={`${item.slipper_id}-${index}`} className="flex gap-4 items-center p-2 border rounded">
                <ProductCarousel item={item} />
                <div className="flex-1">
                  <div className="font-medium">{item.slipper?.name || item.name}</div>
                  <div className="text-sm text-gray-600">
                    {t("orders.modal.quantity")}: {item.quantity} × {formatPrice(item.unit_price)}
                  </div>
                  {item.slipper?.size && (
                    <div className="text-xs text-gray-500">
                      {t("orders.modal.size")}: {item.slipper.size}
                    </div>
                  )}
                </div>
                <div className="font-semibold">
                  {formatPrice((item.unit_price ?? 0) * (item.quantity ?? 0))}
                </div>
              </div>
            ))}
            <div className="border-t pt-4">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>{t("orders.modal.itemsTotal")}:</span>
                <span>{selectedOrder.items
                  .filter(item => {
                    const hasValidProduct = item.slipper_id && (item.name || item.slipper?.name);
                    const hasValidPrice = item.unit_price && item.unit_price > 0;
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
