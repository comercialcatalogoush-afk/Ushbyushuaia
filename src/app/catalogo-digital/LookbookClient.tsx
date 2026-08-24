'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Product } from '@/types';
import { Download, Share2, ChevronLeft, ChevronRight, Search, Grid3X3, BookOpen, ExternalLink } from 'lucide-react';

const CATEGORIES = ['Todas', 'Jeans', 'Pantalones', 'Shorts', 'Faldas', 'Cargos', 'Bermuda', 'Nuevo'];

function formatCOP(n: number) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(n);
}

interface LookbookClientProps {
  initialProducts: Product[];
}

export function LookbookClient({ initialProducts }: LookbookClientProps) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Todas');
  const [view, setView] = useState<'lookbook' | 'grid'>('lookbook');
  const [page, setPage] = useState(0);
  const ITEMS_PER_PAGE = view === 'lookbook' ? 6 : 24;
  const printRef = useRef<HTMLDivElement>(null);

  const filtered = initialProducts.filter((p) => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.reference.includes(search);
    const matchCat = category === 'Todas' || p.category === category;
    return matchSearch && matchCat;
  });

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE);

  const handleCategoryChange = (cat: string) => {
    setCategory(cat);
    setPage(0);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(0);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      {/* Print-specific hidden area (full catalog) */}
      <div className="hidden print:block p-8" ref={printRef}>
        <div className="text-center mb-8 border-b-2 border-gray-900 pb-6">
          <h1 className="text-3xl font-black uppercase tracking-widest">USH BY USHUAIA</h1>
          <p className="text-sm uppercase tracking-wider mt-1 text-gray-600">Catálogo Mayorista 2026 · Confección Nacional · Itagüí, Antioquia</p>
        </div>
        <div className="grid grid-cols-3 gap-6">
          {initialProducts.map((p) => (
            <div key={p.id} className="border border-gray-200 p-3 break-inside-avoid">
              {p.images[0] && (
                <div className="w-full aspect-[3/4] relative mb-2 bg-gray-50">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                </div>
              )}
              <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">Ref. #{p.reference}</p>
              <p className="text-xs font-bold uppercase text-gray-900 mt-0.5">{p.name}</p>
              {p.category && <p className="text-[10px] text-gray-500 mt-0.5">{p.category}</p>}
              <div className="mt-1.5 flex justify-between items-center border-t border-gray-100 pt-1.5">
                <div>
                  <p className="text-[9px] text-gray-400 uppercase">Mayorista</p>
                  <p className="text-xs font-black text-gray-900">{formatCOP(p.price)}</p>
                </div>
                {p.suggested_price > 0 && (
                  <div className="text-right">
                    <p className="text-[9px] text-gray-400 uppercase">Sugerido</p>
                    <p className="text-xs font-bold text-gray-600">{formatCOP(p.suggested_price)}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="text-center text-[10px] text-gray-400 mt-8 pt-4 border-t border-gray-200">
          ushbyushuaia-catalogo-mayorista.vercel.app · Pedidos mínimos 12 unidades · Envío gratis
        </div>
      </div>

      {/* Web UI */}
      <div className="min-h-screen bg-[#f8f5f2] print:hidden">
        {/* Header */}
        <div className="bg-[#1b2333] text-white py-12 px-4 text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 0, transparent 50%)', backgroundSize: '14px 14px' }} />
          <div className="relative z-10 max-w-4xl mx-auto">
            <p className="text-[10px] tracking-[0.4em] uppercase text-[#d88193] font-bold mb-2">Catálogo Digital · Mayoristas</p>
            <h1 className="text-4xl sm:text-5xl font-black uppercase tracking-tight text-white mb-1">USH BY USHUAIA</h1>
            <p className="text-sm text-neutral-400 mt-2 tracking-widest uppercase">Temporada 2026 · Itagüí, Colombia · {initialProducts.length} Referencias</p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 bg-[#d88193] hover:bg-[#c06579] text-white text-xs font-bold uppercase tracking-widest px-5 py-2.5 rounded-full transition-colors"
              >
                <Download size={14} /> Descargar / Imprimir PDF
              </button>
              <Link
                href="/catalogo"
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold uppercase tracking-widest px-5 py-2.5 rounded-full transition-colors"
              >
                <ExternalLink size={14} /> Ir al catálogo en línea
              </Link>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="sticky top-0 z-30 bg-white border-b border-neutral-200 shadow-sm py-3 px-4">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 w-full sm:max-w-xs">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                value={search}
                onChange={handleSearchChange}
                placeholder="Buscar referencia o nombre…"
                className="w-full pl-9 pr-3 py-2 text-xs border border-neutral-200 rounded-lg focus:outline-none focus:border-[#d88193] bg-white"
              />
            </div>

            {/* Categories */}
            <div className="flex gap-1.5 flex-wrap justify-center">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => handleCategoryChange(cat)}
                  className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full border transition-all ${
                    category === cat
                      ? 'bg-[#1b2333] text-white border-[#1b2333]'
                      : 'bg-white text-neutral-500 border-neutral-200 hover:border-[#d88193]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* View toggle */}
            <div className="flex items-center bg-neutral-100 rounded-lg p-1 gap-1 flex-shrink-0">
              <button
                onClick={() => { setView('lookbook'); setPage(0); }}
                className={`px-3 py-1.5 text-[10px] font-bold uppercase rounded-md flex items-center gap-1 transition-all ${
                  view === 'lookbook' ? 'bg-white shadow-sm text-[#1b2333]' : 'text-neutral-500'
                }`}
              >
                <BookOpen size={12} /> Lookbook
              </button>
              <button
                onClick={() => { setView('grid'); setPage(0); }}
                className={`px-3 py-1.5 text-[10px] font-bold uppercase rounded-md flex items-center gap-1 transition-all ${
                  view === 'grid' ? 'bg-white shadow-sm text-[#1b2333]' : 'text-neutral-500'
                }`}
              >
                <Grid3X3 size={12} /> Cuadrícula
              </button>
            </div>
          </div>
        </div>

        {/* Results count */}
        <div className="max-w-7xl mx-auto px-4 pt-5 pb-2">
          <p className="text-[11px] text-neutral-400 font-bold uppercase tracking-wider">
            {filtered.length} referencias {category !== 'Todas' ? `en ${category}` : 'en total'}
            {search && ` · búsqueda: "${search}"`}
          </p>
        </div>

        {/* Lookbook view */}
        {view === 'lookbook' ? (
          <div className="max-w-7xl mx-auto px-4 pb-12">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-0.5">
              {paginated.map((p) => (
                <Link
                  key={p.id}
                  href={`/producto/${p.slug}`}
                  className="group relative aspect-[3/4] bg-neutral-100 overflow-hidden"
                >
                  {p.images[0] && (
                    <Image
                      src={p.images[0]}
                      alt={p.name}
                      fill
                      sizes="(max-width: 768px) 50vw, 33vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  )}
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="absolute bottom-0 left-0 right-0 p-4 text-white transform translate-y-3 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#d88193]">Ref. #{p.reference}</p>
                    <p className="text-sm font-black uppercase mt-0.5 leading-tight">{p.name}</p>
                    <p className="text-xs text-neutral-300 mt-1">{formatCOP(p.price)} mayorista</p>
                  </div>
                  {/* Ribbon */}
                  {p.ribbon && (
                    <div className="absolute top-3 left-0 bg-[#d88193] text-white text-[9px] font-black uppercase tracking-wider px-3 py-1">
                      {p.ribbon}
                    </div>
                  )}
                  {/* Share quick button */}
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      const url = `https://ushbyushuaia-catalogo-mayorista.vercel.app/producto/${p.slug}`;
                      const msg = `👗 *${p.name}* (Ref. #${p.reference})\n💲 Mayorista: ${formatCOP(p.price)}\n🔗 ${url}`;
                      if (navigator.share) {
                        navigator.share({ title: p.name, text: msg, url }).catch(() => {});
                      } else {
                        navigator.clipboard.writeText(msg).then(() => alert('¡Enlace copiado!')).catch(() => {});
                      }
                    }}
                    className="absolute top-3 right-3 bg-white/90 hover:bg-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 shadow"
                    aria-label="Compartir"
                    title="Compartir referencia"
                  >
                    <Share2 size={13} className="text-[#1b2333]" />
                  </button>
                </Link>
              ))}
            </div>
          </div>
        ) : (
          /* Grid view */
          <div className="max-w-7xl mx-auto px-4 pb-12">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {paginated.map((p) => (
                <Link
                  key={p.id}
                  href={`/producto/${p.slug}`}
                  className="group bg-white border border-neutral-200 hover:border-[#d88193] hover:shadow-md transition-all duration-200 rounded-lg overflow-hidden"
                >
                  <div className="aspect-[3/4] relative bg-neutral-50">
                    {p.images[0] && (
                      <Image
                        src={p.images[0]}
                        alt={p.name}
                        fill
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    )}
                    {p.ribbon && (
                      <span className="absolute top-2 left-0 bg-[#d88193] text-white text-[8px] font-black uppercase px-2 py-0.5">
                        {p.ribbon}
                      </span>
                    )}
                  </div>
                  <div className="p-2.5">
                    <p className="text-[9px] text-neutral-400 font-bold uppercase">#{p.reference}</p>
                    <p className="text-[11px] font-black uppercase text-[#1b2333] truncate mt-0.5">{p.name}</p>
                    <p className="text-[11px] font-black text-[#d88193] mt-1">{formatCOP(p.price)}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 pb-12">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="flex items-center gap-1.5 px-4 py-2 text-[11px] font-bold uppercase tracking-wider bg-white border border-neutral-200 hover:border-[#d88193] disabled:opacity-40 rounded-lg transition-colors"
            >
              <ChevronLeft size={14} /> Anterior
            </button>
            <span className="text-[11px] font-bold text-neutral-500">
              Página {page + 1} de {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page === totalPages - 1}
              className="flex items-center gap-1.5 px-4 py-2 text-[11px] font-bold uppercase tracking-wider bg-white border border-neutral-200 hover:border-[#d88193] disabled:opacity-40 rounded-lg transition-colors"
            >
              Siguiente <ChevronRight size={14} />
            </button>
          </div>
        )}

        {/* Footer note */}
        <div className="bg-[#1b2333] text-white text-center py-8 px-4">
          <p className="text-[10px] tracking-widest uppercase text-neutral-400">
            USH BY USHUAIA · Catálogo Digital 2026 · Pedidos mínimos 12 unidades · Envío gratis desde 12 uds
          </p>
          <p className="text-[10px] tracking-wider text-neutral-500 mt-1">
            Itagüí, Antioquia, Colombia · ushbyushuaia-catalogo-mayorista.vercel.app
          </p>
        </div>
      </div>
    </>
  );
}
