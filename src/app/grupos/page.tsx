import React from 'react';
import Link from 'next/link';
import { Users, ShieldCheck } from 'lucide-react';

export const metadata = {
  title: 'Grupos & Mayoristas | Ush By Ushuaia',
  description: 'Únete a nuestras comunidades VIP de comerciantes y recibe primicias de lanzamientos de referencias.',
};

export default function GruposPage() {
  return (
    <div className="py-20 bg-neutral-50 min-h-screen flex items-center justify-center">
      <div className="max-w-md mx-auto bg-white p-8 border border-gray-200 shadow-lg text-center space-y-6">
        <div className="w-16 h-16 bg-neutral-900 text-amber-400 rounded-full flex items-center justify-center mx-auto">
          <Users size={32} />
        </div>

        <div>
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-400">
            Comunidad Exclusiva
          </span>
          <h1 className="text-2xl font-black uppercase text-neutral-900 mt-1">
            Grupos Mayoristas VIP
          </h1>
          <p className="text-xs text-neutral-600 mt-2 leading-relaxed">
            Recibe en primicia los catálogos en alta resolución, fotos para difusión en redes sociales y alertas de re-stock de referencias agotadas.
          </p>
        </div>

        <a
          href="https://wa.me/573000000000?text=Hola%20USH%20BY%20USHUAIA,%20deseo%20unirme%20al%20grupo%20VIP%20de%20comerciantes"
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 px-4 text-xs uppercase tracking-widest transition-colors shadow-md"
        >
          Unirse al Grupo de WhatsApp
        </a>
      </div>
    </div>
  );
}
