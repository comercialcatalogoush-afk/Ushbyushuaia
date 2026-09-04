import { Metadata } from 'next';
import { PackMayoristaClient } from './PackMayoristaClient';

export const metadata: Metadata = {
  title: 'Inicia tu Negocio — Pack Mayorista 12 Prendas | Ush By Ushuaia',
  description: 'Pack oficial de 12 referencias surtidas de jeans, shorts y faldas de alta rotación. Flete 100% GRATIS a toda Colombia y retorno superior al 60%. Inicia tu negocio de moda hoy.',
  keywords: [
    'Pack mayorista jeans',
    'Inicia tu negocio jeans Colombia',
    'Mayorista ropa Medellín Itagüí',
    'Ush By Ushuaia mayoristas',
    'Jeans colombianos por mayor'
  ],
  openGraph: {
    title: 'Pack Mayorista 12 Prendas | Ush By Ushuaia',
    description: '12 referencias oficiales de alta rotación con envío 100% gratis a toda Colombia. Simula tu ganancia y pide por WhatsApp en 1 clic.',
    url: 'https://ushbyushuaia.vercel.app/pack-mayorista',
    siteName: 'USH BY USHUAIA',
    locale: 'es_CO',
    type: 'website',
  },
};

export default function PackMayoristaPage() {
  return <PackMayoristaClient />;
}
