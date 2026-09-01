'use client';

import { useEffect, useMemo, useState } from 'react';
import { Download, FileText, LayoutList, Search, X } from 'lucide-react';
import { Product } from '@/types';
import { getGoogleDriveImageUrl } from '@/lib/drive';
import { generateLookbookPdf, getLookbookPrice, LookbookConfig, LookbookGroupMode, LookbookPriceMode } from '@/lib/lookbookPdf';

function groupProducts(products: Product[], groupMode: LookbookGroupMode) {
  const groups = new Map<string, Product[]>();
  products.forEach((product) => {
    const group = groupMode === 'category' ? (product.category || 'Sin categoría') : (product.fit || 'Sin fit');
    groups.set(group, [...(groups.get(group) || []), product]);
  });
  return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b, 'es'));
}

export function CustomerLookbookEditor({
  products,
  config,
  onClose,
}: {
  products: Product[];
  config: LookbookConfig | null;
  onClose: () => void;
}) {
  const publicProducts = useMemo(
    () => products.filter((product) => !product.hidden && product.status !== 'draft'),
    [products]
  );
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [priceMode, setPriceMode] = useState<LookbookPriceMode>(config?.customerPriceMode === 'blank' ? 'blank' : 'ecommerce');
  const [groupMode, setGroupMode] = useState<LookbookGroupMode>(config?.groupMode || 'category');
  const [category, setCategory] = useState('all');
  const [fit, setFit] = useState('all');
  const [search, setSearch] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const publishedIds = config?.selectedProductIds?.length
      ? publicProducts.filter((product) => config.selectedProductIds.includes(product.id)).map((product) => product.id)
      : publicProducts.map((product) => product.id);
    setSelectedIds(new Set(publishedIds));
  }, [config, publicProducts]);

  const categories = useMemo(() => Array.from(new Set(publicProducts.map((product) => product.category).filter((value): value is string => Boolean(value)))).sort((a, b) => a.localeCompare(b, 'es')), [publicProducts]);
  const fits = useMemo(() => Array.from(new Set(publicProducts.map((product) => product.fit).filter((value): value is string => Boolean(value)))).sort((a, b) => a.localeCompare(b, 'es')), [publicProducts]);
  const filteredProducts = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return publicProducts.filter((product) => {
      const matchesCategory = category === 'all' || product.category === category;
      const matchesFit = fit === 'all' || product.fit === fit;
      const matchesSearch = !needle || [product.reference, product.name, product.category, product.fit].some((value) => String(value || '').toLowerCase().includes(needle));
      return matchesCategory && matchesFit && matchesSearch;
    });
  }, [category, fit, publicProducts, search]);
  const previewGroups = useMemo(() => groupProducts(filteredProducts, groupMode), [filteredProducts, groupMode]);
  const selectedProducts = useMemo(() => publicProducts.filter((product) => selectedIds.has(product.id)), [publicProducts, selectedIds]);

  const toggleProduct = (id: string) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const selectVisible = (include: boolean) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      filteredProducts.forEach((product) => include ? next.add(product.id) : next.delete(product.id));
      return next;
    });
  };

  const download = async () => {
    if (busy) return;
    if (!selectedProducts.length) {
      setMessage('Selecciona al menos una referencia para crear tu catálogo.');
      return;
    }
    setBusy(true);
    setMessage('Preparando tu catálogo...');
    try {
      const result = await generateLookbookPdf(selectedProducts, {
        priceMode,
        groupMode,
        onProgress: (completed, total) => setMessage(`Preparando catálogo: ${completed} de ${total}...`),
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

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[#111827]/75 p-2 sm:p-5" role="dialog" aria-modal="true" aria-label="Personalizar catálogo PDF">
      <div className="flex max-h-[96vh] w-full max-w-6xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
        <header className="flex items-start justify-between gap-4 bg-[#1b2333] px-4 py-4 text-white sm:px-6">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#f3b3c0]">Beneficio de tu cuenta mayorista</p>
            <h2 className="mt-1 text-lg font-black uppercase sm:text-xl">Personaliza tu catálogo PDF</h2>
            <p className="mt-1 max-w-2xl text-xs leading-relaxed text-white/70">Elige las referencias que quieres compartir, agrúpalas por categoría o fit y decide si deseas mostrar los precios.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Cerrar editor" className="rounded-full p-1 text-white/70 hover:bg-white/10 hover:text-white"><X size={20} /></button>
        </header>

        <div className="grid min-h-0 flex-1 lg:grid-cols-[250px_1fr]">
          <aside className="space-y-4 overflow-y-auto border-b border-neutral-200 bg-[#fafafa] p-4 lg:border-b-0 lg:border-r">
            <div>
              <p className="mb-2 text-[10px] font-black uppercase tracking-wider text-neutral-500">Mostrar precios</p>
              <div className="grid gap-2">
                {([['ecommerce', 'Con precios'], ['blank', 'Sin precios']] as Array<[LookbookPriceMode, string]>).map(([value, label]) => <button key={value} type="button" onClick={() => setPriceMode(value)} className={`rounded-lg border px-3 py-2 text-left text-[11px] font-bold transition ${priceMode === value ? 'border-[#d88193] bg-[#fff1f4] text-[#b5586c]' : 'border-neutral-200 bg-white text-neutral-600 hover:border-[#d88193]'}`}>{label}</button>)}
              </div>
            </div>
            <div>
              <p className="mb-2 text-[10px] font-black uppercase tracking-wider text-neutral-500">Agrupar por</p>
              <div className="grid grid-cols-2 gap-2">
                {([['category', 'Categoría'], ['fit', 'Fit']] as Array<[LookbookGroupMode, string]>).map(([value, label]) => <button key={value} type="button" onClick={() => setGroupMode(value)} className={`rounded-lg border px-2 py-2 text-[10px] font-bold transition ${groupMode === value ? 'border-[#d88193] bg-[#fff1f4] text-[#b5586c]' : 'border-neutral-200 bg-white text-neutral-600 hover:border-[#d88193]'}`}><LayoutList size={13} className="mr-1 inline" />{label}</button>)}
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-[10px] font-black uppercase tracking-wider text-neutral-500">Filtrar referencias</p>
              <div className="relative"><Search size={14} className="absolute left-3 top-2.5 text-neutral-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar referencia" className="w-full rounded-lg border border-neutral-200 bg-white py-2 pl-8 pr-2 text-xs outline-none focus:border-[#d88193]" /></div>
              <select value={category} onChange={(event) => setCategory(event.target.value)} className="w-full rounded-lg border border-neutral-200 bg-white px-2 py-2 text-xs text-neutral-600 outline-none focus:border-[#d88193]"><option value="all">Todas las categorías</option>{categories.map((value) => <option key={value} value={value}>{value}</option>)}</select>
              <select value={fit} onChange={(event) => setFit(event.target.value)} className="w-full rounded-lg border border-neutral-200 bg-white px-2 py-2 text-xs text-neutral-600 outline-none focus:border-[#d88193]"><option value="all">Todos los fits</option>{fits.map((value) => <option key={value} value={value}>{value}</option>)}</select>
            </div>
            <div className="border-t border-neutral-200 pt-3">
              <p className="text-sm font-black text-[#1b2333]">{selectedProducts.length} seleccionadas</p>
              <p className="mt-1 text-[10px] leading-relaxed text-neutral-500">La edición publicada por USH aparece preseleccionada. Puedes ajustarla antes de descargarla.</p>
              <div className="mt-3 grid grid-cols-2 gap-2"><button type="button" onClick={() => selectVisible(true)} className="rounded-lg border border-neutral-200 bg-white px-2 py-2 text-[9px] font-black uppercase text-neutral-600 hover:border-[#d88193]">Incluir visibles</button><button type="button" onClick={() => selectVisible(false)} className="rounded-lg border border-neutral-200 bg-white px-2 py-2 text-[9px] font-black uppercase text-neutral-600 hover:border-[#d88193]">Quitar visibles</button></div>
            </div>
            <button type="button" onClick={download} disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#d88193] px-3 py-3 text-[10px] font-black uppercase tracking-wide text-white hover:bg-[#c06579] disabled:cursor-not-allowed disabled:opacity-60"><Download size={15} />{busy ? 'Preparando...' : 'Descargar mi PDF'}</button>
            {message && <p className="text-[10px] leading-relaxed text-[#b5586c]">{message}</p>}
          </aside>

          <main className="min-h-0 overflow-y-auto p-4 sm:p-6">
            <div className="mb-4 flex items-center justify-between gap-3 border-b border-neutral-200 pb-3"><div><p className="text-[10px] font-black uppercase tracking-wider text-[#d88193]">Vista de selección</p><p className="mt-1 text-xs text-neutral-500">{filteredProducts.length} referencias visibles de {publicProducts.length}</p></div><FileText size={20} className="text-[#d88193]" /></div>
            <div className="space-y-6">{previewGroups.map(([group, groupProducts]) => <section key={group}><h3 className="mb-2 border-b border-neutral-200 pb-2 text-xs font-black uppercase tracking-wider text-[#d88193]">{group}</h3><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{groupProducts.map((product) => <label key={product.id} className={`flex cursor-pointer gap-2 rounded-lg border p-2 transition ${selectedIds.has(product.id) ? 'border-[#d88193] bg-[#fff8f9]' : 'border-neutral-100 bg-neutral-50 opacity-60'}`}><input type="checkbox" checked={selectedIds.has(product.id)} onChange={() => toggleProduct(product.id)} aria-label={`Incluir referencia ${product.reference}`} className="mt-1 h-4 w-4 shrink-0 accent-[#d88193]" /><div className="h-20 w-14 shrink-0 overflow-hidden bg-neutral-200"><img src={getGoogleDriveImageUrl(product.images?.[0] || '')} alt="" className="h-full w-full object-cover" /></div><div className="min-w-0 flex-1"><p className="text-[10px] font-black uppercase text-[#1b2333]">{product.reference}</p><p className="line-clamp-2 text-[10px] leading-tight text-neutral-600">{product.name}</p><p className="mt-1 text-[9px] text-neutral-400">{product.fit || 'Sin fit'}</p><p className="mt-1 text-[10px] font-bold text-[#d88193]">{getLookbookPrice(product, priceMode) || 'Sin precio'}</p></div></label>)}</div></section>)}{previewGroups.length === 0 && <p className="py-16 text-center text-xs text-neutral-500">No encontramos referencias con esos filtros.</p>}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
