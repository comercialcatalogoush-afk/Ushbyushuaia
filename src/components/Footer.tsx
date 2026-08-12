'use client';

import React from 'react';
import Link from 'next/link';
import { Logo } from './Logo';
import { Mail, MapPin, Phone, Instagram, Facebook, Shield, FileText, MessageCircle } from 'lucide-react';

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

          {/* Brand Col - Official Logo */}
          <div className="space-y-3">
            <Logo variant="light" size="md" />
            <p className="text-xs text-white/80 leading-relaxed font-light">
              Marca líder en confección y distribución mayorista de prendas en mezclilla rígida. Calidad, tendencia y volumen para tiendas y distribuidores en Colombia.
            </p>
            {/* Social Icons */}
            <div className="flex items-center gap-3 text-white pt-2">
              <a href="https://www.instagram.com/ushuaiajeans.co" target="_blank" rel="noopener noreferrer"
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center transition-colors" title="Instagram">
                <Instagram size={16} />
              </a>
              <a href="https://www.facebook.com/ushuaiajeans" target="_blank" rel="noopener noreferrer"
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center transition-colors" title="Facebook">
                <Facebook size={16} />
              </a>
              <a href="https://www.tiktok.com/@ushuaiajeans" target="_blank" rel="noopener noreferrer"
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center transition-colors" title="TikTok">
                <TikTokIcon />
              </a>
              <a href="https://wa.me/573022028477" target="_blank" rel="noopener noreferrer"
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center transition-colors" title="WhatsApp">
                <MessageCircle size={16} />
              </a>
            </div>
          </div>

          {/* Quick Links + Legal */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-white/60 mb-4">
              Navegación
            </h4>
            <ul className="space-y-2.5 text-xs text-white/90 font-light">
              <li><Link href="/" className="hover:text-white transition-colors hover:font-semibold">Inicio</Link></li>
              <li><Link href="/como-comprar" className="hover:text-white transition-colors hover:font-semibold">Beneficios Mayoristas</Link></li>
              <li><Link href="/#catalogo" className="hover:text-white transition-colors hover:font-semibold">Catálogo de Productos</Link></li>
              <li><Link href="/contacto" className="hover:text-white transition-colors hover:font-semibold">Contacto Directo</Link></li>
            </ul>

            <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-white/60 mb-4 mt-6">
              Legal y Políticas
            </h4>
            <ul className="space-y-2.5 text-xs text-white/90 font-light">
              <li>
                <Link href="/politicas" className="hover:text-white transition-colors hover:font-semibold flex items-center gap-1.5">
                  <FileText size={12} className="text-white/60 shrink-0" />
                  Políticas de Cambios y Devoluciones
                </Link>
              </li>
              <li>
                <Link href="/politicas#habeas-data" className="hover:text-white transition-colors hover:font-semibold flex items-center gap-1.5">
                  <Shield size={12} className="text-white/60 shrink-0" />
                  Privacidad y Habeas Data
                </Link>
              </li>
              <li>
                <Link href="/politicas#terminos" className="hover:text-white transition-colors hover:font-semibold flex items-center gap-1.5">
                  <FileText size={12} className="text-white/60 shrink-0" />
                  Términos y Condiciones Mayorista
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-white/60 mb-4">
              Contacto
            </h4>
            <ul className="space-y-3 text-xs text-white/90 font-light mb-5">
              <li className="flex items-center gap-2.5">
                <Mail size={15} className="text-white/70 flex-shrink-0" />
                <a href="mailto:comercialmayoristas@ushuauajeans.com.co" className="hover:underline break-all">
                  comercialmayoristas@ushuauajeans.com.co
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone size={15} className="text-white/70 flex-shrink-0" />
                <a href="tel:+573022028477" className="hover:underline">+57 302 202 8477</a>
              </li>
              <li className="flex items-center gap-2.5">
                <MessageCircle size={15} className="text-white/70 flex-shrink-0" />
                <a href="https://wa.me/573022028477" target="_blank" rel="noopener noreferrer" className="hover:underline">
                  WhatsApp Comercial
                </a>
              </li>
              <li className="flex items-start gap-2.5">
                <MapPin size={15} className="text-white/70 flex-shrink-0 mt-0.5" />
                <span>Cll. 85 Sur #50-72, Itagüí,<br />Antioquia — Colombia</span>
              </li>
            </ul>

            {/* Business hours */}
            <div className="bg-white/10 border border-white/20 p-3 text-xs">
              <p className="font-bold text-white uppercase tracking-wider mb-1.5">🕐 Horario de Atención</p>
              <p className="text-white/90 font-light">Lun – Jue: <span className="font-bold">7:00 AM – 4:00 PM</span></p>
              <p className="text-white/90 font-light">Viernes: <span className="font-bold">7:00 AM – 3:30 PM</span></p>
              <p className="text-white/60 text-[10px] mt-1">Sábados y domingos no hay atención.</p>
            </div>
          </div>

          {/* Wholesale Notice */}
          <div className="bg-white/10 p-6 border border-white/20 backdrop-blur-sm flex flex-col justify-between">
            <div>
              <h5 className="text-xs font-bold uppercase tracking-wider text-white mb-2">
                Atención a Mayoristas
              </h5>
              <p className="text-[11px] text-white/80 leading-normal font-light mb-3">
                Escala de precios especiales aplicables a partir de 12 unidades combinadas por pedido. Envío gratis incluido.
              </p>
              <ul className="space-y-1.5 text-[11px] text-white/80 font-light">
                <li>✓ Garantía 45 días por defectos de fábrica</li>
                <li>✓ Cambios en 15 días</li>
                <li>✓ Asesoría comercial directa</li>
              </ul>
            </div>
            <Link
              href="/contacto"
              className="mt-5 bg-white text-[#c06579] hover:bg-white/90 text-[10px] font-black uppercase tracking-widest py-2.5 px-4 text-center transition-colors"
            >
              Pedir Asesoría
            </Link>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="mt-12 pt-8 border-t border-white/20 flex flex-col sm:flex-row items-center justify-between text-xs text-white/60 font-light gap-2">
          <p>© {new Date().getFullYear()} USH BY USHUAIA. Marca Tu Identidad. Todos los derechos reservados.</p>
          <div className="flex items-center gap-4 text-[11px] flex-wrap justify-center">
            <Link href="/politicas#habeas-data" className="hover:text-white transition-colors">Habeas Data</Link>
            <Link href="/politicas#terminos" className="hover:text-white transition-colors">Términos Mayorista</Link>
            <span>Itagüí, Antioquia · Colombia</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
