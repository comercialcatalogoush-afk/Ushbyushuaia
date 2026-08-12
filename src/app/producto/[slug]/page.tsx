import React from 'react';
import { fetchProductBySlug, fetchProductsFromSupabase } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import ProductDetailClient from './ProductDetailClient';

// Allow slugs that were NOT pre-generated at build time (e.g. newly added products)
export const dynamicParams = true;

// Revalidate every 60 seconds so new products appear without a full redeploy
export const revalidate = 60;

export async function generateStaticParams() {
  const products = await fetchProductsFromSupabase();
  return products.map((p) => ({
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

  if (!product) {
    notFound();
  }

  return <ProductDetailClient product={product} />;
}
