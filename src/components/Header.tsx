'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { ShoppingBag, Search, Bell, User, Menu, X, Settings } from 'lucide-react';
import { useCart } from '@/context/CartContext';

export const Header: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const pathname = usePathname();
  const { totalItemsCount, setIsCartOpen } = useCart();

  useEffect(() => {
    // Check if admin is logged in
    const authStatus = sessionStorage.getItem('ush_admin_auth');
    setIsAdminLoggedIn(authStatus === 'true');
  }, [pathname]);

  const navLinks = [
    { name: 'Inicio', href: '/' },
    { name: 'Beneficios', href: '/como-comprar' },
    { name: 'Catálogo', href: '/#catalogo' },
    { name: 'Contacto', href: '/contacto' },
  ];

  if (isAdminLoggedIn) {
    navLinks.push({ name: 'Editar Catálogo (Admin)', href: '/admin' });
  }

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm transition-all duration-200">
      {/* Top Banner Notice */}
      <div className="bg-ush-navy text-white text-xs py-2 px-4 text-center tracking-wider font-light flex items-center justify-center gap-2">
        <span className="bg-ush-pink text-white font-bold text-[10px] uppercase px-2 py-0.5 rounded">
          Mayorista
        </span>
        <span>Atención directa a tiendas y distribuidores - Envíos desde Itagüí, Antioquia</span>
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

          {/* Logo / Brand - Adaptive Circular Logo */}
          <div className="flex-1 lg:flex-none text-center lg:text-left">
            <Link href="/" className="inline-flex items-center gap-3">
              <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-ush-pink shadow-sm bg-white p-1">
                <Image
                  src="/images/ush-logo.jpg"
                  alt="USH by USHUAIA"
                  fill
                  priority
                  className="object-contain p-0.5 rounded-full"
                />
              </div>
              <div className="hidden sm:flex flex-col">
                <span className="text-xl font-black tracking-[0.2em] text-ush-navy uppercase">
                  USH
                </span>
                <span className="text-[9px] tracking-[0.35em] text-ush-pink font-bold uppercase -mt-1">
                  BY USHUAIA
                </span>
              </div>
            </Link>
          </div>

          {/* Navigation Links - Desktop */}
          <nav className="hidden lg:flex items-center space-x-8">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`text-xs uppercase tracking-widest font-semibold transition-colors hover:text-ush-pink relative py-1 ${
                    isActive ? 'text-ush-pink font-bold' : 'text-ush-navy'
                  }`}
                >
                  {link.name}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 w-full h-0.5 bg-ush-pink rounded-full" />
                  )}
                </Link>
              );
            })}
          </nav>

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

            {/* Admin catalog editor button - ONLY VISIBLE IF LOGGED IN */}
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
          <div className="max-w-3xl mx-auto flex items-center gap-2">
            <Search size={18} className="text-ush-pink" />
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
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              onClick={() => setIsMobileMenuOpen(false)}
              className="block text-sm font-bold uppercase tracking-wider text-ush-navy hover:text-ush-pink py-2 border-b border-gray-50"
            >
              {link.name}
            </Link>
          ))}
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
    </header>
  );
};
