'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Sparkles, ShieldCheck } from 'lucide-react';

export const Hero: React.FC = () => {
  return (
    <section className="relative bg-neutral-950 text-white overflow-hidden min-h-[540px] flex items-center">
      {/* Background Image Overlay with Glassmorphism */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center opacity-40 mix-blend-luminosity scale-105 transition-transform duration-1000"
        style={{
          backgroundImage: `url('https://static.wixstatic.com/media/e21be4_d636501aedfd4962b899ed38ffb772c6~mv2.jpg')`
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent z-10" />

      <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
        <div className="max-w-2xl">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold uppercase tracking-widest text-amber-300 mb-6">
            <Sparkles size={14} className="animate-pulse" />
            <span>NUEVA COLECCIÓN MAYORISTA</span>
          </div>

          {/* Official Tagline Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-none uppercase mb-6">
            No cambiamos, <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-white to-amber-400">
              EVOLUCIONAMOS
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-neutral-300 text-base sm:text-lg font-light leading-relaxed mb-8">
            Catálogo exclusivo de mezclilla rígida, shorts, faldas y jeans wide leg tiro alto. Diseños creados para distribuidores, boutiques y comerciantes con escala especial de precios mayoristas.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            <Link
              href="#catalogo"
              className="inline-flex items-center justify-center gap-3 bg-white text-neutral-950 font-bold px-8 py-4 rounded-none hover:bg-amber-400 transition-all duration-200 shadow-lg tracking-wider text-sm uppercase group"
            >
              <span>VER CATÁLOGO MAYORISTA</span>
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              href="/contacto"
              className="inline-flex items-center justify-center gap-2 border border-white/40 text-white font-medium px-6 py-4 rounded-none hover:bg-white/10 transition-all duration-200 text-sm uppercase tracking-wider backdrop-blur-sm"
            >
              <ShieldCheck size={18} />
              <span>Contactar Asesor</span>
            </Link>
          </div>

          {/* Feature Badges */}
          <div className="mt-12 pt-8 border-t border-white/10 grid grid-cols-3 gap-4 text-center sm:text-left">
            <div>
              <p className="text-xl sm:text-2xl font-extrabold text-white">12+ Uds</p>
              <p className="text-xs text-neutral-400 uppercase tracking-wider">Escala Mayorista</p>
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-extrabold text-white">100%</p>
              <p className="text-xs text-neutral-400 uppercase tracking-wider">Garantía de Calidad</p>
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-extrabold text-white">Envíos</p>
              <p className="text-xs text-neutral-400 uppercase tracking-wider">A Toda Colombia</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
