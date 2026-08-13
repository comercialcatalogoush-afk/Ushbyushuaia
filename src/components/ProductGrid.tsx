'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Product } from '@/types';
import { ProductCard } from './ProductCard';
import { Flame, Sparkles, ArrowRight, ChevronRight } from 'lucide-react';
import { getLocalProductsOverride, getTopSellingProductIds } from '@/lib/supabase';

interface ProductGridProps {
  products: Product[];
}

const CAROUSEL_VISIBLE = 3;

// Animación Ken Burns distinta por producto dentro del carrusel
const KENBURNS = [
  'animate-kenburns-zoom',
  'animate-kenburns-pan-left',
  'animate-kenburns-pan-right',
  'animate-kenburns-tilt',
  'animate-kenburns-float',
];

export const ProductGrid: React.FC<ProductGridProps> = ({ products }) => {
  const [displayProducts, setDisplayProducts] = useState<Product[]>(products);
  const [topSellerIds, setTopSellerIds] = useState<string[]>([]);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [carouselPaused, setCarouselPaused] = useState(false);
  const [hoverZone, setHoverZone] = useState<'left' | 'right' | null>(null);

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

  // ── Carrusel: 3 por vista, navegación por hover en los extremos ──
  const maxCarouselIndex = Math.max(0, bestSellers.length - CAROUSEL_VISIBLE);

  const nextSlide = () => {
    setCarouselIndex((prev) => (prev >= maxCarouselIndex ? 0 : prev + 1));
  };
  const prevSlide = () => {
    setCarouselIndex((prev) => (prev <= 0 ? maxCarouselIndex : prev - 1));
  };

  useEffect(() => {
    if (carouselPaused) return;
    const id = setInterval(() => {
      setCarouselIndex((prev) => (prev >= maxCarouselIndex ? 0 : prev + 1));
    }, 4500);
    return () => clearInterval(id);
  }, [carouselPaused, maxCarouselIndex]);

  return (
    <>
      {/* ── SECCIÓN MÁS VENDIDOS (carrusel con hover zones) ── */}
      {bestSellers.length > 0 && (
        <section id="mas-vendidas" className="scroll-mt-20 bg-gradient-to-b from-[#fdf3f5] via-[#fff8fa] to-white border-b border-rose-100 relative overflow-hidden">
          {/* Decorative blobs */}
          <div className="pointer-events-none absolute -top-20 -left-20 w-72 h-72 bg-[#d88193]/10 rounded-full blur-3xl animate-pulse-soft" />
          <div className="pointer-events-none absolute -bottom-24 -right-16 w-80 h-80 bg-amber-200/20 rounded-full blur-3xl animate-pulse-soft" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 relative">
            {/* Section Title */}
            <div className="flex flex-col items-center text-center mb-10 animate-fadeInUp">
              <span className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.35em] text-[#d88193] mb-3 px-4 py-1.5 border border-[#d88193]/20 bg-white/70 backdrop-blur">
                <Flame size={13} className="animate-float" /> Los Favoritos de tu Boutique
              </span>
              <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-[#1b2333] flex flex-wrap items-center justify-center gap-3">
                Referencias
                <span className="relative text-gradient-pink animate-pulse-soft">
                  Más Vendidas
                  <span className="absolute -bottom-1 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#d88193] to-transparent" />
                </span>
                <Sparkles size={26} className="text-amber-400 animate-float" />
              </h2>
              <div className="mt-4 h-0.5 w-28 bg-gradient-to-r from-transparent via-[#d88193] to-transparent animate-pulse-soft" />
            </div>

            {/* Carousel con zonas hover */}
            <div
              className="relative"
              onMouseEnter={() => setCarouselPaused(true)}
              onMouseLeave={() => setCarouselPaused(false)}
            >
              {/* LEFT HOVER ZONE */}
              <button
                onMouseEnter={() => setHoverZone('left')}
                onMouseLeave={() => setHoverZone(null)}
                onClick={prevSlide}
                aria-label="Anterior"
                className="absolute left-0 top-0 bottom-0 w-[15%] min-w-[48px] z-20 group focus:outline-none cursor-w-resize"
              >
                <span className={`absolute left-0 top-0 bottom-0 w-full bg-gradient-to-r from-[#1b2333]/15 to-transparent transition-opacity duration-300 ${hoverZone === 'left' ? 'opacity-100' : 'opacity-0'}`} />
              </button>

              {/* Carousel Track — 3 visible per view */}
              <div className="overflow-hidden px-1">
                <div
                  className="flex transition-transform duration-700 ease-out"
                  style={{ transform: `translateX(-${carouselIndex * (100 / CAROUSEL_VISIBLE)}%)` }}
                >
                  {bestSellers.map((product, i) => (
                    <div key={product.id} className="w-full sm:w-1/2 lg:w-1/3 shrink-0 px-2 sm:px-3 animate-fadeInUp">
                      <div className="relative group/card">
                        <ProductCard
                          product={product}
                          isTopSeller
                          imageAnimation={KENBURNS[i % KENBURNS.length]}
                        />
                        {/* Number badge */}
                        <span className="absolute -top-2 -left-2 z-10 w-8 h-8 bg-[#d88193] text-white text-xs font-black flex items-center justify-center shadow-lg border-2 border-white">
                          {String(i + 1).padStart(2, '0')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* RIGHT HOVER ZONE */}
              <button
                onMouseEnter={() => setHoverZone('right')}
                onMouseLeave={() => setHoverZone(null)}
                onClick={nextSlide}
                aria-label="Siguiente"
                className="absolute right-0 top-0 bottom-0 w-[15%] min-w-[48px] z-20 group focus:outline-none cursor-e-resize"
              >
                <span className={`absolute right-0 top-0 bottom-0 w-full bg-gradient-to-l from-[#1b2333]/15 to-transparent transition-opacity duration-300 ${hoverZone === 'right' ? 'opacity-100' : 'opacity-0'}`} />
              </button>
            </div>

            {/* Dots + swipe hint */}
            {maxCarouselIndex > 0 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <span className="text-[9px] font-bold uppercase tracking-widest text-neutral-400 mr-1 hidden sm:inline">
                  <ArrowRight size={12} className="inline mr-1 -rotate-180" /> Pasa el cursor a los bordes
                </span>
                {Array.from({ length: maxCarouselIndex + 1 }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCarouselIndex(i)}
                    aria-label={`Ir a la diapositiva ${i + 1}`}
                    className={`h-1.5 rounded-full transition-all ${
                      i === carouselIndex ? 'w-7 bg-[#d88193]' : 'w-1.5 bg-rose-200 hover:bg-rose-300'
                    }`}
                  />
                ))}
              </div>
            )}

            {/* CTA to full catalog */}
            <div className="mt-12 text-center">
              <Link
                href="/catalogo"
                className="inline-flex items-center gap-2 bg-[#1b2333] text-white text-xs font-bold uppercase tracking-widest px-10 py-4 hover:bg-[#d88193] transition-colors shadow-md group"
              >
                <span>Ver Catálogo Completo ({visibleProducts.length} refs)</span>
                <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </section>
      )}
    </>
  );
};