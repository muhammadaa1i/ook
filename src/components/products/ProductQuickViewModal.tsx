"use client";
import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { X, ChevronLeft, ChevronRight, ShoppingCart } from 'lucide-react';
import { Slipper } from '@/types';
import { useI18n } from '@/i18n';
import { getFullImageUrl, formatPrice } from '@/lib/utils';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';

interface ProductQuickViewModalProps {
  product: Slipper | null;
  isOpen: boolean;
  onClose: () => void;
}

const ProductQuickViewModal: React.FC<ProductQuickViewModalProps> = ({ product, isOpen, onClose }) => {
  const { t } = useI18n();
  const { addToCart, isInCart } = useCart();
  const { user } = useAuth();
  const isAdmin = !!user?.is_admin;
  const [index, setIndex] = useState(0);

  useEffect(() => { setIndex(0); }, [product?.id]);

  const images: string[] = (() => {
    const urls: string[] = [];
    
    // Priority: primary_image field → image_gallery/images array → legacy image field
    if (product?.primary_image) {
      urls.push(getFullImageUrl(product.primary_image));
    }
    
    // Use image_gallery if present, otherwise fallback to images
    const gallery = product?.image_gallery || product?.images;
    if (gallery && gallery.length) {
      const primary = gallery.find(i => i.is_primary);
      if (primary && !urls.some(u => u === getFullImageUrl(primary.image_path))) {
        urls.push(getFullImageUrl(primary.image_path));
      }
      gallery.forEach(img => {
        const full = getFullImageUrl(img.image_path);
        if (!urls.includes(full)) urls.push(full);
      });
    } else if (product?.image && !urls.some(u => u === getFullImageUrl(product.image))) {
      urls.push(getFullImageUrl(product.image));
    }
    
    if (!urls.length) urls.push('/placeholder-product.svg');
    return urls;
  })();

  const goPrev = useCallback(() => {
    setIndex(i => (i - 1 + images.length) % images.length);
  }, [images.length]);
  const goNext = useCallback(() => {
    setIndex(i => (i + 1) % images.length);
  }, [images.length]);

  if (!isOpen || !product) return null;

  const price = formatPrice(product.price, t('common.currencySom'));
  const inCart = isInCart(product.id);

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-2 sm:p-4 bg-black/60 overflow-y-auto" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-[95vw] sm:max-w-2xl md:max-w-3xl lg:max-w-4xl max-h-[92vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-4 sm:px-6 py-3 flex justify-between items-center">
          <h2 className="text-lg sm:text-2xl font-bold line-clamp-1">{product.name}</h2>
          <button onClick={onClose} aria-label={t('common.close') || 'Close'} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

  <div className="p-3 sm:p-5 grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
          {/* Carousel */}
          <div className="relative w-full flex items-center justify-center">
            <div className="relative overflow-hidden rounded-lg bg-gradient-to-br from-gray-50 to-gray-100 aspect-square w-full max-w-[260px] xs:max-w-[300px] sm:max-w-[340px] md:max-w-[380px] lg:max-w-none lg:h-full lg:aspect-square lg:flex-1">
              {/* Slides */}
              <div
                className="flex h-full transition-transform duration-300 ease-in-out"
                style={{ transform: `translateX(-${index * 100}%)` }}
              >
                {images.map((src, i) => (
                  <div key={i} className="min-w-full h-full flex items-center justify-center p-3 sm:p-5 lg:p-6">
                    <div className="relative w-full h-full rounded-md bg-white shadow-sm flex items-center justify-center overflow-hidden">
                      <Image
                        src={src}
                        alt={product.name}
                        fill
                        className="object-contain rounded-md"
                        sizes="(max-width: 640px) 80vw, (max-width: 1024px) 50vw, 400px"
                        unoptimized
                        priority={i === 0}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Arrows */}
              {images.length > 1 && (
                <>
                  <button onClick={goPrev} aria-label="Previous image" className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 p-2 sm:p-3 bg-white/90 hover:bg-white rounded-full shadow-lg transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6 text-gray-700" />
                  </button>
                  <button onClick={goNext} aria-label="Next image" className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 p-2 sm:p-3 bg-white/90 hover:bg-white rounded-full shadow-lg transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6 text-gray-700" />
                  </button>
                </>
              )}

              {/* Dots */}
              {images.length > 1 && (
                <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2">
                  {images.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setIndex(i)}
                      aria-label={`Go to slide ${i + 1}`}
                      className={`h-2 rounded-full transition-all ${
                        i === index ? 'w-8 bg-blue-600' : 'w-2 bg-gray-300 hover:bg-gray-400'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Details */}
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-sm text-gray-500 mb-1">{t('product.size')}: <span className="font-medium text-gray-800">{product.size}</span></p>
              <p className="text-2xl font-bold text-blue-600">{price}</p>
            </div>
            <div className="text-sm text-gray-600 space-y-1">
              <p>{t('product.availableQuantity', { count: String(product.quantity || 0) })}</p>
              {product.category_name && <p>{t('product.category')}: {product.category_name}</p>}
            </div>
            <div className="mt-auto pt-2">
              {!isAdmin && !inCart && (
                <button
                  onClick={() => addToCart(product)}
                  className="w-full inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md py-2 transition"
                >
                  <ShoppingCart className="h-5 w-5" /> {t('cart.addToCart')}
                </button>
              )}
              {!isAdmin && inCart && (
                <div className="w-full text-center py-2 rounded-md bg-green-100 text-green-700 font-semibold">
                  {t('cart.inCart')}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductQuickViewModal;