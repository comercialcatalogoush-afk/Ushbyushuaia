'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ShoppingBag, ArrowLeft, Check, Shield, Truck, MessageCircle, Ruler, Film } from 'lucide-react';
import { Product } from '@/types';
import { useCart } from '@/context/CartContext';
import { SizeGuideModal } from '@/components/SizeGuideModal';

export default function ProductDetailClient({ product }: { product: Product }) {
  const { addToCart, formatCOP } = useCart();
  const [selectedImage, setSelectedImage] = useState<string>(product.images[0] || 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=600');
  
  const sizeOption = product.options?.find((o) => o.key.toLowerCase() === 'talla');
  const availableSizes = sizeOption?.values.filter(s => ['6', '8', '10', '12', '14'].includes(s)) || ['6', '8', '10', '12', '14'];
  const [selectedSize, setSelectedSize] = useState<string>(availableSizes[0] || '6');
  
  const colorOption = product.options?.find((o) => o.key.toLowerCase() === 'color');
  const availableColors = colorOption?.values || [];
  const [selectedColor, setSelectedColor] = useState<string>(availableColors[0] || '');

  const [quantity, setQuantity] = useState<number>(1);
  const [added, setAdded] = useState(false);
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);

  const handleAddToCart = () => {
    addToCart(product, selectedSize, selectedColor || undefined, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="py-12 bg-white min-h-screen">
      
      {/* Size Guide Modal */}
      <SizeGuideModal isOpen={isSizeGuideOpen} onClose={() => setIsSizeGuideOpen(false)} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Back Link */}
        <Link
          href="/#catalogo"
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-ush-navy hover:text-ush-pink mb-8 group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          <span>Volver al Catálogo Mayorista</span>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* Gallery & Video Section */}
          <div className="lg:col-span-7 space-y-4">
            
            {/* Main Preview Image */}
            <div className="relative aspect-[3/4] bg-neutral-100 border border-gray-200 overflow-hidden shadow-md">
              {product.ribbon && (
                <span className="absolute top-4 left-4 z-10 text-xs font-black uppercase tracking-widest px-3.5 py-1 bg-ush-pink text-white shadow-md">
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
                      selectedImage === img ? 'border-ush-pink shadow-md scale-95' : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                  >
                    <Image src={img} alt={`Vista ${idx + 1}`} fill className="object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Promotional Video Player if available */}
            {product.video_url && (
              <div className="mt-6 pt-6 border-t border-gray-100">
                <h4 className="text-xs font-bold uppercase tracking-wider text-ush-navy flex items-center gap-2 mb-3">
                  <Film size={16} className="text-ush-pink" /> Video de la Prenda en Movimiento
                </h4>
                <div className="aspect-video w-full bg-black overflow-hidden shadow-sm">
                  <video src={product.video_url} controls className="w-full h-full object-cover" />
                </div>
              </div>
            )}

          </div>

          {/* Product Details Section */}
          <div className="lg:col-span-5 space-y-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-[0.25em] text-neutral-400 block mb-1">
                Ref. Oficial #{product.reference}
              </span>
              <h1 className="text-3xl font-black uppercase text-ush-navy tracking-tight">
                {product.name}
              </h1>

              {/* Price - NO TRAILING ZERO */}
              <div className="mt-4 flex items-baseline gap-3">
                <span className="text-3xl font-black text-neutral-900">
                  {formatCOP(product.price)}
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-ush-pink bg-ush-pinkLight px-2.5 py-1 border border-rose-200">
                  Precio Mayorista
                </span>
              </div>
            </div>

            {/* Descriptions & Specs */}
            <div className="border-t border-b border-gray-100 py-4 space-y-3">
              <p className="text-sm text-neutral-700 font-normal leading-relaxed">
                {product.full_description || product.description || 'Prenda de alta durabilidad confeccionada en mezclilla rígida de confección nacional.'}
              </p>
              <div className="text-xs text-neutral-500 space-y-1 pt-2">
                <p>• <strong>Material:</strong> Mezclilla Rígida Premium (100% Algodón / Stretch según ref).</p>
                <p>• <strong>Confección:</strong> Nacional de alta resistencia desde Itagüí, Antioquia.</p>
                <p>• <strong>Disponibilidad:</strong> Entrega inmediata para pedidos mayoristas.</p>
              </div>
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
                {availableSizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`w-11 h-11 text-xs font-bold uppercase border transition-all flex items-center justify-center ${
                      selectedSize === size
                        ? 'border-ush-pink bg-ush-pink text-white shadow-md'
                        : 'border-gray-300 text-neutral-700 hover:border-black bg-white'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

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

              <a
                href={`https://wa.me/573000000000?text=${encodeURIComponent(
                  `Hola USH BY USHUAIA, me interesa la referencia ${product.name} en talla ${selectedSize} (Cantidad: ${quantity} uds). ¿Tienen disponibilidad?`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 px-6 text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-colors"
              >
                <MessageCircle size={18} />
                <span>Pedir Disponibilidad por WhatsApp</span>
              </a>
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
      </div>
    </div>
  );
}
