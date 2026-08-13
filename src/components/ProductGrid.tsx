'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Product } from '@/types';
import { ProductCard } from './ProductCard';
import { Flame, ArrowRight, ChevronRight } from 'lucide-react';
import { getLocalProductsOverride, getTopSellingProductIds } from '@/lib/supabase';
import { useVisibleCards } from '@/lib/useVisibleCards';

interface ProductGridProps {
  products: Product[];
}

export const ProductGrid: React.FC<ProductGridProps> = ({ products }) => {
  const [displayProducts, setDisplayProducts] = useState<Product[]>(products);
  const [topSellerIds, setTopSellerIds] = useState<string[]>([]);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [carouselPaused, setCarouselPaused] = useState(false);
  const [hoverZone, setHoverZone] = useState<'left' | 'right' | null>(null);
  const visibleCards = useVisibleCards();

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

  // ── Carrusel responsivo: tarjetas por vista según dispositivo ──
  const maxCarouselIndex = Math.max(0, bestSellers.length - visibleCards);

  // Ajusta el índice si quedó fuera de rango al cambiar de dispositivo
  useEffect(() => {
    setCarouselIndex((prev) => Math.min(prev, Math.max(0, bestSellers.length - visibleCards)));
  }, [visibleCards, bestSellers.length]);

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

  const slideWidth = 100 / visibleCards;

  return (
    <>
      {/* ── SECCIÓN MÁS VENDIDOS (carrusel compacto y responsivo) ── */}
      {bestSellers.length > 0 && (
        <section id="mas-vendidas" className="reveal scroll-mt-20 bg-gradient-to-b from-[#fdf3f5] via-[#fff8fa] to-white border-b border-rose-100 relative overflow-hidden">
          {/* Decorative blobs */}
          <div className="pointer-events-none absolute -top-20 -left-20 w-56 h-56 bg-[#d88193]/10 rounded-full blur-3xl animate-pulse-soft" />
          <div className="pointer-events-none absolute -bottom-24 -right-16 w-64 h-64 bg-amber-200/20 rounded-full blur-3xl animate-pulse-soft" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 relative">
            {/* Section Title */}
            <div className="flex flex-col items-center text-center mb-5 animate-fadeInUp">
              <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-[#1b2333] flex flex-wrap items-center justify-center gap-2.5">
                <Flame size={22} className="text-[#d88193] animate-float" />
                <span>Más</span>
                <span className="relative text-gradient-pink animate-pulse-soft">
                  Vendidos
                  <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#d88193] to-transparent" />
                </span>
              </h2>
              <div className="mt-3 h-0.5 w-24 bg-gradient-to-r from-transparent via-[#d88193] to-transparent animate-pulse-soft" />
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
                className="absolute left-0 top-0 bottom-0 w-[10%] min-w-[36px] z-20 group focus:outline-none cursor-w-resize"
              >
                <span className={`absolute left-0 top-0 bottom-0 w-full bg-gradient-to-r from-[#1b2333]/15 to-transparent transition-opacity duration-300 ${hoverZone === 'left' ? 'opacity-100' : 'opacity-0'}`} />
              </button>

              {/* Carousel Track — tarjetas por vista según dispositivo */}
              <div className="overflow-hidden px-0.5 sm:px-1">
                <div
                  className="flex transition-transform duration-700 ease-out"
                  style={{ transform: `translateX(-${carouselIndex * slideWidth}%)` }}
                >
                  {bestSellers.map((product, i) => (
                    <div
                      key={product.id}
                      className="w-full shrink-0 px-1.5 sm:px-2.5 animate-fadeInUp"
                      style={{ width: `${slideWidth}%` }}
                    >
                      <ProductCard
                        product={product}
                        isTopSeller
                        compact
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
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
                className="absolute right-0 top-0 bottom-0 w-[10%] min-w-[36px] z-20 group focus:outline-none cursor-e-resize"
              >
                <span className={`absolute right-0 top-0 bottom-0 w-full bg-gradient-to-l from-[#1b2333]/15 to-transparent transition-opacity duration-300 ${hoverZone === 'right' ? 'opacity-100' : 'opacity-0'}`} />
              </button>
            </div>

            {/* Dots + swipe hint */}
            {maxCarouselIndex > 0 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <span className="text-[9px] font-bold uppercase tracking-widest text-neutral-400 mr-1 hidden sm:inline">
                  <ArrowRight size={12} className="inline mr-1 -rotate-180" /> Desliza a los bordes
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
            <div className="mt-8 text-center">
              <Link
                href="/catalogo"
                className="inline-flex items-center gap-2 bg-[#1b2333] text-white text-xs font-bold uppercase tracking-widest px-8 py-3.5 hover:bg-[#d88193] transition-colors shadow-md group"
              >
                <span>Ver Catálogo Completo ({visibleProducts.length} refs)</span>
                <ChevronRight size={15} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </section>
      )}
    </>
  );
};