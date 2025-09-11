"use client";

import React, { useState, useEffect, useCallback } from "react";
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
  MapPin,
} from "lucide-react";
import { useI18n } from "@/i18n";
import { useRouter } from "next/navigation";
import { Order, OrderItem } from "@/types";

const statusConfig = {
  pending: {
    label: "Ожидает",
    color: "bg-yellow-100 text-yellow-800",
    icon: Clock,
  },
  processing: {
    label: "Обрабатывается",
    color: "bg-blue-100 text-blue-800",
    icon: Package,
  },
  shipped: {
    label: "Отправлен",
    color: "bg-purple-100 text-purple-800",
    icon: Package,
  },
  delivered: {
    label: "Доставлен",
    color: "bg-green-100 text-green-800",
    icon: CheckCircle,
  },
  cancelled: {
    label: "Отменен",
    color: "bg-red-100 text-red-800",
    icon: XCircle,
  },
};

export default function OrdersPage() {
  const { isAuthenticated } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy] = useState<"date" | "amount">("date");
  const [sortOrder] = useState<"asc" | "desc">("desc");
  const { t, locale } = useI18n();
  const router = useRouter();

  const fetchOrders = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await modernApiClient.get(API_ENDPOINTS.ORDERS, {});
      const data = (response as { data?: unknown; items?: unknown })?.data ?? (response as unknown);
      const ordersData: unknown = (data as { items?: unknown; data?: unknown })?.items ?? (data as { data?: unknown })?.data ?? data;

      type RawOrderItem = Partial<OrderItem> & {
        unit_price?: number;
        quantity?: number;
        total_price?: number;
        price?: number;
        slipper?: Partial<OrderItem["slipper"]> & {
          images?: Array<{ id: number; image_url?: string; image_path?: string }>;
        };
      };
      type RawOrder = Partial<Order> & {
        order_number?: string;
        items?: RawOrderItem[];
        order_items?: RawOrderItem[];
        payment_method?: string;
        shipping_address?: string;
      };

      const normalized: Order[] = (Array.isArray(ordersData) ? ordersData : [])
        .map((r) => r as RawOrder)
        .map((raw) => {
          const rawItems: RawOrderItem[] = Array.isArray(raw.items)
            ? raw.items
            : Array.isArray(raw.order_items)
              ? raw.order_items
              : [];

          const items: OrderItem[] = rawItems.map((ri) => ({
            id: (ri.id ?? Math.random() * 1e9) as number,
            slipper_id: ri.slipper_id as number,
            slipper: ri.slipper as OrderItem["slipper"],
            quantity: Number(ri.quantity ?? 0),
            unit_price: Number(ri.unit_price ?? ri.price ?? 0),
            total_price: typeof ri.total_price === "number" ? ri.total_price : Number(ri.unit_price ?? ri.price ?? 0) * Number(ri.quantity ?? 0),
            notes: ri.notes,
            order_id: ri.order_id,
            created_at: ri.created_at,
          }));

          const computedTotal = typeof raw.total_amount === "number" && !Number.isNaN(raw.total_amount)
            ? raw.total_amount
            : items.reduce((sum, it) => sum + Number(it.total_price ?? (it.unit_price * it.quantity)), 0);

          return {
            id: Number(raw.id ?? 0),
            user_id: Number(raw.user_id ?? 0),
            user: raw.user,
            status: (raw.status ?? "pending") as Order["status"],
            total_amount: computedTotal,
            notes: raw.notes,
            items,
            created_at: raw.created_at ?? new Date().toISOString(),
            updated_at: raw.updated_at ?? raw.created_at ?? new Date().toISOString(),
          } as Order;
        });

      setOrders(normalized);
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error(t('errors.productsLoad'));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    if (isAuthenticated) fetchOrders();
  }, [isAuthenticated, fetchOrders]);

  const filterAndSortOrders = useCallback(() => {
    const ordersArray = Array.isArray(orders) ? orders : [];
    let filtered = [...ordersArray];
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((order) => {
        const orderNum = (order.order_number || String(order.id)).toLowerCase();
        const hasOrderNum = orderNum.includes(term);
        const hasItemMatch = Array.isArray(order.items)
          ? order.items.some((item) =>
              (item.slipper?.name || "").toLowerCase().includes(term)
            )
          : false;
        return hasOrderNum || hasItemMatch;
      });
    }
    if (statusFilter !== "all") {
      filtered = filtered.filter((order) => order.status === statusFilter);
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

  // (Removed original fetchOrders and filterAndSortOrders implementations)

  const formatDate = (dateString: string) => {
    const dateObj = new Date(dateString);
    
    if (locale === 'uz') {
      const uzbekMonths = [
        'yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun',
        'iyul', 'avgust', 'sentyabr', 'oktyabr', 'noyabr', 'dekabr'
      ];
      
      const day = dateObj.getDate();
      const month = uzbekMonths[dateObj.getMonth()];
      const year = dateObj.getFullYear();
      const hours = dateObj.getHours().toString().padStart(2, '0');
      const minutes = dateObj.getMinutes().toString().padStart(2, '0');
      
      return `${day} ${month} ${year} yil ${hours}:${minutes}`;
    }
    
    return dateObj.toLocaleDateString('ru-RU', {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("ru-RU", {
      style: "currency",
      currency: "UZS",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const OrderCard = ({ order }: { order: Order }) => {
    const StatusIcon = statusConfig[order.status].icon;

    return (
      <div className="card p-6 hover:shadow-lg transition-all duration-200 fade-in">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              {t('ordersPage.title')} #{order.order_number}
            </h3>
            <div className="flex items-center text-sm text-gray-500">
              <Calendar className="h-4 w-4 mr-1" />
              {formatDate(order.created_at)}
            </div>
          </div>
          <div className="flex flex-col items-end space-y-2">
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                statusConfig[order.status].color
              }`}
            >
              <StatusIcon className="h-3 w-3 mr-1" />
              {statusConfig[order.status].label}
            </span>
            <span className="text-lg font-bold text-gray-900">
              {formatPrice(order.total_amount)}
            </span>
          </div>
        </div>

        <div className="border-t pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <div className="flex items-center">
                <Package className="h-4 w-4 mr-1" />
                {order.items.length} товар(ов)
              </div>
              <div className="flex items-center">
                <CreditCard className="h-4 w-4 mr-1" />
                {order.payment_method}
              </div>
            </div>
            <button
              onClick={() => setSelectedOrder(order)}
              className="flex items-center space-x-1 px-3 py-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
            >
              <Eye className="h-4 w-4" />
              <span>Подробнее</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  const OrderModal = () => {
    if (!selectedOrder) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Заказ #{selectedOrder.order_number}
                </h2>
                <p className="text-gray-600 mt-1">
                  {formatDate(selectedOrder.created_at)}
                </p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Status */}
            <div className="flex items-center space-x-3">
              <span className="text-sm font-medium text-gray-700">Статус:</span>
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  statusConfig[selectedOrder.status].color
                }`}
              >
                {statusConfig[selectedOrder.status].label}
              </span>
            </div>

            {/* Shipping Address */}
            <div className="flex items-start space-x-3">
              <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <span className="text-sm font-medium text-gray-700">
                  Адрес доставки:
                </span>
                <p className="text-gray-600 mt-1">
                  {selectedOrder.shipping_address}
                </p>
              </div>
            </div>

            {/* Items */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Товары
              </h3>
              <div className="space-y-4">
                {selectedOrder.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg"
                  >
                    {item.slipper ? (
                      <Image
                        src={getFullImageUrl(
                          item.slipper.images?.[0]?.image_path || ""
                        )}
                        alt={item.slipper.name}
                        width={64}
                        height={64}
                        className="h-16 w-16 object-cover rounded-md"
                      />
                    ) : (
                      <div className="h-16 w-16 flex items-center justify-center bg-gray-200 rounded-md text-gray-400 text-2xl">
                        ?
                      </div>
                    )}
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">
                        {item.slipper?.name || "Неизвестно"}
                      </h4>
                      <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                        <span>Количество: {item.quantity}</span>
                        <span>
                          Цена: {formatPrice(item.unit_price ?? item.total_price ?? 0)}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-semibold text-gray-900">
                        {formatPrice((item.unit_price ?? 0) * (item.quantity ?? 0))}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Total */}
            <div className="border-t pt-4">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-gray-900">
                  Итого:
                </span>
                <span className="text-xl font-bold text-gray-900">
                  {formatPrice(selectedOrder.total_amount)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {t('ordersPage.authRequiredTitle')}
          </h1>
          <p className="text-gray-600">
            {t('ordersPage.authRequiredMessage')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('ordersPage.title')}</h1>
          <p className="text-gray-600">
            {t('ordersPage.subtitle')}
          </p>
        </div>
        <p className="text-lg text-gray-500 mb-6">{t('ordersPage.historyUnavailable')}</p>

        {/* Orders List */}
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="card p-6">
                <div className="skeleton h-6 w-48 mb-4"></div>
                <div className="skeleton h-4 w-32 mb-2"></div>
                <div className="skeleton h-4 w-64"></div>
              </div>
            ))}
          </div>
        ) : Array.isArray(filteredOrders) && filteredOrders.length > 0 ? (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {searchTerm || statusFilter !== "all"
                ? t('ordersPage.notFound')
                : t('ordersPage.noneYet')}
            </h2>
            <p className="text-gray-600 mb-6">
              {searchTerm || statusFilter !== "all"
                ? t('ordersPage.tryAdjustSearch')
                : t('ordersPage.startShopping')}
            </p>
            <button
              onClick={() => {
                if (searchTerm || statusFilter !== "all") {
                  setSearchTerm("");
                  setStatusFilter("all");
                } else {
                  router.push("/catalog");
                }
              }}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              {searchTerm || statusFilter !== "all"
                ? t('ordersPage.resetFilters')
                : t('ordersPage.goToCatalog')}
            </button>
          </div>
        )}
      </div>

      {/* Order Modal */}
      <OrderModal />
    </div>
  );
}
