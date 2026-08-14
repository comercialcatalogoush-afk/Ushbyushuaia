'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ShoppingBag, ArrowLeft, Check, Shield, Truck, Ruler, Film, Sparkles, ChevronDown, ChevronUp, Share2, MessageCircle, ZoomIn, X } from 'lucide-react';
import { Product } from '@/types';
import { useCart } from '@/context/CartContext';
import { SizeGuideModal } from '@/components/SizeGuideModal';
import { animateFlyToCart } from '@/lib/flyToCart';
import { getWhatsAppNumber, DEFAULT_WHATSAPP_NUMBER } from '@/lib/siteConfig';
import { ProductCard } from '@/components/ProductCard';

interface ProductDetailClientProps {
  product: Product;
  related?: Product[];
}

export default function ProductDetailClient({ product, related = [] }: ProductDetailClientProps) {
  const [currentProduct, setCurrentProduct] = useState<Product>(product);

  const { addToCart, formatCOP } = useCart();
  const [selectedImage, setSelectedImage] = useState<string>(currentProduct.images[0] || 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=600');
  
  const sizeOption = currentProduct.options?.find((o) => o.key.toLowerCase() === 'talla');
  const availableSizes = sizeOption?.values.filter(s => ['6', '8', '10', '12', '14'].includes(s)) || ['6', '8', '10', '12', '14'];
  const [selectedSize, setSelectedSize] = useState<string>(availableSizes[0] || '6');
  
  const colorOption = currentProduct.options?.find((o) => o.key.toLowerCase() === 'color');
  const availableColors = colorOption?.values || (currentProduct.color ? [currentProduct.color] : []);
  const [selectedColor, setSelectedColor] = useState<string>(availableColors[0] || currentProduct.color || '');

  const [quantity, setQuantity] = useState<number>(1);
  const [added, setAdded] = useState(false);
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);

  const suggestedPrice = currentProduct.suggested_price || currentProduct.compare_price || 49900;
  const wholesalePrice = currentProduct.price || Math.round(suggestedPrice * 0.65);

  // Stock por talla
  const stock = currentProduct.stock_by_size || {};
  const stockForSize = (size: string) => stock[size] ?? 10;
  const isSizeAvailable = (size: string) => stockForSize(size) > 0;

  // Compartir por WhatsApp (precio editable por el cliente)
  const [shareOpen, setShareOpen] = useState(false);
  const [sharePrice, setSharePrice] = useState<number>(suggestedPrice);
  const [zoomOpen, setZoomOpen] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState<string>(DEFAULT_WHATSAPP_NUMBER);

  React.useEffect(() => {
    getWhatsAppNumber().then(setWhatsappNumber);
  }, []);

  const handleAddToCart = (e: React.MouseEvent) => {
    const mainImgEl = document.querySelector('.aspect-\\[3\\/4\\] img');
    if (mainImgEl) animateFlyToCart(mainImgEl as HTMLElement);
    addToCart(product, selectedSize, selectedColor || undefined, quantity);
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
                      <Image src={img} alt={`Vista ${idx + 1}`} fill sizes="80px" quality={90} className="object-cover" />
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
              <div className="relative flex-1 max-w-[520px] aspect-[3/4] bg-neutral-100 border border-gray-200 overflow-hidden shadow-md min-w-0 mx-auto">
                {product.ribbon && (
                  <span className="absolute top-4 left-4 z-10 text-xs font-black uppercase tracking-widest px-3.5 py-1 bg-ush-pink text-white shadow-md">
                    {product.ribbon}
                  </span>
                )}

                <Image
                  src={selectedImage}
                  alt={currentProduct.name}
                  fill
                  priority
                  quality={100}
                  sizes="(max-width: 1024px) 90vw, 40vw"
                  className="object-cover object-center"
                />
                <button
                  type="button"
                  onClick={() => setZoomOpen(true)}
                  aria-label="Ampliar imagen"
                  className="absolute bottom-3 right-3 z-10 w-10 h-10 bg-white/90 hover:bg-white text-ush-navy shadow-md border border-gray-200 flex items-center justify-center transition-all"
                >
                  <ZoomIn size={18} />
                </button>
              </div>
            </div>

            {/* Promotional Video Player if available */}
            {currentProduct.video_url && (
              <div id="product-video" className="mt-6 pt-6 border-t border-gray-100">
                <h4 className="text-xs font-bold uppercase tracking-wider text-ush-navy flex items-center gap-2 mb-3">
                  <Film size={16} className="text-ush-pink" /> Video de la Prenda en Movimiento
                </h4>
                <div className="aspect-video w-full bg-black overflow-hidden shadow-sm">
                  <video src={currentProduct.video_url} controls className="w-full h-full object-cover" />
                </div>
              </div>
            )}
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
                  const available = isSizeAvailable(size);
                  const low = available && stockForSize(size) <= 5;
                  return (
                    <button
                      key={size}
                      onClick={() => available && setSelectedSize(size)}
                      disabled={!available}
                      title={!available ? 'Agotada' : low ? `Últimas ${stockForSize(size)} unidades` : `Stock: ${stockForSize(size)}`}
                      className={`relative w-11 h-11 text-xs font-bold uppercase border transition-all flex items-center justify-center ${
                        !available
                          ? 'border-gray-100 text-gray-300 bg-gray-50 cursor-not-allowed line-through'
                          : selectedSize === size
                          ? 'border-ush-pink bg-ush-pink text-white shadow-md'
                          : 'border-gray-300 text-neutral-700 hover:border-black bg-white'
                      }`}
                    >
                      {size}
                      {low && (
                        <span className="absolute -top-1 -right-1 w-2 h-2 bg-amber-500 rounded-full" title="Pocas unidades" />
                      )}
                    </button>
                  );
                })}
              </div>
              {(() => {
                const low = availableSizes.filter((s) => isSizeAvailable(s) && stockForSize(s) <= 5);
                const out = availableSizes.filter((s) => !isSizeAvailable(s));
                return (
                  <>
                    {low.length > 0 && (
                      <p className="mt-2 text-[11px] font-bold text-amber-600 uppercase tracking-wide">
                        ⚠️ Pocas unidades: {low.join(', ')}
                      </p>
                    )}
                    {out.length > 0 && (
                      <p className="mt-1 text-[11px] font-bold text-neutral-400 uppercase tracking-wide">
                        Tallas agotadas: {out.join(', ')}
                      </p>
                    )}
                  </>
                );
              })()}
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
                className={`w-full py-4 px-6 font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-3 transition-all duration-200 shadow-md ${
                  added
                    ? 'bg-emerald-600 text-white'
                    : 'bg-ush-navy text-white hover:bg-ush-pink active:scale-[0.99]'
                }`}
              >
                {added ? (
                  <>
                    <Check size={18} /> ¡Agregado ({quantity} unidades)!
                  </>
                ) : (
                  <>
                    <ShoppingBag size={18} /> Agregar al Carrito ({quantity})
                  </>
                )}
              </button>

              {/* Compartir por WhatsApp + Solicitar muestra */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => { setSharePrice(suggestedPrice); setShareOpen(true); }}
                  className="py-3 px-4 font-bold uppercase tracking-widest text-xs border border-[#d88193]/40 text-ush-pink hover:bg-ush-pinkLight flex items-center justify-center gap-2 transition-colors"
                >
                  <Share2 size={15} /> Compartir
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const msg = encodeURIComponent(
                      `👗 Hola, me interesa *solicitar una muestra* de la referencia *${currentProduct.reference}* (${currentProduct.name}).\n` +
                      `Talla: ${selectedSize}${selectedColor ? ` · Color: ${selectedColor}` : ''}\n` +
                      `¿Me confirman disponibilidad y condiciones? Gracias.`
                    );
                    window.open(`https://wa.me/${whatsappNumber}?text=${msg}`, '_blank');
                  }}
                  className="py-3 px-4 font-bold uppercase tracking-widest text-xs border border-gray-300 text-neutral-700 hover:border-ush-navy hover:bg-neutral-50 flex items-center justify-center gap-2 transition-colors"
                >
                  <MessageCircle size={15} /> Pedir Muestra
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
      </div>
    </div>

    {/* ── Modal Zoom de Imagen ── */}
    {zoomOpen && (
      <div
        className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4"
        onClick={() => setZoomOpen(false)}
      >
        <button
          type="button"
          onClick={() => setZoomOpen(false)}
          aria-label="Cerrar zoom"
          className="absolute top-4 right-4 z-10 text-white hover:text-ush-pink p-2 transition-colors"
        >
          <X size={28} />
        </button>
        <div
          className="relative w-full max-w-3xl aspect-[3/4]"
          onClick={(e) => e.stopPropagation()}
        >
          <Image
            src={selectedImage}
            alt={currentProduct.name}
            fill
            quality={100}
            sizes="(max-width: 1024px) 90vw, 60vw"
            className="object-contain"
          />
        </div>
      </div>
    )}

    {/* ── Modal Compartir por WhatsApp (precio editable) ── */}
    {shareOpen && (
      <div
        className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4"
        onClick={() => setShareOpen(false)}
      >
        <div
          className="bg-white w-full max-w-md shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-sm font-black uppercase text-ush-navy tracking-wide flex items-center gap-2">
              <Share2 size={16} className="text-ush-pink" /> Compartir por WhatsApp
            </h3>
            <button
              type="button"
              onClick={() => setShareOpen(false)}
              aria-label="Cerrar"
              className="text-neutral-400 hover:text-neutral-700 p-1"
            >
              <X size={18} />
            </button>
          </div>

          <div className="p-5 space-y-4">
            <div className="flex gap-3 items-start">
              <div className="w-16 h-20 relative bg-neutral-100 flex-shrink-0">
                <Image
                  src={currentProduct.images[0]}
                  alt={currentProduct.name}
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              </div>
              <div>
                <p className="text-xs font-black uppercase text-ush-navy">
                  Ref. #{currentProduct.reference}
                </p>
                <p className="text-xs text-neutral-600 mt-0.5">{currentProduct.name}</p>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-500 mb-1.5">
                Precio de venta (el cliente puede ajustarlo)
              </label>
              <div className="flex items-center border border-gray-300 focus-within:border-ush-pink">
                <span className="px-3 text-sm font-bold text-neutral-500">$</span>
                <input
                  type="number"
                  min={0}
                  value={sharePrice}
                  onChange={(e) => setSharePrice(Number(e.target.value) || 0)}
                  className="w-full py-2.5 pr-3 text-lg font-black text-ush-navy focus:outline-none"
                />
              </div>
              <p className="text-[10px] text-neutral-400 mt-1">
                Se sugiere {formatCOP(suggestedPrice)}. Modifícalo antes de enviar si lo deseas.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                const msg = encodeURIComponent(
                  `👗 Hola, te comparto la referencia *${currentProduct.reference}* (${currentProduct.name}) del catálogo USH BY USHUAIA.\n` +
                  `💲 Precio: *${formatCOP(sharePrice)}*${selectedColor ? `\n🎨 Color: ${selectedColor}` : ''}${selectedSize ? `\n📏 Talla: ${selectedSize}` : ''}\n` +
                  `¿Te interesa? Escríbeme y te asesoro con gusto.`
                );
                window.open(`https://wa.me/${whatsappNumber}?text=${msg}`, '_blank');
                setShareOpen(false);
              }}
              className="w-full py-3.5 bg-[#25D366] hover:bg-[#1fb959] text-white font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition-colors"
            >
              <MessageCircle size={16} /> Enviar por WhatsApp
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
