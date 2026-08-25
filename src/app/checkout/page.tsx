'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { submitOrder, publishOrderChange } from '@/lib/supabase';
import { ShoppingBag, ArrowLeft, CheckCircle2, ShieldCheck, Truck, MessageCircle, AlertTriangle, Sparkles, CreditCard, Building2, Info, ChevronDown, Search, Phone, ArrowUpRight } from 'lucide-react';
import { COLOMBIA_DEPARTMENTS, COLOMBIA_MUNICIPALITIES, PHONE_COUNTRIES } from '@/lib/colombia';
import { getWhatsAppNumber, DEFAULT_WHATSAPP_NUMBER } from '@/lib/siteConfig';
import { getGoogleDriveImageUrl } from '@/lib/drive';
import { INITIAL_PRODUCTS } from '@/data/products';
import { gtagEvent } from '@/lib/analytics';

function generateOrderId() {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `FE${rand}-${ts}`;
}

// Helper para obtener la imagen del ítem con fallback al catálogo estático
function getItemImage(product: any): string {
  if (product.images && Array.isArray(product.images) && product.images.length > 0 && product.images[0]) {
    return getGoogleDriveImageUrl(product.images[0]);
  }
  const match = INITIAL_PRODUCTS.find(
    (p) => p.id === product.id || p.reference === product.reference || p.slug === product.slug
  );
  if (match && match.images && match.images.length > 0 && match.images[0]) {
    return getGoogleDriveImageUrl(match.images[0]);
  }
  return '';
}

// Mínimo mayorista por pedido. Debajo de esto se redirige a la tienda retail.
const MIN_ORDER_UNITS = 8;
const RETAIL_URL = 'https://www.ushuaiajeans.com.co';

export default function CheckoutPage() {
  const { items, subtotalCOP, formatCOP, clearCart, isWholesaleTier, calculateItemUnitPrice, totalUnits, coupon, discountCOP } = useCart();
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    doc_type: 'CC',
    doc_number: '',
    name: '',
    company: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    department: '',
    payment_method: 'transfer',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [cityQuery, setCityQuery] = useState('');
  const [cityOpen, setCityOpen] = useState(false);
  const [phoneCountry, setPhoneCountry] = useState<string>('+57');
  const [phoneCountryOpen, setPhoneCountryOpen] = useState(false);
  const [phoneQuery, setPhoneQuery] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState<string>(DEFAULT_WHATSAPP_NUMBER);

  useEffect(() => {
    getWhatsAppNumber().then(setWhatsappNumber);
  }, []);

  // GA4: inicio del checkout (una vez, con el resumen del carrito)
  useEffect(() => {
    if (items.length === 0) return;
    gtagEvent('begin_checkout', {
      currency: 'COP',
      value: subtotalCOP,
      items: items.map((i) => ({
        item_id: i.product.reference || i.product.slug,
        item_name: i.product.name,
        quantity: i.quantity,
        price: i.product.price || 0,
      })),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Pre-fill from CartDrawer mini-modal (sessionStorage)
  useEffect(() => {
    try {
      const prefillName = sessionStorage.getItem('ush_prefill_name');
      const prefillPhone = sessionStorage.getItem('ush_prefill_phone');
      const prefillCity = sessionStorage.getItem('ush_prefill_city');
      if (prefillName || prefillPhone || prefillCity) {
        setFormData((prev) => ({
          ...prev,
          name: prefillName || prev.name,
          phone: prefillPhone || prev.phone,
          city: prefillCity || prev.city,
        }));
        sessionStorage.removeItem('ush_prefill_name');
        sessionStorage.removeItem('ush_prefill_phone');
        sessionStorage.removeItem('ush_prefill_city');
      }
    } catch {}
  }, []);

  const paymentLabels: Record<string, string> = {
    transfer: 'Transferencia Bancaria',
    card: 'Pago con Tarjeta (Todas las marcas)',
    addi: 'Addi — Paga a cuotas (link enviado por asesor)',
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;

    // Mínimo mayorista: 8 unidades. Debajo de eso se sugiere la tienda retail.
    if (totalUnits < MIN_ORDER_UNITS) {
      setErrorMessage(`El pedido mínimo mayorista es de ${MIN_ORDER_UNITS} unidades (actualmente llevas ${totalUnits}). Si deseas un pedido menor, haz tu compra en nuestra tienda retail www.ushuaiajeans.com.co`);
      setLoading(false);
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    const orderId = generateOrderId();

    // Normaliza el teléfono evitando duplicar el prefijo de país:
    // "3001234567" → "+57 3001234567" · "573001234567" → "+57 3001234567"
    // "+573001234567" o "+57 300..." se conservan tal cual.
    const rawPhone = (formData.phone || '').trim();
    const countryDigits = (phoneCountry || '').replace(/\D/g, '');
    const phoneDigits = rawPhone.replace(/\D/g, '');
    const hasLocalCode = countryDigits && phoneDigits.startsWith(countryDigits) && phoneDigits.length > countryDigits.length;
    const localNumber = hasLocalCode ? phoneDigits.slice(countryDigits.length) : phoneDigits;
    const customerPhone = rawPhone.startsWith('+') ? rawPhone : (localNumber ? `${phoneCountry} ${localNumber}` : rawPhone);

    const orderPayload = {
      id: orderId,
      order_date: formData.date,
      customer_name: formData.name + (formData.company ? ` / ${formData.company}` : ''),
      customer_doc: `${formData.doc_type} ${formData.doc_number}`,
      customer_email: formData.email,
      customer_phone: customerPhone,
      shipping_address: formData.address,
      city: formData.city,
      department: formData.department,
      payment_method: formData.payment_method,
      total: subtotalCOP,
      subtotal_before_discount: subtotalCOP + discountCOP,
      discount: discountCOP,
      coupon_code: coupon?.code || null,
      items: items.map((i) => ({
        product_id: i.product.id,
        reference: i.product.reference,
        name: i.product.name,
        size: i.selectedSize,
        color: i.selectedColor,
        quantity: i.quantity,
        unit_price: calculateItemUnitPrice(i),
      })),
      is_wholesale: isWholesaleTier,
      notes: formData.notes,
      status: 'pending'
    };

    let orderSaved = false;
    try {
      const res = await submitOrder(orderPayload);
      if (res.success) {
        orderSaved = true;
        publishOrderChange();
      } else {
        console.warn('No se pudo registrar el pedido en la base de datos:', res.error);
      }
    } catch (e) {
      console.warn('Supabase database error (bypassing to WhatsApp):', e);
    }

    setLoading(false);

    if (!orderSaved) {
      setErrorMessage('No se pudo registrar tu pedido en la base de datos. Tu carrito se mantiene intacto. Vuelve a intentarlo o contáctanos por WhatsApp para tramitarlo.');
      return;
    }

    setCompletedOrder({ ...orderPayload, id: orderId });
    clearCart();

    gtagEvent('purchase', {
      transaction_id: orderId,
      currency: 'COP',
      value: subtotalCOP,
      items: orderPayload.items.map((i: any) => ({
        item_id: i.reference,
        item_name: i.name,
        quantity: i.quantity,
        price: i.unit_price,
      })),
    });
  };

  if (completedOrder) {
    // Agrupa por referencia+color para no repetir la misma referencia; muestra
    // el detalle por talla y el subtotal una sola vez por referencia.
    const grouped: Record<string, { ref: string; color: string; sizes: { size: string; qty: number }[]; total: number }> = {};
    (completedOrder.items || []).forEach((it: any) => {
      const key = `${it.reference}::${it.color || ''}`;
      if (!grouped[key]) grouped[key] = { ref: it.reference, color: it.color || '', sizes: [], total: 0 };
      const g = grouped[key];
      const size = it.size || 'Única';
      const existing = g.sizes.find((s) => s.size === size);
      if (existing) existing.qty += it.quantity || 0;
      else g.sizes.push({ size, qty: it.quantity || 0 });
      g.total += (it.unit_price || 0) * (it.quantity || 0);
    });
    const itemLines = Object.values(grouped).map((g) =>
      `• *REF ${g.ref}*${g.color ? ` | Color: ${g.color}` : ''}\n    ${g.sizes.map((s) => `Talla ${s.size}: ${s.qty} und`).join(' · ')} = ${formatCOP(g.total)}`
    ).join('\n');

    const completedUnits = (completedOrder.items || []).reduce((s: number, it: any) => s + (it.quantity || 0), 0);
    const isWholesale = completedUnits >= 12;
    const isEscala8 = completedUnits >= 8 && completedUnits <= 11;

    const whatsappMsg = encodeURIComponent(
      `🛍️ *PEDIDO USH BY USHUAIA*\n` +
      `📋 *Ref / Factura:* ${completedOrder.id}\n` +
      `📅 *Fecha:* ${completedOrder.order_date}\n` +
      `───────────────────────\n` +
      `👤 *Cliente:* ${completedOrder.customer_name}\n` +
      `🪪 *Documento:* ${completedOrder.customer_doc}\n` +
      `📍 *Ciudad:* ${completedOrder.city}${completedOrder.department ? `, ${completedOrder.department}` : ''}\n` +
      `🏠 *Dirección:* ${completedOrder.shipping_address}\n` +
      `📞 *Teléfono:* ${completedOrder.customer_phone || 'No indicado'}\n` +
      `✉️ *Correo:* ${completedOrder.customer_email || 'No indicado'}\n` +
      `💳 *Método de pago:* ${paymentLabels[completedOrder.payment_method] || completedOrder.payment_method}\n` +
      `───────────────────────\n` +
      `📦 *DETALLE DEL PEDIDO:*\n${itemLines}\n` +
      `───────────────────────\n` +
      (completedOrder.discount > 0
        ? `🏷️ *Descuento${completedOrder.coupon_code ? ` (${completedOrder.coupon_code})` : ''}:* -${formatCOP(completedOrder.discount)}\n`
        : '') +
      `💰 *TOTAL:* ${formatCOP(completedOrder.total)}\n` +
      `🚚 *Envío:* ${isWholesale ? '✅ GRATIS (12+ unidades)' : '⚠️ Asume el cliente'}\n` +
      `💳 *Tarifa:* ${isWholesale ? 'Mayorista (precio mayorista)' : isEscala8 ? 'Mayorista 8–11 uds (20% de descuento)' : 'Detal (sin descuento mayorista)'}\n` +
      (completedOrder.payment_method === 'addi' ? `\n⚠️ *Nota Addi:* El costo de transacción por Addi es asumido por el cliente.\n` : '') +
      `───────────────────────\n` +
      `¿Pueden confirmar el pedido y acordar el pago y despacho? Gracias 🙏`
    );

    return (
      <div className="py-16 bg-neutral-50 min-h-screen flex items-center justify-center">
        <div className="max-w-xl mx-auto bg-white p-8 border border-gray-200 shadow-xl text-center space-y-6 animate-fadeIn">
          <CheckCircle2 size={56} className="mx-auto text-emerald-600" />
          
          <div>
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-400">
              Pedido Registrado
            </span>
            <h1 className="text-2xl font-black uppercase text-ush-navy mt-1">
              ¡Gracias por tu compra!
            </h1>
            <p className="text-xs text-neutral-500 mt-1">
              Referencia de pedido / factura: <span className="font-bold text-black">{completedOrder.id}</span>
            </p>
          </div>

          <div className="p-4 bg-neutral-50 border border-gray-100 text-left text-xs space-y-1.5 text-neutral-700">
            <p><span className="font-bold">Fecha:</span> {completedOrder.order_date}</p>
            <p><span className="font-bold">Cliente:</span> {completedOrder.customer_name} ({completedOrder.customer_doc})</p>
            <p><span className="font-bold">Destino:</span> {completedOrder.city}{completedOrder.department ? `, ${completedOrder.department}` : ''} — {completedOrder.shipping_address}</p>
            <p><span className="font-bold">Teléfono:</span> {completedOrder.customer_phone}</p>
            <p><span className="font-bold">Método de pago:</span> {paymentLabels[completedOrder.payment_method] || completedOrder.payment_method}</p>
            {completedOrder.discount > 0 && (
              <p><span className="font-bold">Descuento{completedOrder.coupon_code ? ` (${completedOrder.coupon_code})` : ''}:</span> -{formatCOP(completedOrder.discount)}</p>
            )}
            <p><span className="font-bold">Total a pagar:</span> {formatCOP(completedOrder.total)}</p>
            <p className="pt-1 text-ush-pink font-bold border-t border-gray-200">
              {isWholesale ? '🎉 Tarifa Mayorista (precio mayorista 12+ uds) + ENVÍO GRATIS' : isEscala8 ? '✓ Tarifa Mayorista 8–11 uds: 20% de descuento aplicado (el cliente asume el envío).' : '⚠️ Sin descuento mayorista (menos de 8 unidades) - El cliente asume el costo de envío.'}
            </p>
            {completedOrder.payment_method === 'addi' && (
              <p className="text-amber-700 text-[11px] font-semibold flex items-center gap-1 pt-1">
                <Info size={12} /> El costo de transacción por Addi es asumido por el cliente. Tu asesor te enviará el link de pago.
              </p>
            )}
          </div>

          <div className="pt-2 space-y-3">
            <a
              href={`https://wa.me/${whatsappNumber}?text=${whatsappMsg}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 px-6 text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-md transition-colors"
            >
              <MessageCircle size={18} />
              <span>Confirmar Pedido con Asesor por WhatsApp</span>
            </a>

            <Link
              href="/"
              className="block text-xs font-bold uppercase tracking-wider text-neutral-600 hover:text-black py-2"
            >
              Volver al inicio
            </Link>

            <Link
              href="/rastreo"
              className="block text-xs font-bold uppercase tracking-wider text-ush-pink hover:underline py-1"
            >
              Cuando tengas tu guía, rastrea aquí →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-12 bg-neutral-50 min-h-screen">
      <title>Tramitar Pedido | Ush By Ushuaia</title>
      <meta name="description" content="Confirma tu pedido mayorista USH BY USHUAIA: revisa el resumen, aplica cupones y finaliza tu compra." />
      <meta name="robots" content="noindex,nofollow" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-neutral-600 hover:text-black mb-8"
        >
          <ArrowLeft size={16} />
          <span>Continuar Comprando</span>
        </Link>

        <h1 className="text-3xl font-black uppercase text-ush-navy mb-8 tracking-tight">
          Tramitar Pedido
        </h1>

        {items.length === 0 ? (
          <div className="bg-white p-12 text-center border border-gray-200">
            <ShoppingBag size={40} className="mx-auto text-gray-400 mb-3" />
            <h2 className="text-lg font-bold text-neutral-900 uppercase">Tu carrito está vacío</h2>
            <p className="text-xs text-neutral-500 mt-1 mb-6">Agrega prendas antes de proceder al pago.</p>
            <Link
              href="/catalogo"
              className="bg-ush-navy text-white text-xs font-bold uppercase tracking-widest px-6 py-3"
            >
              Ir al Catálogo
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Form Column */}
            <div className="lg:col-span-7 space-y-6">

              {/* ── DATOS DEL PEDIDO ── */}
              <div className="bg-white p-8 border border-gray-200 shadow-sm space-y-5">
                <h2 className="text-base font-bold uppercase tracking-wider text-neutral-900 border-b border-gray-100 pb-3">
                  1. Datos del Cliente y Envío
                </h2>

                {errorMessage && (
                  <div className="p-4 bg-red-50 border-l-4 border-red-600 text-xs text-red-900 space-y-1">
                    <p className="font-bold flex items-center gap-1.5 text-red-800">
                      <AlertTriangle size={16} className="flex-shrink-0 text-red-600" />
                      Error al Procesar el Pedido
                    </p>
                    <p className="text-neutral-700">{errorMessage}</p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4" id="checkout-form">

                  {/* Fecha */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">
                      Fecha del Pedido *
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="w-full border border-gray-300 p-3 text-xs text-neutral-900 focus:outline-none focus:border-ush-pink bg-white"
                    />
                  </div>

                  {/* Documento */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">
                        Tipo Doc. *
                      </label>
                      <select
                        value={formData.doc_type}
                        onChange={(e) => setFormData({ ...formData, doc_type: e.target.value })}
                        className="w-full border border-gray-300 p-3 text-xs text-neutral-900 focus:outline-none focus:border-ush-pink bg-white"
                      >
                        <option value="CC">C.C. (Cédula)</option>
                        <option value="NIT">NIT (Empresa)</option>
                        <option value="CE">C.E. (Extranjería)</option>
                        <option value="PAS">Pasaporte</option>
                      </select>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">
                        Número de Documento / NIT *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.doc_number}
                        onChange={(e) => setFormData({ ...formData, doc_number: e.target.value })}
                        placeholder="Ej: 1020304050  ó  900123456-1"
                        className="w-full border border-gray-300 p-3 text-xs text-neutral-900 focus:outline-none focus:border-ush-pink"
                      />
                    </div>
                  </div>

                  {/* Nombre y Empresa */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">
                        Nombre y Apellidos *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Ej: Carolina Restrepo"
                        className="w-full border border-gray-300 p-3 text-xs text-neutral-900 focus:outline-none focus:border-ush-pink"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">
                        Razón Social / Empresa <span className="text-neutral-400 font-normal">(opcional)</span>
                      </label>
                      <input
                        type="text"
                        value={formData.company}
                        onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                        placeholder="Ej: Boutique Moda SAS"
                        className="w-full border border-gray-300 p-3 text-xs text-neutral-900 focus:outline-none focus:border-ush-pink"
                      />
                    </div>
                  </div>

                  {/* Contacto */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">
                        Correo Electrónico *
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="carolina@ejemplo.com"
                        className="w-full border border-gray-300 p-3 text-xs text-neutral-900 focus:outline-none focus:border-ush-pink"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">
                        Celular / WhatsApp *
                      </label>
                      <div className="flex items-stretch relative">
                        <button
                          type="button"
                          onClick={() => { setPhoneCountryOpen((o) => !o); setPhoneQuery(''); }}
                          className="border border-gray-300 border-r-0 bg-white px-2 text-xs font-bold text-neutral-800 focus:outline-none focus:border-ush-pink flex items-center gap-1"
                          title="Código de país"
                        >
                          <span className="text-base leading-none">{PHONE_COUNTRIES.find((c) => c.code === phoneCountry)?.flag}</span>
                          <span>{phoneCountry}</span>
                          <ChevronDown size={12} className="text-neutral-400" />
                        </button>

                        {phoneCountryOpen && (
                          <div className="absolute z-30 left-0 top-full mt-1 w-64 bg-white border border-gray-300 shadow-xl">
                            <div className="flex items-center gap-2 p-2 border-b border-gray-200">
                              <Search size={14} className="text-neutral-400" />
                              <input
                                type="text"
                                value={phoneQuery}
                                onChange={(e) => setPhoneQuery(e.target.value)}
                                placeholder="Buscar país o código..."
                                autoFocus
                                className="w-full text-xs focus:outline-none text-neutral-900"
                              />
                            </div>
                            <div className="max-h-48 overflow-y-auto">
                              {PHONE_COUNTRIES.filter((c) => c.country.toLowerCase().includes(phoneQuery.toLowerCase()) || c.code.includes(phoneQuery)).map((c) => (
                                <button
                                  key={c.code}
                                  type="button"
                                  onClick={() => { setPhoneCountry(c.code); setPhoneCountryOpen(false); }}
                                  className={`w-full text-left px-3 py-2 text-xs hover:bg-ush-pinkLight flex items-center gap-2 ${phoneCountry === c.code ? 'font-bold text-ush-pink bg-ush-pinkLight' : 'text-neutral-700'}`}
                                >
                                  <span className="text-base leading-none">{c.flag}</span>
                                  <span className="font-bold">{c.code}</span>
                                  <span className="text-neutral-500">{c.country}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        <input
                          type="tel"
                          required
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          placeholder={PHONE_COUNTRIES.find((c) => c.code === phoneCountry)?.placeholder || '300 000 0000'}
                          className="w-full border border-gray-300 p-3 text-xs text-neutral-900 focus:outline-none focus:border-ush-pink"
                        />
                      </div>
                      <p className="text-[10px] text-neutral-400 mt-1">
                        {PHONE_COUNTRIES.find((c) => c.code === phoneCountry)?.flag} {PHONE_COUNTRIES.find((c) => c.code === phoneCountry)?.country} — se enviará como {phoneCountry} {formData.phone || 'tu número'}
                      </p>
                    </div>
                  </div>

                  {/* Dirección */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">
                      Dirección Completa *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="Ej: Calle 10 # 43-20, Barrio El Poblado, Apto 301"
                      className="w-full border border-gray-300 p-3 text-xs text-neutral-900 focus:outline-none focus:border-ush-pink"
                    />
                    <p className="text-[10px] text-neutral-400 mt-1">Formato: Calle / Carrera # Número-Número, Barrio, Apto/Local</p>
                  </div>

                  {/* Departamento y Ciudad */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">
                        Departamento *
                      </label>
                      <select
                        required
                        value={formData.department}
                        onChange={(e) => {
                          setFormData({ ...formData, department: e.target.value, city: '' });
                          setCityQuery('');
                          setCityOpen(false);
                        }}
                        className="w-full border border-gray-300 p-3 text-xs text-neutral-900 focus:outline-none focus:border-ush-pink bg-white"
                      >
                        <option value="">Seleccionar departamento...</option>
                        {COLOMBIA_DEPARTMENTS.map((dep) => (
                          <option key={dep} value={dep}>{dep}</option>
                        ))}
                      </select>
                    </div>

                    <div className="relative">
                      <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">
                        Ciudad / Municipio *
                      </label>
                      {(() => {
                        const citiesForDep = formData.department
                          ? COLOMBIA_MUNICIPALITIES[formData.department] || []
                          : [];
                        const filtered = cityQuery.trim()
                          ? citiesForDep.filter((c) => c.toLowerCase().includes(cityQuery.toLowerCase()))
                          : citiesForDep;
                        return (
                          <>
                            <button
                              type="button"
                              onClick={() => setCityOpen((o) => !o)}
                              className="w-full border border-gray-300 p-3 text-xs text-neutral-900 focus:outline-none focus:border-ush-pink bg-white flex items-center justify-between"
                            >
                              <span className={formData.city ? 'text-neutral-900' : 'text-neutral-400'}>
                                {formData.city || (formData.department ? 'Buscar ciudad...' : 'Primero selecciona el departamento')}
                              </span>
                              <ChevronDown size={14} className="text-neutral-400" />
                            </button>

                            {cityOpen && formData.department && (
                              <div className="absolute z-30 mt-1 w-full bg-white border border-gray-300 shadow-xl">
                                <div className="flex items-center gap-2 p-2 border-b border-gray-200">
                                  <Search size={14} className="text-neutral-400" />
                                  <input
                                    type="text"
                                    value={cityQuery}
                                    onChange={(e) => setCityQuery(e.target.value)}
                                    placeholder="Filtrar por nombre..."
                                    autoFocus
                                    className="w-full text-xs focus:outline-none text-neutral-900"
                                  />
                                </div>
                                <div className="max-h-44 overflow-y-auto">
                                  {filtered.length === 0 ? (
                                    <p className="p-3 text-xs text-neutral-400">No se encontraron ciudades.</p>
                                  ) : (
                                    filtered.map((c) => (
                                      <button
                                        key={c}
                                        type="button"
                                        onClick={() => {
                                          setFormData({ ...formData, city: c });
                                          setCityQuery('');
                                          setCityOpen(false);
                                        }}
                                        className={`w-full text-left px-3 py-2 text-xs hover:bg-ush-pinkLight ${formData.city === c ? 'font-bold text-ush-pink bg-ush-pinkLight' : 'text-neutral-700'}`}
                                      >
                                        {c}
                                      </button>
                                    ))
                                  )}
                                </div>
                              </div>
                            )}
                          </>
                        );
                      })()}
                      {cityOpen && !formData.department && (
                        <p className="text-[10px] text-amber-600 mt-1">Selecciona primero el departamento para ver sus ciudades.</p>
                      )}
                    </div>
                  </div>

                  {/* Notas */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">
                      Notas adicionales / Transportadora preferida
                    </label>
                    <textarea
                      rows={2}
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Ej: Enviar por Servientrega, Envía, Interrapidísimo... Instrucciones de entrega..."
                      className="w-full border border-gray-300 p-3 text-xs text-neutral-900 focus:outline-none focus:border-ush-pink"
                    />
                  </div>
                </form>
              </div>

              {/* ── MÉTODOS DE PAGO ── */}
              <div className="bg-white p-8 border border-gray-200 shadow-sm space-y-4">
                <h2 className="text-base font-bold uppercase tracking-wider text-neutral-900 border-b border-gray-100 pb-3">
                  2. Método de Pago
                </h2>

                <div className="space-y-3">
                  {/* Transferencia */}
                  <label className={`flex items-start gap-4 p-4 border-2 cursor-pointer transition-colors ${formData.payment_method === 'transfer' ? 'border-[#1b2333] bg-neutral-50' : 'border-gray-200 hover:border-gray-300'}`}>
                    <input
                      type="radio"
                      name="payment_method"
                      value="transfer"
                      checked={formData.payment_method === 'transfer'}
                      onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                      className="mt-0.5 accent-[#1b2333]"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Building2 size={16} className="text-[#1b2333]" />
                        <span className="text-xs font-bold uppercase tracking-wide text-neutral-900">Transferencia Bancaria</span>
                      </div>
                      <p className="text-[11px] text-neutral-500 leading-relaxed">
                        Tu asesor te enviará los datos bancarios (Bancolombia / Nequi / Daviplata) para efectuar la transferencia antes del despacho.
                      </p>
                    </div>
                  </label>

                  {/* Tarjeta */}
                  <label className={`flex items-start gap-4 p-4 border-2 cursor-pointer transition-colors ${formData.payment_method === 'card' ? 'border-[#1b2333] bg-neutral-50' : 'border-gray-200 hover:border-gray-300'}`}>
                    <input
                      type="radio"
                      name="payment_method"
                      value="card"
                      checked={formData.payment_method === 'card'}
                      onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                      className="mt-0.5 accent-[#1b2333]"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <CreditCard size={16} className="text-[#1b2333]" />
                        <span className="text-xs font-bold uppercase tracking-wide text-neutral-900">Todas las Tarjetas</span>
                      </div>
                      <p className="text-[11px] text-neutral-500 leading-relaxed">
                        Aceptamos todas las tarjetas débito y crédito (Visa, Mastercard, Amex). Tu asesor te enviará un link de pago seguro.
                      </p>
                    </div>
                  </label>

                  {/* Addi */}
                  <label className={`flex items-start gap-4 p-4 border-2 cursor-pointer transition-colors ${formData.payment_method === 'addi' ? 'border-[#d88193] bg-rose-50' : 'border-gray-200 hover:border-gray-300'}`}>
                    <input
                      type="radio"
                      name="payment_method"
                      value="addi"
                      checked={formData.payment_method === 'addi'}
                      onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                      className="mt-0.5 accent-[#d88193]"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Sparkles size={16} className="text-[#d88193]" />
                        <span className="text-xs font-bold uppercase tracking-wide text-neutral-900">Addi — Paga a Cuotas</span>
                        <span className="text-[9px] font-black uppercase bg-[#d88193] text-white px-1.5 py-0.5 rounded">CUOTAS SIN INTERÉS</span>
                      </div>
                      <p className="text-[11px] text-neutral-500 leading-relaxed mb-2">
                        Tu asesor te enviará el link de pago por Addi para que puedas pagar en cuotas sin interés.
                      </p>
                      {formData.payment_method === 'addi' && (
                        <div className="flex items-start gap-1.5 bg-amber-50 border border-amber-200 p-2 rounded text-[11px] text-amber-800">
                          <AlertTriangle size={12} className="shrink-0 mt-0.5 text-amber-600" />
                          <span><strong>Importante:</strong> El costo de transacción generado por el uso de Addi debe ser asumido por el cliente.</span>
                        </div>
                      )}
                    </div>
                  </label>
                </div>

                <button
                  type="submit"
                  form="checkout-form"
                  disabled={loading || totalUnits < MIN_ORDER_UNITS}
                  className="w-full font-bold py-4 px-6 text-xs uppercase tracking-widest transition-colors shadow-md disabled:opacity-50 mt-4 disabled:cursor-not-allowed bg-ush-navy text-white hover:bg-ush-pink"
                >
                  {loading ? 'Registrando Pedido...' : 'Confirmar & Tramitar Pedido →'}
                </button>
              </div>
            </div>

            {/* Order Summary Column */}
            <div className="lg:col-span-5 bg-white p-6 border border-gray-200 shadow-sm space-y-6 lg:sticky lg:top-24">
              <h2 className="text-base font-bold uppercase tracking-wider text-neutral-900 border-b border-gray-100 pb-3">
                Resumen del Pedido ({items.length} ítems)
              </h2>

              <div className="divide-y divide-gray-100 max-h-80 overflow-y-auto pr-2">
                {items.map((item, index) => {
                  const unitPrice = calculateItemUnitPrice(item);
                  const imgUrl = getItemImage(item.product);
                  return (
                    <div key={index} className="py-3 flex items-center gap-3 text-xs">
                      <div className="relative w-14 h-16 bg-neutral-100 flex-shrink-0 overflow-hidden border border-gray-200 flex items-center justify-center">
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
                        <div className={`${imgUrl ? 'hidden' : ''} flex flex-col items-center justify-center text-neutral-400 text-center`}>
                          <ShoppingBag size={16} />
                          <span className="text-[8px] font-bold uppercase mt-0.5">Prenda</span>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-ush-navy uppercase truncate">{item.product.name}</p>
                        <p className="text-neutral-500">Talla: {item.selectedSize || 'Única'}{item.selectedColor ? ` | Color: ${item.selectedColor}` : ''} | Cant: {item.quantity}</p>
                        <p className="text-neutral-400">REF: {item.product.reference}</p>
                      </div>
                      <span className="font-extrabold text-neutral-900 whitespace-nowrap">
                        {formatCOP(unitPrice * item.quantity)}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Discount Tier Notice */}
              {isWholesaleTier ? (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold space-y-1">
                  <p className="flex items-center gap-1 font-bold">
                    <Sparkles size={14} /> Precio Mayorista Aplicado (12+ uds)
                  </p>
                  <p className="flex items-center gap-1 text-[11px] text-emerald-700">
                    <Truck size={14} /> <strong>¡Envío Gratis Incluido!</strong>
                  </p>
                </div>
              ) : totalUnits >= 8 ? (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold space-y-1">
                  <p className="flex items-center gap-1 font-bold">
                    <Sparkles size={14} /> 20% de Descuento Aplicado (compra mínima de 8 a 11 uds)
                  </p>
                  <p className="text-[11px] text-emerald-700">
                    Súmale {12 - totalUnits} unidad(es) para activar el precio mayorista + envío gratis.
                  </p>
                </div>
              ) : (
                <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-2">
                  <p className="font-bold">⛔ Pedido mínimo: {MIN_ORDER_UNITS} unidades.</p>
                  <p className="text-[11px] text-red-700 font-semibold flex items-center gap-1">
                    <AlertTriangle size={12} /> Faltan {MIN_ORDER_UNITS - totalUnits} unidad(es) para poder tomar tu pedido mayorista.
                  </p>
                  <p className="text-[11px] text-amber-800">
                    ¿Buscas comprar menos de {MIN_ORDER_UNITS} unidades? Compra en nuestra tienda retail:
                    <a
                      href={RETAIL_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-bold text-ush-pink hover:underline ml-1"
                    >
                      www.ushuaiajeans.com.co <ArrowUpRight size={12} />
                    </a>
                  </p>
                </div>
              )}

              <div className="border-t border-gray-200 pt-4 space-y-2">
                <div className="flex justify-between text-xs text-neutral-600">
                  <span>Subtotal prendas</span>
                  <span>{formatCOP(subtotalCOP + discountCOP)}</span>
                </div>
                {coupon && discountCOP > 0 && (
                  <div className="flex justify-between text-xs text-emerald-700 font-semibold">
                    <span>Cupón {coupon.code} (−{Math.round(coupon.discount * 100)}%)</span>
                    <span>−{formatCOP(discountCOP)}</span>
                  </div>
                )}
                <div className="flex justify-between text-xs text-neutral-600">
                  <span>Costo de envío</span>
                  <span className="font-semibold">
                    {isWholesaleTier ? (
                      <span className="text-emerald-600 font-bold">GRATIS</span>
                    ) : (
                      <span className="text-amber-700">A asumir por el cliente</span>
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-base font-black text-neutral-900 pt-2 border-t border-gray-100">
                  <span>Total Estimado</span>
                  <span>{formatCOP(subtotalCOP)}</span>
                </div>
              </div>

              {/* Security badges */}
              <div className="flex items-center gap-3 text-[10px] text-neutral-400 pt-2 border-t border-gray-100">
                <ShieldCheck size={14} className="text-emerald-500 shrink-0" />
                <span>Compra 100% segura — Pedido confirmado por asesor comercial</span>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
