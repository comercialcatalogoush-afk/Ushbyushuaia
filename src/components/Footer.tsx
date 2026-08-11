'use client';

import React from 'react';
import Link from 'next/link';
import { Mail, MapPin, Phone, Instagram, Facebook } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-neutral-950 text-white border-t border-neutral-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          
          {/* Brand Col */}
          <div className="space-y-4">
            <Link href="/" className="inline-block">
              <div className="flex flex-col">
                <span className="text-3xl font-black tracking-[0.25em] text-white uppercase">
                  USH
                </span>
                <span className="text-xs tracking-[0.4em] text-neutral-400 uppercase -mt-1 font-medium">
                  BY USHUAIA
                </span>
              </div>
            </Link>
            <p className="text-xs text-neutral-400 leading-relaxed font-light">
              Marca líder en confección y distribución mayorista de prendas de vestir en mezclilla rígida. Calidad, tendencia y volumen para distribuidores en Colombia.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-amber-400 mb-4">
              Navegación
            </h4>
            <ul className="space-y-2.5 text-xs text-neutral-300 font-light">
              <li>
                <Link href="/" className="hover:text-white transition-colors">Inicio</Link>
              </li>
              <li>
                <Link href="/como-comprar" className="hover:text-white transition-colors">Beneficios Mayoristas</Link>
              </li>
              <li>
                <Link href="/#catalogo" className="hover:text-white transition-colors">Catálogo de Productos</Link>
              </li>
              <li>
                <Link href="/contacto" className="hover:text-white transition-colors">Contacto Directo</Link>
              </li>
              <li>
                <Link href="/tarjeta-de-regalo" className="hover:text-white transition-colors">Tarjeta de regalo</Link>
              </li>
              <li>
                <Link href="/grupos" className="hover:text-white transition-colors">Grupos</Link>
              </li>
            </ul>
          </div>

          {/* Contact Details (From Wix original footer) */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-amber-400 mb-4">
              Contacto Mayorista
            </h4>
            <ul className="space-y-3 text-xs text-neutral-300 font-light">
              <li className="flex items-center gap-2.5">
                <Mail size={16} className="text-amber-400" />
                <a href="mailto:info@ushbyushuaia.com.co" className="hover:underline">
                  info@ushbyushuaia.com.co
                </a>
              </li>
              <li className="flex items-start gap-2.5">
                <MapPin size={16} className="text-amber-400 flex-shrink-0 mt-0.5" />
                <span>Itagüí, Antioquia - Colombia</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone size={16} className="text-amber-400" />
                <span>Atención a distribuidores</span>
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
                Escala de precios especiales aplicables desde 12 unidades combinadas por pedido.
              </p>
            </div>
            <Link
              href="/contacto"
              className="mt-4 bg-white text-neutral-950 text-[10px] font-extrabold uppercase tracking-widest py-2.5 px-4 text-center hover:bg-amber-400 transition-colors"
            >
              Pedir Asesoría
            </Link>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="mt-12 pt-8 border-t border-neutral-800 flex flex-col sm:flex-row items-center justify-between text-xs text-neutral-500 font-light">
          <p>© {new Date().getFullYear()} USH BY USHUAIA. Todos los derechos reservados.</p>
          <p className="mt-2 sm:mt-0 text-[11px]">info@ushbyushuaia.com.co | Itagüí, Antioquia</p>
        </div>
      </div>
    </footer>
  );
};
