import { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Mayorista USH BY USHUAIA — 8 Uds 20% OFF · 12+ Precio de Fábrica | Ush By Ushuaia',
  description: 'Compra mayorista desde 8 unidades con 20% de descuento. Desde 12 unidades obtienes precio de fábrica, surtido libre y envío gratis a toda Colombia.',
  keywords: [
    'Mayorista jeans Colombia',
    'Compra mayorista ropa Medellín Itagüí',
    'Ush By Ushuaia mayoristas',
    'Jeans colombianos por mayor',
    'Surtido libre 12 unidades'
  ],
  openGraph: {
    title: 'Mayorista USH BY USHUAIA — Precio de Fábrica desde 12 Uds | Ush By Ushuaia',
    description: '8 unidades con 20% OFF · desde 12 unidades precio de fábrica y envío gratis. Simula tu ganancia y pide por WhatsApp.',
    url: 'https://ushbyushuaia.vercel.app/pack-mayorista',
    siteName: 'USH BY USHUAIA',
    locale: 'es_CO',
    type: 'website',
  },
};

export default function PackMayoristaPage() {
  // El pack antiguo queda fuera de la navegación y vuelve a la portada para
  // evitar que se siga mostrando la selección mezclada anterior.
  redirect('/');
}
