"use client";

import React, { useState, useCallback, useMemo } from "react";
import Image from "next/image";
import { Slipper } from "@/types";
import { formatPrice, getFullImageUrl } from "@/lib/utils";
import { ShoppingCart, Check } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";

interface ProductCardProps {
  slipper: Slipper;
  onAddToCart?: (slipper: Slipper) => void;
  onViewDetails?: (slipper: Slipper) => void;
}

const ProductCard: React.FC<ProductCardProps> = React.memo(
  ({ slipper, onAddToCart, onViewDetails }) => {
    const [imageError, setImageError] = useState(false);
  const { user } = useAuth();
  const { isInCart, getCartItem } = useCart();
  const isAdmin = !!user?.is_admin;

    // Memoize image URL calculation
    const imageUrl = useMemo(() => {
      if (slipper.image) {
        // New API format: single image field
        return getFullImageUrl(slipper.image);
      } else if (slipper.images && slipper.images.length > 0) {
        // Old API format: images array
        const primaryImage = slipper.images.find((img) => img.is_primary);
        const fallbackImage = slipper.images[0];
        const rawImageUrl = primaryImage?.image_url || fallbackImage?.image_url;

        if (rawImageUrl) {
          return getFullImageUrl(rawImageUrl);
        }
      }

      return "/placeholder-product.svg";
    }, [slipper.image, slipper.images]);

    // Memoize availability info
    const availabilityInfo = useMemo(
      () => ({
        isAvailable: slipper.quantity > 0,
        displayText:
          slipper.quantity > 0
            ? `В наличии: ${slipper.quantity}`
            : "Нет в наличии",
      }),
      [slipper.quantity]
    );

    // Memoize formatted price
    const formattedPrice = useMemo(
      () => formatPrice(slipper.price),
      [slipper.price]
    );

    // Optimize callbacks with useCallback
    const handleImageError = useCallback(() => {
      setImageError(true);
    }, []);

    const handleAddToCart = useCallback(() => {
      if (onAddToCart) {
        onAddToCart(slipper);
      }
    }, [onAddToCart, slipper]);

    const handleViewDetails = useCallback(() => {
      if (onViewDetails) {
        onViewDetails(slipper);
      }
    }, [onViewDetails, slipper]);

    const inCart = useMemo(() => isInCart(slipper.id), [isInCart, slipper.id]);
    const cartItem = useMemo(() => (inCart ? getCartItem(slipper.id) : undefined), [inCart, getCartItem, slipper.id]);

    return (
      <div
        className={
          `relative bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer border ${
            inCart ? "border-blue-500 ring-1 ring-blue-400/50" : "border-transparent"
          }`
        }
        onClick={onViewDetails ? handleViewDetails : undefined}
        tabIndex={onViewDetails ? 0 : undefined}
        role={onViewDetails ? "button" : undefined}
        onKeyPress={
          onViewDetails
            ? (e) => {
                if (e.key === "Enter" || e.key === " ") handleViewDetails();
              }
            : undefined
        }
      >
        <div className="relative h-48 bg-gray-200">
          {inCart && (
            <div className="absolute top-2 left-2 z-10 bg-blue-600 text-white text-[11px] font-semibold px-2 py-1 rounded-md shadow-sm flex items-center space-x-1">
              <Check className="h-3.5 w-3.5" />
              <span>В корзине{cartItem ? `: ${cartItem.quantity}` : ""}</span>
            </div>
          )}
          {!imageError && imageUrl !== "/placeholder-product.svg" ? (
            <Image
              src={imageUrl}
              alt={slipper.name}
              fill
              className="object-cover"
              onError={handleImageError}
              loading="lazy"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-100">
              <div className="text-center text-gray-500">
                <div className="text-4xl mb-2">👟</div>
                <div className="text-sm">Изображение недоступно</div>
              </div>
            </div>
          )}
          {!availabilityInfo.isAvailable && (
            <div className="absolute inset-0 bg-white bg-opacity-85 flex items-center justify-center">
              <span className="text-gray-700 font-semibold bg-white px-3 py-1 rounded-lg shadow-sm border">
                Нет в наличии
              </span>
            </div>
          )}
        </div>

        <div className="p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
            {slipper.name}
          </h3>

          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">
              Размер: {slipper.size}
            </span>
            <span className="text-sm text-gray-600">
              {availabilityInfo.displayText}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xl font-bold text-blue-600">
              {formattedPrice}
            </span>
            <div className="flex space-x-2">
              {onAddToCart && !isAdmin && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddToCart();
                  }}
                  disabled={!availabilityInfo.isAvailable}
                  className={`p-2 rounded-lg transition-colors flex items-center justify-center ${
                    inCart
                      ? "bg-green-600 text-white hover:bg-green-700"
                      : "bg-blue-600 text-white hover:bg-blue-700"
                  } disabled:bg-gray-300 disabled:cursor-not-allowed`}
                  title={
                    inCart
                      ? "Товар уже в корзине. Нажмите чтобы добавить ещё"
                      : "В корзину (минимум 50, шаг 5)"
                  }
                >
                  {inCart ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <ShoppingCart className="h-5 w-5" />
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
);

ProductCard.displayName = "ProductCard";

export default ProductCard;
