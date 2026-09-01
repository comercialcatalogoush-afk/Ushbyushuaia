'use client';

import { useState } from 'react';
import { Download, FileText, Loader2 } from 'lucide-react';
import { Product } from '@/types';
import { generateLookbookPdf, LookbookConfig } from '@/lib/lookbookPdf';

export function LookbookPdfDownload({ products, config }: { products: Product[]; config: LookbookConfig | null }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const download = async () => {
    if (busy) return;
    const publicProducts = products.filter((product) => !product.hidden && product.status !== 'draft');
    const selected = config?.selectedProductIds?.length
      ? publicProducts.filter((product) => config.selectedProductIds.includes(product.id))
      : publicProducts;
    if (!selected.length) {
      setMessage('El catálogo está actualizándose. Intenta nuevamente en unos minutos.');
      return;
    }
    setBusy(true);
    setMessage('Preparando tu catálogo…');
    try {
      const result = await generateLookbookPdf(selected, {
        priceMode: config?.customerPriceMode || 'ecommerce',
        groupMode: config?.groupMode || 'category',
        onProgress: (completed, total) => setMessage(`Preparando catálogo: ${completed} de ${total}…`),
      });
      const url = URL.createObjectURL(result.blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = result.fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 2000);
      setMessage(result.failedImages.length ? `Catálogo descargado. ${result.failedImages.length} referencia(s) no tenían imagen disponible.` : 'Catálogo descargado correctamente.');
    } catch (_) {
      setMessage('No pudimos preparar el catálogo. Intenta nuevamente.');
    } finally {
      setBusy(false);
    }
  };

  return <section className="border border-[#d88193]/30 bg-gradient-to-br from-[#fff8f9] to-white p-4 shadow-sm sm:p-5">
    <div className="flex items-start gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#1b2333] text-white"><FileText size={19} /></div>
      <div className="min-w-0 flex-1"><p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#d88193]">Beneficio exclusivo de tu cuenta</p><h2 className="mt-1 text-sm font-black uppercase tracking-wide text-[#1b2333]">Tu catálogo mayorista listo para compartir</h2><p className="mt-1 text-xs leading-relaxed text-neutral-600">Descarga la selección actualizada de USH BY USHUAIA con fotos, referencias y precios para organizar tus compras y mostrársela a tu equipo.</p></div>
    </div>
    <button type="button" onClick={download} disabled={busy} className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-[#d88193] px-4 py-3 text-[10px] font-black uppercase tracking-widest text-white transition hover:bg-[#c06579] disabled:cursor-not-allowed disabled:opacity-60"><Download size={16} /> {busy ? <><Loader2 size={15} className="animate-spin" /> Preparando PDF…</> : 'Descargar catálogo PDF'}</button>
    {message && <p className="mt-2 text-[10px] leading-relaxed text-[#b5586c]">{message}</p>}
  </section>;
}
