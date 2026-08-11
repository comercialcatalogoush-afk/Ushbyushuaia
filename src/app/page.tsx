import { fetchProductsFromSupabase } from '@/lib/supabase';
import { Hero } from '@/components/Hero';
import { Benefits } from '@/components/Benefits';
import { ProductGrid } from '@/components/ProductGrid';
import { WholesaleInquiryForm } from '@/components/WholesaleInquiryForm';
import { Truck, Clock, Award, ShieldCheck } from 'lucide-react';

export const revalidate = 60; // Revalidate every minute

export default async function HomePage() {
  const products = await fetchProductsFromSupabase();

  return (
    <div className="space-y-0">
      {/* Hero Banner Section */}
      <Hero />

      {/* Wholesale Benefits Cards */}
      <Benefits />

      {/* Main Catalog Grid */}
      <ProductGrid products={products} />

      {/* Wholesale Lead Form & Guarantee Banner Section */}
      <section className="py-20 bg-neutral-900 text-white border-t border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            
            {/* Left Column: Information & Guarantees */}
            <div className="space-y-6">
              <span className="text-xs font-bold uppercase tracking-[0.25em] text-amber-400">
                Atención a Distribuidores
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight uppercase leading-tight">
                ¿Buscas despachos continuos para tu negocio o boutique?
              </h2>
              <p className="text-sm text-neutral-300 font-light leading-relaxed">
                Trabajamos de la mano con comerciantes de toda Colombia. Te brindamos asesoría directa en la selección de referencias con mayor rotación y logística de envío segura desde Itagüí, Antioquia.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                <div className="flex items-start gap-3 p-4 bg-neutral-800/60 border border-neutral-700/50">
                  <Truck size={22} className="text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-xs font-bold uppercase">Envíos Nacionales</h3>
                    <p className="text-[11px] text-neutral-400">Coordinación con tu empresa transportadora preferida.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-neutral-800/60 border border-neutral-700/50">
                  <Award size={22} className="text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-xs font-bold uppercase">Mezclilla Premium</h3>
                    <p className="text-[11px] text-neutral-400">Telas rígidas y acabados de alta confección nacional.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Wholesale Inquiry Form */}
            <div>
              <WholesaleInquiryForm />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
