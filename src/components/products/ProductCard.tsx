"use client";

import React, { useState, useCallback, useMemo, useEffect, useRef } from "react";
import Image from "next/image";
import { Slipper } from "@/types";
import { formatPrice, getFullImageUrl } from "@/lib/utils";
import { ShoppingCart, Check, Plus, Minus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
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
  const { isInCart, getCartItem, addToCart, updateQuantity } = useCart();
  const isAdmin = !!user?.is_admin;

    const inCart = useMemo(() => isInCart(slipper.id), [isInCart, slipper.id]);
    const cartItem = useMemo(() => (inCart ? getCartItem(slipper.id) : undefined), [inCart, getCartItem, slipper.id]);

    // Build list of image URLs for carousel (primary first)
    const imageUrls = useMemo(() => {
      const urls: string[] = [];
      if (slipper.images && slipper.images.length > 0) {
        const primary = slipper.images.find((i) => i.is_primary);
        if (primary) urls.push(getFullImageUrl(primary.image_path));
        slipper.images.forEach((img) => {
          const full = getFullImageUrl(img.image_path);
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
      () => {
        const quantity = slipper.quantity || 0;
        const isAvailable = quantity > 0;
        const canAddToCart = quantity >= 50; // Minimum order quantity
        
        let displayText: string;
        if (quantity === 0) {
          displayText = t('product.notAvailable');
        } else if (quantity < 50) {
          displayText = `${t('product.availableQuantity', { count: quantity.toString() })} (${t('product.insufficientForOrder')})`;
        } else {
          displayText = t('product.availableQuantity', { count: quantity.toString() });
        }

        return {
          isAvailable,
          canAddToCart,
          displayText,
          quantity
        };
      },
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
      if (onAddToCart) {
        // Use the callback provided by parent component
        onAddToCart(slipper);
      } else {
        // Fallback to direct cart context usage with default quantity (will be normalized to 60)
        addToCart(slipper);
      }
    }, [addToCart, onAddToCart, slipper]);

    const increaseQuantity = useCallback((e: React.MouseEvent) => {
      e.stopPropagation();
      if (cartItem) {
        updateQuantity(slipper.id, cartItem.quantity + 6);
      }
    }, [updateQuantity, slipper.id, cartItem]);

    const decreaseQuantity = useCallback((e: React.MouseEvent) => {
      e.stopPropagation();
      if (cartItem && cartItem.quantity > 60) {
        updateQuantity(slipper.id, cartItem.quantity - 6);
      }
    }, [updateQuantity, slipper.id, cartItem]);

    const handleViewDetails = useCallback(() => {
      if (onViewDetails) {
        onViewDetails(slipper);
      }
    }, [onViewDetails, slipper]);

    return (
      <div
        className={
          `relative bg-white rounded-md sm:rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer border ${
            inCart && !isAdmin ? "border-blue-500 ring-1 ring-blue-400/50" : "border-transparent"
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
        <div className="relative h-36 sm:h-40 lg:h-48 bg-gray-200">
          {inCart && !isAdmin && (
            <div className="absolute top-1.5 sm:top-2 left-1.5 sm:left-2 z-10 bg-blue-600 text-white text-[10px] sm:text-[11px] font-semibold px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-sm sm:rounded-md shadow-sm flex items-center space-x-1">
              <Check className="h-3 sm:h-3.5 w-3 sm:w-3.5" />
              <span className="truncate">{t('cart.inCart')}{cartItem ? `: ${cartItem.quantity}` : ""}</span>
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
                unoptimized
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
              />
              {imageUrls.length > 1 && (
                <>
                  <button
                    onClick={goPrev}
                    aria-label="Previous image"
                    className="absolute left-0.5 sm:left-1 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full p-1 sm:p-1.5 backdrop-blur-sm focus:outline-none text-xs sm:text-sm"
                  >
                    ‹
                  </button>
                  <button
                    onClick={goNext}
                    aria-label="Next image"
                    className="absolute right-0.5 sm:right-1 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full p-1 sm:p-1.5 backdrop-blur-sm focus:outline-none text-xs sm:text-sm"
                  >
                    ›
                  </button>
                  <div className="absolute bottom-1.5 sm:bottom-2 left-0 right-0 flex items-center justify-center gap-1">
                    {imageUrls.map((_, i) => (
                      <button
                        key={i}
                        aria-label={`Go to image ${i + 1}`}
                        onClick={(e) => { e.stopPropagation(); setActiveIndex(i); }}
                        className={`h-1 sm:h-1.5 rounded-full transition-all ${i === activeIndex ? 'bg-white w-3 sm:w-4' : 'bg-white/50 w-1.5 sm:w-2'}`}
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
          {availabilityInfo.isAvailable && !availabilityInfo.canAddToCart && (
            <div className="absolute inset-0 bg-yellow-50 bg-opacity-85 flex items-center justify-center">
              <span className="text-yellow-800 font-semibold bg-yellow-100 px-3 py-1 rounded-lg shadow-sm border">
                {t('product.insufficientStock')}
              </span>
            </div>
          )}
        </div>

        <div className="p-3 sm:p-4">
          <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 mb-2 line-clamp-2 leading-tight">
            {slipper.name}
          </h3>

          <div className="flex items-center justify-between mb-2">
            <span className="text-xs sm:text-sm text-gray-600 truncate">
              {t('product.size')}: {slipper.size}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-base sm:text-lg lg:text-xl font-bold text-blue-600 truncate">
              {formattedPrice}
            </span>
          </div>

          {/* Quantity Controls - only show if product is in cart and not admin */}
          {inCart && !isAdmin && onAddToCart && (
            <div className="mt-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{t('product.quantity')}:</span>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={decreaseQuantity}
                    className="p-1 rounded-md border border-gray-300 hover:bg-gray-50 hover:border-gray-400 text-gray-700 hover:text-gray-900 transition-colors"
                    disabled={cartItem && cartItem.quantity <= 60}
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="w-12 text-center text-sm font-semibold text-gray-900">
                    {cartItem?.quantity || 60}
                  </span>
                  <button
                    onClick={increaseQuantity}
                    className="p-1 rounded-md border border-gray-300 hover:bg-gray-50 hover:border-gray-400 text-gray-700 hover:text-gray-900 transition-colors"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-end mt-3">
            <div className="flex space-x-1 sm:space-x-2">
              {onAddToCart && !isAdmin && !inCart && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddToCart();
                  }}
                  disabled={!availabilityInfo.canAddToCart}
                  className="px-3 py-2 rounded-md sm:rounded-lg transition-colors flex items-center justify-center text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                  title={
                    !availabilityInfo.canAddToCart
                      ? t('product.insufficientStockTooltip', { min: '60' })
                      : t('cart.addToCartHint')
                  }
                >
                  <ShoppingCart className="h-4 w-4 mr-1" />
                  {t('cart.addToCart')}
                </button>
              )}
              {inCart && !isAdmin && (
                <div className="flex items-center text-sm text-green-600 font-medium">
                  <Check className="h-4 w-4 mr-1" />
                  {t('cart.inCart')}
                </div>
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
