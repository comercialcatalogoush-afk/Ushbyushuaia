'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { fetchAllProductsAdmin, supabase, fetchPriceHistory, fetchOrdersAdmin, confirmOrderAndDeductStock, cancelOrderAndRestoreStock, subscribeCatalogChanges, publishOrderChange } from '@/lib/supabase';
import { exportBackup, downloadBackup, exportOrderExcel, purgeTransactionalData, getNextBackupReminder, formatReminder, downloadReminderIcs, getReminderCountdown } from '@/lib/backup';
import { Product, PriceHistoryRecord } from '@/types';
import { SiteContentEditor } from '@/components/SiteContentEditor';
import { generateInvoicePdf, uploadInvoicePdf, buildInvoiceWhatsAppUrl } from '@/lib/invoice';
import {
  Trash2, Save, X, ArrowLeft, CheckCircle,
  Lock, LogOut, ShieldAlert, Key, History,
  RefreshCw, ShoppingBag, LayoutTemplate, XCircle,
  FileSpreadsheet, FileText,
} from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { Logo } from '@/components/Logo';

const ADMIN_EMAIL = 'comercialmayoristas@ushuaiajeans.com.co';
const DEFAULT_FITS = ['Wide Leg', 'Barrel', 'Straight Boot', 'Vaquero', 'Bota Flare', 'Skinny', 'Mom', 'Cargo', 'Bermuda', 'Straight'];
const DEFAULT_CATEGORIES = ['Jeans', 'Pantalones', 'Shorts', 'Faldas', 'Cargos', 'Bermuda', 'Nuevo'];
const ALL_SIZES = ['6', '8', '10', '12', '14'];
const DEFAULT_COLORS = [
  'Azul Claro', 'Azul Oscuro', 'Azul Medio', 'Azul Dirty', 'Gris Oscuro', 'Gris Humo',
  'Negro', 'Blanco', 'Ivory', 'Crudo', 'Kaki', 'Mocca', 'Baby Blue', 'Oliva',
  'Café', 'Mostaza', 'Vino', 'Burdeos'
];

export default function AdminCatalogPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasNonAdminSession, setHasNonAdminSession] = useState(false);
  const [loginEmail, setLoginEmail] = useState(ADMIN_EMAIL);
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'orders' | 'history' | 'backup' | 'site'>('orders');
  const [invoiceBusyId, setInvoiceBusyId] = useState<string | null>(null);
  const [invoiceReady, setInvoiceReady] = useState<{ orderId: string; url: string } | null>(null);

  // Price History Audit Log
  const [priceHistory, setPriceHistory] = useState<PriceHistoryRecord[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // ── Pedidos (confirmación de pago → descontar stock) ──
  const [orders, setOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [confirmingOrderId, setConfirmingOrderId] = useState<string | null>(null);
  const [cancelingOrderId, setCancelingOrderId] = useState<string | null>(null);
  const [orderStatusFilter, setOrderStatusFilter] = useState<'todos' | 'pending' | 'confirmed' | 'canceled'>('todos');
  const [orderMsg, setOrderMsg] = useState<string | null>(null);

  // ── Respaldos / Limpieza mensual ──
  const [backupReminder, setBackupReminder] = useState<Date>(() => getNextBackupReminder());
  const [backupCountdown, setBackupCountdown] = useState(getReminderCountdown(getNextBackupReminder()));
  const [backupLoading, setBackupLoading] = useState(false);
  const [backupMsg, setBackupMsg] = useState<string | null>(null);
  const [backupError, setBackupError] = useState<string | null>(null);

  const { formatCOP } = useCart();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const sessionUser = data.session?.user;
        const isAdmin = !!sessionUser && !!sessionUser.email && sessionUser.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
        setIsAuthenticated(isAdmin);
        setHasNonAdminSession(!!sessionUser && !isAdmin);
        if (isAdmin) {
          loadProducts();
          loadHistory();
        } else {
          setLoading(false);
        }
      } catch (e) {
        setIsAuthenticated(false);
        setHasNonAdminSession(false);
        setLoading(false);
      }
    };
    checkAuth();

    // React to session changes (login/logout) in real time
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      const sessionUser = session?.user;
      const authed = !!sessionUser && !!sessionUser.email && sessionUser.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
      setIsAuthenticated(authed);
      setHasNonAdminSession(!!sessionUser && !authed);
      if (authed) {
        loadProducts();
        loadHistory();
      } else {
        setLoading(false);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      });

      if (!error) {
        const sessionUser = (await supabase.auth.getSession()).data.session?.user;
        const isAdmin = !!sessionUser && !!sessionUser.email && sessionUser.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
        if (isAdmin) {
          setIsAuthenticated(true);
          setHasNonAdminSession(false);
          loadProducts();
          loadHistory();
        } else {
          setHasNonAdminSession(true);
          setIsAuthenticated(false);
          setLoginError('Esta cuenta no tiene permisos de administrador.');
          setLoading(false);
        }
      } else {
        setLoginError('Credenciales incorrectas. Verifique el correo o la contraseña.');
      }
    } catch (err) {
      setLoginError('Error de conexión con el servidor de autenticación.');
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {}
    setIsAuthenticated(false);
  };

  const loadProducts = async () => {
    setLoading(true);
    // Lee el catálogo completo vía el edge de Vercel (cacheado) para no
    // consumir egress de Supabase en cada carga/refrescado del admin.
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (token) {
        const res = await fetch('/api/admin/catalog', { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) {
          const cached = await res.json();
          if (Array.isArray(cached) && cached.length > 0) {
            setProducts(cached);
            setLoading(false);
            return;
          }
        }
      }
    } catch (e) {}
    // Fallback: lectura directa a Supabase (incluye productos INITIAL no guardados)
    const data = await fetchAllProductsAdmin();
    setProducts(data);
    setLoading(false);
  };

  const loadHistory = async () => {
    setLoadingHistory(true);
    const history = await fetchPriceHistory();
    setPriceHistory(history);
    setLoadingHistory(false);
  };

  const loadOrders = async () => {
    setLoadingOrders(true);
    const data = await fetchOrdersAdmin();
    setOrders(data);
    setLoadingOrders(false);
  };

  // Realtime: cuando el cliente registra un pedido o se edita un producto,
  // refrescamos automáticamente para mantener el panel sincronizado.
  useEffect(() => {
    if (!isAuthenticated) return;
    loadOrders();
    const unsubscribe = subscribeCatalogChanges(() => {
      loadOrders();
      loadProducts();
    });
    return unsubscribe;
  }, [isAuthenticated]);

  // Genera el PDF de la factura y lo sube al bucket público. Corre en segundo
  // plano con tiempos límite para nunca dejar la UI colgada.
  const prepareInvoice = async (order: any): Promise<string | null> => {
    setInvoiceBusyId(order.id);
    try {
      const { blob, error } = await Promise.race([
        generateInvoicePdf(order, products),
        new Promise<never>((_, rej) => setTimeout(() => rej(new Error('tiempo agotado generando PDF')), 30000)),
      ]) as any;
      if (!blob) {
        setOrderMsg(`No se pudo generar la factura del pedido ${order.id}: ${error || 'error'}`);
        return null;
      }
      const up = await Promise.race([
        uploadInvoicePdf(blob, order.id),
        new Promise<{ success: boolean; url?: string; error?: string }>(
          (res) => setTimeout(() => res({ success: false, error: 'tiempo agotado subiendo' }), 25000)
        ),
      ]);
      if (up.success && up.url) {
        setInvoiceReady({ orderId: order.id, url: up.url });
        return up.url;
      }
      setOrderMsg(`Factura generada pero no se pudo subir: ${up.error || 'error'}. Reintenta con el botón "Factura PDF".`);
    } catch (e) {
      setOrderMsg(`Error generando la factura del pedido ${order.id}. Reintenta con el botón "Factura PDF".`);
    } finally {
      setInvoiceBusyId(null);
    }
    return null;
  };

  const handleConfirmOrder = async (order: any) => {
    setConfirmingOrderId(order.id);
    setOrderMsg(null);
    setInvoiceReady(null);
    // Tiempo límite para no dejar el botón en "Confirmando…" indefinidamente
    const res = await Promise.race([
      confirmOrderAndDeductStock(order, products),
      new Promise<{ success: boolean; error?: string }>(
        (res) => setTimeout(() => res({ success: false, error: 'tiempo agotado — verifica en Pedidos si el estado ya cambió' }), 45000)
      ),
    ]);
    if (res.success) {
      publishOrderChange();
      await loadOrders();
      await loadProducts();
      // La confirmación NO espera a la factura: se genera en segundo plano
      setOrderMsg(`Pedido ${order.id} confirmado: stock descontado y pago registrado. Generando factura…`);
      setConfirmingOrderId(null);
      prepareInvoice(order).then((url) => {
        if (url) {
          setOrderMsg(`Pedido ${order.id} confirmado. Factura lista para enviar por WhatsApp.`);
        }
      });
      return;
    }
    setOrderMsg(`Error al confirmar: ${res.error}`);
    setConfirmingOrderId(null);
  };

  const handleCancelOrder = async (order: any) => {
    if (!window.confirm(
      `¿Cancelar el pedido ${order.id}?\n\n` +
      (order.status === 'confirmed'
        ? 'Se restaurará el stock descontado al inventario de la página.\n'
        : '') +
      'El pedido pasará a "Cancelado / Carrito abandonado".'
    )) return;
    setCancelingOrderId(order.id);
    setOrderMsg(null);
    const res = await cancelOrderAndRestoreStock(order, products);
    if (res.success) {
      setOrderMsg(`Pedido ${order.id} cancelado${res.changed ? ': se restauró el stock al inventario.' : '. Carrito abandonado registrado.'}`);
      await loadOrders();
      await loadProducts();
      publishOrderChange();
    } else {
      setOrderMsg(`Error al cancelar: ${res.error}`);
    }
    setCancelingOrderId(null);
  };

  // ── Respaldos: exportar JSON y vaciar tablas transaccionales ──
  useEffect(() => {
    setBackupReminder(getNextBackupReminder());
    const tick = () => setBackupCountdown(getReminderCountdown(getNextBackupReminder()));
    tick();
    const interval = setInterval(tick, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleExportBackup = async () => {
    setBackupLoading(true);
    setBackupMsg(null);
    setBackupError(null);
    try {
      const data = await exportBackup();
      downloadBackup(data);
      setBackupMsg(
        `Respaldo exportado (${data.products.length} productos, ${data.orders.length} pedidos, ` +
        `${data.wholesale_leads.length} leads, ${data.price_history.length} registros de precios). ` +
        'Guárdalo en un lugar seguro.'
      );
    } catch (e: any) {
      setBackupError('No se pudo generar el respaldo: ' + (e?.message || 'error'));
    }
    setBackupLoading(false);
  };

  const handleExportExcel = async () => {
    setBackupLoading(true);
    setBackupMsg(null);
    setBackupError(null);
    try {
      const data = await exportBackup();
      exportOrderExcel(data);
      setBackupMsg(
        `Excel generado con ${data.orders.length} pedidos. Hoja "Pedidos" (seguimiento completo) + hoja "Compras por Cliente" (referencias, unidades y valores agrupados por quien compró, con totales).`
      );
    } catch (e: any) {
      setBackupError('No se pudo generar el Excel: ' + (e?.message || 'error'));
    }
    setBackupLoading(false);
  };

  const handlePurge = async () => {
    if (!window.confirm(
      '⚠️ VACÍO MASIVO de datos transaccionales.\n\n' +
      'Esto ELIMINA de Supabase todos los pedidos, formularios de contacto y el historial de precios.\n' +
      'El catálogo (productos y fotos) NO se toca.\n\n' +
      '¿Ya exportaste el respaldo? ¡Esta acción NO se puede deshacer!'
    )) return;
    setBackupLoading(true);
    setBackupMsg(null);
    setBackupError(null);
    const res = await purgeTransactionalData();
    if (res.success) {
      setBackupMsg('✅ Tablas transaccionales vaciadas. El plan gratuito queda despejado hasta el próximo mes.');
      setBackupReminder(getNextBackupReminder());
    } else {
      setBackupError('No se pudieron vaciar los datos: ' + (res.error || 'error'));
    }
    setBackupLoading(false);
  };

  if (!isAuthenticated) {
    if (hasNonAdminSession) {
      return (
        <div className="min-h-screen bg-neutral-900 flex items-center justify-center p-4">
          <meta name="robots" content="noindex,nofollow" />
          <title>Acceso Restringido | Ush By Ushuaia</title>
          <div className="bg-white max-w-md w-full p-8 border border-gray-200 shadow-2xl space-y-6 text-center">
            <div className="w-12 h-12 rounded-full bg-ush-navy text-white flex items-center justify-center mx-auto shadow-md">
              <ShieldAlert size={22} className="text-ush-pink" />
            </div>
            <h1 className="text-xl font-black text-ush-navy uppercase tracking-wide">
              Acceso Restringido
            </h1>
            <p className="text-xs text-neutral-500 font-light">
              Tu cuenta no tiene permisos de administrador. El panel solo está disponible para la cuenta autorizada.
            </p>
            <a href="/profile" className="block w-full bg-ush-navy hover:bg-ush-pink text-white font-bold py-3 text-xs uppercase tracking-widest transition-colors">
              Ir a Mi Cuenta
            </a>
            <button onClick={async () => { await supabase.auth.signOut(); }}
              className="block w-full border border-gray-300 text-neutral-600 font-bold py-3 text-xs uppercase tracking-wider hover:bg-gray-50 transition-colors">
              Cerrar Sesión
            </button>
            <a href="/" className="block text-xs text-neutral-400 hover:text-neutral-700">← Volver al catálogo</a>
          </div>
        </div>
      );
    }
    return (
      <div className="min-h-screen bg-neutral-900 flex items-center justify-center p-4">
        <meta name="robots" content="noindex,nofollow" />
        <title>Acceso Restringido | Ush By Ushuaia</title>
        <div className="bg-white max-w-md w-full p-8 border border-gray-200 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-ush-navy text-white flex items-center justify-center mx-auto shadow-md">
              <Lock size={22} className="text-ush-pink" />
            </div>
            <h1 className="text-xl font-black text-ush-navy uppercase tracking-wide">
              Acceso Restringido Administrator
            </h1>
            <p className="text-xs text-neutral-500 font-light">
              Ingresa tus credenciales autorizadas de USH BY USHUAIA para gestionar el catálogo.
            </p>
          </div>

          {loginError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold text-center">
              {loginError}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">
                Correo Electrónico Administrador *
              </label>
              <input
                type="email"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="comercialmayoristas@ushuaiajeans.com.co"
                className="w-full border border-gray-300 p-3 text-xs text-neutral-900 focus:outline-none focus:border-ush-pink font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">
                Contraseña de Seguridad *
              </label>
              <input
                type="password"
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full border border-gray-300 p-3 text-xs text-neutral-900 focus:outline-none focus:border-ush-pink"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-ush-navy text-white font-bold py-3.5 px-4 text-xs uppercase tracking-widest hover:bg-ush-pink transition-all shadow-md flex items-center justify-center gap-2"
            >
              <Key size={16} /> Iniciar Sesión como Admin
            </button>
          </form>

          <div className="text-center pt-2">
            <Link href="/" className="text-xs text-neutral-500 hover:text-ush-pink font-semibold">
              ← Volver a la Tienda
            </Link>
          </div>
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-neutral-100 pb-16">
      <meta name="robots" content="noindex,nofollow" />
      <title>Panel de Administración | Ush By Ushuaia</title>
      
      {/* Top Admin Header */}
      <header className="bg-[#1b2333] text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Logo variant="light" size="sm" />
            <span className="text-xs font-bold uppercase tracking-widest bg-[#d88193] text-white px-2.5 py-1">
              Panel Mayorista Admin
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/" className="text-xs text-neutral-300 hover:text-white flex items-center gap-1 font-medium">
              <ArrowLeft size={16} /> Ver Catálogo Público
            </Link>
            <button
              onClick={handleLogout}
              className="text-xs text-rose-300 hover:text-rose-100 flex items-center gap-1 font-bold ml-4 border-l border-neutral-700 pl-4"
            >
              <LogOut size={16} /> Salir
            </button>
          </div>
        </div>
      </header>

      {/* Main Admin Content Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Action Header & Tabs */}
        <div className="mb-6">
          <h1 className="text-2xl font-black text-[#1b2333] uppercase tracking-tight">
            Panel de Administración
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Pedidos, historial de precios, respaldos y el editor del catálogo. Los cambios se publican en la tienda al instante.
          </p>
        </div>

        {/* Tabs Bar: el catálogo se gestiona íntegramente en el Editor del sitio */}
        <div className="flex items-center gap-2 border-b border-gray-200 bg-white p-2 mb-6 shadow-sm overflow-x-auto">
          <button
            onClick={() => { setActiveTab('orders'); loadOrders(); }}
            className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
              activeTab === 'orders' ? 'bg-[#1b2333] text-white shadow-sm' : 'text-neutral-600 hover:bg-neutral-100'
            }`}
          >
            <ShoppingBag size={14} className="text-[#d88193]" /> Pedidos
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
              activeTab === 'history' ? 'bg-[#1b2333] text-white shadow-sm' : 'text-neutral-600 hover:bg-neutral-100'
            }`}
          >
            <History size={14} /> Historial Audit de Precios
          </button>

          <button
            onClick={() => setActiveTab('backup')}
            className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
              activeTab === 'backup' ? 'bg-[#1b2333] text-white shadow-sm' : 'text-neutral-600 hover:bg-neutral-100'
            }`}
          >
            <Save size={14} /> Respaldos
          </button>

          <button
            onClick={() => setActiveTab('site')}
            className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
              activeTab === 'site' ? 'bg-[#1b2333] text-white shadow-sm' : 'text-neutral-600 hover:bg-neutral-100'
            }`}
          >
            <LayoutTemplate size={14} className="text-[#d88193]" /> Editor del sitio (Catálogo)
          </button>
        </div>

        {/* ── TAB 4: HISTORIAL DE PRECIOS ── */}
        {activeTab === 'history' && (
          <div className="bg-white p-6 border border-gray-200 shadow-sm space-y-4">
            <div>
              <h2 className="text-base font-black uppercase text-[#1b2333] tracking-wide">
                Historial Auditable de Cambios de Precio
              </h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                Registro permanente de cada modificación realizada a los precios mayoristas o PVP.
              </p>
            </div>

            <div className="overflow-x-auto border border-gray-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#1b2333] text-white uppercase text-[10px]">
                  <tr>
                    <th className="p-3">Fecha / Hora</th>
                    <th className="p-3">Producto</th>
                    <th className="p-3">Mayorista Anter.</th>
                    <th className="p-3">Mayorista Nuevo</th>
                    <th className="p-3">PVP Anter.</th>
                    <th className="p-3">PVP Nuevo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {priceHistory.length > 0 ? (
                    priceHistory.map((rec) => (
                      <tr key={rec.id} className="hover:bg-neutral-50">
                        <td className="p-3 text-neutral-500 font-mono text-[11px]">
                          {new Date(rec.changed_at).toLocaleString()}
                        </td>
                        <td className="p-3 font-bold text-neutral-900 uppercase">{rec.product_name}</td>
                        <td className="p-3 text-gray-500">{formatCOP(rec.old_wholesale_price)}</td>
                        <td className="p-3 font-black text-emerald-600">{formatCOP(rec.new_wholesale_price)}</td>
                        <td className="p-3 text-gray-500">{formatCOP(rec.old_suggested_price)}</td>
                        <td className="p-3 font-black text-emerald-600">{formatCOP(rec.new_suggested_price)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-neutral-400">
                        No hay registros de cambios de precio aún.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── TAB 5: CONFIGURACIÓN ── */}
        {/* ── TAB 6: RESPALDOS Y LIMPIEZA MENSUAL ── */}
        {activeTab === 'backup' && (
          <div className="space-y-6">
            {/* Recordatorio mensual */}
            <div className={`bg-white p-6 border shadow-sm ${backupCountdown.overdue ? 'border-red-300' : 'border-[#d88193]/40 border-l-4 border-l-[#d88193]'}`}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="text-base font-black uppercase text-[#1b2333] tracking-wide flex items-center gap-2">
                    <History size={16} className="text-[#d88193]" />
                    Respaldo Mensual Automático
                  </h2>
                  <p className="text-xs text-neutral-500 mt-1 max-w-xl">
                    Para no saturar el plan gratuito de Supabase, cada <strong>último viernes del mes a las 3:30 PM</strong> debes
                    exportar el respaldo y vaciar las tablas de datos transaccionales.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => downloadReminderIcs(getNextBackupReminder())}
                  className="text-xs font-bold uppercase tracking-wider text-ush-pink hover:text-ush-navy border border-[#d88193]/40 px-3 py-2 flex items-center gap-1.5"
                >
                  <CheckCircle size={14} /> Agregar recordatorio a mi calendario (.ics)
                </button>
              </div>

              <div className="mt-4 p-4 bg-neutral-50 border border-gray-100 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-neutral-400">Próximo respaldo</p>
                  <p className="text-sm font-black text-ush-navy mt-1 capitalize">{formatReminder(backupReminder)}</p>
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-neutral-400">Días</p>
                  <p className="text-2xl font-black text-[#d88193] mt-1">{backupCountdown.days}</p>
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-neutral-400">Horas</p>
                  <p className="text-2xl font-black text-[#d88193] mt-1">{backupCountdown.hours}</p>
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-neutral-400">Minutos</p>
                  <p className="text-2xl font-black text-[#d88193] mt-1">{backupCountdown.minutes}</p>
                </div>
              </div>
              {backupCountdown.overdue && (
                <p className="mt-2 text-xs font-bold text-red-600">
                  ⚠️ ¡Ya pasó la fecha! Exporta el respaldo y vacía los datos lo antes posible.
                </p>
              )}
            </div>

            {/* Acciones */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-6 border border-gray-200 shadow-sm">
                <h3 className="text-sm font-black uppercase text-[#1b2333] tracking-wide mb-1">
                  <Save size={14} className="inline-block mr-1 text-[#d88193]" /> 1. Exportar respaldo (JSON)
                </h3>
                <p className="text-xs text-neutral-500 mb-4">
                  Descarga todos los datos (productos, pedidos, formularios y historial de precios) en un solo archivo JSON.
                  Guárdalo en tu computadora o nube antes de vaciar.
                </p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    type="button"
                    onClick={handleExportBackup}
                    disabled={backupLoading}
                    className="bg-[#1b2333] text-white text-xs font-bold uppercase tracking-widest px-5 py-3 shadow-sm hover:bg-[#d88193] transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    {backupLoading ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
                    {backupLoading ? 'Exportando...' : 'Exportar Respaldo (JSON)'}
                  </button>
                  <button
                    type="button"
                    onClick={handleExportExcel}
                    disabled={backupLoading}
                    className="bg-emerald-700 text-white text-xs font-bold uppercase tracking-widest px-5 py-3 shadow-sm hover:bg-emerald-800 transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    {backupLoading ? <RefreshCw size={14} className="animate-spin" /> : <FileSpreadsheet size={14} />}
                    {backupLoading ? 'Generando...' : 'Exportar Excel (Pedidos + Compras)'}
                  </button>
                </div>
              </div>

              <div className="bg-white p-6 border border-red-200 shadow-sm">
                <h3 className="text-sm font-black uppercase text-red-700 tracking-wide mb-1">
                  <Trash2 size={14} className="inline-block mr-1" /> 2. Vaciar datos transaccionales
                </h3>
                <p className="text-xs text-neutral-500 mb-4">
                  Elimina de Supabase los <strong>pedidos, formularios de contacto y el historial de precios</strong>.
                  El catálogo (productos, precios y fotos) NO se elimina. Esto libera espacio del plan gratuito.
                </p>
                <button
                  type="button"
                  onClick={handlePurge}
                  disabled={backupLoading}
                  className="bg-red-600 text-white text-xs font-bold uppercase tracking-widest px-5 py-3 shadow-sm hover:bg-red-700 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  <Trash2 size={14} />
                  Vaciar Tablas Transaccionales
                </button>
              </div>
            </div>

            {backupMsg && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center gap-2">
                <CheckCircle size={16} className="text-emerald-600" /> {backupMsg}
              </div>
            )}
            {backupError && (
              <div className="p-4 bg-red-50 border border-red-200 text-red-800 text-xs font-bold flex items-center gap-2">
                <X size={16} className="text-red-600" /> {backupError}
              </div>
            )}

            <p className="text-[10px] text-neutral-400 leading-relaxed">
              Consejo: el recordatorio también se muestra aquí cada vez que entres al panel. Para asegurarte de no olvidarlo,
              usa el botón <strong>“Agregar recordatorio a mi calendario (.ics)”</strong>, que lo guarda en tu Google Calendar u Outlook.
            </p>
          </div>
        )}

        {/* ── TAB: PEDIDOS (confirmar pago → descontar stock) ── */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            <div className="bg-white p-6 border shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="text-base font-black uppercase text-[#1b2333] tracking-wide flex items-center gap-2">
                    <ShoppingBag size={16} className="text-[#d88193]" />
                    Pedidos Recibidos
                  </h2>
                  <p className="text-xs text-neutral-500 mt-1 max-w-xl">
                    Cuando el cliente confirme el pago, haz clic en <strong>“Confirmar pago y descontar stock”</strong>:
                    se reducen las unidades de cada talla en Supabase y la página pública se actualiza al instante en todos los dispositivos.
                    Si el cliente <strong>no toma el pedido</strong>, usa <strong>“Cancelar pedido”</strong>: quedará marcado como
                    <strong> carrito abandonado</strong> y, si ya había confirmado, el stock se restaura automáticamente.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => loadOrders()}
                  className="text-xs font-bold uppercase tracking-wider text-ush-pink hover:text-ush-navy border border-[#d88193]/40 px-3 py-2 flex items-center gap-1.5"
                >
                  <RefreshCw size={14} /> Actualizar
                </button>
              </div>

              {orderMsg && (
                <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center gap-2">
                  <CheckCircle size={16} className="text-emerald-600" /> {orderMsg}
                </div>
              )}

              {/* Factura lista: enviar por WhatsApp o descargar */}
              {invoiceReady && (
                <div className="mt-4 p-4 bg-white border-2 border-[#d88193] flex flex-wrap items-center gap-3">
                  <FileText size={18} className="text-[#d88193]" />
                  <div className="flex-1 min-w-[200px]">
                    <p className="text-xs font-black uppercase tracking-wider text-[#1b2333]">
                      Factura del pedido {invoiceReady.orderId} lista
                    </p>
                    <p className="text-[11px] text-neutral-500">PDF con logo, referencias, descuentos y políticas. Envíala al cliente por WhatsApp.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const order = orders.find((o) => o.id === invoiceReady.orderId);
                      if (!order) return;
                      window.open(
                        buildInvoiceWhatsAppUrl(order.customer_phone, order.customer_name, order.id, invoiceReady.url),
                        '_blank'
                      );
                    }}
                    className="bg-[#25D366] hover:bg-[#1da851] text-white text-xs font-black uppercase tracking-wider px-4 py-2.5 flex items-center gap-2"
                  >
                    Enviar por WhatsApp
                  </button>
                  <a
                    href={invoiceReady.url}
                    target="_blank"
                    rel="noreferrer"
                    className="border border-gray-300 text-neutral-700 hover:border-[#d88193] hover:text-[#d88193] text-xs font-bold uppercase tracking-wider px-4 py-2.5"
                  >
                    Ver / Descargar PDF
                  </a>
                  <button type="button" onClick={() => setInvoiceReady(null)} className="p-1.5 text-neutral-400 hover:text-neutral-700">
                    <X size={16} />
                  </button>
                </div>
              )}

              {/* Filtro de estados de pedido */}
              <div className="mt-5 flex flex-wrap items-center gap-2">
                {([
                  ['todos', `Todos (${orders.length})`],
                  ['pending', 'Pendientes'],
                  ['confirmed', 'Confirmados'],
                  ['canceled', 'Cancelados · Carritos abandonados'],
                ] as const).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setOrderStatusFilter(key)}
                    className={`px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider border transition-all ${
                      orderStatusFilter === key
                        ? 'bg-[#1b2333] text-white border-[#1b2333]'
                        : 'bg-white text-neutral-600 border-gray-200 hover:border-[#d88193] hover:text-[#d88193]'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {loadingOrders ? (
                <div className="py-16 text-center text-sm text-neutral-400 font-bold uppercase tracking-wider">
                  Cargando pedidos…
                </div>
              ) : orders.length === 0 ? (
                <div className="py-16 text-center">
                  <ShoppingBag size={36} className="mx-auto text-neutral-300 mb-3" />
                  <p className="text-sm font-bold uppercase text-neutral-600">Aún no hay pedidos registrados</p>
                  <p className="text-xs text-neutral-400 mt-1">Los pedidos aparecen aquí en tiempo real cuando el cliente los registra en el checkout.</p>
                </div>
              ) : (
                <div className="mt-6 space-y-4">
                  {orders
                    .filter((order) => {
                      if (orderStatusFilter === 'todos') return true;
                      const key = order.status === 'confirmed' ? 'confirmed' : order.status === 'canceled' ? 'canceled' : 'pending';
                      return key === orderStatusFilter;
                    })
                    .map((order) => {
                    const items = Array.isArray(order.items) ? order.items : [];
                    const statusKey = order.status === 'confirmed' ? 'confirmed' : order.status === 'canceled' ? 'canceled' : 'pending';
                    const statusMeta = {
                      pending: { card: 'border-amber-200 bg-amber-50/40', badge: 'bg-amber-100 text-amber-800', label: 'Pendiente de pago' },
                      confirmed: { card: 'border-emerald-200 bg-emerald-50/40', badge: 'bg-emerald-100 text-emerald-800', label: 'Confirmado' },
                      canceled: { card: 'border-red-200 bg-red-50/40', badge: 'bg-red-100 text-red-700', label: 'Cancelado · Carrito abandonado' },
                    }[statusKey];
                    return (
                      <div key={order.id} className={`border ${statusMeta.card} p-4`}>
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-black text-[#1b2333]">Pedido {order.id}</span>
                              <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 ${statusMeta.badge}`}>
                                {statusMeta.label}
                              </span>
                            </div>
                            <p className="text-xs text-neutral-500 mt-1">
                              {order.order_date || new Date(order.created_at || Date.now()).toLocaleDateString('es-CO')} · {order.customer_name} · {order.city} · {formatCOP(order.total)}
                            </p>
                            <p className="text-[11px] text-neutral-500 mt-0.5">
                              {order.payment_method} · {order.customer_phone}
                            </p>
                          </div>

                          {statusKey !== 'canceled' && (
                            <div className="flex flex-wrap items-center gap-2">
                              {statusKey === 'pending' && (
                                <button
                                  type="button"
                                  onClick={() => handleConfirmOrder(order)}
                                  disabled={confirmingOrderId === order.id || cancelingOrderId === order.id}
                                  className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold uppercase tracking-wider px-4 py-2.5 flex items-center gap-2 transition-colors"
                                >
                                  <CheckCircle size={14} />
                                  {confirmingOrderId === order.id ? 'Confirmando…' : 'Confirmar pago y descontar stock'}
                                </button>
                              )}
                              {statusKey === 'confirmed' && (
                                <button
                                  type="button"
                                  onClick={() => prepareInvoice(order)}
                                  disabled={invoiceBusyId === order.id}
                                  className="bg-[#1b2333] hover:bg-[#d88193] disabled:opacity-50 text-white text-xs font-bold uppercase tracking-wider px-4 py-2.5 flex items-center gap-2 transition-colors"
                                >
                                  <FileText size={14} />
                                  {invoiceBusyId === order.id ? 'Generando…' : 'Factura PDF'}
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleCancelOrder(order)}
                                disabled={cancelingOrderId === order.id || confirmingOrderId === order.id}
                                className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-bold uppercase tracking-wider px-4 py-2.5 flex items-center gap-2 transition-colors"
                              >
                                <XCircle size={14} />
                                {cancelingOrderId === order.id ? 'Cancelando…' : 'Cancelar pedido'}
                              </button>
                            </div>
                          )}
                        </div>

                        {items.length > 0 && (
                          <div className="mt-3 border border-gray-200 bg-white overflow-hidden">
                            <table className="w-full text-left text-xs">
                              <thead className="bg-neutral-50 text-neutral-500 uppercase tracking-wider text-[10px]">
                                <tr>
                                  <th className="px-3 py-2">Ref</th>
                                  <th className="px-3 py-2">Prenda</th>
                                  <th className="px-3 py-2">Talla</th>
                                  <th className="px-3 py-2">Color</th>
                                  <th className="px-3 py-2 text-right">Cant</th>
                                </tr>
                              </thead>
                              <tbody>
                                {(() => {
                                  // Agrupa por referencia: "REF → Talla 6: 5 uds · Talla 8: 3 uds"
                                  const grouped: Record<string, { name: string; color: string; sizes: { size: string; qty: number }[]; total: number }> = {};
                                  items.forEach((it: any) => {
                                    const refKey = String(it.reference || '—');
                                    const colorKey = String(it.color || '—');
                                    const key = `${refKey}::${colorKey}`;
                                    if (!grouped[key]) grouped[key] = { name: it.name, color: colorKey, sizes: [], total: 0 };
                                    const g = grouped[key];
                                    const size = it.size || 'Única';
                                    const existing = g.sizes.find(s => s.size === size);
                                    const qty = Number(it.quantity) || 0;
                                    if (existing) existing.qty += qty;
                                    else g.sizes.push({ size, qty });
                                    g.total += qty;
                                  });
                                  return Object.entries(grouped).map(([key, g]) => (
                                    <tr key={key} className="border-t border-gray-100">
                                      <td className="px-3 py-2 font-bold text-[#1b2333]">{key.split('::')[0]}</td>
                                      <td className="px-3 py-2 text-neutral-600">{g.name}</td>
                                      <td className="px-3 py-2">
                                        {g.sizes.map(s => (
                                          <span key={s.size} className="inline-flex items-baseline gap-1 mr-3">
                                            <span className="font-bold text-[#1b2333]">{s.size}</span>
                                            <span className="text-neutral-400">·</span>
                                            <span className="font-semibold">{s.qty} uds</span>
                                          </span>
                                        ))}
                                      </td>
                                      <td className="px-3 py-2">{g.color}</td>
                                      <td className="px-3 py-2 text-right font-bold">{g.total}</td>
                                    </tr>
                                  ));
                                })()}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── TAB 7: EDITOR DEL SITIO WEB (tipo Wix) ── */}
        {activeTab === 'site' && (
          <SiteContentEditor onExit={() => setActiveTab('orders')} />
        )}

      </div>



    </div>
  );
}
