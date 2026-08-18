import { fetchProductsFromSupabase, isCompleteProduct } from '@/lib/supabase';
import { Hero } from '@/components/Hero';
import { Benefits } from '@/components/Benefits';
import { ProductGrid } from '@/components/ProductGrid';
import { WholesaleInquiryForm } from '@/components/WholesaleInquiryForm';
import { OutletSection } from '@/components/OutletSection';
import { getPageContentServer } from '@/lib/siteContent';
import { Truck, Award, ShieldCheck, Clock } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function HomePage() {
  const allProducts = await fetchProductsFromSupabase();
  // Public view: only complete products (photo + title + detailed description)
  const publicProducts = allProducts.filter(p => !p.hidden && isCompleteProduct(p));
  const c = await getPageContentServer('home');

  const trustBar = [
    { icon: ShieldCheck, label: c.trust1Label, sub: c.trust1Sub },
    { icon: Truck,        label: c.trust2Label, sub: c.trust2Sub },
    { icon: Clock,        label: c.trust3Label, sub: c.trust3Sub },
    { icon: Award,        label: c.trust4Label, sub: c.trust4Sub },
  ];

  return (
    <div className="space-y-0">
      {/* Hero Banner Section */}
      <Hero />

      {/* Wholesale Benefits Cards */}
      <Benefits />

      {/* Main Catalog Grid */}
      <ProductGrid products={publicProducts} />

      {/* Trust Bar */}
      <section className="reveal bg-white border-y border-gray-100 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {trustBar.map(({ icon: Icon, label, sub }, i) => (
              <div key={i} className="flex flex-col items-center gap-2 animate-fadeInUp" style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="w-10 h-10 rounded-full bg-rose-50 text-ush-pink flex items-center justify-center">
                  <Icon size={20} />
                </div>
                <p className="text-xs font-black uppercase tracking-wide text-neutral-900">{label}</p>
                <p className="text-[10px] text-neutral-500 font-light">{sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Policies CTA Banner */}
      <section className="reveal bg-ush-pinkLight border-y border-rose-100 py-10">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-ush-pink">{c.policiesEyebrow}</p>
          <h3 className="text-xl font-black uppercase text-ush-navy">{c.policiesTitle}</h3>
          <p className="text-xs text-neutral-600 font-light max-w-lg mx-auto leading-relaxed">
            {c.policiesText}
          </p>
          <Link href={c.policiesButtonLink}
            className="inline-flex items-center gap-2 bg-ush-navy text-white text-xs font-bold uppercase tracking-widest px-6 py-3 hover:bg-ush-pink transition-colors mt-2">
            {c.policiesButtonText}
          </Link>
        </div>
      </section>

      {/* Wholesale Lead Form & Guarantee Banner */}
      <section className="reveal py-20 bg-neutral-50 text-neutral-900 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

            <div className="space-y-6 animate-fadeInLeft">
              <span className="text-xs font-bold uppercase tracking-[0.25em] text-ush-pink">
                {c.distEyebrow}
              </span>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight uppercase leading-tight text-neutral-900">
                {c.distTitle}
              </h2>
              <p className="text-sm text-neutral-600 font-light leading-relaxed">
                {c.distText}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                <div className="flex items-start gap-3 p-4 bg-white border border-gray-200 shadow-sm">
                  <Truck size={22} className="text-ush-pink flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-xs font-bold uppercase text-neutral-900">{c.distFeat1Title}</h3>
                    <p className="text-[11px] text-neutral-500 font-light">{c.distFeat1Text}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-white border border-gray-200 shadow-sm">
                  <Award size={22} className="text-ush-pink flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-xs font-bold uppercase text-neutral-900">{c.distFeat2Title}</h3>
                    <p className="text-[11px] text-neutral-500 font-light">{c.distFeat2Text}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="animate-fadeInUp delay-200">
              <WholesaleInquiryForm />
            </div>
          </div>
        </div>
      </section>

      {/* Nuestro Outlet — dirección, horarios y mapa */}
      <OutletSection />
    </div>
  );
}
