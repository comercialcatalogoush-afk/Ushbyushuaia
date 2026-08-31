'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ShoppingBag, ArrowLeft, Check, Shield, Truck, Ruler, Film, Sparkles, ChevronDown, ChevronUp, Share2, MessageCircle, ZoomIn, X, ChevronLeft, ChevronRight, ZoomOut, Copy } from 'lucide-react';
import { Product } from '@/types';
import { useCart } from '@/context/CartContext';
import { SizeGuideModal } from '@/components/SizeGuideModal';
import { animateFlyToCart } from '@/lib/flyToCart';
import { getWhatsAppNumber, DEFAULT_WHATSAPP_NUMBER } from '@/lib/siteConfig';
import { subscribeCatalogChanges } from '@/lib/supabase';
import type { CatalogSyncPayload } from '@/lib/supabase';
import { ProductCard } from '@/components/ProductCard';
import { WHOLESALE_FALLBACK } from '@/lib/pricing';
import { gtagEvent } from '@/lib/analytics';
import { formatVideoUrl } from '@/lib/videoUtils';

interface ProductDetailClientProps {
  product: Product;
  related?: Product[];
}

export default function ProductDetailClient({ product, related = [] }: ProductDetailClientProps) {
  const [currentProduct, setCurrentProduct] = useState<Product>(product);

  const { addToCart, formatCOP } = useCart();
  const [selectedImage, setSelectedImage] = useState<string>(currentProduct.images[0] || 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=600');
  
  const sizeOption = currentProduct.options?.find((o) => o.key.toLowerCase() === 'talla');
  const allowedSizes = ['6', '8', '10', '12', '14'];

  // Las tallas vienen del producto o de la lista estándar
  const rawSizes = sizeOption?.values && sizeOption.values.length > 0 ? sizeOption.values : allowedSizes;
  const availableSizes = rawSizes.filter((s) => allowedSizes.includes(s) || allowedSizes.includes(s.trim()));

  const [selectedSize, setSelectedSize] = useState<string>(availableSizes[0] || '6');

  // Solo está agotado si el admin lo marca explícitamente en el editor
  const soldOut = currentProduct.in_stock === false;

  const colorOption = currentProduct.options?.find((o) => o.key.toLowerCase() === 'color');
  const availableColors = colorOption?.values || (currentProduct.color ? [currentProduct.color] : []);
  const [selectedColor, setSelectedColor] = useState<string>(availableColors[0] || currentProduct.color || '');

  const [quantity, setQuantity] = useState<number>(1);
  const [added, setAdded] = useState(false);
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);

  const suggestedPrice = currentProduct.suggested_price || currentProduct.compare_price || 49900;
  const wholesalePrice = currentProduct.price || Math.round(suggestedPrice * WHOLESALE_FALLBACK);

  // Compartir por WhatsApp (precio editable por el cliente)
  const [shareOpen, setShareOpen] = useState(false);
  const [sharePrice, setSharePrice] = useState<number>(suggestedPrice);
  const [zoomOpen, setZoomOpen] = useState(false);
  const [zoomScale, setZoomScale] = useState(1);
  const [zoomPan, setZoomPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [zoomIndex, setZoomIndex] = useState(0);
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

  React.useEffect(() => {
    if (!zoomOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setZoomOpen(false);
      } else if (e.key === 'ArrowRight') {
        setZoomIndex((i) => (i + 1) % currentProduct.images.length);
        setZoomScale(1);
        setZoomPan({ x: 0, y: 0 });
      } else if (e.key === 'ArrowLeft') {
        setZoomIndex((i) => (i - 1 + currentProduct.images.length) % currentProduct.images.length);
        setZoomScale(1);
        setZoomPan({ x: 0, y: 0 });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [zoomOpen, currentProduct.images.length]);

  const handleAddToCart = (e: React.MouseEvent) => {
    const mainImgEl = document.querySelector('.aspect-\\[3\\/4\\] img');
    if (mainImgEl) animateFlyToCart(mainImgEl as HTMLElement);
    addToCart(currentProduct, selectedSize, selectedColor || undefined, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <>
    <div className="py-12 bg-white min-h-screen">
      
      {/* Size Guide Modal */}
      <SizeGuideModal isOpen={isSizeGuideOpen} onClose={() => setIsSizeGuideOpen(false)} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Back Link */}
        <Link
          href="/catalogo"
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-ush-navy hover:text-ush-pink mb-8 group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          <span>Volver al Catálogo Mayorista</span>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* Gallery: Vertical Thumbnails LEFT + Main Image RIGHT */}
          <div className="lg:col-span-7">
            <div className="flex gap-3 items-start">

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
                        // scroll to video section
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

              {/* Main Preview Image */}
              <div
                  className="relative flex-1 max-w-[520px] aspect-[3/4] bg-neutral-100 border border-gray-200 overflow-hidden shadow-md min-w-0 mx-auto cursor-zoom-in group"
                  onClick={() => {
                    const idx = Math.max(0, currentProduct.images.findIndex((i) => i === selectedImage));
                    setZoomIndex(idx);
                    setZoomScale(1);
                    setZoomPan({ x: 0, y: 0 });
                    setZoomOpen(true);
                  }}
                >
                  {product.ribbon && (
                    <span className="absolute top-4 left-4 z-10 text-xs font-black uppercase tracking-widest px-3.5 py-1 bg-ush-pink text-white shadow-md pointer-events-none">
                      {product.ribbon}
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
                    className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
                  />
                  <span className="absolute bottom-3 right-3 z-10 w-10 h-10 bg-white/90 hover:bg-white text-ush-navy shadow-md border border-gray-200 flex items-center justify-center pointer-events-none">
                    <ZoomIn size={18} />
                  </span>
                </div>
            </div>

            {/* Promotional Video Player if available */}
            {(() => {
              const video = formatVideoUrl(currentProduct.video_url);
              if (!video.isSupported || !video.src) return null;
              return (
                <div id="product-video" className="mt-6 pt-6 border-t border-gray-100">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-ush-navy flex items-center gap-2 mb-3">
                    <Film size={16} className="text-ush-pink" /> Video de la Prenda en Movimiento
                  </h4>
                  <div className="aspect-video w-full bg-black overflow-hidden shadow-sm rounded-lg">
                    {video.type === 'iframe' ? (
                      <iframe
                        src={video.src}
                        className="w-full h-full border-0"
                        allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                        allowFullScreen
                        title={`Video de ${currentProduct.name}`}
                      />
                    ) : (
                      <video src={video.src} controls className="w-full h-full object-cover" />
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
                  <span className="font-bold text-neutral-700 uppercase">Precio Sugerido de Venta:</span>
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
                  return (
                    <button
                      key={size}
                      onClick={() => {
                        setSelectedSize(size);
                        setQuantity(1);
                      }}
                      disabled={soldOut}
                      className={`relative w-11 h-11 text-xs font-bold uppercase border transition-all flex items-center justify-center ${
                        selectedSize === size
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

            {/* Add to Cart CTA */}
            <div className="pt-4 space-y-3">
              <button
                onClick={handleAddToCart}
                disabled={soldOut}
                className={`w-full py-4 px-6 font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-3 transition-all duration-200 shadow-md ${
                  soldOut
                    ? 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
                    : added
                    ? 'bg-emerald-600 text-white'
                    : 'bg-ush-navy text-white hover:bg-ush-pink active:scale-[0.99]'
                }`}
              >
                {soldOut ? (
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

              {/* Compartir por WhatsApp */}
              <button
                type="button"
                onClick={() => { setSharePrice(suggestedPrice); setShareOpen(true); }}
                className="w-full py-3 px-4 font-bold uppercase tracking-widest text-xs border border-[#d88193]/40 text-ush-pink hover:bg-ush-pinkLight flex items-center justify-center gap-2 transition-colors"
              >
                <Share2 size={15} /> Compartir
              </button>
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
      </div>
    </div>

    {/* ── Modal Zoom de Imagen (fondo blanco, estilo ushuaiajeans.com.co) ── */}
    {zoomOpen && (
      <div
        className="fixed inset-0 z-[60] bg-white flex flex-col"
        onClick={() => setZoomOpen(false)}
        role="dialog"
        aria-modal="true"
      >
        {/* Top bar */}
        <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-4">
          <span className="text-neutral-600 text-sm font-medium">
            {(zoomIndex + 1)} / {currentProduct.images.length}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setZoomScale((s) => Math.max(1, Math.min(6, s + 0.5))); }}
              aria-label="Acercar"
              className="w-10 h-10 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 flex items-center justify-center rounded-full transition-colors"
            >
              <ZoomIn size={20} />
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setZoomScale((s) => Math.max(1, Math.min(6, s - 0.5))); }}
              aria-label="Alejar"
              className="w-10 h-10 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 flex items-center justify-center rounded-full transition-colors"
            >
              <ZoomOut size={20} />
            </button>
            <button
              type="button"
              onClick={() => setZoomOpen(false)}
              aria-label="Cerrar zoom"
              className="w-10 h-10 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 flex items-center justify-center rounded-full transition-colors"
            >
              <X size={22} />
            </button>
          </div>
        </div>

        {/* Prev / Next */}
        {currentProduct.images.length > 1 && (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                const next = (zoomIndex - 1 + currentProduct.images.length) % currentProduct.images.length;
                setZoomIndex(next);
                setZoomScale(1);
                setZoomPan({ x: 0, y: 0 });
              }}
              aria-label="Imagen anterior"
              className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-11 h-11 bg-white hover:bg-neutral-100 text-neutral-700 border border-gray-200 flex items-center justify-center rounded-full shadow-md transition-colors"
            >
              <ChevronLeft size={26} />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                const next = (zoomIndex + 1) % currentProduct.images.length;
                setZoomIndex(next);
                setZoomScale(1);
                setZoomPan({ x: 0, y: 0 });
              }}
              aria-label="Imagen siguiente"
              className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-11 h-11 bg-white hover:bg-neutral-100 text-neutral-700 border border-gray-200 flex items-center justify-center rounded-full shadow-md transition-colors"
            >
              <ChevronRight size={26} />
            </button>
          </>
        )}

        {/* Pan / Zoom area */}
        <div
          className={`flex-1 flex items-center justify-center p-16 overflow-hidden select-none ${zoomScale > 1 ? 'cursor-grab active:cursor-grabbing' : 'cursor-zoom-in'}`}
          onWheel={(e) => {
            e.stopPropagation();
            const delta = e.deltaY < 0 ? 0.15 : -0.15;
            setZoomScale((s) => Math.max(1, Math.min(6, s + delta)));
          }}
          onMouseDown={(e) => {
            e.stopPropagation();
            setIsDragging(true);
            setDragStart({ x: e.clientX - zoomPan.x, y: e.clientY - zoomPan.y });
          }}
          onMouseMove={(e) => {
            if (isDragging) {
              setZoomPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
            }
          }}
          onMouseUp={() => setIsDragging(false)}
          onMouseLeave={() => setIsDragging(false)}
          onDoubleClick={(e) => {
            e.stopPropagation();
            setZoomScale((s) => (s > 1 ? 1 : 2.5));
            setZoomPan({ x: 0, y: 0 });
          }}
        >
          <div
            className="relative max-w-full max-h-full transition-transform duration-150"
            style={{ transform: `scale(${zoomScale}) translate(${zoomPan.x}px, ${zoomPan.y}px)` }}
          >
            <Image
              src={currentProduct.images[zoomIndex] || currentProduct.images[0]}
              alt={currentProduct.name}
              width={1000}
              height={1333}
              unoptimized={(currentProduct.images[zoomIndex] || currentProduct.images[0] || '').startsWith('http://') || (currentProduct.images[zoomIndex] || currentProduct.images[0] || '').startsWith('https://')}
              quality={100}
              sizes="90vw"
              className="object-contain max-w-[90vw] max-h-[85vh] w-auto h-auto shadow-lg"
            />
          </div>
        </div>
            {/* Hint */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-neutral-500 text-xs flex items-center gap-4 z-20 bg-white/90 px-4 py-2 border border-gray-200 rounded-full">
          <span>Rueda del mouse: zoom</span>
          <span>Arrastra: mover</span>
          <span>Doble clic: restaurar</span>
        </div>
      </div>
    )}

    {/* ── Modal Compartir Referencia ── */}
    {shareOpen && (() => {
      const imageUrl = currentProduct.images[0] || '';
      // El link siempre apunta al ecommerce público (precio ecommerce)
      const retailUrl = `https://ushuaiajeans.com.co`;

      const msg =
        `👗 *${currentProduct.name}* (Ref. #${currentProduct.reference})\n` +
        `💲 Precio: *${formatCOP(sharePrice)}*\n` +
        `${selectedColor ? `🎨 Color: ${selectedColor}\n` : ''}` +
        `${selectedSize ? `📏 Talla: ${selectedSize}\n` : ''}` +
        `\n🔗 Ver prenda aquí: ${retailUrl}\n` +
        (imageUrl ? `📸 Foto: ${imageUrl}\n` : '') +
        `\n¿Te gusta? Escríbeme y te tomo el pedido.`;

      const waUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(msg)}`;

      return (
        <div
          className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShareOpen(false)}
        >
          <div
            className="bg-white w-full max-w-lg shadow-2xl rounded-xl overflow-hidden animate-fadeIn border border-gray-100"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-5 bg-[#1b2333] text-white flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                <Share2 size={16} className="text-[#d88193]" /> Compartir Referencia con Clientes
              </h3>
              <button
                type="button"
                onClick={() => setShareOpen(false)}
                aria-label="Cerrar"
                className="text-neutral-400 hover:text-white p-1"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">

              {/* Product preview */}
              <div className="flex gap-3 items-center p-3 bg-neutral-50 rounded-lg border border-neutral-200">
                <div className="w-14 h-16 relative bg-neutral-200 rounded overflow-hidden flex-shrink-0">
                  {imageUrl && (
                    <Image src={imageUrl} alt={currentProduct.name} fill unoptimized={imageUrl.startsWith('http://') || imageUrl.startsWith('https://')} sizes="64px" className="object-cover" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-black uppercase text-[#d88193]">Ref. #{currentProduct.reference}</p>
                  <p className="text-xs font-bold text-neutral-800 truncate">{currentProduct.name}</p>
                  <p className="text-[10px] text-[#d88193] font-bold mt-0.5 truncate">→ ushuaiajeans.com.co</p>
                </div>
              </div>

              {/* ⚠️ Aviso precio ecommerce */}
              <div className="flex gap-2.5 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <span className="text-amber-500 text-base flex-shrink-0 mt-0.5">⚠️</span>
                <div>
                  <p className="text-[11px] font-black text-amber-800 uppercase tracking-wide mb-1">
                    El enlace va a ushuaiajeans.com.co
                  </p>
                  <p className="text-[11px] text-amber-700 leading-relaxed">
                    Tu cliente verá la prenda en <strong>ushuaiajeans.com.co</strong> con el{' '}
                    <strong>precio de ecommerce de esa página</strong>.
                    El precio que ingresas abajo solo aparece en tu mensaje de WhatsApp —
                    es el precio que <strong>tú le cobras</strong> a tu cliente.
                  </p>
                </div>
              </div>

              {/* Precio que el mayorista muestra en su mensaje */}
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-neutral-500 mb-1.5">
                  Precio que le mostrarás a tu cliente (en el mensaje):
                </label>
                <div className="flex items-center border border-gray-300 focus-within:border-[#d88193] rounded-lg overflow-hidden bg-white">
                  <span className="px-3 text-sm font-bold text-neutral-400">$</span>
                  <input
                    type="number"
                    min={0}
                    value={sharePrice}
                    onChange={(e) => setSharePrice(Number(e.target.value) || 0)}
                    className="w-full py-2.5 pr-3 text-base font-black text-neutral-900 focus:outline-none"
                  />
                </div>
                <p className="text-[10px] text-neutral-400 mt-1">
                  Pon el precio al que tú lo vendes. Solo aparece en el mensaje, no en el sitio.
                </p>
              </div>

              {/* Vista previa del mensaje */}
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-neutral-500 mb-1.5">
                  Vista previa del mensaje:
                </label>
                <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-lg text-xs text-neutral-700 font-mono whitespace-pre-line leading-relaxed max-h-44 overflow-y-auto">
                  {msg}
                </div>
              </div>

              {/* Botones de acción */}
              <div className="pt-1 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <a
                  href={waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setShareOpen(false)}
                  className="w-full py-3 bg-[#25D366] hover:bg-[#1fb959] text-white font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2 rounded-lg transition-colors shadow-sm"
                >
                  <MessageCircle size={16} /> Enviar por WhatsApp
                </a>

                <button
                  type="button"
                  onClick={() => {
                    if (navigator.clipboard) {
                      navigator.clipboard.writeText(msg);
                      alert('¡Mensaje copiado al portapapeles!');
                    }
                  }}
                  className="w-full py-3 bg-[#1b2333] hover:bg-black text-white font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2 rounded-lg transition-colors shadow-sm"
                >
                  <Copy size={16} /> Copiar Mensaje
                </button>
              </div>

              {/* Compartir nativo en móvil */}
              {typeof navigator !== 'undefined' && 'share' in navigator && (
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await navigator.share({ title: currentProduct.name, text: msg, url: retailUrl });
                      setShareOpen(false);
                    } catch (_) {}
                  }}
                  className="w-full py-2.5 border border-neutral-200 hover:border-[#d88193] text-neutral-700 font-bold uppercase tracking-widest text-[11px] flex items-center justify-center gap-2 rounded-lg transition-colors"
                >
                  <Share2 size={14} /> Compartir en otras apps (Instagram, Telegram...)
                </button>
              )}
            </div>
          </div>
        </div>
      );
    })()}
    </>
  );
}
