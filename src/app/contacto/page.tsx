'use client';

import React, { useState, useEffect } from 'react';
import { WholesaleInquiryForm } from '@/components/WholesaleInquiryForm';
import { Mail, MapPin, Phone, Clock, MessageSquare } from 'lucide-react';
import { getWhatsAppNumber, DEFAULT_WHATSAPP_NUMBER } from '@/lib/siteConfig';
import { usePageContent } from '@/lib/siteContentHooks';

export default function ContactoPage() {
  const [whatsapp, setWhatsapp] = useState<string>(DEFAULT_WHATSAPP_NUMBER);
  const c = usePageContent('contacto');

  useEffect(() => {
    getWhatsAppNumber().then(setWhatsapp);
  }, []);

  const waMessage = c.ctWhatsappMessage || 'Hola USH BY USHUAIA, quisiera solicitar información mayorista';

  return (
    <div className="py-12 bg-neutral-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-[0.25em] text-neutral-500 block mb-1">
            {c.ctEyebrow}
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-neutral-900 uppercase tracking-tight">
            {c.ctTitle}
          </h1>
          <p className="text-sm text-neutral-600 mt-2 font-light">
            {c.ctIntro}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Contact Details Column */}
          <div className="space-y-6 lg:col-span-1">
            <div className="bg-white p-6 border border-gray-200 shadow-sm space-y-4">
              <h3 className="text-base font-bold uppercase tracking-wider text-neutral-900 border-b border-gray-100 pb-3">
                {c.ctInfoTitle}
              </h3>

              <div className="flex items-start gap-3">
                <Mail className="text-amber-600 mt-1 flex-shrink-0" size={18} />
                <div>
                  <h4 className="text-xs font-bold uppercase text-neutral-800">Correo Electrónico</h4>
                  <a href={`mailto:${c.ctEmail}`} className="text-xs text-neutral-600 hover:underline">
                    {c.ctEmail}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="text-amber-600 mt-1 flex-shrink-0" size={18} />
                <div>
                  <h4 className="text-xs font-bold uppercase text-neutral-800">Ubicación & Despachos</h4>
                  <p className="text-xs text-neutral-600">{c.ctLocation}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="text-amber-600 mt-1 flex-shrink-0" size={18} />
                <div>
                  <h4 className="text-xs font-bold uppercase text-neutral-800">Horarios de Atención</h4>
                  <p className="text-xs text-neutral-600">{c.ctSchedule1}</p>
                  <p className="text-xs text-neutral-600">{c.ctSchedule2}</p>
                </div>
              </div>
            </div>

            {/* Direct WhatsApp Callout */}
            <div className="bg-emerald-900 text-white p-6 shadow-md space-y-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="text-emerald-400" size={20} />
                <h4 className="text-sm font-bold uppercase tracking-wider">{c.ctWhatsappTitle}</h4>
              </div>
              <p className="text-xs text-emerald-100 font-light leading-relaxed">
                {c.ctWhatsappText}
              </p>
              <a
                href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(waMessage)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block w-full text-center bg-white text-emerald-950 text-xs font-extrabold uppercase py-3 tracking-widest hover:bg-emerald-100 transition-colors"
              >
                {c.ctWhatsappButton}
              </a>
            </div>
          </div>

          {/* Form Column */}
          <div className="lg:col-span-2">
            <WholesaleInquiryForm />
          </div>
        </div>
      </div>
    </div>
  );
}
