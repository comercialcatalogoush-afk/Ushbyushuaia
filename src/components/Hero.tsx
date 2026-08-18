'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Sparkles, ShieldCheck } from 'lucide-react';
import { usePageContent } from '@/lib/siteContentHooks';

export const Hero: React.FC = () => {
  const c = usePageContent('home');

  const headline1 = c.heroHeadline1 || 'No cambiamos,';
  const headline2 = c.heroHeadline2 || 'EVOLUCIONAMOS';
  const subtitle = c.heroSubtitle || '';
  const badge = c.heroBadge || 'COLOMBIAN JEANS - CATÁLOGO OFICIAL';
  const bgImage = c.heroImage || '/images/official-cover.jpg';
  const overlayFrom = c.heroOverlayFrom || '#b5586c';
  const overlayVia = c.heroOverlayVia || '#d88193';
  const g1 = c.heroGradient1 || '#ffffff';
  const g2 = c.heroGradient2 || '#fecdd3';
  const g3 = c.heroGradient3 || '#fef3c7';
  const cta1Text = c.heroCta1Text || 'VER CATÁLOGO MAYORISTA';
  const cta1Link = c.heroCta1Link || '/catalogo';
  const cta2Text = c.heroCta2Text || 'Solicitar Asesoría';
  const cta2Link = c.heroCta2Link || '/contacto';

  return (
    <section data-editor-section="home-hero" className="relative bg-[#d88193] text-white overflow-hidden min-h-[580px] flex items-center">

      {/* Official Cover Image Background */}
      <div className="absolute inset-0 z-0">
        <Image
          src={bgImage}
          alt="Portada Oficial USH BY USHUAIA - Colombian Jeans"
          fill
          priority
          className="object-cover object-center lg:object-right scale-100"
        />
        <div
          className="absolute inset-0 z-10"
          style={{
            background: `linear-gradient(to right, ${overlayFrom}, ${overlayVia}80, transparent)`,
          }}
        />
      </div>

      <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28 animate-fadeInUp">
        <div className="max-w-2xl space-y-6">

          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/20 backdrop-blur-md border border-white/40 text-xs font-bold uppercase tracking-widest text-white shadow-sm">
            <Sparkles size={14} className="animate-pulse text-amber-200" />
            <span>{badge}</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-none uppercase drop-shadow-md">
            {headline1} <br />
            <span
              className="text-transparent bg-clip-text"
              style={{ backgroundImage: `linear-gradient(to right, ${g1}, ${g2}, ${g3})` }}
            >
              {headline2}
            </span>
          </h1>

          {subtitle && (
            <p className="text-sm sm:text-base text-white/90 font-light max-w-lg leading-relaxed">
              {subtitle}
            </p>
          )}

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
            <Link
              href={cta1Link}
              className="inline-flex items-center justify-center gap-3 bg-white text-ush-navyDark font-black px-8 py-4 rounded-none shadow-xl tracking-widest text-xs uppercase group hover:bg-neutral-100 transition-all"
            >
              <span>{cta1Text}</span>
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform text-ush-pink" />
            </Link>

            <Link
              href={cta2Link}
              className="inline-flex items-center justify-center gap-2 border-2 border-white text-white font-extrabold px-6 py-4 rounded-none hover:bg-white/10 text-xs uppercase tracking-widest transition-all backdrop-blur-sm shadow-md"
            >
              <ShieldCheck size={18} />
              <span>{cta2Text}</span>
            </Link>
          </div>

        </div>
      </div>
    </section>
  );
};