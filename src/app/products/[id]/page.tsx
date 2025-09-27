"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "react-toastify";
import modernApiClient from "@/lib/modernApiClient";
import { API_ENDPOINTS } from "@/lib/constants";
import { Slipper } from "@/types";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { formatPrice, getFullImageUrl } from "@/lib/utils";
import { ArrowLeft, ShoppingCart, Check } from "lucide-react";
import { ProductDetailSkeleton } from "@/components/ui/skeleton";
import { useI18n } from "@/i18n";

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { addToCart, getCartItem } = useCart();
  const { user } = useAuth();
  const { t } = useI18n();
  const [product, setProduct] = useState<Slipper | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  // Quantity logic: minimum order 60
  const MIN_ORDER = 60;
  const quantity = MIN_ORDER;
  const [imageError, setImageError] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const autoplayRef = useRef<NodeJS.Timeout | null>(null);

  const productId = params.id as string;

  // Check if product is in cart and get cart quantity
  const cartItem = product ? getCartItem(product.id) : null;
  const cartQuantity = cartItem?.quantity || 0;

  const fetchProduct = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await modernApiClient.get(
        API_ENDPOINTS.SLIPPER_BY_ID(Number(productId)),
        { include_images: true },
        { cache: false }
      );
      let productData: Slipper =
        ((response as { data?: Slipper })?.data || (response as Slipper)) as Slipper;

      // Always attempt separate images endpoint to build full gallery (merging with any embedded images)
      if (productData?.id) {
        try {
          const imgsResp = await modernApiClient.get(
            API_ENDPOINTS.SLIPPER_IMAGES(productData.id),
            undefined,
            { cache: false }
          );
          interface ImgRec { id: number; image_url: string; is_primary?: boolean; alt_text?: string; created_at?: string }
          const imgs = ((imgsResp as { data?: ImgRec[] })?.data || (imgsResp as ImgRec[])) as ImgRec[];
          console.log("Image loading error 1");

          if (Array.isArray(imgs) && imgs.length) {
            const embedded = (productData.images as unknown as ImgRec[]) || [];
            
            // Merge by id (avoid duplicates)
            const mergedMap = new Map<number, ImgRec>();


            [...embedded, ...imgs].forEach((img) => {
              if (!mergedMap.has(img.id)) mergedMap.set(img.id, img);
            });
            
            const merged = Array.from(mergedMap.values());
            // Ensure exactly one primary (fallback to first if none)
            
            if (!merged.some((m) => m.is_primary)) {
              if (merged.length) merged[0] = { ...merged[0], is_primary: true };
            }
            
            productData = { ...productData, images: merged as unknown as Slipper["images"] };
 
          }
          console.log(productData);
        } catch {
          console.log("Image loading error");
          
          // Gallery images load failed (non-critical)
        }
      }
      setProduct(productData);
      setHasError(false);
    } catch (error: unknown) {
      setHasError(true);

      const axiosError = error as { response?: { status?: number } };
      if (axiosError.response?.status === 503) {
        toast.error(t('errors.serverUnavailableLong'));
      } else if (axiosError.response?.status === 404) {
        toast.error(t('productDetail.notFound'));
      } else if (
        axiosError.response?.status &&
        axiosError.response.status >= 500
      ) {
        toast.error(t('errors.serverErrorLong'));
      } else {
        toast.error(t('errors.productsLoad'));
      }
    } finally {
      setIsLoading(false);
    }
  }, [productId, t]);

  useEffect(() => {
    if (productId) fetchProduct();
  }, [productId, fetchProduct]);

  const handleAddToCart = () => {
    if (product) {
      addToCart(product, quantity);
    }
  };
  // Build image list (primary first, then others, falling back to legacy product.image)
  const imageUrls: string[] = (() => {
    if (!product) return [];

    const list: string[] = [];

    
    if (product.images && product.images.length) {
      const primary = product.images.find((i) => i.is_primary);

      if (primary) list.push(getFullImageUrl(primary.image_path));
      
      product.images.forEach((img) => {
        const full = getFullImageUrl(img.image_path);

        if (!list.includes(full)) list.push(full);
      });
    
    } else if (product?.image) {
      list.push(getFullImageUrl(product.image));
    }
    
    return list.length ? list : ["/placeholder-product.svg"];
  })();

  const safeActive = Math.min(activeIndex, imageUrls.length - 1);
  const currentImage = imageUrls[safeActive];

  useEffect(() => {
    if (activeIndex >= imageUrls.length) setActiveIndex(0);
  }, [imageUrls.length, activeIndex]);

  const goPrev = useCallback(() => {
    if (imageUrls.length < 2) return;
    setActiveIndex((i) => (i - 1 + imageUrls.length) % imageUrls.length);
  }, [imageUrls.length]);

  const goNext = useCallback(() => {
    if (imageUrls.length < 2) return;
    setActiveIndex((i) => (i + 1) % imageUrls.length);
  }, [imageUrls.length]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") goPrev();
      else if (e.key === "ArrowRight") goNext();
    };
    window.addEventListener("keydown", handler);

    return () => window.removeEventListener("keydown", handler);
  }, [goPrev, goNext]);

  // Autoplay (pause on hover via clearing when group-hover triggers pointer events)
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

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  
  const onTouchEnd = (e: React.TouchEvent) => {
    touchEndX.current = e.changedTouches[0].clientX;
    if (touchStartX.current == null || touchEndX.current == null) return;
    const delta = touchEndX.current - touchStartX.current;
    const threshold = 40; // px swipe threshold
    if (Math.abs(delta) > threshold) {
      if (delta > 0) goPrev(); else goNext();
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  if (isLoading) {
    return <ProductDetailSkeleton />;
  }

  if (hasError || !product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {t('productDetail.notFound')}
          </h1>
          <button
            onClick={() => router.push("/catalog")}
            className="text-blue-600 hover:text-blue-800"
          >
            {t('common.returnToCatalog')}
          </button>
        </div>
      </div>
    );
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
          {t('common.back')}
        </button>

        <div className="bg-white rounded-xl shadow-md p-6 lg:p-8 flex flex-col lg:flex-row gap-8">
          {/* Gallery */}
          <div className="w-full lg:w-1/2">
            <div
              className="relative aspect-[4/3] w-full bg-gray-100 rounded-lg overflow-hidden group select-none"
              onTouchStart={onTouchStart}
              onTouchEnd={onTouchEnd}
              onMouseEnter={() => { if (autoplayRef.current) { clearInterval(autoplayRef.current); autoplayRef.current = null; } }}
              onMouseLeave={() => { if (!autoplayRef.current && imageUrls.length > 1) { autoplayRef.current = setInterval(() => setActiveIndex(i => (i + 1) % imageUrls.length), 4000); } }}
              role={imageUrls.length > 1 ? "region" : undefined}
              aria-roledescription={imageUrls.length > 1 ? "carousel" : undefined}
              aria-label={imageUrls.length > 1 ? t('productDetail.imageGallery', { count: String(imageUrls.length) }) : undefined}
            >
              {!imageError && currentImage !== "/placeholder-product.svg" ? (
                <Image
                  fill
                  key={currentImage}
                  src={currentImage}
                  alt={product.name}
                  unoptimized
                  className="object-contain transition-opacity duration-300"
                  onError={() => setImageError(true)}
                  priority={safeActive === 0}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-50">
                  <div className="text-center text-gray-500">
                    <div className="text-6xl mb-4">👟</div>
                    <div className="text-lg">{t('common.imageUnavailable')}</div>
                  </div>
                </div>
              )}
              {imageUrls.length > 1 && (
                <>
                  <button
                    onClick={(e) => { e.stopPropagation(); goPrev(); }}
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full h-9 w-9 flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                    aria-label={t('common.previousImage')}
                  >
                    ‹
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); goNext(); }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full h-9 w-9 flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                    aria-label={t('common.nextImage')}
                  >
                    ›
                  </button>
                  <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-2" aria-hidden="true">
                    {imageUrls.map((u, i) => (
                      <button
                        key={u + i}
                        onClick={(e) => { e.stopPropagation(); setActiveIndex(i); }}
                        className={`h-2.5 w-2.5 rounded-full border border-white transition ${i === safeActive ? "bg-white" : "bg-white/40 hover:bg-white/70"}`}
                        aria-label={t('common.showImage', { index: String(i + 1) })}
                      />
                    ))}
                  </div>
                  <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded-full font-medium">
                    {safeActive + 1}/{imageUrls.length}
                  </div>
                </>
              )}
            </div>
            {imageUrls.length > 1 && (
              <div className="flex gap-2 mt-4 overflow-x-auto pb-1 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-300">
                {imageUrls.map((u, i) => (
                  <button
                    key={u + i}
                    onClick={() => setActiveIndex(i)}
                    className={`relative flex-shrink-0 h-16 w-16 rounded-md overflow-hidden border ${i === safeActive ? "border-blue-500 ring-2 ring-blue-300" : "border-gray-200 hover:border-blue-400"}`}
                    aria-label={t('productDetail.thumbnail', { index: String(i + 1) })}
                  >
                    <Image src={u} alt={product.name + ' thumbnail ' + (i + 1)} fill className="object-cover" sizes="64px" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="w-full lg:w-1/2 flex flex-col justify-between">
            {/* Cart Status Indicator */}
            {cartItem && (
              <div className="flex items-center justify-between mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
                <div className="flex items-center space-x-2">
                  <Check className="h-5 w-5 text-green-600" />
                  <span className="text-green-800 font-medium">
                    {t('cart.inCart')}: {cartQuantity}
                  </span>
                </div>
              </div>
            )}

            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {product.name}
            </h1>

            <div className="space-y-4 mb-6">
              <div className="flex items-center justify-between">
                <span className="text-lg text-gray-600">{t('product.price')}:</span>
                <span className="text-2xl font-bold text-blue-600">
                  {formatPrice(product.price, t('common.currencySom'))}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-lg text-gray-600">{t('product.available')}:</span>
                <span
                  className={`text-lg font-medium ${product.quantity > 0 ? "text-green-600" : "text-red-600"
                    }`}
                >
                  {product.quantity > 0
                    ? `${product.quantity} ${t('common.items')}`
                    : t('product.notAvailable')}
                </span>
              </div>

              {product.category_name && (
                <div className="flex items-center justify-between">
                  <span className="text-lg text-gray-600">{t('product.category')}:</span>
                  <span className="text-lg font-medium text-gray-900">
                    {product.category_name}
                  </span>
                </div>
              )}
            </div>

            {/* Quantity selector and Add to Cart (hidden for admins) */}
            {product.quantity >= MIN_ORDER && !user?.is_admin && (
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <span className="text-lg text-gray-600">{t('product.quantityLabel')}:</span>
                  <div className="border border-gray-300 rounded-md">
                    <span className="px-4 py-2 font-medium text-gray-900 bg-gray-50 block">
                      {quantity}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleAddToCart}
                  className={`w-full py-3 px-3 rounded-md transition-colors duration-200 flex items-center justify-center space-x-2 shadow-sm ${cartItem
                    ? 'bg-green-500 hover:bg-green-600 text-white'
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                    }`}
                >
                  {cartItem ? (
                    <>
                      <Check className="h-5 w-5" />
                      <span>{t('product.addToCart')}</span>
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="h-5 w-5" />
                      <span>{t('product.addToCart')}</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {product.quantity > 0 && product.quantity < MIN_ORDER && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-yellow-800 font-medium">Минимальный заказ {MIN_ORDER}. Доступно только {product.quantity}.</p>
              </div>
            )}

            {product.quantity === 0 && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-800 font-medium">{t('productDetail.temporarilyOutOfStock')}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
