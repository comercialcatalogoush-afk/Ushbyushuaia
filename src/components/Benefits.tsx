'use client';

import React from 'react';
import { Tag, TrendingDown, Layers, Headphones, PackageCheck, Award } from 'lucide-react';

export const Benefits: React.FC = () => {
  const wholesaleBenefits = [
    {
      title: 'Prendas a Mayorista',
      description: 'Descuentos exclusivos en precios de volumen para su negocio.',
      icon: Tag,
      tag: 'Exclusivo'
    },
    {
      title: 'Descuentos por Volumen',
      description: 'Mejor escala de precios desde 12 unidades por referencia elegida.',
      icon: TrendingDown,
      tag: 'Desde 12 Uds'
    },
    {
      title: 'Compra por Referencia',
      description: 'Seleccione cantidades específicas de cada referencia.',
      icon: Layers,
      tag: 'Flexible'
    },
    {
      title: 'Atención Personalizada',
      description: 'Asesoría exclusiva para su logística y pedidos.',
      icon: Headphones,
      tag: 'Directo'
    }
  ];

  return (
    <section className="py-16 bg-neutral-50 border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-xs font-bold uppercase tracking-[0.25em] text-neutral-500 mb-2">
            Beneficios Mayoristas
          </h2>
          <p className="text-3xl font-extrabold text-neutral-900 tracking-tight">
            Ventajas competitivas para impulsar tu negocio
          </p>
          <div className="w-12 h-1 bg-black mx-auto mt-4 rounded-full" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {wholesaleBenefits.map((benefit, index) => {
            const IconComponent = benefit.icon;
            return (
              <div
                key={index}
                className="bg-white p-8 border border-gray-100 rounded-none shadow-sm hover:shadow-md hover:border-gray-300 transition-all duration-300 group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-12 h-12 rounded-full bg-neutral-100 text-neutral-900 flex items-center justify-center group-hover:bg-neutral-900 group-hover:text-white transition-colors">
                      <IconComponent size={22} />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 bg-neutral-100 text-neutral-700 rounded">
                      {benefit.tag}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-neutral-900 mb-2">
                    {benefit.title}
                  </h3>

                  <p className="text-sm text-neutral-600 font-light leading-relaxed">
                    {benefit.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-gray-50 flex items-center text-xs font-semibold text-neutral-900 group-hover:translate-x-1 transition-transform">
                  <span>Conoce más</span>
                  <span className="ml-1">→</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
