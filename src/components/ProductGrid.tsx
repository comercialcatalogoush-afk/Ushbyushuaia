'use client';

import React, { useState, useEffect } from 'react';
import { Product } from '@/types';
import { ProductCard } from './ProductCard';
import { Filter, Tag, ChevronDown } from 'lucide-react';
import { getLocalProductsOverride, getTopSellingProductIds } from '@/lib/supabase';

interface ProductGridProps {
  products: Product[];
}

const DEFAULT_FITS = ['Wide Leg', 'Mom', 'Cargo', 'Bermuda', 'Straight'];
const CATEGORIES = ['Todos', 'Nuevo', 'Jeans', 'Shorts', 'Faldas', 'Cargo', 'Bermuda', 'Rebajas'];

export const ProductGrid: React.FC<ProductGridProps> = ({ products }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [selectedFit, setSelectedFit] = useState<string>('all');
  const [displayProducts, setDisplayProducts] = useState<Product[]>(products);
  const [topSellerIds, setTopSellerIds] = useState<string[]>([]);
  const [availableFits, setAvailableFits] = useState<string[]>(DEFAULT_FITS);
  const [mobileCatOpen, setMobileCatOpen] = useState(false);

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

    getTopSellingProductIds().then((ids) => setTopSellerIds(ids));

    try {
      const saved = localStorage.getItem('ush_admin_fits');
      if (saved) setAvailableFits(JSON.parse(saved));
    } catch {}

    const onProductsUpdated = () => updateList();
    const onFitsUpdated = () => {
      try {
        const saved = localStorage.getItem('ush_admin_fits');
        if (saved) setAvailableFits(JSON.parse(saved));
      } catch {}
    };

    window.addEventListener('ush_products_updated', onProductsUpdated);
    window.addEventListener('ush_fits_updated', onFitsUpdated);
    return () => {
      window.removeEventListener('ush_products_updated', onProductsUpdated);
      window.removeEventListener('ush_fits_updated', onFitsUpdated);
    };
  }, [products]);

  // Compute which fits actually have products (only show active fits)
  const activeFits = availableFits.filter((fit) =>
    displayProducts.some((p) => p.fit && p.fit.toLowerCase() === fit.toLowerCase())
  );

  const filteredProducts = displayProducts.filter((p) => {
    if (p.hidden || p.status === 'draft') return false;

    // Category filter
    if (selectedCategory !== 'Todos') {
      if (selectedCategory === 'Nuevo') {
        if (!p.ribbon?.toLowerCase().includes('nuevo') && p.category?.toLowerCase() !== 'nuevo') return false;
      } else {
        const matchCat = p.category?.toLowerCase() === selectedCategory.toLowerCase();
        const matchRibbon = p.ribbon?.toLowerCase() === selectedCategory.toLowerCase();
        if (!matchCat && !matchRibbon) return false;
      }
    }

    // Fit filter — strict: product must have that exact fit
    if (selectedFit !== 'all') {
      if (!p.fit || p.fit.toLowerCase() !== selectedFit.toLowerCase()) return false;
    }

    return true;
  });

  return (
    <section id="catalogo" className="scroll-mt-20">

      {/* ── Category Nav Bar (estilo ushuaiajeans.com.co) ── */}
      <div className="sticky top-16 z-30 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Desktop category tabs */}
          <nav className="hidden md:flex items-center gap-0 overflow-x-auto scrollbar-none">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-5 py-4 text-xs font-bold uppercase tracking-[0.15em] border-b-2 transition-all whitespace-nowrap ${
                  selectedCategory === cat
                    ? 'border-[#d88193] text-[#1b2333]'
                    : 'border-transparent text-neutral-500 hover:text-[#1b2333] hover:border-gray-300'
                }`}
              >
                {cat}
              </button>
            ))}
          </nav>

          {/* Mobile category dropdown */}
          <div className="md:hidden py-3 relative">
            <button
              onClick={() => setMobileCatOpen(!mobileCatOpen)}
              className="w-full flex items-center justify-between px-4 py-2.5 border border-gray-200 text-xs font-bold uppercase tracking-wider text-[#1b2333] bg-white"
            >
              <span>{selectedCategory}</span>
              <ChevronDown size={16} className={`transition-transform ${mobileCatOpen ? 'rotate-180' : ''}`} />
            </button>
            {mobileCatOpen && (
              <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 shadow-lg z-50">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => { setSelectedCategory(cat); setMobileCatOpen(false); }}
                    className={`w-full text-left px-4 py-3 text-xs font-bold uppercase tracking-wider border-b border-gray-100 last:border-0 transition-colors ${
                      selectedCategory === cat ? 'text-[#d88193] bg-rose-50' : 'text-neutral-700 hover:bg-neutral-50'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Fit Filter Selector Bar ── */}
      {activeFits.length > 0 && (
        <div className="bg-neutral-50 border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2 overflow-x-auto py-3 scrollbar-none">
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1 mr-1 shrink-0">
                <Tag size={12} className="text-[#d88193]" /> Fit:
              </span>

              <button
                onClick={() => setSelectedFit('all')}
                className={`px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider transition-all border shrink-0 ${
                  selectedFit === 'all'
                    ? 'bg-[#1b2333] text-white border-[#1b2333]'
                    : 'bg-white text-neutral-600 border-gray-200 hover:bg-neutral-100'
                }`}
              >
                Todos los Fits
              </button>

              {activeFits.map((fit) => (
                <button
                  key={fit}
                  onClick={() => setSelectedFit(fit)}
                  className={`px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider transition-all border shrink-0 ${
                    selectedFit.toLowerCase() === fit.toLowerCase()
                      ? 'bg-[#d88193] text-white border-[#d88193]'
                      : 'bg-white text-neutral-600 border-gray-200 hover:bg-neutral-100'
                  }`}
                >
                  {fit}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Product Grid ── */}
      <div className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Result count header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-xl font-black text-[#1b2333] uppercase tracking-tight">
                {selectedCategory === 'Todos' ? 'Colección Completa' : selectedCategory}
                {selectedFit !== 'all' && <span className="text-[#d88193]"> · {selectedFit}</span>}
              </h2>
              <p className="text-xs text-neutral-500 mt-0.5">{filteredProducts.length} referencias disponibles</p>
            </div>
          </div>

          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.map((product) => {
                const isTopSeller =
                  topSellerIds.includes(product.id) ||
                  topSellerIds.includes(product.reference) ||
                  product.is_best_seller;
                return <ProductCard key={product.id} product={product} isTopSeller={isTopSeller} />;
              })}
            </div>
          ) : (
            <div className="text-center py-20 bg-neutral-50 border border-dashed border-gray-200">
              <Filter size={36} className="mx-auto text-neutral-300 mb-3" />
              <p className="text-sm font-bold uppercase text-neutral-700">No hay prendas disponibles</p>
              <p className="text-xs text-neutral-400 mt-1">Prueba cambiando la categoría o el fit.</p>
              <button
                onClick={() => { setSelectedCategory('Todos'); setSelectedFit('all'); }}
                className="mt-4 text-xs font-bold underline text-[#d88193] uppercase tracking-wider"
              >
                Ver todas las referencias
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
