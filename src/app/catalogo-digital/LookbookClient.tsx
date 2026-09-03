'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Product } from '@/types';
import { fetchProductsFromSupabase, supabase } from '@/lib/supabase';
import { generateLookbookPdf, LookbookPriceMode } from '@/lib/lookbookPdf';
import { Download, Share2, ChevronLeft, ChevronRight, Search, Grid3X3, BookOpen, ExternalLink } from 'lucide-react';

const CATEGORIES = ['Todas', 'Jeans', 'Pantalones', 'Shorts', 'Faldas', 'Cargos', 'Bermuda', 'Nuevo'];
type PriceMode = 'wholesale' | 'ecommerce' | 'none' | 'custom';
type AccessState = 'checking' | 'loading' | 'ready' | 'denied' | 'error';
type DownloadScope = 'completo' | 'seleccion';

interface DownloadRequest {
  items: Product[];
  scope: DownloadScope;
}

const PRICE_MODE_LABELS: Record<PriceMode, string> = {
  wholesale: 'Precios mayoristas',
  ecommerce: 'Precios e-commerce',
  custom: 'Precios personalizados',
  none: 'Sin precios',
};

function formatCOP(n: number) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(n);
}

function referenceOf(product: Product) {
  return String(product.reference || product.id);
}

function activeProducts(products: Product[]) {
  return products.filter(
    (product) => !product.hidden && product.status !== 'draft' && product.images && product.images.length > 0,
  );
}

function priceFor(product: Product, mode: PriceMode, customPrices: Record<string, string>) {
  if (mode === 'none') return '';
  if (mode === 'ecommerce') return formatCOP(product.suggested_price);
  if (mode === 'custom') {
    const custom = customPrices[referenceOf(product)] || '';
    return custom ? formatCOP(Number(custom)) : 'Precio editable';
  }
  return formatCOP(product.price);
}

const PRICE_MODE_TO_LOOKBOOK: Record<PriceMode, LookbookPriceMode> = {
  wholesale: 'wholesale',
  ecommerce: 'ecommerce',
  custom: 'custom',
  none: 'blank',
};

function customPricesByProductId(products: Product[], customPrices: Record<string, string>) {
  const byId: Record<string, string> = {};
  products.forEach((product, ) => {
    const value = customPrices[referenceOf(product)];
    if (value) byId[product.id] = value;
  });
  return byId;
}

export function LookbookClient() {
  const [access, setAccess] = useState<AccessState>('checking');
  const [initialProducts, setInitialProducts] = useState<Product[]>([]);
  const [userEmail, setUserEmail] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Todas');
  const [view, setView] = useState<'lookbook' | 'grid'>('grid');
  const [page, setPage] = useState(0);
  const ITEMS_PER_PAGE = view === 'lookbook' ? 6 : 24;
  const [priceMode, setPriceMode] = useState<PriceMode>('wholesale');
  const [customPrices, setCustomPrices] = useState<Record<string, string>>({});
  const [selectedRefs, setSelectedRefs] = useState<Set<string>>(new Set());
  const [downloadRequest, setDownloadRequest] = useState<DownloadRequest | null>(null);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState('');
  const [downloadMessage, setDownloadMessage] = useState('');

  useEffect(() => {
    let mounted = true;

    const loadCatalog = async (hasSession: boolean) => {
      if (!hasSession) {
        if (mounted) {
          setInitialProducts([]);
          setSelectedRefs(new Set());
          setAccess('denied');
        }
        return;
      }

      if (mounted) setAccess('loading');
      try {
        const loaded = activeProducts(await fetchProductsFromSupabase({ slim: true }));
        if (!mounted) return;
        setInitialProducts(loaded);
        setSelectedRefs(new Set(loaded.map(referenceOf)));
        setAccess(loaded.length > 0 ? 'ready' : 'error');
      } catch (_) {
        if (mounted) setAccess('error');
      }
    };

    supabase.auth.getSession().then(({ data }) => {
      if (mounted) setUserEmail(data.session?.user?.email || '');
      void loadCatalog(Boolean(data.session));
    });

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) setUserEmail(session?.user?.email || '');
      void loadCatalog(Boolean(session));
    });

    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, []);

  const filtered = useMemo(() => initialProducts.filter((p) => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.reference.includes(search);
    const matchCat = category === 'Todas' || p.category === category;
    return matchSearch && matchCat;
  }), [category, initialProducts, search]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE);
  const selectedProducts = initialProducts.filter((product) => selectedRefs.has(referenceOf(product)));
  const selectedCount = selectedProducts.length;
  const isAdmin = userEmail.toLowerCase() === 'comercialmayoristas@ushuaiajeans.com.co';

  const handleCategoryChange = (cat: string) => {
    setCategory(cat);
    setPage(0);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(0);
  };

  const toggleReference = (product: Product) => {
    const ref = referenceOf(product);
    setSelectedRefs((current) => {
      const next = new Set(current);
      if (next.has(ref)) next.delete(ref);
      else next.add(ref);
      return next;
    });
  };

  const selectAll = () => setSelectedRefs(new Set(initialProducts.map(referenceOf)));
  const clearSelection = () => setSelectedRefs(new Set());
  const selectFiltered = () => setSelectedRefs(new Set(filtered.map(referenceOf)));

  const updateCustomPrice = (product: Product, value: string) => {
    setCustomPrices((current) => ({ ...current, [referenceOf(product)]: value }));
  };

  const priceForScreen = (product: Product) => priceFor(product, priceMode, customPrices);

  const requestDownload = (items: Product[], scope: DownloadScope) => {
    if (items.length === 0) {
      window.alert('Selecciona al menos una referencia para generar el PDF.');
      return;
    }
    setDownloadError('');
    setDownloadMessage('');
    setDownloadProgress(0);
    setDownloadRequest({ items, scope });
  };

  const generatePdf = async (request: DownloadRequest) => {
    const result = await generateLookbookPdf(request.items, {
      priceMode: PRICE_MODE_TO_LOOKBOOK[priceMode],
      groupMode: 'category',
      customPrices: customPricesByProductId(request.items, customPrices),
      onProgress: (completed, total) => setDownloadProgress(completed),
    });
    const url = URL.createObjectURL(result.blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = result.fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 2000);
    return result.failedImages.length;
  };

  const confirmDownload = async () => {
    if (!downloadRequest || isDownloading) return;
    setIsDownloading(true);
    setDownloadError('');
    setDownloadProgress(0);

    try {
      const failedImages = await generatePdf(downloadRequest);
      setDownloadRequest(null);
      setDownloadMessage(
        failedImages > 0
          ? 'PDF descargado. ' + failedImages + ' imagen(es) no pudieron cargarse y quedaron marcadas.'
          : 'PDF descargado correctamente con la selección y los precios confirmados.',
      );
    } catch (_) {
      setDownloadError('No se pudo generar el PDF. Revisa tu conexión e inténtalo de nuevo.');
    } finally {
      setIsDownloading(false);
    }
  };

  if (access === 'checking' || access === 'loading') {
    return (
      <div className="min-h-screen bg-[#f8f5f2] flex items-center justify-center px-4">
        <div className="bg-white border border-neutral-200 shadow-sm p-8 text-center max-w-sm">
          <h1 className="text-lg font-black uppercase text-[#1b2333]">Cargando catálogo digital</h1>
          <p className="text-xs text-neutral-500 mt-2">Estamos comprobando tu sesión y preparando las referencias.</p>
        </div>
      </div>
    );
  }

  if (access === 'denied') {
    return (
      <div className="min-h-screen bg-[#f8f5f2] flex items-center justify-center px-4">
        <div className="bg-white border border-neutral-200 shadow-sm p-8 text-center max-w-md">
          <h1 className="text-xl font-black uppercase text-[#1b2333]">Catálogo digital privado</h1>
          <p className="text-sm text-neutral-500 mt-2">Disponible únicamente para clientes registrados y el administrador.</p>
          <Link href="/profile?returnTo=%2Fcatalogo-digital" className="inline-flex items-center gap-2 mt-6 bg-[#1b2333] text-white px-5 py-3 text-xs font-bold uppercase tracking-widest">
            Iniciar sesión
          </Link>
        </div>
      </div>
    );
  }

  if (access === 'error') {
    return (
      <div className="min-h-screen bg-[#f8f5f2] flex items-center justify-center px-4">
        <div className="bg-white border border-neutral-200 shadow-sm p-8 text-center max-w-md">
          <h1 className="text-xl font-black uppercase text-[#1b2333]">No hay referencias disponibles</h1>
          <p className="text-sm text-neutral-500 mt-2">No fue posible cargar el catálogo en este momento.</p>
          <button type="button" onClick={() => window.location.reload()} className="mt-6 bg-[#1b2333] text-white px-5 py-3 text-xs font-bold uppercase tracking-widest">
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Web UI */}
      <div className="min-h-screen bg-[#f8f5f2] print:hidden">
        {/* Header */}
        <div className="bg-[#1b2333] text-white py-12 px-4 text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 0, transparent 50%)', backgroundSize: '14px 14px' }} />
          <div className="relative z-10 max-w-4xl mx-auto">
            <p className="text-[10px] tracking-[0.4em] uppercase text-[#d88193] font-bold mb-2">Catálogo Digital · Mayoristas</p>
            <h1 className="text-4xl sm:text-5xl font-black uppercase tracking-tight text-white mb-1">USH BY USHUAIA</h1>
            <p className="text-sm text-neutral-400 mt-2 tracking-widest uppercase">Temporada 2026 · Itagüí, Colombia · {initialProducts.length} Referencias</p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {([
                ['wholesale', 'Precio mayorista'],
                ['ecommerce', 'Precio e-commerce'],
                ['custom', 'Precio modificable'],
                ['none', 'Sin precios'],
              ] as const).map(([mode, label]) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setPriceMode(mode)}
                  aria-pressed={priceMode === mode}
                  className={priceMode === mode
                    ? 'bg-[#d88193] text-white px-4 py-2 text-[10px] font-bold uppercase tracking-wider'
                    : 'bg-white/10 hover:bg-white/20 text-white px-4 py-2 text-[10px] font-bold uppercase tracking-wider'}
                >
                  {label}
                </button>
              ))}
            </div>
            {priceMode === 'custom' && (
              <p className="text-[11px] text-neutral-300 mt-3">
                Escribe el precio debajo de cada referencia y después confirma la descarga del PDF.
              </p>
            )}
            <div className="mt-4 flex flex-wrap justify-center gap-3">
              {!isAdmin && (
                <>
                  <button
                    type="button"
                    onClick={() => requestDownload(initialProducts, 'completo')}
                    className="flex items-center gap-2 bg-[#d88193] hover:bg-[#c06579] text-white text-xs font-bold uppercase tracking-widest px-5 py-2.5 rounded-full transition-colors"
                  >
                    <Download size={14} /> PDF catálogo completo
                  </button>
                  <button
                    type="button"
                    onClick={() => requestDownload(selectedProducts, 'seleccion')}
                    disabled={selectedCount === 0}
                    className="flex items-center gap-2 bg-white/10 hover:bg-white/20 disabled:opacity-40 text-white text-xs font-bold uppercase tracking-widest px-5 py-2.5 rounded-full transition-colors"
                  >
                    <Download size={14} /> PDF selección ({selectedCount})
                  </button>
                </>
              )}
              {!isAdmin && (
                <Link
                  href="/catalogo"
                  className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold uppercase tracking-widest px-5 py-2.5 rounded-full transition-colors"
                >
                  <ExternalLink size={14} /> Ir al catálogo en línea
                </Link>
              )}
            </div>
            {downloadMessage && (
              <p className="text-[11px] text-emerald-200 mt-3">{downloadMessage}</p>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="sticky top-0 z-30 bg-white border-b border-neutral-200 shadow-sm py-3 px-4">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 w-full sm:max-w-xs">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                value={search}
                onChange={handleSearchChange}
                placeholder="Buscar referencia o nombre…"
                className="w-full pl-9 pr-3 py-2 text-xs border border-neutral-200 rounded-lg focus:outline-none focus:border-[#d88193] bg-white"
              />
            </div>

            {/* Categories */}
            <div className="flex gap-1.5 flex-wrap justify-center">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => handleCategoryChange(cat)}
                  className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full border transition-all ${
                    category === cat
                      ? 'bg-[#1b2333] text-white border-[#1b2333]'
                      : 'bg-white text-neutral-500 border-neutral-200 hover:border-[#d88193]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* View toggle */}
            <div className="flex items-center bg-neutral-100 rounded-lg p-1 gap-1 flex-shrink-0">
              <button
                onClick={() => { setView('lookbook'); setPage(0); }}
                className={`px-3 py-1.5 text-[10px] font-bold uppercase rounded-md flex items-center gap-1 transition-all ${
                  view === 'lookbook' ? 'bg-white shadow-sm text-[#1b2333]' : 'text-neutral-500'
                }`}
              >
                <BookOpen size={12} /> Lookbook
              </button>
              <button
                onClick={() => { setView('grid'); setPage(0); }}
                className={`px-3 py-1.5 text-[10px] font-bold uppercase rounded-md flex items-center gap-1 transition-all ${
                  view === 'grid' ? 'bg-white shadow-sm text-[#1b2333]' : 'text-neutral-500'
                }`}
              >
                <Grid3X3 size={12} /> Cuadrícula
              </button>
            </div>
          </div>
          {!isAdmin && (
            <div className="max-w-7xl mx-auto mt-3 pt-3 border-t border-neutral-100 flex flex-wrap items-center justify-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-neutral-500">
                {selectedCount} de {initialProducts.length} seleccionadas
              </span>
              <button type="button" onClick={selectAll} className="px-3 py-1 text-[10px] font-bold uppercase border border-neutral-200 hover:border-[#d88193]">
                Todas
              </button>
              <button type="button" onClick={selectFiltered} className="px-3 py-1 text-[10px] font-bold uppercase border border-neutral-200 hover:border-[#d88193]">
                Seleccionar filtradas
              </button>
              <button type="button" onClick={clearSelection} className="px-3 py-1 text-[10px] font-bold uppercase border border-neutral-200 hover:border-[#d88193]">
                Limpiar
              </button>
            </div>
          )}
        </div>

        {/* Results count */}
        <div className="max-w-7xl mx-auto px-4 pt-5 pb-2">
          <p className="text-[11px] text-neutral-400 font-bold uppercase tracking-wider">
            {filtered.length} referencias {category !== 'Todas' ? `en ${category}` : 'en total'}
            {search && ` · búsqueda: "${search}"`}
          </p>
        </div>

        {/* Lookbook view */}
        {view === 'lookbook' ? (
          <div className="max-w-7xl mx-auto px-4 pb-12">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-0.5">
              {paginated.map((p) => (
                <Link
                  key={p.id}
                  href={`/producto/${p.slug}`}
                  className="group relative aspect-[3/4] bg-neutral-100 overflow-hidden"
                >
                  {!isAdmin && (
                    <label
                      className="absolute top-3 right-3 z-10 flex items-center gap-1.5 bg-white/90 text-[#1b2333] px-2 py-1.5 text-[9px] font-black uppercase shadow"
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedRefs.has(referenceOf(p))}
                        onChange={() => toggleReference(p)}
                        className="accent-[#d88193]"
                        aria-label={`Seleccionar referencia ${referenceOf(p)}`}
                      />
                      {selectedRefs.has(referenceOf(p)) ? 'Incluida' : 'Incluir'}
                    </label>
                  )}
                  {p.images[0] && (
                    <Image
                      src={p.images[0]}
                      alt={p.name}
                      fill
                      unoptimized={p.images[0].startsWith('http://') || p.images[0].startsWith('https://')}
                      sizes="(max-width: 768px) 50vw, 33vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  )}
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="absolute bottom-0 left-0 right-0 p-4 text-white transform translate-y-3 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#d88193]">Ref. #{p.reference}</p>
                    <p className="text-sm font-black uppercase mt-0.5 leading-tight">{p.name}</p>
                    {priceMode !== 'none' && (
                      <p className="text-xs text-neutral-300 mt-1">
                        {priceMode === 'ecommerce' && 'E-commerce: '}
                        {priceMode === 'custom' && 'Personalizado: '}
                        {priceForScreen(p)}
                      </p>
                    )}
                  </div>
                  {/* Ribbon */}
                  {p.ribbon && (
                    <div className="absolute top-3 left-0 bg-[#d88193] text-white text-[9px] font-black uppercase tracking-wider px-3 py-1">
                      {p.ribbon}
                    </div>
                  )}
                  {/* Share quick button */}
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      const url = `https://ushbyushuaia.vercel.app/producto/${p.slug}`;
                      const msg = `👗 *${p.name}* (Ref. #${p.reference})\n💲 Mayorista: ${formatCOP(p.price)}\n🔗 ${url}`;
                      if (navigator.share) {
                        navigator.share({ title: p.name, text: msg, url }).catch(() => {});
                      } else {
                        navigator.clipboard.writeText(msg).then(() => alert('¡Enlace copiado!')).catch(() => {});
                      }
                    }}
                    className="absolute top-3 right-3 bg-white/90 hover:bg-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 shadow"
                    aria-label="Compartir"
                    title="Compartir referencia"
                  >
                    <Share2 size={13} className="text-[#1b2333]" />
                  </button>
                  {priceMode === 'custom' && (
                    <input
                      type="number"
                      min="0"
                      inputMode="numeric"
                      value={customPrices[referenceOf(p)] || ''}
                      onChange={(e) => updateCustomPrice(p, e.target.value)}
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                      placeholder="Precio"
                      className="absolute bottom-3 left-3 z-10 w-24 bg-white/95 border border-neutral-300 px-2 py-1 text-[10px] text-[#1b2333] shadow focus:outline-none focus:border-[#d88193]"
                      aria-label={`Precio personalizado de la referencia ${referenceOf(p)}`}
                    />
                  )}
                </Link>
              ))}
            </div>
          </div>
        ) : (
          /* Grid view */
          <div className="max-w-7xl mx-auto px-4 pb-12">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {paginated.map((p) => (
                <Link
                  key={p.id}
                  href={`/producto/${p.slug}`}
                  className="group relative bg-white border border-neutral-200 hover:border-[#d88193] hover:shadow-md transition-all duration-200 rounded-lg overflow-hidden"
                >
                  {!isAdmin && (
                    <label
                      className="absolute z-10 mt-2 ml-[calc(100%-5rem)] flex items-center gap-1 bg-white/90 text-[#1b2333] px-1.5 py-1 text-[8px] font-black shadow"
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedRefs.has(referenceOf(p))}
                        onChange={() => toggleReference(p)}
                        className="accent-[#d88193]"
                        aria-label={`Seleccionar referencia ${referenceOf(p)}`}
                      />
                      {selectedRefs.has(referenceOf(p)) ? '✓' : '+'}
                    </label>
                  )}
                  <div className="aspect-[3/4] relative bg-neutral-50">
                    {p.images[0] && (
                      <Image
                        src={p.images[0]}
                        alt={p.name}
                        fill
                        unoptimized={p.images[0].startsWith('http://') || p.images[0].startsWith('https://')}
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    )}
                    {p.ribbon && (
                      <span className="absolute top-2 left-0 bg-[#d88193] text-white text-[8px] font-black uppercase px-2 py-0.5">
                        {p.ribbon}
                      </span>
                    )}
                  </div>
                  <div className="p-2.5">
                    <p className="text-[9px] text-neutral-400 font-bold uppercase">#{p.reference}</p>
                    <p className="text-[11px] font-black uppercase text-[#1b2333] truncate mt-0.5">{p.name}</p>
                    {priceMode !== 'none' && (
                      <p className="text-[11px] font-black text-[#d88193] mt-1">{priceForScreen(p)}</p>
                    )}
                    {priceMode === 'custom' && (
                      <input
                        type="number"
                        min="0"
                        inputMode="numeric"
                        value={customPrices[referenceOf(p)] || ''}
                        onChange={(e) => updateCustomPrice(p, e.target.value)}
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                        placeholder="Precio"
                        className="w-full mt-2 border border-neutral-300 px-2 py-1 text-[10px] focus:outline-none focus:border-[#d88193]"
                        aria-label={`Precio personalizado de la referencia ${referenceOf(p)}`}
                      />
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 pb-12">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="flex items-center gap-1.5 px-4 py-2 text-[11px] font-bold uppercase tracking-wider bg-white border border-neutral-200 hover:border-[#d88193] disabled:opacity-40 rounded-lg transition-colors"
            >
              <ChevronLeft size={14} /> Anterior
            </button>
            <span className="text-[11px] font-bold text-neutral-500">
              Página {page + 1} de {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page === totalPages - 1}
              className="flex items-center gap-1.5 px-4 py-2 text-[11px] font-bold uppercase tracking-wider bg-white border border-neutral-200 hover:border-[#d88193] disabled:opacity-40 rounded-lg transition-colors"
            >
              Siguiente <ChevronRight size={14} />
            </button>
          </div>
        )}

        {/* Footer note */}
        <div className="bg-[#1b2333] text-white text-center py-8 px-4">
          <p className="text-[10px] tracking-widest uppercase text-neutral-400">
            USH BY USHUAIA · Catálogo Digital 2026 · Pedidos mínimos 12 unidades · Envío gratis desde 12 uds
          </p>
          <p className="text-[10px] tracking-wider text-neutral-500 mt-1">
            Itagüí, Antioquia, Colombia · ushbyushuaia.vercel.app
          </p>
        </div>
      </div>

      {downloadRequest && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 px-4" role="dialog" aria-modal="true" aria-labelledby="download-title">
          <div className="w-full max-w-lg bg-white shadow-2xl border border-neutral-200">
            <div className="bg-[#1b2333] text-white px-6 py-5">
              <h2 id="download-title" className="text-base font-black uppercase tracking-widest">Confirmar descarga PDF</h2>
              <p className="text-xs text-neutral-300 mt-1">El archivo se descargará directamente. No se abrirá la ventana de impresión.</p>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-3 mb-5">
                <div className="bg-neutral-50 border border-neutral-200 p-3">
                  <p className="text-[9px] uppercase font-bold tracking-wider text-neutral-400">Referencias</p>
                  <p className="text-xl font-black text-[#1b2333]">{downloadRequest.items.length}</p>
                  <p className="text-[10px] text-neutral-500 uppercase">Catálogo {downloadRequest.scope}</p>
                </div>
                <div className="bg-neutral-50 border border-neutral-200 p-3">
                  <p className="text-[9px] uppercase font-bold tracking-wider text-neutral-400">Precios</p>
                  <p className="text-sm font-black text-[#1b2333] mt-1">{PRICE_MODE_LABELS[priceMode]}</p>
                </div>
              </div>

              <p className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2">Referencias que se descargarán</p>
              <div className="max-h-28 overflow-y-auto border border-neutral-200 bg-neutral-50 p-3 flex flex-wrap gap-1.5">
                {downloadRequest.items.slice(0, 18).map((product) => (
                  <span key={product.id} className="text-[10px] font-bold text-[#1b2333] bg-white border border-neutral-200 px-2 py-1">
                    #{referenceOf(product)}
                  </span>
                ))}
                {downloadRequest.items.length > 18 && (
                  <span className="text-[10px] text-neutral-500 px-2 py-1">
                    +{downloadRequest.items.length - 18} referencias más
                  </span>
                )}
              </div>

              {priceMode === 'custom' && (
                <p className="text-[11px] text-neutral-500 mt-4">
                  Se usarán los precios personalizados que hayas escrito. Los campos vacíos quedarán como “Precio editable”.
                </p>
              )}

              {isDownloading && (
                <div className="mt-4">
                  <div className="flex justify-between text-[10px] font-bold uppercase text-neutral-500 mb-1">
                    <span>Generando PDF</span>
                    <span>{downloadProgress} / {downloadRequest.items.length}</span>
                  </div>
                  <div className="h-2 bg-neutral-100 overflow-hidden">
                    <div className="h-full bg-[#d88193] transition-all" style={{ width: (downloadProgress / downloadRequest.items.length * 100) + '%' }} />
                  </div>
                </div>
              )}

              {downloadError && (
                <p className="mt-4 p-3 bg-red-50 border border-red-200 text-xs text-red-700">{downloadError}</p>
              )}

              <div className="flex justify-end gap-2 mt-6">
                <button
                  type="button"
                  onClick={() => setDownloadRequest(null)}
                  disabled={isDownloading}
                  className="px-4 py-2.5 border border-neutral-300 text-xs font-bold uppercase tracking-wider text-neutral-600 hover:bg-neutral-50 disabled:opacity-40"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => void confirmDownload()}
                  disabled={isDownloading}
                  className="px-4 py-2.5 bg-[#d88193] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#c06579] disabled:opacity-50"
                >
                  {isDownloading ? 'Generando PDF…' : 'Confirmar descarga'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
