import React from 'react';
import Link from 'next/link';
import { Benefits } from '@/components/Benefits';
import { getPageContentServer } from '@/lib/siteContent';
import { CheckCircle2, HelpCircle, ArrowRight, ShieldCheck } from 'lucide-react';

export const revalidate = 86400;

export const metadata = {
  title: 'Beneficios Mayoristas | Ush By Ushuaia',
  description: 'Conoce los beneficios exclusivos para comerciantes y distribuidores. Precios especiales por volumen: 20% de 8 a 11 unidades y precio mayorista desde 12 unidades.',
};

export default async function ComoComprarPage() {
  const c = await getPageContentServer('como-comprar');

  const steps = [
    {
      num: '01',
      title: c.ccStep1Title,
      desc: c.ccStep1Text
    },
    {
      num: '02',
      title: c.ccStep2Title,
      desc: c.ccStep2Text
    },
    {
      num: '03',
      title: c.ccStep3Title,
      desc: c.ccStep3Text
    },
    {
      num: '04',
      title: c.ccStep4Title,
      desc: c.ccStep4Text
    }
  ];

  return (
    <div className="py-12 bg-white space-y-16">
      {/* Header Banner */}
      <div data-editor-section="cc-header" className="bg-neutral-50 border-b border-gray-200 text-neutral-900 py-16 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <span data-field-key="ccEyebrow" className="text-xs font-bold uppercase tracking-[0.25em] text-ush-pink">
            {c.ccEyebrow}
          </span>
          <h1 data-field-key="ccTitle" className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-neutral-900">
            {c.ccTitle}
          </h1>
          <p data-field-key="ccIntro" className="text-sm text-neutral-600 max-w-2xl mx-auto font-light leading-relaxed">
            {c.ccIntro}
          </p>
        </div>
      </div>

      {/* Benefits grid */}
      <Benefits />

      {/* Step by Step Process */}
      <div data-editor-section="cc-process" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 data-field-key="ccProcessTitle" className="text-2xl font-bold uppercase tracking-tight text-neutral-900">
            {c.ccProcessTitle}
          </h2>
          <p data-field-key="ccProcessSub" className="text-xs text-neutral-500 mt-1 uppercase tracking-wider">
            {c.ccProcessSub}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, idx) => (
            <div key={idx} className="bg-white p-6 border border-gray-200 shadow-sm relative">
              <span className="text-4xl font-black text-ush-pink/30 absolute top-4 right-4">
                {step.num}
              </span>
              <h3 data-field-key={`ccStep${idx + 1}Title`} className="text-base font-bold text-neutral-900 mb-2 pr-8 uppercase">
                {step.title}
              </h3>
              <p data-field-key={`ccStep${idx + 1}Text`} className="text-xs text-neutral-600 font-light leading-relaxed">
                {step.desc}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link
            href={c.ccCtaLink}
            className="inline-flex items-center gap-2 bg-[#1b2333] hover:bg-ush-pink text-white font-bold px-8 py-4 text-xs uppercase tracking-widest transition-colors shadow-md"
          >
            <span data-field-key="ccCtaText">{c.ccCtaText}</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
}
