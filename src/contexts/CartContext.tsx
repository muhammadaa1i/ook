"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { toast } from "react-toastify";
import { Slipper, SlipperImage } from "@/types";
import { useI18n } from "@/i18n";

interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  images: Array<{ id: number; image_url: string }>;
  image?: string; // Single image URL (alternative format)
  size?: string;
  color?: string;
}

interface CartContextType {
  items: CartItem[];
  itemCount: number;
  distinctCount: number; // number of different products/lines
  totalAmount: number;
  addToCart: (
    product: Slipper,
    quantity?: number,
    size?: string,
    color?: string
  ) => void;
  removeFromCart: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  isInCart: (productId: number) => boolean;
  getCartItem: (productId: number) => CartItem | undefined;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const { t } = useI18n();

  // Load cart from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      // If payment_success cookie exists, force clear cart immediately
      try {
        const cookieStr = document.cookie || '';
        if (cookieStr.includes('payment_success=1')) {
          localStorage.removeItem('cart');
          localStorage.setItem('cart', '[]');
        }
      } catch {}

      const savedCart = localStorage.getItem("cart");
      if (savedCart) {
        try {
          const parsed: CartItem[] = JSON.parse(savedCart);
          const normalized = parsed.map((it) => ({
            ...it,
            quantity: Math.max(60, Math.round((it.quantity || 0) / 6) * 6),
          }));
          setItems(normalized);
        } catch (error) {
          console.error("Error loading cart from localStorage:", error);
        }
      }
    }
  }, []);

  // Save cart to localStorage whenever items change
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("cart", JSON.stringify(items));
    }
  }, [items]);

  // Listen for logout event to clear cart
  useEffect(() => {
  const handleCartClear = () => {
    setItems([]);
    if (typeof window !== "undefined") {
      localStorage.removeItem("cart");
    }
  };

    if (typeof window !== "undefined") {
      window.addEventListener("cart:clear", handleCartClear);
      
      // Listen for payment success event to clear cart
      const handlePaymentSuccess = () => {
        setItems([]);
        localStorage.removeItem("cart");
        localStorage.setItem("cart", "[]");
      };
      
      window.addEventListener("payment:success", handlePaymentSuccess);
      
      return () => {
        window.removeEventListener("cart:clear", handleCartClear);
        window.removeEventListener("payment:success", handlePaymentSuccess);
      };
    }
  }, []);

  const addToCart = (
    product: Slipper,
    quantity = 6,
    size?: string,
    color?: string
  ) => {
    // Check available stock
    const availableStock = product.quantity || 0;
    if (availableStock <= 0) {
      toast.error(t('cart.outOfStock', { name: product.name }));
      return;
    }

    // Always add in multiples of 6, minimum 60
    let addQty = Math.max(6, Math.round(quantity / 6) * 6);
    if (addQty < 60) addQty = 60;

    const existingItemIndex = items.findIndex(
      (item) =>
        item.id === product.id && item.size === size && item.color === color
    );

    if (existingItemIndex > -1) {
      let toastType: 'success' | 'warning' | 'error' = 'success';
      let toastMessage = '';
      
      setItems((prevItems) => {
        const newItems = [...prevItems];
        let newQty = newItems[existingItemIndex].quantity + addQty;
        if (newQty < 60) newQty = 60;
        // Always round to nearest 6
        newQty = Math.round(newQty / 6) * 6;
        
        // Check if new quantity exceeds available stock
        if (newQty > availableStock) {
          const maxPossible = Math.floor(availableStock / 6) * 6;
          if (maxPossible >= 60) {
            newQty = maxPossible;
            toastType = 'warning';
            toastMessage = t('cart.limitedStock', { name: product.name, qty: newQty, available: availableStock });
          } else {
            toastType = 'error';
            toastMessage = t('cart.insufficientStock', { name: product.name, available: availableStock });
            return prevItems; // Don't update if can't meet minimum
          }
        } else {
          toastType = 'success';
          toastMessage = t('cart.added', { name: product.name, qty: addQty });
        }
        
        newItems[existingItemIndex].quantity = newQty;
        return newItems;
      });
      
      // Show toast after state update
      if (toastType === 'success') {
        toast.success(toastMessage);
      } else if (toastType === 'warning') {
        toast.warning(toastMessage);
      } else if (toastType === 'error') {
        toast.error(toastMessage);
      }
    } else {
      // Check if minimum quantity (60) can be satisfied
      if (availableStock < 60) {
        toast.error(t('cart.insufficientStock', { name: product.name, available: availableStock }));
        return;
      }
      
      // Check if requested quantity exceeds available stock
      let toastType: 'success' | 'warning' | null = 'success';
      let toastMessage = '';
      
      if (addQty > availableStock) {
        const maxPossible = Math.floor(availableStock / 6) * 6;
        addQty = Math.max(60, maxPossible);
        toastType = 'warning';
        toastMessage = t('cart.limitedStock', { name: product.name, qty: addQty, available: availableStock });
      } else {
        toastMessage = t('cart.added', { name: product.name, qty: addQty });
      }

      type ImageLike = { id: number; image_url?: string; image_path?: string };
      const cartItem: CartItem = {
        id: product.id,
        name: product.name,
        price: product.price,
        quantity: addQty,
        images: (product.images || []).map((img: SlipperImage | ImageLike) => ({
          id: img.id,
          image_url: (img as SlipperImage).image_path || (img as ImageLike).image_url || ""
        })),
        image: product.image,
        size,
        color,
      };
      
      setItems((prevItems) => [...prevItems, cartItem]);
      
      // Show toast after state update
      if (toastType === 'success') {
        toast.success(toastMessage);
      } else if (toastType === 'warning') {
        toast.warning(toastMessage);
      }
    }
  };

  const removeFromCart = (productId: number) => {
    const removedItem = items.find((item) => item.id === productId);
    setItems((prevItems) => {
      return prevItems.filter((item) => item.id !== productId);
    });
    if (removedItem) {
      toast.success(t('cart.removed', { name: removedItem.name }));
    }
  };

  const updateQuantity = (productId: number, quantity: number) => {
    // Find current cart item
    const cartItem = items.find(item => item.id === productId);
    if (!cartItem) return;

    // Determine direction to snap correctly to 6-step grid
    const isIncrease = quantity > cartItem.quantity;
    let snapped = isIncrease
      ? Math.ceil(quantity / 6) * 6
      : Math.floor(quantity / 6) * 6;

    // Enforce minimum 60
    if (snapped < 60) snapped = 60;

    setItems((prevItems) =>
      prevItems.map((item) =>
        item.id === productId ? { ...item, quantity: snapped } : item
      )
    );
  };

  const clearCart = () => {
    // Force clear both state and localStorage immediately
    if (typeof window !== "undefined") {
      try {
        // Multiple clearing attempts to ensure it works
        localStorage.removeItem("cart");
        localStorage.setItem("cart", "[]");
        localStorage.removeItem("cart"); // Remove again to be absolutely sure
        // Remove success cookie if set
        document.cookie = "payment_success=; Max-Age=0; path=/";
        try {
          const host = window.location.hostname;
          const parts = host.split('.')
          const baseDomain = parts.length >= 2 ? parts.slice(-2).join('.') : host;
          if (baseDomain.includes('.')) {
            document.cookie = `payment_success=; Max-Age=0; path=/; domain=.${baseDomain}`;
          }
        } catch {}
        
        // Verify it's cleared
        const verify = localStorage.getItem("cart");
        if (verify && verify !== "[]") {
          // Force clear again if still present
          localStorage.clear();
          localStorage.setItem("cart", "[]");
        }
      } catch (error) {
        console.error("Error clearing cart from localStorage:", error);
      }
    }
    
    // Clear state immediately
    setItems([]);
    
    // Don't show toast if called programmatically after payment
    const isPaymentSuccess = typeof window !== "undefined" && 
      (window.location.pathname.includes('/payment/success') || 
       sessionStorage.getItem('payment_success_flag'));
    
    if (!isPaymentSuccess) {
      toast.success(t('cart.cleared'));
    }
  };

  const isInCart = (productId: number) => {
    return items.some((item) => item.id === productId);
  };

  const getCartItem = (productId: number) => {
    return items.find((item) => item.id === productId);
  };

  // Total quantity (sum of all unit quantities)
  const itemCount = items.reduce((total, item) => total + item.quantity, 0);
  // Number of distinct cart lines
  const distinctCount = items.length;
  const totalAmount = items.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  const value: CartContextType = {
    items,
  itemCount,
  distinctCount,
    totalAmount,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    isInCart,
    getCartItem,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
