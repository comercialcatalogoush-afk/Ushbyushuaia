'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ShoppingBag, Eye, Check, Plus, Minus, Ruler, Truck, Sparkles, Image as ImageIcon } from 'lucide-react';
import { Product } from '@/types';
import { useCart } from '@/context/CartContext';
import { SizeGuideModal } from './SizeGuideModal';
import { animateFlyToCart } from '@/lib/flyToCart';
import { abbreviateProductName } from '@/lib/productName';
import { WHOLESALE_FALLBACK, getSuggestedPrice } from '@/lib/pricing';

interface ProductCardProps {
  product: Product;
  isTopSeller?: boolean;
  imageAnimation?: string;
  sizes?: string;
  compact?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, isTopSeller, imageAnimation, sizes, compact }) => {
  const { addToCart, formatCOP } = useCart();
  
  const sizeOption = product.options?.find((o) => o.key.toLowerCase() === 'talla');
  const allowedSizes = ['6', '8', '10', '12', '14'];

  // Las tallas vienen del producto o de la lista estándar
  const rawSizes = sizeOption?.values && sizeOption.values.length > 0 ? sizeOption.values : allowedSizes;
  const availableSizes = rawSizes.filter((s) => allowedSizes.includes(s) || allowedSizes.includes(s.trim()));

  const [selectedSize, setSelectedSize] = useState<string>(availableSizes[0] || '6');
  const [quantity, setQuantity] = useState<number>(1);
  const [addedAnimation, setAddedAnimation] = useState(false);
  const [showAddedToast, setShowAddedToast] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);

  const handleSizeChange = (size: string) => {
    setSelectedSize(size);
    setQuantity(1);
  };

  const hasImages = product.images && product.images.length > 0 && product.images[0] !== '';
  const mainImage = hasImages ? (product.images[currentImageIndex] || product.images[0]) : '';

  // Solo está agotado si el admin lo marca explícitamente como fuera de stock
  const soldOut = product.in_stock === false;
  // Talla seleccionada agotada: stock igual a 0 para esa talla concreta
  const selectedSizeStock = (product.stock_by_size || {})[selectedSize];
  const sizeSoldOut = soldOut || selectedSizeStock === 0;

  const suggestedPrice = getSuggestedPrice(product);
  const wholesalePrice = product.price || Math.round(suggestedPrice * WHOLESALE_FALLBACK);

  const isBestSellerBadge = isTopSeller || product.is_best_seller || product.ribbon?.toLowerCase().includes('más vendido') || product.ribbon?.toLowerCase().includes('mas vendido');

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (sizeSoldOut) return;
    const imgEl = (e.currentTarget.closest('.group') as HTMLElement)?.querySelector('img');
    if (imgEl) animateFlyToCart(imgEl as HTMLElement);
    const productColor = product.color || undefined;
    addToCart(product, selectedSize, productColor, quantity);
    setAddedAnimation(true);
    setShowAddedToast(true);
    setTimeout(() => setAddedAnimation(false), 1800);
    setTimeout(() => setShowAddedToast(false), 2800);
  };

  // ── MODO COMPACTO (carrusel Más Vendidos): foto cuadrada completa + nombre + ref + precio ──
  if (compact) {
    return (
      <Link
        href={`/producto/${product.slug}`}
        className="group block bg-white border border-gray-200 hover:border-ush-pink hover:shadow-lg transition-all duration-300 relative"
      >
        {/* Imagen cuadrada completa (sin recorte), click → detalle para solicitar */}
        <div className="relative aspect-square overflow-hidden bg-neutral-100">
          {hasImages ? (
            <Image
              src={mainImage}
              alt={product.name}
              fill
              unoptimized={mainImage.startsWith('http://') || mainImage.startsWith('https://')}
              sizes={sizes || "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"}
              quality={100}
              className="object-cover object-center"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-neutral-100 to-rose-50 flex flex-col items-center justify-center text-center p-4">
              <ImageIcon size={22} className="text-ush-pink opacity-60 mb-2" />
              <p className="text-[9px] font-black uppercase tracking-widest text-ush-navy">Foto Próximamente</p>
            </div>
          )}
          {isBestSellerBadge && (
            <span className="absolute top-2 left-2 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 bg-[#d88193] text-white shadow">
              Más vendido
            </span>
          )}
          {/* Hint al hacer hover */}
          <div className="absolute inset-0 bg-black/15 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <span className="bg-white/95 text-ush-navy px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider shadow-lg">
              Ver para solicitar
            </span>
          </div>
        </div>

        {/* Nombre + referencia + precio */}
        <div className="p-2.5">
          {(() => {
            const { short, color } = abbreviateProductName(product);
            const finalColor = product.color || color;
            return (
              <>
                <h3 className="text-[13px] font-black text-[#1b2333] group-hover:text-ush-pink transition-colors uppercase tracking-wide leading-tight">
                  {short}
                  {finalColor && (
                    <span className="block text-[9px] font-extrabold text-[#d88193] mt-0.5 uppercase tracking-[0.12em]">
                      · {finalColor}
                    </span>
                  )}
                </h3>
                <span className="block text-[9px] font-bold uppercase tracking-widest text-neutral-400 mt-0.5">
                  Ref. #{product.reference}
                </span>
              </>
            );
          })()}
          <div className="mt-2 pt-2 border-t border-gray-100 flex items-baseline justify-between gap-1">
            <span className="text-[9px] font-extrabold text-ush-pink uppercase">Precio mayorista:</span>
            <span className="text-sm font-black text-neutral-900">{formatCOP(wholesalePrice)}</span>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <div className="group relative bg-white border border-gray-200 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:border-ush-pink overflow-hidden rounded-none card-hover-lift card-shine">

      {/* Added-to-cart floating toast */}
      {showAddedToast && (
        <div className="absolute inset-x-0 top-0 z-50 flex items-center justify-center pointer-events-none">
          <div className="mt-3 mx-3 w-full bg-emerald-600 text-white text-[11px] font-bold uppercase tracking-wide px-4 py-2.5 shadow-xl flex items-center gap-2 animate-[fadeInDown_0.3s_ease-out]">
            <Check size={14} className="shrink-0" />
            <span>¡Talla {selectedSize} × {quantity} ud{quantity > 1 ? 's' : '.'} agregada al carrito!</span>
          </div>
        </div>
      )}
      
      {/* Size Guide Modal */}
      <SizeGuideModal isOpen={isSizeGuideOpen} onClose={() => setIsSizeGuideOpen(false)} />

      {/* Product Image Section — 100% CLEAN: NO OVERLAID TEXT BADGES ON MODEL */}
      <Link 
        href={`/producto/${product.slug}`} 
        className="block relative aspect-[3/4] overflow-hidden bg-neutral-100"
        onMouseEnter={() => product.images.length > 1 && setCurrentImageIndex(1)}
        onMouseLeave={() => setCurrentImageIndex(0)}
      >
        {hasImages ? (
          <div className="absolute inset-0 overflow-hidden">
            <Image
              src={mainImage}
              alt={product.name}
              fill
              unoptimized={mainImage.startsWith('http://') || mainImage.startsWith('https://')}
              sizes={sizes || "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"}
              quality={100}
              className={`object-cover object-center ${imageAnimation || 'transition-transform duration-700 ease-out group-hover:scale-105'}`}
            />
          </div>
        ) : (
          // Placeholder for missing images
          <div className="absolute inset-0 bg-gradient-to-br from-neutral-100 to-rose-50 flex flex-col items-center justify-center text-center p-6">
            <div className="w-14 h-14 rounded-full bg-ush-pinkLight border-2 border-dashed border-ush-pink flex items-center justify-center mb-3">
              <ImageIcon size={26} className="text-ush-pink opacity-60" />
            </div>
            <p className="text-[11px] font-black uppercase tracking-widest text-ush-navy mb-1">Foto Próximamente</p>
            <p className="text-[10px] text-neutral-400 font-light">Editar fotos desde el panel admin</p>
          </div>
        )}

        {/* Hover Quick View Button */}
        {hasImages && (
          <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <span className="bg-white/95 backdrop-blur-md text-ush-navy px-4 py-2 text-xs font-bold uppercase tracking-wider shadow-lg flex items-center gap-1.5 transform translate-y-2 group-hover:translate-y-0 transition-transform">
              <Eye size={14} /> Ver Detalle
            </span>
          </div>
        )}
      </Link>

      {/* Content Info Section — ALL BADGES PLACED OUTSIDE / BELOW THE IMAGE */}
      <div className="p-4 flex flex-col flex-1 justify-between bg-white">
        <div>
          {/* Badges Container OUTSIDE Image */}
          <div className="flex flex-wrap items-center gap-1 mb-2">
            {isBestSellerBadge && (
              <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-wider px-1.5 sm:px-2 py-0.5 bg-[#1b2333] text-white">
                🔥 Más vendido
              </span>
            )}
            {product.ribbon && !isBestSellerBadge && (
              <span className={`text-[8px] sm:text-[9px] font-black uppercase tracking-wider px-1.5 sm:px-2 py-0.5 text-white ${
                product.ribbon.toLowerCase().includes('nuevo') ? 'bg-[#d88193]' : 'bg-[#1b2333]'
              }`}>
                {product.ribbon}
              </span>
            )}
            <span className="text-[8px] sm:text-[9px] font-extrabold uppercase tracking-wider px-1.5 sm:px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-0.5">
              <Truck size={9} /> <span className="hidden sm:inline">Envío Gratis </span>12+ Uds
            </span>
          </div>

          {/* Reference Title — abreviado con la tipografía de la marca */}
          <Link href={`/producto/${product.slug}`}>
            <h3 className="text-lg font-black text-[#1b2333] group-hover:text-ush-pink transition-colors uppercase tracking-wide leading-tight">
              {(() => {
                const { short, color } = abbreviateProductName(product);
                const finalColor = product.color || color;
                return (
                  <>
                    {short}
                    {finalColor && (
                      <span className="block text-[11px] font-extrabold text-[#d88193] mt-1 uppercase tracking-[0.12em]">
                        · {finalColor}
                      </span>
                    )}
                    <span className="block text-[10px] font-bold uppercase tracking-widest text-neutral-400 mt-1">
                      Ref. #{product.reference}
                    </span>
                  </>
                );
              })()}
            </h3>
          </Link>

          {/* Price Display Block */}
          <div className="mt-2.5 bg-neutral-50 p-2.5 border border-gray-100 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-neutral-600 font-bold uppercase">Precio al detal:</span>
              <span className="text-xs text-neutral-800 font-extrabold whitespace-nowrap">
                {formatCOP(suggestedPrice)}
              </span>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-gray-200">
              <span className="text-[11px] font-extrabold text-ush-pink uppercase flex items-center gap-1">
                <Sparkles size={11} /> 12+ uds:
              </span>
              <span className="text-base font-black text-neutral-900 whitespace-nowrap">
                {formatCOP(wholesalePrice)}
              </span>
            </div>
          </div>

          {/* Tallas Selector */}
          <div className="mt-2 sm:mt-3">
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                Talla: <span className="text-black font-extrabold">{selectedSize}</span>
              </label>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  setIsSizeGuideOpen(true);
                }}
                className="text-[10px] font-bold text-ush-pink hover:underline flex items-center gap-1 uppercase"
              >
                <Ruler size={11} /> <span className="hidden sm:inline">Guía de Tallas</span><span className="sm:hidden">Guía</span>
              </button>
            </div>

            {/* Fila única de tallas — sin desbordamiento en móvil */}
            <div className="flex flex-nowrap gap-1 overflow-x-auto pb-0.5">
              {availableSizes.map((size) => {
                const sizeStock = (product.stock_by_size || {})[size];
                const sizeOut = soldOut || sizeStock === 0;
                return (
                  <button
                    key={size}
                    type="button"
                    onClick={() => handleSizeChange(size)}
                    disabled={sizeOut}
                    title={sizeOut ? (soldOut ? 'Producto agotado' : 'Talla agotada') : `Talla ${size}`}
                    className={`relative shrink-0 text-[10px] sm:text-[11px] w-6 h-6 sm:w-7 sm:h-7 font-bold border transition-all flex items-center justify-center ${
                      selectedSize === size
                        ? 'border-ush-pink bg-ush-pink text-white shadow-sm'
                        : sizeOut
                        ? 'border-gray-200 text-gray-300 bg-neutral-100 line-through cursor-not-allowed'
                        : 'border-gray-200 text-gray-700 hover:border-gray-400 bg-white'
                    }`}
                  >
                    {size}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quantity Selector */}
          <div className="mt-3 flex items-center justify-between bg-neutral-50 p-1.5 border border-gray-100">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-600">
              Cantidad:
            </span>
            <div className="flex items-center border border-gray-300 bg-white">
              <button
                type="button"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="p-1 text-neutral-600 hover:bg-neutral-100"
              >
                <Minus size={11} />
              </button>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-8 text-center text-xs font-bold text-neutral-900 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setQuantity(quantity + 1)}
                className="p-1 text-neutral-600 hover:bg-neutral-100"
              >
                <Plus size={11} />
              </button>
            </div>
          </div>
        </div>

        {/* Add to Cart Button */}
        <button
          onClick={handleAddToCart}
          disabled={sizeSoldOut}
          className={`mt-4 w-full py-3 px-4 text-[11px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all duration-200 ${
            sizeSoldOut
              ? 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
              : addedAnimation
              ? 'bg-emerald-600 text-white'
              : 'bg-ush-navy text-white hover:bg-ush-pink active:scale-[0.98]'
          }`}
        >
          {sizeSoldOut ? (
            <>Agotado</>
          ) : addedAnimation ? (
            <>
              <Check size={15} /> ¡Agregado ({quantity})!
            </>
          ) : (
            <>
              <ShoppingBag size={15} /> Agregar al Carrito
            </>
          )}
        </button>
      </div>
    </div>
  );
};
