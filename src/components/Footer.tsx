'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Mail, MapPin, Phone, Settings } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-ush-navyDark text-white border-t border-neutral-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          
          {/* Brand Col */}
          <div className="space-y-4">
            <Link href="/" className="inline-block">
              <div className="relative w-40 h-14 bg-white/10 p-2 rounded">
                <Image
                  src="/images/ush-logo.jpg"
                  alt="USH by USHUAIA"
                  fill
                  className="object-contain"
                />
              </div>
            </Link>
            <p className="text-xs text-neutral-400 leading-relaxed font-light">
              Marca líder en confección y distribución mayorista de prendas en mezclilla rígida. Calidad, tendencia y volumen para tiendas y distribuidores en Colombia.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-ush-pink mb-4">
              Navegación
            </h4>
            <ul className="space-y-2.5 text-xs text-neutral-300 font-light">
              <li>
                <Link href="/" className="hover:text-ush-pink transition-colors">Inicio</Link>
              </li>
              <li>
                <Link href="/como-comprar" className="hover:text-ush-pink transition-colors">Beneficios Mayoristas</Link>
              </li>
              <li>
                <Link href="/#catalogo" className="hover:text-ush-pink transition-colors">Catálogo de Productos</Link>
              </li>
              <li>
                <Link href="/contacto" className="hover:text-ush-pink transition-colors">Contacto Directo</Link>
              </li>
              <li>
                <Link href="/grupos" className="hover:text-ush-pink transition-colors">Grupos VIP Mayoristas</Link>
              </li>
              <li>
                <Link href="/admin" className="hover:text-ush-pink transition-colors flex items-center gap-1 font-semibold text-amber-400">
                  <Settings size={12} /> Editar Catálogo (Admin)
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Details */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-ush-pink mb-4">
              Contacto Mayorista
            </h4>
            <ul className="space-y-3 text-xs text-neutral-300 font-light">
              <li className="flex items-center gap-2.5">
                <Mail size={16} className="text-ush-pink" />
                <a href="mailto:info@ushbyushuaia.com.co" className="hover:underline">
                  info@ushbyushuaia.com.co
                </a>
              </li>
              <li className="flex items-start gap-2.5">
                <MapPin size={16} className="text-ush-pink flex-shrink-0 mt-0.5" />
                <span>Itagüí, Antioquia - Colombia</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone size={16} className="text-ush-pink" />
                <span>Atención directa a distribuidores</span>
              </li>
            </ul>
          </div>

          {/* Wholesale Notice */}
          <div className="bg-neutral-900 p-6 border border-neutral-800 flex flex-col justify-between">
            <div>
              <h5 className="text-xs font-bold uppercase tracking-wider text-white mb-2">
                Atención a Mayoristas
              </h5>
              <p className="text-[11px] text-neutral-400 leading-normal font-light">
                Escala de precios especiales aplicables a partir de 12 unidades combinadas por pedido.
              </p>
            </div>
            <Link
              href="/contacto"
              className="mt-4 bg-ush-pink hover:bg-ush-pinkHover text-white text-[10px] font-black uppercase tracking-widest py-2.5 px-4 text-center transition-colors"
            >
              Pedir Asesoría
            </Link>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="mt-12 pt-8 border-t border-neutral-800 flex flex-col sm:flex-row items-center justify-between text-xs text-neutral-500 font-light">
          <p>© {new Date().getFullYear()} USH BY USHUAIA. Marca Tu Identidad. Todos los derechos reservados.</p>
          <p className="mt-2 sm:mt-0 text-[11px]">info@ushbyushuaia.com.co | Itagüí, Antioquia</p>
        </div>
      </div>
    </footer>
  );
};
