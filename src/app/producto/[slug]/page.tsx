import React from 'react';
import { fetchProductBySlug, fetchProductsFromSupabase } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import ProductDetailClient from './ProductDetailClient';

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
