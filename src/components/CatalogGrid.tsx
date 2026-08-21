'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { Product } from '@/types';
import { ProductCard } from './ProductCard';
import { Flame, ChevronDown, ChevronRight, Percent, ArrowUpRight, ArrowUpDown } from 'lucide-react';
import { isCompleteProduct, getTopSellingProducts } from '@/lib/supabase';
import { useCatalogSync } from '@/lib/useCatalogSync';

interface CatalogGridProps {
  products: Product[];
  showHeader?: boolean;
}

const PAGE_SIZE = 12;

const RETAIL_URL = 'https://www.ushuaiajeans.com.co';

// Categorías del sitio oficial (aparecen siempre, aunque aún no tengan productos)
const OFFICIAL_CATEGORY_ORDER = ['Jeans', 'Pantalones', 'Cargos', 'Shorts', 'Faldas'];

// Normaliza la etiqueta del menú (ej: "VAQUERO", "WIDE LEG") al fit real del producto
function normalizeFitLabel(label: string): string {
  const map: Record<string, string> = {
    'WIDE LEG': 'Wide Leg', 'WIDELEG': 'Wide Leg', 'BARREL': 'Barrel',
    'STRAIGHT BOOT': 'Straight Boot', 'STRAIGHTBOOT': 'Straight Boot',
    'VAQUERO': 'Vaquero', 'BOTA FLARE': 'Bota Flare', 'BOTAFLARE': 'Bota Flare',
    'SKINNY': 'Skinny', 'STRAIGHT': 'Straight', 'MOM': 'Mom', 'CARGO': 'Cargo', 'BERMUDA': 'Bermuda'
  };
  return map[label.toUpperCase()] || label;
}

export const CatalogGrid: React.FC<CatalogGridProps> = ({ products, showHeader = true }) => {
  const searchParams = useSearchParams();
  const syncedProducts = useCatalogSync(products);
  const [displayProducts, setDisplayProducts] = useState<Product[]>(syncedProducts);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // Filtros de prendas (estilo colecciones del sitio)
  const [activeCategory, setActiveCategory] = useState<string>('Todos');
  const [activeFit, setActiveFit] = useState<string>('Todos');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [tierInfoOpen, setTierInfoOpen] = useState(false);

  // Top sellers (rotación real: unidades vendidas en pedidos confirmados)
  const [topUnitsById, setTopUnitsById] = useState<Map<string, number>>(new Map());
  const [sortBy, setSortBy] = useState<'top' | 'price-asc' | 'price-desc' | 'name'>('top');

  useEffect(() => {
    let cancelled = false;
    getTopSellingProducts(30).then((list) => {
      if (cancelled || list.length === 0) return;
      setTopUnitsById(new Map(list.map((t) => [t.id, t.units])));
    });
    return () => { cancelled = true; };
  }, []);

  // Lee los filtros del menú superior (?categoria=...&fit=...) y la búsqueda (?buscar=...)
  useEffect(() => {
    const cat = searchParams.get('categoria');
    const fit = searchParams.get('fit');
    const buscar = searchParams.get('buscar');
    if (cat) setActiveCategory(cat);
    if (fit) setActiveFit(normalizeFitLabel(fit));
    if (buscar) setSearchQuery(buscar);
  }, [searchParams]);

  // Supabase es la fuente de verdad: usamos los productos que trae el servidor
  // (o los que refresca la sincronización realtime).
  useEffect(() => {
    const updateList = () => {
      setDisplayProducts(syncedProducts.filter((p) => !p.hidden && p.status !== 'draft'));
    };
    updateList();

    const onProductsUpdated = () => updateList();
    window.addEventListener('ush_products_updated', onProductsUpdated);

    return () => {
      window.removeEventListener('ush_products_updated', onProductsUpdated);
    };
  }, [syncedProducts]);

  // Reset pagination when data changes
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [displayProducts]);

  // Public grid: only complete products (photo + title + detailed description)
  const visibleProducts = displayProducts.filter((p) => isCompleteProduct(p));

  // ── Filtro de prendas (aplica al catálogo completo) ──
  const catalogProducts = visibleProducts.filter((p) => {
    const name = (p.name || '').toLowerCase();
    const tags = (p.tags || []).join(' ').toLowerCase();
    const ref = (p.reference || '').toLowerCase();
    const searchTerm = searchQuery.trim().toLowerCase();

    if (searchTerm) {
      const haystack = [name, ref, (p.fit || '').toLowerCase(), (p.category || '').toLowerCase(), (p.color || '').toLowerCase(), tags].join(' ');
      if (!haystack.includes(searchTerm)) return false;
    }

    if (activeCategory !== 'Todos') {
      const cat = (p.category || '').toLowerCase();
      const catActive = activeCategory.toLowerCase();
      const matchCat = cat === catActive || name.includes(catActive) || tags.includes(catActive);
      if (!matchCat) return false;
    }
    if (activeFit !== 'Todos') {
      const fit = (p.fit || '').toLowerCase();
      const fitActive = activeFit.toLowerCase();
      // Coincidencia exacta de fit, o bien la palabra completa del fit en
      // nombre/tags (evita que "Straight" arrastre "Straight Boot").
      const word = new RegExp(`(^|[^a-z0-9])${fitActive.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^a-z0-9]|$)`, 'i');
      const matchFit = fit === fitActive || word.test(name) || word.test(tags);
      if (!matchFit) return false;
    }
    return true;
  });

  // Categorías reales presentes en el catálogo + las oficiales del sitio
  const availableCategories = useMemo(() => {
    const present = new Set<string>();
    visibleProducts.forEach((p) => { if (p.category) present.add(p.category); });
    // Cargos siempre visible (como en el sitio oficial), aunque aún no tenga productos
    const official = OFFICIAL_CATEGORY_ORDER.filter((c) => present.has(c) || c === 'Cargos');
    const extra = Array.from(present).filter((c) => !OFFICIAL_CATEGORY_ORDER.includes(c));
    return ['Todos', ...official, ...extra];
  }, [visibleProducts]);

  const paginatedProducts = useMemo(() => {
    const sorted = [...catalogProducts];
    switch (sortBy) {
      case 'top':
        // Más vendidos primero (por unidades vendidas); el resto conserva su orden
        sorted.sort((a, b) => (topUnitsById.get(b.id) ?? 0) - (topUnitsById.get(a.id) ?? 0));
        break;
      case 'price-asc':
        sorted.sort((a, b) => (a.price || 0) - (b.price || 0));
        break;
      case 'price-desc':
        sorted.sort((a, b) => (b.price || 0) - (a.price || 0));
        break;
      case 'name':
        sorted.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'es'));
        break;
    }
    return sorted.slice(0, visibleCount);
  }, [catalogProducts, sortBy, topUnitsById, visibleCount]);
  const hasMore = visibleCount < catalogProducts.length;

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + PAGE_SIZE);
  };

  const handleCategoryChange = (cat: string) => {
    setActiveCategory(cat);
    setActiveFit('Todos');
    setVisibleCount(PAGE_SIZE);
  };

  return (
    <section id="catalogo" className="reveal scroll-mt-20 bg-white">
      <div className="py-4 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Result count header */}
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-3 animate-fadeInUp">
            <div>
              {showHeader && (
                <h2 className="text-lg font-black text-[#1b2333] uppercase tracking-tight">
                  Catálogo Completo
                </h2>
              )}
              <p className="text-[11px] text-neutral-500 mt-0.5">
                {catalogProducts.length} referencias disponibles
                {catalogProducts.length > visibleCount && ` · Mostrando ${paginatedProducts.length} de ${catalogProducts.length}`}
              </p>
            </div>

            {/* Ordenar */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <ArrowUpDown size={12} className="text-neutral-400" />
              <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">
                Ordenar:
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="border border-gray-200 bg-white px-2 py-1.5 text-[11px] font-bold uppercase tracking-wider text-neutral-700 focus:outline-none focus:border-[#d88193] cursor-pointer"
              >
                <option value="top">Más vendidos</option>
                <option value="price-asc">Precio: menor a mayor</option>
                <option value="price-desc">Precio: mayor a menor</option>
                <option value="name">Nombre (A-Z)</option>
              </select>
            </div>
          </div>

          {/* ── Escala de precios mayorista (desde 8 unidades) ── */}
          <div className="mb-3 animate-fadeInUp">
            <div className="border border-gray-200 bg-neutral-50 overflow-hidden">
              <button
                onClick={() => setTierInfoOpen((o) => !o)}
                className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left"
              >
                <span className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-ush-navy">
                  <Percent size={14} className="text-ush-pink" />
                  Escala de precios mayorista
                </span>
                <span className="flex items-center gap-2">
                  <span className="hidden md:inline text-[10px] text-neutral-500">
                    8–11 uds: 20% OFF · 12+ uds: 35% a 42% OFF + envío gratis
                  </span>
                  <ChevronDown size={14} className={`text-neutral-400 transition-transform duration-300 ${tierInfoOpen ? 'rotate-180' : ''}`} />
                </span>
              </button>

              {tierInfoOpen && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-gray-200 border-t border-gray-200 animate-fadeInUp">
                    <div className="bg-white p-4">
                      <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400">1 a 7 unidades</p>
                      <p className="mt-1 text-xs font-bold text-neutral-600">Precio de venta sugerido</p>
                      <p className="text-[11px] text-neutral-400 mt-0.5">Detal, sin descuento mayorista.</p>
                    </div>
                    <div className="bg-white p-4 border-t sm:border-t-0 border-gray-200 sm:border-l">
                      <p className="text-[10px] font-black uppercase tracking-widest text-amber-600">8 a 11 unidades</p>
                      <p className="mt-1 text-xs font-bold text-neutral-900">20% de descuento</p>
                      <p className="text-[11px] text-neutral-400 mt-0.5">Compra mínima mayorista. Aplica solo este 20%.</p>
                    </div>
                    <div className="bg-white p-4 border-t sm:border-t-0 border-gray-200 sm:border-l">
                      <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600">12+ unidades</p>
                      <p className="mt-1 text-xs font-bold text-neutral-900">35% a 42% de descuento</p>
                      <p className="text-[11px] text-neutral-400 mt-0.5">
                        Precio mayorista + <strong className="text-emerald-700">ENVÍO GRATIS</strong>.
                      </p>
                    </div>
                  </div>

                  <div className="px-4 py-2.5 text-[11px] text-neutral-500 border-t border-gray-200 bg-white animate-fadeIn">
                    ¿Compras menos de 8 unidades? Visita nuestra tienda retail{' '}
                    <a
                      href={RETAIL_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-0.5 font-bold text-ush-pink hover:underline"
                    >
                      www.ushuaiajeans.com.co <ArrowUpRight size={11} />
                    </a>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* ── Filtro de prendas (colecciones del sitio) ── */}
          <div className="mb-4 animate-fadeInUp">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mr-1">
                Categoría:
              </span>
              {availableCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => handleCategoryChange(cat)}
                  className={`px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider border transition-all ${
                    activeCategory === cat
                      ? 'bg-[#1b2333] text-white border-[#1b2333]'
                      : 'bg-white text-neutral-600 border-gray-200 hover:border-[#d88193] hover:text-[#d88193]'
                  }`}
                >
                  {cat}
                </button>
              ))}

              {(activeCategory !== 'Todos' || activeFit !== 'Todos') && (
                <button
                  onClick={() => { handleCategoryChange('Todos'); setActiveFit('Todos'); }}
                  className="ml-auto text-[10px] font-bold uppercase tracking-widest text-[#d88193] hover:underline"
                >
                  Limpiar filtros
                </button>
              )}
            </div>
          </div>

          {paginatedProducts.length > 0 ? (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {paginatedProducts.map((product, i) => (
                  <div
                    key={product.id}
                    className={`animate-fadeInUp delay-${Math.min((i % 4) * 100 + 100, 500)}`}
                  >
                    <ProductCard product={product} isTopSeller={(topUnitsById.get(product.id) ?? 0) > 0} />
                  </div>
                ))}
              </div>

              {/* Load More Button */}
              {hasMore && (
                <div className="mt-12 text-center">
                  <button
                    onClick={handleLoadMore}
                    className="inline-flex items-center gap-2 bg-[#1b2333] text-white text-xs font-bold uppercase tracking-widest px-10 py-4 hover:bg-[#d88193] transition-colors shadow-md group"
                  >
                    <span>Cargar más ({catalogProducts.length - visibleCount} referencias restantes)</span>
                    <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                  <p className="text-[11px] text-neutral-400 mt-3">
                    Mostrando {paginatedProducts.length} de {catalogProducts.length} referencias
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-20 bg-neutral-50 border border-dashed border-gray-200">
              <Flame size={36} className="mx-auto text-neutral-300 mb-3" />
              <p className="text-sm font-bold uppercase text-neutral-700">No hay prendas en esta categoría</p>
              <p className="text-xs text-neutral-400 mt-1">
                {activeCategory === 'Cargos'
                  ? 'Estamos añadiendo cargos a la colección. Pronto habrá novedades.'
                  : 'Prueba con otra categoría o fit.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};