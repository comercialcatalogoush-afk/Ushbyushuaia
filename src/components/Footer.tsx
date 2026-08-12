'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Mail, MapPin, Phone, Instagram, Facebook, Youtube } from 'lucide-react';

// TikTok icon (not in lucide)
const TikTokIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.22 8.22 0 0 0 4.83 1.56V6.81a4.85 4.85 0 0 1-1.07-.12z"/>
  </svg>
);

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#d88193] text-white border-t border-[#c06579]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">

          {/* Brand Col - Circular Logo */}
          <div className="space-y-3">
            <Link href="/" className="inline-flex items-center gap-3">
              <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-white/60 shadow-sm bg-white p-0.5">
                <Image
                  src="/images/ush-logo.jpg"
                  alt="USH by USHUAIA"
                  fill
                  className="object-cover rounded-full"
                />
              </div>
              <div>
                <p className="text-lg font-black uppercase tracking-widest text-white leading-none">USH</p>
                <p className="text-[9px] tracking-[0.35em] text-white font-bold uppercase mt-0.5 opacity-90">BY USHUAIA</p>
              </div>
            </Link>
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
              <li><Link href="/" className="hover:text-white transition-colors hover:font-semibold">Inicio</Link></li>
              <li><Link href="/como-comprar" className="hover:text-white transition-colors hover:font-semibold">Beneficios Mayoristas</Link></li>
              <li><Link href="/#catalogo" className="hover:text-white transition-colors hover:font-semibold">Catálogo de Productos</Link></li>
              <li><Link href="/contacto" className="hover:text-white transition-colors hover:font-semibold">Contacto Directo</Link></li>
              <li><Link href="/profile" className="hover:text-white transition-colors hover:font-semibold">Iniciar Sesión / Mi Cuenta</Link></li>
              <li><Link href="/politicas" className="hover:text-white transition-colors hover:font-semibold flex items-center gap-1">📋 Políticas y Devoluciones</Link></li>
            </ul>
          </div>

          {/* Contact & Socials */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-white/60 mb-4">
              Contacto y Redes
            </h4>
            <ul className="space-y-3 text-xs text-white/90 font-light mb-6">
              <li className="flex items-center gap-2.5">
                <Mail size={16} className="text-white/70 flex-shrink-0" />
                <a href="mailto:comercialmayoristas@ushuauajeans.com.co" className="hover:underline break-all">
                  comercialmayoristas@ushuauajeans.com.co
                </a>
              </li>
              <li className="flex items-start gap-2.5">
                <MapPin size={16} className="text-white/70 flex-shrink-0 mt-0.5" />
                <span>Itagüí, Antioquia — Colombia</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone size={16} className="text-white/70 flex-shrink-0" />
                <span>+57 302 202 8477</span>
              </li>
            </ul>

            {/* Horario de atención */}
            <div className="bg-white/10 border border-white/20 p-3 mb-4 text-xs">
              <p className="font-bold text-white uppercase tracking-wider mb-1.5">🕐 Horario de Atención</p>
              <p className="text-white/90 font-light">Lun – Jue: <span className="font-bold">7:00 AM – 4:00 PM</span></p>
              <p className="text-white/90 font-light">Viernes: <span className="font-bold">7:00 AM – 3:30 PM</span></p>
              <p className="text-white/60 text-[10px] mt-1">Sábados y domingos no hay atención.</p>
            </div>

            <h5 className="text-[11px] font-bold uppercase tracking-wider text-white/70 mb-3">Síguenos en Redes</h5>
            <div className="flex items-center gap-3 text-white">
              <a href="https://www.instagram.com/ushuaiajeans.co" target="_blank" rel="noopener noreferrer"
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors" title="Instagram">
                <Instagram size={16} />
              </a>
              <a href="https://www.facebook.com/ushuaiajeans" target="_blank" rel="noopener noreferrer"
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors" title="Facebook">
                <Facebook size={16} />
              </a>
              <a href="https://www.tiktok.com/@ushuaiajeans" target="_blank" rel="noopener noreferrer"
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors" title="TikTok">
                <TikTokIcon />
              </a>
              <a href="https://wa.me/573022028477" target="_blank" rel="noopener noreferrer"
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors" title="WhatsApp">
                <Phone size={16} />
              </a>
            </div>
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
          <p className="mt-2 sm:mt-0 text-[11px]">comercialmayoristas@ushuauajeans.com.co | Itagüí, Antioquia</p>
        </div>
      </div>
    </footer>
  );
};
