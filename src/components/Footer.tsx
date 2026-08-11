'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Mail, MapPin, Phone } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#d88193] text-white border-t border-[#c06579]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">

          {/* Brand Col - Circular Logo */}
          <div className="space-y-4">
            <Link href="/" className="inline-block">
              <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-white/50 shadow-md bg-white/10 p-1">
                <Image
                  src="/images/ush-logo.jpg"
                  alt="USH by USHUAIA"
                  fill
                  className="object-contain rounded-full p-0.5"
                />
              </div>
            </Link>
            <div>
              <p className="text-base font-black uppercase tracking-widest text-white">USH</p>
              <p className="text-[10px] tracking-[0.35em] text-white/80 font-bold uppercase">BY USHUAIA</p>
            </div>
            <p className="text-xs text-white/80 leading-relaxed font-light">
              Marca líder en confección y distribución mayorista de prendas en mezclilla rígida. Calidad, tendencia y volumen para tiendas y distribuidores en Colombia.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-white/60 mb-4">
              Navegación
            </h4>
            <ul className="space-y-2.5 text-xs text-white/90 font-light">
              <li>
                <Link href="/" className="hover:text-white transition-colors hover:font-semibold">Inicio</Link>
              </li>
              <li>
                <Link href="/como-comprar" className="hover:text-white transition-colors hover:font-semibold">Beneficios Mayoristas</Link>
              </li>
              <li>
                <Link href="/#catalogo" className="hover:text-white transition-colors hover:font-semibold">Catálogo de Productos</Link>
              </li>
              <li>
                <Link href="/contacto" className="hover:text-white transition-colors hover:font-semibold">Contacto Directo</Link>
              </li>
              <li>
                <Link href="/profile" className="hover:text-white transition-colors hover:font-semibold">Iniciar Sesión / Mi Cuenta</Link>
              </li>
            </ul>
          </div>

          {/* Contact Details */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-white/60 mb-4">
              Contacto Mayorista
            </h4>
            <ul className="space-y-3 text-xs text-white/90 font-light">
              <li className="flex items-center gap-2.5">
                <Mail size={16} className="text-white/70 flex-shrink-0" />
                <a href="mailto:info@ushbyushuaia.com.co" className="hover:underline">
                  info@ushbyushuaia.com.co
                </a>
              </li>
              <li className="flex items-start gap-2.5">
                <MapPin size={16} className="text-white/70 flex-shrink-0 mt-0.5" />
                <span>Itagüí, Antioquia — Colombia</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone size={16} className="text-white/70 flex-shrink-0" />
                <span>Atención directa a distribuidores</span>
              </li>
            </ul>
          </div>

          {/* Wholesale Notice */}
          <div className="bg-white/10 p-6 border border-white/20 backdrop-blur-sm flex flex-col justify-between">
            <div>
              <h5 className="text-xs font-bold uppercase tracking-wider text-white mb-2">
                Atención a Mayoristas
              </h5>
              <p className="text-[11px] text-white/80 leading-normal font-light">
                Escala de precios especiales aplicables a partir de 12 unidades combinadas por pedido. Envío gratis incluido.
              </p>
            </div>
            <Link
              href="/contacto"
              className="mt-4 bg-white text-[#c06579] hover:bg-white/90 text-[10px] font-black uppercase tracking-widest py-2.5 px-4 text-center transition-colors"
            >
              Pedir Asesoría
            </Link>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="mt-12 pt-8 border-t border-white/20 flex flex-col sm:flex-row items-center justify-between text-xs text-white/60 font-light">
          <p>© {new Date().getFullYear()} USH BY USHUAIA. Marca Tu Identidad. Todos los derechos reservados.</p>
          <p className="mt-2 sm:mt-0 text-[11px]">info@ushbyushuaia.com.co | Itagüí, Antioquia</p>
        </div>
      </div>
    </footer>
  );
};
