import React from 'react';
import Link from 'next/link';
import { Benefits } from '@/components/Benefits';
import { CheckCircle2, HelpCircle, ArrowRight, ShieldCheck } from 'lucide-react';

export const metadata = {
  title: 'Beneficios Mayoristas | Ush By Ushuaia',
  description: 'Conoce los beneficios exclusivos para comerciantes y distribuidores. Precios especiales por volumen desde 12 unidades.',
};

export default function ComoComprarPage() {
  const steps = [
    {
      num: '01',
      title: 'Selecciona tus Referencias',
      desc: 'Navega por nuestro catálogo y elige los productos de tu preferencia (shorts, faldas, jeans wide leg).'
    },
    {
      num: '02',
      title: 'Elige Tallas y Cantidades',
      desc: 'Puedes combinar diferentes referencias y desglosar las tallas necesarias para tu negocio. Aplica escala mayorista a partir de 12 unidades.'
    },
    {
      num: '03',
      title: 'Confirma con tu Asesor',
      desc: 'Tramita el pedido en la web o directamente por WhatsApp con nuestro equipo en Itagüí, Antioquia.'
    },
    {
      num: '04',
      title: 'Despacho Seguro',
      desc: 'Realizamos el empaque y despacho inmediato mediante la empresa transportadora de tu confianza a cualquier lugar de Colombia.'
    }
  ];

  return (
    <div className="py-12 bg-white space-y-16">
      {/* Header Banner */}
      <div className="bg-neutral-50 border-b border-gray-200 text-neutral-900 py-16 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <span className="text-xs font-bold uppercase tracking-[0.25em] text-[#d88193]">
            Escala & Condiciones
          </span>
          <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-neutral-900">
            Beneficios & Cómo Comprar
          </h1>
          <p className="text-sm text-neutral-600 max-w-2xl mx-auto font-light leading-relaxed">
            Te ofrecemos un modelo comercial ágil y transparente diseñado especialmente para maximizar el margen de ganancia de tu tienda.
          </p>
        </div>
      </div>

      {/* Benefits grid */}
      <Benefits />

      {/* Step by Step Process */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl font-bold uppercase tracking-tight text-neutral-900">
            Proceso de Compra Mayorista
          </h2>
          <p className="text-xs text-neutral-500 mt-1 uppercase tracking-wider">
            En 4 sencillos pasos
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, idx) => (
            <div key={idx} className="bg-white p-6 border border-gray-200 shadow-sm relative">
              <span className="text-4xl font-black text-[#d88193]/30 absolute top-4 right-4">
                {step.num}
              </span>
              <h3 className="text-base font-bold text-neutral-900 mb-2 pr-8 uppercase">
                {step.title}
              </h3>
              <p className="text-xs text-neutral-600 font-light leading-relaxed">
                {step.desc}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link
            href="/#catalogo"
            className="inline-flex items-center gap-2 bg-[#1b2333] hover:bg-[#d88193] text-white font-bold px-8 py-4 text-xs uppercase tracking-widest transition-colors shadow-md"
          >
            <span>Ver Productos Disponibles</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
}
