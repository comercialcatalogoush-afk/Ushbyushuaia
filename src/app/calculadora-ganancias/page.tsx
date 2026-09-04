import React from 'react';
import { getPageContentServer } from '@/lib/siteContent';
import { CalculadoraClient } from './CalculadoraClient';

export const revalidate = 3600;

export async function generateMetadata() {
  const c = await getPageContentServer('calculadora');
  return {
    title: c.seoTitle?.trim() || 'Calculadora de Rentabilidad Mayorista | USH BY USHUAIA',
    description: c.seoDescription?.trim() || 'Simula tu pedido mayorista con cualquiera de nuestras 90 referencias oficiales. Calcula tu inversión, ganancias y margen comercial desde 8 y 12 unidades.',
  };
}

export default async function CalculadoraPage() {
  const initialContent = await getPageContentServer('calculadora');

  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-900 pb-16">
      <CalculadoraClient initialContent={initialContent} />
    </main>
  );
}
