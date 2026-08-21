import type { Metadata } from 'next';
import { Suspense } from 'react';
import Link from 'next/link';
import { fetchProductsFromSupabase, isCompleteProduct } from '@/lib/supabase';
import { getPageContentServer } from '@/lib/siteContent';
import { CatalogGrid } from '@/components/CatalogGrid';
import { ArrowLeft } from 'lucide-react';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Catálogo Completo | Ush By Ushuaia',
  description: 'Catálogo mayorista completo de USH BY USHUAIA. Filtra por categoría y fit: jeans, pantalones, shorts y faldas en mezclilla rígida.',
};

export default async function CatalogoPage() {
  const allProducts = await fetchProductsFromSupabase({ slim: true });
  const publicProducts = allProducts.filter(p => !p.hidden && isCompleteProduct(p));
  const c = await getPageContentServer('catalogo');

  return (
    <div className="bg-white min-h-screen">
      <div data-editor-section="cat-header" className="bg-ush-pinkLight border-b border-rose-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-neutral-600 hover:text-ush-pink mb-2 group"
          >
            <ArrowLeft size={12} className="group-hover:-translate-x-1 transition-transform" />
            Volver al Inicio
          </Link>
          <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-ush-navy">
            {(() => {
              const full = (c.catTitle || 'Catálogo Completo').trim();
              const em = (c.catTitleEm || '').trim();
              const words = full.split(/\s+/);
              let base = full;
              let emWord = em;
              // Evita duplicados: si la palabra destacada ya es la última del título, no se repite
              if (em && words.length > 1 && words[words.length - 1].toLowerCase() === em.toLowerCase()) {
                base = words.slice(0, -1).join(' ');
                emWord = em;
              }
              return (
                <>
                  {base}
                  {emWord && <span className="text-ush-pink"> {emWord}</span>}
                </>
              );
            })()}
          </h1>
          <p className="text-xs text-neutral-600 font-light mt-1 max-w-2xl">
            {c.catIntro}
          </p>
        </div>
      </div>

      <Suspense fallback={<div className="py-24 text-center text-neutral-400 text-sm">Cargando catálogo…</div>}>
        <CatalogGrid products={publicProducts} />
      </Suspense>
    </div>
  );
}