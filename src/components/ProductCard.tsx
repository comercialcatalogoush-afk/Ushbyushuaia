'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ShoppingBag, Eye, Check } from 'lucide-react';
import { Product } from '@/types';
import { useCart } from '@/context/CartContext';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart, formatCOP } = useCart();
  
  // Extract sizes if present
  const sizeOption = product.options?.find((o) => o.key.toLowerCase() === 'talla');
  const availableSizes = sizeOption?.values || ['6', '8', '10', '12', '14'];
  const [selectedSize, setSelectedSize] = useState<string>(availableSizes[0] || '8');
  const [addedAnimation, setAddedAnimation] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const mainImage = product.images[currentImageIndex] || product.images[0] || 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=600';
  const secondaryImage = product.images[1] || mainImage;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product, selectedSize, undefined, 1);
    setAddedAnimation(true);
    setTimeout(() => setAddedAnimation(false), 1500);
  };

  return (
    <div className="group relative bg-white border border-gray-100 flex flex-col justify-between transition-all duration-300 hover:shadow-xl hover:border-neutral-300 overflow-hidden">
      
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
            product.ribbon.toLowerCase().includes('nuevo') ? 'bg-amber-600' : 'bg-neutral-900'
          }`}>
            {product.ribbon}
          </span>
        )}

        <Image
          src={mainImage}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
        />

        {/* Quick view hover button overlay */}
        <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <span className="bg-white/90 backdrop-blur-md text-neutral-900 px-4 py-2 text-xs font-bold uppercase tracking-wider shadow-lg flex items-center gap-1.5 transform translate-y-2 group-hover:translate-y-0 transition-transform">
            <Eye size={14} /> Ver Detalle
          </span>
        </div>
      </Link>

      {/* Content Info */}
      <div className="p-5 flex flex-col flex-1 justify-between bg-white">
        <div>
          {/* Reference Title */}
          <Link href={`/producto/${product.slug}`}>
            <h3 className="text-base font-bold text-neutral-900 group-hover:text-amber-700 transition-colors uppercase tracking-wide">
              {product.name}
            </h3>
          </Link>

          {/* Description Snippet */}
          <p className="text-xs text-neutral-500 mt-1 line-clamp-1 font-light">
            {product.description || 'Prenda de mezclilla rígida mayorista de alta durabilidad.'}
          </p>

          {/* Price */}
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-lg font-black text-neutral-900">
              {formatCOP(product.price)}
            </span>
            {product.compare_price && product.compare_price > product.price && (
              <span className="text-xs text-gray-400 line-through">
                {formatCOP(product.compare_price)}
              </span>
            )}
          </div>

          {/* Tallas Selector */}
          <div className="mt-4">
            <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 block mb-1.5">
              Talla seleccionada: <span className="text-black font-extrabold">{selectedSize}</span>
            </label>
            <div className="flex flex-wrap gap-1.5">
              {availableSizes.map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => setSelectedSize(size)}
                  className={`text-xs w-8 h-8 rounded-none border font-semibold flex items-center justify-center transition-all ${
                    selectedSize === size
                      ? 'border-neutral-900 bg-neutral-900 text-white shadow-sm'
                      : 'border-gray-200 text-gray-700 hover:border-gray-400 bg-white'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Add to Cart Button */}
        <button
          onClick={handleAddToCart}
          className={`mt-5 w-full py-3 px-4 text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all duration-200 ${
            addedAnimation
              ? 'bg-emerald-600 text-white'
              : 'bg-neutral-900 text-white hover:bg-neutral-800 active:scale-[0.98]'
          }`}
        >
          {addedAnimation ? (
            <>
              <Check size={16} /> ¡Agregado!
            </>
          ) : (
            <>
              <ShoppingBag size={16} /> Agregar al carrito
            </>
          )}
        </button>
      </div>
    </div>
  );
};
