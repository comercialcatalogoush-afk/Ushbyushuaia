'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Calculator, ShoppingBag, Truck, Sparkles, TrendingUp,
  Plus, Minus, Trash2, Search, CheckCircle2, Lock,
  ArrowRight, Send, Layers, ChevronRight, ShieldCheck,
  RefreshCw, ChevronDown
} from 'lucide-react';
import { Product } from '@/types';
import { fetchProductsFromSupabase, supabase } from '@/lib/supabase';
import { INITIAL_PRODUCTS } from '@/data/products';
import { getGoogleDriveImageUrl } from '@/lib/drive';
import { getSuggestedPrice, WHOLESALE_FALLBACK } from '@/lib/pricing';
import { useCart } from '@/context/CartContext';
import { ContentValues } from '@/lib/siteContent';

/* ── Clave para el uso único de visitantes ── */
const GUEST_USED_KEY = 'ush_calc_guest_used';
/* Cuántas referencias se muestran por "página" (máximo 6 para mantener visible el menú lateral) */
const PAGE_SIZE = 6;

interface CalculadoraClientProps {
  initialContent?: ContentValues;
  embedded?: boolean;
}

function formatCOP(val: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(val);
}

export function CalculadoraClient({ initialContent = {}, embedded = false }: CalculadoraClientProps) {
  const [content] = useState<ContentValues>(initialContent);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  /* Acceso de invitado: true si ya consumió su único uso */
  const [guestBlocked, setGuestBlocked] = useState(false);
  /* true mientras el invitado está usando la calculadora en esta sesión */
  const [guestActive, setGuestActive] = useState(false);

  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  /* Cuántas referencias mostrar (se expande con "Cargar más") */
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const { addToCart, setIsCartOpen } = useCart();
  const [addedToCartToast, setAddedToCartToast] = useState(false);

  /* ── 1. Verificar sesión ── */
  useEffect(() => {
    let mounted = true;
    const checkSession = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (!mounted) return;
        const hasSession = Boolean(data.session);
        setIsAuthenticated(hasSession);
        setUserEmail(data.session?.user?.email || '');
        if (!hasSession) {
          /* Comprobar si el visitante ya usó su cupo */
          let used = false;
          try {
            used = Boolean(
              localStorage.getItem(GUEST_USED_KEY) === '1' ||
              (typeof document !== 'undefined' && document.cookie.includes(`${GUEST_USED_KEY}=1`))
            );
          } catch (_) {}

          if (used) {
            setGuestBlocked(true);
            setGuestActive(false);
          } else {
            /* Primera vez: el cliente puede usar la calculadora directamente */
            setGuestBlocked(false);
            setGuestActive(true);
            /* Registrar de inmediato que ya la usó para que al recargar la página quede bloqueado */
            try {
              localStorage.setItem(GUEST_USED_KEY, '1');
              document.cookie = `${GUEST_USED_KEY}=1; max-age=31536000; path=/`;
            } catch (_) {}
            loadCatalog();
          }
        }
        setSessionChecked(true);
        if (hasSession) loadCatalog();
      } catch (_) {
        if (mounted) setSessionChecked(true);
      }
    };

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      const hasSession = Boolean(session);
      setIsAuthenticated(hasSession);
      setUserEmail(session?.user?.email || '');
      setSessionChecked(true);
      if (hasSession && products.length === 0) loadCatalog();
    });

    checkSession();
    return () => { mounted = false; authListener.subscription.unsubscribe(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── 2. Cargar Catálogo ── */
  const loadCatalog = async () => {
    setLoadingProducts(true);
    try {
      const dbProducts = await fetchProductsFromSupabase({ slim: true });
      const active = (dbProducts && dbProducts.length > 0 ? dbProducts : INITIAL_PRODUCTS).filter(
        (p) => !p.hidden && p.status !== 'draft' && p.images && p.images.length > 0
      );
      setProducts(active);
    } catch (_) {
      setProducts(INITIAL_PRODUCTS.filter((p) => !p.hidden));
    } finally {
      setLoadingProducts(false);
    }
  };

  /* ── 4. Categorías disponibles ── */
  const availableCategories = useMemo(() => {
    const cats = new Set<string>();
    products.forEach((p) => {
      if (p.fit) cats.add(p.fit);
      else if (p.category) cats.add(p.category);
    });
    return ['Todas', ...Array.from(cats).sort()];
  }, [products]);

  /* ── 5. Filtrado ── */
  const filteredProducts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return products.filter((p) => {
      const matchSearch =
        !q ||
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.reference && p.reference.toLowerCase().includes(q)) ||
        (p.fit && p.fit.toLowerCase().includes(q));
      const matchCat =
        selectedCategory === 'Todas' ||
        p.fit === selectedCategory ||
        p.category === selectedCategory;
      return matchSearch && matchCat;
    });
  }, [products, searchQuery, selectedCategory]);

  const visibleProducts = filteredProducts.slice(0, visibleCount);
  const hasMore = filteredProducts.length > visibleCount;

  /* Reset paginación al cambiar filtros */
  useEffect(() => { setVisibleCount(PAGE_SIZE); }, [searchQuery, selectedCategory]);

  /* ── 6. Cantidades ── */
  const setItemQty = (id: string, qty: number) => {
    setQuantities((prev) => {
      const next = { ...prev };
      if (qty <= 0) delete next[id];
      else next[id] = qty;
      return next;
    });
  };
  const clearAll = () => setQuantities({});

  /* ── 7. Cálculos financieros ── */
  const selectedItems = useMemo(() =>
    Object.entries(quantities)
      .map(([id, qty]) => {
        const product = products.find((p) => String(p.id) === id);
        return product ? { product, qty } : null;
      })
      .filter((item): item is { product: Product; qty: number } => Boolean(item)),
    [quantities, products]
  );

  const totalUnits = useMemo(() => selectedItems.reduce((a, it) => a + it.qty, 0), [selectedItems]);
  const isWholesale12 = totalUnits >= 12;
  const isWholesale8  = totalUnits >= 8 && totalUnits < 12;

  const financialSummary = useMemo(() => {
    let totalInvestment = 0;
    let totalSuggestedRetail = 0;
    selectedItems.forEach(({ product, qty }) => {
      const suggested = getSuggestedPrice(product);
      totalSuggestedRetail += suggested * qty;
      if (isWholesale12) {
        totalInvestment += (product.price || Math.round(suggested * WHOLESALE_FALLBACK)) * qty;
      } else if (isWholesale8) {
        totalInvestment += Math.round(suggested * 0.8) * qty;
      } else {
        totalInvestment += suggested * qty;
      }
    });
    const netProfit = Math.max(0, totalSuggestedRetail - totalInvestment);
    const roiPercentage = totalInvestment > 0 ? (netProfit / totalInvestment) * 100 : 0;
    return { totalInvestment, totalSuggestedRetail, netProfit, roiPercentage };
  }, [selectedItems, isWholesale12, isWholesale8]);

  /* ── 8. Enviar cotización ── */
  const handleSendToWhatsApp = () => {
    if (selectedItems.length === 0) return;
    let msg = `¡Hola USH BY USHUAIA! 👖✨\nSimulé mi pedido en la Calculadora B2B:\n\n`;
    msg += `📦 *Total:* ${totalUnits} uds surtidas\n`;
    msg += `💰 *Inversión:* ${formatCOP(financialSummary.totalInvestment)}\n`;
    msg += `💎 *Ganancia proyectada:* ${formatCOP(financialSummary.netProfit)} (+${Math.round(financialSummary.roiPercentage)}% ROI)\n`;
    msg += `🚚 *Flete:* ${isWholesale12 ? '¡GRATIS!' : 'Lo asume el cliente (12+ es gratis)'}\n\n`;
    msg += `*Prendas:*\n`;
    selectedItems.forEach(({ product, qty }, i) => {
      const suggested = getSuggestedPrice(product);
      const unit = isWholesale12 ? product.price || Math.round(suggested * WHOLESALE_FALLBACK)
        : isWholesale8 ? Math.round(suggested * 0.8) : suggested;
      msg += `${i + 1}. Ref. ${product.reference || product.name} (${product.fit || product.category}): ${qty} uds × ${formatCOP(unit)}\n`;
    });
    msg += `\n¿Pueden verificar disponibilidad de curvas/tallas? ¡Gracias!`;
    window.open(`https://wa.me/573011393902?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const handleTransferToCart = () => {
    if (selectedItems.length === 0) return;
    selectedItems.forEach(({ product, qty }) => {
      const defaultSize = product.options?.find(o => o.key.toLowerCase() === 'talla')?.values?.[0] || '10';
      addToCart(product, defaultSize, product.color || '', qty);
    });
    setAddedToCartToast(true);
    setIsCartOpen(true);
    setTimeout(() => setAddedToCartToast(false), 4000);
  };

  /* ════════════════════════════════════════════
     PANTALLAS
  ════════════════════════════════════════════ */

  /* Cargando sesión */
  if (!sessionChecked) {
    return (
      <div className="py-32 text-center">
        <div className="inline-block animate-spin text-[#d88193] mb-4">
          <RefreshCw size={36} />
        </div>
        <p className="text-sm font-bold uppercase tracking-wider text-neutral-600">
          Verificando acceso...
        </p>
      </div>
    );
  }

  /* ── Invitado sin acceso (ya usó su cupo, pide registro) ── */
  if (!isAuthenticated && guestBlocked && !guestActive) {
    return (
      <div className={embedded ? "w-full py-6" : "max-w-2xl mx-auto px-4 py-16"}>
        <div className="bg-white text-neutral-900 border border-gray-200 rounded-2xl overflow-hidden shadow-lg">
          <div className="h-1.5 bg-gradient-to-r from-[#d88193] via-[#e8a3b0] to-[#d88193]" />
          <div className="p-8 sm:p-10 text-center space-y-6">
            <div className="w-16 h-16 mx-auto rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center">
              <Lock size={30} className="text-[#d88193]" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[.25em] text-[#d88193] mb-2">
                Calculadora Exclusiva B2B
              </p>
              <h2 className="text-2xl font-black uppercase text-neutral-900">¡Ya usaste tu vista previa!</h2>
              <p className="mt-3 text-xs sm:text-sm text-neutral-600 leading-relaxed max-w-md mx-auto">
                La calculadora de inversión y ganancias es exclusiva para aliados comerciales registrados.
                Crea tu cuenta gratuita y úsala de forma ilimitada.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 text-left text-xs">
              {[
                { icon: '📊', label: 'Calculadora ilimitada' },
                { icon: '📄', label: 'Catálogo PDF propio' },
                { icon: '🚚', label: 'Envío gratis desde 12 uds' },
              ].map((b) => (
                <div key={b.label} className="bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-center">
                  <div className="text-2xl mb-1">{b.icon}</div>
                  <p className="font-bold text-neutral-800 text-[11px] leading-tight">{b.label}</p>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <Link
                href="/profile?mode=register&returnTo=/profile?tab=calculadora"
                className="inline-flex items-center justify-center gap-2 bg-[#d88193] hover:bg-[#c06579] text-white font-black px-8 py-3.5 rounded-full text-xs uppercase tracking-widest transition-all shadow-md active:scale-95"
              >
                Crear cuenta gratis <ArrowRight size={14} />
              </Link>
              <Link
                href="/profile?tab=calculadora"
                className="inline-flex items-center justify-center gap-2 border border-gray-300 hover:bg-neutral-50 text-neutral-700 font-bold px-8 py-3.5 rounded-full text-xs uppercase tracking-widest transition-all"
              >
                Ya tengo cuenta
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ════════════════════════════════════════════
     CALCULADORA PRINCIPAL
  ════════════════════════════════════════════ */
  return (
    <div className={embedded ? "w-full space-y-6 pb-20" : "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 pb-24"}>

      {/* ── Banner invitado: aviso de uso único ── */}
      {!isAuthenticated && guestActive && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-sm shadow-sm">
          <div className="flex items-center gap-3">
            <span className="text-xl shrink-0">🎁</span>
            <div>
              <p className="font-black text-neutral-900 text-xs uppercase tracking-wide">
                Vista previa única de cortesía
              </p>
              <p className="text-neutral-600 text-[11px] leading-relaxed">
                Estás utilizando la calculadora por única vez sin cuenta. Si recargas o sales de la página, deberás registrarte para volver a acceder.
              </p>
            </div>
          </div>
          <Link
            href="/profile?mode=register&returnTo=/profile?tab=calculadora"
            className="shrink-0 bg-[#d88193] hover:bg-[#c06579] text-white font-black text-[10px] uppercase tracking-wider px-4 py-2 rounded-full transition-all shadow-xs"
          >
            Registrarme Gratis
          </Link>
        </div>
      )}

      {/* ── Header ── */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-7 relative overflow-hidden shadow-sm">
        <div className="relative z-10 space-y-2 max-w-2xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-[.25em] text-[#d88193] bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200/50">
              Simulador B2B · Exclusivo Mayoristas
            </span>
            {isAuthenticated && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">
                <CheckCircle2 size={11} /> {userEmail}
              </span>
            )}
          </div>
          <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-neutral-900 flex items-center gap-2.5">
            <Calculator className="text-[#d88193] shrink-0" size={26} />
            {content.calcTitle || 'Calculadora de Inversión y Ganancias'}
          </h1>
          <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
            {content.calcSubtitle || 'Proyecta tu inversión y ganancia antes de pedir.'}
          </p>
          <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-600 pt-1">
            <Sparkles size={13} className="text-[#d88193] shrink-0" />
            <span>
              <strong className="text-neutral-900">8+ uds</strong> = 20% OFF ·{' '}
              <strong className="text-neutral-900">12+ uds</strong> = Precio mayorista +{' '}
              <strong className="text-emerald-700 font-bold">Envío Gratis</strong>
            </span>
          </div>
        </div>
      </div>

      {/* ── Grid Principal ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        {/* ── Columna izquierda: selector de referencias ── */}
        <div className="lg:col-span-8 space-y-4">

          {/* Filtros */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3 shadow-sm">
            {/* Búsqueda */}
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por referencia o nombre..."
                className="w-full pl-9 pr-4 py-2.5 text-xs bg-neutral-50 border border-gray-200 rounded-lg focus:outline-none focus:border-[#d88193] text-neutral-900"
              />
            </div>

            {/* Categorías como pills */}
            <div className="flex flex-wrap gap-1.5">
              {availableCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-full text-[11px] font-bold uppercase transition-all ${
                    selectedCategory === cat
                      ? 'bg-[#d88193] text-white shadow-md'
                      : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Contador de resultados */}
          {!loadingProducts && products.length > 0 && (
            <div className="flex items-center justify-between text-[11px] text-neutral-500 px-1">
              <span>
                Mostrando <strong>{visibleProducts.length}</strong> de{' '}
                <strong>{filteredProducts.length}</strong> referencias
                {selectedCategory !== 'Todas' && ` en ${selectedCategory}`}
              </span>
              {Object.keys(quantities).length > 0 && (
                <button onClick={clearAll} className="text-red-500 hover:text-red-700 flex items-center gap-1 font-bold uppercase">
                  <Trash2 size={12} /> Vaciar selección
                </button>
              )}
            </div>
          )}

          {/* Listado */}
          {loadingProducts ? (
            <div className="py-20 text-center bg-white border border-gray-200 rounded-xl">
              <RefreshCw size={28} className="animate-spin text-[#d88193] mx-auto mb-3" />
              <p className="text-xs font-bold uppercase text-neutral-500">Cargando referencias oficiales...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="py-16 text-center bg-white border border-gray-200 rounded-xl p-6">
              <ShoppingBag size={32} className="text-neutral-300 mx-auto mb-3" />
              <p className="text-sm font-bold text-neutral-700">No se encontraron referencias</p>
              <p className="text-xs text-neutral-400 mt-1">Prueba con otro término o categoría.</p>
            </div>
          ) : (
            <>
              <div className={`grid gap-3 ${embedded ? 'grid-cols-1 xl:grid-cols-2' : 'grid-cols-1 md:grid-cols-2'}`}>
                {visibleProducts.map((product) => {
                  const qty = quantities[String(product.id)] || 0;
                  const suggested = getSuggestedPrice(product);
                  const wholesalePrice = product.price || Math.round(suggested * WHOLESALE_FALLBACK);
                  const img = product.images?.[0] ? getGoogleDriveImageUrl(product.images[0]) : '';

                  return (
                    <div
                      key={product.id}
                      className={`bg-white border rounded-xl transition-all flex gap-3 p-3 items-center ${
                        qty > 0
                          ? 'border-[#d88193] shadow-md ring-1 ring-[#d88193]/30'
                          : 'border-gray-200 hover:border-[#d88193]/40'
                      }`}
                    >
                      {/* Imagen */}
                      <div className="relative rounded-lg bg-neutral-100 shrink-0 overflow-hidden border border-gray-100" style={{ width: 72, height: 88 }}>
                        {img ? (
                          <img
                            src={img}
                            alt={product.name}
                            className="w-full h-full object-cover"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-neutral-300">
                            <ShoppingBag size={20} />
                          </div>
                        )}
                        {qty > 0 && (
                          <span className="absolute top-1 right-1 bg-[#d88193] text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow">
                            {qty}
                          </span>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex flex-wrap items-baseline justify-between gap-1">
                          <span className="text-[10px] font-bold text-neutral-400 uppercase">
                            Ref. {product.reference || product.id}
                          </span>
                          <span className="text-[9px] font-black uppercase text-[#d88193] bg-rose-50 px-1.5 py-0.5 rounded-full shrink-0 max-w-[130px] truncate">
                            {product.fit || product.category}
                          </span>
                        </div>

                        <p className="text-xs font-black text-neutral-900 truncate leading-tight">
                          {product.name}
                        </p>

                        <div className="flex items-baseline gap-1.5">
                          <span className="text-xs font-black text-[#1b2333]">
                            {formatCOP(wholesalePrice)}
                          </span>
                          <span className="text-[10px] text-neutral-400 line-through">
                            {formatCOP(suggested)}
                          </span>
                        </div>

                        {/* Controles */}
                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          <div className="inline-flex items-center border border-gray-200 rounded-lg bg-neutral-50 overflow-hidden">
                            <button
                              onClick={() => setItemQty(String(product.id), qty - 1)}
                              disabled={qty <= 0}
                              className="px-2 py-1.5 text-neutral-500 hover:bg-neutral-200 disabled:opacity-30 transition-colors"
                            >
                              <Minus size={11} />
                            </button>
                            <input
                              type="number"
                              min="0"
                              value={qty}
                              onChange={(e) => setItemQty(String(product.id), Math.max(0, parseInt(e.target.value) || 0))}
                              className="w-10 text-center text-xs font-black bg-transparent text-neutral-900 focus:outline-none"
                            />
                            <button
                              onClick={() => setItemQty(String(product.id), qty + 1)}
                              className="px-2 py-1.5 text-neutral-500 hover:bg-neutral-200 transition-colors"
                            >
                              <Plus size={11} />
                            </button>
                          </div>
                          {qty > 0 && (
                            <span className="text-[10px] text-[#d88193] font-bold whitespace-nowrap">
                              = {formatCOP(wholesalePrice * qty)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Cargar más */}
              {hasMore && (
                <button
                  onClick={() => setVisibleCount((v) => v + PAGE_SIZE)}
                  className="w-full py-3 border-2 border-dashed border-[#d88193]/40 text-[#d88193] hover:border-[#d88193] hover:bg-rose-50 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all"
                >
                  <ChevronDown size={16} />
                  Cargar {Math.min(PAGE_SIZE, filteredProducts.length - visibleCount)} referencias más
                  ({filteredProducts.length - visibleCount} restantes)
                </button>
              )}
            </>
          )}
        </div>

        {/* ── Columna derecha: panel financiero sticky ── */}
        <div className="lg:col-span-4 sticky top-24 space-y-4">
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-md">
            <div className="h-1.5 bg-gradient-to-r from-[#d88193] via-[#e8a3b0] to-[#d88193]" />
            <div className="p-5 space-y-4">

              {/* Título */}
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-black uppercase tracking-wider text-neutral-900 flex items-center gap-2">
                  <TrendingUp size={16} className="text-[#d88193]" /> Resumen Financiero
                </h2>
                {selectedItems.length > 0 && (
                  <button
                    onClick={clearAll}
                    className="text-[10px] font-bold text-neutral-400 hover:text-red-500 flex items-center gap-1 transition-colors"
                  >
                    <Trash2 size={11} /> Vaciar
                  </button>
                )}
              </div>

              {/* Barra de progreso */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-neutral-600 font-medium">Prendas surtidas:</span>
                  <span className="font-black text-neutral-900">
                    {totalUnits} <span className="text-neutral-400 font-normal">/ 12 uds</span>
                  </span>
                </div>
                <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isWholesale12 ? 'bg-emerald-500' : isWholesale8 ? 'bg-amber-400' : 'bg-[#d88193]'
                    }`}
                    style={{ width: `${Math.min(100, (totalUnits / 12) * 100)}%` }}
                  />
                </div>

                {/* Estado */}
                {isWholesale12 ? (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2.5 text-xs text-emerald-800 flex items-center gap-2">
                    <Sparkles size={13} className="text-emerald-600 shrink-0" />
                    <span><strong>¡Precio mayorista!</strong> + Envío Gratis Nacional</span>
                  </div>
                ) : isWholesale8 ? (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5 text-xs text-amber-800">
                    <strong>20% OFF activado</strong> — Faltan {12 - totalUnits} uds para envío gratis
                  </div>
                ) : (
                  <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-2.5 text-xs text-neutral-600">
                    Agrega {8 - Math.min(totalUnits, 8)} prendas más para el primer descuento
                  </div>
                )}
              </div>

              {/* Métricas */}
              <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-4 space-y-3">
                <div className="flex justify-between text-xs">
                  <span className="text-neutral-600">Tu inversión:</span>
                  <span className="font-black text-neutral-900">{formatCOP(financialSummary.totalInvestment)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-neutral-600">P. Al Detal:</span>
                  <span className="font-bold text-neutral-700">{formatCOP(financialSummary.totalSuggestedRetail)}</span>
                </div>
                <div className="border-t border-neutral-200 pt-3 flex justify-between items-center">
                  <div>
                    <p className="text-xs font-black text-emerald-700 uppercase">Ganancia Proyectada</p>
                    <p className="text-[10px] text-neutral-500">Retorno neto estimado</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black text-emerald-600">{formatCOP(financialSummary.netProfit)}</p>
                    <p className="text-xs font-bold text-emerald-700">+{Math.round(financialSummary.roiPercentage)}% ROI</p>
                  </div>
                </div>
              </div>

              {/* Desglose */}
              {selectedItems.length > 0 && (
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1 border-t border-neutral-100 pt-2">
                  <p className="text-[10px] text-neutral-400 uppercase font-bold">
                    Referencias ({selectedItems.length}):
                  </p>
                  {selectedItems.map(({ product, qty }) => (
                    <div key={product.id} className="flex justify-between items-center text-[11px]">
                      <span className="text-neutral-700 truncate max-w-[130px]">
                        Ref. {product.reference} ×{qty}
                      </span>
                      <span className="font-bold text-neutral-900 shrink-0">
                        {formatCOP((isWholesale12
                          ? product.price || Math.round(getSuggestedPrice(product) * WHOLESALE_FALLBACK)
                          : isWholesale8
                            ? Math.round(getSuggestedPrice(product) * 0.8)
                            : getSuggestedPrice(product)) * qty)}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* CTAs */}
              <div className="space-y-2 pt-1">
                <button
                  onClick={handleSendToWhatsApp}
                  disabled={totalUnits === 0}
                  className={`w-full py-3.5 rounded-full text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 ${
                    totalUnits === 0
                      ? 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
                      : 'bg-[#25D366] hover:bg-[#1ebd5a] text-white shadow-md'
                  }`}
                >
                  <Send size={15} /> Cotizar por WhatsApp ({totalUnits} uds)
                </button>
                <button
                  onClick={handleTransferToCart}
                  disabled={totalUnits === 0}
                  className={`w-full py-3 rounded-full text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 border transition-all ${
                    totalUnits === 0
                      ? 'border-gray-200 text-neutral-400 cursor-not-allowed'
                      : 'border-[#1b2333] text-[#1b2333] hover:bg-[#1b2333] hover:text-white'
                  }`}
                >
                  <ShoppingBag size={14} /> Pasar al carrito
                </button>
              </div>

              {/* Toast */}
              {addedToCartToast && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2.5 text-xs text-emerald-700 text-center font-bold">
                  ✓ ¡Prendas añadidas al carrito!
                </div>
              )}

              {/* Footer garantía */}
              <div className="text-[10px] text-neutral-400 text-center pt-1 flex items-center justify-center gap-1">
                <ShieldCheck size={12} className="text-[#d88193]" />
                Confección Nacional · Itagüí, Antioquia
              </div>
            </div>
          </div>

          {/* Card de registro para invitados */}
          {!isAuthenticated && guestActive && (
            <div className="bg-rose-50 border border-rose-200 text-neutral-800 rounded-2xl p-5 shadow-sm text-center space-y-3">
              <p className="text-xs font-black uppercase tracking-wide text-neutral-900">¿Te gustó la calculadora?</p>
              <p className="text-[11px] text-neutral-600">Regístrate gratis para usarla de forma ilimitada y desbloquear todos los beneficios.</p>
              <Link
                href="/profile?mode=register&returnTo=/profile?tab=calculadora"
                className="inline-flex items-center gap-1.5 bg-[#d88193] text-white font-black text-[11px] uppercase tracking-widest px-5 py-2.5 rounded-full hover:bg-[#c06579] transition-all shadow-sm"
              >
                Crear cuenta gratis <Layers size={12} />
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
