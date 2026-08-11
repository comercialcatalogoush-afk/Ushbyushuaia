'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ShoppingBag, ArrowLeft, Check, Shield, Truck, RefreshCw, MessageCircle } from 'lucide-react';
import { Product } from '@/types';
import { useCart } from '@/context/CartContext';

export default function ProductDetailClient({ product }: { product: Product }) {
  const { addToCart, formatCOP } = useCart();
  const [selectedImage, setSelectedImage] = useState<string>(product.images[0] || 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=600');
  
  const sizeOption = product.options?.find((o) => o.key.toLowerCase() === 'talla');
  const availableSizes = sizeOption?.values || ['6', '8', '10', '12', '14'];
  const [selectedSize, setSelectedSize] = useState<string>(availableSizes[0] || '8');
  
  const colorOption = product.options?.find((o) => o.key.toLowerCase() === 'color');
  const availableColors = colorOption?.values || [];
  const [selectedColor, setSelectedColor] = useState<string>(availableColors[0] || '');

  const [quantity, setQuantity] = useState<number>(1);
  const [added, setAdded] = useState(false);

  const handleAddToCart = () => {
    addToCart(product, selectedSize, selectedColor || undefined, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="py-12 bg-white min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Back Link */}
        <Link
          href="/#catalogo"
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-neutral-600 hover:text-black mb-8 group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          <span>Volver al Catálogo</span>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* Gallery Section */}
          <div className="lg:col-span-7 space-y-4">
            {/* Main Preview Image */}
            <div className="relative aspect-[3/4] bg-neutral-100 border border-gray-200 overflow-hidden shadow-sm">
              {product.ribbon && (
                <span className="absolute top-4 left-4 z-10 text-xs font-black uppercase tracking-widest px-3 py-1 bg-neutral-900 text-white shadow-md">
                  {product.ribbon}
                </span>
              )}

              <Image
                src={selectedImage}
                alt={product.name}
                fill
                priority
                className="object-cover object-center"
              />
            </div>

            {/* Thumbnails */}
            {product.images.length > 1 && (
              <div className="flex items-center gap-3 overflow-x-auto pb-2">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(img)}
                    className={`relative w-20 h-24 flex-shrink-0 border-2 transition-all overflow-hidden bg-neutral-100 ${
                      selectedImage === img ? 'border-neutral-900 shadow-md scale-95' : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                  >
                    <Image src={img} alt={`Vista ${idx + 1}`} fill className="object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Details Section */}
          <div className="lg:col-span-5 space-y-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-[0.25em] text-neutral-400 block mb-1">
                Ref. Oficial #{product.reference}
              </span>
              <h1 className="text-3xl font-extrabold uppercase text-neutral-900 tracking-tight">
                {product.name}
              </h1>

              {/* Price */}
              <div className="mt-4 flex items-baseline gap-3">
                <span className="text-3xl font-black text-neutral-900">
                  {formatCOP(product.price)}
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2.5 py-1 border border-amber-200">
                  Precio Mayorista
                </span>
              </div>
            </div>

            <div className="border-t border-b border-gray-100 py-4 space-y-4">
              <p className="text-sm text-neutral-600 font-light leading-relaxed">
                {product.description || 'Prenda de alta durabilidad confeccionada en mezclilla rígida. Ideal para ventas al por mayor en boutique y tiendas multimarca.'}
              </p>
            </div>

            {/* Color Option (If available) */}
            {availableColors.length > 0 && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-2">
                  Color: <span className="text-black font-extrabold">{selectedColor}</span>
                </label>
                <div className="flex gap-2">
                  {availableColors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`px-4 py-2 text-xs font-bold uppercase border transition-all ${
                        selectedColor === color
                          ? 'border-neutral-900 bg-neutral-900 text-white'
                          : 'border-gray-300 text-neutral-700 hover:border-black'
                      }`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Size Selection */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700">
                  Selecciona la Talla: <span className="text-black font-extrabold">{selectedSize}</span>
                </label>
                <span className="text-[11px] text-neutral-400 font-medium">Horma Estándar Colombia</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {availableSizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`w-11 h-11 text-xs font-bold uppercase border transition-all flex items-center justify-center ${
                      selectedSize === size
                        ? 'border-neutral-900 bg-neutral-900 text-white shadow-md'
                        : 'border-gray-300 text-neutral-700 hover:border-black bg-white'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity Selector */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-2">
                Cantidad
              </label>
              <div className="inline-flex items-center border border-gray-300 bg-white">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3 py-2 text-neutral-600 hover:bg-gray-100 font-bold"
                >
                  -
                </button>
                <span className="px-5 text-sm font-extrabold text-neutral-900">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-3 py-2 text-neutral-600 hover:bg-gray-100 font-bold"
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
                    : 'bg-neutral-900 text-white hover:bg-neutral-800 active:scale-[0.99]'
                }`}
              >
                {added ? (
                  <>
                    <Check size={18} /> ¡Agregado a tu pedido!
                  </>
                ) : (
                  <>
                    <ShoppingBag size={18} /> Agregar al Carrito
                  </>
                )}
              </button>

              <a
                href={`https://wa.me/573000000000?text=${encodeURIComponent(
                  `Hola USH BY USHUAIA, me interesa la referencia ${product.name} en talla ${selectedSize}. ¿Tienen disponibilidad?`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 px-6 text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-colors"
              >
                <MessageCircle size={18} />
                <span>Consultar Disponibilidad por WhatsApp</span>
              </a>
            </div>

            {/* Guarantee Callouts */}
            <div className="pt-6 border-t border-gray-100 grid grid-cols-2 gap-4 text-xs text-neutral-600 font-light">
              <div className="flex items-center gap-2">
                <Shield size={16} className="text-amber-600" />
                <span>Mezclilla Rígida 100% Garantizada</span>
              </div>
              <div className="flex items-center gap-2">
                <Truck size={16} className="text-amber-600" />
                <span>Despachos desde Itagüí, Antioquia</span>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
