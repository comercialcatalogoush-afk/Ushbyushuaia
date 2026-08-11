'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { CartItem, Product } from '@/types';

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
  calculateItemUnitPrice: (item: CartItem) => number;
  toasts: ToastNotification[];
  dismissToast: (id: string) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

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
        updated[existingIdx].quantity += quantity;
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
  };

  const removeFromCart = (index: number) => {
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const updateQuantity = (index: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(index);
      return;
    }
    setItems((prev) => {
      const updated = [...prev];
      updated[index].quantity = quantity;
      return updated;
    });
  };

  const clearCart = () => setItems([]);

  const totalItemsCount = items.reduce((sum, item) => sum + item.quantity, 0);

  // Check if wholesale threshold (12+ units) is reached
  const isWholesaleTier = totalItemsCount >= 12;

  // Calculate unit price for an item depending on wholesale tier (12+ vs <12)
  const calculateItemUnitPrice = (item: CartItem) => {
    const suggested = item.product.suggested_price || item.product.price || 49900;
    const wholesale = item.product.price || suggested * 0.65;

    if (isWholesaleTier) {
      // Wholesale price (35% to 42% discount)
      return wholesale;
    } else {
      // 20% discount on suggested e-commerce price for retail orders (<12 units)
      return Math.round(suggested * 0.8);
    }
  };

  const subtotalCOP = items.reduce((sum, item) => sum + calculateItemUnitPrice(item) * item.quantity, 0);

  // Clean COP formatting without trailing single zero
  const formatCOP = (amount: number) => {
    if (isNaN(amount)) return '$ 0';
    const cleanNum = Math.round(amount);
    const formattedNum = cleanNum.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return `$ ${formattedNum}`;
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
        calculateItemUnitPrice,
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
