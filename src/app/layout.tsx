import type { Metadata } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import './globals.css';
import { CartProvider } from '@/context/CartContext';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { CartDrawer } from '@/components/CartDrawer';
import { ToastContainer } from '@/components/ToastContainer';
import { ScrollReveal } from '@/components/ScrollReveal';
import { ThemeProvider } from '@/components/ThemeProvider';
import { SectionLayoutSync } from '@/components/SectionLayoutSync';
import { CustomerBenefitsBanner } from '@/components/CustomerBenefitsBanner';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { FloatingCartButton } from '@/components/FloatingCartButton';
import { GoogleAnalytics } from '@next/third-parties/google';

const GA4_ID = process.env.NEXT_PUBLIC_GA4_ID || 'G-R91RRDYKM1';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair' });

export const metadata: Metadata = {
  title: 'Inicio | Ush By Ushuaia',
  description: 'Catálogo mayorista exclusivo de ropa en mezclilla rígida. Shorts, faldas y jeans de tiro alto. Envíos a toda Colombia.',
  keywords: ['USH BY USHUAIA', 'Mayorista jeans Colombia', 'Itagüí Antioquia', 'Catálogo mayorista', 'Ropa de mezclilla'],
  openGraph: {
    title: 'Ush By Ushuaia | Catálogo Mayorista',
    description: 'Catálogo oficial mayorista de prendas de mezclilla rígida. Descuentos por volumen.',
    url: 'https://ushbyushuaia.vercel.app',
    siteName: 'USH BY USHUAIA',
    locale: 'es_CO',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={`${inter.variable} ${playfair.variable} scroll-smooth`}>
      <body className="flex flex-col min-h-screen">
        <CartProvider>
          <ThemeProvider>
            <SectionLayoutSync />
            <Header />
            <CartDrawer />
            <ToastContainer />
            <ScrollReveal />
            <CustomerBenefitsBanner />
            <main className="flex-grow">
              <ErrorBoundary>{children}</ErrorBoundary>
            </main>
            <FloatingCartButton />
            <Footer />
          </ThemeProvider>
        </CartProvider>
        {GA4_ID && <GoogleAnalytics gaId={GA4_ID} />}
      </body>
    </html>
  );
}
