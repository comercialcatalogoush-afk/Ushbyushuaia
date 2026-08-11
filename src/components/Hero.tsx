'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Sparkles, ShieldCheck } from 'lucide-react';

export const Hero: React.FC = () => {
  return (
    <section className="relative bg-ush-navyDark text-white overflow-hidden min-h-[580px] flex items-center">
      
      {/* Hero Fashion Model Image Background */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/hero-model.png"
          alt="Modelo USH BY USHUAIA Catálogo Mayorista"
          fill
          priority
          className="object-cover object-center lg:object-right opacity-45 mix-blend-luminosity scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-ush-navyDark via-ush-navyDark/90 to-transparent z-10" />
      </div>

      <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
        <div className="max-w-2xl space-y-6">
          
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-ush-pink/20 backdrop-blur-md border border-ush-pink/40 text-xs font-bold uppercase tracking-widest text-ush-pinkSoft">
            <Sparkles size={14} className="animate-pulse text-ush-pink" />
            <span>NUEVO CATÁLOGO MAYORISTA OFICIAL</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-none uppercase">
            No cambiamos, <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-ush-pinkSoft via-ush-pink to-rose-300">
              EVOLUCIONAMOS
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-neutral-300 text-sm sm:text-base font-light leading-relaxed">
            Diseño, confección nacional y distribución mayorista de prendas en mezclilla rígida. Shorts, faldas y jeans wide leg tiro alto. Escala especial de precios a partir de 12 unidades.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
            <Link
              href="#catalogo"
              className="inline-flex items-center justify-center gap-3 bg-ush-pink hover:bg-ush-pinkHover text-white font-bold px-8 py-4 rounded-none shadow-lg tracking-widest text-xs uppercase group transition-all"
            >
              <span>VER CATÁLOGO MAYORISTA</span>
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              href="/contacto"
              className="inline-flex items-center justify-center gap-2 border border-white/30 text-white font-semibold px-6 py-4 rounded-none hover:bg-white/10 text-xs uppercase tracking-widest transition-all backdrop-blur-sm"
            >
              <ShieldCheck size={18} />
              <span>Solicitar Asesoría</span>
            </Link>
          </div>

          {/* Feature Counters */}
          <div className="mt-12 pt-8 border-t border-white/10 grid grid-cols-3 gap-4">
            <div>
              <p className="text-xl sm:text-2xl font-black text-ush-pinkSoft">6 a 14</p>
              <p className="text-[10px] text-neutral-400 uppercase tracking-wider font-semibold">Tallas Colombia</p>
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-black text-ush-pinkSoft">12+ Uds</p>
              <p className="text-[10px] text-neutral-400 uppercase tracking-wider font-semibold">Escala Mayorista</p>
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-black text-ush-pinkSoft">Itagüí</p>
              <p className="text-[10px] text-neutral-400 uppercase tracking-wider font-semibold">Despachos Directos</p>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
