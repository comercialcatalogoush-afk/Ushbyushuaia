'use client';

import React, { useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Sparkles, ArrowRight } from 'lucide-react';
import { Product } from '@/types';
import { isReference2026 } from '@/data/references2026';
import { abbreviateProductName } from '@/lib/productName';
import { getSuggestedPrice, WHOLESALE_FALLBACK } from '@/lib/pricing';

interface NewCollection2026Props {
  products: Product[];
}

export const NewCollection2026: React.FC<NewCollection2026Props> = ({ products }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const products2026 = useMemo(() => {
    return products
      .filter(p => isReference2026(p.reference))
      .sort((a, b) => {
        // Priorizar los que tienen foto
        const aHas = a.images?.length > 0 && a.images[0]?.trim() !== '';
        const bHas = b.images?.length > 0 && b.images[0]?.trim() !== '';
        if (aHas && !bHas) return -1;
        if (!aHas && bHas) return 1;
        return 0;
      });
  }, [products]);

  if (products2026.length === 0) return null;

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const amount = 300;
    scrollRef.current.scrollBy({ left: direction === 'left' ? -amount : amount, behavior: 'smooth' });
  };

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 10);
  };

  return (
    <section className="reveal bg-gradient-to-b from-rose-50/60 via-white to-white py-10 sm:py-14 border-b border-rose-100/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-ush-pink/10 flex items-center justify-center">
              <Sparkles size={18} className="text-ush-pink" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black uppercase tracking-tight text-neutral-900">
                Colección 2026
              </h2>
              <p className="text-[11px] text-neutral-500 font-light tracking-wide">
                {products2026.length} referencias nuevas · Diseños exclusivos
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Flechas scroll */}
            <button
              onClick={() => scroll('left')}
              disabled={!canScrollLeft}
              className="hidden sm:flex w-8 h-8 items-center justify-center rounded-full border border-gray-200 bg-white text-neutral-600 hover:bg-ush-pink hover:text-white hover:border-ush-pink transition disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Anterior"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => scroll('right')}
              disabled={!canScrollRight}
              className="hidden sm:flex w-8 h-8 items-center justify-center rounded-full border border-gray-200 bg-white text-neutral-600 hover:bg-ush-pink hover:text-white hover:border-ush-pink transition disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Siguiente"
            >
              <ChevronRight size={16} />
            </button>

            <Link
              href="/catalogo?coleccion=2026"
              className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-ush-pink hover:text-ush-navy transition-colors"
            >
              Ver toda la colección
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>

        {/* Carousel */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex gap-3 sm:gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-2 -mx-1 px-1"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {products2026.map((product) => {
            const hasImages = product.images?.length > 0 && product.images[0]?.trim() !== '';
            const img = hasImages ? product.images[0] : '';
            const suggestedPrice = getSuggestedPrice(product);
            const wholesalePrice = product.price || Math.round(suggestedPrice * WHOLESALE_FALLBACK);
            const discount = suggestedPrice > wholesalePrice
              ? Math.round((1 - wholesalePrice / suggestedPrice) * 100)
              : 0;
            const isTeensTitle = /teens/i.test(`${product.category || ''} ${product.name || ''}`);

            return (
              <Link
                key={product.reference}
                href={`/producto/${product.slug}`}
                className="snap-start flex-shrink-0 w-[160px] sm:w-[200px] group"
              >
                <div className="relative bg-white border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow duration-300">
                  {/* Las etiquetas viven fuera de la foto para no cubrir la prenda. */}
                  <div className="flex min-h-[42px] flex-col items-start gap-1 border-b border-neutral-100 bg-white px-2 py-1.5">
                    <span className="inline-flex items-center gap-1 bg-ush-pink px-2 py-1 text-[8px] font-black uppercase tracking-[0.14em] text-white shadow-[2px_2px_0_#1b2333]">
                      <Sparkles size={9} />
                      Nuevo 2026
                    </span>
                    {discount > 0 && (
                        <span className="inline-flex items-center bg-[#1b2333] px-2 py-1 text-[8px] font-black uppercase tracking-[0.14em] text-white shadow-[2px_2px_0_#d88193]">
                        -{discount}% off
                      </span>
                    )}
                  </div>

                  {/* Imagen */}
                  <div className="relative aspect-[3/4] bg-gray-50 overflow-hidden">
                    {hasImages ? (
                      <img
                        src={img}
                        alt={abbreviateProductName({ name: product.name, fit: product.fit ?? undefined, category: product.category ?? undefined }).short}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-neutral-300 text-xs">
                        Próximamente
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-2.5 space-y-1">
                    <p className="text-[10px] text-neutral-500 font-light truncate">
                      Ref. {product.reference}
                    </p>
                    <p className="text-[11px] sm:text-xs font-bold text-neutral-900 leading-tight line-clamp-2 min-h-[28px]">
                      {isTeensTitle && <span className="mr-1 text-ush-pink" aria-hidden="true">✦</span>}
                      {abbreviateProductName({ name: product.name, fit: product.fit ?? undefined, category: product.category ?? undefined }).short}
                    </p>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-xs font-black text-ush-pink">
                        ${wholesalePrice.toLocaleString('es-CO')}
                      </span>
                      {discount > 0 && (
                        <span className="text-[10px] text-neutral-400 line-through">
                          ${suggestedPrice.toLocaleString('es-CO')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Link móvil */}
        <div className="mt-4 text-center sm:hidden">
          <Link
            href="/catalogo?coleccion=2026"
            className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-ush-pink hover:text-ush-navy transition-colors"
          >
            Ver toda la colección
            <ArrowRight size={13} />
          </Link>
        </div>
      </div>
    </section>
  );
};
