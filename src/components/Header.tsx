'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ShoppingBag, Search, User, Menu, X, Settings, ChevronDown, ChevronRight, Sparkles, CalendarClock } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { supabase } from '@/lib/supabase';
import { useSiteTheme } from '@/lib/siteContentHooks';
import { Logo } from './Logo';

export const Header: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [activeSubSubmenu, setActiveSubSubmenu] = useState<boolean>(false);
  const [comingSoonSection, setComingSoonSection] = useState<string | null>(null);
  const pathname = usePathname();
  const router = useRouter();
  const { totalItemsCount, setIsCartOpen } = useCart();
  const theme = useSiteTheme();

  useEffect(() => {
    const ADMIN_EMAIL = 'comercialmayoristas@ushuaiajeans.com.co';
    const sync = (session: any) => {
      const user = session?.user;
      setIsAdminLoggedIn(!!user && user.email && user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase());
    };
    supabase.auth.getSession().then(({ data }) => sync(data.session));
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => sync(session));
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [pathname]);

  const jeansFits = ['WIDE LEG', 'BARREL', 'STRAIGHT BOOT', 'VAQUERO', 'BOTA FLARE', 'SKINNY', 'MOM'];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;
    router.push(`/catalogo?buscar=${encodeURIComponent(q)}`);
    setIsSearchOpen(false);
    setSearchQuery('');
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm transition-all duration-200">
      
      {/* ── Top Notice Bar (marquee) ── */}
      <div className="bg-[#d88193] text-white text-[11px] py-1.5 overflow-hidden">
        <div className="flex whitespace-nowrap animate-marquee">
          <span className="px-8 tracking-widest font-bold uppercase">
            {theme.topNoticeText}
          </span>
          <span className="px-8 tracking-widest font-bold uppercase" aria-hidden="true">
            {theme.topNoticeText}
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
              aria-label="Menú principal"
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

            <button
              onClick={() => { setComingSoonSection('TEENS'); setActiveDropdown(null); }}
              className="text-xs uppercase tracking-widest font-bold text-neutral-800 hover:text-ush-pink transition-colors py-2 flex items-center gap-1.5"
            >
              TEENS
              <Sparkles size={12} className="text-[#d88193]" />
            </button>

            <button
              onClick={() => { setComingSoonSection('HOMBRES'); setActiveDropdown(null); }}
              className="text-xs uppercase tracking-widest font-bold text-neutral-800 hover:text-ush-pink transition-colors py-2 flex items-center gap-1.5"
            >
              HOMBRES
              <Sparkles size={12} className="text-[#d88193]" />
            </button>

            <Link
              href="/como-comprar"
              className="text-xs uppercase tracking-widest font-bold text-neutral-800 hover:text-ush-pink transition-colors py-2"
            >
              BENEFICIOS
            </Link>

            <Link
              href="/rastreo"
              className="text-xs uppercase tracking-widest font-bold text-neutral-800 hover:text-ush-pink transition-colors py-2"
            >
              RASTREAR
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
                title="Editar Catálogo (Admin)"
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
          <form onSubmit={handleSearch} className="max-w-3xl mx-auto flex items-center gap-2">
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
              type="submit"
              className="text-xs bg-[#1b2333] text-white font-bold uppercase tracking-wider px-3 py-1.5 hover:bg-ush-pink transition-colors"
            >
              Buscar
            </button>
            <button
              type="button"
              onClick={() => setIsSearchOpen(false)}
              className="text-xs text-gray-500 hover:text-black font-bold uppercase tracking-wider px-2"
            >
              Cerrar
            </button>
          </form>
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
            MUJER — JEANS / SHORTS / FALDAS
          </Link>
          <button
            onClick={() => { setIsMobileMenuOpen(false); setComingSoonSection('TEENS'); }}
            className="block text-sm font-bold uppercase tracking-wider text-neutral-800 hover:text-ush-pink py-2 border-b border-gray-50 flex items-center gap-2"
          >
            TEENS <Sparkles size={13} className="text-[#d88193]" />
          </button>
          <button
            onClick={() => { setIsMobileMenuOpen(false); setComingSoonSection('HOMBRES'); }}
            className="block text-sm font-bold uppercase tracking-wider text-neutral-800 hover:text-ush-pink py-2 border-b border-gray-50 flex items-center gap-2"
          >
            HOMBRES <Sparkles size={13} className="text-[#d88193]" />
          </button>
          <Link
            href="/como-comprar"
            onClick={() => setIsMobileMenuOpen(false)}
            className="block text-sm font-bold uppercase tracking-wider text-neutral-800 hover:text-ush-pink py-2 border-b border-gray-50"
          >
            BENEFICIOS MAYORISTAS
          </Link>
          <Link
            href="/rastreo"
            onClick={() => setIsMobileMenuOpen(false)}
            className="block text-sm font-bold uppercase tracking-wider text-neutral-800 hover:text-ush-pink py-2 border-b border-gray-50"
          >
            RASTREAR PEDIDO
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
              <User size={18} /> Iniciar Sesión / Mi Cuenta
            </Link>
          </div>
        </div>
      )}

      {/* ── Modal "Próximamente" (TEENS / HOMBRES) ── */}
      {comingSoonSection && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-[#1b2333]/60 backdrop-blur-sm p-4"
          onClick={() => setComingSoonSection(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="relative bg-white max-w-md w-full max-h-[85vh] overflow-y-auto p-6 sm:p-8 text-center shadow-2xl animate-fadeIn border-t-4 border-[#d88193]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setComingSoonSection(null)}
              className="absolute top-3 right-3 p-1.5 text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 rounded-full transition-colors"
              aria-label="Cerrar"
            >
              <X size={18} />
            </button>

            <div className="mx-auto w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-rose-50 text-[#d88193] flex items-center justify-center animate-float">
              <CalendarClock size={28} className="sm:w-[30px] sm:h-[30px]" />
            </div>

            <p className="mt-4 text-[10px] font-black uppercase tracking-[0.3em] text-[#d88193]">
              Próximamente
            </p>

            <h3 className="mt-1.5 text-2xl sm:text-3xl font-black uppercase tracking-tight text-[#1b2333]">
              Colección <span className="text-gradient-pink">{comingSoonSection}</span>
            </h3>

            <p className="mt-3 text-sm text-neutral-500 font-light leading-relaxed">
              Estamos confeccionando con mucho amor y mezclilla rígida de alta calidad una colección exclusiva para <strong className="text-neutral-800">{comingSoonSection.toLowerCase()}</strong>.
              ¡Muy pronto estará disponible con precios mayoristas y envíos a todo Colombia!
            </p>

            <div className="mt-5 flex items-center justify-center gap-2 text-[11px] font-bold uppercase tracking-widest text-neutral-400">
              <Sparkles size={13} className="text-[#d88193]" />
              <span>USH BY USHUAIA · Hecho en Itagüí, Antioquia</span>
              <Sparkles size={13} className="text-[#d88193]" />
            </div>

            <Link
              href="/catalogo"
              onClick={() => setComingSoonSection(null)}
              className="mt-6 inline-block w-full bg-[#1b2333] text-white text-xs font-bold uppercase tracking-widest px-8 py-4 hover:bg-[#d88193] transition-colors shadow-md"
            >
              Explorar colección Mujer →
            </Link>
          </div>
        </div>,
        document.body
      )}
    </header>
  );
};
