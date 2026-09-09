'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Check, ChevronLeft, ChevronRight, Layers3, ShoppingBag, Sparkles, Truck } from 'lucide-react';
import { Product } from '@/types';
import { useCart } from '@/context/CartContext';
import { getGoogleDriveImageUrl } from '@/lib/drive';
import { useCatalogSync } from '@/lib/useCatalogSync';
import { useVisibleCards } from '@/lib/useVisibleCards';

type PackGroup = 'jeans' | 'faldas';

interface PackDefinition {
  id: string;
  label: string;
  title: string;
  copy: string;
  refs: string[];
}

const PACK_GROUPS: Record<PackGroup, { label: string; subtitle: string; packs: PackDefinition[] }> = {
  jeans: {
    label: 'Jeans y pantalones',
    subtitle: 'Tres selecciones de 12 referencias para surtir tu tienda con cortes que se venden.',
    packs: [
      {
        id: 'jeans-arranque',
        label: 'Arranque',
        title: 'Pack Arranque',
        copy: 'Una vitrina completa para comenzar a vender desde el primer día, sin llenar tu tienda de prendas que se quedan colgadas.',
        refs: ['552698', '552697', '552746', '552869', '552871', '552874', '552868', '552872', '552870', '552744', '552782', '552862'],
      },
      {
        id: 'jeans-rotacion',
        label: 'Rotación',
        title: 'Pack Rotación',
        copy: 'Cortes que entran, se prueban y salen. Variedad real para vender más combinaciones y recuperar la inversión.',
        refs: ['552873', '552875', '552821', '552814', '552721', '552637', '552642', '552813', '552758', '552724', '552715', '552778'],
      },
      {
        id: 'jeans-premium',
        label: 'Premium',
        title: 'Pack Premium',
        copy: 'Siluetas con presencia y acabados que hacen que tu tienda se vea más costosa desde la primera mirada.',
        refs: ['552717', '552829', '552716', '552828', '552816', '552839', '552750', '552780', '552865', '552773', '552809', '552770'],
      },
    ],
  },
  faldas: {
    label: 'Faldas y shorts',
    subtitle: 'Tres selecciones de 12 referencias para crear looks completos y provocar compras adicionales.',
    packs: [
      {
        id: 'faldas-entrada',
        label: 'Entrada',
        title: 'Pack Entrada',
        copy: 'Precios atractivos, prendas fáciles de combinar y una inversión pensada para comenzar a mover inventario.',
        refs: ['556231', '556115', '556206', '556214', '558069', '556235', '556218', '556282', '556219', '556209', '558065', '556289'],
      },
      {
        id: 'faldas-rotacion',
        label: 'Rotación',
        title: 'Pack Rotación',
        copy: 'Prendas pequeñas, ventas rápidas. Renueva tu vitrina con referencias que combinan con todo.',
        refs: ['556287', '556291', '556240', '556172', '556286', '556280', '556288', '556290', '556242', '556292', '556283', '558075'],
      },
      {
        id: 'faldas-impacto',
        label: 'Impacto visual',
        title: 'Pack Impacto Visual',
        copy: 'Más color, más variedad y más razones para que la clienta se detenga, mire y pregunte.',
        refs: ['558077', '558079', '558071', '558070', '556284', '556217', '556216', '556230', '556174', '558068', '558063', '558066'],
      },
    ],
  },
};

function formatCOP(value: number) {
  return `$${Math.round(value).toLocaleString('es-CO')}`;
}

function firstAvailableSize(product: Product) {
  const stockSizes = Object.entries(product.stock_by_size || {})
    .filter(([, quantity]) => Number(quantity) > 0)
    .map(([size]) => size)
    .sort((a, b) => Number(a) - Number(b));
  return stockSizes[0] || product.options?.find((option) => /talla/i.test(option.key))?.values[0] || undefined;
}

export function HomePacksCarousel({ products }: { products: Product[] }) {
  const syncedProducts = useCatalogSync(products);
  const { addToCart, setIsCartOpen } = useCart();
  const visibleCards = useVisibleCards();
  const [group, setGroup] = useState<PackGroup>('jeans');
  const [packIndex, setPackIndex] = useState(0);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [addedMessage, setAddedMessage] = useState('');

  const activeProducts = useMemo(
    () => syncedProducts.filter((product) => !product.hidden && product.status !== 'draft'),
    [syncedProducts],
  );
  const productsByReference = useMemo(
    () => new Map(activeProducts.map((product) => [String(product.reference), product])),
    [activeProducts],
  );
  const packs = PACK_GROUPS[group].packs;
  const pack = packs[packIndex] || packs[0];
  const packProducts = useMemo(
    () => pack.refs.map((ref) => productsByReference.get(ref)).filter((product): product is Product => Boolean(product)),
    [pack, productsByReference],
  );
  const missingRefs = pack.refs.filter((ref) => !productsByReference.has(ref));
  const total = packProducts.reduce((sum, product) => sum + (product.price || product.suggested_price || 0), 0);
  const maxCarouselIndex = Math.max(0, packProducts.length - visibleCards);
  const slideWidth = 100 / visibleCards;

  useEffect(() => {
    setPackIndex(0);
    setCarouselIndex(0);
    setAddedMessage('');
  }, [group]);

  useEffect(() => {
    setCarouselIndex((current) => Math.min(current, maxCarouselIndex));
  }, [maxCarouselIndex]);

  useEffect(() => {
    if (paused || maxCarouselIndex <= 0) return;
    const timer = window.setInterval(() => {
      setCarouselIndex((current) => (current >= maxCarouselIndex ? 0 : current + 1));
    }, 4500);
    return () => window.clearInterval(timer);
  }, [maxCarouselIndex, paused, pack.id]);

  const addPackToCart = () => {
    if (missingRefs.length > 0 || packProducts.length !== 12) return;
    packProducts.forEach((product) => {
      addToCart(product, firstAvailableSize(product), product.color || undefined, 1);
    });
    setAddedMessage('¡Las 12 referencias fueron agregadas individualmente a tu carrito!');
    setIsCartOpen(true);
    window.setTimeout(() => setAddedMessage(''), 5000);
  };

  if (!packProducts.length) return null;

  return (
    <section
      className="relative overflow-hidden border-y border-rose-100 bg-gradient-to-br from-[#1b2333] via-[#242c3e] to-[#3a2732] text-white"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-labelledby="packs-home-title"
    >
      <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-[#d88193]/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-28 -right-16 h-80 w-80 rounded-full bg-amber-200/10 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 sm:py-12">
        <div className="mx-auto max-w-3xl text-center animate-fadeInUp">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-rose-200/30 bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-rose-100">
            <Sparkles size={13} className="text-[#f3b3c0]" /> Selección mayorista USH
          </div>
          <h2 id="packs-home-title" className="text-2xl font-black uppercase tracking-tight sm:text-4xl">
            Arma tu inventario con 12 referencias
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-xs leading-relaxed text-white/70 sm:text-sm">
            Elige una sola selección, agrega las 12 prendas al carrito y empieza a vender con una vitrina completa.
          </p>
        </div>

        <div className="mx-auto mt-7 flex max-w-xl rounded-xl border border-white/10 bg-black/20 p-1.5">
          {(Object.keys(PACK_GROUPS) as PackGroup[]).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setGroup(key)}
              className={`flex-1 rounded-lg px-3 py-3 text-[10px] font-black uppercase tracking-wider transition-all sm:text-xs ${group === key ? 'bg-[#d88193] text-white shadow-lg' : 'text-white/60 hover:bg-white/10 hover:text-white'}`}
            >
              {PACK_GROUPS[key].label}
            </button>
          ))}
        </div>

        <div className="mt-4 text-center text-[11px] text-white/60">{PACK_GROUPS[group].subtitle}</div>

        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {packs.map((option, index) => (
            <button
              key={option.id}
              type="button"
              onClick={() => { setPackIndex(index); setCarouselIndex(0); setAddedMessage(''); }}
              className={`rounded-full border px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all ${packIndex === index ? 'border-white bg-white text-[#1b2333]' : 'border-white/25 text-white/70 hover:border-white hover:text-white'}`}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="mt-7 grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-center">
          <div className="min-w-0">
            <div className="mb-4 flex items-end justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#f3b3c0]">{pack.label}</p>
                <h3 className="mt-1 text-xl font-black uppercase sm:text-2xl">{pack.title}</h3>
                <p className="mt-1 max-w-xl text-xs leading-relaxed text-white/65">{pack.copy}</p>
              </div>
              <div className="hidden shrink-0 items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-white/50 sm:flex">
                <Layers3 size={14} /> 12 referencias
              </div>
            </div>

            <div className="relative">
              <button type="button" onClick={() => setCarouselIndex((current) => current <= 0 ? maxCarouselIndex : current - 1)} aria-label="Referencias anteriores" className="absolute left-1 top-1/2 z-10 -translate-y-1/2 rounded-full border border-white/20 bg-[#1b2333]/80 p-2 text-white shadow-lg transition hover:bg-[#d88193]"><ChevronLeft size={17} /></button>
              <div className="overflow-hidden px-7 sm:px-8">
                <div className="flex transition-transform duration-700 ease-out" style={{ transform: `translateX(-${carouselIndex * slideWidth}%)` }}>
                  {packProducts.map((product) => {
                    const image = getGoogleDriveImageUrl(product.images?.[0] || '');
                    const price = product.price || product.suggested_price || 0;
                    return (
                      <div key={product.id} className="w-full shrink-0 px-1.5 sm:px-2" style={{ width: `${slideWidth}%` }}>
                        <Link href={`/producto/${product.slug}`} className="group block overflow-hidden rounded-xl border border-white/10 bg-white/10 backdrop-blur-sm transition hover:-translate-y-1 hover:border-rose-200/70 hover:bg-white/15">
                          <div className="relative aspect-[3/4] overflow-hidden bg-white/10">
                            {image ? <img src={image} alt={product.name} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" /> : <div className="flex h-full items-center justify-center text-xs text-white/50">Imagen pendiente</div>}
                            <span className="absolute left-2 top-2 rounded-full bg-[#1b2333]/85 px-2 py-1 text-[9px] font-black tracking-wider text-white">REF {product.reference}</span>
                          </div>
                          <div className="p-3">
                            <p className="line-clamp-2 min-h-8 text-[10px] font-black uppercase leading-tight text-white">{product.name}</p>
                            <p className="mt-2 text-sm font-black text-rose-100">{formatCOP(price)}</p>
                          </div>
                        </Link>
                      </div>
                    );
                  })}
                </div>
              </div>
              <button type="button" onClick={() => setCarouselIndex((current) => current >= maxCarouselIndex ? 0 : current + 1)} aria-label="Siguientes referencias" className="absolute right-1 top-1/2 z-10 -translate-y-1/2 rounded-full border border-white/20 bg-[#1b2333]/80 p-2 text-white shadow-lg transition hover:bg-[#d88193]"><ChevronRight size={17} /></button>
            </div>
            {maxCarouselIndex > 0 && <div className="mt-4 flex justify-center gap-1.5">{Array.from({ length: maxCarouselIndex + 1 }).map((_, index) => <button key={index} type="button" onClick={() => setCarouselIndex(index)} aria-label={`Ver grupo ${index + 1}`} className={`h-1.5 rounded-full transition-all ${index === carouselIndex ? 'w-7 bg-[#f3b3c0]' : 'w-1.5 bg-white/30 hover:bg-white/60'}`} />)}</div>}
          </div>

          <aside className="rounded-2xl border border-white/15 bg-white/10 p-5 shadow-2xl backdrop-blur-sm animate-fadeInUp">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-rose-100"><Truck size={15} /> Compra por selección</div>
            <p className="mt-4 text-xs leading-relaxed text-white/70">Las prendas se agregan individualmente. En el carrito verás las 12 referencias separadas para elegir tallas y confirmar tu pedido.</p>
            <div className="mt-5 flex items-end justify-between border-t border-white/10 pt-4"><span className="text-[10px] font-bold uppercase tracking-wider text-white/55">Total estimado</span><strong className="text-2xl font-black text-white">{formatCOP(total)}</strong></div>
            {missingRefs.length > 0 ? <p className="mt-3 rounded-lg bg-amber-100/15 p-2 text-[10px] leading-relaxed text-amber-100">Faltan temporalmente {missingRefs.length} referencias en el catálogo. Este pack se habilitará cuando estén disponibles.</p> : <p className="mt-3 flex items-center gap-1.5 text-[10px] font-bold text-emerald-200"><Check size={14} /> 12 referencias disponibles</p>}
            <button type="button" onClick={addPackToCart} disabled={missingRefs.length > 0 || packProducts.length !== 12} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#d88193] px-4 py-3.5 text-[11px] font-black uppercase tracking-widest text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-[#c06579] disabled:cursor-not-allowed disabled:opacity-40"><ShoppingBag size={16} /> Agregar las 12 al carrito</button>
            {addedMessage && <p className="mt-3 text-center text-[10px] font-bold leading-relaxed text-emerald-200">{addedMessage}</p>}
          </aside>
        </div>
      </div>
    </section>
  );
}
