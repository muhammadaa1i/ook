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
  // Normalize product images for cart: use image_url if present or derive from image_path
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
      const savedCart = localStorage.getItem("cart");
      if (savedCart) {
        try {
          setItems(JSON.parse(savedCart));
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
    };

    if (typeof window !== "undefined") {
      window.addEventListener("cart:clear", handleCartClear);
      return () => window.removeEventListener("cart:clear", handleCartClear);
    }
  }, []);

  const addToCart = (
    product: Slipper,
    quantity = 50,
    size?: string,
    color?: string
  ) => {
    // Always add in multiples of 5, minimum 50
    let addQty = Math.max(5, Math.round(quantity / 5) * 5);
    if (addQty < 50) addQty = 50;

    const existingItemIndex = items.findIndex(
      (item) =>
        item.id === product.id && item.size === size && item.color === color
    );

    if (existingItemIndex > -1) {
      setItems((prevItems) => {
        const newItems = [...prevItems];
        let newQty = newItems[existingItemIndex].quantity + addQty;
        if (newQty < 50) newQty = 50;
        // Always round to nearest 5
        newQty = Math.round(newQty / 5) * 5;
        newItems[existingItemIndex].quantity = newQty;
        return newItems;
      });
  toast.success(`${product.name}: +${addQty}`);
    } else {
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
  toast.success(`${product.name}: +${addQty}`);
    }
  };

  const removeFromCart = (productId: number) => {
    const removedItem = items.find((item) => item.id === productId);
    setItems((prevItems) => {
      return prevItems.filter((item) => item.id !== productId);
    });
    if (removedItem) {
  toast.success(`${removedItem.name}: 0`);
    }
  };

  const updateQuantity = (productId: number, quantity: number) => {
    // Enforce minimum 50, step 5
    const newQty = Math.max(50, Math.round(quantity / 5) * 5);
    if (newQty <= 0) {
      removeFromCart(productId);
      return;
    }
    setItems((prevItems) =>
      prevItems.map((item) =>
        item.id === productId ? { ...item, quantity: newQty } : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
  toast.success(t('common.cart') + ' - 0');
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
