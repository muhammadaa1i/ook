"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "react-toastify";
import modernApiClient from "@/lib/modernApiClient";
import { API_ENDPOINTS } from "@/lib/constants";
import { Slipper } from "@/types";
import { useCart } from "@/contexts/CartContext";
import { formatPrice, getFullImageUrl } from "@/lib/utils";
import { ArrowLeft, ShoppingCart, Minus, Plus } from "lucide-react";
import { ProductDetailSkeleton } from "@/components/ui/skeleton";

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { addToCart, isInCart, getCartItem } = useCart();
  const [product, setProduct] = useState<Slipper | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [imageError, setImageError] = useState(false);

  const productId = params.id as string;

  useEffect(() => {
    if (productId) {
      fetchProduct();
    }
  }, [productId]);

  const fetchProduct = async () => {
    try {
      setIsLoading(true);
      const response = await modernApiClient.get(
        API_ENDPOINTS.SLIPPER_BY_ID(Number(productId))
      );
      const productData = response?.data || response;
      setProduct(productData);
      setHasError(false);
    } catch (error: unknown) {
      console.error("Error fetching product:", error);
      setHasError(true);

      const axiosError = error as { response?: { status?: number } };
      if (axiosError.response?.status === 503) {
        toast.error("Сервер временно недоступен. Попробуйте позже.");
      } else if (axiosError.response?.status === 404) {
        toast.error("Товар не найден");
      } else if (
        axiosError.response?.status &&
        axiosError.response.status >= 500
      ) {
        toast.error("Ошибка сервера. Попробуйте позже.");
      } else {
        toast.error("Ошибка загрузки товара");
      }
    } finally {
      setIsLoading(false);
    }
  };
  const handleQuantityChange = (delta: number) => {
    const newQuantity = quantity + delta;
    if (newQuantity >= 1 && newQuantity <= (product?.quantity || 0)) {
      setQuantity(newQuantity);
    }
  };

  const handleAddToCart = () => {
    if (product) {
      addToCart(product, quantity);
    }
  };

  if (isLoading) {
    return <ProductDetailSkeleton />;
  }

  if (hasError || !product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Товар не найден
          </h1>
          <button
            onClick={() => router.push("/catalog")}
            className="text-blue-600 hover:text-blue-800"
          >
            Вернуться к каталогу
          </button>
        </div>
      </div>
    );
  }

  // Handle image URL construction
  let imageUrl = "/placeholder-product.svg";
  if (product.image) {
    imageUrl = getFullImageUrl(product.image);
  } else if (product.images && product.images.length > 0) {
    const primaryImage = product.images.find((img) => img.is_primary);
    const fallbackImage = product.images[0];
    const rawImageUrl = primaryImage?.image_url || fallbackImage?.image_url;

    if (rawImageUrl) {
      imageUrl = getFullImageUrl(rawImageUrl);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Назад
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Product Image */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="relative h-96 bg-gray-200">
              {!imageError && imageUrl !== "/placeholder-product.svg" ? (
                <Image
                  src={imageUrl}
                  alt={product.name}
                  fill
                  className="object-cover"
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-100">
                  <div className="text-center text-gray-500">
                    <div className="text-6xl mb-4">👟</div>
                    <div className="text-lg">Изображение недоступно</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Product Details */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {product.name}
            </h1>

            <div className="space-y-4 mb-6">
              <div className="flex items-center justify-between">
                <span className="text-lg text-gray-600">Размер:</span>
                <span className="text-lg font-medium text-gray-900">
                  {product.size}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-lg text-gray-600">Цена:</span>
                <span className="text-2xl font-bold text-blue-600">
                  {formatPrice(product.price)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-lg text-gray-600">В наличии:</span>
                <span
                  className={`text-lg font-medium ${
                    product.quantity > 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {product.quantity > 0
                    ? `${product.quantity} шт.`
                    : "Нет в наличии"}
                </span>
              </div>

              {product.category_name && (
                <div className="flex items-center justify-between">
                  <span className="text-lg text-gray-600">Категория:</span>
                  <span className="text-lg font-medium text-gray-900">
                    {product.category_name}
                  </span>
                </div>
              )}
            </div>

            {/* Quantity selector and Add to Cart */}
            {product.quantity > 0 && (
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <span className="text-lg text-gray-600">Количество:</span>
                  <div className="flex items-center border border-gray-300 rounded-md">
                    <button
                      onClick={() => handleQuantityChange(-1)}
                      disabled={quantity <= 1}
                      className="p-2 hover:bg-gray-100 disabled:opacity-50 text-gray-700"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="px-4 py-2 font-medium text-gray-900 bg-gray-50">
                      {quantity}
                    </span>
                    <button
                      onClick={() => handleQuantityChange(1)}
                      disabled={quantity >= product.quantity}
                      className="p-2 hover:bg-gray-100 disabled:opacity-50 text-gray-700"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleAddToCart}
                  className="w-full bg-blue-500 text-white py-3 px-6 rounded-md hover:bg-blue-600 transition-colors duration-200 flex items-center justify-center space-x-2 shadow-sm"
                >
                  <ShoppingCart className="h-5 w-5" />
                  <span>Добавить в корзину</span>
                </button>
              </div>
            )}

            {product.quantity === 0 && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-800 font-medium">
                  Товар временно отсутствует в наличии
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Additional product information */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Описание товара
          </h2>
          <div className="prose max-w-none">
            <p className="text-gray-700">
              Качественные домашние тапочки &quot;{product.name}&quot; размера{" "}
              {product.size}. Удобные и практичные, идеально подходят для дома.
            </p>
            <ul className="mt-4 space-y-2 text-gray-700">
              <li>• Высокое качество материалов</li>
              <li>• Комфортная посадка</li>
              <li>• Долговечность и износостойкость</li>
              <li>• Легкость в уходе</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
