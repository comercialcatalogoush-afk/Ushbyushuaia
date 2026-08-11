import React from 'react';
import Link from 'next/link';
import { Gift, ArrowRight } from 'lucide-react';

export const metadata = {
  title: 'Tarjeta de Regalo | Ush By Ushuaia',
  description: 'Adquiere tarjetas de regalo para redimir en productos mayoristas y al detal.',
};

export default function TarjetaRegaloPage() {
  return (
    <div className="py-20 bg-neutral-50 min-h-screen flex items-center justify-center">
      <div className="max-w-md mx-auto bg-white p-8 border border-gray-200 shadow-lg text-center space-y-6">
        <div className="w-16 h-16 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center mx-auto">
          <Gift size={32} />
        </div>

        <div>
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-400">
            Regala Moda & Calidad
          </span>
          <h1 className="text-2xl font-black uppercase text-neutral-900 mt-1">
            Tarjetas de Regalo USH BY USHUAIA
          </h1>
          <p className="text-xs text-neutral-600 mt-2 leading-relaxed">
            Sorprende a tus clientes o aliados comerciales con bonos digitales redimibles en cualquier referencia de nuestro catálogo de mezclilla.
          </p>
        </div>

        <div className="p-4 bg-neutral-900 text-white text-xs font-bold uppercase tracking-wider">
          Bonos Disponibles desde $100.000 COP
        </div>

        <Link
          href="/contacto"
          className="block w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-3.5 px-4 text-xs uppercase tracking-widest transition-colors shadow-md"
        >
          Adquirir Tarjeta por WhatsApp
        </Link>
      </div>
    </div>
  );
}
