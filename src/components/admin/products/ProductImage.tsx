"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Package } from "lucide-react";

interface ProductImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  productId?: number;
}

/**
 * ProductImage component with robust fallback and refresh logic
 * Handles image loading errors and provides multiple fallback strategies
 */
const ProductImage: React.FC<ProductImageProps> = ({
  src,
  alt,
  width = 48,
  height = 48,
  className = "object-cover",
  priority = false,
  productId,
}) => {
  const [imageUrl, setImageUrl] = useState(src);
  const [error, setError] = useState(false);
  const [attemptCount, setAttemptCount] = useState(0);

  // Update image URL when src changes
  useEffect(() => {
    setImageUrl(src);
    setError(false);
    setAttemptCount(0);
  }, [src]);

  // Listen for global image refresh events
  useEffect(() => {
    const handleRefresh = (event: CustomEvent) => {
      const detail = event.detail;
      // If productId matches or it's a global refresh, reload the image
      if (!productId || detail?.productId === productId || detail?.global) {
        // Add cache buster to force reload
        const separator = src.includes('?') ? '&' : '?';
        setImageUrl(`${src}${separator}_t=${Date.now()}`);
        setError(false);
        setAttemptCount(0);
      }
    };

    window.addEventListener('refreshProductImages', handleRefresh as EventListener);
    return () => {
      window.removeEventListener('refreshProductImages', handleRefresh as EventListener);
    };
  }, [src, productId]);

  const handleError = () => {
    if (attemptCount < 2) {
      // Retry with cache buster
      setTimeout(() => {
        const separator = imageUrl.includes('?') ? '&' : '?';
        setImageUrl(`${imageUrl}${separator}_retry=${attemptCount + 1}&_t=${Date.now()}`);
        setAttemptCount(prev => prev + 1);
      }, 500);
    } else {
      setError(true);
    }
  };

  if (error) {
    return (
      <div 
        className={`flex items-center justify-center bg-gray-200 rounded-lg ${className}`}
        style={{ width, height }}
      >
        <Package className="h-6 w-6 text-gray-400" />
      </div>
    );
  }

  return (
    <Image
      src={imageUrl}
      alt={alt}
      width={width}
      height={height}
      className={className}
      priority={priority}
      unoptimized
      onError={handleError}
    />
  );
};

export default ProductImage;
