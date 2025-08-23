"use client";

import React, { useState, useCallback, useMemo } from "react";
import Image from "next/image";
import { Slipper } from "@/types";
import { formatPrice } from "@/lib/utils";
import { ShoppingCart, Eye } from "lucide-react";

interface ProductCardProps {
  slipper: Slipper;
  onAddToCart?: (slipper: Slipper) => void;
  onViewDetails?: (slipper: Slipper) => void;
}

const ProductCard: React.FC<ProductCardProps> = React.memo(
  ({ slipper, onAddToCart, onViewDetails }) => {
    const [imageError, setImageError] = useState(false);

    // Memoize image URL calculation
    const imageUrl = useMemo(() => {
      let url = "/placeholder-product.svg";

      if (slipper.image) {
        // New API format: single image field
        url = slipper.image.startsWith("http")
          ? slipper.image
          : `https://oyoqkiyim.duckdns.org${slipper.image}`;
      } else if (slipper.images && slipper.images.length > 0) {
        // Old API format: images array
        const primaryImage = slipper.images.find((img) => img.is_primary);
        const fallbackImage = slipper.images[0];
        const rawImageUrl = primaryImage?.image_url || fallbackImage?.image_url;

        if (rawImageUrl) {
          url = rawImageUrl.startsWith("http")
            ? rawImageUrl
            : `https://oyoqkiyim.duckdns.org${rawImageUrl}`;
        }
      }

      return url;
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

    return (
      <div
        className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 cursor-pointer"
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
          {!imageError && imageUrl !== "/placeholder-product.svg" ? (
            <Image
              src={imageUrl}
              alt={slipper.name}
              fill
              className="object-cover"
              onError={handleImageError}
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
              {onAddToCart && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddToCart();
                  }}
                  disabled={!availabilityInfo.isAvailable}
                  className="p-2 bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-lg transition-colors"
                  title="В корзину (минимум 50, шаг 5)"
                >
                  <ShoppingCart className="h-5 w-5" />
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
