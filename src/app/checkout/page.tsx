'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { submitOrder } from '@/lib/supabase';
import { ShoppingBag, ArrowLeft, CheckCircle2, ShieldCheck, Truck, MessageCircle, AlertTriangle, Sparkles, CreditCard, Building2, Info } from 'lucide-react';

// All Colombian departments
const COLOMBIA_DEPARTMENTS = [
  'Amazonas','Antioquia','Arauca','Atlántico','Bolívar','Boyacá','Caldas','Caquetá',
  'Casanare','Cauca','Cesar','Chocó','Córdoba','Cundinamarca','Guainía','Guaviare',
  'Huila','La Guajira','Magdalena','Meta','Nariño','Norte de Santander','Putumayo',
  'Quindío','Risaralda','San Andrés y Providencia','Santander','Sucre','Tolima',
  'Valle del Cauca','Vaupés','Vichada','Bogotá D.C.'
];

function generateOrderId() {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `FE${rand}-${ts}`;
}

export default function CheckoutPage() {
  const { items, subtotalCOP, formatCOP, clearCart, isWholesaleTier, calculateItemUnitPrice } = useCart();
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

    setLoading(true);
    setErrorMessage(null);

    const orderId = generateOrderId();

    const orderPayload = {
      id: orderId,
      order_date: formData.date,
      customer_name: formData.name + (formData.company ? ` / ${formData.company}` : ''),
      customer_doc: `${formData.doc_type} ${formData.doc_number}`,
      customer_email: formData.email,
      customer_phone: formData.phone,
      shipping_address: formData.address,
      city: formData.city,
      department: formData.department,
      payment_method: formData.payment_method,
      total: subtotalCOP,
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

    try {
      await submitOrder(orderPayload);
    } catch (e) {
      console.warn('Supabase database error (bypassing to WhatsApp):', e);
    }

    setLoading(false);
    setCompletedOrder({ ...orderPayload, id: orderId });
    clearCart();
  };

  if (completedOrder) {
    const itemLines = (completedOrder.items || []).map((it: any) =>
      `• REF ${it.reference} | Talla: ${it.size || 'Única'} | ${it.quantity} und × ${formatCOP(it.unit_price)} = ${formatCOP(it.unit_price * it.quantity)}`
    ).join('\n');

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
      `💰 *TOTAL:* ${formatCOP(completedOrder.total)}\n` +
      `🚚 *Envío:* ${completedOrder.is_wholesale ? '✅ GRATIS (12+ unidades)' : '⚠️ Asume el cliente (<12 unidades)'}\n` +
      `💳 *Tarifa:* ${completedOrder.is_wholesale ? 'Mayorista (35–42% OFF)' : 'Detal (20% OFF)'}\n` +
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
            <p><span className="font-bold">Total a pagar:</span> {formatCOP(completedOrder.total)}</p>
            <p className="pt-1 text-ush-pink font-bold border-t border-gray-200">
              {completedOrder.is_wholesale ? '🎉 Tarifa Mayorista (35%-42% OFF) + ENVÍO GRATIS' : '⚠️ Tarifa Detal (20% OFF) - El cliente asume el costo de envío.'}
            </p>
            {completedOrder.payment_method === 'addi' && (
              <p className="text-amber-700 text-[11px] font-semibold flex items-center gap-1 pt-1">
                <Info size={12} /> El costo de transacción por Addi es asumido por el cliente. Tu asesor te enviará el link de pago.
              </p>
            )}
          </div>

          <div className="pt-2 space-y-3">
            <a
              href={`https://wa.me/573022028477?text=${whatsappMsg}`}
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
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-12 bg-neutral-50 min-h-screen">
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
              href="/#catalogo"
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
                      <input
                        type="tel"
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+57 300 000 0000"
                        className="w-full border border-gray-300 p-3 text-xs text-neutral-900 focus:outline-none focus:border-ush-pink"
                      />
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

                  {/* Ciudad y Departamento */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">
                        Ciudad / Municipio *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        placeholder="Ej: Medellín, Bogotá, Bucaramanga"
                        className="w-full border border-gray-300 p-3 text-xs text-neutral-900 focus:outline-none focus:border-ush-pink"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">
                        Departamento *
                      </label>
                      <select
                        required
                        value={formData.department}
                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                        className="w-full border border-gray-300 p-3 text-xs text-neutral-900 focus:outline-none focus:border-ush-pink bg-white"
                      >
                        <option value="">Seleccionar departamento...</option>
                        {COLOMBIA_DEPARTMENTS.map((dep) => (
                          <option key={dep} value={dep}>{dep}</option>
                        ))}
                      </select>
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
                  disabled={loading}
                  className="w-full bg-ush-navy text-white font-bold py-4 px-6 text-xs uppercase tracking-widest hover:bg-ush-pink transition-colors shadow-md disabled:opacity-50 mt-4"
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
                  return (
                    <div key={index} className="py-3 flex justify-between items-center text-xs">
                      <div>
                        <p className="font-black text-ush-navy uppercase">{item.product.name}</p>
                        <p className="text-neutral-500">Talla: {item.selectedSize || '6'} | Cant: {item.quantity}</p>
                        <p className="text-neutral-400">REF: {item.product.reference}</p>
                      </div>
                      <span className="font-extrabold text-neutral-900">
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
                    <Sparkles size={14} /> Tarifa Mayorista Aplicada (35%-42% OFF)
                  </p>
                  <p className="flex items-center gap-1 text-[11px] text-emerald-700">
                    <Truck size={14} /> <strong>¡Envío Gratis Incluido!</strong>
                  </p>
                </div>
              ) : (
                <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1">
                  <p className="font-bold">🏷️ Tarifa Detal (20% OFF Aplicado).</p>
                  <p className="text-[11px] text-red-700 font-semibold flex items-center gap-1">
                    <AlertTriangle size={12} /> Para compras menores a 12 uds, el cliente asume el costo de envío.
                  </p>
                </div>
              )}

              <div className="border-t border-gray-200 pt-4 space-y-2">
                <div className="flex justify-between text-xs text-neutral-600">
                  <span>Subtotal prendas</span>
                  <span>{formatCOP(subtotalCOP)}</span>
                </div>
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
