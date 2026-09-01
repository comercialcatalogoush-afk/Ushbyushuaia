'use client';

import { useEffect, useMemo, useState } from 'react';
import { Check, Download, Film, Image as ImageIcon, Loader2, Search, X } from 'lucide-react';
import { Product } from '@/types';
import { getGoogleDriveImageUrl } from '@/lib/drive';
import { formatVideoUrl } from '@/lib/videoUtils';

function getDriveFileId(value: string) {
  const match = value.match(/drive\.google\.com\/(?:file\/d\/([a-zA-Z0-9_-]+)|open\?id=([a-zA-Z0-9_-]+)|uc\?(?:.*&)?id=([a-zA-Z0-9_-]+))/i);
  return match?.[1] || match?.[2] || match?.[3] || '';
}

function getVideoMedia(rawUrl?: string) {
  if (!rawUrl) return null;
  const formatted = formatVideoUrl(rawUrl);
  if (!formatted.isSupported || !formatted.src) return null;
  const driveId = getDriveFileId(rawUrl);
  return {
    viewUrl: formatted.src,
    downloadUrl: driveId ? `https://drive.google.com/uc?export=download&id=${driveId}` : (formatted.type === 'video' ? rawUrl : ''),
    canDownload: Boolean(driveId) || formatted.type === 'video',
    isEmbed: formatted.type === 'iframe',
  };
}

async function downloadExternalFile(url: string, fileName: string) {
  try {
    const response = await fetch(url, { mode: 'cors' });
    if (!response.ok) throw new Error('download_failed');
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 3000);
    return true;
  } catch (_) {
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noreferrer';
    document.body.appendChild(link);
    link.click();
    link.remove();
    return false;
  }
}

function groupProducts(products: Product[], group: 'category' | 'fit') {
  const groups = new Map<string, Product[]>();
  products.forEach((product) => {
    const label = group === 'category' ? (product.category || 'Sin categoría') : (product.fit || 'Sin fit');
    groups.set(label, [...(groups.get(label) || []), product]);
  });
  return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b, 'es'));
}

export function CustomerAudiovisualContent({ products }: { products: Product[] }) {
  const [open, setOpen] = useState(false);

  const mediaProducts = products.filter((product) => !product.hidden && product.status !== 'draft' && (product.images?.length || product.video_url));
  const imageCount = mediaProducts.reduce((total, product) => total + (product.images?.length || 0), 0);
  const videoCount = mediaProducts.filter((product) => getVideoMedia(product.video_url)?.canDownload).length;

  return (
    <section className="border border-[#1b2333]/15 bg-[#1b2333] p-4 text-white shadow-sm sm:p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#d88193] text-white"><Film size={19} /></div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#f3b3c0]">Contenido para vender</p>
          <h2 className="mt-1 text-sm font-black uppercase tracking-wide">Contenido audiovisual</h2>
          <p className="mt-1 text-xs leading-relaxed text-white/70">Descarga fotos y videos de tus referencias para compartir novedades, armar publicaciones y mostrar la colección en tus redes sociales.</p>
          <p className="mt-2 text-[10px] font-semibold text-white/55">{mediaProducts.length} referencias con contenido · {imageCount} fotos · {videoCount} videos descargables</p>
        </div>
      </div>
      <button type="button" onClick={() => setOpen(true)} disabled={!mediaProducts.length} className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-white px-4 py-3 text-[10px] font-black uppercase tracking-widest text-[#1b2333] transition hover:bg-[#f3b3c0] disabled:cursor-not-allowed disabled:opacity-50"><Film size={16} /> Abrir biblioteca audiovisual</button>
      {open && <AudiovisualEditor products={mediaProducts} onClose={() => setOpen(false)} />}
    </section>
  );
}

function AudiovisualEditor({ products, onClose }: { products: Product[]; onClose: () => void }) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(products.map((product) => product.id)));
  const [group, setGroup] = useState<'category' | 'fit'>('category');
  const [category, setCategory] = useState('all');
  const [fit, setFit] = useState('all');
  const [search, setSearch] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const categories = useMemo(() => Array.from(new Set(products.map((product) => product.category).filter((value): value is string => Boolean(value)))).sort((a, b) => a.localeCompare(b, 'es')), [products]);
  const fits = useMemo(() => Array.from(new Set(products.map((product) => product.fit).filter((value): value is string => Boolean(value)))).sort((a, b) => a.localeCompare(b, 'es')), [products]);
  const filteredProducts = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return products.filter((product) => {
      const text = [product.reference, product.name, product.category, product.fit].map((value) => String(value || '').toLowerCase()).join(' ');
      return (category === 'all' || product.category === category) && (fit === 'all' || product.fit === fit) && (!needle || text.includes(needle));
    });
  }, [category, fit, products, search]);
  const groups = useMemo(() => groupProducts(filteredProducts, group), [filteredProducts, group]);
  const selectedProducts = useMemo(() => products.filter((product) => selectedIds.has(product.id)), [products, selectedIds]);
  const selectedImages = selectedProducts.reduce((total, product) => total + (product.images?.length || 0), 0);
  const selectedVideos = selectedProducts.filter((product) => getVideoMedia(product.video_url)?.canDownload).length;

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape' && !busy) onClose(); };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [busy, onClose]);

  const toggle = (id: string) => setSelectedIds((current) => { const next = new Set(current); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  const selectVisible = (include: boolean) => setSelectedIds((current) => { const next = new Set(current); filteredProducts.forEach((product) => include ? next.add(product.id) : next.delete(product.id)); return next; });

  const downloadMedia = async (kind: 'images' | 'videos') => {
    if (busy) return;
    const targets = kind === 'images'
      ? selectedProducts.flatMap((product) => (product.images || []).map((image, index) => ({ url: getGoogleDriveImageUrl(image), name: `USH-${product.reference}-${index + 1}.jpg` })))
      : selectedProducts.flatMap((product) => { const video = getVideoMedia(product.video_url); return video?.downloadUrl ? [{ url: video.downloadUrl, name: `USH-${product.reference}-video` }] : []; });
    if (!targets.length) { setMessage(kind === 'images' ? 'No hay fotos en las referencias seleccionadas.' : 'No hay videos descargables en las referencias seleccionadas.'); return; }
    setBusy(true);
    let fallbackCount = 0;
    for (let index = 0; index < targets.length; index += 1) {
      setMessage(`Preparando ${kind === 'images' ? 'fotos' : 'videos'}: ${index + 1} de ${targets.length}...`);
      const downloaded = await downloadExternalFile(targets[index].url, targets[index].name);
      if (!downloaded) fallbackCount += 1;
    }
    setMessage(fallbackCount ? `Se prepararon ${targets.length} archivos. ${fallbackCount} se abrieron en una pestaña porque el servidor externo no permite descarga directa.` : `${targets.length} archivos descargados correctamente.`);
    setBusy(false);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[#111827]/80 p-2 sm:p-5" role="dialog" aria-modal="true" aria-label="Contenido audiovisual">
      <div className="flex max-h-[96vh] w-full max-w-6xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
        <header className="flex items-start justify-between gap-4 bg-[#1b2333] px-4 py-4 text-white sm:px-6"><div><p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#f3b3c0]">Biblioteca de contenido</p><h2 className="mt-1 text-lg font-black uppercase sm:text-xl">Contenido audiovisual</h2><p className="mt-1 max-w-2xl text-xs leading-relaxed text-white/70">Selecciona referencias y descarga sus fotos o videos para compartir la colección en tus redes.</p></div><button type="button" onClick={onClose} disabled={busy} aria-label="Cerrar biblioteca" className="rounded-full p-1 text-white/70 hover:bg-white/10 hover:text-white disabled:opacity-50"><X size={20} /></button></header>
        <div className="grid min-h-0 flex-1 lg:grid-cols-[250px_1fr]">
          <aside className="space-y-4 overflow-y-auto border-b border-neutral-200 bg-[#fafafa] p-4 lg:border-b-0 lg:border-r">
            <div><p className="mb-2 text-[10px] font-black uppercase tracking-wider text-neutral-500">Organizar biblioteca</p><div className="grid grid-cols-2 gap-2"><button type="button" onClick={() => setGroup('category')} className={`rounded-lg border px-2 py-2 text-[10px] font-bold ${group === 'category' ? 'border-[#d88193] bg-[#fff1f4] text-[#b5586c]' : 'border-neutral-200 bg-white text-neutral-600'}`}>Categoría</button><button type="button" onClick={() => setGroup('fit')} className={`rounded-lg border px-2 py-2 text-[10px] font-bold ${group === 'fit' ? 'border-[#d88193] bg-[#fff1f4] text-[#b5586c]' : 'border-neutral-200 bg-white text-neutral-600'}`}>Fit</button></div></div>
            <div className="space-y-2"><p className="text-[10px] font-black uppercase tracking-wider text-neutral-500">Filtrar referencias</p><div className="relative"><Search size={14} className="absolute left-3 top-2.5 text-neutral-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar referencia" className="w-full rounded-lg border border-neutral-200 bg-white py-2 pl-8 pr-2 text-xs outline-none focus:border-[#d88193]" /></div><select value={category} onChange={(event) => setCategory(event.target.value)} className="w-full rounded-lg border border-neutral-200 bg-white px-2 py-2 text-xs text-neutral-600 outline-none"><option value="all">Todas las categorías</option>{categories.map((value) => <option key={value} value={value}>{value}</option>)}</select><select value={fit} onChange={(event) => setFit(event.target.value)} className="w-full rounded-lg border border-neutral-200 bg-white px-2 py-2 text-xs text-neutral-600 outline-none"><option value="all">Todos los fits</option>{fits.map((value) => <option key={value} value={value}>{value}</option>)}</select></div>
            <div className="border-t border-neutral-200 pt-3"><p className="text-sm font-black text-[#1b2333]">{selectedProducts.length} seleccionadas</p><p className="mt-1 text-[10px] leading-relaxed text-neutral-500">{selectedImages} fotos y {selectedVideos} videos descargables.</p><div className="mt-3 grid grid-cols-2 gap-2"><button type="button" onClick={() => selectVisible(true)} className="rounded-lg border border-neutral-200 bg-white px-2 py-2 text-[9px] font-black uppercase text-neutral-600">Incluir visibles</button><button type="button" onClick={() => selectVisible(false)} className="rounded-lg border border-neutral-200 bg-white px-2 py-2 text-[9px] font-black uppercase text-neutral-600">Quitar visibles</button></div></div>
            <div className="grid gap-2"><button type="button" onClick={() => downloadMedia('images')} disabled={busy || !selectedImages} className="flex items-center justify-center gap-2 rounded-lg bg-[#d88193] px-3 py-3 text-[10px] font-black uppercase tracking-wide text-white disabled:opacity-50"><ImageIcon size={15} />{busy ? <><Loader2 size={14} className="animate-spin" /> Preparando...</> : `Descargar fotos (${selectedImages})`}</button><button type="button" onClick={() => downloadMedia('videos')} disabled={busy || !selectedVideos} className="flex items-center justify-center gap-2 rounded-lg bg-[#1b2333] px-3 py-3 text-[10px] font-black uppercase tracking-wide text-white disabled:opacity-50"><Download size={15} /> Descargar videos ({selectedVideos})</button></div>
            {message && <p className="text-[10px] leading-relaxed text-[#b5586c]">{message}</p>}
            <p className="text-[10px] leading-relaxed text-neutral-400">Las descargas se realizan directamente desde la URL externa al dispositivo. No guardamos estos archivos en Supabase ni en Vercel.</p>
          </aside>
          <main className="min-h-0 overflow-y-auto p-4 sm:p-6"><div className="mb-4 flex items-center justify-between gap-3 border-b border-neutral-200 pb-3"><div><p className="text-[10px] font-black uppercase tracking-wider text-[#d88193]">Vista de selección</p><p className="mt-1 text-xs text-neutral-500">{filteredProducts.length} referencias con contenido</p></div><Film size={20} className="text-[#d88193]" /></div><div className="space-y-6">{groups.map(([label, groupProducts]) => <section key={label}><h3 className="mb-2 border-b border-neutral-200 pb-2 text-xs font-black uppercase tracking-wider text-[#d88193]">{label}</h3><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{groupProducts.map((product) => { const video = getVideoMedia(product.video_url); const selected = selectedIds.has(product.id); return <label key={product.id} className={`flex cursor-pointer gap-2 rounded-lg border p-2 transition ${selected ? 'border-[#d88193] bg-[#fff8f9]' : 'border-neutral-100 bg-neutral-50 opacity-60'}`}><input type="checkbox" checked={selected} onChange={() => toggle(product.id)} aria-label={`Incluir contenido de ${product.reference}`} className="mt-1 h-4 w-4 shrink-0 accent-[#d88193]" /><div className="relative h-24 w-16 shrink-0 overflow-hidden bg-neutral-200"><img src={getGoogleDriveImageUrl(product.images?.[0] || '')} alt="" className="h-full w-full object-cover" />{selected && <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#d88193] text-white"><Check size={11} /></span>}</div><div className="min-w-0 flex-1"><p className="text-[10px] font-black uppercase text-[#1b2333]">{product.reference}</p><p className="line-clamp-2 text-[10px] leading-tight text-neutral-600">{product.name}</p><div className="mt-2 flex flex-wrap gap-1"><span className="inline-flex items-center gap-1 rounded bg-[#fff1f4] px-1.5 py-1 text-[9px] font-bold text-[#b5586c]"><ImageIcon size={10} /> {product.images?.length || 0} fotos</span>{video && <span className="inline-flex items-center gap-1 rounded bg-[#eef1f7] px-1.5 py-1 text-[9px] font-bold text-[#1b2333]"><Film size={10} /> {video.canDownload ? 'Video' : 'Video para ver'}</span>}</div></div></label>; })}</div></section>)}{!groups.length && <p className="py-16 text-center text-xs text-neutral-500">No encontramos referencias con esos filtros.</p>}</div></main>
        </div>
      </div>
    </div>
  );
}
