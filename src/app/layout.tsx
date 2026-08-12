import type { Metadata } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import './globals.css';
import { CartProvider } from '@/context/CartContext';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { CartDrawer } from '@/components/CartDrawer';
import { ToastContainer } from '@/components/ToastContainer';
import Script from 'next/script';

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
      <head>
        {/* AOS (Animate On Scroll) CDN */}
        <link rel="stylesheet" href="https://unpkg.com/aos@next/dist/aos.css" />
      </head>
      <body className="flex flex-col min-h-screen">
        <CartProvider>
          <Header />
          <CartDrawer />
          <ToastContainer />
          <main className="flex-grow">{children}</main>
          <Footer />
        </CartProvider>

        {/* AOS Init Script */}
        <Script
          src="https://unpkg.com/aos@next/dist/aos.js"
          strategy="afterInteractive"
        />
        <Script id="aos-init" strategy="afterInteractive">
          {`
            document.addEventListener('DOMContentLoaded', function() {
              if (window.AOS) {
                window.AOS.init({
                  duration: 700,
                  once: true,
                  easing: 'ease-out-cubic'
                });
              }
            });
          `}
        </Script>
      </body>
    </html>
  );
}
