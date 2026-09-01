import { Metadata } from 'next';
import { LookbookClient } from './LookbookClient';

export const metadata: Metadata = {
  title: 'Catálogo Digital Lookbook 2026 | USH BY USHUAIA Mayoristas',
  description: 'Catálogo editorial y lookbook oficial de prendas en mezclilla rígida de confección nacional. Precios mayoristas, fotos de alta definición y referencias.',
};

export const dynamic = 'force-dynamic';

export default function CatalogoDigitalPage() {
  // La sesión se comprueba en el navegador antes de cargar cualquier producto.
  return <LookbookClient />;
}
