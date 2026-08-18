import type { Metadata } from 'next';
import Link from 'next/link';
import { fetchProductsFromSupabase, isCompleteProduct } from '@/lib/supabase';
import { getPageContentServer } from '@/lib/siteContent';
import { CatalogGrid } from '@/components/CatalogGrid';
import { ArrowLeft } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: 'Catálogo Completo | Ush By Ushuaia',
  description: 'Catálogo mayorista completo de USH BY USHUAIA. Filtra por categoría y fit: jeans, pantalones, shorts y faldas en mezclilla rígida.',
};

export default async function CatalogoPage() {
  const allProducts = await fetchProductsFromSupabase();
  const publicProducts = allProducts.filter(p => !p.hidden && isCompleteProduct(p));
  const c = await getPageContentServer('catalogo');

  return (
    <div className="bg-white min-h-screen">
      <div className="bg-ush-pinkLight border-b border-rose-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-neutral-600 hover:text-ush-pink mb-4 group"
          >
            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
            Volver al Inicio
          </Link>
          <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-ush-navy">
            {c.catTitle} <span className="text-ush-pink">{c.catTitleEm}</span>
          </h1>
          <p className="text-sm text-neutral-600 font-light mt-2 max-w-2xl">
            {c.catIntro}
          </p>
        </div>
      </div>

      <CatalogGrid products={publicProducts} />
    </div>
  );
}