'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { X, Plus, Minus, Trash2, ShoppingBag, ArrowRight, Layers, Check } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { INITIAL_PRODUCTS } from '@/data/products';
import { getGoogleDriveImageUrl } from '@/lib/drive';

export const CartDrawer: React.FC = () => {
  const {
    items,
    isCartOpen,
    setIsCartOpen,
    removeFromCart,
    updateQuantity,
    subtotalCOP,
    formatCOP,
    totalItemsCount,
    isWholesaleTier,
    calculateItemUnitPrice,
  } = useCart();

  const router = useRouter();

  if (!isCartOpen) return null;

  // Build map of sizes per reference to detect multi-size selections
  const referenceSizesMap: Record<string, string[]> = {};
  items.forEach((it) => {
    const refKey = it.product.reference || it.product.name;
    if (!referenceSizesMap[refKey]) referenceSizesMap[refKey] = [];
    if (it.selectedSize && !referenceSizesMap[refKey].includes(it.selectedSize)) {
      referenceSizesMap[refKey].push(it.selectedSize);
    }
  });

  const hasMultiSizeReferences = Object.values(referenceSizesMap).some((sizes) => sizes.length > 1);

  // Direct checkout navigation — no mini-modal
  const handleProceedToCheckout = () => {
    setIsCartOpen(false);
    router.push('/checkout');
  };

  // Helper to get image URL with fallback to INITIAL_PRODUCTS + Drive conversion
  const getItemImage = (product: any): string => {
    if (product.images && Array.isArray(product.images) && product.images.length > 0 && product.images[0]) {
      return getGoogleDriveImageUrl(product.images[0]);
    }
    // Fallback: search in INITIAL_PRODUCTS
    const match = INITIAL_PRODUCTS.find(
      (p) => p.id === product.id || p.reference === product.reference || p.slug === product.slug
    );
    if (match && match.images && match.images.length > 0 && match.images[0]) {
      return getGoogleDriveImageUrl(match.images[0]);
    }
    return '';
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop overlay */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={() => setIsCartOpen(false)}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col justify-between">

          {/* Header */}
          <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-ush-navy text-white">
            <div className="flex items-center gap-3">
              <ShoppingBag size={20} className="text-ush-pink" />
              <div>
                <h2 className="text-base font-bold uppercase tracking-wider">Tu Carrito de Compras</h2>
                <p className="text-xs text-neutral-300">{totalItemsCount} prendas seleccionadas</p>
              </div>
            </div>
            <button
              onClick={() => setIsCartOpen(false)}
              className="p-2 text-neutral-300 hover:text-white transition-colors"
              aria-label="Cerrar carrito"
            >
              <X size={22} />
            </button>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-6 divide-y divide-gray-100">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-12">
                <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-400 mb-4">
                  <ShoppingBag size={28} />
                </div>
                <p className="text-base font-bold text-neutral-900 uppercase">Tu carrito está vacío</p>
                <p className="text-xs text-neutral-500 mt-1 max-w-xs">
                  Agrega referencias del catálogo mayorista para comenzar tu pedido.
                </p>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="mt-6 bg-[#1b2333] text-white text-xs font-bold uppercase tracking-widest px-6 py-3 hover:bg-[#d88193] transition-colors"
                >
                  Explorar Catálogo
                </button>
              </div>
            ) : (
              <>
                {/* Multi-size alert banner */}
                {hasMultiSizeReferences && (
                  <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-xs text-neutral-800 animate-fadeIn">
                    <p className="font-bold text-[#c06579] flex items-center gap-1.5 mb-0.5">
                      <Layers size={14} /> Múltiples Tallas por Referencia
                    </p>
                    <p className="text-[11px] text-neutral-600 font-light leading-relaxed">
                      Has agregado la misma referencia en diferentes tallas. Cada una se desglosa por separado.
                    </p>
                  </div>
                )}

                {items.map((item, index) => {
                  const unitPrice = calculateItemUnitPrice(item);
                  const refKey = item.product.reference || item.product.name;
                  const siblingSizes = (referenceSizesMap[refKey] || []).filter((s) => s !== item.selectedSize);
                  const imgUrl = getItemImage(item.product);

                  return (
                    <div key={index} className="py-4 flex gap-4 items-center">
                      {/* Thumbnail */}
                      <div className="relative w-20 h-24 bg-neutral-100 flex-shrink-0 overflow-hidden border border-gray-200 flex items-center justify-center">
                        {imgUrl ? (
                          <img
                            src={imgUrl}
                            alt={item.product.name}
                            className="w-full h-full object-cover object-center"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                              const fallbackEl = (e.target as HTMLElement).nextElementSibling;
                              if (fallbackEl) fallbackEl.classList.remove('hidden');
                            }}
                          />
                        ) : null}
                        <div className={`${imgUrl ? 'hidden' : ''} flex flex-col items-center justify-center text-neutral-400 p-1 text-center`}>
                          <ShoppingBag size={20} />
                          <span className="text-[8px] font-bold uppercase mt-1">Prenda</span>
                        </div>
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-black text-ush-navy uppercase truncate">
                          {item.product.name}
                        </h3>

                        <div className="flex flex-wrap items-center gap-1.5 mt-1 text-xs text-neutral-500">
                          {item.selectedSize && (
                            <span className="bg-neutral-100 px-2 py-0.5 font-bold text-neutral-800 border border-gray-200">
                              Talla: {item.selectedSize}
                            </span>
                          )}
                          {item.selectedColor && (
                            <span className="bg-neutral-100 px-2 py-0.5 text-neutral-800 border border-gray-200">
                              {item.selectedColor}
                            </span>
                          )}
                        </div>

                        {/* Multi-size confirmation badge */}
                        {siblingSizes.length > 0 && (
                          <div className="mt-1.5 text-[10px] text-[#c06579] bg-rose-50 border border-rose-200 px-2 py-1 font-semibold flex items-center gap-1">
                            <Layers size={12} className="flex-shrink-0" />
                            <span>Talla {item.selectedSize} (también llevas Talla {siblingSizes.join(', ')})</span>
                          </div>
                        )}

                        <div className="mt-1.5 flex items-baseline gap-2">
                          <span className="text-sm font-black text-neutral-900">
                            {formatCOP(unitPrice)}
                          </span>
                          <span className="text-[10px] text-gray-400">c/u</span>
                        </div>

                        {/* Quantity Controls */}
                        <div className="flex items-center gap-3 mt-3">
                          <div className="flex items-center border border-gray-300 bg-white">
                            <button
                              onClick={() => updateQuantity(index, item.quantity - 1)}
                              className="p-1 hover:bg-neutral-100 text-neutral-600 transition-colors"
                            >
                              <Minus size={14} />
                            </button>
                            <span className="px-3 text-xs font-black text-neutral-900">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(index, item.quantity + 1)}
                              className="p-1 hover:bg-neutral-100 text-neutral-600 transition-colors"
                            >
                              <Plus size={14} />
                            </button>
                          </div>

                          <button
                            onClick={() => removeFromCart(index)}
                            className="text-gray-400 hover:text-red-600 transition-colors p-1"
                            title="Eliminar del carrito"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>

          {/* Footer Summary — Clean & Minimalist */}
          {items.length > 0 && (
            <div className="p-6 border-t border-gray-100 bg-gray-50 space-y-4">

              {/* Simple Clean Summary */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-xs text-neutral-500">
                  <span>Total Prendas:</span>
                  <span className="font-bold text-neutral-900">{totalItemsCount} unidades</span>
                </div>
                <div className="flex justify-between items-baseline pt-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-neutral-700">Subtotal Estimado</span>
                  <span className="text-xl font-black text-neutral-900">{formatCOP(subtotalCOP)}</span>
                </div>
              </div>

              {/* Single direct action: goes straight to /checkout */}
              <button
                onClick={handleProceedToCheckout}
                className="w-full bg-ush-navy text-white font-bold py-4 px-4 text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-ush-pink transition-all shadow-md active:scale-[0.99]"
              >
                <span>Tramitar Pedido</span>
                <ArrowRight size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
