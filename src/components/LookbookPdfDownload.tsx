'use client';

import Link from 'next/link';
import { Download, FileText } from 'lucide-react';
import { Product } from '@/types';
import { LookbookConfig } from '@/lib/lookbookPdf';

export function LookbookPdfDownload({ products, config }: { products: Product[]; config: LookbookConfig | null }) {
  return (
    <section className="border border-[#d88193]/30 bg-gradient-to-br from-[#fff8f9] to-white p-4 shadow-sm sm:p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#1b2333] text-white"><FileText size={19} /></div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#d88193]">Beneficio exclusivo de tu cuenta</p>
          <h2 className="mt-1 text-sm font-black uppercase tracking-wide text-[#1b2333]">Centro de contenido para vender</h2>
          <p className="mt-1 text-xs leading-relaxed text-neutral-600">Personaliza tu catálogo PDF y descarga fotos y videos de tus referencias desde un solo lugar, listo para compartir con tus clientes.</p>
        </div>
      </div>
      <Link href="/contenido-audiovisual" aria-disabled={!products.length} className={`mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-[#d88193] px-4 py-3 text-[10px] font-black uppercase tracking-widest text-white transition hover:bg-[#c06579] ${!products.length ? 'pointer-events-none opacity-60' : ''}`}><Download size={16} /> Abrir centro de contenido</Link>
    </section>
  );
}
