'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ShoppingBag, ArrowLeft, Check, Shield, Truck, Ruler, Film, Sparkles, ChevronDown, ChevronUp, MessageCircle, ZoomIn, BellRing } from 'lucide-react';
import { Product } from '@/types';
import { useCart } from '@/context/CartContext';
import { SizeGuideModal } from '@/components/SizeGuideModal';
import { animateFlyToCart } from '@/lib/flyToCart';
import { getWhatsAppNumber, DEFAULT_WHATSAPP_NUMBER } from '@/lib/siteConfig';
import { subscribeCatalogChanges } from '@/lib/supabase';
import { supabase } from '@/lib/supabase';
import type { CatalogSyncPayload } from '@/lib/supabase';
import { ProductCard } from '@/components/ProductCard';
import { WHOLESALE_FALLBACK, getSuggestedPrice } from '@/lib/pricing';
import { gtagEvent } from '@/lib/analytics';
import { formatVideoUrl } from '@/lib/videoUtils';
import { addCustomerWatch } from '@/lib/customerBenefits';

interface ProductDetailClientProps {
  product: Product;
  related?: Product[];
}

export default function ProductDetailClient({ product, related = [] }: ProductDetailClientProps) {
  const [currentProduct, setCurrentProduct] = useState<Product>(product);

  const { addToCart, formatCOP } = useCart();
  const [selectedImage, setSelectedImage] = useState<string>(currentProduct.images[0] || 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=600');
  
  const sizeOption = currentProduct.options?.find((o) => o.key.toLowerCase() === 'talla');
  // Lista estándar de tallas (orden preferido); también se muestran tallas nuevas no incluidas aquí.
  const allowedSizes = ['6', '8', '10', '12', '14'];

  // Las tallas vienen del producto o de la lista estándar
  const rawSizes = sizeOption?.values && sizeOption.values.length > 0 ? sizeOption.values : allowedSizes;
  // Conserva todas las tallas del producto (sin descartar las no estándar),
  // ordenando primero las estándar y luego el resto.
  const availableSizes = Array.from(new Set(
    [...allowedSizes, ...rawSizes.map((s) => s.trim())]
  ));

  const soldOut = currentProduct.in_stock === false;
  const sizeStockOf = (s: string) => (currentProduct.stock_by_size || {})[s];
  // Por defecto, seleccionar la primera talla que tenga stock disponible
  const defaultSize = availableSizes.find((s) => !soldOut && sizeStockOf(s) !== 0) || availableSizes[0] || '6';
  const [selectedSize, setSelectedSize] = useState<string>(defaultSize);

  // Hay al menos una talla con stock, y se protege el botón Agregar si la talla
  // actualmente seleccionada está agotada.
  const anySizeAvailable = availableSizes.some((s) => !soldOut && sizeStockOf(s) !== 0);
  const selectedSizeSoldOut = soldOut || sizeStockOf(selectedSize) === 0;

  // Solo está agotado si el admin lo marca explícitamente en el editor
  // (ver soldOut definido arriba)

  const colorOption = currentProduct.options?.find((o) => o.key.toLowerCase() === 'color');
  const availableColors = colorOption?.values || (currentProduct.color ? [currentProduct.color] : []);
  const [selectedColor, setSelectedColor] = useState<string>(availableColors[0] || currentProduct.color || '');

  const [quantity, setQuantity] = useState<number>(1);
  const [added, setAdded] = useState(false);
  const [watchSaved, setWatchSaved] = useState(false);
  const [watchLoading, setWatchLoading] = useState(false);
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);

  const suggestedPrice = getSuggestedPrice(currentProduct);
  const wholesalePrice = currentProduct.price || Math.round(suggestedPrice * WHOLESALE_FALLBACK);

  // ── LUPA ESTILO GEF (HOVER LENS INTERACTIVO) ──
  const [isHoverLens, setIsHoverLens] = useState(false);
  const [lensPos, setLensPos] = useState({ x: 0, y: 0, percentX: 0, percentY: 0, fixedLeft: 0, fixedTop: 0 });
  const imageContainerRef = useRef<HTMLDivElement>(null);

  const handleMouseMoveLens = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageContainerRef.current) return;
    const rect = imageContainerRef.current.getBoundingClientRect();
    const lensW = 140;
    const lensH = 175; // Proporción 3:4

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    let x = mouseX - lensW / 2;
    let y = mouseY - lensH / 2;

    x = Math.max(0, Math.min(x, rect.width - lensW));
    y = Math.max(0, Math.min(y, rect.height - lensH));

    const percentX = (x / Math.max(1, rect.width - lensW)) * 100;
    const percentY = (y / Math.max(1, rect.height - lensH)) * 100;

    // Posición fixed de la ventana de zoom: a la derecha del contenedor de imagen
    const fixedLeft = rect.right + 16;
    const fixedTop = Math.max(8, rect.top);

    setLensPos({ x, y, percentX, percentY, fixedLeft, fixedTop });
  };

  // ── CARRUSEL HORIZONTAL TÁCTIL PARA MÓVIL ──
  const [mobileSlideIndex, setMobileSlideIndex] = useState(0);
  const mobileCarouselRef = useRef<HTMLDivElement>(null);

  const handleMobileScroll = () => {
    if (!mobileCarouselRef.current) return;
    const { scrollLeft, clientWidth } = mobileCarouselRef.current;
    if (clientWidth > 0) {
      const idx = Math.round(scrollLeft / clientWidth);
      setMobileSlideIndex(idx);
    }
  };

  const scrollToMobileSlide = (index: number) => {
    if (!mobileCarouselRef.current) return;
    const clientWidth = mobileCarouselRef.current.clientWidth;
    mobileCarouselRef.current.scrollTo({
      left: index * clientWidth,
      behavior: 'smooth',
    });
    setMobileSlideIndex(index);
  };

  const [whatsappNumber, setWhatsappNumber] = useState<string>(DEFAULT_WHATSAPP_NUMBER);

  React.useEffect(() => {
    getWhatsAppNumber().then(setWhatsappNumber);
  }, []);

  // GA4: vista de producto (view_item)
  React.useEffect(() => {
    gtagEvent('view_item', {
      currency: 'COP',
      value: currentProduct.price || 0,
      items: [{
        item_id: currentProduct.reference || currentProduct.slug,
        item_name: currentProduct.name,
        price: currentProduct.price || 0,
      }],
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Realtime: si el admin confirma un pago (o edita el producto), el stock y
  // los datos se actualizan al instante desde Supabase.
  React.useEffect(() => {
    const unsubscribe = subscribeCatalogChanges((payload?: CatalogSyncPayload) => {
      // El timestamp del broadcast evita que el detalle conserve el stock o
      // precio anterior del CDN después de una publicación del admin.
      const syncQuery = payload?.ts ? `&sync=${encodeURIComponent(String(payload.ts))}` : '';
      fetch(`/api/catalog?slug=${encodeURIComponent(currentProduct.slug)}${syncQuery}`, {
        cache: 'no-store',
        headers: payload?.ts ? { 'Cache-Control': 'no-cache' } : undefined,
      })
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error('catalog ' + r.status))))
        .then((fresh: Product) => {
          if (fresh) {
            setCurrentProduct(fresh);
          }
        })
        .catch(() => {});
    });
    return unsubscribe;
  }, [currentProduct.slug]);

  const handleAddToCart = (e: React.MouseEvent) => {
    const mainImgEl = document.querySelector('.aspect-\\[3\\/4\\] img');
    if (mainImgEl) animateFlyToCart(mainImgEl as HTMLElement);
    addToCart(currentProduct, selectedSize, selectedColor || undefined, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleWatchAvailability = async () => {
    setWatchLoading(true);
    setWatchSaved(false);
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      setWatchLoading(false);
      window.location.href = `/profile?mode=register&returnTo=${encodeURIComponent(window.location.pathname)}`;
      return;
    }

    try {
      await addCustomerWatch({
        productId: currentProduct.id,
        reference: currentProduct.reference,
        name: currentProduct.name,
        color: selectedColor || undefined,
        size: selectedSize || undefined,
      });
      setWatchSaved(true);
    } catch (_) {
      // The account page shows the actionable error if Auth is temporarily unavailable.
    } finally {
      setWatchLoading(false);
    }
  };

  return (
    <>
    <div className="py-4 sm:py-8 lg:py-12 pb-24 lg:pb-12 bg-white min-h-screen">
      
      {/* Size Guide Modal */}
      <SizeGuideModal isOpen={isSizeGuideOpen} onClose={() => setIsSizeGuideOpen(false)} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Back Link */}
        <Link
          href="/catalogo"
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-ush-navy hover:text-ush-pink mb-4 sm:mb-6 group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          <span>Volver al Catálogo Mayorista</span>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12 items-start">
          
          {/* Gallery Column */}
          <div className="lg:col-span-7">

            {/* ── 1. GALERÍA MÓVIL (< lg): CARRUSEL HORIZONTAL TÁCTIL (SWIPEABLE LIBRE) ── */}
            <div className="lg:hidden mb-6 relative">
              <div
                ref={mobileCarouselRef}
                onScroll={handleMobileScroll}
                className="flex overflow-x-auto snap-x snap-mandatory scrollbar-none w-full aspect-[3/4] bg-neutral-100 rounded-2xl border border-gray-200 shadow-sm relative"
              >
                {currentProduct.images.map((img, idx) => (
                  <div
                    key={idx}
                    className="w-full h-full shrink-0 snap-center relative aspect-[3/4] overflow-hidden"
                  >
                    {currentProduct.ribbon && idx === 0 && (
                      <span className="absolute top-3 left-3 z-10 text-[11px] font-black uppercase tracking-widest px-3 py-1 bg-ush-pink text-white shadow-md pointer-events-none">
                        {currentProduct.ribbon}
                      </span>
                    )}
                    <Image
                      src={img}
                      alt={`${currentProduct.name} - Vista ${idx + 1}`}
                      fill
                      priority={idx === 0}
                      unoptimized={img.startsWith('http://') || img.startsWith('https://')}
                      quality={100}
                      sizes="100vw"
                      className="object-cover object-center"
                    />
                  </div>
                ))}
              </div>

              {/* Flechas flotantes en móvil para navegar fácilmente */}
              {currentProduct.images.length > 1 && (
                <>
                  {mobileSlideIndex > 0 && (
                    <button
                      type="button"
                      onClick={() => scrollToMobileSlide(mobileSlideIndex - 1)}
                      aria-label="Foto anterior"
                      className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white/90 text-neutral-800 shadow-md flex items-center justify-center border border-gray-200"
                    >
                      <ArrowLeft size={16} />
                    </button>
                  )}
                  {mobileSlideIndex < currentProduct.images.length - 1 && (
                    <button
                      type="button"
                      onClick={() => scrollToMobileSlide(mobileSlideIndex + 1)}
                      aria-label="Foto siguiente"
                      className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white/90 text-neutral-800 shadow-md flex items-center justify-center border border-gray-200"
                    >
                      <ArrowLeft size={16} className="rotate-180" />
                    </button>
                  )}
                </>
              )}

              {/* Dots y contador de fotos en móvil */}
              {currentProduct.images.length > 1 && (
                <div className="flex items-center justify-between px-2 mt-3">
                  <div className="flex items-center gap-1.5">
                    {currentProduct.images.map((_, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => scrollToMobileSlide(idx)}
                        aria-label={`Ver foto ${idx + 1}`}
                        className={`h-1.5 rounded-full transition-all ${
                          mobileSlideIndex === idx
                            ? 'w-6 bg-[#d88193]'
                            : 'w-1.5 bg-neutral-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-[11px] font-black uppercase tracking-wider text-neutral-600 bg-neutral-100 px-2.5 py-0.5 rounded-full border border-neutral-200">
                    {mobileSlideIndex + 1} / {currentProduct.images.length}
                  </span>
                </div>
              )}
            </div>

            {/* ── PANEL RÁPIDO MÓVIL: PRECIO + TALLAS + CARRITO (visible solo en celular, justo debajo de las fotos) ── */}
            <div className="lg:hidden mt-4 mb-2 bg-white border border-gray-200 rounded-2xl shadow-sm p-4 space-y-3">
              {/* Precio mayorista */}
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 block">Precio detal</span>
                  <span className="text-xs font-semibold text-neutral-500 line-through">{formatCOP(suggestedPrice)}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-ush-pink block">Mayorista 12+ uds</span>
                  <span className="text-2xl font-black text-[#1b2333]">{formatCOP(wholesalePrice)}</span>
                </div>
              </div>

              {/* Selector de talla compacto */}
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-600 mb-2 block">
                  Talla: <span className="text-ush-pink">{selectedSize}</span>
                </span>
                <div className="flex flex-wrap gap-2">
                  {availableSizes.map((size) => {
                    const sizeStock = (currentProduct.stock_by_size || {})[size];
                    const sizeSoldOut = soldOut || sizeStock === 0;
                    return (
                      <button
                        key={size}
                        type="button"
                        onClick={() => { setSelectedSize(size); setQuantity(1); }}
                        disabled={sizeSoldOut}
                        className={`relative w-10 h-10 text-xs font-bold uppercase border transition-all flex items-center justify-center rounded-lg ${
                          sizeSoldOut
                            ? 'border-gray-200 text-neutral-300 bg-neutral-100 cursor-not-allowed'
                            : selectedSize === size
                            ? 'border-ush-pink bg-ush-pink text-white shadow-md'
                            : 'border-gray-300 text-neutral-700 hover:border-black bg-white'
                        }`}
                      >
                        {sizeSoldOut ? <span className="line-through text-neutral-300">{size}</span> : size}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Botón agregar al carrito */}
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={selectedSizeSoldOut || !anySizeAvailable}
                className={`w-full py-3.5 px-4 rounded-xl text-sm font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all duration-200 ${
                  selectedSizeSoldOut || !anySizeAvailable
                    ? 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
                    : added
                    ? 'bg-emerald-600 text-white shadow-lg'
                    : 'bg-[#1b2333] text-white hover:bg-ush-pink active:scale-[0.98] shadow-md'
                }`}
              >
                {selectedSizeSoldOut || !anySizeAvailable ? (
                  <span>Agotado</span>
                ) : added ? (
                  <><Check size={16} /><span>¡Agregado al carrito!</span></>
                ) : (
                  <><ShoppingBag size={16} /><span>Agregar al Carrito — Talla {selectedSize}</span></>
                )}
              </button>
            </div>

            {/* ── 2. GALERÍA ESCRITORIO (>= lg): MINIATURAS VERTICALES + LUPA HOVER LENS GEF ── */}
            <div className="hidden lg:flex gap-3 items-start">

              {/* Left Vertical Thumbnail Column */}
              {(currentProduct.images.length > 1 || currentProduct.video_url) && (
                <div className="flex flex-col gap-2 flex-shrink-0 w-[72px]">
                  {currentProduct.images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImage(img)}
                      className={`relative w-[72px] h-[90px] border-2 transition-all overflow-hidden bg-neutral-100 flex-shrink-0 ${
                        selectedImage === img
                          ? 'border-ush-pink shadow-md'
                          : 'border-transparent opacity-60 hover:opacity-100 hover:border-gray-300'
                      }`}
                    >
                      <Image src={img} alt={`Vista ${idx + 1}`} fill unoptimized={img.startsWith('http://') || img.startsWith('https://')} sizes="80px" quality={90} className="object-cover" />
                    </button>
                  ))}

                  {/* Video thumbnail at bottom of column */}
                  {currentProduct.video_url && (
                    <button
                      onClick={() => {
                        document.getElementById('product-video')?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="relative w-[72px] h-[90px] border-2 border-transparent hover:border-gray-300 overflow-hidden bg-neutral-900 flex items-center justify-center flex-shrink-0 opacity-70 hover:opacity-100 transition-all"
                    >
                      <Film size={22} className="text-white" />
                      <span className="absolute bottom-1 text-[9px] text-white font-bold uppercase tracking-wide">Video</span>
                    </button>
                  )}
                </div>
              )}

              {/* Main Preview Image con Lupa Hover Lens estilo GEF */}
              <div
                ref={imageContainerRef}
                className="relative flex-1 max-w-[520px] aspect-[3/4] bg-neutral-100 border border-gray-200 shadow-md min-w-0 mx-auto cursor-crosshair group select-none"
                onMouseEnter={() => setIsHoverLens(true)}
                onMouseLeave={() => setIsHoverLens(false)}
                onMouseMove={handleMouseMoveLens}
              >
                {/* Contenedor con overflow-hidden para la imagen y el recuadro selector */}
                <div className="relative w-full h-full overflow-hidden">
                  {currentProduct.ribbon && (
                    <span className="absolute top-4 left-4 z-10 text-xs font-black uppercase tracking-widest px-3.5 py-1 bg-ush-pink text-white shadow-md pointer-events-none">
                      {currentProduct.ribbon}
                    </span>
                  )}

                  <Image
                    src={selectedImage}
                    alt={currentProduct.name}
                    fill
                    priority
                    unoptimized={selectedImage.startsWith('http://') || selectedImage.startsWith('https://')}
                    quality={100}
                    sizes="(max-width: 1024px) 90vw, 40vw"
                    className="object-cover object-center pointer-events-none"
                  />

                  {/* Recuadro Selector Lens idéntico a GEF */}
                  {isHoverLens && (
                    <div
                      className="hidden lg:block absolute pointer-events-none border border-neutral-600/70 bg-white/20 backdrop-brightness-95 shadow-xs z-20"
                      style={{
                        width: '140px',
                        height: '175px',
                        left: `${lensPos.x}px`,
                        top: `${lensPos.y}px`,
                      }}
                    />
                  )}

                  <span className="absolute bottom-3 right-3 z-10 w-9 h-9 bg-white/90 text-ush-navy shadow-md border border-gray-200 flex items-center justify-center pointer-events-none rounded-md">
                    <ZoomIn size={16} />
                  </span>
                </div>

                {/* Ventana de Zoom Fixed estilo GEF (sale a la derecha de la imagen, fuera del grid) */}
                {isHoverLens && (
                  <div
                    className="hidden lg:block fixed w-[420px] h-[520px] bg-white border border-gray-300 shadow-2xl rounded-xl overflow-hidden z-[9999] pointer-events-none"
                    style={{
                      left: `${lensPos.fixedLeft}px`,
                      top: `${lensPos.fixedTop}px`,
                      backgroundImage: `url(${selectedImage})`,
                      backgroundPosition: `${lensPos.percentX}% ${lensPos.percentY}%`,
                      backgroundSize: '280%',
                      backgroundRepeat: 'no-repeat',
                    }}
                  >
                    <div className="absolute top-3 left-3 bg-neutral-900/80 text-white text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md shadow-sm flex items-center gap-1.5">
                      <span>🔍 Detalle de Tela 2.8x</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ── 3. VIDEO VERTICAL ADAPTADO A MODA (9:16) ── */}
            {(() => {
              const video = formatVideoUrl(currentProduct.video_url);
              if (!video.isSupported || !video.src) return null;
              return (
                <div id="product-video" className="mt-8 pt-6 border-t border-gray-100">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-ush-navy flex items-center justify-center gap-2 mb-3">
                    <Film size={16} className="text-ush-pink" /> Video de la Prenda en Movimiento
                  </h4>
                  <div className="max-w-[320px] sm:max-w-[360px] aspect-[9/16] mx-auto bg-neutral-100 rounded-2xl overflow-hidden shadow-xl border border-neutral-200 relative">
                    {video.type === 'iframe' ? (
                      <iframe
                        src={video.src}
                        className="absolute inset-0 w-full h-full border-0"
                        allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                        allowFullScreen
                        title={`Video de ${currentProduct.name}`}
                      />
                    ) : (
                      <video src={video.src} controls playsInline className="absolute inset-0 w-full h-full object-cover" />
                    )}
                  </div>
                </div>
              );
            })()}
          </div>


          {/* Product Details Section */}
          <div className="lg:col-span-5 space-y-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-[0.25em] text-neutral-400 block mb-1">
                Ref. Oficial #{currentProduct.reference}
              </span>
              <h1 className="text-3xl font-black uppercase text-ush-navy tracking-tight">
                {currentProduct.name}
              </h1>

              {/* Dual Price Display */}
              <div className="mt-4 p-4 bg-neutral-50 border border-gray-200 space-y-2">
                <div className="flex items-baseline justify-between text-xs">
                  <span className="font-bold text-neutral-700 uppercase">Precio al detal:</span>
                  <span className="font-extrabold text-neutral-900">{formatCOP(suggestedPrice)}</span>
                </div>

                <div className="flex items-baseline justify-between pt-2 border-t border-gray-200">
                  <span className="text-sm font-extrabold text-ush-pink uppercase flex items-center gap-1">
                    <Sparkles size={16} /> Precio Mayorista (12+ Uds):
                  </span>
                  <span className="text-3xl font-black text-neutral-900">
                    {formatCOP(wholesalePrice)}
                  </span>
                </div>

                <div className="pt-2 border-t border-gray-100 text-[11px] text-neutral-600 space-y-1">
                  <p className="font-bold uppercase text-neutral-700 tracking-wide">Escala de precios por compra:</p>
                  <div className="flex items-center justify-between">
                    <span>1 a 7 unidades</span>
                    <span className="font-extrabold">{formatCOP(Math.round(suggestedPrice * 1))}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>8 a 11 unidades (compra mínima) — 20%</span>
                    <span className="font-extrabold">{formatCOP(Math.round(suggestedPrice * 0.8))}</span>
                  </div>
                  <div className="flex items-center justify-between text-ush-pink font-bold">
                    <span>12+ unidades — precio mayorista + ENVÍO GRATIS</span>
                    <span className="font-extrabold">{formatCOP(wholesalePrice)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Descriptions & Specs */}
            <div className="border-t border-b border-gray-100 py-4 space-y-3">
              <div className={`text-sm text-neutral-700 font-normal leading-relaxed whitespace-pre-line ${descExpanded ? '' : 'line-clamp-4'}`}>
                {currentProduct.description || currentProduct.full_description || 'Prenda de alta durabilidad confeccionada en mezclilla rígida de confección nacional.'}
              </div>

              {descExpanded && (
                <div className="text-xs text-neutral-500 space-y-1 pt-2">
                  <p>• <strong>Material:</strong> Mezclilla Rígida Premium (100% Algodón de alta resistencia).</p>
                  <p>• <strong>Confección:</strong> Nacional estilizadora desde Itagüí, Antioquia.</p>
                  <p>• <strong>Despachos:</strong> Envíos a todo el país con entrega coordinada.</p>
                </div>
              )}

              {(currentProduct.description || currentProduct.full_description) && (
                <button
                  type="button"
                  onClick={() => setDescExpanded((prev) => !prev)}
                  className="text-xs font-bold uppercase tracking-wider text-ush-pink hover:text-ush-navy flex items-center gap-1 pt-1"
                >
                  {descExpanded ? (
                    <><ChevronUp size={14} /> Ver menos</>
                  ) : (
                    <><ChevronDown size={14} /> Ver más</>
                  )}
                </button>
              )}
            </div>

            {/* Size Selection (6 to 14) + Guide Button */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700">
                  Selecciona la Talla: <span className="text-ush-pink font-black">{selectedSize}</span>
                </label>
                
                <button
                  type="button"
                  onClick={() => setIsSizeGuideOpen(true)}
                  className="text-xs font-bold text-ush-pink hover:underline flex items-center gap-1 uppercase"
                >
                  <Ruler size={14} /> Guía de Tallas
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {availableSizes.map((size) => {
                  const sizeStock = (currentProduct.stock_by_size || {})[size];
                  const sizeSoldOut = soldOut || sizeStock === 0;
                  return (
                    <button
                      key={size}
                      onClick={() => {
                        setSelectedSize(size);
                        setQuantity(1);
                      }}
                      disabled={sizeSoldOut}
                      title={sizeSoldOut ? 'Talla agotada' : undefined}
                      className={`relative w-11 h-11 text-xs font-bold uppercase border transition-all flex items-center justify-center ${
                        sizeSoldOut
                          ? 'border-gray-200 text-neutral-300 bg-neutral-100 cursor-not-allowed'
                          : selectedSize === size
                          ? 'border-ush-pink bg-ush-pink text-white shadow-md'
                          : 'border-gray-300 text-neutral-700 hover:border-black bg-white'
                      }`}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Color Selection (si la prenda tiene color) */}
            {availableColors.length > 0 && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-2">
                  Color: <span className="text-ush-pink font-black">{selectedColor || 'Único'}</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {availableColors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`px-4 py-2 text-xs font-bold uppercase border transition-all flex items-center justify-center ${
                        selectedColor === color
                          ? 'border-ush-pink bg-ush-pink text-white shadow-md'
                          : 'border-gray-300 text-neutral-700 hover:border-black bg-white'
                      }`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity Selector - Any number */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-2">
                Cantidad deseada (Las unidades que quieras):
              </label>
              <div className="inline-flex items-center border border-gray-300 bg-white">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3 py-2.5 text-neutral-600 hover:bg-gray-100 font-bold"
                >
                  -
                </button>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-16 text-center text-sm font-black text-neutral-900 focus:outline-none"
                />
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-3 py-2.5 text-neutral-600 hover:bg-gray-100 font-bold"
                >
                  +
                </button>
              </div>
            </div>

            {/* Add to Cart CTA - El botón principal más grande */}
            <div className="pt-4 space-y-2.5">
              <button
                onClick={handleAddToCart}
                disabled={selectedSizeSoldOut || !anySizeAvailable}
                className={`w-full py-4 px-6 font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-3 transition-all duration-200 shadow-md ${
                  selectedSizeSoldOut || !anySizeAvailable
                    ? 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
                    : added
                    ? 'bg-emerald-600 text-white'
                    : 'bg-ush-navy text-white hover:bg-ush-pink active:scale-[0.99]'
                }`}
              >
                {selectedSizeSoldOut || !anySizeAvailable ? (
                  <>Agotado</>
                ) : added ? (
                  <>
                    <Check size={18} /> ¡Agregado ({quantity} unidades)!
                  </>
                ) : (
                  <>
                    <ShoppingBag size={18} /> Agregar al Carrito ({quantity})
                  </>
                )}
              </button>

              {/* Botones secundarios en fila compacta de 2 columnas: Consultar Asesor + Avisar stock */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const ref = currentProduct.reference || currentProduct.name;
                    const img = currentProduct.images && currentProduct.images[0] ? currentProduct.images[0] : '';
                    let msg = `¡Hola USH BY USHUAIA! 👖✨\nMe interesa consultar disponibilidad mayorista de esta referencia:\n\n`;
                    msg += `• *Referencia:* ${ref}\n`;
                    msg += `• *Silueta:* ${currentProduct.fit || currentProduct.category || 'Jeans'}\n`;
                    msg += `• *Talla de interés:* ${selectedSize}\n`;
                    if (selectedColor) msg += `• *Color:* ${selectedColor}\n`;
                    msg += `• *Cantidad:* ${quantity} unidades\n`;
                    if (img) msg += `• *Foto:* ${img}\n`;
                    msg += `\n¿Tienen disponibilidad en bodega de Itagüí para despacho inmediato? ¡Muchas gracias!`;
                    const encoded = encodeURIComponent(msg);
                    window.open(`https://wa.me/${whatsappNumber}?text=${encoded}`, '_blank');
                  }}
                  className="w-full py-2.5 px-2 font-bold uppercase tracking-wider text-[11px] border border-emerald-500/40 text-emerald-700 hover:bg-emerald-50 flex items-center justify-center gap-1.5 transition-colors"
                >
                  <MessageCircle size={14} className="text-emerald-600" />
                  <span>Consultar Asesor</span>
                </button>

                <button
                  type="button"
                  onClick={handleWatchAvailability}
                  disabled={watchLoading}
                  className={`w-full py-2.5 px-2 font-bold uppercase tracking-wider text-[11px] border flex items-center justify-center gap-1.5 transition-colors ${
                    watchSaved
                      ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                      : 'border-gray-300 text-neutral-600 hover:border-[#d88193] hover:text-[#d88193]'
                  }`}
                >
                  <BellRing size={14} />
                  <span>{watchLoading ? 'Guardando...' : watchSaved ? 'Guardado' : 'Avisar stock'}</span>
                </button>
              </div>
            </div>

            {/* Guarantee Callouts */}
            <div className="pt-6 border-t border-gray-100 grid grid-cols-2 gap-4 text-xs text-neutral-600 font-light">
              <div className="flex items-center gap-2">
                <Shield size={16} className="text-ush-pink" />
                <span>Mezclilla Rígida 100% Garantizada</span>
              </div>
              <div className="flex items-center gap-2">
                <Truck size={16} className="text-ush-pink" />
                <span>Despachos desde Itagüí, Antioquia</span>
              </div>
            </div>

          </div>
        </div>

        {/* ── Productos Sugeridos (carrusel) ── */}
        {related.length > 0 && (
          <div className="mt-16">
            <div className="flex items-end justify-between mb-6">
              <div>
                <h2 className="text-2xl font-black uppercase text-ush-navy tracking-tight">
                  Productos Sugeridos
                </h2>
                <p className="text-xs text-neutral-500 font-medium mt-1">
                  Mismo estilo, referencias similares y los más vendidos de la colección.
                </p>
              </div>
            </div>

            <div className="relative">
              <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin snap-x snap-mandatory">
                {related.map((rel) => (
                  <div key={rel.id} className="w-[200px] sm:w-[220px] flex-shrink-0 snap-start">
                    <ProductCard product={rel} compact sizes="(max-width: 640px) 45vw, 200px" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>{/* cierre max-w-7xl */}
    </div>{/* cierre py-4 container */}

    {/* ── BARRA FIJA INFERIOR EN CELULAR: TALLA ACTIVA + AGREGAR (fallback accesible siempre) ── */}
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-200 px-3 py-2 shadow-2xl flex items-center justify-between gap-2">
      <div className="min-w-0 flex-shrink-0">
        <span className="text-[9px] font-bold text-neutral-500 uppercase block leading-none">Mayorista 12+:</span>
        <span className="text-sm font-black text-[#1b2333] leading-tight block mt-0.5">{formatCOP(wholesalePrice)}</span>
      </div>
      {/* Selector talla compacto en barra inferior */}
      <div className="flex gap-1 flex-wrap max-w-[130px]">
        {availableSizes.slice(0, 5).map((size) => {
          const sizeStock = (currentProduct.stock_by_size || {})[size];
          const sizeSoldOut = soldOut || sizeStock === 0;
          return (
            <button
              key={size}
              type="button"
              onClick={() => { setSelectedSize(size); setQuantity(1); }}
              disabled={sizeSoldOut}
              className={`w-8 h-8 text-[10px] font-bold border rounded transition-all ${
                sizeSoldOut
                  ? 'border-gray-200 text-neutral-300 bg-neutral-100 cursor-not-allowed'
                  : selectedSize === size
                  ? 'border-ush-pink bg-ush-pink text-white'
                  : 'border-gray-300 text-neutral-700 bg-white'
              }`}
            >
              {size}
            </button>
          );
        })}
      </div>
      <button
        type="button"
        onClick={handleAddToCart}
        disabled={selectedSizeSoldOut || !anySizeAvailable}
        className={`flex-1 py-2.5 px-2 rounded-xl text-[11px] font-black uppercase tracking-wider flex items-center justify-center gap-1 transition ${
          selectedSizeSoldOut || !anySizeAvailable
            ? 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
            : added
            ? 'bg-emerald-600 text-white'
            : 'bg-[#1b2333] text-white active:scale-[0.98] shadow-md'
        }`}
      >
        {selectedSizeSoldOut || !anySizeAvailable ? (
          <span>Agotado</span>
        ) : added ? (
          <><Check size={13} /><span>¡Listo!</span></>
        ) : (
          <><ShoppingBag size={13} /><span>Agregar T.{selectedSize}</span></>
        )}
      </button>
    </div>

    </>
  );
}
