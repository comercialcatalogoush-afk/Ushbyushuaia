'use client';

import React from 'react';
import { MapPin, Clock, Store, ArrowUpRight, Video } from 'lucide-react';

const OUTLET = {
  name: 'Outlet USH BY USHUAIA',
  tag: 'Principal · Atención Mayorista',
  address: 'Cll. 85 Sur #50-72, Itagüí, Antioquia',
  schedule: 'Lunes a Viernes: 8:00 AM – 5:30 PM',
  mapUrl: 'https://maps.google.com/?q=Cll+85+Sur+%2350-72,+Itagui',
  phone: '+57 302 202 8477',
  whatsapp: 'https://wa.me/573022028477',
  videoUrl: '',
  poster: '',
};

export const OutletSection: React.FC = () => {
  return (
    <section id="outlet" className="scroll-mt-20 bg-[#FDF8F4] border-y border-[#e8d9c8] overflow-hidden relative">
      {/* Decorative */}
      <div className="pointer-events-none absolute -top-16 -right-16 w-64 h-64 bg-[#c49a6c]/10 rounded-full blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-16 w-72 h-72 bg-[#d88193]/10 rounded-full blur-3xl" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20 relative">
        {/* Section Header — estilo Talitha */}
        <div className="text-center mb-10">
          <span className="text-[11px] font-sans-ui font-semibold uppercase tracking-[0.35em] text-[#c49a6c]">
            Visítanos
          </span>
          <h2 className="font-serif-display text-4xl sm:text-5xl font-normal text-[#1b2333] tracking-tight mt-2">
            Nuestro <em className="text-[#c49a6c]">Outlet</em>
          </h2>
          <div className="flex items-center justify-center gap-3 mt-4">
            <span className="h-px w-16 bg-[#c49a6c]/40" />
            <span className="text-[#c49a6c] text-sm">✦</span>
            <span className="h-px w-16 bg-[#c49a6c]/40" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
          {/* ── Tarjeta 1: Video / Media del Outlet ── */}
          <article className="bg-white border border-[#e8d9c8] shadow-[0_20px_50px_-20px_rgba(196,154,108,0.35)] overflow-hidden flex flex-col">
            <div className="relative aspect-video bg-[#1b2333]">
              {OUTLET.videoUrl ? (
                <video
                  className="w-full h-full object-cover"
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="none"
                  poster={OUTLET.poster || undefined}
                >
                  <source src={OUTLET.videoUrl} type="video/mp4" />
                </video>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 bg-gradient-to-br from-[#1b2333] to-[#2c3547]">
                  <div className="w-16 h-16 rounded-full border border-[#c49a6c]/40 bg-[#c49a6c]/10 flex items-center justify-center mb-4">
                    <Video size={26} className="text-[#c49a6c]" />
                  </div>
                  <p className="font-serif-display text-2xl text-white/90 italic">Nuestro Outlet en video</p>
                  <p className="font-sans-ui text-[11px] text-white/50 uppercase tracking-widest mt-2">
                    Próximamente
                  </p>
                </div>
              )}
              <div className="absolute inset-0 bg-black/10" />
            </div>
            <div className="p-6 flex flex-col flex-1">
              <h3 className="font-serif-display text-2xl text-[#1b2333]">{OUTLET.name}</h3>
              <p className="font-sans-ui text-[11px] font-bold uppercase tracking-widest text-[#c49a6c] mt-1">
                {OUTLET.tag}
              </p>

              <div className="mt-5 space-y-3 font-sans-ui text-sm text-neutral-700">
                <div className="flex items-start gap-3">
                  <MapPin size={18} className="text-[#c49a6c] flex-shrink-0 mt-0.5" />
                  <span>{OUTLET.address}</span>
                </div>
                <div className="flex items-start gap-3">
                  <Clock size={18} className="text-[#c49a6c] flex-shrink-0 mt-0.5" />
                  <span>{OUTLET.schedule}</span>
                </div>
                <div className="flex items-start gap-3">
                  <Store size={18} className="text-[#c49a6c] flex-shrink-0 mt-0.5" />
                  <span>Despacho mayorista y recogida en bodega con cita previa.</span>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <a
                  href={OUTLET.mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-[#1b2333] text-white font-sans-ui text-[11px] font-bold uppercase tracking-widest px-5 py-3 hover:bg-[#c49a6c] transition-colors"
                >
                  Ver en Mapa <ArrowUpRight size={14} />
                </a>
                <a
                  href={OUTLET.whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-transparent border border-[#1b2333] text-[#1b2333] font-sans-ui text-[11px] font-bold uppercase tracking-widest px-5 py-3 hover:border-[#c49a6c] hover:text-[#c49a6c] transition-colors"
                >
                  Agendar Visita
                </a>
              </div>
            </div>
          </article>

          {/* ── Tarjeta 2: Horario + Teléfono ── */}
          <article className="bg-white border border-[#e8d9c8] shadow-[0_20px_50px_-20px_rgba(196,154,108,0.35)] overflow-hidden flex flex-col">
            <div className="p-6 sm:p-8 flex flex-col flex-1">
              <span className="font-sans-ui text-[11px] font-semibold uppercase tracking-[0.3em] text-[#c49a6c]">
                Horario de Atención
              </span>
              <h3 className="font-serif-display text-3xl sm:text-4xl text-[#1b2333] mt-2">
                Lunes a <em className="text-[#c49a6c]">Viernes</em>
              </h3>

              <div className="mt-6 bg-[#FDF8F4] border border-[#e8d9c8] p-6">
                <div className="flex items-center justify-between font-sans-ui">
                  <span className="text-sm font-semibold text-neutral-800 uppercase tracking-wider">Apertura</span>
                  <span className="font-serif-display text-3xl text-[#1b2333]">8:00 AM</span>
                </div>
                <div className="my-4 border-t border-dashed border-[#c49a6c]/40" />
                <div className="flex items-center justify-between font-sans-ui">
                  <span className="text-sm font-semibold text-neutral-800 uppercase tracking-wider">Cierre</span>
                  <span className="font-serif-display text-3xl text-[#1b2333]">5:30 PM</span>
                </div>
                <p className="font-sans-ui text-[11px] text-neutral-500 mt-4">
                  Sábados, domingos y festivos no hay atención presencial.
                </p>
              </div>

              <div className="mt-auto pt-8">
                <p className="font-sans-ui text-[11px] font-semibold uppercase tracking-widest text-neutral-500 mb-2">
                  Línea Comercial Mayorista
                </p>
                <a
                  href={`tel:${OUTLET.phone.replace(/\s/g, '')}`}
                  className="font-serif-display text-3xl sm:text-4xl text-[#1b2333] hover:text-[#c49a6c] transition-colors"
                >
                  {OUTLET.phone}
                </a>
                <p className="font-sans-ui text-xs text-neutral-500 mt-3 leading-relaxed">
                  Escríbenos por WhatsApp para coordinar tu visita, despacho o asesoría comercial personalizada.
                </p>
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
};