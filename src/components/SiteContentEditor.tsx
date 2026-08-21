'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Save, CheckCircle, ChevronRight, ChevronDown, Monitor, Tablet, Smartphone,
  LayoutTemplate, Palette, FileText, Loader2, ExternalLink, Upload, RotateCcw, X, Pointer,
  Undo2, Redo2, FileClock, Package, Search, ArrowLeft, Eye, EyeOff, Plus, Trash2, RefreshCw, Star, Copy,
  ChevronLeft,
} from 'lucide-react';
import {
  PAGE_SCHEMAS,
  DEFAULT_THEME,
  CONTENT_EVENT,
  THEME_EVENT,
  SiteTheme,
  ContentValues,
  FieldDef,
  getPageContentClient,
  savePageContent,
  saveTheme,
  fetchThemeFromRemote,
} from '@/lib/siteContent';
import { uploadProductImage, publishCatalogChange, fetchAllProductsAdmin, upsertProduct, deleteProductFromSupabase, logPriceChange } from '@/lib/supabase';
import { Product } from '@/types';

// ── Opciones del editor de productos (iguales a las del panel admin) ──
const PRODUCT_CATEGORIES_KEY = 'ush_admin_categories';
const PRODUCT_FITS_KEY = 'ush_admin_fits';
const DEFAULT_CATEGORIES = ['Jeans', 'Pantalones', 'Shorts', 'Faldas', 'Cargos', 'Bermuda', 'Nuevo'];
const DEFAULT_FITS = ['Wide Leg', 'Barrel', 'Straight Boot', 'Vaquero', 'Bota Flare', 'Skinny', 'Mom', 'Cargo', 'Bermuda', 'Straight'];
const PRODUCT_COLORS = ['Azul', 'Azul Claro', 'Negro', 'Blanco', 'Beige', 'Gris', 'Café', 'Verde', 'Rojo', 'Rosa', 'Vino', 'Amarillo', 'Pantanal'];
const PRODUCT_SIZES = ['6', '8', '10', '12', '14'];

function readClassList(key: string, fallback: string[]): string[] {
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (_) {}
  return fallback;
}

// Ruta pública de cada página del CMS (para el preview)
const PAGE_ROUTES: Record<string, string> = {
  'home': '/',
  'outlet': '/',
  'como-comprar': '/como-comprar',
  'contacto': '/contacto',
  'rastreo': '/rastreo',
  'catalogo': '/catalogo',
  'politicas': '/politicas',
  'footer': '/',
};

// Mapeo: sección del sitio (atributo data-editor-section) → página + grupo a editar
const SECTION_MAP: Record<string, { pageId: string; group: string }> = {
  'home-hero': { pageId: 'home', group: 'Hero' },
  'home-benefits': { pageId: 'home', group: 'Beneficios' },
  'home-trust': { pageId: 'home', group: 'Barra de confianza' },
  'home-policies': { pageId: 'home', group: 'Banner políticas' },
  'home-distribuidores': { pageId: 'home', group: 'Distribuidores' },
  'outlet-header': { pageId: 'outlet', group: 'Encabezado' },
  'outlet-card': { pageId: 'outlet', group: 'Tarjeta principal' },
  'outlet-buttons': { pageId: 'outlet', group: 'Botones' },
  'outlet-hours': { pageId: 'outlet', group: 'Horario destacado' },
  'cc-header': { pageId: 'como-comprar', group: 'Encabezado' },
  'cc-process': { pageId: 'como-comprar', group: 'Proceso' },
  'ct-header': { pageId: 'contacto', group: 'Encabezado' },
  'ct-info': { pageId: 'contacto', group: 'Datos oficiales' },
  'ct-whatsapp': { pageId: 'contacto', group: 'WhatsApp' },
  'tr-header': { pageId: 'rastreo', group: 'Encabezado' },
  'tr-form': { pageId: 'rastreo', group: 'Formulario' },
  'tr-help': { pageId: 'rastreo', group: 'Ayuda' },
  'cat-header': { pageId: 'catalogo', group: 'Encabezado' },
  'pl-header': { pageId: 'politicas', group: 'Encabezado' },
  'pl-ship': { pageId: 'politicas', group: 'Envíos' },
  'pl-data': { pageId: 'politicas', group: 'Habeas Data' },
  'pl-channels': { pageId: 'politicas', group: 'Canales de atención' },
  'footer-brand': { pageId: 'footer', group: 'Marca' },
  'footer-hours': { pageId: 'footer', group: 'Contacto' },
  'footer-notice': { pageId: 'footer', group: 'Mayoristas' },
};

// Sección del preview (atributo data-editor-section) correspondiente a cada página+grupo
function sectionForGroup(pageId: string, group: string): string | null {
  for (const [sec, m] of Object.entries(SECTION_MAP)) {
    if (m.pageId === pageId && m.group === group) return sec;
  }
  return null;
}

const THEME_FIELDS: { key: keyof SiteTheme; label: string; type: 'color' | 'text' }[] = [
  { key: 'pink', label: 'Rosa principal', type: 'color' },
  { key: 'pinkDark', label: 'Rosa oscuro', type: 'color' },
  { key: 'pinkHover', label: 'Rosa hover', type: 'color' },
  { key: 'pinkLight', label: 'Rosa claro', type: 'color' },
  { key: 'pinkSoft', label: 'Rosa suave', type: 'color' },
  { key: 'navy', label: 'Azul marino', type: 'color' },
  { key: 'navyDark', label: 'Azul marino oscuro', type: 'color' },
  { key: 'accent', label: 'Color acento', type: 'color' },
  { key: 'bodyBg', label: 'Fondo del sitio', type: 'color' },
  { key: 'topNoticeText', label: 'Franja superior (texto)', type: 'text' },
];

const DEVICE_WIDTH: Record<'desktop' | 'tablet' | 'mobile', string> = {
  desktop: '100%',
  tablet: '768px',
  mobile: '390px',
};

// ── Utilidades ──────────────────────────────────────────────
const compressImage = (file: File): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = document.createElement('img');
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const MAX = 1600;
        if (width > MAX || height > MAX) {
          const ratio = Math.min(MAX / width, MAX / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) { reject(new Error('canvas')); return; }
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error('toBlob'));
        }, 'image/jpeg', 0.88);
      };
      img.onerror = () => reject(new Error('img'));
      img.src = String(event.target?.result);
    };
    reader.onerror = () => reject(new Error('read'));
    reader.readAsDataURL(file);
  });
};

interface FieldInputProps {
  field: FieldDef;
  value: string;
  onChange: (value: string) => void;
  uploadPath: string;
}

function FieldInput({ field, value, onChange, uploadPath }: FieldInputProps) {
  const [uploading, setUploading] = useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const blob = await compressImage(file);
      const res = await uploadProductImage(blob, uploadPath);
      if (res.success && res.url) onChange(res.url);
      else alert('No se pudo subir la imagen: ' + (res.error || 'error'));
    } catch (err) {
      alert('Error al subir la imagen');
    }
    setUploading(false);
    e.target.value = '';
  };

  if (field.type === 'color') {
    const valid = /^#[0-9a-fA-F]{6}$/.test(value);
    return (
      <div className="flex items-center gap-2.5">
        <input
          type="color"
          value={valid ? value : '#d88193'}
          onChange={(e) => onChange(e.target.value)}
          className="w-11 h-10 border border-neutral-200 cursor-pointer bg-white p-1 rounded"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#d88193"
          className="flex-1 border border-neutral-200 px-3 py-2 text-xs font-mono focus:outline-none focus:border-[#d88193] rounded"
        />
      </div>
    );
  }

  if (field.type === 'textarea') {
    return (
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        className="w-full border border-neutral-200 px-3 py-2.5 text-xs leading-relaxed focus:outline-none focus:border-[#d88193] rounded resize-y"
      />
    );
  }

  if (field.type === 'image') {
    return (
      <div className="space-y-2">
        {value && (
          <div className="relative h-32 overflow-hidden rounded border border-neutral-200 bg-neutral-50">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={value} alt="" className="w-full h-full object-cover" />
            {uploading && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <Loader2 size={20} className="text-white animate-spin" />
              </div>
            )}
          </div>
        )}
        <label className="flex items-center justify-center gap-2 border border-dashed border-neutral-300 px-3 py-2.5 text-[11px] font-bold uppercase tracking-wider text-neutral-600 hover:border-[#d88193] hover:text-[#d88193] cursor-pointer rounded">
          <Upload size={13} /> {value ? 'Reemplazar imagen' : 'Subir imagen'}
          <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
        </label>
        <input
          type="url"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://... o /images/..."
          className="w-full border border-neutral-200 px-3 py-2 text-[11px] font-mono focus:outline-none focus:border-[#d88193] rounded"
        />
      </div>
    );
  }

  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={field.placeholder}
      className="w-full border border-neutral-200 px-3 py-2 text-xs focus:outline-none focus:border-[#d88193] rounded"
    />
  );
}

interface FieldGroup { group: string; fields: FieldDef[]; }

function groupFields(fields: FieldDef[]): FieldGroup[] {
  const groups: FieldGroup[] = [];
  for (const f of fields) {
    let g = groups.find((x) => x.group === f.group);
    if (!g) { g = { group: f.group, fields: [] }; groups.push(g); }
    g.fields.push(f);
  }
  return groups;
}

// ── EDITOR PRINCIPAL (estilo Wix Studio) ────────────────────
export function SiteContentEditor({ onExit }: { onExit?: () => void }) {
  const [pageId, setPageId] = useState('home');
  const [groupId, setGroupId] = useState<string | null>(null);
  const [mode, setMode] = useState<'content' | 'theme'>('content');
  const [device, setDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [values, setValues] = useState<ContentValues>({});
  const [theme, setTheme] = useState<SiteTheme>(DEFAULT_THEME);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [nonce, setNonce] = useState(1);
  const [past, setPast] = useState<{ values: ContentValues; theme: SiteTheme }[]>([]);
  const [future, setFuture] = useState<{ values: ContentValues; theme: SiteTheme }[]>([]);
  const [draftSaved, setDraftSaved] = useState(false);

  // ── Gestor de productos (editor tipo Wix para el catálogo) ──
  const [productsMode, setProductsMode] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [productDraft, setProductDraft] = useState<Product | null>(null);
  const [savingProduct, setSavingProduct] = useState(false);
  const [productSaved, setProductSaved] = useState(false);
  const [uploadingSlot, setUploadingSlot] = useState<string | null>(null);

  // Vista previa de imágenes (lightbox estilo Wix): al pasar el mouse sobre una
  // foto aparece el botón de ojo y se abre a pantalla completa.
  const [previewList, setPreviewList] = useState<string[] | null>(null);
  const [previewIndex, setPreviewIndex] = useState(0);
  const openPreview = (images: string[], index: number) => {
    const clean = (images || []).filter(Boolean);
    if (clean.length === 0) return;
    setPreviewList(clean);
    setPreviewIndex(Math.min(Math.max(0, index), clean.length - 1));
  };
  useEffect(() => {
    if (!previewList) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPreviewList(null);
      if (e.key === 'ArrowRight') setPreviewIndex((i) => Math.min(i + 1, (previewList?.length || 1) - 1));
      if (e.key === 'ArrowLeft') setPreviewIndex((i) => Math.max(i - 1, 0));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [previewList]);
  const [categoriesList, setCategoriesList] = useState<string[]>(DEFAULT_CATEGORIES);
  const [fitsList, setFitsList] = useState<string[]>(DEFAULT_FITS);
  const [showClassify, setShowClassify] = useState(false);

  const undoRef = useRef<() => void>(() => {});
  const redoRef = useRef<() => void>(() => {});
  const flushRef = useRef<() => void>(() => {});

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const wiredRef = useRef<{ doc: Document; onDbl: (e: Event) => void; onKey: (e: Event) => void } | null>(null);
  const pendingScrollRef = useRef<string | null>(null);

  const schema = PAGE_SCHEMAS.find((s) => s.id === pageId);
  const groups = schema ? groupFields(schema.fields) : [];
  const activeGroup = groups.find((g) => g.group === groupId) || groups[0];

  // ── Productos: carga, selección y guardado ──
  const loadProducts = async () => {
    setProductsLoading(true);
    try {
      const list = await fetchAllProductsAdmin();
      setProducts(list);
    } catch (e) {}
    setProductsLoading(false);
  };

  useEffect(() => {
    if (productsMode) {
      loadProducts();
      setCategoriesList(readClassList(PRODUCT_CATEGORIES_KEY, DEFAULT_CATEGORIES));
      setFitsList(readClassList(PRODUCT_FITS_KEY, DEFAULT_FITS));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productsMode]);

  const saveClassList = (key: string, list: string[], event: string) => {
    try { localStorage.setItem(key, JSON.stringify(list)); } catch (_) {}
    window.dispatchEvent(new Event(event));
  };

  const addCategory = (name: string) => {
    const clean = name.trim();
    if (!clean || categoriesList.includes(clean)) return;
    const updated = [...categoriesList, clean];
    setCategoriesList(updated);
    saveClassList(PRODUCT_CATEGORIES_KEY, updated, 'ush_categories_updated');
  };

  const removeCategory = (cat: string) => {
    const updated = categoriesList.filter((c) => c !== cat);
    setCategoriesList(updated);
    saveClassList(PRODUCT_CATEGORIES_KEY, updated, 'ush_categories_updated');
  };

  const addFit = (name: string) => {
    const clean = name.trim();
    if (!clean || fitsList.includes(clean)) return;
    const updated = [...fitsList, clean];
    setFitsList(updated);
    saveClassList(PRODUCT_FITS_KEY, updated, 'ush_fits_updated');
  };

  const removeFit = (fit: string) => {
    const updated = fitsList.filter((f) => f !== fit);
    setFitsList(updated);
    saveClassList(PRODUCT_FITS_KEY, updated, 'ush_fits_updated');
  };

  // Nueva referencia: se crea vacía y solo se guarda al pulsar "Guardar y publicar"
  const createNewProduct = () => {
    const num = String(Math.floor(100000 + Math.random() * 900000));
    const p: Product = {
      id: `ref-${num}`,
      name: 'Nueva Referencia',
      reference: num,
      slug: `ref-${num}`,
      suggested_price: 0,
      price: 0,
      in_stock: true,
      status: 'published',
      hidden: false,
      options: [{ id: `opt-${num}`, key: 'Talla', values: PRODUCT_SIZES }],
      images: [],
      stock_by_size: {},
      category: categoriesList[0] || 'Jeans',
    };
    openProduct(p);
  };

  const handleDeleteProduct = async () => {
    if (!productDraft) return;
    if (!window.confirm(`¿Eliminar la referencia ${productDraft.reference} (${productDraft.name})?\n\nEl producto desaparecerá del catálogo público. Esta acción no se puede deshacer.`)) return;
    setSavingProduct(true);
    const res = await deleteProductFromSupabase(productDraft.id);
    setSavingProduct(false);
    if (!res.success) {
      alert('No se pudo eliminar: ' + (res.error || 'error'));
      return;
    }
    publishCatalogChange();
    closeProduct();
    loadProducts();
  };

  // Duplica la referencia actual como borrador con nueva REF (se guarda al publicar)
  const handleDuplicateProduct = () => {
    if (!productDraft) return;
    const num = String(Math.floor(100000 + Math.random() * 900000));
    const clone: Product = JSON.parse(JSON.stringify(productDraft));
    clone.id = `ref-${num}`;
    clone.reference = num;
    clone.slug = `ref-${num}`;
    clone.name = `${productDraft.name} (copia)`;
    openProduct(clone);
  };

  // Oculta o vuelve a mostrar una talla del producto (options → Talla)
  const toggleSizeVisible = (size: string) => {
    if (!productDraft) return;
    const others = (productDraft.options || []).filter((o) => o.key.toLowerCase() !== 'talla');
    const current = draftSizes;
    const updated = current.includes(size)
      ? current.filter((s) => s !== size)
      : [...current, size].sort((a, b) => parseInt(a) - parseInt(b) || a.localeCompare(b));
    patchDraft({ options: [...others, { id: `opt-${productDraft.reference}`, key: 'Talla', values: updated }] });
  };

  const openProduct = (p: Product) => {
    setSelectedId(p.id);
    setProductDraft(JSON.parse(JSON.stringify(p)));
    setProductSaved(false);
  };

  const closeProduct = () => {
    setSelectedId(null);
    setProductDraft(null);
  };

  const patchDraft = (patch: Partial<Product>) => {
    setProductDraft((d) => (d ? { ...d, ...patch } : d));
  };

  const handleSaveProduct = async () => {
    if (!productDraft) return;
    setSavingProduct(true);
    const res = await upsertProduct(productDraft);
    setSavingProduct(false);
    if (!res.success) {
      alert('No se pudo guardar: ' + (res.error || 'error'));
      return;
    }
    // Historial auditable si cambiaron los precios
    const original = products.find((p) => p.id === productDraft.id);
    if (original && (original.price !== productDraft.price || original.suggested_price !== productDraft.suggested_price)) {
      await logPriceChange({
        product_id: productDraft.id,
        product_name: productDraft.name,
        old_wholesale_price: original.price || 0,
        new_wholesale_price: productDraft.price || 0,
        old_suggested_price: original.suggested_price || 0,
        new_suggested_price: productDraft.suggested_price || 0,
        changed_by: 'editor-catalogo',
      });
    }
    publishCatalogChange();
    setProductSaved(true);
    setTimeout(() => setProductSaved(false), 3000);
    loadProducts();
  };

  // Subida de fotos (comprime y guarda en el bucket product-images)
  const handleUploadPhoto = async (file: File, slot: number | 'main') => {
    if (!productDraft) return;
    setUploadingSlot(String(slot));
    try {
      const blob = await compressImage(file);
      const path = `products/${productDraft.reference || productDraft.id}-${slot === 'main' ? 'principal' : 'galeria' + slot}-${Date.now()}.jpg`;
      const res = await uploadProductImage(blob, path);
      if (res.success && res.url) {
        const images = [...(productDraft.images || [])];
        if (slot === 'main') images[0] = res.url;
        else images[slot as number] = res.url;
        patchDraft({ images });
      } else {
        alert('No se pudo subir la imagen: ' + (res.error || 'error'));
      }
    } catch (e) {
      alert('Error al subir la imagen');
    }
    setUploadingSlot(null);
  };

  const addGalleryUrl = () => {
    if (!productDraft) return;
    const url = window.prompt('URL de la imagen:');
    if (!url) return;
    patchDraft({ images: [...(productDraft.images || []), url] });
  };

  const removeImage = (idx: number) => {
    if (!productDraft) return;
    const images = (productDraft.images || []).filter((_, i) => i !== idx);
    patchDraft({ images });
  };

  // Modo editor: el preview prioriza la caché local (borrador en vivo)
  useEffect(() => {
    try { sessionStorage.setItem('ush_editor_live', '1'); } catch (e) {}
    return () => {
      try { sessionStorage.removeItem('ush_editor_live'); } catch (e) {}
    };
  }, []);

  // Cargar contenido de la página seleccionada
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const v = await getPageContentClient(pageId);
      if (!cancelled) setValues(v);
    };
    load();
    const first = groups[0];
    setGroupId(first ? first.group : null);
    setDirty(false);
    setSaved(false);
    setPast([]);
    setFuture([]);
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageId]);

  // Cargar tema global
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const t = await fetchThemeFromRemote();
      if (!cancelled && t) setTheme(t);
    };
    load();
    return () => { cancelled = true; };
  }, []);

  // Live preview: escribe el borrador en la caché (el iframe escucha el evento storage)
  useEffect(() => {
    if (!dirty) return;
    const timer = setTimeout(() => {
      try {
        localStorage.setItem('ush_content_' + pageId, JSON.stringify(values));
      } catch (e) {}
      window.dispatchEvent(new Event(CONTENT_EVENT));
    }, 250);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values, dirty]);

  useEffect(() => {
    if (!dirty || mode !== 'theme') return;
    const timer = setTimeout(() => {
      try {
        localStorage.setItem('ush_theme_cache', JSON.stringify(theme));
      } catch (e) {}
      window.dispatchEvent(new Event(THEME_EVENT));
    }, 200);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme, dirty, mode]);

  const handleChange = (key: string, val: string) => {
    setPast((p) => [...p.slice(-49), { values, theme }]);
    setFuture([]);
    setValues((prev) => ({ ...prev, [key]: val }));
    setDirty(true);
    setSaved(false);
  };

  const handleThemeChange = (key: keyof SiteTheme, val: string) => {
    setPast((p) => [...p.slice(-49), { values, theme }]);
    setFuture([]);
    setTheme((prev) => ({ ...prev, [key]: val }));
    setDirty(true);
    setSaved(false);
  };

  const handleUndo = () => {
    if (past.length === 0) return;
    const prev = past[past.length - 1];
    setPast((p) => p.slice(0, -1));
    setFuture((f) => [...f, { values, theme }]);
    setValues(prev.values);
    setTheme(prev.theme);
    setDirty(true);
    setSaved(false);
  };

  const handleRedo = () => {
    if (future.length === 0) return;
    const next = future[future.length - 1];
    setFuture((f) => f.slice(0, -1));
    setPast((p) => [...p, { values, theme }]);
    setValues(next.values);
    setTheme(next.theme);
    setDirty(true);
    setSaved(false);
  };

  undoRef.current = handleUndo;
  redoRef.current = handleRedo;

  // Guarda el borrador local al instante (sin publicar en el sitio)
  const flushDraft = () => {
    try { localStorage.setItem('ush_content_' + pageId, JSON.stringify(values)); } catch (e) {}
    try { localStorage.setItem('ush_theme_cache', JSON.stringify(theme)); } catch (e) {}
    window.dispatchEvent(new Event(CONTENT_EVENT));
    window.dispatchEvent(new Event(THEME_EVENT));
    setDraftSaved(true);
    setTimeout(() => setDraftSaved(false), 2500);
  };
  flushRef.current = flushDraft;

  // Atajos de teclado en el editor
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) redoRef.current(); else undoRef.current();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        redoRef.current();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        flushRef.current();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleReset = () => {
    setPast((p) => [...p.slice(-49), { values, theme }]);
    setFuture([]);
    if (mode === 'theme') {
      setTheme(DEFAULT_THEME);
    } else {
      setValues({});
    }
    setDirty(true);
  };

  const handlePublish = async () => {
    setSaving(true);
    let res: { success: boolean; error?: string };
    if (mode === 'theme') {
      res = await saveTheme(theme);
    } else {
      res = await savePageContent(pageId, values);
    }
    setSaving(false);
    if (res.success) {
      setSaved(true);
      setDirty(false);
      publishCatalogChange();
      setNonce((n) => n + 1);
      setTimeout(() => setSaved(false), 4000);
    } else {
      alert('No se pudo publicar: ' + (res.error || 'error'));
    }
  };

  const selectPage = (id: string) => {
    setPageId(id);
    setMode('content');
    setProductsMode(false);
    closeProduct();
  };

  // Doble clic en una sección del preview → navega a su panel de propiedades
  const selectSection = (sectionId: string) => {
    const m = SECTION_MAP[sectionId];
    if (!m) return;
    setMode('content');
    setPageId(m.pageId);
    setGroupId(m.group);
  };

  // Desplaza el preview (iframe) hasta la sección activa del editor
  const scrollPreviewToSection = (sectionId: string | null) => {
    const frame = iframeRef.current;
    const doc = frame?.contentDocument;
    if (!doc || !sectionId) return;
    const el = doc.querySelector(`[data-editor-section="${sectionId}"]`) as HTMLElement | null;
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    el.style.outline = '2px solid #d88193';
    el.style.outlineOffset = '2px';
    setTimeout(() => { el.style.outline = ''; el.style.outlineOffset = ''; }, 1600);
  };

  // Al cambiar de página o sección: marca la sección objetivo y hace scroll
  // en el preview (si el iframe ya está cargado).
  useEffect(() => {
    const sec = sectionForGroup(pageId, activeGroup?.group || '');
    pendingScrollRef.current = sec;
    scrollPreviewToSection(sec);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId, pageId]);

  // Conecta el iframe del preview: estilos de edición + doble clic
  const wireFrame = () => {
    const frame = iframeRef.current;
    const doc = frame?.contentDocument;
    if (!doc || !frame) return;
    if (wiredRef.current?.doc === doc) return;

    let style = doc.getElementById('ush-editor-style') as HTMLStyleElement | null;
    if (!style) {
      style = doc.createElement('style');
      style.id = 'ush-editor-style';
      style.textContent = `
        [data-editor-section] { cursor: crosshair; }
        [data-editor-section]:hover { outline: 2px dashed #d88193; outline-offset: 2px; }
      `;
      doc.head.appendChild(style);
    }

    const onDbl = (e: Event) => {
      const target = e.target as HTMLElement;
      const el = target?.closest?.('[data-editor-section]') as HTMLElement | null;
      if (!el) return;
      e.preventDefault();
      const id = el.getAttribute('data-editor-section') || '';
      el.style.outline = '2px solid #116dff';
      el.style.outlineOffset = '2px';
      setTimeout(() => { el.style.outline = ''; el.style.outlineOffset = ''; }, 1400);
      selectSection(id);
    };
    const onKey = (e: Event) => {
      const ke = e as KeyboardEvent;
      if ((ke.ctrlKey || ke.metaKey) && ke.key.toLowerCase() === 'z') {
        ke.preventDefault();
        if (ke.shiftKey) redoRef.current(); else undoRef.current();
      } else if ((ke.ctrlKey || ke.metaKey) && ke.key.toLowerCase() === 'y') {
        ke.preventDefault();
        redoRef.current();
      }
    };
    doc.addEventListener('dblclick', onDbl, true);
    doc.addEventListener('keydown', onKey, true);
    wiredRef.current = { doc, onDbl, onKey };

    // Si hay una sección pendiente (se cambió de página/grupo), hace scroll al recargar
    if (pendingScrollRef.current) {
      scrollPreviewToSection(pendingScrollRef.current);
    }
  };

  const previewRoute = PAGE_ROUTES[pageId] || '/';
  const iframeSrc = `${previewRoute}${previewRoute.includes('?') ? '&' : '?'}editor=${nonce}`;

  // Lista filtrada del gestor de productos
  const filteredProductsList = products.filter((p) => {
    const q = productSearch.trim().toLowerCase();
    if (!q) return true;
    return (p.name || '').toLowerCase().includes(q) || (p.reference || '').toLowerCase().includes(q);
  });
  const sizeOptionDraft = productDraft?.options?.find((o) => o.key.toLowerCase() === 'talla');
  const draftSizes = sizeOptionDraft?.values && sizeOptionDraft.values.length > 0 ? sizeOptionDraft.values : PRODUCT_SIZES;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#f3f4f6] overflow-hidden">
      {/* ── Top Toolbar ── */}
      <div className="h-14 bg-[#1b2333] text-white flex items-center justify-between px-4 flex-shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          {onExit && (
            <button
              onClick={onExit}
              title="Salir del editor"
              className="p-2 text-neutral-400 hover:text-white hover:bg-white/10 rounded-md"
            >
              <X size={16} />
            </button>
          )}
          <div className="w-8 h-8 bg-[#d88193] rounded flex items-center justify-center">
            <LayoutTemplate size={16} />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-black uppercase tracking-widest truncate">
              {mode === 'theme' ? 'Diseño Global' : (schema?.label || 'Página')}
            </div>
            <div className="text-[10px] text-neutral-400 truncate">
              Editor del sitio · USH BY USHUAIA
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden xl:flex items-center gap-1.5 text-[10px] text-neutral-400 mr-1">
            <Pointer size={11} className="text-[#d88193]" /> Doble clic en una sección para editarla
          </span>

          {/* Device toggle */}
          <div className="flex items-center bg-white/10 rounded-md overflow-hidden">
            {(['desktop', 'tablet', 'mobile'] as const).map((d) => (
              <button
                key={d}
                onClick={() => setDevice(d)}
                title={d}
                className={`p-2 ${device === d ? 'bg-[#d88193] text-white' : 'text-neutral-300 hover:text-white'}`}
              >
                {d === 'desktop' ? <Monitor size={14} /> : d === 'tablet' ? <Tablet size={14} /> : <Smartphone size={14} />}
              </button>
            ))}
          </div>

          <button
            onClick={handleUndo}
            disabled={past.length === 0}
            title="Deshacer (Ctrl+Z)"
            className="p-2 text-neutral-300 hover:text-white hover:bg-white/10 rounded-md disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-neutral-300"
          >
            <Undo2 size={14} />
          </button>
          <button
            onClick={handleRedo}
            disabled={future.length === 0}
            title="Rehacer (Ctrl+Shift+Z)"
            className="p-2 text-neutral-300 hover:text-white hover:bg-white/10 rounded-md disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-neutral-300"
          >
            <Redo2 size={14} />
          </button>

          <button
            onClick={handleReset}
            title="Restaurar valores por defecto"
            className="p-2 text-neutral-300 hover:text-white hover:bg-white/10 rounded-md"
          >
            <RotateCcw size={14} />
          </button>

          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-1.5 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-neutral-300 hover:text-white hover:bg-white/10 rounded-md"
          >
            <ExternalLink size={12} /> Ver sitio
          </a>

          <div className="flex items-center gap-2 pl-2 border-l border-white/15">
            {draftSaved && (
              <span className="hidden md:flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                <CheckCircle size={12} /> Borrador guardado
              </span>
            )}
            {dirty && <span className="hidden md:block text-[10px] font-bold uppercase tracking-wider text-amber-300">Sin publicar</span>}
            {saved && (
              <span className="hidden md:flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                <CheckCircle size={12} /> Publicado
              </span>
            )}
            <button
              onClick={flushDraft}
              title="Guardar borrador local (Ctrl+S)"
              className="hidden sm:flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white text-[11px] font-black uppercase tracking-widest px-4 py-2.5 rounded shadow disabled:opacity-50"
            >
              <FileClock size={13} />
              Guardar
            </button>
            <button
              onClick={handlePublish}
              disabled={saving}
              className="flex items-center gap-2 bg-[#116dff] hover:bg-[#0d5cd6] text-white text-[11px] font-black uppercase tracking-widest px-5 py-2.5 rounded shadow-lg disabled:opacity-50"
            >
              {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
              Publicar
            </button>
          </div>
        </div>
      </div>

      {/* ── Draft banner: preview local hasta publicar ── */}
      {dirty && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-800 text-[10px] font-bold uppercase tracking-wider px-4 py-1.5 flex-shrink-0">
          Modo borrador: los cambios solo se ven en esta vista previa. Pulsa Publicar para aplicarlos en todo el sitio, otras URLs y dispositivos.
        </div>
      )}

      {/* ── Body: left / canvas / right ── */}
      <div className="flex flex-1 min-h-0">
        {/* Left: Pages + layers */}
        <aside className="w-52 bg-[#121824] text-white flex flex-col flex-shrink-0 min-h-0 border-r border-black/20">
          <div className="px-4 py-3 text-[9px] font-black uppercase tracking-[0.25em] text-neutral-500 border-b border-white/5">
            Páginas
          </div>
          <div className="flex-1 overflow-y-auto py-2">
            {PAGE_SCHEMAS.map((s) => {
              const isActive = mode === 'content' && pageId === s.id;
              const sGroups = groupFields(s.fields);
              return (
                <div key={s.id}>
                  <button
                    onClick={() => selectPage(s.id)}
                    className={`w-full flex items-center gap-2 px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-left transition-colors ${
                      isActive ? 'bg-white/10 text-white border-l-2 border-[#d88193]' : 'text-neutral-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <FileText size={13} className={isActive ? 'text-[#d88193]' : 'text-neutral-500'} />
                    <span className="flex-1 truncate">{s.label}</span>
                    {isActive ? <ChevronDown size={13} className="text-neutral-400" /> : <ChevronRight size={13} className="text-neutral-600" />}
                  </button>

                  {isActive && (
                    <div className="ml-3 pl-3 border-l border-white/10 pb-2">
                      {sGroups.map((g) => (
                        <button
                          key={g.group}
                          onClick={() => { setGroupId(g.group); setProductsMode(false); closeProduct(); }}
                          className={`w-full text-left px-3 py-1.5 text-[10px] font-semibold tracking-wide rounded-l ${
                            !productsMode && activeGroup?.group === g.group ? 'bg-[#d88193]/20 text-[#f9c9d2]' : 'text-neutral-500 hover:text-white'
                          }`}
                        >
                          {g.group}
                        </button>
                      ))}

                      {/* Gestor de productos: solo en la página Catálogo */}
                      {s.id === 'catalogo' && (
                        <button
                          onClick={() => { setMode('content'); setProductsMode(true); }}
                          className={`w-full flex items-center gap-1.5 px-3 py-1.5 mt-1 text-[10px] font-bold uppercase tracking-wider rounded-l ${
                            productsMode ? 'bg-[#d88193] text-white' : 'text-neutral-400 hover:text-white hover:bg-white/5'
                          }`}
                        >
                          <Package size={11} /> Productos
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="border-t border-white/5 py-2">
            <button
              onClick={() => { setMode('theme'); setDirty(false); setSaved(false); }}
              className={`w-full flex items-center gap-2 px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-left transition-colors ${
                mode === 'theme' ? 'bg-white/10 text-white border-l-2 border-[#d88193]' : 'text-neutral-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Palette size={13} className={mode === 'theme' ? 'text-[#d88193]' : 'text-neutral-500'} />
              Diseño · Colores
            </button>
          </div>
        </aside>

        {/* Center: lienzo — preview del sitio o workspace de productos (tipo Wix) */}
        {productsMode ? (
          <div className="flex-1 min-w-0 bg-[#eef0f3] overflow-auto">
            {selectedId && productDraft ? (
              /* ── EDITOR VISUAL DEL PRODUCTO ── */
              <div className="max-w-5xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                {/* Fotos (izquierda del lienzo) */}
                <div className="space-y-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">Fotos</p>
                  <div className="relative group/main bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden aspect-[3/4] max-h-[460px] w-full">
                    {productDraft.images?.[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={productDraft.images[0]} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <label className="absolute inset-0 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-neutral-50 transition-colors">
                        <Upload size={26} className="text-neutral-300" />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Subir foto principal</span>
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUploadPhoto(f, 'main'); e.target.value = ''; }} />
                      </label>
                    )}
                    {productDraft.images?.[0] && (
                      <button
                        onClick={() => openPreview(productDraft.images || [], 0)}
                        title="Ver imagen"
                        className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover/main:bg-black/35 transition-all cursor-zoom-in"
                      >
                        <span className="opacity-0 group-hover/main:opacity-100 transition-opacity bg-white/95 rounded-full p-3 shadow-lg text-[#1b2333]">
                          <Eye size={20} />
                        </span>
                      </button>
                    )}
                    {productDraft.images?.[0] && (
                      <label className="absolute bottom-3 right-3 bg-white/95 shadow px-3 py-1.5 text-[9px] font-black uppercase tracking-wider text-neutral-600 hover:text-[#d88193] cursor-pointer rounded flex items-center gap-1">
                        <Upload size={10} /> Cambiar
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUploadPhoto(f, 'main'); e.target.value = ''; }} />
                      </label>
                    )}
                    {uploadingSlot === 'main' && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center"><Loader2 size={22} className="text-white animate-spin" /></div>
                    )}
                  </div>

                  <input
                    type="url"
                    value={productDraft.images?.[0] || ''}
                    onChange={(e) => patchDraft({ images: [e.target.value, ...(productDraft.images || []).slice(1)] })}
                    placeholder="URL de la foto principal"
                    className="w-full border border-neutral-200 px-3 py-2 text-[11px] font-mono focus:outline-none focus:border-[#d88193] rounded bg-white"
                  />

                  {(productDraft.images || []).length > 1 && (
                    <div className="grid grid-cols-5 gap-2">
                      {(productDraft.images || []).slice(1).map((img, i) => (
                        <div key={i} className="relative aspect-square bg-white rounded-lg overflow-hidden border border-neutral-200 shadow-sm group/thumb">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={img} alt="" className="w-full h-full object-cover" />
                          <button
                            onClick={() => openPreview(productDraft.images || [], i + 1)}
                            title="Ver imagen"
                            className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover/thumb:bg-black/30 transition-all cursor-zoom-in"
                          >
                            <span className="opacity-0 group-hover/thumb:opacity-100 transition-opacity bg-white/95 rounded-full p-1.5 shadow text-[#1b2333]">
                              <Eye size={12} />
                            </span>
                          </button>
                          <button onClick={() => removeImage(i + 1)} className="absolute top-1 right-1 bg-white/90 rounded p-1 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity shadow z-10">
                            <Trash2 size={11} />
                          </button>
                          {uploadingSlot === String(i + 1) && (
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center"><Loader2 size={14} className="text-white animate-spin" /></div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  <button onClick={addGalleryUrl} className="w-full flex items-center justify-center gap-1.5 border border-dashed border-neutral-300 py-2.5 text-[10px] font-black uppercase tracking-wider text-neutral-500 hover:border-[#d88193] hover:text-[#d88193] rounded-lg bg-white">
                    <Plus size={12} /> Agregar foto a la galería
                  </button>
                </div>

                {/* Textos (derecha del lienzo) */}
                <div className="space-y-4 bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
                  <div>
                    <input
                      value={productDraft.name}
                      onChange={(e) => patchDraft({ name: e.target.value })}
                      placeholder="Nombre de la prenda"
                      className="w-full text-xl font-black uppercase tracking-tight text-[#1b2333] border-b-2 border-transparent hover:border-neutral-100 focus:border-[#d88193] focus:outline-none pb-1"
                    />
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <span className="bg-neutral-100 text-neutral-500 text-[10px] font-black tracking-widest px-2 py-0.5 rounded">REF. {productDraft.reference}</span>
                      <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${!productDraft.hidden && productDraft.status !== 'draft' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
                        {!productDraft.hidden && productDraft.status !== 'draft' ? 'Visible' : 'Oculto'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[9px] font-black uppercase tracking-widest text-neutral-400 mb-1">Descripción corta (tarjeta del catálogo)</label>
                    <textarea
                      value={productDraft.description || ''}
                      onChange={(e) => patchDraft({ description: e.target.value })}
                      rows={3}
                      className="w-full border border-neutral-200 px-3 py-2.5 text-xs leading-relaxed focus:outline-none focus:border-[#d88193] rounded resize-y"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-black uppercase tracking-widest text-neutral-400 mb-1">Descripción detallada (página del producto)</label>
                    <textarea
                      value={productDraft.full_description || ''}
                      onChange={(e) => patchDraft({ full_description: e.target.value })}
                      rows={8}
                      className="w-full border border-neutral-200 px-3 py-2.5 text-xs leading-relaxed focus:outline-none focus:border-[#d88193] rounded resize-y"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-black uppercase tracking-widest text-neutral-400 mb-1">Video (MP4 / YouTube) — opcional</label>
                    <input
                      type="url"
                      value={productDraft.video_url || ''}
                      onChange={(e) => patchDraft({ video_url: e.target.value })}
                      className="w-full border border-neutral-200 px-3 py-2 text-[11px] font-mono focus:outline-none focus:border-[#d88193] rounded"
                    />
                  </div>

                  {productSaved && (
                    <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 flex items-center gap-1">
                      <CheckCircle size={12} /> Publicado en todo el sitio
                    </p>
                  )}
                </div>
              </div>
            ) : (
              /* ── CUADRÍCULA DE PRODUCTOS ── */
              <div className="p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="relative flex-1 max-w-md">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                    <input
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      placeholder="Buscar por nombre o referencia…"
                      className="w-full bg-white border border-neutral-200 shadow-sm pl-9 pr-3 py-2.5 text-xs focus:outline-none focus:border-[#d88193] rounded-lg"
                    />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">{filteredProductsList.length} referencias</span>
                  <button
                    onClick={createNewProduct}
                    className="ml-auto flex items-center gap-1.5 bg-[#d88193] hover:bg-[#c56a7e] text-white text-[11px] font-black uppercase tracking-wider px-4 py-2.5 rounded-lg shadow-sm"
                  >
                    <Plus size={14} /> Nueva referencia
                  </button>
                </div>

                {productsLoading && products.length === 0 ? (
                  <div className="py-24 flex justify-center"><Loader2 size={24} className="animate-spin text-neutral-300" /></div>
                ) : filteredProductsList.length === 0 ? (
                  <div className="py-24 text-center">
                    <Package size={34} className="mx-auto text-neutral-300 mb-3" />
                    <p className="text-xs font-bold uppercase tracking-wider text-neutral-400">Sin resultados</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                    {filteredProductsList.map((p) => {
                      const visible = !p.hidden && p.status !== 'draft';
                      const stockVals = Object.values(p.stock_by_size || {});
                      const totalStock = stockVals.length ? stockVals.reduce((a, b) => a + (Number(b) || 0), 0) : null;
                      const low = totalStock !== null && totalStock > 0 && totalStock <= 5;
                      const out = totalStock === 0;
                      return (
                        <button
                          key={p.id}
                          onClick={() => openProduct(p)}
                          className="group text-left bg-white rounded-xl overflow-hidden border border-neutral-200 shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all"
                        >
                          <div className="relative aspect-[3/4] bg-neutral-100">
                            {p.images?.[0] ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={p.images[0]} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-neutral-300 uppercase tracking-widest">Sin foto</div>
                            )}
                            <span className={`absolute top-2 left-2 text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded ${visible ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
                              {visible ? 'Visible' : 'Oculto'}
                            </span>
                            {p.ribbon && (
                              <span className="absolute top-2 right-2 bg-[#1b2333]/85 text-white text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded">
                                {p.ribbon}
                              </span>
                            )}
                            {(low || out) && (
                              <span className={`absolute bottom-2 left-2 text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded ${out ? 'bg-red-600 text-white' : 'bg-amber-400 text-neutral-900'}`}>
                                {out ? 'Sin stock' : `Poco stock · ${totalStock}`}
                              </span>
                            )}
                            <span
                              role="button"
                              title="Ver imagen"
                              onClick={(e) => { e.stopPropagation(); openPreview(p.images || [], 0); }}
                              className="absolute bottom-2 right-2 bg-white/95 rounded-full p-1.5 text-[#1b2333] opacity-0 group-hover:opacity-100 transition-opacity shadow cursor-zoom-in"
                            >
                              <Eye size={13} />
                            </span>
                            <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/50 to-transparent h-10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                          </div>
                          <div className="p-3">
                            <p className="text-[11px] font-black text-neutral-800 truncate group-hover:text-[#d88193]">{p.name}</p>
                            <div className="flex items-center justify-between mt-1">
                              <span className="text-[9px] text-neutral-400 font-bold tracking-wide">REF. {p.reference}</span>
                              <span className="text-xs font-black text-[#1b2333]">${(p.price || 0).toLocaleString('es-CO')}</span>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 min-w-0 bg-[#e5e7eb] p-4 overflow-auto flex justify-center">
            <div
              className="bg-white shadow-2xl ring-1 ring-black/10 transition-all duration-300"
              style={{ width: DEVICE_WIDTH[device], height: '100%', minHeight: '100%' }}
            >
              <iframe
                key={pageId + nonce}
                ref={iframeRef}
                src={iframeSrc}
                onLoad={wireFrame}
                className="w-full h-full"
                style={{ border: 'none' }}
                title="Preview del sitio"
              />
            </div>
          </div>
        )}

        {/* Right: properties */}
        <aside className="w-72 bg-white border-l border-neutral-200 flex flex-col flex-shrink-0 min-h-0">
          <div className="px-5 py-4 border-b border-neutral-100 flex-shrink-0">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#d88193]">
              {mode === 'theme' ? <Palette size={12} /> : productsMode ? <Package size={12} /> : <LayoutTemplate size={12} />}
              {mode === 'theme' ? 'Propiedades globales' : productsMode ? (selectedId ? 'Inspector de producto' : 'Gestor de productos') : 'Propiedades de sección'}
            </div>
            <h3 className="text-sm font-black uppercase tracking-tight text-[#1b2333] mt-1 truncate">
              {mode === 'theme'
                ? 'Diseño del sitio'
                : productsMode
                ? (selectedId && productDraft ? (productDraft.name || 'Producto') : 'Catálogo')
                : (activeGroup?.group || 'General')}
            </h3>
            <p className="text-[11px] text-neutral-500 mt-0.5">
              {mode === 'theme'
                ? 'Colores de marca y texto de la franja superior. Cambia y publica.'
                : productsMode && selectedId && productDraft
                ? `REF. ${productDraft.reference} — ajusta precios, clasificación e inventario`
                : productsMode
                ? 'Administra las prendas desde el lienzo central.'
                : (schema?.description || '')}
            </p>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {mode === 'theme' ? (
              <div className="space-y-4">
                {THEME_FIELDS.map((f) => (
                  <div key={f.key}>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-600 mb-1.5">
                      {f.label}
                    </label>
                    {f.type === 'color' ? (
                      <div className="flex items-center gap-2.5">
                        <input
                          type="color"
                          value={/^#[0-9a-fA-F]{6}$/.test(theme[f.key] as string) ? (theme[f.key] as string) : '#d88193'}
                          onChange={(e) => handleThemeChange(f.key, e.target.value)}
                          className="w-11 h-10 border border-neutral-200 cursor-pointer bg-white p-1 rounded"
                        />
                        <input
                          type="text"
                          value={theme[f.key] as string}
                          onChange={(e) => handleThemeChange(f.key, e.target.value)}
                          className="flex-1 border border-neutral-200 px-3 py-2 text-xs font-mono focus:outline-none focus:border-[#d88193] rounded"
                        />
                      </div>
                    ) : (
                      <textarea
                        value={theme.topNoticeText}
                        onChange={(e) => handleThemeChange('topNoticeText', e.target.value)}
                        rows={3}
                        className="w-full border border-neutral-200 px-3 py-2.5 text-xs leading-relaxed focus:outline-none focus:border-[#d88193] rounded resize-y"
                      />
                    )}
                  </div>
                ))}
              </div>
            ) : productsMode ? (
              /* ── INSPECTOR DEL PRODUCTO (panel derecho, como Wix) ── */
              selectedId && productDraft ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={closeProduct}
                      className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-neutral-500 hover:text-[#d88193]"
                    >
                      <ArrowLeft size={12} /> Volver
                    </button>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={handleDuplicateProduct}
                        disabled={savingProduct}
                        className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-neutral-400 hover:text-[#116dff] disabled:opacity-50"
                      >
                        <Copy size={11} /> Duplicar
                      </button>
                      {!productDraft.id.startsWith('ref-new') && (
                        <button
                          onClick={handleDeleteProduct}
                          disabled={savingProduct}
                          className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-red-400 hover:text-red-600 disabled:opacity-50"
                        >
                          <Trash2 size={11} /> Eliminar
                        </button>
                      )}
                    </div>
                  </div>

                  {/* PRECIOS */}
                  <section className="border border-neutral-200 rounded-lg overflow-hidden">
                    <header className="bg-neutral-50 px-3 py-2 text-[9px] font-black uppercase tracking-widest text-neutral-500">Precios (COP)</header>
                    <div className="p-3 space-y-2.5">
                      {([
                        { key: 'suggested_price', label: 'Precio sugerido de venta' },
                        { key: 'price', label: 'Precio mayorista (12+ uds)' },
                        { key: 'compare_price', label: 'Precio tachado (opcional)' },
                      ] as const).map((f) => (
                        <div key={f.key}>
                          <label className="block text-[9px] font-bold uppercase tracking-wider text-neutral-500 mb-1">{f.label}</label>
                          <input
                            type="number"
                            min={0}
                            value={(productDraft[f.key] as number) ?? 0}
                            onChange={(e) => patchDraft({ [f.key]: parseInt(e.target.value) || 0 } as Partial<Product>)}
                            className="w-full border border-neutral-200 px-2.5 py-1.5 text-xs font-semibold focus:outline-none focus:border-[#d88193] rounded"
                          />
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* CLASIFICACIÓN */}
                  <section className="border border-neutral-200 rounded-lg overflow-hidden">
                    <header className="bg-neutral-50 px-3 py-2 text-[9px] font-black uppercase tracking-widest text-neutral-500">Clasificación</header>
                    <div className="p-3 space-y-2.5">
                      {([
                        { key: 'category', label: 'Categoría', options: categoriesList },
                        { key: 'fit', label: 'Fit / Corte', options: fitsList },
                        { key: 'color', label: 'Color', options: PRODUCT_COLORS },
                      ] as const).map((f) => (
                        <div key={f.key}>
                          <label className="block text-[9px] font-bold uppercase tracking-wider text-neutral-500 mb-1">{f.label}</label>
                          <select
                            value={(productDraft[f.key] as string) || ''}
                            onChange={(e) => patchDraft({ [f.key]: e.target.value } as Partial<Product>)}
                            className="w-full border border-neutral-200 px-2.5 py-1.5 text-xs focus:outline-none focus:border-[#d88193] rounded bg-white"
                          >
                            <option value="">Sin {f.label.toLowerCase()}</option>
                            {f.options.map((o) => <option key={o} value={o}>{o}</option>)}
                          </select>
                        </div>
                      ))}
                      <div>
                        <label className="block text-[9px] font-bold uppercase tracking-wider text-neutral-500 mb-1">Cinta / Etiqueta</label>
                        <select
                          value={productDraft.ribbon || ''}
                          onChange={(e) => patchDraft({ ribbon: e.target.value })}
                          className="w-full border border-neutral-200 px-2.5 py-1.5 text-xs focus:outline-none focus:border-[#d88193] rounded bg-white"
                        >
                          <option value="">Sin cinta</option>
                          <option value="Nuevo">🆕 Nuevo</option>
                          <option value="Más vendido">🔥 Más vendido</option>
                          <option value="Oferta">🏷️ Oferta</option>
                          <option value="Exclusivo">⭐ Exclusivo</option>
                        </select>
                      </div>
                    </div>
                  </section>

                  {/* STOCK Y VISIBILIDAD */}
                  <section className="border border-neutral-200 rounded-lg overflow-hidden">
                    <header className="bg-neutral-50 px-3 py-2 text-[9px] font-black uppercase tracking-widest text-neutral-500">Inventario y visibilidad</header>
                    <div className="p-3 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-neutral-600 flex items-center gap-1">
                          {productDraft.hidden ? <EyeOff size={11} className="text-red-400" /> : <Eye size={11} className="text-emerald-500" />}
                          {productDraft.hidden ? 'Oculto para clientes' : 'Visible en el catálogo'}
                        </span>
                        <button
                          type="button"
                          onClick={() => patchDraft({ hidden: !productDraft.hidden, status: productDraft.hidden ? 'published' : 'draft' })}
                          className={`relative w-9 h-5 rounded-full transition-colors ${productDraft.hidden ? 'bg-gray-300' : 'bg-emerald-500'}`}
                        >
                          <span className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all" style={{ left: productDraft.hidden ? 2 : 18 }} />
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-neutral-600 flex items-center gap-1">
                          <Star size={11} className={productDraft.is_best_seller ? 'text-amber-500 fill-amber-400' : 'text-neutral-300'} />
                          Más vendido (portada)
                        </span>
                        <button
                          type="button"
                          onClick={() => patchDraft({ is_best_seller: !productDraft.is_best_seller })}
                          className={`relative w-9 h-5 rounded-full transition-colors ${productDraft.is_best_seller ? 'bg-amber-500' : 'bg-gray-300'}`}
                        >
                          <span className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all" style={{ left: productDraft.is_best_seller ? 18 : 2 }} />
                        </button>
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold uppercase tracking-wider text-neutral-500 mb-1">Unidades por talla</label>
                        <div className="flex gap-1.5">
                          {draftSizes.map((s) => (
                            <div key={s} className="flex-1">
                              <span className="block text-center text-[8px] font-bold text-neutral-400 mb-0.5">{s}</span>
                              <input
                                type="number"
                                min={0}
                                value={productDraft.stock_by_size?.[s] ?? 0}
                                onChange={(e) => patchDraft({ stock_by_size: { ...(productDraft.stock_by_size || {}), [s]: Math.max(0, parseInt(e.target.value) || 0) } })}
                                className={`w-full text-center text-[11px] font-semibold border rounded py-1 focus:outline-none focus:border-[#d88193] ${(productDraft.stock_by_size?.[s] ?? 0) > 0 ? 'border-gray-200' : 'border-red-200 bg-red-50 text-red-500'}`}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold uppercase tracking-wider text-neutral-500 mb-1">Tallas visibles (clic para ocultar/mostrar)</label>
                        <p className="text-[8.5px] text-neutral-400 leading-snug mb-1.5">Las tallas con inventario en 0 se ocultan solas en la tienda; aquí también puedes ocultarlas manualmente.</p>
                        <div className="flex flex-wrap gap-1">
                          {['6', '8', '10', '12', '14'].map((s) => {
                            const on = draftSizes.includes(s);
                            return (
                              <button
                                key={s}
                                type="button"
                                onClick={() => toggleSizeVisible(s)}
                                className={`w-8 py-1 text-[10px] font-black rounded border transition-colors ${
                                  on
                                    ? 'bg-[#1b2333] text-white border-[#1b2333]'
                                    : 'bg-white text-neutral-300 border-gray-200 line-through'
                                }`}
                              >
                                {s}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* GUARDAR */}
                  <div className="sticky bottom-0 bg-white pt-2 pb-1 border-t border-neutral-100">
                    <button
                      onClick={handleSaveProduct}
                      disabled={savingProduct}
                      className="w-full flex items-center justify-center gap-2 bg-[#116dff] hover:bg-[#0d5cd6] disabled:opacity-50 text-white text-[11px] font-black uppercase tracking-widest px-4 py-3 rounded shadow"
                    >
                      {savingProduct ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                      {savingProduct ? 'Publicando…' : 'Guardar y publicar'}
                    </button>
                    {productSaved && (
                      <p className="mt-2 text-center text-[10px] font-bold uppercase tracking-wider text-emerald-600 flex items-center justify-center gap-1">
                        <CheckCircle size={11} /> Publicado en todo el sitio
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                /* ── PANEL DE LISTA: resumen + clasificaciones ── */
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-2">
                    {([
                      { label: 'Total', value: products.length, color: 'text-neutral-900' },
                      { label: 'Visibles', value: products.filter((p) => !p.hidden && p.status !== 'draft').length, color: 'text-emerald-600' },
                      { label: 'Ocultos', value: products.filter((p) => p.hidden || p.status === 'draft').length, color: 'text-red-500' },
                    ] as const).map((s) => (
                      <div key={s.label} className="border border-neutral-200 rounded-lg py-2.5 text-center">
                        <p className={`text-lg font-black ${s.color}`}>{s.value}</p>
                        <p className="text-[8px] font-black uppercase tracking-widest text-neutral-400">{s.label}</p>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={createNewProduct}
                    className="w-full flex items-center justify-center gap-1.5 bg-[#d88193] hover:bg-[#c56a7e] text-white text-[10px] font-black uppercase tracking-widest px-3 py-2.5 rounded"
                  >
                    <Plus size={13} /> Nueva referencia
                  </button>

                  {/* Categorías y Fits del catálogo */}
                  <div>
                    <button
                      onClick={() => setShowClassify(!showClassify)}
                      className="w-full flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-neutral-500 hover:text-[#d88193] py-1"
                    >
                      Categorías y fits ({categoriesList.length + fitsList.length})
                      <ChevronDown size={11} className={`transition-transform ${showClassify ? 'rotate-180' : ''}`} />
                    </button>
                    {showClassify && (
                      <div className="mt-2 space-y-3 border border-neutral-200 rounded-lg p-3">
                        {([
                          { label: 'Categorías', list: categoriesList, onAdd: addCategory, onRemove: removeCategory },
                          { label: 'Fits / Cortes', list: fitsList, onAdd: addFit, onRemove: removeFit },
                        ] as const).map((sec) => (
                          <div key={sec.label}>
                            <p className="text-[8px] font-black uppercase tracking-widest text-neutral-400 mb-1.5">{sec.label}</p>
                            <div className="flex flex-wrap gap-1 mb-1.5">
                              {sec.list.map((item) => (
                                <span key={item} className="inline-flex items-center gap-0.5 bg-neutral-100 text-neutral-700 text-[9px] font-bold px-1.5 py-0.5 rounded group">
                                  {item}
                                  <button onClick={() => sec.onRemove(item)} className="text-neutral-400 hover:text-red-500">
                                    <X size={9} />
                                  </button>
                                </span>
                              ))}
                            </div>
                            <input
                              placeholder={`Agregar ${sec.label.toLowerCase().replace(/s$/, '')}… (Enter)`}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  sec.onAdd((e.target as HTMLInputElement).value);
                                  (e.target as HTMLInputElement).value = '';
                                }
                              }}
                              className="w-full border border-neutral-200 px-2 py-1 text-[10px] focus:outline-none focus:border-[#d88193] rounded"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <p className="text-[10px] leading-relaxed text-neutral-400 border-l-2 border-[#d88193] pl-2">
                    Haz clic sobre una prenda en el lienzo central para editarla. Los cambios se publican en vivo en todo el sitio.
                  </p>

                  <button onClick={loadProducts} className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest text-neutral-400 hover:text-[#d88193]">
                    <RefreshCw size={10} className={productsLoading ? 'animate-spin' : ''} /> Actualizar lista
                  </button>
                </div>
              )
            ) : (
              activeGroup && (
                <div className="space-y-5">
                  {activeGroup.fields.map((f) => (
                    <div key={f.key}>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-600 mb-1.5">
                        {f.label}
                      </label>
                      <FieldInput
                        field={f}
                        value={values[f.key] ?? f.default}
                        uploadPath={`site/${pageId}-${f.key}.jpg`}
                        onChange={(v) => handleChange(f.key, v)}
                      />
                    </div>
                  ))}
                </div>
              )
            )}
          </div>
        </aside>
      </div>

      {/* ── LIGHTBOX: vista previa de imágenes a pantalla completa ── */}
      {previewList && (
        <div
          className="fixed inset-0 z-[200] bg-black/85 flex items-center justify-center"
          onClick={() => setPreviewList(null)}
        >
          <button
            onClick={() => setPreviewList(null)}
            title="Cerrar"
            className="absolute top-4 right-4 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-2 transition-colors"
          >
            <X size={20} />
          </button>
          {previewList.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); setPreviewIndex((i) => Math.max(0, i - 1)); }}
                disabled={previewIndex === 0}
                title="Anterior"
                className="absolute left-4 text-white/80 hover:text-white disabled:opacity-25 bg-white/10 hover:bg-white/20 rounded-full p-2 transition-colors"
              >
                <ChevronLeft size={22} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setPreviewIndex((i) => Math.min(previewList.length - 1, i + 1)); }}
                disabled={previewIndex === previewList.length - 1}
                title="Siguiente"
                className="absolute right-4 text-white/80 hover:text-white disabled:opacity-25 bg-white/10 hover:bg-white/20 rounded-full p-2 transition-colors"
              >
                <ChevronRight size={22} />
              </button>
            </>
          )}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewList[previewIndex]}
            alt=""
            className="max-h-[86vh] max-w-[90vw] object-contain shadow-2xl rounded"
            onClick={(e) => e.stopPropagation()}
          />
          <span className="absolute bottom-5 left-1/2 -translate-x-1/2 text-white/70 text-xs font-bold tracking-[0.25em]">
            {previewIndex + 1} / {previewList.length}
          </span>
        </div>
      )}
    </div>
  );
}