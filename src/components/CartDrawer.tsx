'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { X, Plus, Minus, Trash2, ShoppingBag, ArrowRight, MessageCircle } from 'lucide-react';
import { useCart } from '@/context/CartContext';

export const CartDrawer: React.FC = () => {
  const { items, isCartOpen, setIsCartOpen, removeFromCart, updateQuantity, subtotalCOP, formatCOP, totalItemsCount } = useCart();

  if (!isCartOpen) return null;

  // Generate WhatsApp Order pre-filled message
  const whatsappMessage = encodeURIComponent(
    `Hola USH BY USHUAIA, deseo realizar un pedido mayorista:\n\n` +
      items
        .map(
          (item, idx) =>
            `${idx + 1}. Ref: ${item.product.reference} | Talla: ${item.selectedSize || 'N/A'} | Cant: ${
              item.quantity
            } x ${formatCOP(item.product.price)}`
        )
        .join('\n') +
      `\n\nTotal estimado: ${formatCOP(subtotalCOP)}\n\n¿Me ayudan a confirmarlo?`
  );

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop overlay */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-fadeIn"
        onClick={() => setIsCartOpen(false)}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col justify-between">
          
          {/* Header */}
          <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-neutral-900 text-white">
            <div className="flex items-center gap-3">
              <ShoppingBag size={20} className="text-amber-400" />
              <div>
                <h2 className="text-base font-bold uppercase tracking-wider">Tu Carrito</h2>
                <p className="text-xs text-neutral-400">{totalItemsCount} prendas seleccionadas</p>
              </div>
            </div>
            <button
              onClick={() => setIsCartOpen(false)}
              className="p-2 text-neutral-400 hover:text-white transition-colors"
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
                  className="mt-6 bg-neutral-900 text-white text-xs font-bold uppercase tracking-widest px-6 py-3 hover:bg-neutral-800 transition-colors"
                >
                  Explorar Catálogo
                </button>
              </div>
            ) : (
              items.map((item, index) => (
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
                    <h3 className="text-sm font-bold text-neutral-900 uppercase truncate">
                      {item.product.name}
                    </h3>
                    
                    <div className="flex items-center gap-2 mt-1 text-xs text-neutral-500">
                      {item.selectedSize && (
                        <span className="bg-neutral-100 px-2 py-0.5 font-semibold text-neutral-800">
                          Talla: {item.selectedSize}
                        </span>
                      )}
                      {item.selectedColor && (
                        <span className="bg-neutral-100 px-2 py-0.5 text-neutral-800">
                          {item.selectedColor}
                        </span>
                      )}
                    </div>

                    <p className="text-sm font-extrabold text-neutral-900 mt-2">
                      {formatCOP(item.product.price)}
                    </p>

                    {/* Quantity Controls */}
                    <div className="flex items-center gap-3 mt-3">
                      <div className="flex items-center border border-gray-200 bg-white">
                        <button
                          onClick={() => updateQuantity(index, item.quantity - 1)}
                          className="p-1 hover:bg-neutral-100 text-neutral-600 transition-colors"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="px-3 text-xs font-bold text-neutral-900">
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
              ))
            )}
          </div>

          {/* Footer Subtotal & Action Buttons */}
          {items.length > 0 && (
            <div className="p-6 border-t border-gray-100 bg-neutral-50 space-y-4">
              <div className="flex justify-between items-baseline">
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-600">Subtotal Estimado</span>
                <span className="text-xl font-black text-neutral-900">{formatCOP(subtotalCOP)}</span>
              </div>

              {totalItemsCount < 12 ? (
                <div className="p-2.5 bg-amber-50 border border-amber-200 text-amber-900 text-xs font-medium text-center">
                  💡 Agrega {12 - totalItemsCount} prendas más para aplicar la escala máxima de descuento mayorista.
                </div>
              ) : (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold text-center flex items-center justify-center gap-1">
                  🎉 ¡Felicidades! Aplica tarifa especial por volumen (12+ uds).
                </div>
              )}

              <div className="space-y-2">
                <Link
                  href="/checkout"
                  onClick={() => setIsCartOpen(false)}
                  className="w-full bg-neutral-900 text-white font-bold py-3.5 px-4 text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-neutral-800 transition-all shadow-md"
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
                  <span>Pedir por WhatsApp</span>
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
