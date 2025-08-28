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
} from "lucide-react";
import { toast } from "react-toastify";
import { useI18n } from "@/i18n";

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
        console.error("Failed to load image:", fullImageUrl);
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

    setIsProcessingPayment(true);

    try {
      const orderId = PaymentService.generateOrderId();
      const { success_url, fail_url } = PaymentService.getReturnUrls();
      
      const description = t('payment.orderDescription', {
        itemCount: String(itemCount),
        customerName: user?.name || 'Customer'
      });

      const paymentRequest = {
        order_id: orderId,
        amount: PaymentService.formatAmount(totalAmount),
        description,
        success_url: `${success_url}?order_id=${orderId}`,
        fail_url: `${fail_url}?order_id=${orderId}`,
        expires_in_minutes: 30,
        card_systems: ['uzcard', 'humo', 'visa', 'mastercard']
      };

      const paymentResponse = await PaymentService.createPayment(paymentRequest);
      
      if (paymentResponse.payment_url) {
        // Redirect to payment gateway
        window.location.href = paymentResponse.payment_url;
      } else {
        throw new Error('Payment URL not received');
      }
    } catch (error) {
      console.error('Payment initiation failed:', error);
      toast.error(error instanceof Error ? error.message : t('payment.error.initiation'));
    } finally {
      setIsProcessingPayment(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <ShoppingBag className="h-24 w-24 text-gray-400 mx-auto mb-6" />
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {t('cartPage.emptyTitle')}
            </h1>
            <p className="text-gray-600 mb-8">
              {t('cartPage.emptySubtitle')}
            </p>
            <Link
              href="/catalog"
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              {t('cartPage.continueShopping')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link
            href="/catalog"
            className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            {t('cartPage.continue')}
          </Link>
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <ShoppingCart className="h-8 w-8 mr-3" />
              {t('cartPage.heading')} ({t('cartPage.itemsCount', { count: String(itemCount) })})
            </h1>
            <button className="flex items-center bg-blue-100 text-blue-900 px-4 py-2 rounded-lg font-semibold text-lg mb-6">
              <ShoppingCart className="mr-2" /> {t('home.myOrders')}
            </button>
            <button
              onClick={clearCart}
              className="text-red-600 hover:text-red-800 hover:bg-red-50 px-3 py-1 rounded-md font-medium transition-colors"
            >
              {t('cartPage.clear')}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm">
              {items.map((item, index) => (
                <div
                  key={`${item.id}-${item.size || 'no-size'}-${item.color || 'no-color'}-${index}`}
                  className={`p-6 ${
                    index !== items.length - 1 ? "border-b border-gray-200" : ""
                  }`}
                >
                  <div className="flex items-start space-x-4">
                    {/* Product Image */}
                    <div className="flex-shrink-0">
                      <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center border border-blue-100">
                        <ProductImage item={item} />
                      </div>
                    </div>

                    {/* Product Details */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {item.name}
                      </h3>
                      {(item.size || item.color) && (
                        <div className="text-sm text-gray-600 mb-2">
                          {item.size && <span>{t('product.size')}: {item.size}</span>}
                          {item.size && item.color && <span> • </span>}
                          {item.color && <span>{t('cartPage.color')}: {item.color}</span>}
                        </div>
                      )}
                      <p className="text-xl font-bold text-blue-600 mb-4">
                        {formatPrice(item.price, t('common.currencySom'))}
                      </p>

                      {/* Quantity Controls */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() =>
                              updateQuantity(item.id, item.quantity - 5)
                            }
                            className="p-1 rounded-md border border-gray-300 hover:bg-gray-50 hover:border-gray-400 text-gray-700 hover:text-gray-900 transition-colors"
                            disabled={item.quantity <= 50}
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <span className="w-12 text-center font-semibold text-gray-900">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              updateQuantity(item.id, item.quantity + 5)
                            }
                            className="p-1 rounded-md border border-gray-300 hover:bg-gray-50 hover:border-gray-400 text-gray-700 hover:text-gray-900 transition-colors"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-red-600 hover:text-red-700 p-2 rounded-md hover:bg-red-50"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </div>

                    {/* Item Total */}
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900">
                        {formatPrice(item.price * item.quantity, t('common.currencySom'))}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                {t('cartPage.orderSummary')}
              </h2>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-600">
                    {t('cartPage.productsLine', { count: String(itemCount) })}
                  </span>
                  <span className="font-semibold">
                    {formatPrice(totalAmount, t('common.currencySom'))}
                  </span>
                </div>
                {/* <div className="flex justify-between">
                  <span className="text-gray-600">Доставка</span>
                  <span className="font-semibold text-green-600">
                    Бесплатно
                  </span>
                </div> */}
                <div className="border-t pt-3">
                  <div className="flex justify-between">
                    <span className="text-lg font-bold">{t('cartPage.total')}</span>
                    <span className="text-lg font-bold text-blue-600">
                      {formatPrice(totalAmount, t('common.currencySom'))}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleCheckout}
                disabled={isProcessingPayment}
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
              >
                {isProcessingPayment ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    {t('payment.processing')}
                  </>
                ) : (
                  <>
                    <CreditCard className="h-5 w-5 mr-2" />
                    {t('cartPage.checkout')}
                  </>
                )}
              </button>

              {!isAuthenticated && (
                <p className="text-sm text-gray-600 text-center mt-4">
                  <Link
                    href="/auth/login"
                    className="text-blue-600 hover:underline"
                  >
                    {t('cartPage.loginForCheckout')}
                  </Link>{' '}
                  {t('cartPage.loginForCheckoutSuffix')}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
