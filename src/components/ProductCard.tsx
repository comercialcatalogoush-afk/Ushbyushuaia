'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ShoppingBag, Eye, Check, Plus, Minus, Ruler, Truck, Sparkles, Image as ImageIcon } from 'lucide-react';
import { Product } from '@/types';
import { useCart } from '@/context/CartContext';
import { SizeGuideModal } from './SizeGuideModal';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart, formatCOP } = useCart();
  
  // Tallas 6 to 14
  const sizeOption = product.options?.find((o) => o.key.toLowerCase() === 'talla');
  const availableSizes = sizeOption?.values.filter(s => ['6', '8', '10', '12', '14'].includes(s)) || ['6', '8', '10', '12', '14'];
  
  const [selectedSize, setSelectedSize] = useState<string>(availableSizes[0] || '6');
  const [quantity, setQuantity] = useState<number>(1);
  const [addedAnimation, setAddedAnimation] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);

  const hasImages = product.images && product.images.length > 0 && product.images[0] !== '';
  const mainImage = hasImages ? (product.images[currentImageIndex] || product.images[0]) : '';

  const suggestedPrice = product.suggested_price || product.compare_price || 49900;
  const wholesalePrice = product.price || Math.round(suggestedPrice * 0.65);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product, selectedSize, undefined, quantity);
    setAddedAnimation(true);
    setTimeout(() => setAddedAnimation(false), 1500);
  };

  return (
    <div className="group relative bg-white border border-gray-200 flex flex-col justify-between transition-all duration-300 hover:shadow-xl hover:border-ush-pink overflow-hidden">
      
      {/* Size Guide Modal */}
      <SizeGuideModal isOpen={isSizeGuideOpen} onClose={() => setIsSizeGuideOpen(false)} />

      {/* Product Image Section */}
      <Link 
        href={`/producto/${product.slug}`} 
        className="block relative aspect-[3/4] overflow-hidden bg-neutral-100"
        onMouseEnter={() => product.images.length > 1 && setCurrentImageIndex(1)}
        onMouseLeave={() => setCurrentImageIndex(0)}
      >
        {/* Ribbon Badge */}
        {product.ribbon && (
          <span className={`absolute top-3 left-3 z-10 text-[10px] font-black uppercase tracking-widest px-3 py-1 text-white shadow-md ${
            product.ribbon.toLowerCase().includes('nuevo') ? 'bg-ush-pink' : 'bg-ush-navyDark'
          }`}>
            {product.ribbon}
          </span>
        )}

        {/* Free Shipping Badge */}
        <span className="absolute top-3 right-3 z-10 text-[9px] font-extrabold uppercase tracking-wider px-2.5 py-1 bg-emerald-600 text-white shadow-md flex items-center gap-1">
          <Truck size={12} /> Envío Gratis (12+ Uds)
        </span>

        {hasImages ? (
          <Image
            src={mainImage}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
          />
        ) : (
          // En Construcción placeholder
          <div className="absolute inset-0 bg-gradient-to-br from-neutral-100 to-rose-50 flex flex-col items-center justify-center text-center p-6">
            <div className="w-16 h-16 rounded-full bg-ush-pinkLight border-2 border-dashed border-ush-pink flex items-center justify-center mb-4">
              <ImageIcon size={28} className="text-ush-pink opacity-60" />
            </div>
            <p className="text-[11px] font-black uppercase tracking-widest text-ush-navy mb-1">Foto Próximamente</p>
            <p className="text-[10px] text-neutral-400 font-light">El administrador puede agregar la imagen desde el panel de edición.</p>
          </div>
        )}

        {/* Quick View Button (only if has images) */}
        {hasImages && (
          <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <span className="bg-white/95 backdrop-blur-md text-ush-navy px-4 py-2 text-xs font-bold uppercase tracking-wider shadow-lg flex items-center gap-1.5 transform translate-y-2 group-hover:translate-y-0 transition-transform">
              <Eye size={14} /> Ver Detalle
            </span>
          </div>
        )}
      </Link>

      {/* Content Info */}
      <div className="p-5 flex flex-col flex-1 justify-between bg-white">
        <div>
          {/* Reference Title */}
          <Link href={`/producto/${product.slug}`}>
            <h3 className="text-base font-black text-ush-navy group-hover:text-ush-pink transition-colors uppercase tracking-wide">
              {product.name}
            </h3>
          </Link>

          {/* Description Snippet */}
          <p className="text-xs text-neutral-600 mt-1 line-clamp-2 font-light">
            {product.description || 'Prenda confeccionada en mezclilla rígida de alta resistencia.'}
          </p>

          {/* Price Display */}
          <div className="mt-3 bg-neutral-50 p-2.5 border border-gray-100 space-y-1">
            <div className="flex items-baseline justify-between">
              <span className="text-xs text-neutral-500 font-semibold uppercase">P. Sugerido Venta:</span>
              <span className="text-xs text-gray-400 line-through font-bold">
                {formatCOP(suggestedPrice)}
              </span>
            </div>

            <div className="flex items-baseline justify-between pt-0.5 border-t border-gray-200">
              <span className="text-xs font-extrabold text-ush-pink uppercase flex items-center gap-1">
                <Sparkles size={12} /> Precio Mayorista:
              </span>
              <span className="text-lg font-black text-neutral-900">
                {formatCOP(wholesalePrice)}
              </span>
            </div>
            <p className="text-[9px] text-neutral-500 font-medium text-right">
              (Aplica 35%-42% OFF al llevar 12+ uds)
            </p>
          </div>

          {/* Tallas Selector (6 to 14) */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-1.5">
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
                <Ruler size={12} /> Guía de Tallas
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {availableSizes.map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => setSelectedSize(size)}
                  className={`text-xs w-8 h-8 font-bold border transition-all flex items-center justify-center ${
                    selectedSize === size
                      ? 'border-ush-pink bg-ush-pink text-white shadow-sm'
                      : 'border-gray-200 text-gray-700 hover:border-gray-400 bg-white'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* Quantity Selector on Card */}
          <div className="mt-4 flex items-center justify-between bg-neutral-50 p-2 border border-gray-100">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-600">
              Cantidad:
            </span>
            <div className="flex items-center border border-gray-300 bg-white">
              <button
                type="button"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="p-1 text-neutral-600 hover:bg-neutral-100"
              >
                <Minus size={12} />
              </button>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-10 text-center text-xs font-bold text-neutral-900 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setQuantity(quantity + 1)}
                className="p-1 text-neutral-600 hover:bg-neutral-100"
              >
                <Plus size={12} />
              </button>
            </div>
          </div>
        </div>

        {/* Add to Cart Button */}
        <button
          onClick={handleAddToCart}
          className={`mt-5 w-full py-3.5 px-4 text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all duration-200 ${
            addedAnimation
              ? 'bg-emerald-600 text-white'
              : 'bg-ush-navy text-white hover:bg-ush-pink active:scale-[0.98]'
          }`}
        >
          {addedAnimation ? (
            <>
              <Check size={16} /> ¡Agregado ({quantity})!
            </>
          ) : (
            <>
              <ShoppingBag size={16} /> Agregar al Carrito
            </>
          )}
        </button>
      </div>
    </div>
  );
};
