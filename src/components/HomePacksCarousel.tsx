'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Check, ChevronLeft, ChevronRight, Layers3, Ruler, ShoppingBag, Sparkles, Truck, X } from 'lucide-react';
import { Product } from '@/types';
import { useCart } from '@/context/CartContext';
import { getGoogleDriveImageUrl } from '@/lib/drive';
import { useCatalogSync } from '@/lib/useCatalogSync';
import { useVisibleCards } from '@/lib/useVisibleCards';
import { SizeGuideModal } from '@/components/SizeGuideModal';

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

const STANDARD_SIZES = ['6', '8', '10', '12', '14'];

function availableSizes(product: Product) {
  const option = product.options?.find((item) => /talla/i.test(item.key));
  if (product.in_stock === false) return [];
  return Array.from(new Set([...(option?.values || []), ...STANDARD_SIZES]))
    .map((size) => size.trim())
    .filter(Boolean)
    .filter((size) => (product.stock_by_size || {})[size] !== 0);
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
  const [sizePickerOpen, setSizePickerOpen] = useState(false);
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);
  const [selectedPackSizes, setSelectedPackSizes] = useState<Record<string, string>>({});

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
  const unavailableSelection = packProducts.some((product) => {
    const selected = selectedPackSizes[product.id];
    return !selected || product.in_stock === false || (product.stock_by_size || {})[selected] === 0;
  });
  const total = packProducts.reduce((sum, product) => sum + (product.price || product.suggested_price || 0), 0);
  const maxCarouselIndex = Math.max(0, packProducts.length - visibleCards);
  const slideWidth = 100 / visibleCards;

  useEffect(() => {
    setPackIndex(0);
    setCarouselIndex(0);
    setAddedMessage('');
    setSizePickerOpen(false);
  }, [group]);

  useEffect(() => {
    const defaults: Record<string, string> = {};
    packProducts.forEach((product) => {
      defaults[product.id] = firstAvailableSize(product) || availableSizes(product)[0] || '10';
    });
    setSelectedPackSizes(defaults);
  }, [pack.id, packProducts]);

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
    if (missingRefs.length > 0 || packProducts.length !== 12 || unavailableSelection) return;
    packProducts.forEach((product) => {
      addToCart(product, selectedPackSizes[product.id], product.color || undefined, 1);
    });
    setSizePickerOpen(false);
    setAddedMessage('¡Las 12 referencias fueron agregadas individualmente a tu carrito!');
    setIsCartOpen(true);
    window.setTimeout(() => setAddedMessage(''), 5000);
  };

  if (!packProducts.length) return null;

  return (
    <>
      <SizeGuideModal isOpen={sizeGuideOpen} onClose={() => setSizeGuideOpen(false)} />

      {sizePickerOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-white/80 p-4 backdrop-blur-sm animate-fadeIn">
          <div className="my-6 w-full max-w-3xl overflow-hidden rounded-2xl border border-neutral-200 bg-white text-[#1b2333] shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-rose-100 bg-[#fff8f9] p-5 text-[#1b2333] sm:p-6">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#b5586c]">Personaliza tu selección</p>
                <h3 className="mt-1 text-xl font-black uppercase sm:text-2xl">Escoge una talla por referencia</h3>
                <p className="mt-2 max-w-xl text-xs leading-relaxed text-neutral-600">Cada prenda se agregará por separado al carrito con la talla que elijas. Puedes cambiar la selección antes de confirmar.</p>
              </div>
              <button type="button" onClick={() => setSizePickerOpen(false)} aria-label="Cerrar selección de tallas" className="rounded-full p-2 text-neutral-500 transition hover:bg-white hover:text-[#b5586c]"><X size={20} /></button>
            </div>

            <div className="max-h-[65vh] overflow-y-auto p-4 sm:p-6">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-100 bg-[#fff8f9] p-3">
                <p className="text-xs font-bold text-[#1b2333]">{pack.title} · {packProducts.length} de 12 referencias disponibles</p>
                <button type="button" onClick={() => setSizeGuideOpen(true)} className="inline-flex items-center gap-1.5 rounded-full border border-[#d88193] px-3 py-2 text-[10px] font-black uppercase tracking-wider text-[#b5586c] transition hover:bg-[#d88193] hover:text-white"><Ruler size={13} /> Ver tabla de tallas</button>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                {packProducts.map((product) => {
                  const sizes = availableSizes(product);
                  const selected = selectedPackSizes[product.id] || '';
                  return (
                    <div key={product.id} className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-white p-2.5 transition hover:border-[#d88193]">
                      <img src={getGoogleDriveImageUrl(product.images?.[0] || '')} alt="" className="h-16 w-12 shrink-0 rounded-lg object-cover" />
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-black uppercase text-[#1b2333]">Ref. {product.reference}</p>
                        <p className="truncate text-[10px] text-neutral-500">{product.name}</p>
                        <div className="mt-2">
                          <p className="text-[9px] font-bold uppercase tracking-wide text-neutral-500">Talla seleccionada: <span className="text-[#b5586c]">{selected || '—'}</span></p>
                          {sizes.length > 0 ? (
                            <div className="mt-1 flex flex-wrap gap-1" role="radiogroup" aria-label={`Tallas disponibles de la referencia ${product.reference}`}>
                              {sizes.map((size) => (
                                <button
                                  key={size}
                                  type="button"
                                  role="radio"
                                  aria-checked={selected === size}
                                  onClick={() => setSelectedPackSizes((current) => ({ ...current, [product.id]: size }))}
                                  className={`min-w-8 rounded border px-2 py-1 text-[10px] font-black transition ${selected === size ? 'border-[#d88193] bg-[#d88193] text-white' : 'border-neutral-200 bg-white text-[#1b2333] hover:border-[#d88193]'}`}
                                >
                                  {size}
                                </button>
                              ))}
                            </div>
                          ) : <p className="mt-1 text-[9px] text-red-500">Sin tallas disponibles</p>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col-reverse gap-2 border-t border-neutral-100 bg-neutral-50 p-4 sm:flex-row sm:justify-end sm:p-5">
              <button type="button" onClick={() => setSizePickerOpen(false)} className="rounded-xl border border-neutral-300 px-5 py-3 text-[10px] font-black uppercase tracking-widest text-neutral-600 transition hover:bg-white">Seguir mirando</button>
              <button type="button" onClick={addPackToCart} disabled={packProducts.length !== 12 || missingRefs.length > 0 || unavailableSelection} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#d88193] px-5 py-3 text-[10px] font-black uppercase tracking-widest text-white shadow-md transition hover:bg-[#c06579] disabled:cursor-not-allowed disabled:opacity-40"><ShoppingBag size={15} /> Agregar selección al carrito</button>
            </div>
          </div>
        </div>
      )}

      <section
      className="relative overflow-hidden border-y border-neutral-100 bg-white text-[#1b2333]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-labelledby="packs-home-title"
    >
      <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-[#d88193]/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-28 -right-16 h-80 w-80 rounded-full bg-[#1b2333]/5 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 sm:py-12">
        <div className="mx-auto max-w-3xl text-center animate-fadeInUp">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#d88193]/30 bg-[#fff1f4] px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-[#b5586c]">
            <Sparkles size={13} className="text-[#d88193]" /> Selección mayorista USH
          </div>
          <h2 id="packs-home-title" className="text-2xl font-black uppercase tracking-tight sm:text-4xl">
            Arma tu inventario con 12 referencias
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-xs leading-relaxed text-neutral-600 sm:text-sm">
            Elige una sola selección, agrega las 12 prendas al carrito y empieza a vender con una vitrina completa.
          </p>
        </div>

        <div className="mx-auto mt-7 flex max-w-xl rounded-xl border border-neutral-200 bg-neutral-50 p-1.5 shadow-sm">
          {(Object.keys(PACK_GROUPS) as PackGroup[]).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setGroup(key)}
              className={`flex-1 rounded-lg px-3 py-3 text-[10px] font-black uppercase tracking-wider transition-all sm:text-xs ${group === key ? 'bg-[#d88193] text-white shadow-lg' : 'text-[#1b2333] hover:bg-white hover:text-[#b5586c]'}`}
            >
              {PACK_GROUPS[key].label}
            </button>
          ))}
        </div>

        <div className="mt-4 text-center text-[11px] leading-relaxed text-neutral-600">{PACK_GROUPS[group].subtitle}</div>

        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {packs.map((option, index) => (
            <button
              key={option.id}
              type="button"
              onClick={() => { setPackIndex(index); setCarouselIndex(0); setAddedMessage(''); }}
              className={`rounded-full border px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all ${packIndex === index ? 'border-[#1b2333] bg-[#1b2333] text-white shadow-md' : 'border-neutral-300 text-neutral-600 hover:border-[#d88193] hover:text-[#b5586c]'}`}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="mt-7 grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-center">
          <div className="min-w-0">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#b5586c]">{pack.label}</p>
                <h3 className="mt-1 break-words text-xl font-black uppercase leading-tight sm:text-2xl">{pack.title}</h3>
                <p className="mt-1 max-w-xl break-words text-xs leading-relaxed text-neutral-600">{pack.copy}</p>
              </div>
              <div className="flex shrink-0 items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                <Layers3 size={14} /> 12 referencias
              </div>
            </div>

            <div className="relative">
              <button type="button" onClick={() => setCarouselIndex((current) => current <= 0 ? maxCarouselIndex : current - 1)} aria-label="Referencias anteriores" className="absolute left-1 top-1/2 z-10 -translate-y-1/2 rounded-full border border-neutral-200 bg-white p-2 text-[#1b2333] shadow-md transition hover:border-[#d88193] hover:bg-[#fff1f4] hover:text-[#b5586c]"><ChevronLeft size={17} /></button>
              <div className="overflow-hidden px-7 sm:px-8">
                <div className="flex transition-transform duration-700 ease-out" style={{ transform: `translateX(-${carouselIndex * slideWidth}%)` }}>
                  {packProducts.map((product) => {
                    const image = getGoogleDriveImageUrl(product.images?.[0] || '');
                    const price = product.price || product.suggested_price || 0;
                    const discountPercent = product.suggested_price > price
                      ? Math.round((1 - price / product.suggested_price) * 100)
                      : 0;
                    return (
                      <div key={product.id} className="w-full shrink-0 px-1.5 sm:px-2" style={{ width: `${slideWidth}%` }}>
                        <Link href={`/producto/${product.slug}`} className="group block overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm transition hover:-translate-y-1 hover:border-[#d88193] hover:shadow-lg">
                          <div className="relative aspect-[3/4] overflow-hidden bg-neutral-100">
                            {discountPercent > 0 && <span className="absolute right-2 top-2 z-10 bg-[#ff4e00] px-2.5 py-1 text-[10px] font-medium uppercase tracking-normal text-white">- {discountPercent}%</span>}
                            {image ? <img src={image} alt={product.name} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" /> : <div className="flex h-full items-center justify-center text-xs text-neutral-400">Imagen pendiente</div>}
                            <span className="absolute left-2 top-2 rounded-full bg-[#1b2333]/90 px-2 py-1 text-[9px] font-black tracking-wider text-white">REF {product.reference}</span>
                          </div>
                          <div className="p-3">
                            <p className="line-clamp-2 min-h-8 text-[10px] font-black uppercase leading-tight text-[#1b2333]">{product.name}</p>
                            <div className="mt-2 flex items-center justify-between gap-2">
                              <p className="text-sm font-black text-[#b5586c]">{formatCOP(price)}</p>
                            </div>
                          </div>
                        </Link>
                      </div>
                    );
                  })}
                </div>
              </div>
              <button type="button" onClick={() => setCarouselIndex((current) => current >= maxCarouselIndex ? 0 : current + 1)} aria-label="Siguientes referencias" className="absolute right-1 top-1/2 z-10 -translate-y-1/2 rounded-full border border-neutral-200 bg-white p-2 text-[#1b2333] shadow-md transition hover:border-[#d88193] hover:bg-[#fff1f4] hover:text-[#b5586c]"><ChevronRight size={17} /></button>
            </div>
            {maxCarouselIndex > 0 && <div className="mt-4 flex justify-center gap-1.5">{Array.from({ length: maxCarouselIndex + 1 }).map((_, index) => <button key={index} type="button" onClick={() => setCarouselIndex(index)} aria-label={`Ver grupo ${index + 1}`} className={`h-1.5 rounded-full transition-all ${index === carouselIndex ? 'w-7 bg-[#d88193]' : 'w-1.5 bg-neutral-300 hover:bg-[#d88193]/60'}`} />)}</div>}
          </div>

            <aside className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-md animate-fadeInUp">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-[#b5586c]"><Truck size={15} /> Compra por selección</div>
            <p className="mt-4 text-xs leading-relaxed text-neutral-600">Las prendas se agregan individualmente. En el carrito verás las 12 referencias separadas para elegir tallas y confirmar tu pedido.</p>
            <div className="mt-5 flex items-end justify-between border-t border-neutral-100 pt-4"><span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Total estimado</span><strong className="text-2xl font-black text-[#1b2333]">{formatCOP(total)}</strong></div>
            {missingRefs.length > 0 ? <p className="mt-3 rounded-lg bg-amber-50 p-2 text-[10px] leading-relaxed text-amber-700">Faltan temporalmente {missingRefs.length} referencias en el catálogo. Este pack se habilitará cuando estén disponibles.</p> : <p className="mt-3 flex items-center gap-1.5 text-[10px] font-bold text-emerald-700"><Check size={14} /> 12 referencias disponibles</p>}
            <button type="button" onClick={() => setSizePickerOpen(true)} disabled={missingRefs.length > 0 || packProducts.length !== 12} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#d88193] px-4 py-3.5 text-[11px] font-black uppercase tracking-widest text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-[#c06579] disabled:cursor-not-allowed disabled:opacity-40"><Ruler size={16} /> Elegir tallas y agregar</button>
            {addedMessage && <p className="mt-3 text-center text-[10px] font-bold leading-relaxed text-emerald-700">{addedMessage}</p>}
          </aside>
        </div>
      </div>
      </section>
    </>
  );
}
