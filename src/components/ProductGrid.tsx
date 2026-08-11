'use client';

import React, { useState } from 'react';
import { Product } from '@/types';
import { ProductCard } from './ProductCard';
import { Filter, Sparkles, Flame, Check } from 'lucide-react';

interface ProductGridProps {
  products: Product[];
}

export const ProductGrid: React.FC<ProductGridProps> = ({ products }) => {
  const [activeTab, setActiveTab] = useState<'all' | 'nuevo' | 'mas_vendido'>('all');

  const filteredProducts = products.filter((p) => {
    if (activeTab === 'nuevo') {
      return p.ribbon?.toLowerCase().includes('nuevo');
    }
    if (activeTab === 'mas_vendido') {
      return p.ribbon?.toLowerCase().includes('más vendido') || p.ribbon?.toLowerCase().includes('mas vendido');
    }
    return true;
  });

  return (
    <section id="catalogo" className="py-16 bg-white scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Title */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 pb-6 border-b border-gray-100 gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-[0.25em] text-neutral-500 block mb-1">
              Catálogo de Mezclilla Rígida
            </span>
            <h2 className="text-3xl font-extrabold text-neutral-900 uppercase tracking-tight">
              Nuevas Referencias & Top Ventas
            </h2>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all rounded-none border ${
                activeTab === 'all'
                  ? 'bg-neutral-900 text-white border-neutral-900 shadow-sm'
                  : 'bg-neutral-50 text-neutral-600 border-gray-200 hover:bg-gray-100'
              }`}
            >
              Todos ({products.length})
            </button>

            <button
              onClick={() => setActiveTab('nuevo')}
              className={`px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all rounded-none border flex items-center gap-1.5 ${
                activeTab === 'nuevo'
                  ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                  : 'bg-neutral-50 text-neutral-600 border-gray-200 hover:bg-gray-100'
              }`}
            >
              <Sparkles size={14} /> Nuevos
            </button>

            <button
              onClick={() => setActiveTab('mas_vendido')}
              className={`px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all rounded-none border flex items-center gap-1.5 ${
                activeTab === 'mas_vendido'
                  ? 'bg-neutral-900 text-white border-neutral-900 shadow-sm'
                  : 'bg-neutral-50 text-neutral-600 border-gray-200 hover:bg-gray-100'
              }`}
            >
              <Flame size={14} /> Más vendidos
            </button>
          </div>
        </div>

        {/* Product Cards Grid */}
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-neutral-50 border border-dashed border-gray-200">
            <p className="text-neutral-500 font-medium text-sm">
              No hay productos con este filtro actualmente.
            </p>
            <button
              onClick={() => setActiveTab('all')}
              className="mt-4 text-xs font-bold uppercase underline tracking-wider text-black"
            >
              Ver todos los productos
            </button>
          </div>
        )}
      </div>
    </section>
  );
};
