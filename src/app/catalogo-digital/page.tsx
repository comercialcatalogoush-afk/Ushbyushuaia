import React from 'react';
import { Metadata } from 'next';
import { fetchAllProductsAdmin } from '@/lib/supabase';
import { LookbookClient } from './LookbookClient';

export const metadata: Metadata = {
  title: 'Catálogo Digital Lookbook 2026 | USH BY USHUAIA Mayoristas',
  description: 'Catálogo editorial y lookbook oficial de prendas en mezclilla rígida de confección nacional. Precios mayoristas, fotos de alta definición y referencias.',
};

export const revalidate = 60; // Regenerar cada minuto

export default async function CatalogoDigitalPage() {
  const products = await fetchAllProductsAdmin();
  const activeProducts = (products || []).filter(
    (p) => !p.hidden && p.status !== 'draft' && p.images && p.images.length > 0
  );

  return <LookbookClient initialProducts={activeProducts} />;
}
