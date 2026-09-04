'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
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

export function CustomerAudiovisualContent({ products, fullPage = false }: { products: Product[]; fullPage?: boolean }) {

  const mediaProducts = products.filter((product) => !product.hidden && product.status !== 'draft' && (product.images?.length || product.video_url));
  const imageCount = mediaProducts.reduce((total, product) => total + (product.images?.length || 0), 0);
  const videoCount = mediaProducts.filter((product) => getVideoMedia(product.video_url)?.canDownload).length;

  if (fullPage) {
    return <AudiovisualEditor products={mediaProducts} onClose={() => window.history.back()} embedded />;
  }

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
      <Link href="/contenido-audiovisual" className={`mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-white px-4 py-3 text-[10px] font-black uppercase tracking-widest text-[#1b2333] transition hover:bg-[#f3b3c0] ${!mediaProducts.length ? 'pointer-events-none opacity-50' : ''}`} aria-disabled={!mediaProducts.length}><Film size={16} /> Abrir biblioteca audiovisual</Link>
    </section>
  );
}

function AudiovisualEditor({ products, onClose, embedded = false }: { products: Product[]; onClose: () => void; embedded?: boolean }) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [group, setGroup] = useState<'category' | 'fit'>('category');
  const [category, setCategory] = useState('all');
  const [fit, setFit] = useState('all');
  const [search, setSearch] = useState('');
  const [busy, setBusy] = useState(false);
  const [downloadingUrl, setDownloadingUrl] = useState<string | null>(null);
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

  // Descarga individual de una sola foto elegida por el cliente
  const handleDownloadSinglePhoto = async (imageUrl: string, ref: string, idx: number) => {
    if (busy) return;
    setDownloadingUrl(imageUrl);
    const directUrl = getGoogleDriveImageUrl(imageUrl);
    await downloadExternalFile(directUrl, `USH-Ref-${ref}-Foto-${idx + 1}.jpg`);
    setDownloadingUrl(null);
  };

  // Descargar todas las fotos de una referencia específica
  const handleDownloadProductPhotos = async (product: Product) => {
    if (busy || !product.images?.length) return;
    setBusy(true);
    setMessage(`Descargando fotos de Ref. ${product.reference}...`);
    let count = 0;
    for (let i = 0; i < product.images.length; i++) {
      const direct = getGoogleDriveImageUrl(product.images[i]);
      await downloadExternalFile(direct, `USH-Ref-${product.reference}-${i + 1}.jpg`);
      count++;
    }
    setMessage(`✓ Se descargaron ${count} fotos de la Ref. ${product.reference}`);
    setBusy(false);
    setTimeout(() => setMessage(''), 4000);
  };

  // Descarga masiva de todas las seleccionadas
  const downloadMedia = async (kind: 'images' | 'videos') => {
    if (busy) return;
    const targets = kind === 'images'
      ? selectedProducts.flatMap((product) => (product.images || []).map((image, index) => ({ url: getGoogleDriveImageUrl(image), name: `USH-${product.reference}-${index + 1}.jpg` })))
      : selectedProducts.flatMap((product) => { const video = getVideoMedia(product.video_url); return video?.downloadUrl ? [{ url: video.downloadUrl, name: `USH-${product.reference}-video` }] : []; });
    if (!targets.length) { setMessage(kind === 'images' ? 'Selecciona al menos una referencia para descargar.' : 'No hay videos en las referencias seleccionadas.'); return; }
    setBusy(true);
    let fallbackCount = 0;
    for (let index = 0; index < targets.length; index += 1) {
      setMessage(`Descargando ${index + 1} de ${targets.length}...`);
      const downloaded = await downloadExternalFile(targets[index].url, targets[index].name);
      if (!downloaded) fallbackCount += 1;
    }
    setMessage(fallbackCount ? `Se prepararon ${targets.length} archivos.` : `✓ ${targets.length} archivos descargados con éxito.`);
    setBusy(false);
    setTimeout(() => setMessage(''), 5000);
  };

  return (
    <div className={embedded ? 'w-full' : 'fixed inset-0 z-[70] flex items-center justify-center bg-[#111827]/80 p-2 sm:p-5'} role="dialog" aria-modal="true" aria-label="Contenido audiovisual">
      <div className={`flex w-full flex-col overflow-hidden bg-white shadow-2xl ${embedded ? 'min-h-[720px] rounded-xl border border-neutral-200' : 'max-h-[96vh] max-w-6xl rounded-xl'}`}>

        {/* Encabezado */}
        <header className="flex items-start justify-between gap-4 bg-[#1b2333] px-4 py-4 text-white sm:px-6">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#f3b3c0]">Biblioteca de Contenido Digital</p>
            <h2 className="mt-0.5 text-base font-black uppercase sm:text-xl">Fotos y Videos en Alta Resolución</h2>
            <p className="mt-1 max-w-2xl text-xs leading-relaxed text-white/70">
              Elige la foto exacta que quieres de cualquier referencia o descárgalas todas para tus redes sociales.
            </p>
          </div>
          {!embedded && (
            <button type="button" onClick={onClose} disabled={busy} aria-label="Cerrar biblioteca" className="rounded-full p-1 text-white/70 hover:bg-white/10 hover:text-white disabled:opacity-50">
              <X size={20} />
            </button>
          )}
        </header>

        <div className="grid min-h-0 flex-1 lg:grid-cols-[260px_1fr]">

          {/* Panel lateral / filtros */}
          <aside className="space-y-4 overflow-y-auto border-b border-neutral-200 bg-[#fafafa] p-4 lg:border-b-0 lg:border-r">

            {/* Buscador */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-wider text-neutral-600">Buscar prenda</label>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-2.5 text-neutral-400" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Ref. o nombre..."
                  className="w-full rounded-lg border border-neutral-200 bg-white py-2 pl-8 pr-2 text-xs outline-none focus:border-[#d88193]"
                />
              </div>
            </div>

            {/* Agrupar */}
            <div>
              <p className="mb-1.5 text-[10px] font-black uppercase tracking-wider text-neutral-600">Organizar por</p>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => setGroup('category')}
                  className={`rounded-lg border px-2 py-2 text-[10px] font-bold transition ${group === 'category' ? 'border-[#d88193] bg-[#fff1f4] text-[#b5586c]' : 'border-neutral-200 bg-white text-neutral-600'}`}
                >
                  Categoría
                </button>
                <button
                  type="button"
                  onClick={() => setGroup('fit')}
                  className={`rounded-lg border px-2 py-2 text-[10px] font-bold transition ${group === 'fit' ? 'border-[#d88193] bg-[#fff1f4] text-[#b5586c]' : 'border-neutral-200 bg-white text-neutral-600'}`}
                >
                  Silueta (Fit)
                </button>
              </div>
            </div>

            {/* Categorías */}
            <div className="space-y-2">
              <select
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                className="w-full rounded-lg border border-neutral-200 bg-white px-2 py-2 text-xs text-neutral-700 outline-none"
              >
                <option value="all">Todas las categorías ({categories.length})</option>
                {categories.map((value) => <option key={value} value={value}>{value}</option>)}
              </select>

              <select
                value={fit}
                onChange={(event) => setFit(event.target.value)}
                className="w-full rounded-lg border border-neutral-200 bg-white px-2 py-2 text-xs text-neutral-700 outline-none"
              >
                <option value="all">Todas las siluetas ({fits.length})</option>
                {fits.map((value) => <option key={value} value={value}>{value}</option>)}
              </select>
            </div>

            {/* Descarga por lote de seleccionadas */}
            <div className="border-t border-neutral-200 pt-3 space-y-2">
              <div className="flex justify-between items-baseline">
                <p className="text-xs font-black text-[#1b2333]">{selectedProducts.length} seleccionadas</p>
                <span className="text-[10px] text-neutral-500">{selectedImages} fotos</span>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <button type="button" onClick={() => selectVisible(true)} className="rounded-lg border border-neutral-200 bg-white px-2 py-1.5 text-[9px] font-black uppercase text-neutral-600 hover:bg-neutral-100">
                  Marcar todas
                </button>
                <button type="button" onClick={() => selectVisible(false)} className="rounded-lg border border-neutral-200 bg-white px-2 py-1.5 text-[9px] font-black uppercase text-neutral-600 hover:bg-neutral-100">
                  Desmarcar
                </button>
              </div>
              <button
                type="button"
                onClick={() => downloadMedia('images')}
                disabled={busy || !selectedImages}
                className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-[#d88193] hover:bg-[#c06579] px-3 py-2.5 text-[10px] font-black uppercase tracking-wide text-white disabled:opacity-50 transition shadow-xs"
              >
                <ImageIcon size={14} />
                {busy ? <><Loader2 size={13} className="animate-spin" /> Descargando...</> : `Descargar lote (${selectedImages} fotos)`}
              </button>
            </div>

            {message && (
              <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-[11px] font-bold text-[#b5586c] leading-tight">
                {message}
              </div>
            )}

            <p className="text-[10px] leading-relaxed text-neutral-400">
              💡 Puedes descargar cualquier foto individual haciendo clic en el icono de descarga de cada imagen, o descargar el pack completo de la prenda.
            </p>
          </aside>

          {/* Galería principal de prendas y fotos individuales */}
          <main className="min-h-0 overflow-y-auto p-4 sm:p-6 bg-white space-y-6">

            <div className="flex items-center justify-between gap-3 border-b border-neutral-100 pb-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-[#d88193]">Catálogo Oficial</p>
                <p className="text-xs text-neutral-600 font-medium">
                  {filteredProducts.length} referencias disponibles · Haz clic en cualquier foto para descargarla
                </p>
              </div>
              <Film size={20} className="text-[#d88193]" />
            </div>

            {groups.map(([label, groupProducts]) => (
              <section key={label} className="space-y-4">
                <h3 className="border-b border-rose-100 pb-1.5 text-xs font-black uppercase tracking-wider text-[#d88193]">
                  {label} ({groupProducts.length})
                </h3>

                <div className="space-y-4">
                  {groupProducts.map((product) => {
                    const isSelected = selectedIds.has(product.id);
                    const images = product.images || [];
                    const video = getVideoMedia(product.video_url);

                    return (
                      <div
                        key={product.id}
                        className={`rounded-xl border p-3.5 sm:p-4 transition-all ${
                          isSelected ? 'border-[#d88193] bg-rose-50/20 shadow-xs' : 'border-neutral-200 bg-white hover:border-neutral-300'
                        }`}
                      >
                        {/* Cabecera de la referencia */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-neutral-100">
                          <div className="flex items-center gap-2.5">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggle(product.id)}
                              aria-label={`Seleccionar lote de ${product.reference}`}
                              className="h-4 w-4 rounded accent-[#d88193] cursor-pointer"
                            />
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-black uppercase text-[#1b2333]">
                                  Ref. {product.reference}
                                </span>
                                {product.fit && (
                                  <span className="text-[9px] font-black uppercase text-[#d88193] bg-rose-50 px-2 py-0.5 rounded-full">
                                    {product.fit}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-neutral-600 leading-tight mt-0.5">
                                {product.name}
                              </p>
                            </div>
                          </div>

                          {/* Acciones de referencia completa */}
                          <div className="flex items-center gap-2 pt-1 sm:pt-0">
                            {images.length > 0 && (
                              <button
                                type="button"
                                onClick={() => handleDownloadProductPhotos(product)}
                                disabled={busy}
                                className="inline-flex items-center gap-1.5 rounded-lg bg-neutral-100 hover:bg-rose-50 hover:text-[#d88193] px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-neutral-700 transition"
                              >
                                <Download size={12} />
                                <span>Descargar todas ({images.length})</span>
                              </button>
                            )}
                            {video?.canDownload && (
                              <button
                                type="button"
                                onClick={() => downloadExternalFile(video.downloadUrl, `USH-${product.reference}-video`)}
                                className="inline-flex items-center gap-1.5 rounded-lg bg-[#1b2333] hover:bg-neutral-800 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-white transition"
                              >
                                <Film size={12} />
                                <span>Video</span>
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Galería de fotos individuales de esta prenda */}
                        <div className="pt-3">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-2">
                            Fotos individuales (toca para descargar la que desees):
                          </p>
                          <div className="flex flex-row overflow-x-auto gap-2.5 pb-1">
                            {images.map((imgUrl, idx) => {
                              const direct = getGoogleDriveImageUrl(imgUrl);
                              const isDownloading = downloadingUrl === imgUrl;

                              return (
                                <div
                                  key={idx}
                                  className="group/photo relative shrink-0 w-24 sm:w-28 rounded-lg overflow-hidden border border-gray-200 bg-neutral-100 shadow-2xs"
                                >
                                  <div className="aspect-[3/4] relative overflow-hidden bg-neutral-50">
                                    <img
                                      src={direct}
                                      alt={`Ref ${product.reference} - Foto ${idx + 1}`}
                                      className="w-full h-full object-cover transition duration-300 group-hover/photo:scale-105"
                                      loading="lazy"
                                    />
                                    {/* Botón de descarga individual */}
                                    <button
                                      type="button"
                                      onClick={() => handleDownloadSinglePhoto(imgUrl, product.reference, idx)}
                                      disabled={busy}
                                      title={`Descargar foto ${idx + 1}`}
                                      className="absolute inset-x-0 bottom-0 bg-[#1b2333]/90 hover:bg-[#d88193] text-white py-1.5 text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-1 transition"
                                    >
                                      {isDownloading ? (
                                        <Loader2 size={11} className="animate-spin" />
                                      ) : (
                                        <>
                                          <Download size={11} />
                                          <span>Foto {idx + 1}</span>
                                        </>
                                      )}
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                      </div>
                    );
                  })}
                </div>
              </section>
            ))}

            {!groups.length && (
              <p className="py-16 text-center text-xs text-neutral-500">
                No se encontraron prendas con los filtros seleccionados.
              </p>
            )}

          </main>
        </div>
      </div>
    </div>
  );
}
