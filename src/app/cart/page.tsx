"use client";

import React from "react";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
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
} from "lucide-react";
import { toast } from "react-toastify";

export default function CartPage() {
  const {
    items,
    itemCount,
    totalAmount,
    updateQuantity,
    removeFromCart,
    clearCart,
  } = useCart();
  const { isAuthenticated } = useAuth();

  const handleCheckout = () => {
    if (!isAuthenticated) {
      toast.error("Для оформления заказа необходимо войти в систему");
      return;
    }

    toast.info("Функция оформления заказа будет доступна в ближайшее время");
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <ShoppingBag className="h-24 w-24 text-gray-400 mx-auto mb-6" />
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Ваша корзина пуста
            </h1>
            <p className="text-gray-600 mb-8">
              Добавьте товары из каталога, чтобы начать покупки
            </p>
            <Link
              href="/catalog"
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Перейти к покупкам
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
            Продолжить покупки
          </Link>
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <ShoppingCart className="h-8 w-8 mr-3" />
              Корзина ({itemCount} товаров)
            </h1>
              <button className="flex items-center bg-blue-100 text-blue-900 px-4 py-2 rounded-lg font-semibold text-lg mb-6">
                <ShoppingCart className="mr-2" /> Мои заказы
              </button>
            <button
              onClick={clearCart}
              className="text-red-600 hover:text-red-800 hover:bg-red-50 px-3 py-1 rounded-md font-medium transition-colors"
            >
              Очистить корзину
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm">
              {items.map((item, index) => (
                <div
                  key={`${item.id}-${item.size}-${item.color}`}
                  className={`p-6 ${
                    index !== items.length - 1 ? "border-b border-gray-200" : ""
                  }`}
                >
                  <div className="flex items-start space-x-4">
                    {/* Product Image */}
                    <div className="flex-shrink-0">
                      <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center border border-blue-100">
                        {item.images && item.images.length > 0 && item.images[0].image_url ? (
                          <Image
                            src={item.images[0].image_url}
                            alt={item.name}
                            width={96}
                            height={96}
                            className="w-full h-full object-contain bg-white"
                            onError={e => { e.currentTarget.style.display = 'none'; }}
                            priority
                          />
                        ) : (
                          <ShoppingBag className="h-10 w-10 text-blue-200" />
                        )}
                      </div>
                    </div>

                    {/* Product Details */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {item.name}
                      </h3>
                      {(item.size || item.color) && (
                        <div className="text-sm text-gray-600 mb-2">
                          {item.size && <span>Размер: {item.size}</span>}
                          {item.size && item.color && <span> • </span>}
                          {item.color && <span>Цвет: {item.color}</span>}
                        </div>
                      )}
                      <p className="text-xl font-bold text-blue-600 mb-4">
                        {item.price.toLocaleString()} сум
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
                        {(item.price * item.quantity).toLocaleString()} сум
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
                Итого по заказу
              </h2>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-600">
                    Товары ({itemCount} шт.)
                  </span>
                  <span className="font-semibold">
                    {totalAmount.toLocaleString()} сум
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
                    <span className="text-lg font-bold">Общая сумма</span>
                    <span className="text-lg font-bold text-blue-600">
                      {totalAmount.toLocaleString()} сум
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleCheckout}
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center"
              >
                <CreditCard className="h-5 w-5 mr-2" />
                Оформить заказ
              </button>

              {!isAuthenticated && (
                <p className="text-sm text-gray-600 text-center mt-4">
                  <Link
                    href="/auth/login"
                    className="text-blue-600 hover:underline"
                  >
                    Войдите в систему
                  </Link>{" "}
                  для оформления заказа
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
