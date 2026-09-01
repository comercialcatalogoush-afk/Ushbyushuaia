'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { FileDown, LayoutList, Search, Save, X } from 'lucide-react';
import { Product } from '@/types';
import { getGoogleDriveImageUrl } from '@/lib/drive';
import { supabase } from '@/lib/supabase';
import { generateLookbookPdf, getLookbookPrice, LookbookConfig, LookbookGroupMode, LookbookPriceMode } from '@/lib/lookbookPdf';

function groupProducts(products: Product[], groupMode: LookbookGroupMode) {
  const groups = new Map<string, Product[]>();
  products.forEach((product) => {
    const label = groupMode === 'category' ? (product.category || 'Sin categoría') : (product.fit || 'Sin fit');
    groups.set(label, [...(groups.get(label) || []), product]);
  });
  return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b, 'es'));
}

export function LookbookPdfEditor({ products, onClose }: { products: Product[]; onClose: () => void }) {
  const [priceMode, setPriceMode] = useState<LookbookPriceMode>('ecommerce');
  const [customerPriceMode, setCustomerPriceMode] = useState<'ecommerce' | 'blank'>('ecommerce');
  const [groupMode, setGroupMode] = useState<LookbookGroupMode>('category');
  const [category, setCategory] = useState('Todos');
  const [fit, setFit] = useState('Todos');
  const [search, setSearch] = useState('');
  const [customPrices, setCustomPrices] = useState<Record<string, string>>({});
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [notice, setNotice] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState('');
  const selectionInitialized = useRef(false);

  const publicProducts = useMemo(() => products.filter((product) => !product.hidden && product.status !== 'draft'), [products]);
  useEffect(() => {
    if (selectionInitialized.current || !publicProducts.length) return;
    selectionInitialized.current = true;
    setSelectedIds(new Set(publicProducts.map((product) => product.id)));
  }, [publicProducts]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) return;
      const response = await fetch('/api/lookbook-config', { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' });
      if (!response.ok || cancelled) return;
      const payload = await response.json().catch(() => ({}));
      const config = payload?.config as LookbookConfig | null;
      if (!config || cancelled) return;
      const available = new Set(publicProducts.map((product) => product.id));
      setSelectedIds(new Set(config.selectedProductIds.filter((id) => available.has(id))));
      setGroupMode(config.groupMode === 'fit' ? 'fit' : 'category');
      setCustomerPriceMode(config.customerPriceMode === 'blank' ? 'blank' : 'ecommerce');
      setLastSavedAt(config.updatedAt ? new Date(config.updatedAt).toLocaleString('es-CO') : '');
    })().catch(() => {});
    return () => { cancelled = true; };
  }, [publicProducts]);

  const categories = useMemo(() => ['Todos', ...Array.from(new Set(publicProducts.map((product) => product.category).filter(Boolean) as string[])).sort((a, b) => a.localeCompare(b, 'es'))], [publicProducts]);
  const fits = useMemo(() => ['Todos', ...Array.from(new Set(publicProducts.map((product) => product.fit).filter(Boolean) as string[])).sort((a, b) => a.localeCompare(b, 'es'))], [publicProducts]);
  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    return publicProducts.filter((product) => {
      const matchesQuery = !query || [product.name, product.reference, product.category, product.fit].some((value) => String(value || '').toLowerCase().includes(query));
      return matchesQuery && (category === 'Todos' || product.category === category) && (fit === 'Todos' || product.fit === fit);
    });
  }, [publicProducts, search, category, fit]);
  const selectedProducts = useMemo(() => publicProducts.filter((product) => selectedIds.has(product.id)), [publicProducts, selectedIds]);
  const previewGroups = useMemo(() => groupProducts(filteredProducts, groupMode), [filteredProducts, groupMode]);

  const toggleProduct = (productId: string) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(productId)) next.delete(productId);
      else next.add(productId);
      return next;
    });
  };

  const selectVisible = (selected: boolean) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      filteredProducts.forEach((product) => selected ? next.add(product.id) : next.delete(product.id));
      return next;
    });
  };

  const saveConfiguration = async () => {
    if (!selectedProducts.length) {
      setNotice('Selecciona al menos una referencia antes de publicar.');
      return;
    }
    setIsSaving(true);
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) throw new Error('La sesión de administrador no está disponible.');
      const response = await fetch('/api/lookbook-config', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ selectedProductIds: Array.from(selectedIds), groupMode, customerPriceMode }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || 'No se pudo publicar el catálogo.');
      const updatedAt = payload.config?.updatedAt || new Date().toISOString();
      setLastSavedAt(new Date(updatedAt).toLocaleString('es-CO'));
      setNotice('Catálogo publicado para los clientes registrados.');
    } catch (error: any) {
      setNotice(error?.message || 'No se pudo publicar el catálogo.');
    } finally {
      setIsSaving(false);
    }
  };

  const downloadPdf = async () => {
    if (isGenerating) return;
    if (!selectedProducts.length) {
      setNotice('Selecciona al menos una referencia para generar el PDF.');
      return;
    }
    setIsGenerating(true);
    setNotice('Preparando el PDF…');
    try {
      const result = await generateLookbookPdf(selectedProducts, {
        priceMode,
        groupMode,
        customPrices,
        onProgress: (completed, total) => setNotice(`Preparando imágenes: ${completed} de ${total}…`),
      });
      const url = URL.createObjectURL(result.blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = result.fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 2000);
      setNotice(result.failedImages.length ? `PDF descargado. Revisa ${result.failedImages.length} referencia(s) sin imagen.` : `PDF descargado correctamente con ${selectedProducts.length} referencias.`);
    } catch (error) {
      console.error('Error generando catálogo PDF:', error);
      setNotice('No se pudo generar el PDF. Intenta nuevamente.');
    } finally {
      setIsGenerating(false);
    }
  };

  return <div className="fixed inset-0 z-[70] overflow-y-auto bg-[#111827]/80 p-3 sm:p-8">
    <div className="mx-auto max-w-6xl overflow-hidden rounded-xl bg-white shadow-2xl">
      <div className="flex items-start justify-between gap-4 bg-[#1b2333] p-5 text-white sm:p-6">
        <div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#f3b3c0]">Lookbook editorial · 2026</p><h2 className="mt-1 text-xl font-black uppercase">Catálogo PDF</h2><p className="mt-1 max-w-xl text-xs leading-relaxed text-white/70">Crea una edición elegante, selecciona las referencias y publícala para que tus clientes registrados también puedan descargarla.</p></div>
        <button type="button" onClick={onClose} aria-label="Cerrar editor" className="rounded-full p-1.5 text-white/70 hover:bg-white/10 hover:text-white"><X size={20} /></button>
      </div>
      <div className="grid gap-5 p-4 sm:p-6 lg:grid-cols-[270px_1fr]">
        <aside className="space-y-4 border-b border-neutral-200 pb-5 lg:border-b-0 lg:border-r lg:pr-5">
          <div><label className="mb-1 block text-[10px] font-black uppercase tracking-wider text-neutral-500">Precio del PDF del administrador</label><div className="grid grid-cols-1 gap-1.5">{([['ecommerce','Precios ecommerce'],['custom','Precios personalizados'],['blank','Sin precios']] as const).map(([value, label]) => <button key={value} type="button" onClick={() => setPriceMode(value)} className={`rounded-lg border px-3 py-2 text-left text-[11px] font-bold ${priceMode === value ? 'border-[#d88193] bg-[#fff3f5] text-[#b5586c]' : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50'}`}>{label}</button>)}</div></div>
          <div><label className="mb-1 block text-[10px] font-black uppercase tracking-wider text-neutral-500">Precio para clientes registrados</label><div className="grid grid-cols-2 gap-1.5">{([['ecommerce','Con precios'],['blank','Sin precios']] as const).map(([value, label]) => <button key={value} type="button" onClick={() => setCustomerPriceMode(value)} className={`rounded-lg border px-2 py-2 text-[10px] font-bold ${customerPriceMode === value ? 'border-[#d88193] bg-[#fff3f5] text-[#b5586c]' : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50'}`}>{label}</button>)}</div></div>
          <div><label className="mb-1 block text-[10px] font-black uppercase tracking-wider text-neutral-500">Agrupar catálogo por</label><div className="grid grid-cols-2 gap-1.5">{([['category','Categoría'],['fit','Fit']] as const).map(([value, label]) => <button key={value} type="button" onClick={() => setGroupMode(value)} className={`rounded-lg border px-3 py-2 text-[11px] font-bold ${groupMode === value ? 'border-[#d88193] bg-[#fff3f5] text-[#b5586c]' : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50'}`}><LayoutList size={13} className="mr-1 inline" />{label}</button>)}</div></div>
          <label className="block"><span className="mb-1 block text-[10px] font-black uppercase tracking-wider text-neutral-500">Categoría</span><select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-xs"><option value="Todos">Todas</option>{categories.filter((item) => item !== 'Todos').map((item) => <option key={item}>{item}</option>)}</select></label>
          <label className="block"><span className="mb-1 block text-[10px] font-black uppercase tracking-wider text-neutral-500">Fit</span><select value={fit} onChange={(e) => setFit(e.target.value)} className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-xs"><option value="Todos">Todos</option>{fits.filter((item) => item !== 'Todos').map((item) => <option key={item}>{item}</option>)}</select></label>
          <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3"><div className="flex items-center justify-between gap-2"><span className="text-[10px] font-black uppercase tracking-wider text-neutral-500">Selección publicada</span><strong className="text-xs text-[#1b2333]">{selectedIds.size} / {publicProducts.length}</strong></div><div className="mt-2 grid grid-cols-2 gap-1.5"><button type="button" onClick={() => selectVisible(true)} className="rounded border border-neutral-200 bg-white px-2 py-1.5 text-[10px] font-bold text-neutral-600 hover:border-[#d88193]">Seleccionar visibles</button><button type="button" onClick={() => selectVisible(false)} className="rounded border border-neutral-200 bg-white px-2 py-1.5 text-[10px] font-bold text-neutral-600 hover:border-[#d88193]">Quitar visibles</button></div></div>
          <button type="button" onClick={saveConfiguration} disabled={isSaving || !selectedProducts.length} className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#1b2333] bg-white px-3 py-3 text-[10px] font-black uppercase tracking-wide text-[#1b2333] hover:bg-[#fff3f5] disabled:cursor-not-allowed disabled:opacity-50"><Save size={15} /> {isSaving ? 'Publicando…' : 'Guardar y publicar'}</button>
          <button type="button" onClick={downloadPdf} disabled={isGenerating || !selectedProducts.length} className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#d88193] px-3 py-3 text-[11px] font-black uppercase tracking-wide text-white hover:bg-[#c06579] disabled:cursor-not-allowed disabled:opacity-50"><FileDown size={16} /> {isGenerating ? 'Generando PDF…' : 'Descargar PDF'}</button>
          {lastSavedAt && <p className="text-[10px] text-neutral-500">Última publicación: {lastSavedAt}</p>}
          {notice && <p className="text-[11px] leading-relaxed text-[#b5586c]">{notice}</p>}
        </aside>
        <main className="min-w-0">
          <div className="mb-4 flex flex-col gap-3 border-b border-neutral-200 pb-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-black uppercase text-[#1b2333]">{filteredProducts.length} visibles · {selectedProducts.length} seleccionadas</p><p className="text-[11px] text-neutral-500">Marca o desmarca cada referencia. La publicación para clientes no incluye precios personalizados del administrador.</p></div><label className="relative block sm:w-64"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar referencia" className="w-full rounded-lg border border-neutral-200 py-2 pl-9 pr-3 text-xs focus:border-[#d88193] focus:outline-none" /></label></div>
          <div className="max-h-[62vh] space-y-6 overflow-y-auto pr-1">{previewGroups.map(([group, groupProducts]) => <section key={group}><h3 className="mb-2 border-b border-neutral-200 pb-2 text-xs font-black uppercase tracking-wider text-[#d88193]">{group}</h3><div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">{groupProducts.map((product) => <label key={product.id} className={`flex cursor-pointer gap-2 rounded-lg border p-2 transition-colors ${selectedIds.has(product.id) ? 'border-[#d88193] bg-[#fff8f9]' : 'border-neutral-100 bg-neutral-50 opacity-60'}`}><input type="checkbox" checked={selectedIds.has(product.id)} onChange={() => toggleProduct(product.id)} aria-label={`Incluir referencia ${product.reference}`} className="mt-1 h-4 w-4 shrink-0 accent-[#d88193]" /><div className="h-16 w-12 shrink-0 overflow-hidden bg-neutral-200">{product.images?.[0] && <img src={getGoogleDriveImageUrl(product.images[0])} alt="" className="h-full w-full object-cover" />}</div><div className="min-w-0 flex-1"><p className="truncate text-[10px] font-black uppercase text-[#1b2333]">{product.reference}</p><p className="line-clamp-2 text-[10px] leading-tight text-neutral-600">{product.name}</p>{priceMode === 'custom' ? <div className="mt-1 flex items-center gap-1"><span className="text-[10px] text-neutral-400">$</span><input type="number" min="0" value={customPrices[product.id] || ''} onChange={(e) => setCustomPrices((current) => ({ ...current, [product.id]: e.target.value }))} onClick={(e) => e.stopPropagation()} placeholder="Precio" className="w-full rounded border border-neutral-200 bg-white px-1.5 py-1 text-[11px] focus:border-[#d88193] focus:outline-none" /></div> : <p className="mt-1 text-[10px] font-bold text-[#d88193]">{priceMode === 'blank' ? 'Sin precio' : getLookbookPrice(product, priceMode)}</p>}</div></label>)}</div></section>)}{previewGroups.length === 0 && <p className="py-10 text-center text-xs text-neutral-500">No encontramos referencias con esos filtros.</p>}</div>
        </main>
      </div>
    </div>
  </div>;
}
