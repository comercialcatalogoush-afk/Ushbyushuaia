'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { FileDown, LayoutList, Search, X } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { Product } from '@/types';
import { getGoogleDriveImageUrl } from '@/lib/drive';

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

type PdfImage = { data: string; format: 'JPEG' | 'PNG'; width: number; height: number };

function loadPdfImage(url: string): Promise<PdfImage | null> {
  if (!url) return Promise.resolve(null);
  return new Promise((resolve) => {
    const image = new Image();
    let settled = false;
    const finish = (value: PdfImage | null) => {
      if (settled) return;
      settled = true;
      resolve(value);
    };
    const timeout = window.setTimeout(() => finish(null), 5000);
    image.crossOrigin = 'anonymous';
    image.onload = () => {
      window.clearTimeout(timeout);
      try {
        const canvas = document.createElement('canvas');
        canvas.width = image.naturalWidth || image.width;
        canvas.height = image.naturalHeight || image.height;
        const context = canvas.getContext('2d');
        if (!context || !canvas.width || !canvas.height) return finish(null);
        context.drawImage(image, 0, 0);
        finish({ data: canvas.toDataURL('image/jpeg', 0.82), format: 'JPEG', width: canvas.width, height: canvas.height });
      } catch (_) {
        // Algunos CDNs permiten mostrar la imagen, pero no leerla desde canvas.
        // El PDF continúa generándose con el espacio reservado para la foto.
        finish(null);
      }
    };
    image.onerror = () => {
      window.clearTimeout(timeout);
      finish(null);
    };
    image.src = url;
  });
}

function clipPdfText(doc: jsPDF, value: unknown, maxWidth: number) {
  const text = String(value || '').replace(/\s+/g, ' ').trim() || '—';
  return (doc.splitTextToSize(text, maxWidth) as string[])[0] || '—';
}

function drawPdfFooter(doc: jsPDF, pageNumber: number) {
  doc.setDrawColor(229, 229, 232);
  doc.setLineWidth(0.25);
  doc.line(14, 283, 196, 283);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(150, 156, 165);
  doc.text('USH BY USHUAIA · Catálogo digital · Imágenes desde URLs externas', 14, 289);
  doc.text(`Página ${pageNumber}`, 196, 289, { align: 'right' });
}

export function LookbookPdfEditor({ products, onClose }: { products: Product[]; onClose: () => void }) {
  const [priceMode, setPriceMode] = useState<PriceMode>('ecommerce');
  const [groupMode, setGroupMode] = useState<GroupMode>('category');
  const [category, setCategory] = useState('Todos');
  const [fit, setFit] = useState('Todos');
  const [search, setSearch] = useState('');
  const [customPrices, setCustomPrices] = useState<Record<string, string>>({});
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [notice, setNotice] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const selectionInitialized = useRef(false);

  const publicProducts = useMemo(() => products.filter((product) => !product.hidden && product.status !== 'draft'), [products]);
  useEffect(() => {
    // La primera apertura empieza con todo seleccionado. Después, las
    // selecciones manuales se respetan, incluso si el usuario desmarca todo.
    if (!selectionInitialized.current) {
      selectionInitialized.current = true;
      setSelectedIds(new Set(publicProducts.map((product) => product.id)));
      return;
    }
    setSelectedIds((current) => {
      const available = new Set(publicProducts.map((product) => product.id));
      const next = new Set(Array.from(current).filter((id) => available.has(id)));
      return next.size === current.size && Array.from(next).every((id) => current.has(id)) ? current : next;
    });
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

  const groupedProducts = useMemo(() => {
    const groups = new Map<string, Product[]>();
    filteredProducts.forEach((product) => {
      const label = groupMode === 'category' ? (product.category || 'Sin categoría') : (product.fit || 'Sin fit');
      groups.set(label, [...(groups.get(label) || []), product]);
    });
    return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b, 'es'));
  }, [filteredProducts, groupMode]);

  const selectedProducts = useMemo(() => publicProducts.filter((product) => selectedIds.has(product.id)), [publicProducts, selectedIds]);
  const groupedSelectedProducts = useMemo(() => {
    const groups = new Map<string, Product[]>();
    selectedProducts.forEach((product) => {
      const label = groupMode === 'category' ? (product.category || 'Sin categoría') : (product.fit || 'Sin fit');
      groups.set(label, [...(groups.get(label) || []), product]);
    });
    return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b, 'es'));
  }, [selectedProducts, groupMode]);

  const setCustomPrice = (productId: string, value: string) => {
    setCustomPrices((current) => ({ ...current, [productId]: value }));
  };

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

  const downloadLookbook = async () => {
    if (isGenerating) return;
    if (selectedProducts.length === 0) {
      setNotice('No hay referencias con los filtros actuales.');
      return;
    }

    setIsGenerating(true);
    setNotice('Preparando tu PDF…');
    const printedAt = new Date().toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' });
    try {
      // Se leen en paralelo desde sus URLs externas solo durante la descarga;
      // no se suben ni se conservan en ningún servicio de la aplicación.
      const imageEntries = await Promise.all(selectedProducts.map(async (product) => [
        product.id,
        await loadPdfImage(getGoogleDriveImageUrl(product.images?.[0] || '')),
      ] as const));
      const imageMap = new Map(imageEntries);
      const doc = new jsPDF({ unit: 'mm', format: 'a4' });
      const margin = 14;
      const pageWidth = 210;
      const contentWidth = pageWidth - margin * 2;
      const gap = 5;
      const cardWidth = (contentWidth - gap * 2) / 3;
      const imageHeight = 50;
      const cardHeight = 72;
      let pageNumber = 1;

      doc.setFillColor(27, 35, 51);
      doc.rect(0, 0, pageWidth, 297, 'F');
      doc.setFillColor(216, 129, 147);
      doc.rect(0, 0, pageWidth, 5, 'F');
      doc.setTextColor(243, 179, 192);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('USH BY USHUAIA · MAYORISTAS', margin, 42);
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(27);
      doc.text('CATÁLOGO LOOKBOOK', margin, 60);
      doc.setTextColor(243, 179, 192);
      doc.text('EDITORIAL 2026', margin, 72);
      doc.setTextColor(215, 219, 228);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.text(`${selectedProducts.length} referencias seleccionadas`, margin, 92);
      doc.text(`${priceMode === 'ecommerce' ? 'Precios ecommerce' : priceMode === 'custom' ? 'Precios personalizados' : 'Sin precios'} · ${printedAt}`, margin, 100);
      doc.setDrawColor(216, 129, 147);
      doc.setLineWidth(1);
      doc.line(margin, 112, margin + 55, 112);
      doc.setFontSize(9);
      doc.text('Catálogo digital para boutiques y mayoristas', margin, 258);
      doc.text('Las imágenes se cargan desde sus URLs externas.', margin, 268);

      for (const [group, groupProducts] of groupedSelectedProducts) {
        doc.addPage();
        pageNumber += 1;
        doc.setTextColor(216, 129, 147);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.text(groupMode === 'category' ? 'CATEGORÍA' : 'FIT', margin, 18);
        doc.setTextColor(27, 35, 51);
        doc.setFontSize(19);
        doc.text(String(group).toUpperCase(), margin, 27);
        doc.setDrawColor(229, 229, 232);
        doc.setLineWidth(0.35);
        doc.line(margin, 32, margin + contentWidth, 32);

        let index = 0;
        for (const product of groupProducts) {
          if (index > 0 && index % 9 === 0) {
            drawPdfFooter(doc, pageNumber);
            doc.addPage();
            pageNumber += 1;
            doc.setTextColor(216, 129, 147);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(8);
            doc.text(`${String(group).toUpperCase()} · CONTINUACIÓN`, margin, 18);
          }
          const position = index % 9;
          const col = position % 3;
          const row = Math.floor(position / 3);
          const x = margin + col * (cardWidth + gap);
          const y = 38 + row * 80;
          doc.setFillColor(250, 250, 251);
          doc.setDrawColor(236, 236, 238);
          doc.roundedRect(x, y, cardWidth, cardHeight, 1.5, 1.5, 'FD');
      const image = imageMap.get(product.id) || null;
          if (image) {
            const scale = Math.min((cardWidth - 2) / image.width, imageHeight / image.height);
            const imageWidth = image.width * scale;
            const imageY = y + 1 + (imageHeight - image.height * scale) / 2;
            doc.addImage(image.data, image.format, x + (cardWidth - imageWidth) / 2, imageY, imageWidth, image.height * scale, undefined, 'FAST');
          } else {
            doc.setFillColor(255, 243, 245);
            doc.rect(x + 1, y + 1, cardWidth - 2, imageHeight, 'F');
            doc.setTextColor(216, 129, 147);
            doc.setFontSize(15);
            doc.text('USH', x + cardWidth / 2, y + imageHeight / 2, { align: 'center' });
          }
          doc.setTextColor(216, 129, 147);
          doc.setFontSize(7);
          doc.setFont('helvetica', 'bold');
          doc.text(`REF. ${String(product.reference || product.id)}`, x + 3, y + 56);
          doc.setTextColor(27, 35, 51);
          doc.setFontSize(8.5);
          doc.text(clipPdfText(doc, product.name, cardWidth - 6).toUpperCase(), x + 3, y + 62);
          if (product.fit) {
            doc.setTextColor(110, 116, 130);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(7);
            doc.text(clipPdfText(doc, product.fit, cardWidth - 6), x + 3, y + 68);
          }
          const price = downloadPrice(product, priceMode, customPrices);
          if (price) {
            doc.setTextColor(27, 35, 51);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(8.5);
            doc.text(price, x + cardWidth - 3, y + 68, { align: 'right' });
          }
          index += 1;
        }
        drawPdfFooter(doc, pageNumber);
      }

      doc.save(`Catalogo-Lookbook-2026-${priceMode}.pdf`);
      setNotice(`PDF descargado correctamente con ${selectedProducts.length} referencias.`);
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
        <div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#f3b3c0]">Lookbook 2026</p><h2 className="mt-1 text-xl font-black uppercase">Catálogo PDF</h2><p className="mt-1 text-xs text-white/70">Edita precios y abre una versión lista para guardar como PDF.</p></div>
        <button type="button" onClick={onClose} aria-label="Cerrar editor" className="rounded-full p-1.5 text-white/70 hover:bg-white/10 hover:text-white"><X size={20} /></button>
      </div>
      <div className="grid gap-5 p-4 sm:p-6 lg:grid-cols-[260px_1fr]">
        <aside className="space-y-4 border-b border-neutral-200 pb-5 lg:border-b-0 lg:border-r lg:pr-5">
          <div><label className="mb-1 block text-[10px] font-black uppercase tracking-wider text-neutral-500">Precio</label><div className="grid grid-cols-1 gap-1.5">{([['ecommerce','Ecommerce'],['custom','Personalizados'],['blank','Sin precios']] as const).map(([value, label]) => <button key={value} type="button" onClick={() => setPriceMode(value)} className={`rounded-lg border px-3 py-2 text-left text-[11px] font-bold ${priceMode === value ? 'border-[#d88193] bg-[#fff3f5] text-[#b5586c]' : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50'}`}>{label}</button>)}</div></div>
          <div><label className="mb-1 block text-[10px] font-black uppercase tracking-wider text-neutral-500">Agrupar por</label><div className="grid grid-cols-2 gap-1.5">{([['category','Categoría'],['fit','Fit']] as const).map(([value, label]) => <button key={value} type="button" onClick={() => setGroupMode(value)} className={`rounded-lg border px-3 py-2 text-[11px] font-bold ${groupMode === value ? 'border-[#d88193] bg-[#fff3f5] text-[#b5586c]' : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50'}`}><LayoutList size={13} className="mr-1 inline" />{label}</button>)}</div></div>
          <label className="block"><span className="mb-1 block text-[10px] font-black uppercase tracking-wider text-neutral-500">Categoría</span><select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-xs"><option value="Todos">Todas</option>{categories.filter((item) => item !== 'Todos').map((item) => <option key={item}>{item}</option>)}</select></label>
          <label className="block"><span className="mb-1 block text-[10px] font-black uppercase tracking-wider text-neutral-500">Fit</span><select value={fit} onChange={(e) => setFit(e.target.value)} className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-xs"><option value="Todos">Todos</option>{fits.filter((item) => item !== 'Todos').map((item) => <option key={item}>{item}</option>)}</select></label>
          <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3">
            <div className="flex items-center justify-between gap-2"><span className="text-[10px] font-black uppercase tracking-wider text-neutral-500">Selección</span><strong className="text-xs text-[#1b2333]">{selectedIds.size} / {publicProducts.length}</strong></div>
            <div className="mt-2 grid grid-cols-2 gap-1.5"><button type="button" onClick={() => selectVisible(true)} className="rounded border border-neutral-200 bg-white px-2 py-1.5 text-[10px] font-bold text-neutral-600 hover:border-[#d88193]">Seleccionar visibles</button><button type="button" onClick={() => selectVisible(false)} className="rounded border border-neutral-200 bg-white px-2 py-1.5 text-[10px] font-bold text-neutral-600 hover:border-[#d88193]">Quitar visibles</button></div>
            <p className="mt-2 text-[10px] leading-relaxed text-neutral-500">Usa los filtros o busca una referencia para seleccionar solo lo que quieres incluir.</p>
          </div>
          <button type="button" onClick={downloadLookbook} disabled={isGenerating || selectedProducts.length === 0} className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#d88193] px-3 py-3 text-[11px] font-black uppercase tracking-wide text-white hover:bg-[#c06579] disabled:cursor-not-allowed disabled:opacity-50"><FileDown size={16} /> {isGenerating ? 'Generando PDF…' : 'Descargar PDF'}</button>
          {notice && <p className="text-[11px] leading-relaxed text-[#b5586c]">{notice}</p>}
        </aside>
        <main className="min-w-0">
          <div className="mb-4 flex flex-col gap-3 border-b border-neutral-200 pb-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-black uppercase text-[#1b2333]">{filteredProducts.length} referencias · {selectedProducts.length} seleccionadas</p><p className="text-[11px] text-neutral-500">Marca o desmarca cada referencia. Los precios personalizados solo se usan en este PDF.</p></div><label className="relative block sm:w-64"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar referencia" className="w-full rounded-lg border border-neutral-200 py-2 pl-9 pr-3 text-xs focus:border-[#d88193] focus:outline-none" /></label></div>
          <div className="max-h-[62vh] space-y-6 overflow-y-auto pr-1">{groupedProducts.map(([group, groupProducts]) => <section key={group}><h3 className="mb-2 border-b border-neutral-200 pb-2 text-xs font-black uppercase tracking-wider text-[#d88193]">{group}</h3><div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">{groupProducts.map((product) => <label key={product.id} className={`flex cursor-pointer gap-2 rounded-lg border p-2 transition-colors ${selectedIds.has(product.id) ? 'border-[#d88193] bg-[#fff8f9]' : 'border-neutral-100 bg-neutral-50 opacity-60'}`}><input type="checkbox" checked={selectedIds.has(product.id)} onChange={() => toggleProduct(product.id)} aria-label={`Incluir referencia ${product.reference}`} className="mt-1 h-4 w-4 shrink-0 accent-[#d88193]" /><div className="h-16 w-12 shrink-0 overflow-hidden bg-neutral-200">{product.images?.[0] && <img src={getGoogleDriveImageUrl(product.images[0])} alt="" className="h-full w-full object-cover" />}</div><div className="min-w-0 flex-1"><p className="truncate text-[10px] font-black uppercase text-[#1b2333]">{product.reference}</p><p className="truncate text-[10px] text-neutral-600">{product.name}</p>{priceMode === 'custom' ? <div className="mt-1 flex items-center gap-1"><span className="text-[10px] text-neutral-400">$</span><input type="number" min="0" value={customPrices[product.id] || ''} onChange={(e) => setCustomPrice(product.id, e.target.value)} onClick={(e) => e.stopPropagation()} placeholder="Precio" className="w-full rounded border border-neutral-200 bg-white px-1.5 py-1 text-[11px] focus:border-[#d88193] focus:outline-none" /></div> : <p className="mt-1 text-[10px] font-bold text-[#d88193]">{priceMode === 'blank' ? 'Sin precio' : downloadPrice(product, priceMode, customPrices)}</p>}</div></label>)}</div></section>)}{groupedProducts.length === 0 && <p className="py-10 text-center text-xs text-neutral-500">No encontramos referencias con esos filtros.</p>}</div>
        </main>
      </div>
    </div>
  </div>;
}
