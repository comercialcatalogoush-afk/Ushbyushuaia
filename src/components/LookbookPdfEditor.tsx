'use client';

import { useMemo, useState } from 'react';
import { FileDown, LayoutList, Search, X } from 'lucide-react';
import { Product } from '@/types';

type PriceMode = 'ecommerce' | 'custom' | 'blank';
type GroupMode = 'category' | 'fit';

const money = (value: number) => `$ ${new Intl.NumberFormat('es-CO').format(Math.round(value || 0))}`;

function escapeHtml(value: unknown) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function downloadPrice(product: Product, mode: PriceMode, customPrices: Record<string, string>) {
  if (mode === 'blank') return '';
  if (mode === 'custom') {
    const custom = Number(customPrices[product.id]);
    return custom > 0 ? money(custom) : '';
  }
  return money(product.suggested_price || product.compare_price || product.price || 0);
}

export function LookbookPdfEditor({ products, onClose }: { products: Product[]; onClose: () => void }) {
  const [priceMode, setPriceMode] = useState<PriceMode>('ecommerce');
  const [groupMode, setGroupMode] = useState<GroupMode>('category');
  const [category, setCategory] = useState('Todos');
  const [fit, setFit] = useState('Todos');
  const [search, setSearch] = useState('');
  const [customPrices, setCustomPrices] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState('');

  const publicProducts = useMemo(() => products.filter((product) => !product.hidden && product.status !== 'draft'), [products]);
  const categories = useMemo(() => ['Todos', ...Array.from(new Set(publicProducts.map((product) => product.category).filter(Boolean) as string[])).sort((a, b) => a.localeCompare(b, 'es'))], [publicProducts]);
  const fits = useMemo(() => ['Todos', ...Array.from(new Set(publicProducts.map((product) => product.fit).filter(Boolean) as string[])).sort((a, b) => a.localeCompare(b, 'es'))], [publicProducts]);
  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    return publicProducts.filter((product) => {
      const matchesQuery = !query || [product.name, product.reference, product.category, product.fit].some((value) => String(value || '').toLowerCase().includes(query));
      return matchesQuery && (category === 'Todos' || product.category === category) && (fit === 'Todos' || product.fit === fit);
    });
  }, [publicProducts, search, category, fit]);

  const groupedProducts = useMemo(() => {
    const groups = new Map<string, Product[]>();
    filteredProducts.forEach((product) => {
      const label = groupMode === 'category' ? (product.category || 'Sin categoría') : (product.fit || 'Sin fit');
      groups.set(label, [...(groups.get(label) || []), product]);
    });
    return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b, 'es'));
  }, [filteredProducts, groupMode]);

  const setCustomPrice = (productId: string, value: string) => {
    setCustomPrices((current) => ({ ...current, [productId]: value }));
  };

  const openPrintableLookbook = () => {
    if (filteredProducts.length === 0) {
      setNotice('No hay referencias con los filtros actuales.');
      return;
    }

    const printedAt = new Date().toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' });
    const groupsHtml = groupedProducts.map(([group, groupProducts]) => `
      <section class="group">
        <div class="group-heading"><span>${escapeHtml(groupMode === 'category' ? 'Categoría' : 'Fit')}</span><h2>${escapeHtml(group)}</h2></div>
        <div class="grid">
          ${groupProducts.map((product) => {
            const image = product.images?.[0] || '';
            const price = downloadPrice(product, priceMode, customPrices);
            return `<article class="card">
              ${image ? `<img src="${escapeHtml(image)}" alt="${escapeHtml(product.name)}" />` : '<div class="no-image">USH</div>'}
              <div class="card-body"><p class="ref">REF. ${escapeHtml(product.reference)}</p><h3>${escapeHtml(product.name)}</h3>${product.fit ? `<p class="fit">${escapeHtml(product.fit)}</p>` : ''}${price ? `<p class="price">${escapeHtml(price)}</p>` : ''}</div>
            </article>`;
          }).join('')}
        </div>
      </section>`).join('');

    // No usar `noopener` aquí: Chrome puede devolver `null` aunque haya
    // abierto la pestaña, dejando un about:blank sin contenido. Separamos
    // el vínculo después de obtener la referencia a la ventana.
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      setNotice('El navegador bloqueó la ventana. Permite ventanas emergentes para generar el PDF.');
      return;
    }
    printWindow.opener = null;
    printWindow.document.write(`<!doctype html><html lang="es"><head><meta charset="utf-8" /><title>CATÁLOGO LOOKBOOK EDITORIAL 2026</title><style>
      @page{size:A4;margin:12mm}*{box-sizing:border-box}body{margin:0;color:#1b2333;font-family:Arial,Helvetica,sans-serif;background:#fff}.cover{padding:18mm 4mm 12mm;border-bottom:2px solid #d88193;margin-bottom:8mm}.eyebrow{font-size:9px;letter-spacing:2px;text-transform:uppercase;color:#d88193;font-weight:700}.cover h1{font-size:29px;line-height:1.05;margin:8px 0 5px;text-transform:uppercase}.cover p{font-size:11px;color:#6b7280;margin:0}.group{break-before:page}.group:first-of-type{break-before:auto}.group-heading{display:flex;align-items:baseline;gap:8px;border-bottom:1px solid #e5e7eb;padding-bottom:5px;margin-bottom:8mm}.group-heading span{font-size:8px;text-transform:uppercase;letter-spacing:1px;color:#d88193;font-weight:700}.group-heading h2{font-size:18px;text-transform:uppercase;margin:0}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:7mm 5mm}.card{break-inside:avoid;border:1px solid #ececec;background:#fff}.card img,.no-image{display:block;width:100%;height:74mm;object-fit:cover;background:#f5f5f5}.no-image{display:flex;align-items:center;justify-content:center;color:#d88193;font-size:22px;font-weight:800}.card-body{padding:7px 8px 9px}.ref{font-size:7px;letter-spacing:1px;color:#d88193;font-weight:700;margin:0 0 3px}.card h3{font-size:10px;text-transform:uppercase;margin:0;line-height:1.25}.fit{font-size:8px;color:#6b7280;margin:4px 0 0}.price{font-size:11px;font-weight:800;margin:6px 0 0}.footer{font-size:8px;color:#9ca3af;margin-top:10mm;text-align:center}@media print{.footer{position:fixed;bottom:0;left:0;right:0}.cover{break-after:page}}
    </style></head><body><header class="cover"><div class="eyebrow">USH BY USHUAIA · MAYORISTAS</div><h1>Catálogo lookbook editorial 2026</h1><p>${escapeHtml(filteredProducts.length)} referencias · ${escapeHtml(priceMode === 'ecommerce' ? 'Precios ecommerce' : priceMode === 'custom' ? 'Precios personalizados' : 'Sin precios')} · ${escapeHtml(printedAt)}</p></header>${groupsHtml}<p class="footer">USH BY USHUAIA · Catálogo digital · Las imágenes se cargan desde sus URLs externas</p><script>window.addEventListener('load',()=>setTimeout(()=>window.print(),700))</script></body></html>`);
    printWindow.document.close();
    setNotice('Versión imprimible abierta. En la ventana nueva elige “Guardar como PDF”.');
  };

  return <div className="fixed inset-0 z-[70] overflow-y-auto bg-[#111827]/80 p-3 sm:p-8">
    <div className="mx-auto max-w-6xl overflow-hidden rounded-xl bg-white shadow-2xl">
      <div className="flex items-start justify-between gap-4 bg-[#1b2333] p-5 text-white sm:p-6">
        <div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#f3b3c0]">Lookbook 2026</p><h2 className="mt-1 text-xl font-black uppercase">Catálogo PDF</h2><p className="mt-1 text-xs text-white/70">Edita precios y abre una versión lista para guardar como PDF.</p></div>
        <button type="button" onClick={onClose} aria-label="Cerrar editor" className="rounded-full p-1.5 text-white/70 hover:bg-white/10 hover:text-white"><X size={20} /></button>
      </div>
      <div className="grid gap-5 p-4 sm:p-6 lg:grid-cols-[260px_1fr]">
        <aside className="space-y-4 border-b border-neutral-200 pb-5 lg:border-b-0 lg:border-r lg:pr-5">
          <div><label className="mb-1 block text-[10px] font-black uppercase tracking-wider text-neutral-500">Precio</label><div className="grid grid-cols-1 gap-1.5">{([['ecommerce','Ecommerce'],['custom','Personalizados'],['blank','Sin precios']] as const).map(([value, label]) => <button key={value} type="button" onClick={() => setPriceMode(value)} className={`rounded-lg border px-3 py-2 text-left text-[11px] font-bold ${priceMode === value ? 'border-[#d88193] bg-[#fff3f5] text-[#b5586c]' : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50'}`}>{label}</button>)}</div></div>
          <div><label className="mb-1 block text-[10px] font-black uppercase tracking-wider text-neutral-500">Agrupar por</label><div className="grid grid-cols-2 gap-1.5">{([['category','Categoría'],['fit','Fit']] as const).map(([value, label]) => <button key={value} type="button" onClick={() => setGroupMode(value)} className={`rounded-lg border px-3 py-2 text-[11px] font-bold ${groupMode === value ? 'border-[#d88193] bg-[#fff3f5] text-[#b5586c]' : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50'}`}><LayoutList size={13} className="mr-1 inline" />{label}</button>)}</div></div>
          <label className="block"><span className="mb-1 block text-[10px] font-black uppercase tracking-wider text-neutral-500">Categoría</span><select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-xs"><option value="Todos">Todas</option>{categories.filter((item) => item !== 'Todos').map((item) => <option key={item}>{item}</option>)}</select></label>
          <label className="block"><span className="mb-1 block text-[10px] font-black uppercase tracking-wider text-neutral-500">Fit</span><select value={fit} onChange={(e) => setFit(e.target.value)} className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-xs"><option value="Todos">Todos</option>{fits.filter((item) => item !== 'Todos').map((item) => <option key={item}>{item}</option>)}</select></label>
          <button type="button" onClick={openPrintableLookbook} className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#d88193] px-3 py-3 text-[11px] font-black uppercase tracking-wide text-white hover:bg-[#c06579]"><FileDown size={16} /> Abrir para PDF</button>
          {notice && <p className="text-[11px] leading-relaxed text-[#b5586c]">{notice}</p>}
        </aside>
        <main className="min-w-0">
          <div className="mb-4 flex flex-col gap-3 border-b border-neutral-200 pb-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-black uppercase text-[#1b2333]">{filteredProducts.length} referencias</p><p className="text-[11px] text-neutral-500">Los precios personalizados solo se usan en este PDF.</p></div><label className="relative block sm:w-64"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar referencia" className="w-full rounded-lg border border-neutral-200 py-2 pl-9 pr-3 text-xs focus:border-[#d88193] focus:outline-none" /></label></div>
          <div className="max-h-[62vh] space-y-6 overflow-y-auto pr-1">{groupedProducts.map(([group, groupProducts]) => <section key={group}><h3 className="mb-2 border-b border-neutral-200 pb-2 text-xs font-black uppercase tracking-wider text-[#d88193]">{group}</h3><div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">{groupProducts.map((product) => <div key={product.id} className="flex gap-2 rounded-lg border border-neutral-100 bg-neutral-50 p-2"><div className="h-16 w-12 shrink-0 overflow-hidden bg-neutral-200">{product.images?.[0] && <img src={product.images[0]} alt="" className="h-full w-full object-cover" />}</div><div className="min-w-0 flex-1"><p className="truncate text-[10px] font-black uppercase text-[#1b2333]">{product.reference}</p><p className="truncate text-[10px] text-neutral-600">{product.name}</p>{priceMode === 'custom' ? <div className="mt-1 flex items-center gap-1"><span className="text-[10px] text-neutral-400">$</span><input type="number" min="0" value={customPrices[product.id] || ''} onChange={(e) => setCustomPrice(product.id, e.target.value)} placeholder="Precio" className="w-full rounded border border-neutral-200 bg-white px-1.5 py-1 text-[11px] focus:border-[#d88193] focus:outline-none" /></div> : <p className="mt-1 text-[10px] font-bold text-[#d88193]">{priceMode === 'blank' ? 'Sin precio' : downloadPrice(product, priceMode, customPrices)}</p>}</div></div>)}</div></section>)}{groupedProducts.length === 0 && <p className="py-10 text-center text-xs text-neutral-500">No encontramos referencias con esos filtros.</p>}</div>
        </main>
      </div>
    </div>
  </div>;
}
