'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { Product } from '@/types';
import { ProductCard } from './ProductCard';
import { Flame, ChevronDown, ChevronRight } from 'lucide-react';
import { getLocalProductsOverride } from '@/lib/supabase';

interface CatalogGridProps {
  products: Product[];
  showHeader?: boolean;
}

const PAGE_SIZE = 12;

// Orden preferido de fits (estilo colecciones de la tienda)
const FIT_ORDER = ['Wide Leg', 'Barrel', 'Straight Boot', 'Vaquero', 'Bota Flare', 'Skinny', 'Straight'];

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
  const [displayProducts, setDisplayProducts] = useState<Product[]>(products);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // Filtros de prendas (estilo colecciones del sitio)
  const [activeCategory, setActiveCategory] = useState<string>('Todos');
  const [activeFit, setActiveFit] = useState<string>('Todos');
  const [fitMenuOpen, setFitMenuOpen] = useState(false);

  // Lee los filtros del menú superior (?categoria=...&fit=...)
  useEffect(() => {
    const cat = searchParams.get('categoria');
    const fit = searchParams.get('fit');
    if (cat) setActiveCategory(cat);
    if (fit) setActiveFit(normalizeFitLabel(fit));
  }, [searchParams]);

  useEffect(() => {
    const updateList = () => {
      const local = getLocalProductsOverride();
      if (local && local.length > 0) {
        setDisplayProducts(local.filter((p) => !p.hidden && p.status !== 'draft'));
      } else {
        setDisplayProducts(products.filter((p) => !p.hidden && p.status !== 'draft'));
      }
    };
    updateList();

    const onProductsUpdated = () => updateList();
    window.addEventListener('ush_products_updated', onProductsUpdated);

    return () => {
      window.removeEventListener('ush_products_updated', onProductsUpdated);
    };
  }, [products]);

  // Reset pagination when data changes
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [displayProducts]);

  // Public grid: only products with at least one valid image
  const visibleProducts = displayProducts.filter(
    (p) => p.images && p.images.length > 0 && p.images[0] && p.images[0].trim() !== ''
  );

  // ── Filtro de prendas (aplica al catálogo completo) ──
  const catalogProducts = visibleProducts.filter((p) => {
    if (activeCategory !== 'Todos') {
      const cat = (p.category || '').toLowerCase();
      const catActive = activeCategory.toLowerCase();
      const name = (p.name || '').toLowerCase();
      const tags = (p.tags || []).join(' ').toLowerCase();
      const matchCat = cat === catActive || name.includes(catActive) || tags.includes(catActive);
      if (!matchCat) return false;
    }
    if (activeFit !== 'Todos') {
      const fit = (p.fit || '').toLowerCase();
      const fitActive = activeFit.toLowerCase();
      const name = (p.name || '').toLowerCase();
      const matchFit = fit === fitActive || name.includes(fitActive);
      if (!matchFit) return false;
    }
    return true;
  });

  // Categorías reales presentes en el catálogo
  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    visibleProducts.forEach((p) => { if (p.category) set.add(p.category); });
    return ['Todos', ...Array.from(set)];
  }, [visibleProducts]);

  // Fits reales presentes en la categoría activa (no hardcodeados)
  const fitsForCategory = useMemo(() => {
    const set = new Set<string>();
    visibleProducts.forEach((p) => {
      if (activeCategory === 'Todos' || (p.category || '') === activeCategory) {
        if (p.fit) set.add(p.fit);
      }
    });
    const fits = Array.from(set);
    const sorted = FIT_ORDER.filter((f) => set.has(f)).concat(
      fits.filter((f) => !FIT_ORDER.includes(f)).sort()
    );
    return ['Todos', ...sorted];
  }, [visibleProducts, activeCategory]);

  const paginatedProducts = catalogProducts.slice(0, visibleCount);
  const hasMore = visibleCount < catalogProducts.length;

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + PAGE_SIZE);
  };

  const handleCategoryChange = (cat: string) => {
    setActiveCategory(cat);
    setActiveFit('Todos');
    setFitMenuOpen(false);
    setVisibleCount(PAGE_SIZE);
  };

  const handleFitChange = (fit: string) => {
    setActiveFit(fit);
    setFitMenuOpen(false);
    setVisibleCount(PAGE_SIZE);
  };

  return (
    <section id="catalogo" className="reveal scroll-mt-20 bg-white">
      <div className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Result count header */}
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6 animate-fadeInUp">
            <div>
              {showHeader && (
                <h2 className="text-xl font-black text-[#1b2333] uppercase tracking-tight">
                  Catálogo Completo
                </h2>
              )}
              <p className="text-xs text-neutral-500 mt-0.5">
                {catalogProducts.length} referencias disponibles
                {catalogProducts.length > visibleCount && ` · Mostrando ${paginatedProducts.length} de ${catalogProducts.length}`}
              </p>
            </div>
          </div>

          {/* ── Filtro de prendas (colecciones del sitio) ── */}
          <div className="mb-8 animate-fadeInUp">
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

              {/* Fit dropdown (solo si la categoría activa tiene fits) */}
              {fitsForCategory.length > 1 && (
                <div className="relative ml-2">
                  <button
                    onClick={() => setFitMenuOpen((o) => !o)}
                    className="inline-flex items-center gap-2 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider border border-gray-200 bg-white text-neutral-600 hover:border-[#d88193] hover:text-[#d88193] transition-all"
                  >
                    Fit: <span className="text-[#d88193]">{activeFit}</span>
                    <ChevronDown size={13} className={`transition-transform ${fitMenuOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {fitMenuOpen && (
                    <div className="absolute left-0 top-full mt-1 z-30 bg-white border border-gray-200 shadow-xl min-w-[180px] max-h-72 overflow-y-auto">
                      {fitsForCategory.map((fit) => (
                        <button
                          key={fit}
                          onClick={() => handleFitChange(fit)}
                          className={`w-full text-left px-4 py-2 text-[11px] font-bold uppercase tracking-wider hover:bg-rose-50 ${
                            activeFit === fit ? 'text-[#d88193] bg-rose-50' : 'text-neutral-600'
                          }`}
                        >
                          {fit}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {(activeCategory !== 'Todos' || activeFit !== 'Todos') && (
                <button
                  onClick={() => { handleCategoryChange('Todos'); handleFitChange('Todos'); }}
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
                    <ProductCard product={product} />
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
              <p className="text-xs text-neutral-400 mt-1">Prueba con otra categoría o fit.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};