'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Sparkles, ShieldCheck } from 'lucide-react';

export const Hero: React.FC = () => {
  return (
    <section className="relative bg-[#d88193] text-white overflow-hidden min-h-[580px] flex items-center">
      
      {/* Official Cover Image Background */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/official-cover.jpg"
          alt="Portada Oficial USH BY USHUAIA - Colombian Jeans"
          fill
          priority
          className="object-cover object-center lg:object-right scale-100"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#b5586c] via-[#d88193]/80 to-transparent z-10" />
      </div>

      <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
        <div className="max-w-2xl space-y-6">
          
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/20 backdrop-blur-md border border-white/40 text-xs font-bold uppercase tracking-widest text-white shadow-sm">
            <Sparkles size={14} className="animate-pulse text-amber-200" />
            <span>COLOMBIAN JEANS - CATÁLOGO OFICIAL</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-none uppercase drop-shadow-md">
            No cambiamos, <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-rose-100 to-amber-100">
              EVOLUCIONAMOS
            </span>
          </h1>



          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
            <Link
              href="#catalogo"
              className="inline-flex items-center justify-center gap-3 bg-white text-ush-navyDark font-black px-8 py-4 rounded-none shadow-xl tracking-widest text-xs uppercase group hover:bg-neutral-100 transition-all"
            >
              <span>VER CATÁLOGO MAYORISTA</span>
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform text-ush-pink" />
            </Link>

            <Link
              href="/contacto"
              className="inline-flex items-center justify-center gap-2 border-2 border-white text-white font-extrabold px-6 py-4 rounded-none hover:bg-white/10 text-xs uppercase tracking-widest transition-all backdrop-blur-sm shadow-md"
            >
              <ShieldCheck size={18} />
              <span>Solicitar Asesoría</span>
            </Link>
          </div>



        </div>
      </div>
    </section>
  );
};
