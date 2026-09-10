'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Search, User, Menu, X, Settings, ChevronDown, ChevronRight, Sparkles } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { supabase } from '@/lib/supabase';
import { useSiteTheme } from '@/lib/siteContentHooks';
import { Logo } from './Logo';

export const Header: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileMujerOpen, setIsMobileMujerOpen] = useState(false);
  const [isMobileJeansOpen, setIsMobileJeansOpen] = useState(false);
  const [isMobilePantalonesOpen, setIsMobilePantalonesOpen] = useState(false);
  const [isMobileHombreOpen, setIsMobileHombreOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { setIsCartOpen } = useCart();
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

  // Los nombres deben corresponder a los valores de fit presentes en Supabase.
  // "BOTA FLARE" se conserva como etiqueta comercial y CatalogGrid lo normaliza a "Flare".
  const jeansFits = ['WIDE LEG', 'BARREL', 'STRAIGHT BOOT', 'VAQUERO', 'STRAIGHT', 'BOTA FLARE', 'SKINNY', 'MOM'];
  const pantalonesFits = ['WIDE LEG', 'STRAIGHT', 'STRAIGHT BOOT', 'VAQUERO', 'BOTA FLARE', 'SKINNY', 'CARGO'];

  // HOMBRES: menú principal hacia el catálogo filtrado por género.
  const hombreLinks = [
    ['VER TODO', '/catalogo?genero=hombre'],
    ['CAMISAS', '/catalogo?genero=hombre&categoria=Camisas'],
    ['JEANS', '/catalogo?genero=hombre&categoria=Jeans'],
    ['PANTALONES', '/catalogo?genero=hombre&categoria=Pantalones'],
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;
    router.push(`/catalogo?buscar=${encodeURIComponent(q)}`);
    setIsSearchOpen(false);
    setSearchQuery('');
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
    setIsMobileMujerOpen(false);
    setIsMobileJeansOpen(false);
    setIsMobilePantalonesOpen(false);
    setIsMobileHombreOpen(false);
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
              onClick={() => isMobileMenuOpen ? closeMobileMenu() : setIsMobileMenuOpen(true)}
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
            <div className="relative group/mujer py-2">
              <button
                className="text-xs uppercase tracking-widest font-bold text-neutral-800 hover:text-ush-pink transition-colors flex items-center gap-1 py-1"
              >
                <span>MUJER</span>
                <ChevronDown size={14} className="group-hover/mujer:rotate-180 transition-transform" />
              </button>

              {/* Submenu Level 1 */}
              <div className="absolute top-full left-0 bg-white border border-gray-200 shadow-xl w-48 py-2 z-50 invisible opacity-0 translate-y-1 group-hover/mujer:visible group-hover/mujer:opacity-100 group-hover/mujer:translate-y-0 transition-all duration-150">
                <Link
                  href="/catalogo"
                  className="block px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-neutral-700 hover:text-ush-pink hover:bg-rose-50 border-b border-gray-100"
                >
                  VER TODO
                </Link>

                {/* JEANS item with nested fits submenu */}
                <div className="relative group/jeans">
                  <Link
                    href="/catalogo?categoria=Jeans"
                    className="w-full flex items-center justify-between px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-[#d88193] bg-rose-50/50 hover:bg-rose-50"
                  >
                    <span>JEANS</span>
                    <ChevronRight size={14} />
                  </Link>

                  {/* Submenu Level 2 (Fits) */}
                  <div className="absolute top-0 left-full bg-white border border-gray-200 shadow-xl w-44 py-2 z-50 invisible opacity-0 group-hover/jeans:visible group-hover/jeans:opacity-100 transition-all duration-150">
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
                </div>

                {/* PANTALONES item with nested fits submenu */}
                <div className="relative group/pantalones">
                  <Link
                    href="/catalogo?categoria=Pantalones"
                    className="w-full flex items-center justify-between px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-neutral-700 hover:text-ush-pink hover:bg-neutral-50"
                  >
                    <span>PANTALONES</span>
                    <ChevronRight size={14} />
                  </Link>

                  {/* Submenu Level 2 (Fits) */}
                  <div className="absolute top-0 left-full bg-white border border-gray-200 shadow-xl w-44 py-2 z-50 invisible opacity-0 group-hover/pantalones:visible group-hover/pantalones:opacity-100 transition-all duration-150">
                    {pantalonesFits.map((fit) => (
                      <Link
                        key={fit}
                        href={`/catalogo?categoria=Pantalones&fit=${encodeURIComponent(fit)}`}
                        className="block px-4 py-2 text-[10px] font-extrabold uppercase tracking-wider text-neutral-700 hover:text-ush-pink hover:bg-neutral-50"
                      >
                        {fit}
                      </Link>
                    ))}
                  </div>
                </div>

                <Link
                  href="/catalogo?categoria=Cargos"
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

                <Link
                  href="/catalogo?categoria=Bermudas"
                  className="block px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-neutral-700 hover:text-ush-pink hover:bg-neutral-50"
                >
                  BERMUDAS
                </Link>
              </div>
            </div>

            <Link
              href="/catalogo?categoria=TEENS"
              className="text-xs uppercase tracking-widest font-bold text-neutral-800 hover:text-ush-pink transition-colors py-2 flex items-center gap-1.5"
            >
              TEENS
              <Sparkles size={12} className="text-[#d88193]" />
            </Link>

            {/* HOMBRES Mega Dropdown */}
            <div className="relative group/hombre py-2">
              <button
                className="text-xs uppercase tracking-widest font-bold text-neutral-800 hover:text-ush-pink transition-colors flex items-center gap-1 py-1"
              >
                <span>HOMBRES</span>
                <ChevronDown size={14} className="group-hover/hombre:rotate-180 transition-transform" />
              </button>

              {/* Submenu */}
              <div className="absolute top-full left-0 bg-white border border-gray-200 shadow-xl w-48 py-2 z-50 invisible opacity-0 translate-y-1 group-hover/hombre:visible group-hover/hombre:opacity-100 group-hover/hombre:translate-y-0 transition-all duration-150">
                {hombreLinks.map(([label, href]) => (
                  <Link
                    key={label}
                    href={href}
                    className="block px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-neutral-700 hover:text-ush-pink hover:bg-rose-50"
                  >
                    {label}
                  </Link>
                ))}
              </div>
            </div>

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
            onClick={closeMobileMenu}
            className="block text-sm font-bold uppercase tracking-wider text-neutral-800 hover:text-ush-pink py-2 border-b border-gray-50"
          >
            INICIO
          </Link>
          <Link
            href="/catalogo"
            onClick={closeMobileMenu}
            className="block text-sm font-bold uppercase tracking-wider text-neutral-800 hover:text-ush-pink py-2 border-b border-gray-50"
          >
            CATÁLOGO
          </Link>
          <div className="border-b border-gray-50">
            <button
              type="button"
              onClick={() => setIsMobileMujerOpen((open) => !open)}
              className="w-full flex items-center justify-between text-left text-sm font-bold uppercase tracking-wider text-neutral-800 hover:text-ush-pink py-2"
              aria-expanded={isMobileMujerOpen}
              aria-controls="mobile-mujer-menu"
            >
              <span>MUJER</span>
              <ChevronDown
                size={18}
                className={`text-[#d88193] transition-transform ${isMobileMujerOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {isMobileMujerOpen && (
              <div id="mobile-mujer-menu" className="pb-2 pl-4 space-y-1" role="group" aria-label="Categorías de Mujer">
                <Link
                  href="/catalogo"
                  onClick={closeMobileMenu}
                  className="block text-xs font-bold uppercase tracking-wider text-[#d88193] py-2"
                >
                  VER TODO
                </Link>

                <div>
                  <div className="flex items-center justify-between">
                    <Link
                      href="/catalogo?categoria=Jeans"
                      onClick={closeMobileMenu}
                      className="flex-1 text-xs font-bold uppercase tracking-wider text-neutral-700 py-2"
                    >
                      JEANS
                    </Link>
                    <button
                      type="button"
                      onClick={() => setIsMobileJeansOpen((open) => !open)}
                      className="p-2 text-neutral-500"
                      aria-label={`${isMobileJeansOpen ? 'Ocultar' : 'Mostrar'} cortes de Jeans`}
                      aria-expanded={isMobileJeansOpen}
                    >
                      <ChevronRight size={15} className={`transition-transform ${isMobileJeansOpen ? 'rotate-90' : ''}`} />
                    </button>
                  </div>
                  {isMobileJeansOpen && (
                    <div className="pl-4 border-l border-rose-100 space-y-1">
                      {jeansFits.map((fit) => (
                        <Link
                          key={fit}
                          href={`/catalogo?categoria=Jeans&fit=${encodeURIComponent(fit)}`}
                          onClick={closeMobileMenu}
                          className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-500 py-1.5"
                        >
                          {fit}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <Link
                      href="/catalogo?categoria=Pantalones"
                      onClick={closeMobileMenu}
                      className="flex-1 text-xs font-bold uppercase tracking-wider text-neutral-700 py-2"
                    >
                      PANTALONES
                    </Link>
                    <button
                      type="button"
                      onClick={() => setIsMobilePantalonesOpen((open) => !open)}
                      className="p-2 text-neutral-500"
                      aria-label={`${isMobilePantalonesOpen ? 'Ocultar' : 'Mostrar'} cortes de Pantalones`}
                      aria-expanded={isMobilePantalonesOpen}
                    >
                      <ChevronRight size={15} className={`transition-transform ${isMobilePantalonesOpen ? 'rotate-90' : ''}`} />
                    </button>
                  </div>
                  {isMobilePantalonesOpen && (
                    <div className="pl-4 border-l border-rose-100 space-y-1">
                      {pantalonesFits.map((fit) => (
                        <Link
                          key={fit}
                          href={`/catalogo?categoria=Pantalones&fit=${encodeURIComponent(fit)}`}
                          onClick={closeMobileMenu}
                          className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-500 py-1.5"
                        >
                          {fit}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>

                {[
                  ['CARGOS', '/catalogo?categoria=Cargos'],
                  ['SHORTS', '/catalogo?categoria=Shorts'],
                  ['FALDAS', '/catalogo?categoria=Faldas'],
                  ['BERMUDAS', '/catalogo?categoria=Bermudas'],
                ].map(([label, href]) => (
                  <Link
                    key={label}
                    href={href}
                    onClick={closeMobileMenu}
                    className="block text-xs font-bold uppercase tracking-wider text-neutral-700 py-2"
                  >
                    {label}
                  </Link>
                ))}
              </div>
            )}
          </div>
          <Link
            href="/catalogo?categoria=TEENS"
            onClick={closeMobileMenu}
            className="block text-sm font-bold uppercase tracking-wider text-neutral-800 hover:text-ush-pink py-2 border-b border-gray-50 flex items-center gap-2"
          >
            TEENS <Sparkles size={13} className="text-[#d88193]" />
          </Link>
          <div className="border-b border-gray-50">
            <button
              type="button"
              onClick={() => setIsMobileHombreOpen((open) => !open)}
              className="w-full flex items-center justify-between text-left text-sm font-bold uppercase tracking-wider text-neutral-800 hover:text-ush-pink py-2"
              aria-expanded={isMobileHombreOpen}
              aria-controls="mobile-hombre-menu"
            >
              <span>HOMBRES</span>
              <ChevronDown
                size={18}
                className={`text-[#d88193] transition-transform ${isMobileHombreOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {isMobileHombreOpen && (
              <div id="mobile-hombre-menu" className="pb-2 pl-4 space-y-1" role="group" aria-label="Categorías de Hombre">
                {hombreLinks.map(([label, href]) => (
                  <Link
                    key={label}
                    href={href}
                    onClick={closeMobileMenu}
                    className="block text-xs font-bold uppercase tracking-wider text-neutral-700 py-2"
                  >
                    {label}
                  </Link>
                ))}
              </div>
            )}
          </div>
          <Link
            href="/como-comprar"
            onClick={closeMobileMenu}
            className="block text-sm font-bold uppercase tracking-wider text-neutral-800 hover:text-ush-pink py-2 border-b border-gray-50"
          >
            BENEFICIOS MAYORISTAS
          </Link>
          <Link
            href="/rastreo"
            onClick={closeMobileMenu}
            className="block text-sm font-bold uppercase tracking-wider text-neutral-800 hover:text-ush-pink py-2 border-b border-gray-50"
          >
            RASTREAR PEDIDO
          </Link>
          <div className="pt-2 flex items-center justify-between text-xs text-neutral-600">
            <Link
              href="/profile"
              onClick={closeMobileMenu}
              className="flex items-center gap-2 text-ush-navy font-bold uppercase"
            >
              <User size={18} /> Iniciar Sesión / Mi Cuenta
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};
