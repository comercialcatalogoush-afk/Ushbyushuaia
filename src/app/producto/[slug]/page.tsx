import React from 'react';
import { fetchProductBySlug, fetchProductsFromSupabase, isCompleteProduct } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import ProductDetailClient from './ProductDetailClient';

// Allow slugs that were NOT pre-generated at build time (e.g. newly added products)
export const dynamicParams = true;

// Cache largo en el edge: los cambios del admin purgan vía /api/revalidate,
// así el TTL solo actúa como red de seguridad (menos egress de Supabase).
export const revalidate = 86400;

export async function generateStaticParams() {
  const products = await fetchProductsFromSupabase({ slim: true });
  return products.filter((p) => isCompleteProduct(p)).map((p) => ({
    slug: p.slug,
  }));
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const product = await fetchProductBySlug(params.slug);
  if (!product) return { title: 'Producto no encontrado' };

  return {
    title: `${product.name} | USH BY USHUAIA Catálogo`,
    description: product.description || `Comprar ${product.name} al por mayor en mezclilla de alta calidad.`,
  };
}

export default async function ProductDetailPage({ params }: { params: { slug: string } }) {
  const product = await fetchProductBySlug(params.slug);

  if (!product || !isCompleteProduct(product)) {
    notFound();
  }

  // Productos sugeridos: mismo fit/categoría, rango de precio similar y más vendidos
  let related: Awaited<ReturnType<typeof fetchProductsFromSupabase>> = [];
  try {
    const all = await fetchProductsFromSupabase({ slim: true });
    const others = all.filter((p) => p.id !== product.id && p.slug !== product.slug && !p.hidden && p.status !== 'draft' && isCompleteProduct(p));

    const score = (p: (typeof all)[number]) => {
      let s = 0;
      if (p.fit && product.fit && p.fit.toLowerCase() === product.fit.toLowerCase()) s += 5;
      if (p.category && product.category && p.category.toLowerCase() === product.category.toLowerCase()) s += 3;
      if (p.ribbon?.toLowerCase().includes('más vendido') || p.ribbon?.toLowerCase().includes('mas vendido') || p.is_best_seller) s += 2;
      const diff = Math.abs((p.price || 0) - (product.price || 0));
      if (diff < 10000) s += 2;
      else if (diff < 20000) s += 1;
      return s;
    };

    related = [...others].sort((a, b) => score(b) - score(a)).slice(0, 12);
  } catch (_) {}

  return <ProductDetailClient product={product} related={related} />;
}
