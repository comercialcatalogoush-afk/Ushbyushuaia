'use client';

import React, { useState, useEffect } from 'react';
import { Product } from '@/types';
import { ProductCard } from './ProductCard';
import { Filter, Sparkles, Flame, Check, Tag } from 'lucide-react';
import { getLocalProductsOverride, getTopSellingProductIds } from '@/lib/supabase';

interface ProductGridProps {
  products: Product[];
}

const DEFAULT_FITS = ['Wide Leg', 'Mom', 'Cargo', 'Bermuda', 'Straight'];

export const ProductGrid: React.FC<ProductGridProps> = ({ products }) => {
  const [activeTab, setActiveTab] = useState<'all' | 'nuevo' | 'mas_vendido'>('all');
  const [selectedFit, setSelectedFit] = useState<string>('all');
  const [displayProducts, setDisplayProducts] = useState<Product[]>(products);
  const [topSellerIds, setTopSellerIds] = useState<string[]>([]);
  const [availableFits, setAvailableFits] = useState<string[]>(DEFAULT_FITS);

  useEffect(() => {
    const updateList = () => {
      const local = getLocalProductsOverride();
      if (local && local.length > 0) {
        setDisplayProducts(local.filter((p) => !p.hidden && p.status !== 'draft'));
      }
    };
    updateList();

    // Fetch Top 5 Sellers (cached for 12h)
    getTopSellingProductIds().then(ids => {
      setTopSellerIds(ids);
    });

    // Load available fits
    try {
      const saved = localStorage.getItem('ush_admin_fits');
      if (saved) setAvailableFits(JSON.parse(saved));
    } catch (e) {}

    window.addEventListener('ush_products_updated', updateList);
    window.addEventListener('ush_fits_updated', () => {
      try {
        const saved = localStorage.getItem('ush_admin_fits');
        if (saved) setAvailableFits(JSON.parse(saved));
      } catch (e) {}
    });

    return () => {
      window.removeEventListener('ush_products_updated', updateList);
    };
  }, []);

  const filteredProducts = displayProducts.filter((p) => {
    // Status / hidden filter
    if (p.hidden || p.status === 'draft') return false;

    // Tab filter
    if (activeTab === 'nuevo') {
      if (!p.ribbon?.toLowerCase().includes('nuevo')) return false;
    }
    if (activeTab === 'mas_vendido') {
      const isTop5 = topSellerIds.includes(p.id) || topSellerIds.includes(p.reference);
      const isRibbon = p.ribbon?.toLowerCase().includes('más vendido') || p.ribbon?.toLowerCase().includes('mas vendido') || p.is_best_seller;
      if (!isTop5 && !isRibbon) return false;
    }

    // Fit filter
    if (selectedFit !== 'all') {
      const prodFit = p.fit || 'Wide Leg';
      if (prodFit.toLowerCase() !== selectedFit.toLowerCase()) return false;
    }

    return true;
  });

  return (
    <section id="catalogo" className="py-16 bg-white scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Title */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 pb-6 border-b border-gray-100 gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-[0.25em] text-neutral-500 block mb-1">
              Catálogo de Mezclilla Rígida
            </span>
            <h2 className="text-3xl font-extrabold text-neutral-900 uppercase tracking-tight">
              Nuevas Referencias & Top Ventas
            </h2>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all rounded-none border ${
                activeTab === 'all'
                  ? 'bg-neutral-900 text-white border-neutral-900 shadow-sm'
                  : 'bg-neutral-50 text-neutral-600 border-gray-200 hover:bg-gray-100'
              }`}
            >
              Todos ({displayProducts.length})
            </button>

            <button
              onClick={() => setActiveTab('nuevo')}
              className={`px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all rounded-none border flex items-center gap-1.5 ${
                activeTab === 'nuevo'
                  ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                  : 'bg-neutral-50 text-neutral-600 border-gray-200 hover:bg-gray-100'
              }`}
            >
              <Sparkles size={14} /> Nuevos
            </button>

            <button
              onClick={() => setActiveTab('mas_vendido')}
              className={`px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all rounded-none border flex items-center gap-1.5 ${
                activeTab === 'mas_vendido'
                  ? 'bg-neutral-900 text-white border-neutral-900 shadow-sm'
                  : 'bg-neutral-50 text-neutral-600 border-gray-200 hover:bg-gray-100'
              }`}
            >
              <Flame size={14} className="text-amber-500" /> Más vendidos
            </button>
          </div>
        </div>

        {/* Fit Filter Selector Bar */}
        <div className="mb-8 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-gray-100">
          <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider flex items-center gap-1 mr-2">
            <Tag size={14} className="text-[#d88193]" /> Fit:
          </span>

          <button
            onClick={() => setSelectedFit('all')}
            className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-all border ${
              selectedFit === 'all'
                ? 'bg-[#1b2333] text-white border-[#1b2333]'
                : 'bg-neutral-50 text-neutral-600 border-gray-200 hover:bg-neutral-100'
            }`}
          >
            Todos los Fits
          </button>

          {availableFits.map((fit) => (
            <button
              key={fit}
              onClick={() => setSelectedFit(fit)}
              className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-all border ${
                selectedFit.toLowerCase() === fit.toLowerCase()
                  ? 'bg-[#d88193] text-white border-[#d88193]'
                  : 'bg-neutral-50 text-neutral-600 border-gray-200 hover:bg-neutral-100'
              }`}
            >
              {fit}
            </button>
          ))}
        </div>

        {/* Product Cards Grid */}
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProducts.map((product) => {
              const isTopSeller = topSellerIds.includes(product.id) || topSellerIds.includes(product.reference) || product.is_best_seller;
              return (
                <ProductCard key={product.id} product={product} isTopSeller={isTopSeller} />
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16 bg-neutral-50 border border-dashed border-gray-200">
            <Filter size={32} className="mx-auto text-neutral-400 mb-2" />
            <p className="text-sm font-bold uppercase text-neutral-800">No hay prendas disponibles</p>
            <p className="text-xs text-neutral-500 mt-1">Prueba cambiando los filtros de corte o estado.</p>
          </div>
        )}
      </div>
    </section>
  );
};
