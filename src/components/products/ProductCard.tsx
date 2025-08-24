"use client";

import React, { useState, useCallback, useMemo, useEffect, useRef } from "react";
import Image from "next/image";
import { Slipper } from "@/types";
import { formatPrice, getFullImageUrl } from "@/lib/utils";
import { ShoppingCart, Check } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { toast } from "react-toastify";
import { useI18n } from "@/i18n";


interface ProductCardProps {
  slipper: Slipper;
  onAddToCart?: (slipper: Slipper) => void;
  onViewDetails?: (slipper: Slipper) => void;
}

const ProductCard: React.FC<ProductCardProps> = React.memo(
  ({ slipper, onAddToCart, onViewDetails }) => {
  const [imageError, setImageError] = useState(false);
  const { t } = useI18n();
  const { user } = useAuth();
  const { isInCart, getCartItem, addToCart } = useCart();
  const isAdmin = !!user?.is_admin;

    // Build list of image URLs for carousel (primary first)
    const imageUrls = useMemo(() => {
      const urls: string[] = [];
      if (slipper.images && slipper.images.length > 0) {
        const primary = slipper.images.find((i) => i.is_primary);
        if (primary) urls.push(getFullImageUrl(primary.image_url));
        slipper.images.forEach((img) => {
          const full = getFullImageUrl(img.image_url);
            if (!urls.includes(full)) urls.push(full);
        });
      } else if (slipper.image) {
        urls.push(getFullImageUrl(slipper.image));
      }
      if (!urls.length) urls.push("/placeholder-product.svg");
      return urls;
    }, [slipper.images, slipper.image]);

    const [activeIndex, setActiveIndex] = useState(0);
    useEffect(() => {
      if (activeIndex >= imageUrls.length) setActiveIndex(0);
    }, [imageUrls.length, activeIndex]);

    // Simple auto-advance (pause when only one image or on error)
    const autoplayRef = useRef<NodeJS.Timeout | null>(null);
    useEffect(() => {
      if (imageUrls.length < 2) return;
      if (autoplayRef.current) clearInterval(autoplayRef.current);
      autoplayRef.current = setInterval(() => {
        setActiveIndex((i) => (i + 1) % imageUrls.length);
      }, 4000);
      return () => {
        if (autoplayRef.current) clearInterval(autoplayRef.current);
      };
    }, [imageUrls.length]);

    const goPrev = useCallback((e?: React.MouseEvent) => {
      if (e) e.stopPropagation();
      if (imageUrls.length < 2) return;
      setActiveIndex((i) => (i - 1 + imageUrls.length) % imageUrls.length);
    }, [imageUrls.length]);

    const goNext = useCallback((e?: React.MouseEvent) => {
      if (e) e.stopPropagation();
      if (imageUrls.length < 2) return;
      setActiveIndex((i) => (i + 1) % imageUrls.length);
    }, [imageUrls.length]);

    // Memoize availability info
    const availabilityInfo = useMemo(
      () => ({
        isAvailable: slipper.quantity > 0,
        displayText:
          slipper.quantity > 0
            ? t('product.availableQuantity', { count: slipper.quantity.toString() })
            : t('product.notAvailable'),
      }),
      [slipper.quantity, t]
    );

    // Memoize formatted price
    const formattedPrice = useMemo(
      () => formatPrice(slipper.price, t('common.currencySom')),
      [slipper.price, t]
    );

    // Optimize callbacks with useCallback
    const handleImageError = useCallback(() => {
      setImageError(true);
    }, []);

    const handleAddToCart = useCallback(() => {
      // Always add min 50 or step of 5
      addToCart(slipper, 50);
      if (onAddToCart) onAddToCart(slipper);
      toast.success(`${slipper.name} +50`);
    }, [addToCart, onAddToCart, slipper]);

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
              <span>{t('cart.inCart')}{cartItem ? `: ${cartItem.quantity}` : ""}</span>
            </div>
          )}
          {!imageError && imageUrls[activeIndex] !== "/placeholder-product.svg" ? (
            <>
              <Image
                key={imageUrls[activeIndex]}
                src={imageUrls[activeIndex]}
                alt={slipper.name}
                fill
                className="object-cover transition-opacity duration-300"
                onError={handleImageError}
                loading="lazy"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
              />
              {imageUrls.length > 1 && (
                <>
                  <button
                    onClick={goPrev}
                    aria-label="Previous image"
                    className="absolute left-1 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full p-1.5 backdrop-blur-sm focus:outline-none"
                  >
                    ‹
                  </button>
                  <button
                    onClick={goNext}
                    aria-label="Next image"
                    className="absolute right-1 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full p-1.5 backdrop-blur-sm focus:outline-none"
                  >
                    ›
                  </button>
                  <div className="absolute bottom-2 left-0 right-0 flex items-center justify-center gap-1">
                    {imageUrls.map((_, i) => (
                      <button
                        key={i}
                        aria-label={`Go to image ${i + 1}`}
                        onClick={(e) => { e.stopPropagation(); setActiveIndex(i); }}
                        className={`h-1.5 rounded-full transition-all ${i === activeIndex ? 'bg-white w-4' : 'bg-white/50 w-2'}`}
                        style={{ lineHeight: 0 }}
                      />
                    ))}
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-100">
              <div className="text-center text-gray-500">
                <div className="text-4xl mb-2">👟</div>
                <div className="text-sm">{t('common.imageUnavailable')}</div>
              </div>
            </div>
          )}
          {!availabilityInfo.isAvailable && (
            <div className="absolute inset-0 bg-white bg-opacity-85 flex items-center justify-center">
              <span className="text-gray-700 font-semibold bg-white px-3 py-1 rounded-lg shadow-sm border">
                {t('product.notAvailable')}
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
              {t('product.size')}: {slipper.size}
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
                      ? t('cart.alreadyInCartAddMore')
                      : t('cart.addToCartHint')
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
