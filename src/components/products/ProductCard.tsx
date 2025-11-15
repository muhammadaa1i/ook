"use client";

import React, { useState, useCallback, useMemo, useEffect, useRef } from "react";
import Image from "next/image";
import { Slipper } from "@/types";
import { formatPrice, getFullImageUrl } from "@/lib/utils";
import { ShoppingCart, Check, Plus, Minus, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { useI18n } from "@/i18n";


interface ProductCardProps {
  slipper: Slipper;
  onAddToCart?: (slipper: Slipper) => void;
  onViewDetails?: (slipper: Slipper) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ slipper, onAddToCart, onViewDetails }) => {
  const [imageError, setImageError] = useState(false);
  const { t } = useI18n();
  const { user } = useAuth();
  const { isInCart, getCartItem, addToCart, updateQuantity } = useCart();

  // Check if current user is admin
  const isAdmin = !!user?.is_admin;

  // Compute on each render so context changes are reflected immediately
  const inCart = isInCart(slipper.id);
  const cartItem = inCart ? getCartItem(slipper.id) : undefined;
  const [addPending, setAddPending] = useState(false);
  useEffect(() => {
    if (inCart && addPending) setAddPending(false);
  }, [inCart, addPending]);

    // Build list of image URLs for carousel (primary first)
    const imageUrls = useMemo(() => {
      const urls: string[] = [];
      
      // Priority: primary_image field → image_gallery/images array → legacy image field
      if (slipper.primary_image) {
        urls.push(getFullImageUrl(slipper.primary_image));
      }
      
      // Use image_gallery if present, otherwise fallback to images
      const gallery = slipper.image_gallery || slipper.images;
      if (gallery && gallery.length > 0) {
        // Add primary image first if not already added
        const primary = gallery.find((i) => i.is_primary);
        if (primary && !urls.some(u => u === getFullImageUrl(primary.image_path))) {
          urls.push(getFullImageUrl(primary.image_path));
        }
        // Add remaining images
        gallery.forEach((img) => {
          const full = getFullImageUrl(img.image_path);
          if (!urls.includes(full)) urls.push(full);
        });
      } else if (slipper.image && !urls.some(u => u === getFullImageUrl(slipper.image))) {
        // Legacy fallback to single image field
        urls.push(getFullImageUrl(slipper.image));
      }
      
      if (!urls.length) urls.push("/placeholder-product.svg");
      return urls;
    }, [slipper.primary_image, slipper.image_gallery, slipper.images, slipper.image]);

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
  const canAddToCart = quantity >= 60; // Minimum order quantity
        
        let displayText: string;
        if (quantity === 0) {
          displayText = t('product.notAvailable');
  } else if (quantity < 60) {
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

    const canDecrease = !!cartItem && cartItem.quantity > 60;
    const canIncrease = !!cartItem && (cartItem.quantity + 6) <= (availabilityInfo.quantity || 0);

    const increaseQuantity = useCallback((e: React.MouseEvent) => {
      e.stopPropagation();
      if (cartItem && canIncrease) {
        updateQuantity(slipper.id, cartItem.quantity + 6);
      }
    }, [updateQuantity, slipper.id, cartItem, canIncrease]);

    const decreaseQuantity = useCallback((e: React.MouseEvent) => {
      e.stopPropagation();
      if (cartItem && canDecrease) {
        updateQuantity(slipper.id, cartItem.quantity - 6);
      }
    }, [updateQuantity, slipper.id, cartItem, canDecrease]);

    const handleViewDetails = useCallback(() => {
      if (onViewDetails) {
        onViewDetails(slipper);
      }
    }, [onViewDetails, slipper]);

    return (
      <div
        className={
          `relative flex flex-col bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-all duration-200 cursor-pointer border ${
            inCart && !isAdmin ? "border-blue-500 ring-1 ring-blue-400/40" : "border-gray-100"
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
        {/* Media */}
        <div className="relative aspect-[4/3] w-full bg-gray-100">
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
                    onTouchStart={(e) => e.stopPropagation()} // Prevent touch conflicts
                    aria-label="Previous image"
                    className="absolute left-0.5 sm:left-1 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 active:bg-black/70 text-white rounded-full p-1.5 sm:p-2 backdrop-blur-sm focus:outline-none text-xs sm:text-sm transition-colors duration-150 touch-manipulation"
                  >
                    ‹
                  </button>
                  <button
                    onClick={goNext}
                    onTouchStart={(e) => e.stopPropagation()} // Prevent touch conflicts
                    aria-label="Next image"
                    className="absolute right-0.5 sm:right-1 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 active:bg-black/70 text-white rounded-full p-1.5 sm:p-2 backdrop-blur-sm focus:outline-none text-xs sm:text-sm transition-colors duration-150 touch-manipulation"
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

        {/* Details */}
        <div className="flex flex-col flex-1 p-3 gap-1">
          <h3 className="text-sm sm:text-base font-semibold text-gray-900 line-clamp-2 leading-snug min-h-[2.25rem]">
            {slipper.name}
          </h3>
          <div className="flex items-center text-xs sm:text-sm text-gray-600">
            <span className="truncate">{t('product.size')}: {slipper.size}</span>
          </div>
          <div className="mt-1 flex items-center justify-between">
            <span className="text-base sm:text-lg font-bold text-blue-600">{formattedPrice}</span>
            {inCart && !isAdmin && (
              <span className="text-[10px] sm:text-xs px-1.5 py-0.5 rounded bg-green-100 text-green-700 font-medium">
                {t('cart.inCart')}
              </span>
            )}
          </div>

          {/* Quantity Controls (compact) */}
          {inCart && onAddToCart && !isAdmin && (
            <div className="mt-1 flex items-center justify-between">
              <span className="text-xs text-gray-500">{t('product.quantity')}:</span>
              <div className="flex items-center space-x-1">
                <button
                  onClick={decreaseQuantity}
                  className={`p-1 rounded border text-xs transition-colors ${canDecrease ? 'border-gray-300 text-gray-700 hover:bg-gray-50' : 'border-gray-200 text-gray-400 cursor-not-allowed opacity-50'}`}
                  disabled={!canDecrease}
                >
                  <Minus className="h-3 w-3" />
                </button>
                <span className="w-12 text-center text-xs font-semibold text-gray-900">
                  {cartItem?.quantity || 60}
                </span>
                <button
                  onClick={increaseQuantity}
                  className={`p-1 rounded border text-xs transition-colors ${canIncrease ? 'border-blue-300 text-blue-700 hover:bg-blue-50' : 'border-gray-200 text-gray-400 cursor-not-allowed opacity-50'}`}
                  disabled={!canIncrease}
                  title={!canIncrease ? t('product.insufficientStock') : undefined}
                >
                  <Plus className="h-3 w-3" />
                </button>
              </div>
            </div>
          )}

          {/* Add to Cart Button */}
          {onAddToCart && !inCart && !isAdmin && (
            <button
              onClick={(e) => { e.stopPropagation(); if (!availabilityInfo.canAddToCart || addPending) return; setAddPending(true); handleAddToCart(); }}
              disabled={!availabilityInfo.canAddToCart || addPending}
              className={`mt-2 w-full inline-flex items-center justify-center gap-1 rounded-md text-white text-xs sm:text-sm font-medium py-1.5 transition-colors ${(!availabilityInfo.canAddToCart || addPending) ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
              title={!availabilityInfo.canAddToCart ? t('product.insufficientStockTooltip', { min: '60' }) : t('cart.addToCartHint')}
            >
              {addPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShoppingCart className="h-4 w-4" />} {t('cart.addToCart')}
            </button>
          )}
        </div>
      </div>
    );
};

ProductCard.displayName = "ProductCard";

export default ProductCard;
