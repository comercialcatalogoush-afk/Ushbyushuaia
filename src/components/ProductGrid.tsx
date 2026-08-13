'use client';

import React, { useState, useEffect } from 'react';
import { Product } from '@/types';
import { ProductCard } from './ProductCard';
import { Flame, ChevronRight, Sparkles } from 'lucide-react';
import { getLocalProductsOverride, getTopSellingProductIds } from '@/lib/supabase';

interface ProductGridProps {
  products: Product[];
}

const PAGE_SIZE = 12;

export const ProductGrid: React.FC<ProductGridProps> = ({ products }) => {
  const [displayProducts, setDisplayProducts] = useState<Product[]>(products);
  const [topSellerIds, setTopSellerIds] = useState<string[]>([]);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

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

  const isTopSeller = (p: Product): boolean =>
    topSellerIds.includes(p.id) ||
    topSellerIds.includes(p.reference) ||
    p.is_best_seller === true;

  // Public grid: only products with at least one valid image
  const visibleProducts = displayProducts.filter(
    (p) => p.images && p.images.length > 0 && p.images[0] && p.images[0].trim() !== ''
  );

  // Best sellers highlighted with animation
  const bestSellers = visibleProducts.filter(isTopSeller).slice(0, 8);
  const regularProducts = visibleProducts.filter((p) => !bestSellers.includes(p));

  const paginatedProducts = regularProducts.slice(0, visibleCount);
  const hasMore = visibleCount < regularProducts.length;

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + PAGE_SIZE);
  };

  return (
    <section id="catalogo" className="scroll-mt-20">
      {/* ── HERO DE MÁS VENDIDOS ── */}
      {bestSellers.length > 0 && (
        <div className="relative overflow-hidden bg-[#1b2333]">
          {/* Ambient decorative glows */}
          <div className="absolute -top-24 -left-24 w-72 h-72 bg-[#d88193]/20 rounded-full blur-3xl animate-pulse-soft" />
          <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-[#d88193]/10 rounded-full blur-3xl animate-pulse-soft delay-300" />

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
            {/* Section Title */}
            <div className="flex flex-col items-center text-center mb-8 animate-fadeInUp">
              <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.3em] text-[#d88193] mb-3">
                <Flame size={14} className="animate-float" /> Los Favoritos de tu Boutique
              </span>
              <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white flex flex-wrap items-center justify-center gap-3">
                Referencias
                <span className="text-gradient-pink animate-pulse-soft">Más Vendidas</span>
                <Sparkles size={24} className="text-amber-300 animate-float" />
              </h2>
              <div className="mt-3 h-0.5 w-24 bg-gradient-to-r from-transparent via-[#d88193] to-transparent animate-pulse-soft" />
            </div>

            {/* Best Sellers Grid — staggered reveal */}
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {bestSellers.map((product, i) => (
                <div
                  key={product.id}
                  className={`animate-fadeInUp delay-${Math.min((i % 4) * 100 + 100, 500)}`}
                >
                  <ProductCard key={`${product.id}-top`} product={product} isTopSeller />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Catálogo Completo ── */}
      <div className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Result count header */}
          <div className="flex items-center justify-between mb-8 animate-fadeInUp">
            <div>
              <h2 className="text-xl font-black text-[#1b2333] uppercase tracking-tight">
                Catálogo Completo
              </h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                {regularProducts.length} referencias disponibles
                {regularProducts.length > visibleCount && ` · Mostrando ${paginatedProducts.length} de ${regularProducts.length}`}
              </p>
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
                    <ProductCard product={product} isTopSeller={isTopSeller(product)} />
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
                    <span>Cargar más ({regularProducts.length - visibleCount} referencias restantes)</span>
                    <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                  <p className="text-[11px] text-neutral-400 mt-3">
                    Mostrando {paginatedProducts.length} de {regularProducts.length} referencias
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-20 bg-neutral-50 border border-dashed border-gray-200">
              <Flame size={36} className="mx-auto text-neutral-300 mb-3" />
              <p className="text-sm font-bold uppercase text-neutral-700">No hay prendas disponibles</p>
              <p className="text-xs text-neutral-400 mt-1">Pronto subiremos las fotos de esta referencia.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
