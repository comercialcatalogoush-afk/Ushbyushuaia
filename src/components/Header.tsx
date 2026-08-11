'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShoppingBag, Search, Bell, User, Menu, X } from 'lucide-react';
import { useCart } from '@/context/CartContext';

export const Header: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const pathname = usePathname();
  const { totalItemsCount, setIsCartOpen } = useCart();

  const navLinks = [
    { name: 'Inicio', href: '/' },
    { name: 'Beneficios', href: '/como-comprar' },
    { name: 'Contacto', href: '/contacto' },
    { name: 'Catálogo', href: '/#catalogo' },
    { name: 'Tarjeta de regalo', href: '/tarjeta-de-regalo' },
    { name: 'Grupos', href: '/grupos' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm transition-all duration-200">
      {/* Top Banner Notice */}
      <div className="bg-neutral-900 text-white text-xs py-2 px-4 text-center tracking-wider font-light flex items-center justify-center gap-2">
        <span className="bg-brand-500 text-white font-semibold text-[10px] uppercase px-2 py-0.5 rounded">Mayorista</span>
        <span>Atención exclusiva a mayoristas - Descuentos especiales por volumen desde 12 unidades</span>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Mobile Menu Button */}
          <div className="flex items-center lg:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-gray-700 hover:text-black focus:outline-none"
              aria-label="Menú principal"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {/* Logo / Brand */}
          <div className="flex-1 lg:flex-none text-center lg:text-left">
            <Link href="/" className="inline-block">
              <div className="flex flex-col items-center lg:items-start">
                <span className="text-2xl font-black tracking-[0.25em] text-neutral-900 uppercase font-sans">
                  USH
                </span>
                <span className="text-[10px] tracking-[0.4em] text-neutral-500 uppercase -mt-1 font-medium">
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
                  className={`text-sm font-medium transition-colors hover:text-black relative py-1 ${
                    isActive ? 'text-black font-semibold' : 'text-neutral-600'
                  }`}
                >
                  {link.name}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 w-full h-0.5 bg-black rounded-full" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right Action Icons */}
          <div className="flex items-center space-x-4 sm:space-x-6">
            {/* Search */}
            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="p-2 text-neutral-700 hover:text-black transition-colors"
              aria-label="Buscar"
            >
              <Search size={20} />
            </button>

            {/* Notifications */}
            <button
              className="p-2 text-neutral-700 hover:text-black transition-colors hidden sm:block relative"
              aria-label="Notificaciones"
            >
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand-500 rounded-full" />
            </button>

            {/* Login / User */}
            <Link
              href="/profile"
              className="p-2 text-neutral-700 hover:text-black transition-colors hidden sm:flex items-center gap-1 text-xs font-medium"
            >
              <User size={20} />
              <span className="hidden xl:inline">Log In</span>
            </Link>

            {/* Cart Drawer Toggle */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="p-2 text-neutral-900 hover:text-black transition-transform active:scale-95 relative flex items-center gap-2 bg-neutral-100 hover:bg-neutral-200 px-3 py-1.5 rounded-full"
              aria-label="Carrito de compras"
            >
              <ShoppingBag size={18} />
              <span className="text-xs font-bold">{totalItemsCount}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Expandable Search Input */}
      {isSearchOpen && (
        <div className="bg-neutral-50 border-t border-b border-gray-200 py-3 px-4 transition-all">
          <div className="max-w-3xl mx-auto flex items-center gap-2">
            <Search size={18} className="text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por referencia, prenda o categoría (Ej: 556218, Short, Jean)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent text-sm focus:outline-none text-neutral-800 placeholder-gray-400"
              autoFocus
            />
            <button
              onClick={() => setIsSearchOpen(false)}
              className="text-xs text-gray-500 hover:text-black font-medium uppercase tracking-wider px-2"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* Mobile Navigation Drawer */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-gray-200 px-4 pt-2 pb-6 space-y-3 animate-fadeIn">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              onClick={() => setIsMobileMenuOpen(false)}
              className="block text-base font-medium text-neutral-800 hover:text-black py-2 border-b border-gray-50"
            >
              {link.name}
            </Link>
          ))}
          <div className="pt-2 flex items-center justify-between text-sm text-neutral-600">
            <Link
              href="/profile"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center gap-2 text-black font-medium"
            >
              <User size={18} /> Iniciar Sesión / Registrarse
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};
