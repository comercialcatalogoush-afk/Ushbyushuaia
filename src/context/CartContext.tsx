'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { CartItem, Product } from '@/types';
import { getUnitPrice, isWholesale, getTierForUnits, PRICE_TIERS, validateCoupon, Coupon, WHOLESALE_FALLBACK } from '@/lib/pricing';
import { subscribeCatalogChanges } from '@/lib/supabase';
import { gtagEvent } from '@/lib/analytics';

export interface ToastNotification {
  id: string;
  message: string;
  type: 'info' | 'warning' | 'success';
}

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, selectedSize?: string, selectedColor?: string, quantity?: number) => void;
  removeFromCart: (index: number) => void;
  updateQuantity: (index: number, quantity: number) => void;
  clearCart: () => void;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  totalItemsCount: number;
  subtotalCOP: number;
  formatCOP: (amount: number) => string;
  isWholesaleTier: boolean; // True if >= 12 units
  totalUnits: number;
  activeTierKey: string;
  activeTierLabel: string;
  tierDiscount: number;
  priceTiers: typeof PRICE_TIERS;
  calculateItemUnitPrice: (item: CartItem) => number;
  coupon: Coupon | null;
  applyCoupon: (code: string) => { valid: boolean; message?: string };
  removeCoupon: () => void;
  discountCOP: number;
  toasts: ToastNotification[];
  dismissToast: (id: string) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastNotification[]>([]);
  const [coupon, setCoupon] = useState<Coupon | null>(null);

  useEffect(() => {
    try {
      const savedCoupon = localStorage.getItem('ush_coupon_active');
      if (savedCoupon) setCoupon(JSON.parse(savedCoupon));
    } catch (_) {}
  }, []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('ush_cart');
      if (saved) {
        setItems(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Failed to load cart from localStorage', e);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('ush_cart', JSON.stringify(items));
    } catch (e) {
      console.error('Failed to save cart to localStorage', e);
    }
  }, [items]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToCart = (product: Product, selectedSize?: string, selectedColor?: string, quantity = 1) => {
    setItems((prev) => {
      // Exact match → just increment quantity
      const existingIdx = prev.findIndex(
        (i) => i.product.id === product.id && i.selectedSize === selectedSize && i.selectedColor === selectedColor
      );
      if (existingIdx > -1) {
        const updated = [...prev];
        updated[existingIdx] = { ...updated[existingIdx], quantity: updated[existingIdx].quantity + quantity };
        return updated;
      }

      // Same reference, DIFFERENT size → show toast before adding
      const refKey = product.reference || product.name;
      const siblingItem = prev.find(
        (i) =>
          (i.product.reference || i.product.name) === refKey &&
          i.selectedSize !== selectedSize
      );

      if (siblingItem && selectedSize) {
        const toastId = `toast-${Date.now()}`;
        const msg = `Agregaste la talla ${selectedSize} de ${product.name}. Ya tienes la talla ${siblingItem.selectedSize} de esta misma referencia en tu carrito.`;
        setToasts((prevToasts) => [
          ...prevToasts,
          { id: toastId, message: msg, type: 'warning' },
        ]);
        setTimeout(() => {
          setToasts((t) => t.filter((n) => n.id !== toastId));
        }, 5000);
      }

      return [...prev, { product, selectedSize, selectedColor, quantity }];
    });
    setIsCartOpen(true);
    gtagEvent('add_to_cart', {
      currency: 'COP',
      value: (product.price || 0) * quantity,
      items: [{ item_id: product.reference || product.slug, item_name: product.name, quantity, price: product.price || 0 }],
    });
  };

  const removeFromCart = (index: number) => {
    const removed = items[index];
    setItems((prev) => prev.filter((_, idx) => idx !== index));
    if (removed) {
      gtagEvent('remove_from_cart', {
        currency: 'COP',
        value: (removed.product.price || 0) * removed.quantity,
        items: [{ item_id: removed.product.reference || removed.product.slug, item_name: removed.product.name, quantity: removed.quantity, price: removed.product.price || 0 }],
      });
    }
  };

  const updateQuantity = (index: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(index);
      return;
    }
    setItems((prev) => {
      if (index < 0 || index >= prev.length) return prev;
      const updated = [...prev];
      updated[index] = { ...updated[index], quantity };
      return updated;
    });
  };

  const clearCart = () => setItems([]);

  const totalItemsCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalUnits = totalItemsCount;

  // Check if wholesale threshold (12+ units) is reached
  const isWholesaleTier = isWholesale(totalUnits);

  // Escala de precio activa según unidades totales
  const activeTier = getTierForUnits(totalUnits);
  const activeTierKey = activeTier.key;
  const activeTierLabel = activeTier.label;
  const tierDiscount = activeTier.discount;

  // Calculate unit price for an item depending on total units (escala)
  const calculateItemUnitPrice = (item: CartItem) => {
    const suggested = item.product.suggested_price || item.product.price || 49900;
    const wholesale = item.product.price || Math.round(suggested * WHOLESALE_FALLBACK);
    return getUnitPrice(suggested, wholesale, totalUnits);
  };

  const subtotalBeforeDiscount = items.reduce((sum, item) => sum + calculateItemUnitPrice(item) * item.quantity, 0);

  // Descuento por código (aplica sobre el subtotal ya escalado)
  const discountCOP = coupon ? Math.round(subtotalBeforeDiscount * coupon.discount) : 0;
  const subtotalCOP = subtotalBeforeDiscount - discountCOP;

  const applyCoupon = (code: string) => {
    const result = validateCoupon(code, totalUnits);
    if (result.valid && result.coupon) {
      setCoupon(result.coupon);
      try { localStorage.setItem('ush_coupon_active', JSON.stringify(result.coupon)); } catch (_) {}
      return { valid: true };
    }
    return { valid: false, message: result.message };
  };

  const removeCoupon = () => {
    setCoupon(null);
    try { localStorage.removeItem('ush_coupon_active'); } catch (_) {}
  };

  // Revalida el cupón activo cuando cambia el total de unidades: si el carrito
  // baja del mínimo requerido, el cupón se retira automáticamente.
  useEffect(() => {
    if (coupon && coupon.minUnits && totalUnits < coupon.minUnits) {
      removeCoupon();
    }
  }, [totalUnits, coupon]);

  // Precios en vivo: si el admin edita precios o confirma pedidos, los ítems
  // del carrito se actualizan con los precios vigentes (sin perder talla/color/cant).
  useEffect(() => {
    if (typeof window === 'undefined') return () => {};
    let fetchSeq = 0;
    const refreshPrices = () => {
      // Se sirve desde el cache del edge de Vercel (/api/catalog con s-maxage=60),
      // no se consulta Supabase por cada cliente ante cada broadcast.
      const seq = ++fetchSeq;
      fetch('/api/catalog')
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error('catalog ' + r.status))))
        .then((fresh: Product[]) => {
          if (seq !== fetchSeq) return;
          setItems((prev) => {
            if (prev.length === 0) return prev;
            let changed = false;
            const updated = prev.map((item) => {
              const freshP = fresh.find((p) => p.id === item.product.id);
              if (!freshP) return item;
              if (freshP.suggested_price === item.product.suggested_price && freshP.price === item.product.price) return item;
              changed = true;
              return { ...item, product: freshP };
            });
            return changed ? updated : prev;
          });
        })
        .catch(() => {});
    };
    const unsub = subscribeCatalogChanges(refreshPrices);
    return unsub;
  }, []);

  // Clean COP formatting without trailing single zero
  const formatCOP = (amount: number) => {
    if (isNaN(amount)) return '$0';
    const cleanNum = Math.round(amount);
    const formattedNum = cleanNum.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return `$${formattedNum}`;
  };

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        isCartOpen,
        setIsCartOpen,
        totalItemsCount,
        subtotalCOP,
        formatCOP,
        isWholesaleTier,
        totalUnits,
        activeTierKey,
        activeTierLabel,
        tierDiscount,
        priceTiers: PRICE_TIERS,
        calculateItemUnitPrice,
        coupon,
        applyCoupon,
        removeCoupon,
        discountCOP,
        toasts,
        dismissToast,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
