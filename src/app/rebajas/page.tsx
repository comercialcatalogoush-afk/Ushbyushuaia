import type { Metadata } from 'next';
import Link from 'next/link';
import { fetchProductsFromSupabase } from '@/lib/supabase';
import { CatalogGrid } from '@/components/CatalogGrid';
import { ArrowLeft, Tag } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: 'Rebajas | Ush By Ushuaia',
  description: 'Rebajas USH BY USHUAIA: shorts y faldas en oferta al por mayor.',
};

export default async function RebajasPage() {
  const allProducts = await fetchProductsFromSupabase();
  const publicProducts = allProducts.filter(p => !p.hidden && p.status !== 'draft');

  // Rebajas = Shorts + Faldas + toda referencia con etiqueta de oferta/rebaja
  const rebajas = publicProducts.filter((p) => {
    const cat = (p.category || '').toLowerCase();
    const ribbon = (p.ribbon || '').toLowerCase();
    const isShortOrFalda = cat.includes('short') || cat.includes('fald');
    const isOferta = ribbon.includes('oferta') || ribbon.includes('rebaj');
    return isShortOrFalda || isOferta;
  });

  return (
    <div className="bg-white min-h-screen">
      <div className="bg-[#fdf3f5] border-b border-rose-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-neutral-600 hover:text-ush-pink mb-4 group"
          >
            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
            Volver al Inicio
          </Link>
          <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-[#1b2333]">
            <span className="text-[#d88193]">Rebajas</span>
          </h1>
          <p className="text-sm text-neutral-600 font-light mt-2 max-w-2xl flex items-center gap-2">
            <Tag size={16} className="text-[#d88193]" />
            Shorts y faldas en oferta mayorista. Aprovecha las mejores tarifas.
          </p>
        </div>
      </div>

      <CatalogGrid products={rebajas} showHeader={false} />
    </div>
  );
}
