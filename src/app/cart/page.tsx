"use client";

import React, { useState } from "react";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { getFullImageUrl, formatPrice } from "@/lib/utils";
import { PaymentService } from "@/services/paymentService";
import Link from "next/link";
import Image from "next/image";
import {
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  ArrowLeft,
  CreditCard,
  ShoppingCart,
  Loader2,
  Package,
} from "lucide-react";
import { toast } from "react-toastify";
import { useI18n } from "@/i18n";
import { modernApiClient } from "@/lib/modernApiClient";
import { API_ENDPOINTS } from "@/lib/constants";
import { CreateOrderRequest, Order } from "@/types";
import { OrderBatchManager } from "../../lib/orderBatchManager";

// Component for handling product images with error fallback
const ProductImage = ({
  item,
}: {
  item: { images?: { image_url: string }[]; image?: string; name: string };
}) => {
  const [imageError, setImageError] = useState(false);
  const { t } = useI18n();

  // Get the image URL
  let imageUrl = "";
  if (item.images && item.images.length > 0 && item.images[0].image_url) {
    imageUrl = item.images[0].image_url;
  } else if (item.image) {
    imageUrl = item.image;
  }

  if (!imageUrl || imageError) {
    return (
      <div className="w-full h-full bg-gray-200 flex items-center justify-center">
        <span className="text-gray-400 text-xs text-center">
          {t('common.imageUnavailable')}
        </span>
      </div>
    );
  }

  const fullImageUrl = getFullImageUrl(imageUrl);

  return (
    <Image
      src={fullImageUrl}
      alt={item.name}
      width={96}
      height={96}
      className="w-full h-full object-contain bg-white"
      onError={() => {
        setImageError(true);
      }}
      priority
    />
  );
};

export default function CartPage() {
  const {
    items,
    itemCount,
    totalAmount,
    updateQuantity,
    removeFromCart,
    clearCart,
  } = useCart();
  const { isAuthenticated, user } = useAuth();
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [offerAccepted, setOfferAccepted] = useState(false);

  const { t } = useI18n();

  const handleCheckout = async () => {
    if (!isAuthenticated) {
      toast.error(t('auth.login'));
      return;
    }

    if (items.length === 0) {
      toast.error(t('cartPage.emptyCart'));
      return;
    }

    if (!offerAccepted) {
      toast.error(t('offer.mustAccept'));
      return;
    }

    setIsProcessingPayment(true);

    try {
      // Calculate total quantity to determine if batching is needed
      const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
      
      // Step 1: Create the order(s) - use batching for large quantities
      const orderItems = items.map(item => ({
        slipper_id: item.id,
        quantity: item.quantity,
        unit_price: item.price,
        notes: `${item.size ? `Size: ${item.size}` : ''}${item.color ? `, Color: ${item.color}` : ''}`.trim()
      }));
      
      const createOrderRequest: CreateOrderRequest = {
        user_id: user?.id,
        items: orderItems,
        notes: `Order created for payment`,
        payment_method: 'OCTO',
        status: 'CREATED'
      };

      // Validate order data before processing
      if (!orderItems || orderItems.length === 0) {
        throw new Error('No items to order');
      }
      
      // Check for any invalid quantities
      const invalidItems = orderItems.filter(item => item.quantity <= 0 || !Number.isFinite(item.quantity));
      if (invalidItems.length > 0) {
        throw new Error(`Invalid quantities found in ${invalidItems.length} items`);
      }
      
      let createdOrders: Order[];
      
      // Use batching if total quantity > 120 to avoid 422 errors
      if (totalQuantity > 120) {
        // Conservative config to ensure no backend limits are hit
        const batchConfig = {
          maxTotalQuantityPerBatch: 100, // Even more conservative than 120
        };
        
        try {
          // Show single notification for batch processing
          toast.info(t('cartPage.batchProcessingStart', { total: String(Math.ceil(totalQuantity / 100)) }));
          
          const batchResult = await OrderBatchManager.processOrder(
            createOrderRequest,
            batchConfig,
            (current: number, total: number, batch: CreateOrderRequest) => {
              // Only log to console, don't show toast for each batch
            }
          );
          
          if (!batchResult.success || batchResult.orders.length === 0) {
            const errorMsg = batchResult.errors.length > 0 
              ? batchResult.errors.map((e: any) => `Batch ${e.batch}: ${e.error}`).join('; ')
              : 'Unknown error during batch processing';
            throw new Error(`Failed to create orders: ${errorMsg}`);
          }
          
          createdOrders = batchResult.orders;
          
          // Show success notification
          toast.success(t('cartPage.batchProcessingSuccess', { count: String(createdOrders.length) }));
        } catch (batchError) {
          // Fallback: try with even smaller batches (50 items per batch)
          const fallbackConfig = {
            maxTotalQuantityPerBatch: 50,
          };
          
          try {
            // Show single notification for fallback processing
            toast.info(t('cartPage.batchProcessingFallback', { total: String(Math.ceil(totalQuantity / 50)) }));
            
            const fallbackResult = await OrderBatchManager.processOrder(
              createOrderRequest,
              fallbackConfig,
              (current: number, total: number, batch: CreateOrderRequest) => {
                // Only log to console, don't show toast for each batch
              }
            );
            
            if (!fallbackResult.success || fallbackResult.orders.length === 0) {
              throw new Error('Fallback batch processing also failed');
            }
            
            createdOrders = fallbackResult.orders;
            
            // Show success notification
            toast.success(t('cartPage.batchProcessingSuccess', { count: String(createdOrders.length) }));
          } catch (fallbackError) {
            throw new Error(`All batch processing attempts failed: ${fallbackError instanceof Error ? fallbackError.message : String(fallbackError)}`);
          }
        }
      } else {
        // Single order for smaller quantities
        
        try {
          const orderResponse = await modernApiClient.post(API_ENDPOINTS.ORDERS, createOrderRequest);
          
          // Handle both envelope and direct response formats
          interface ApiEnvelope<T> { data?: T; items?: T; }
          const env = orderResponse as ApiEnvelope<Order> | Order;
          const rawOrder = (env as ApiEnvelope<Order>).data || (env as Order);
          
          // Transform the API response to match our Order interface
          interface ApiOrderResponse {
            id?: number;
            order_id?: string;
            user_id?: number;
            status?: string;
            total_amount?: number;
            notes?: string;
            payment_method?: string;
            items?: unknown[];
            created_at?: string;
            updated_at?: string;
          }
          
          const apiOrder = rawOrder as ApiOrderResponse;
          const createdOrder = {
            ...apiOrder,
            id: apiOrder.id || parseInt(apiOrder.order_id || '0', 10),
            order_id: apiOrder.order_id,
            user_id: apiOrder.user_id || user?.id || 0,
            items: apiOrder.items || [],
            created_at: apiOrder.created_at || new Date().toISOString(),
            updated_at: apiOrder.updated_at || apiOrder.created_at || new Date().toISOString(),
          } as Order;
          
          createdOrders = [createdOrder];
        } catch (orderError) {
          throw new Error(`Failed to create order: ${orderError instanceof Error ? orderError.message : String(orderError)}`);
        }
      }
      
      if (!createdOrders || createdOrders.length === 0) {
        throw new Error('Failed to create orders: No orders were created');
      }
      
      // For payment, we'll use the first order (main order)
      const mainOrder = createdOrders[0];
      if (!mainOrder.id && !mainOrder.order_id) {
        throw new Error('Failed to create order: Invalid response structure');
      }

      // Step 2: Create payment with the main order ID
      const description = createdOrders.length > 1 
        ? t('payment.batchOrderDescription', {
            itemCount: String(itemCount),
            customerName: user?.name || 'Customer',
            batchCount: String(createdOrders.length)
          })
        : t('payment.orderDescription', {
            itemCount: String(itemCount),
            customerName: user?.name || 'Customer'
          });

      const paymentRequest = {
        amount: PaymentService.formatAmount(totalAmount),
        description,
        order_id: mainOrder.id || parseInt(mainOrder.order_id || '0', 10)
      };

      const paymentResponse = await PaymentService.createPayment(paymentRequest);
      
      // Check for various possible URL field names  
      interface PaymentResponseExtended {
        url?: string;
        redirect_url?: string;
        payment_id?: string;
      }
      
      const extendedResponse = paymentResponse as PaymentResponseExtended;
      const paymentUrl = paymentResponse.octo_pay_url || 
                        paymentResponse.payment_url || 
                        paymentResponse.pay_url ||
                        extendedResponse.url ||
                        extendedResponse.redirect_url;
      
      if (paymentResponse.success && paymentUrl) {
        // Store order and payment info for status updates after payment
        const paymentData = {
          order_id: mainOrder.order_id || mainOrder.id,
          payment_id: paymentResponse.octo_payment_UUID || extendedResponse.payment_id,
          user_id: user?.id,
          payment_method: 'OCTO',
          created_at: new Date().toISOString(),
          // Store info about batch orders if applicable
          batch_info: createdOrders.length > 1 ? {
            total_orders: createdOrders.length,
            all_order_ids: createdOrders.map(o => o.id || o.order_id)
          } : undefined
        };
        
        sessionStorage.setItem('paymentOrder', JSON.stringify(paymentData));
        
        // Payment status will be handled by the webhook notification endpoint
        // The backend will automatically update order status when payment is completed
        // Redirect to payment gateway
        window.location.href = paymentUrl;
      } else {
        throw new Error(paymentResponse.errMessage || `Payment URL not received. Success: ${paymentResponse.success}, URL: ${paymentUrl}`);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('payment.error.initiation'));
    } finally {
      setIsProcessingPayment(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
          <div className="text-center">
            <ShoppingBag className="h-16 sm:h-20 lg:h-24 w-16 sm:w-20 lg:w-24 text-gray-400 mx-auto mb-4 sm:mb-6" />
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-3 sm:mb-4 px-4">
              {t('cartPage.emptyTitle')}
            </h1>
            <p className="text-sm sm:text-base text-gray-600 mb-6 sm:mb-8 px-4">
              {t('cartPage.emptySubtitle')}
            </p>
            <Link
              href="/catalog"
              className="inline-flex items-center px-4 sm:px-6 py-2 sm:py-3 bg-blue-600 text-white text-sm sm:text-base font-semibold rounded-lg hover:bg-blue-700 transition-colors"
            >
              <ArrowLeft className="h-4 sm:h-5 w-4 sm:w-5 mr-2" />
              {t('cartPage.continueShopping')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
        <div className="mb-6 sm:mb-8">
          <Link
            href="/catalog"
            className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-3 sm:mb-4 text-sm sm:text-base"
          >
            <ArrowLeft className="h-4 sm:h-5 w-4 sm:w-5 mr-1 sm:mr-2" />
            {t('cartPage.continue')}
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <h1 className="text-lg sm:text-2xl lg:text-3xl font-bold text-gray-900 flex items-center leading-tight">
              <ShoppingCart className="h-5 sm:h-6 lg:h-8 w-5 sm:w-6 lg:w-8 mr-2 sm:mr-3 flex-shrink-0" />
              <span className="break-words">
                {t('cartPage.heading')} ({t('cartPage.itemsCount', { count: String(itemCount) })})
              </span>
            </h1>
            <button
              onClick={clearCart}
              className="bg-red-600 text-white hover:bg-red-500 px-3 py-1.5 sm:py-1 rounded-md text-sm font-medium transition-colors flex-shrink-0 self-start sm:self-auto"
            >
              {t('cartPage.clear')}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm">
              {items.map((item, index) => (
                <div
                  key={`${item.id}-${item.size || 'no-size'}-${item.color || 'no-color'}-${index}`}
                  className={`p-3 sm:p-4 lg:p-6 ${
                    index !== items.length - 1 ? "border-b border-gray-200" : ""
                  }`}
                >
                  <div className="flex items-start space-x-3 sm:space-x-4">
                    {/* Product Image */}
                    <div className="flex-shrink-0">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 bg-gray-100 rounded-md sm:rounded-lg overflow-hidden flex items-center justify-center border border-blue-100">
                        <ProductImage item={item} />
                      </div>
                    </div>

                    {/* Product Details */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 mb-1 leading-tight break-words">
                        {item.name}
                      </h3>
                      {(item.size || item.color) && (
                        <div className="text-xs sm:text-sm text-gray-600 mb-2">
                          {item.size && <span>{t('product.size')}: {item.size}</span>}
                          {item.size && item.color && <span> • </span>}
                          {item.color && <span>{t('cartPage.color')}: {item.color}</span>}
                        </div>
                      )}
                      <p className="text-base sm:text-lg lg:text-xl font-bold text-blue-600 mb-3 sm:mb-4 break-words">
                        {formatPrice(item.price, t('common.currencySom'))}
                      </p>

                      {/* Quantity Controls */}
                      <div className="flex items-center">
                        <div className="flex items-center space-x-1 sm:space-x-2">
                          <button
                            onClick={() =>
                              updateQuantity(item.id, item.quantity - 6)
                            }
                            className="p-1 rounded-md border border-gray-300 hover:bg-gray-50 hover:border-gray-400 text-gray-700 hover:text-gray-900 transition-colors"
                            disabled={item.quantity <= 60}
                          >
                            <Minus className="h-3 sm:h-4 w-3 sm:w-4" />
                          </button>
                          <span className="w-8 sm:w-12 text-center text-sm sm:text-base font-semibold text-gray-900">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              updateQuantity(item.id, item.quantity + 6)
                            }
                            className="p-1 rounded-md border border-gray-300 hover:bg-gray-50 hover:border-gray-400 text-gray-700 hover:text-gray-900 transition-colors"
                          >
                            <Plus className="h-3 sm:h-4 w-3 sm:w-4" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Item Total & Remove */}
                    <div className="flex flex-col items-end justify-between ml-2 sm:ml-auto">
                      <p className="text-sm sm:text-base lg:text-lg font-bold text-gray-900 mb-2 break-words text-right">
                        {formatPrice(item.price * item.quantity, t('common.currencySom'))}
                      </p>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-red-600 hover:text-red-700 p-1 sm:p-2 rounded-md hover:bg-red-50"
                        aria-label="Remove from cart"
                      >
                        <Trash2 className="h-4 sm:h-5 w-4 sm:w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 lg:sticky lg:top-8">

              <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
                {/* <div className="flex justify-between items-start">
                </div> */}
                  <div className="flex justify-between items-start">
                    <span className="text-base sm:text-lg font-bold">{t('cartPage.total')}</span>
                    <span className="text-base sm:text-lg font-bold text-blue-600 break-words text-right">
                      {formatPrice(totalAmount, t('common.currencySom'))}
                    </span>
                </div>
              </div>

              {/* Offer acceptance */}
              <div className="mb-4 sm:mb-5 rounded-md border border-gray-200 bg-gray-50 p-3 sm:p-4">
                <label className="flex items-start gap-2 sm:gap-3 cursor-pointer select-none">
                  <input
                    id="offer-accept"
                    type="checkbox"
                    className="mt-0.5 h-4 w-4 sm:h-5 sm:w-5 rounded border-gray-300 text-green-600 accent-green-600 flex-shrink-0"
                    checked={offerAccepted}
                    onChange={(e) => setOfferAccepted(e.target.checked)}
                  />
                  <span className="text-xs sm:text-sm text-gray-700 leading-5">
                    {t('offer.acceptLabel')}
                    {" "}
                    <a
                      href="/offer"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700 underline break-words"
                    >
                      ({t('offer.viewLink')})
                    </a>
                  </span>
                </label>
              </div>

              <button
                onClick={handleCheckout}
                disabled={isProcessingPayment || !offerAccepted}
                className="w-full bg-blue-600 text-white py-2.5 sm:py-4 px-4 sm:px-6 rounded-lg text-sm sm:text-base font-semibold hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
              >
                {isProcessingPayment ? (
                  <>
                    <Loader2 className="h-4 sm:h-5 w-4 sm:w-5 mr-2 animate-spin" />
                    <span className="truncate">{t('payment.processing')}</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="h-4 sm:h-5 w-4 sm:w-5 mr-2 flex-shrink-0" />
                    <span className="truncate">{t('cartPage.checkout')}</span>
                  </>
                )}
              </button>

              {!isAuthenticated && (
                <p className="text-xs sm:text-sm text-gray-600 text-center mt-3 sm:mt-4 leading-5">
                  <Link
                    href="/auth/login"
                    className="text-blue-600 hover:underline break-words"
                  >
                    {t('cartPage.loginForCheckout')}
                  </Link>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
