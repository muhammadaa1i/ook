"use client";

import React, { createContext, useContext, useEffect, useRef, useState, useCallback, startTransition } from "react";
import { toast } from "react-toastify";
import { Slipper, SlipperImage } from "@/types";
import { useI18n } from "@/i18n";
import { useAuth } from "@/contexts/AuthContext";
import { hasValidToken } from "@/lib/tokenUtils";
import cartService, { CartDTO, CartItemDTO } from "@/services/cartService";
import { fetchProduct } from "@/services/productService";

interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  images: Array<{ id: number; image_url: string }>;
  image?: string;
  size?: string;
  color?: string;
  _cartItemId?: number; // backend cart_item id
}

interface CartContextType {
  items: CartItem[];
  itemCount: number;
  distinctCount: number;
  totalAmount: number;
  addToCart: (product: Slipper, quantity?: number, size?: string, color?: string) => void;
  removeFromCart: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  isInCart: (productId: number) => boolean;
  getCartItem: (productId: number) => CartItem | undefined;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

// Map server DTO to client items, preserving images from previous state
function mapServerToClient(cart: CartDTO, prevItems: CartItem[]): CartItem[] {
  const prev = prevItems || [];
  return (cart.items || []).map((it: CartItemDTO) => {
    const prevMatch = prev.find((p) => p.id === it.slipper_id);
    const mapped: CartItem = {
      id: it.slipper_id,
      name: it.name,
      price: it.price,
      quantity: Number(it.quantity || 0),
      images: prevMatch?.images || [],
      image: prevMatch?.image,
      _cartItemId: it.id,
    };
    return mapped;
  });
}

// Merge server-mapped items with local when server returns a partial payload
function reconcilePartial(
  mapped: CartItem[],
  prev: CartItem[],
  changedId: number,
  op: "add" | "update" | "delete" | "clear"
): CartItem[] {
  if (op === "clear") return [];
  if (op === "delete") {
    // Start from local minus the removed item
    const base = prev.filter((i) => i.id !== changedId);
    if (mapped.length === 0) return base;
    // If mapped looks like a full cart, trust it
    if (mapped.length >= base.length) return mapped;
    // Otherwise, merge mapped changes into base
    const byId = new Map(mapped.map((i) => [i.id, i] as const));
    const merged = base.map((i) => byId.get(i.id) || i);
    // Include any mapped items not present in base
    mapped.forEach((i) => { if (!merged.some((m) => m.id === i.id)) merged.push(i); });
    return merged;
  }
  // add/update: keep previous, replace changed, include any new mapped items
  if (mapped.length === 0) return prev;
  // If mapped seems full (equal or more items than prev), prefer mapped
  if (mapped.length >= prev.length) return mapped;
  const byId = new Map(mapped.map((i) => [i.id, i] as const));
  const merged = prev.map((i) => byId.get(i.id) || i);
  mapped.forEach((i) => { if (!merged.some((m) => m.id === i.id)) merged.push(i); });
  return merged;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const itemsRef = useRef<CartItem[]>([]);
  const itemsMapRef = useRef<Map<number, CartItem>>(new Map());
  const itemsIdSetRef = useRef<Set<number>>(new Set());
  // Suppress server-driven hydration while clearing to avoid flicker/slow clear
  const suppressHydrationRef = useRef<number>(0);
  const { t } = useI18n();
  const { isAuthenticated } = useAuth();

  // Keep ref in sync
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  // Derive lookup structures so consumers can see them in the same render
  const itemsMap = React.useMemo(() => {
    const m = new Map<number, CartItem>();
    for (const it of items) m.set(it.id, it);
    return m;
  }, [items]);
  const itemsIdSet = React.useMemo(() => new Set<number>(items.map(i => i.id)), [items]);
  useEffect(() => {
    itemsMapRef.current = itemsMap;
    itemsIdSetRef.current = itemsIdSet;
  }, [itemsMap, itemsIdSet]);

  const mirrorToStorage = (list: CartItem[]) => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("cart", JSON.stringify(list));
      } catch {
        // Failed to save cart to storage
      }
    }
  };

  const lastServerSyncRef = useRef<number>(0);
  const SERVER_SYNC_COOLDOWN_MS = 10000; // 10s throttle to avoid 429
  // Track enrichment work so we don't repeat it unnecessarily
  const enrichingRef = useRef<boolean>(false);
  const enrichedIdsRef = useRef<Set<number>>(new Set());

  const syncFromServer = useCallback(async () => {
    try {
      // If we're in a clear window, skip hydrating from server
      if (suppressHydrationRef.current > Date.now()) return;
      // Only sync if authenticated
      if (!isAuthenticated) return;
      
      const cart = await cartService.getCart();
      let prevForImages: CartItem[] = itemsRef.current;
      if (typeof window !== "undefined") {
        try {
          const saved = localStorage.getItem("cart");
          if (saved) prevForImages = JSON.parse(saved) as CartItem[];
        } catch { }
      }
      const mapped = mapServerToClient(cart, prevForImages);
      
      // Only sync if server has items or we don't have local items
      const hasLocalItems = prevForImages.length > 0;
      const hasServerItems = mapped.length > 0;
      
      if (hasServerItems || !hasLocalItems) {
        startTransition(() => setItems(mapped));
        mirrorToStorage(mapped);
      }
      lastServerSyncRef.current = Date.now();
    } catch {
      // silent fallback
    }
  }, [isAuthenticated]);

  // Initial load: prefer server, fallback to localStorage
  useEffect(() => {
    let mounted = true;
    // Small delay to ensure localStorage is ready and avoid race conditions
    const timeoutId = setTimeout(() => {
      (async () => {
        if (isAuthenticated) {
          try {
            const cart = await cartService.getCart();
            if (!mounted) return;
            let prevForImages: CartItem[] = itemsRef.current;
            if (typeof window !== "undefined") {
              try {
                const saved = localStorage.getItem("cart");
                if (saved) prevForImages = JSON.parse(saved) as CartItem[];
              } catch { }
            }
            const mapped = mapServerToClient(cart, prevForImages);
            
            // Only update if server has items or localStorage is empty
            const hasLocalItems = prevForImages.length > 0;
            const hasServerItems = mapped.length > 0;
            
            if (hasServerItems || !hasLocalItems) {
              startTransition(() => setItems(mapped));
              mirrorToStorage(mapped);
            } else {
              // Server has no items but localStorage has items - keep localStorage items
              startTransition(() => setItems(prevForImages));
            }
          } catch {
            // Server failed, fall back to localStorage
            if (typeof window !== "undefined") {
              const savedCart = localStorage.getItem("cart");
              if (savedCart) {
                try {
                  const parsed: CartItem[] = JSON.parse(savedCart);
                  const normalized = parsed.map((it) => ({
                    ...it,
                    quantity: Math.max(1, Math.round(it.quantity || 1)),
                  }));
                  if (mounted) setItems(normalized);
                } catch { }
              }
            }
          }
        } else {
          // Not authenticated - load from localStorage only
          if (typeof window !== "undefined") {
            const savedCart = localStorage.getItem("cart");
            if (savedCart) {
              try {
                const parsed: CartItem[] = JSON.parse(savedCart);
                const normalized = parsed.map((it) => ({
                  ...it,
                  quantity: Math.max(1, Math.round(it.quantity || 1)),
                }));
                if (mounted) setItems(normalized);
              } catch { }
            }
          }
        }
      })();
    }, 100); // 100ms delay
    
    return () => {
      mounted = false;
      clearTimeout(timeoutId);
    };
  }, [isAuthenticated]);

  // Save cart to localStorage whenever items change
  useEffect(() => {
    mirrorToStorage(items);
  }, [items]);

  // Enrich items that are missing images by fetching product details
  useEffect(() => {
    // Run only on client
    if (typeof window === "undefined") return;
    if (enrichingRef.current) return;
    const current = itemsRef.current;
    if (!current || current.length === 0) return;

    // Identify items that need enrichment (no image and no images array)
    const needs = current
      .filter((it) => (!it.image && (!it.images || it.images.length === 0)))
      .map((it) => it.id)
      .filter((id) => !enrichedIdsRef.current.has(id));

    if (needs.length === 0) return;

    enrichingRef.current = true;
    (async () => {
      // Concurrency limit to avoid spikes
      const limit = 3;
      let idx = 0;
      const results: Record<number, Slipper | null> = {};

      const worker = async () => {
        while (idx < needs.length) {
          const i = idx++;
          const id = needs[i];
          enrichedIdsRef.current.add(id);
          try {
            const product = await fetchProduct(id);
            results[id] = product;
          } catch {
            results[id] = null;
          }
        }
      };

      const workers = Array.from({ length: Math.min(limit, needs.length) }, () => worker());
      await Promise.allSettled(workers);

      // Build updated items with images filled where available
      const updated = itemsRef.current.map((it) => {
        const product = results[it.id];
        if (!product) return it;
        type ImageLike = { id: number; image_url?: string; image_path?: string };
        const mappedImages = (product.images || []).map((img: SlipperImage | ImageLike) => ({
          id: (img as SlipperImage | ImageLike).id,
          image_url: (img as SlipperImage).image_path || (img as ImageLike).image_url || "",
        }));
        const firstImage = product.image || (mappedImages[0]?.image_url ?? "");
        if ((it.image && it.image.length > 0) || (it.images && it.images.length > 0)) return it;
        return {
          ...it,
          image: it.image || firstImage,
          images: (it.images && it.images.length > 0) ? it.images : mappedImages,
        };
      });

      // Only update state if there are changes (some items gained images)
      const changed = updated.some((u, ix) => {
        const prev = itemsRef.current[ix];
        const prevHas = !!(prev?.image) || (prev?.images && prev.images.length > 0);
        const nowHas = !!(u?.image) || (u?.images && u.images.length > 0);
        return nowHas && !prevHas;
      });

      if (changed) {
        startTransition(() => setItems(updated));
        try { mirrorToStorage(updated); } catch { /* ignore */ }
      }

      enrichingRef.current = false;
    })();
  }, [items]);

  // Listen for cart clear and payment success
  useEffect(() => {
    const handleCartClear = (event: Event) => {
      // Only clear cart if it's an intentional action, not an automatic 401 handling
      const customEvent = event as CustomEvent;
      const isIntentional = customEvent.detail?.intentional !== false;
      
      if (isIntentional) {
        // Synchronous clear for instant UI
        suppressHydrationRef.current = Date.now() + 8000;
        setItems([]);
        if (typeof window !== "undefined") {
          localStorage.removeItem("cart");
        }
      }
    };

    if (typeof window !== "undefined") {
      window.addEventListener("cart:clear", handleCartClear);

      const handlePaymentSuccess = () => {
        suppressHydrationRef.current = Date.now() + 8000;
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

  // Keep UI in sync with storage and also refresh from server in background
  useEffect(() => {
    if (typeof window === "undefined") return;
    const lastStorageRawRef = { current: "" } as { current: string };
    const syncFromStorage = () => {
      try {
        const stored = localStorage.getItem("cart");
        if (stored === lastStorageRawRef.current) return;
        lastStorageRawRef.current = stored || "";
        const parsed: CartItem[] = stored ? JSON.parse(stored) : [];
        const normalized = parsed.map((it) => ({
          ...it,
          quantity: Math.max(1, Math.round(it.quantity || 1)),
        }));
        setItems(normalized);
      } catch {
        // ignore
      }
      const now = Date.now();
      if (now - lastServerSyncRef.current >= SERVER_SYNC_COOLDOWN_MS) {
        setTimeout(() => {
          try {
            void syncFromServer();
          } catch { }
        }, 0);
      }
    };

    const onVisibility = () => {
      if (!document.hidden) syncFromStorage();
    };
    window.addEventListener("focus", syncFromStorage);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("storage", syncFromStorage);
    return () => {
      window.removeEventListener("focus", syncFromStorage);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("storage", syncFromStorage);
    };
  }, [syncFromServer]);

  const addToCart = (product: Slipper, quantity = 6, _size?: string, _color?: string) => {
    void _size;
    void _color;
    
    const availableStock = product.quantity || 0;
    if (availableStock <= 0) {
      toast.error(t("cart.outOfStock", { name: product.name }));
      return;
    }

    // Fix quantity logic - don't force minimum 60
    const addQty = Math.max(1, Math.round(quantity));

    type ImageLike = { id: number; image_url?: string; image_path?: string };
    const fallbackImages = (product.images || []).map((img: SlipperImage | ImageLike) => ({
      id: (img as SlipperImage | ImageLike).id,
      image_url: (img as SlipperImage).image_path || (img as ImageLike).image_url || "",
    }));

    let optimisticNext: CartItem[] = [];
    // Functional update prevents races across rapid clicks
    setItems((prev) => {
      const existing = prev.find((i) => i.id === product.id);
      if (existing) {
        const nextQty = existing.quantity + addQty;
        optimisticNext = prev.map((i) =>
          i.id === product.id
            ? {
              ...i,
              quantity: nextQty,
              images: i.images && i.images.length > 0 ? i.images : fallbackImages,
              image: i.image || product.image,
            }
            : i
        );
      } else {
        optimisticNext = [
          ...prev,
          {
            id: product.id,
            name: product.name,
            price: product.price,
            quantity: addQty,
            images: fallbackImages,
            image: product.image,
            _cartItemId: undefined,
          },
        ];
      }
      return optimisticNext;
    });
    // Defer I/O and toast very slightly to keep main thread free
    setTimeout(() => {
      try { mirrorToStorage(optimisticNext); } catch { }
      try { toast.success(t("cart.added", { name: product.name, qty: addQty })); } catch { }
    }, 0);

    // Only sync with server if user is authenticated AND has valid token
    if (isAuthenticated) {
      (async () => {
        try {
          // Check for valid token using our utility
          const validToken = hasValidToken();
          console.log(`🔐 Cart Context: Adding product ${product.id} - Token valid: ${validToken}`);
          
          if (!validToken) {
            console.log('❌ Cart Context: No valid token - skipping server sync');
            // No token available - skip server sync but keep local cart
            return;
          }
          
          console.log('🔄 Cart Context: Syncing with server cart');
          const payload = { slipper_id: product.id, quantity: addQty };
          const cart = await cartService.addItem(payload);
          let prevForImages: CartItem[] = optimisticNext;
          if (typeof window !== "undefined") {
            try {
              const saved = localStorage.getItem("cart");
              if (saved) prevForImages = JSON.parse(saved) as CartItem[];
            } catch { }
          }
          let mapped = mapServerToClient(cart, prevForImages);
          // If backend returns partial cart, merge with local optimistic state
          mapped = reconcilePartial(mapped, itemsRef.current, product.id, "add");
          mapped = mapped.map((it: CartItem) =>
            it.id === product.id
              ? {
                ...it,
                images: it.images && it.images.length > 0 ? it.images : fallbackImages,
                image: it.image || product.image,
              }
              : it
          );
          startTransition(() => setItems(mapped));
          setTimeout(() => { try { mirrorToStorage(mapped); } catch { } }, 0);
        } catch (error) {
          // Check if it's an authentication error
          const isAuthError = error instanceof Error && 
            (error.message.includes('401') || 
             error.message.includes('Unauthorized') ||
             error.message.includes('Authentication required') ||
             error.message.includes('authentication'));
          
          console.log(`❌ Cart Context: Server sync error - Auth error: ${isAuthError}`, error);
          
          if (isAuthError) {
            // Silently ignore authentication errors for guest users
            // Cart items are already added optimistically to localStorage
            // This could happen if token expired between user check and server request
          } else {
            // General server error - keep optimistic state on failure
            toast.error(t("errors.serverErrorLong"));
          }
        }
      })();
    }
  };

  const removeFromCart = (productId: number) => {
    const removedItem = items.find((item) => item.id === productId);
    const cartItemId = removedItem?._cartItemId;
    if (!cartItemId) {
      startTransition(() => setItems((prevItems) => prevItems.filter((i) => i.id !== productId)));
      if (removedItem) toast.success(t("cart.removed", { name: removedItem.name }));
      return;
    }
    (async () => {
      try {
        const cart = await cartService.deleteItem(cartItemId);
        let mapped = mapServerToClient(cart, itemsRef.current);
        mapped = reconcilePartial(mapped, itemsRef.current, productId, "delete");
        startTransition(() => setItems(mapped));
        mirrorToStorage(mapped);
        if (removedItem) toast.success(t("cart.removed", { name: removedItem.name }));
      } catch {
        startTransition(() => setItems((prevItems) => prevItems.filter((i) => i.id !== productId)));
        mirrorToStorage(itemsRef.current);
        if (removedItem) toast.success(t("cart.removed", { name: removedItem.name }));
      }
    })();
  };

  const updateQuantity = (productId: number, quantity: number) => {
    const cartItem = items.find((item) => item.id === productId);
    if (!cartItem) return;

    const isIncrease = quantity > cartItem.quantity;
    let snapped = isIncrease ? Math.ceil(quantity / 6) * 6 : Math.floor(quantity / 6) * 6;
    if (snapped < 60) snapped = 60;

    if (!cartItem._cartItemId) {
      startTransition(() => setItems((prev) => prev.map((i) => (i.id === productId ? { ...i, quantity: snapped } : i))));
      mirrorToStorage(itemsRef.current);
      return;
    }

    (async () => {
      try {
        const cart = await cartService.updateItem(cartItem._cartItemId!, { quantity: snapped });
        let mapped = mapServerToClient(cart, itemsRef.current);
        mapped = reconcilePartial(mapped, itemsRef.current, cartItem.id, "update");
        startTransition(() => setItems(mapped));
        mirrorToStorage(mapped);
      } catch {
        // Cart update error
        toast.error(t("errors.serverErrorLong"));
      }
    })();
  };

  const clearCart = () => {
    // Synchronous clear for instant UI response
    suppressHydrationRef.current = Date.now() + 8000;
    setItems([]);
    mirrorToStorage([]);

    const isPaymentSuccess =
      typeof window !== "undefined" &&
      (window.location.pathname.includes("/payment/success") ||
        sessionStorage.getItem("payment_success_flag"));
    if (!isPaymentSuccess) {
      setTimeout(() => {
        try { toast.success(t("cart.cleared")); } catch { }
      }, 0);
    }

    (async () => {
      try {
        await cartService.clear();
      } catch {
        // keep optimistic cleared state
      } finally {
        // Allow server hydration again after short delay window
        setTimeout(() => { suppressHydrationRef.current = 0; }, 500);
      }
    })();
  };

  const isInCart = useCallback((productId: number | string) => {
    const idNum = Number(productId);
    return itemsIdSet.has(idNum);
  }, [itemsIdSet]);
  const getCartItem = useCallback((productId: number | string) => {
    const idNum = Number(productId);
    return itemsMap.get(idNum);
  }, [itemsMap]);

  const itemCount = items.reduce((total, item) => total + item.quantity, 0);
  const distinctCount = items.length;
  const totalAmount = items.reduce((total, item) => total + item.price * item.quantity, 0);

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
