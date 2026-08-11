'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { X, Plus, Minus, Trash2, ShoppingBag, ArrowRight, MessageCircle, Truck, AlertTriangle, Sparkles } from 'lucide-react';
import { useCart } from '@/context/CartContext';

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

  if (!isCartOpen) return null;

  // WhatsApp Order message
  const whatsappMessage = encodeURIComponent(
    `Hola USH BY USHUAIA, deseo realizar un pedido:\n\n` +
      items
        .map(
          (item, idx) =>
            `${idx + 1}. Ref: ${item.product.reference} | Talla: ${item.selectedSize || '6'} | Cant: ${
              item.quantity
            } x ${formatCOP(calculateItemUnitPrice(item))}`
        )
        .join('\n') +
      `\n\nTotal estimado: ${formatCOP(subtotalCOP)}\n` +
      `Tipo de tarifa: ${isWholesaleTier ? 'MAYORISTA (35%-42% OFF + ENVÍO GRATIS)' : 'DETAL (20% OFF - Cliente asume envío)'}\n\n` +
      `¿Me ayudan a confirmarlo?`
  );

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
                  className="mt-6 bg-ush-navy text-white text-xs font-bold uppercase tracking-widest px-6 py-3 hover:bg-ush-pink transition-colors"
                >
                  Explorar Catálogo
                </button>
              </div>
            ) : (
              items.map((item, index) => {
                const unitPrice = calculateItemUnitPrice(item);
                return (
                  <div key={index} className="py-4 flex gap-4 items-center">
                    {/* Thumbnail */}
                    <div className="relative w-20 h-24 bg-neutral-100 flex-shrink-0 overflow-hidden border border-gray-200">
                      <Image
                        src={item.product.images[0] || 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=200'}
                        alt={item.product.name}
                        fill
                        className="object-cover"
                      />
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-black text-ush-navy uppercase truncate">
                        {item.product.name}
                      </h3>
                      
                      <div className="flex items-center gap-2 mt-1 text-xs text-neutral-500">
                        {item.selectedSize && (
                          <span className="bg-neutral-100 px-2 py-0.5 font-bold text-neutral-800">
                            Talla: {item.selectedSize}
                          </span>
                        )}
                        {item.selectedColor && (
                          <span className="bg-neutral-100 px-2 py-0.5 text-neutral-800">
                            {item.selectedColor}
                          </span>
                        )}
                      </div>

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
                          className="text-red-500 hover:text-red-700 transition-colors p-1"
                          title="Eliminar producto"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Subtotal & Action Buttons */}
          {items.length > 0 && (
            <div className="p-6 border-t border-gray-100 bg-neutral-50 space-y-4">
              
              {/* Discount & Shipping Banner */}
              {isWholesaleTier ? (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold text-center space-y-1">
                  <div className="flex items-center justify-center gap-1 font-bold text-emerald-800">
                    <Sparkles size={14} /> ¡TARIFA MAYORISTA APLICADA (35%-42% OFF)!
                  </div>
                  <div className="flex items-center justify-center gap-1 text-[11px] text-emerald-700">
                    <Truck size={14} /> <strong>¡Envío Gratis Incluido!</strong>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 text-xs text-center space-y-1">
                  <p className="font-bold text-amber-900">
                    🏷️ Descuento Detal (20% OFF aplicado).
                  </p>
                  <p className="text-[11px] text-amber-800">
                    💡 Agrega <strong>{12 - totalItemsCount}</strong> prendas más para obtener <strong>Precio Mayorista (35%-42% OFF) + ENVÍO GRATIS</strong>.
                  </p>
                  <p className="text-[10px] font-bold text-red-700 pt-1 border-t border-amber-200 flex items-center justify-center gap-1">
                    <AlertTriangle size={12} /> Para compras menores a 12 uds, el cliente debe asumir el costo de envío.
                  </p>
                </div>
              )}

              <div className="flex justify-between items-baseline pt-2">
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-600">Subtotal Estimado</span>
                <span className="text-xl font-black text-neutral-900">{formatCOP(subtotalCOP)}</span>
              </div>

              <div className="space-y-2 pt-2">
                <Link
                  href="/checkout"
                  onClick={() => setIsCartOpen(false)}
                  className="w-full bg-ush-navy text-white font-bold py-3.5 px-4 text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-ush-pink transition-all shadow-md"
                >
                  <span>Tramitar Pedido</span>
                  <ArrowRight size={16} />
                </Link>

                <a
                  href={`https://wa.me/573000000000?text=${whatsappMessage}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-emerald-600 text-white font-bold py-3 px-4 text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-emerald-700 transition-colors"
                >
                  <MessageCircle size={16} />
                  <span>Enviar Pedido al Asesor por WhatsApp</span>
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
