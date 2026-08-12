'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  X, Plus, Minus, Trash2, ShoppingBag, ArrowRight,
  AlertTriangle, Sparkles, Layers, User, Phone, MapPin, CheckCircle2
} from 'lucide-react';
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

  const router = useRouter();

  // Mini-modal state for required customer data
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerCity, setCustomerCity] = useState('');
  const [formError, setFormError] = useState('');

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

  const handleConfirmOrder = () => {
    setFormError('');
    if (!customerName.trim() || !customerPhone.trim() || !customerCity.trim()) {
      setFormError('Por favor completa todos los campos para continuar.');
      return;
    }
    if (customerPhone.trim().length < 7) {
      setFormError('Ingresa un número de teléfono válido.');
      return;
    }
    // Store pre-filled data in sessionStorage so checkout can use it
    sessionStorage.setItem('ush_prefill_name', customerName.trim());
    sessionStorage.setItem('ush_prefill_phone', customerPhone.trim());
    sessionStorage.setItem('ush_prefill_city', customerCity.trim());
    setShowCustomerModal(false);
    setIsCartOpen(false);
    router.push('/checkout');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop overlay */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={() => { setIsCartOpen(false); setShowCustomerModal(false); }}
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
              onClick={() => { setIsCartOpen(false); setShowCustomerModal(false); }}
              className="p-2 text-neutral-300 hover:text-white transition-colors"
              aria-label="Cerrar carrito"
            >
              <X size={22} />
            </button>
          </div>

          {/* ── Mini-modal: datos del cliente (obligatorio) ── */}
          {showCustomerModal && (
            <div className="absolute inset-0 z-[100] flex items-end justify-center bg-black/60 backdrop-blur-sm">
              <div className="w-full bg-white shadow-2xl border-t-4 border-[#d88193] p-6 space-y-4 animate-[slideDown_0.3s_ease-out]">
                <div className="flex items-center justify-between mb-1">
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-wider text-[#1b2333]">Datos de Confirmación Mayorista</h3>
                    <p className="text-[11px] text-neutral-500 mt-0.5">Requerido para preparar y confirmar tu pedido</p>
                  </div>
                  <button onClick={() => setShowCustomerModal(false)} className="text-neutral-400 hover:text-neutral-700">
                    <X size={18} />
                  </button>
                </div>

                {/* Name */}
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 flex items-center gap-1 mb-1">
                    <User size={11} /> Nombre Completo / Contacto *
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Ej: María Rodríguez"
                    className="w-full border border-gray-300 p-2.5 text-xs text-neutral-900 focus:outline-none focus:border-[#d88193]"
                    autoFocus
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 flex items-center gap-1 mb-1">
                    <Phone size={11} /> Teléfono / WhatsApp *
                  </label>
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="Ej: 3001234567"
                    className="w-full border border-gray-300 p-2.5 text-xs text-neutral-900 focus:outline-none focus:border-[#d88193]"
                  />
                </div>

                {/* City */}
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 flex items-center gap-1 mb-1">
                    <MapPin size={11} /> Ciudad y Departamento *
                  </label>
                  <input
                    type="text"
                    value={customerCity}
                    onChange={(e) => setCustomerCity(e.target.value)}
                    placeholder="Ej: Medellín, Antioquia"
                    className="w-full border border-gray-300 p-2.5 text-xs text-neutral-900 focus:outline-none focus:border-[#d88193]"
                  />
                </div>

                {/* Error */}
                {formError && (
                  <p className="text-[11px] text-red-600 font-bold flex items-center gap-1">
                    <AlertTriangle size={12} /> {formError}
                  </p>
                )}

                <p className="text-[10px] text-neutral-400">
                  Estos datos se registrarán en tu pedido. Serás redirigido al resumen final para enviarlo directamente al asesor por WhatsApp.
                </p>

                <button
                  onClick={handleConfirmOrder}
                  className="w-full bg-[#1b2333] text-white font-bold py-3.5 px-4 text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-[#d88193] transition-all shadow-md"
                >
                  <CheckCircle2 size={16} /> Continuar al Resumen del Pedido
                </button>
              </div>
            </div>
          )}

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
                  <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200 text-xs text-neutral-800 animate-fadeIn">
                    <p className="font-bold text-[#c06579] flex items-center gap-1.5 mb-1">
                      <Layers size={14} /> Múltiples Tallas por Referencia
                    </p>
                    <p className="text-[11px] text-neutral-600 font-light leading-relaxed">
                      Confirmado: Has agregado la misma referencia en diferentes tallas. Cada combinación se desglosa individualmente para mayor claridad en tu pedido.
                    </p>
                  </div>
                )}

                {items.map((item, index) => {
                  const unitPrice = calculateItemUnitPrice(item);
                  const refKey = item.product.reference || item.product.name;
                  const siblingSizes = (referenceSizesMap[refKey] || []).filter((s) => s !== item.selectedSize);
                  const firstImgUrl = item.product.images && item.product.images.length > 0 ? item.product.images[0] : '';

                  return (
                    <div key={index} className="py-4 flex gap-4 items-center">
                      {/* Thumbnail with standard img + fallback */}
                      <div className="relative w-20 h-24 bg-neutral-100 flex-shrink-0 overflow-hidden border border-gray-200 flex items-center justify-center">
                        {firstImgUrl ? (
                          <img
                            src={firstImgUrl}
                            alt={item.product.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                              (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                        ) : null}
                        <div className={`${firstImgUrl ? 'hidden' : ''} flex flex-col items-center justify-center text-neutral-400 p-1 text-center`}>
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
                            <span>Misma ref en Talla {item.selectedSize} (también llevas Talla {siblingSizes.join(', ')})</span>
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

          {/* Footer Summary */}
          {items.length > 0 && (
            <div className="p-6 border-t border-gray-100 bg-gray-50 space-y-4">

              {/* Pricing Tier Notice */}
              {isWholesaleTier ? (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs space-y-1">
                  <p className="font-bold text-emerald-900 flex items-center gap-1.5">
                    <Sparkles size={14} /> ¡CALIFICAS A PRECIO MAYORISTA (35%-42% OFF)!
                  </p>
                  <p className="text-[11px] text-emerald-800">
                    🎉 Has acumulado <strong>{totalItemsCount} prendas</strong>. Aplica tarifa de distribuidor + <strong>ENVÍO GRATIS INCLUIDO</strong>.
                  </p>
                </div>
              ) : (
                <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1">
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
                {/* ÚNICO CTA: abre mini-modal de datos obligatorios */}
                <button
                  onClick={() => { setFormError(''); setShowCustomerModal(true); }}
                  className="w-full bg-ush-navy text-white font-bold py-3.5 px-4 text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-ush-pink transition-all shadow-md"
                >
                  <span>Confirmar Pedido</span>
                  <ArrowRight size={16} />
                </button>
                <p className="text-[10px] text-neutral-400 text-center">
                  Se requieren tus datos para procesar el pedido.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
