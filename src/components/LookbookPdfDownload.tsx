'use client';

import { useState } from 'react';
import { Download, FileText } from 'lucide-react';
import { Product } from '@/types';
import { LookbookConfig } from '@/lib/lookbookPdf';
import { CustomerLookbookEditor } from '@/components/CustomerLookbookEditor';

export function LookbookPdfDownload({ products, config }: { products: Product[]; config: LookbookConfig | null }) {
  const [open, setOpen] = useState(false);

  return (
    <section className="border border-[#d88193]/30 bg-gradient-to-br from-[#fff8f9] to-white p-4 shadow-sm sm:p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#1b2333] text-white"><FileText size={19} /></div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#d88193]">Beneficio exclusivo de tu cuenta</p>
          <h2 className="mt-1 text-sm font-black uppercase tracking-wide text-[#1b2333]">Tu catálogo mayorista listo para compartir</h2>
          <p className="mt-1 text-xs leading-relaxed text-neutral-600">Elige las referencias que quieres compartir, decide si mostrar los precios y descarga un lookbook elegante para tu equipo o tus clientes.</p>
        </div>
      </div>
      <button type="button" onClick={() => setOpen(true)} disabled={!products.length} className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-[#d88193] px-4 py-3 text-[10px] font-black uppercase tracking-widest text-white transition hover:bg-[#c06579] disabled:cursor-not-allowed disabled:opacity-60"><Download size={16} /> Personalizar y descargar PDF</button>
      {open && <CustomerLookbookEditor products={products} config={config} onClose={() => setOpen(false)} />}
    </section>
  );
}
