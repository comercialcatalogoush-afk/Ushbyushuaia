'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShoppingBag, Search, User, Menu, X, Settings, ChevronDown, ChevronRight } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { Logo } from './Logo';

export const Header: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [activeSubSubmenu, setActiveSubSubmenu] = useState<boolean>(false);
  const pathname = usePathname();
  const { totalItemsCount, setIsCartOpen } = useCart();

  useEffect(() => {
    const authStatus = sessionStorage.getItem('ush_admin_auth');
    setIsAdminLoggedIn(authStatus === 'true');
  }, [pathname]);

  const jeansFits = ['WIDE LEG', 'BARREL', 'STRAIGHT BOOT', 'VAQUERO', 'BOTA FLARE', 'SKINNY'];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm transition-all duration-200">
      
      {/* ── Top Notice Bar (marquee) ── */}
      <div className="bg-[#d88193] text-white text-[11px] py-1.5 overflow-hidden">
        <div className="flex whitespace-nowrap animate-marquee">
          <span className="px-8 tracking-widest font-bold uppercase">
            45 DÍAS DE GARANTÍA POR DEFECTOS DE FÁBRICA · 15 DÍAS PARA CAMBIOS · ENVÍO GRATIS DESDE 12 UNIDADES · CONFECCIÓN NACIONAL — ITAGÜÍ, ANTIOQUIA ✦
          </span>
          <span className="px-8 tracking-widest font-bold uppercase" aria-hidden="true">
            45 DÍAS DE GARANTÍA POR DEFECTOS DE FÁBRICA · 15 DÍAS PARA CAMBIOS · ENVÍO GRATIS DESDE 12 UNIDADES · CONFECCIÓN NACIONAL — ITAGÜÍ, ANTIOQUIA ✦
          </span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Mobile Menu Button */}
          <div className="flex items-center lg:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-neutral-800 hover:text-ush-pink focus:outline-none"
              aria-label="MenÃº principal"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {/* Logo & Desktop Nav Group */}
          <div className="flex items-center gap-8 lg:gap-10">
            {/* Logo / Brand */}
            <div className="shrink-0">
              <Logo variant="dark" size="md" />
            </div>

            {/* Navigation Links - Desktop */}
            <nav className="hidden lg:flex items-center space-x-6">
            <Link
              href="/"
              className="text-xs uppercase tracking-widest font-bold text-neutral-800 hover:text-ush-pink transition-colors py-2"
            >
              INICIO
            </Link>

            <Link
              href="/catalogo"
              className="text-xs uppercase tracking-widest font-bold text-neutral-800 hover:text-ush-pink transition-colors py-2"
            >
              CATÁLOGO
            </Link>

            {/* MUJER Mega Dropdown */}
            <div
              className="relative group py-2"
              onMouseEnter={() => setActiveDropdown('mujer')}
              onMouseLeave={() => { setActiveDropdown(null); setActiveSubSubmenu(false); }}
            >
              <button
                className="text-xs uppercase tracking-widest font-bold text-neutral-800 hover:text-ush-pink transition-colors flex items-center gap-1 py-1"
              >
                <span>MUJER</span>
                <ChevronDown size={14} className="group-hover:rotate-180 transition-transform" />
              </button>

              {/* Submenu Level 1 */}
              {activeDropdown === 'mujer' && (
                <div className="absolute top-full left-0 bg-white border border-gray-200 shadow-xl w-48 py-2 z-50 animate-fadeIn">
                  <Link
                    href="/catalogo"
                    className="block px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-neutral-700 hover:text-ush-pink hover:bg-rose-50 border-b border-gray-100"
                  >
                    VER TODO
                  </Link>

                  {/* JEANS item with nested sub-submenu */}
                  <div
                    className="relative group/jeans"
                    onMouseEnter={() => setActiveSubSubmenu(true)}
                  >
                    <Link
                      href="/catalogo?categoria=Jeans"
                      className="w-full flex items-center justify-between px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-[#d88193] bg-rose-50/50 hover:bg-rose-50"
                    >
                      <span>JEANS</span>
                      <ChevronRight size={14} />
                    </Link>

                    {/* Submenu Level 2 (Fits) */}
                    {activeSubSubmenu && (
                      <div className="absolute top-0 left-full bg-white border border-gray-200 shadow-xl w-44 py-2 z-50 animate-fadeIn">
                        {jeansFits.map((fit) => (
                          <Link
                            key={fit}
                            href={`/catalogo?categoria=Jeans&fit=${encodeURIComponent(fit)}`}
                            className="block px-4 py-2 text-[10px] font-extrabold uppercase tracking-wider text-neutral-700 hover:text-ush-pink hover:bg-neutral-50"
                          >
                            {fit}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>

                  <Link
                    href="/catalogo?categoria=Pantalones"
                    className="block px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-neutral-700 hover:text-ush-pink hover:bg-neutral-50"
                  >
                    PANTALONES
                  </Link>

                  <Link
                    href="/catalogo?categoria=Cargo"
                    className="block px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-neutral-700 hover:text-ush-pink hover:bg-neutral-50"
                  >
                    CARGOS
                  </Link>

                  <Link
                    href="/catalogo?categoria=Shorts"
                    className="block px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-neutral-700 hover:text-ush-pink hover:bg-neutral-50"
                  >
                    SHORTS
                  </Link>

                  <Link
                    href="/catalogo?categoria=Faldas"
                    className="block px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-neutral-700 hover:text-ush-pink hover:bg-neutral-50"
                  >
                    FALDAS
                  </Link>
                </div>
              )}
            </div>

            <Link
              href="/rebajas"
              className="text-xs uppercase tracking-widest font-bold text-neutral-800 hover:text-ush-pink transition-colors py-2"
            >
              REBAJAS
            </Link>

            <Link
              href="/como-comprar"
              className="text-xs uppercase tracking-widest font-bold text-neutral-800 hover:text-ush-pink transition-colors py-2"
            >
              BENEFICIOS
            </Link>

            <Link
              href="/contacto"
              className="text-xs uppercase tracking-widest font-bold text-neutral-800 hover:text-ush-pink transition-colors py-2"
            >
              CONTACTO
            </Link>

            {isAdminLoggedIn && (
              <Link
                href="/admin"
                className="text-xs uppercase tracking-widest font-extrabold text-[#d88193] hover:underline py-2"
              >
                ADMIN (CATÁLOGO)
              </Link>
            )}
          </nav>
          </div>

          {/* Right Action Icons */}
          <div className="flex items-center space-x-3 sm:space-x-5">
            {/* Search */}
            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="p-2 text-neutral-700 hover:text-ush-pink transition-colors"
              aria-label="Buscar"
            >
              <Search size={20} />
            </button>

            {/* Admin button if logged in */}
            {isAdminLoggedIn && (
              <Link
                href="/admin"
                className="p-2 text-ush-pink hover:text-ush-pinkHover transition-colors hidden sm:block font-bold"
                title="Editar CatÃ¡logo (Admin)"
              >
                <Settings size={20} />
              </Link>
            )}

            {/* Login / User */}
            <Link
              href="/profile"
              className="p-2 text-neutral-700 hover:text-ush-pink transition-colors hidden sm:flex items-center gap-1 text-xs font-semibold uppercase tracking-wider"
            >
              <User size={20} />
              <span className="hidden xl:inline">Mi Cuenta</span>
            </Link>

            {/* Cart Drawer Toggle */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="p-2 text-white bg-ush-pink hover:bg-ush-pinkHover transition-transform active:scale-95 flex items-center gap-2 px-3.5 py-2 rounded-full shadow-sm"
              aria-label="Carrito de compras"
            >
              <ShoppingBag size={18} />
              <span className="text-xs font-black">{totalItemsCount}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Expandable Search Input */}
      {isSearchOpen && (
        <div className="bg-ush-pinkLight border-t border-b border-rose-200 py-3 px-4 transition-all">
          <div className="max-w-3xl mx-auto flex items-center gap-2">
            <Search size={18} className="text-[#d88193]" />
            <input
              type="text"
              placeholder="Buscar por referencia (Ej: 556218, 558077, Jean, Short)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent text-xs focus:outline-none text-neutral-900 placeholder-gray-500 font-medium"
              autoFocus
            />
            <button
              onClick={() => setIsSearchOpen(false)}
              className="text-xs text-gray-500 hover:text-black font-bold uppercase tracking-wider px-2"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* Mobile Navigation Drawer */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-gray-200 px-4 pt-2 pb-6 space-y-3">
          <Link
            href="/"
            onClick={() => setIsMobileMenuOpen(false)}
            className="block text-sm font-bold uppercase tracking-wider text-neutral-800 hover:text-ush-pink py-2 border-b border-gray-50"
          >
            INICIO
          </Link>
          <Link
            href="/catalogo"
            onClick={() => setIsMobileMenuOpen(false)}
            className="block text-sm font-bold uppercase tracking-wider text-neutral-800 hover:text-ush-pink py-2 border-b border-gray-50"
          >
            CATÁLOGO
          </Link>
          <Link
            href="/catalogo"
            onClick={() => setIsMobileMenuOpen(false)}
            className="block text-sm font-bold uppercase tracking-wider text-neutral-800 hover:text-ush-pink py-2 border-b border-gray-50"
          >
            MUJER â€” JEANS / SHORTS / FALDAS
          </Link>
          <Link
            href="/rebajas"
            onClick={() => setIsMobileMenuOpen(false)}
            className="block text-sm font-bold uppercase tracking-wider text-neutral-800 hover:text-ush-pink py-2 border-b border-gray-50"
          >
            REBAJAS
          </Link>
          <Link
            href="/como-comprar"
            onClick={() => setIsMobileMenuOpen(false)}
            className="block text-sm font-bold uppercase tracking-wider text-neutral-800 hover:text-ush-pink py-2 border-b border-gray-50"
          >
            BENEFICIOS MAYORISTAS
          </Link>
          <Link
            href="/contacto"
            onClick={() => setIsMobileMenuOpen(false)}
            className="block text-sm font-bold uppercase tracking-wider text-neutral-800 hover:text-ush-pink py-2 border-b border-gray-50"
          >
            CONTACTO
          </Link>
          <div className="pt-2 flex items-center justify-between text-xs text-neutral-600">
            <Link
              href="/profile"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center gap-2 text-ush-navy font-bold uppercase"
            >
              <User size={18} /> Iniciar SesiÃ³n / Mi Cuenta
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};
