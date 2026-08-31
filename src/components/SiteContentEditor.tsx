'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Save, CheckCircle, ChevronRight, ChevronDown, ChevronUp, Monitor, Tablet, Smartphone,
  LayoutTemplate, Palette, FileText, Loader2, ExternalLink, Upload, RotateCcw, X, Pointer,
  Undo2, Redo2, FileClock, Package, Search, ArrowLeft, Eye, EyeOff, Plus, Trash2, RefreshCw, Star, Copy,
  ChevronLeft, GripVertical, History as HistoryIcon, Sparkles, CheckCircle2,
  MousePointerClick, Edit3, SlidersHorizontal, Layers, Crop, Flame, Tag, ArrowLeftRight, Video,
  Heading1, Heading2, AlignLeft, AlignCenter, AlignRight, Bold as BoldIcon, Italic as ItalicIcon
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
  getSectionLayoutClient,
  saveSectionLayout,
  SectionLayout,
  fetchThemeFromRemote,
  saveCategoriesOrder,
  getCategoriesOrder,
  saveCatalogProductsOrder,
  getCatalogProductsOrder,
} from '@/lib/siteContent';
import { uploadProductImage, publishCatalogChange, fetchAllProductsAdmin, upsertProduct, deleteProductFromSupabase, logPriceChange } from '@/lib/supabase';
import { Product } from '@/types';
import { ImageCropperModal } from './ImageCropperModal';

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

interface RevisionEntry {
  id: string;
  timestamp: number;
  title: string;
  desc: string;
  values: ContentValues;
  theme: SiteTheme;
}

interface FieldInputProps {
  field: FieldDef;
  value: string;
  onChange: (value: string) => void;
  uploadPath: string;
  onOpenCropper?: (fileSrc: string, fieldKey: string) => void;
}

function FieldInput({ field, value, onChange, uploadPath, onOpenCropper }: FieldInputProps) {
  const [uploading, setUploading] = useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (onOpenCropper) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          onOpenCropper(String(ev.target.result), field.key);
        }
      };
      reader.readAsDataURL(file);
      e.target.value = '';
      return;
    }

    setUploading(true);
    try {
      const path = uploadPath || `content/${field.key}-${Date.now()}.jpg`;
      const res = await uploadProductImage(file, path);
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
          <div className="relative h-32 overflow-hidden rounded border border-neutral-200 bg-neutral-50 group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={value} alt="" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => onOpenCropper && onOpenCropper(value, field.key)}
              className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1.5 text-white text-xs font-bold transition-opacity"
            >
              <Crop size={14} /> Recortar foto
            </button>
            {uploading && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <Loader2 size={20} className="text-white animate-spin" />
              </div>
            )}
          </div>
        )}
        <label className="flex items-center justify-center gap-2 border border-dashed border-neutral-300 px-3 py-2.5 text-[11px] font-bold uppercase tracking-wider text-neutral-600 hover:border-[#d88193] hover:text-[#d88193] cursor-pointer rounded">
          <Upload size={13} /> {value ? 'Reemplazar con recorte' : 'Subir con recorte'}
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

  // ── Modo Edición In-line ──
  const [inlineEditEnabled, setInlineEditEnabled] = useState(true);

  // ── Reordenar / Ocultar Secciones ──
  const [sectionOrders, setSectionOrders] = useState<Record<string, string[]>>({});
  const [sectionHidden, setSectionHidden] = useState<Record<string, string[]>>({});

  // ── Breadcrumb ──
  const [activeSectionLabel, setActiveSectionLabel] = useState<string>('');

  // ── Historial de Revisiones ──
  const [showHistoryDrawer, setShowHistoryDrawer] = useState(false);
  const [revisions, setRevisions] = useState<RevisionEntry[]>([]);

  // ── Modal de Recorte de Imagen (Cropper) ──
  const [cropperModal, setCropperModal] = useState<{
    isOpen: boolean;
    imageSrc: string;
    targetFieldKey?: string;
    targetType?: 'field' | 'product_main' | 'product_gallery';
    slotIndex?: number;
    initialAspect?: number | null;
  }>({
    isOpen: false,
    imageSrc: '',
  });

  // ── Gestor de productos y Drag & Drop ──
  const [productsMode, setProductsMode] = useState(false);
  const [productViewMode, setProductViewMode] = useState<'grid' | 'reorder'>('grid');
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [productDraft, setProductDraft] = useState<Product | null>(null);
  const [isNewProduct, setIsNewProduct] = useState(false);
  const [savingProduct, setSavingProduct] = useState(false);
  const [productSaved, setProductSaved] = useState(false);
  const [uploadingSlot, setUploadingSlot] = useState<string | null>(null);
  const [newTagInput, setNewTagInput] = useState('');

  // Drag states for reordering
  const [draggedCatIdx, setDraggedCatIdx] = useState<number | null>(null);
  const [draggedProductIdx, setDraggedProductIdx] = useState<number | null>(null);

  // Lightbox preview
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

  // Guardas de carga/edición para no publicar datos vacíos ni pisar la nube
  const contentLoadedRef = useRef(false);
  const themeLoadedRef = useRef(false);
  const themeDirtyRef = useRef(false);
  const sectionLayoutLoadedRef = useRef(false);
  const sectionLayoutDirtyRef = useRef(false);
  const loadTokenRef = useRef(0);

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const wiredRef = useRef<{ doc: Document; onDbl: (e: Event) => void; onKey: (e: Event) => void } | null>(null);
  const pendingScrollRef = useRef<string | null>(null);

  const schema = PAGE_SCHEMAS.find((s) => s.id === pageId);
  const groups = schema ? groupFields(schema.fields) : [];
  const activeGroup = groups.find((g) => g.group === groupId) || groups[0];

  // Carga inicial de contenido (con guarda anti-carrera al cambiar de página)
  useEffect(() => {
    const token = ++loadTokenRef.current;
    contentLoadedRef.current = false;
    getPageContentClient(pageId).then((data) => {
      if (token !== loadTokenRef.current) return;
      setValues(data);
      contentLoadedRef.current = true;
    });
    fetchThemeFromRemote().then((t) => {
      if (t && token === loadTokenRef.current) {
        setTheme(t);
        themeLoadedRef.current = true;
      }
    });
  }, [pageId]);

  // Carga de orden de categorías y productos
  useEffect(() => {
    getCategoriesOrder().then(setCategoriesList);
  }, []);

  // ── Carga remota de orden/visibilidad de secciones ──
  useEffect(() => {
    let cancelled = false;
    sectionLayoutLoadedRef.current = false;
    getSectionLayoutClient().then((layout) => {
      if (cancelled) return;
      setSectionOrders(layout.orders);
      setSectionHidden(layout.hidden);
      sectionLayoutLoadedRef.current = true;
      sectionLayoutDirtyRef.current = false;
    });
    return () => { cancelled = true; };
  }, []);

  const persistSectionSettings = (orders: Record<string, string[]>, hidden: Record<string, string[]>) => {
    try {
      // Caché local para que el editor conserve el borrador si la conexión
      // falla. La publicación oficial se hace con saveSectionLayout().
      localStorage.setItem('ush_section_order', JSON.stringify(orders));
      localStorage.setItem('ush_section_hidden', JSON.stringify(hidden));
    } catch (_) {}
  };

  const currentSectionLayout = (): SectionLayout => ({
    orders: sectionOrders,
    hidden: sectionHidden,
  });

  const sectionIdsForPage = (pid: string): string[] => {
    return Object.entries(SECTION_MAP)
      .filter(([, m]) => m.pageId === pid)
      .map(([sec]) => sec);
  };

  const orderedSections = (pid: string): string[] => {
    const all = sectionIdsForPage(pid);
    const order = sectionOrders[pid] || [];
    if (order.length === 0) return all;
    const ordered = order.filter((s) => all.includes(s));
    const rest = all.filter((s) => !order.includes(s));
    return [...ordered, ...rest];
  };

  const isSectionHidden = (pid: string, sec: string): boolean => {
    return (sectionHidden[pid] || []).includes(sec);
  };

  const moveSectionUp = (pid: string, sec: string) => {
    const ordered = orderedSections(pid);
    const idx = ordered.indexOf(sec);
    if (idx <= 0) return;
    const next = [...ordered];
    const [m] = next.splice(idx, 1);
    next.splice(idx - 1, 0, m);
    setSectionOrders((o) => {
      const n = { ...o, [pid]: next };
      persistSectionSettings(n, sectionHidden);
      return n;
    });
    sectionLayoutDirtyRef.current = true;
    setDirty(true);
    setNonce((n) => n + 1);
  };

  const moveSectionDown = (pid: string, sec: string) => {
    const ordered = orderedSections(pid);
    const idx = ordered.indexOf(sec);
    if (idx < 0 || idx >= ordered.length - 1) return;
    const next = [...ordered];
    const [m] = next.splice(idx, 1);
    next.splice(idx + 1, 0, m);
    setSectionOrders((o) => {
      const n = { ...o, [pid]: next };
      persistSectionSettings(n, sectionHidden);
      return n;
    });
    sectionLayoutDirtyRef.current = true;
    setDirty(true);
    setNonce((n) => n + 1);
  };

  const toggleSectionVisible = (pid: string, sec: string) => {
    setSectionHidden((h) => {
      const cur = h[pid] || [];
      const next = {
        ...h,
        [pid]: cur.includes(sec) ? cur.filter((s) => s !== sec) : [...cur, sec],
      };
      persistSectionSettings(sectionOrders, next);
      return next;
    });
    sectionLayoutDirtyRef.current = true;
    setDirty(true);
    setNonce((n) => n + 1);
  };

  // Productos: carga, selección y guardado
  const loadProducts = async () => {
    setProductsLoading(true);
    try {
      const list = await fetchAllProductsAdmin();
      const customOrder = await getCatalogProductsOrder();
      if (customOrder && customOrder.length > 0) {
        const orderMap = new Map(customOrder.map((id, idx) => [id, idx]));
        list.sort((a, b) => {
          const aIdx = orderMap.get(a.id);
          const bIdx = orderMap.get(b.id);
          if (aIdx !== undefined && bIdx !== undefined) return aIdx - bIdx;
          if (aIdx !== undefined) return -1;
          if (bIdx !== undefined) return 1;
          return 0;
        });
      }
      setProducts(list);
    } catch (e) {}
    setProductsLoading(false);
  };

  useEffect(() => {
    if (productsMode) {
      loadProducts();
      setFitsList(readClassList(PRODUCT_FITS_KEY, DEFAULT_FITS));
    }
  }, [productsMode]);

  // ── Drag & Drop Categorías ──
  const handleCatDragStart = (idx: number) => {
    setDraggedCatIdx(idx);
  };

  const handleCatDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (draggedCatIdx === null || draggedCatIdx === idx) return;
    const reordered = [...categoriesList];
    const [moved] = reordered.splice(draggedCatIdx, 1);
    reordered.splice(idx, 0, moved);
    setDraggedCatIdx(idx);
    setCategoriesList(reordered);
  };

  const handleCatDragEnd = async () => {
    setDraggedCatIdx(null);
    await saveCategoriesOrder(categoriesList);
    publishCatalogChange();
    addRevision('Reordenamiento de Categorías', `Nuevo orden: ${categoriesList.join(', ')}`);
  };

  // ── Drag & Drop Productos (Reorder) ──
  const handleProductDragStart = (idx: number) => {
    setDraggedProductIdx(idx);
  };

  const handleProductDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (draggedProductIdx === null || draggedProductIdx === idx) return;
    const reordered = [...products];
    const [moved] = reordered.splice(draggedProductIdx, 1);
    reordered.splice(idx, 0, moved);
    setDraggedProductIdx(idx);
    setProducts(reordered);
  };

  const handleProductDragEnd = async () => {
    setDraggedProductIdx(null);
    const productIds = products.map((p) => p.id);
    await saveCatalogProductsOrder(productIds);
    publishCatalogChange();
    addRevision('Reordenamiento de Productos', `Reordenadas ${productIds.length} referencias en el catálogo`);
  };

  const addCategory = (name: string) => {
    const clean = name.trim();
    if (!clean || categoriesList.includes(clean)) return;
    const updated = [...categoriesList, clean];
    setCategoriesList(updated);
    saveCategoriesOrder(updated);
    publishCatalogChange();
  };

  const removeCategory = (cat: string) => {
    const updated = categoriesList.filter((c) => c !== cat);
    setCategoriesList(updated);
    saveCategoriesOrder(updated);
    publishCatalogChange();
  };

  const addFit = (name: string) => {
    const clean = name.trim();
    if (!clean || fitsList.includes(clean)) return;
    const updated = [...fitsList, clean];
    setFitsList(updated);
    try { localStorage.setItem(PRODUCT_FITS_KEY, JSON.stringify(updated)); } catch (_) {}
  };

  const removeFit = (fit: string) => {
    const updated = fitsList.filter((f) => f !== fit);
    setFitsList(updated);
    try { localStorage.setItem(PRODUCT_FITS_KEY, JSON.stringify(updated)); } catch (_) {}
  };

  const addRevision = (title: string, desc: string, snapshot?: { values: ContentValues; theme: SiteTheme }) => {
    // Snapshot explícito: por defecto el estado actual; al modificar un campo se
    // pasa el estado NUEVO para que "Revertir" restaure lo que la entrada describe.
    const snap = snapshot || { values, theme };
    const newEntry: RevisionEntry = {
      id: String(Date.now()),
      timestamp: Date.now(),
      title,
      desc,
      values: { ...snap.values },
      theme: { ...snap.theme },
    };
    setRevisions((prev) => [newEntry, ...prev.slice(0, 49)]);
  };

  const restoreRevision = (rev: RevisionEntry) => {
    setPast((p) => [...p.slice(-49), { values, theme }]);
    setValues(rev.values);
    setTheme(rev.theme);
    setDirty(true);
    setShowHistoryDrawer(false);
    flushDraft();
  };

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
    setIsNewProduct(true);
  };

  const handleDeleteProduct = async () => {
    if (!productDraft) return;
    if (!window.confirm(`¿Eliminar la referencia ${productDraft.reference} (${productDraft.name})?`)) return;
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

  const handleDuplicateProduct = () => {
    if (!productDraft) return;
    const num = String(Math.floor(100000 + Math.random() * 900000));
    const clone: Product = JSON.parse(JSON.stringify(productDraft));
    clone.id = `ref-${num}`;
    clone.reference = num;
    clone.slug = `ref-${num}`;
    clone.name = `${productDraft.name} (copia)`;
    openProduct(clone);
    setIsNewProduct(true);
  };

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
    setIsNewProduct(false);
  };

  const closeProduct = () => {
    setSelectedId(null);
    setProductDraft(null);
    setIsNewProduct(false);
  };

  const patchDraft = (patch: Partial<Product>) => {
    setProductDraft((d) => (d ? { ...d, ...patch } : d));
  };

  const handleSaveProduct = async () => {
    if (!productDraft) return;
    setSavingProduct(true);
    const previous = products.find((p) => p.id === productDraft.id);
    const res = await upsertProduct(productDraft);
    setSavingProduct(false);
    if (!res.success) {
      alert('No se pudo guardar el producto: ' + (res.error || 'error'));
      return;
    }
    // Auditoría de precios: registra el cambio en price_history cuando aplica
    if (previous) {
      const oldW = Number(previous.price) || 0;
      const newW = Number(productDraft.price) || 0;
      const oldS = Number(previous.suggested_price) || 0;
      const newS = Number(productDraft.suggested_price) || 0;
      if (oldW !== newW || oldS !== newS) {
        logPriceChange({
          product_id: productDraft.id,
          product_name: productDraft.name,
          old_wholesale_price: oldW,
          new_wholesale_price: newW,
          old_suggested_price: oldS,
          new_suggested_price: newS,
        }).catch(() => {});
      }
    }
    setProductSaved(true);
    publishCatalogChange();
    loadProducts();
    setTimeout(() => setProductSaved(false), 3000);
  };

  // ── Manejo de Fotos: Poner como portada, reordenar y recortar ──
  const setAsMainPhoto = (galleryIdx: number) => {
    if (!productDraft || !productDraft.images) return;
    const current = [...productDraft.images];
    const [chosen] = current.splice(galleryIdx, 1);
    current.unshift(chosen); // Coloca la foto seleccionada en la posición 0 (portada)
    patchDraft({ images: current });
    addRevision('Foto de portada actualizada', `Nueva foto principal para REF. ${productDraft.reference}`);
  };

  const movePhotoInGallery = (fromIdx: number, toIdx: number) => {
    if (!productDraft || !productDraft.images) return;
    if (toIdx < 0 || toIdx >= productDraft.images.length) return;
    const current = [...productDraft.images];
    const [item] = current.splice(fromIdx, 1);
    current.splice(toIdx, 0, item);
    patchDraft({ images: current });
  };

  // ── Manejo de Tags / Etiquetas ──
  const addTag = (tagText: string) => {
    if (!productDraft) return;
    const clean = tagText.trim().toLowerCase();
    if (!clean) return;
    const currentTags = productDraft.tags || [];
    if (currentTags.includes(clean)) return;
    patchDraft({ tags: [...currentTags, clean] });
    setNewTagInput('');
  };

  const removeTag = (tagToRemove: string) => {
    if (!productDraft) return;
    const currentTags = productDraft.tags || [];
    patchDraft({ tags: currentTags.filter((t) => t !== tagToRemove) });
  };

  // Image Cropping Handlers
  const handleOpenCropperForField = (fileSrc: string, fieldKey: string) => {
    setCropperModal({
      isOpen: true,
      imageSrc: fileSrc,
      targetFieldKey: fieldKey,
      targetType: 'field',
      initialAspect: 16 / 9,
    });
  };

  const handleOpenCropperForProductMain = (file: File) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (ev.target?.result) {
        setCropperModal({
          isOpen: true,
          imageSrc: String(ev.target.result),
          targetType: 'product_main',
          initialAspect: 3 / 4, // standard 3:4 for jeans portrait
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleOpenCropperForProductGallery = (file: File, index: number) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (ev.target?.result) {
        setCropperModal({
          isOpen: true,
          imageSrc: String(ev.target.result),
          targetType: 'product_gallery',
          slotIndex: index,
          initialAspect: 3 / 4,
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCropComplete = async (croppedBlob: Blob, croppedDataUrl: string) => {
    if (cropperModal.targetType === 'field' && cropperModal.targetFieldKey) {
      const fieldKey = cropperModal.targetFieldKey;
      const path = `content/${fieldKey}-${Date.now()}.jpg`;
      const res = await uploadProductImage(croppedBlob, path);
      if (res.success && res.url) {
        handleChange(fieldKey, res.url);
      }
    } else if (cropperModal.targetType === 'product_main' && productDraft) {
      setUploadingSlot('main');
      const path = `products/prod-${productDraft.reference || productDraft.id}-${Date.now()}-main.jpg`;
      const res = await uploadProductImage(croppedBlob, path);
      setUploadingSlot(null);
      if (res.success && res.url) {
        const others = (productDraft.images || []).slice(1);
        patchDraft({ images: [res.url, ...others] });
      }
    } else if (cropperModal.targetType === 'product_gallery' && productDraft) {
      const idx = cropperModal.slotIndex ?? 1;
      setUploadingSlot(String(idx));
      const path = `products/prod-${productDraft.reference || productDraft.id}-${Date.now()}-gal-${idx}.jpg`;
      const res = await uploadProductImage(croppedBlob, path);
      setUploadingSlot(null);
      if (res.success && res.url) {
        const current = [...(productDraft.images || [])];
        current[idx] = res.url;
        patchDraft({ images: current });
      }
    }
  };

  // Sync state changes with localStorage & debounce live preview
  useEffect(() => {
    if (!dirty || mode !== 'content') return;
    const timer = setTimeout(() => {
      try {
        localStorage.setItem('ush_content_' + pageId, JSON.stringify(values));
      } catch (e) {}
      window.dispatchEvent(new Event(CONTENT_EVENT));
    }, 250);
    return () => clearTimeout(timer);
  }, [values, dirty, pageId, mode]);

  useEffect(() => {
    if (!dirty || mode !== 'theme') return;
    const timer = setTimeout(() => {
      try {
        localStorage.setItem('ush_theme_cache', JSON.stringify(theme));
      } catch (e) {}
      window.dispatchEvent(new Event(THEME_EVENT));
    }, 200);
    return () => clearTimeout(timer);
  }, [theme, dirty, mode]);

  const handleChange = (key: string, val: string) => {
    setPast((p) => [...p.slice(-49), { values, theme }]);
    setFuture([]);
    const newValues = { ...values, [key]: val };
    setValues(newValues);
    setDirty(true);
    setSaved(false);
    addRevision(`Modificado campo "${key}"`, val.slice(0, 40), { values: newValues, theme });
  };

  const handleThemeChange = (key: keyof SiteTheme, val: string) => {
    setPast((p) => [...p.slice(-49), { values, theme }]);
    setFuture([]);
    const newTheme = { ...theme, [key]: val };
    setTheme(newTheme);
    themeDirtyRef.current = true;
    setDirty(true);
    setSaved(false);
    addRevision(`Color del tema "${key}"`, val, { values, theme: newTheme });
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

  const flushDraft = async () => {
    try { localStorage.setItem('ush_content_' + pageId, JSON.stringify(values)); } catch (e) {}
    try { localStorage.setItem('ush_theme_cache', JSON.stringify(theme)); } catch (e) {}
    window.dispatchEvent(new Event(CONTENT_EVENT));
    window.dispatchEvent(new Event(THEME_EVENT));
    setDraftSaved(true);
    setTimeout(() => setDraftSaved(false), 2500);
    // Persistencia real en la nube: "Guardar" antes solo escribía el borrador
    // local y los cambios (p. ej. videos) nunca llegaban al sitio público.
    const cloudSaves: Promise<{ success: boolean; error?: string }>[] = [];
    if (contentLoadedRef.current && pageId) {
      cloudSaves.push(savePageContent(pageId, values));
    }
    if ((themeLoadedRef.current || themeDirtyRef.current) && contentLoadedRef.current) {
      cloudSaves.push(saveTheme(theme));
    }
    if (sectionLayoutLoadedRef.current && sectionLayoutDirtyRef.current) {
      cloudSaves.push(saveSectionLayout(currentSectionLayout()));
    }
    if (cloudSaves.length > 0) {
      try {
        const results = await Promise.all(cloudSaves);
        if (results.every((r) => r.success)) {
          sectionLayoutDirtyRef.current = false;
          // Sincroniza el cambio guardado con otras pestañas/dispositivos.
          publishCatalogChange();
        } else {
          results.filter((r) => !r.success).forEach((r) => console.error('save content:', r.error));
        }
      } catch (error) {
        console.error('save content:', error);
      }
    }
  };
  flushRef.current = flushDraft;

  // Keyboard shortcuts
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
    // No publicar antes de que el contenido de la página activa haya cargado:
    // evitaría pisar la nube con valores por defecto.
    if (!contentLoadedRef.current) {
      alert('El contenido aún se está cargando. Espera un momento e inténtalo de nuevo.');
      return;
    }
    setSaving(true);
    // Publica SIEMPRE ambos modos: antes, publicar en "Páginas" descartaba
    // cambios de tema pendientes (y viceversa) al compartir el flag dirty.
    const [resContent, resTheme] = await Promise.all([
      savePageContent(pageId, values),
      (themeLoadedRef.current || themeDirtyRef.current)
        ? saveTheme(theme)
        : Promise.resolve({ success: true } as { success: boolean; error?: string }),
    ]);
    const resLayout = sectionLayoutLoadedRef.current
      ? await saveSectionLayout(currentSectionLayout())
      : { success: false, error: 'La estructura de secciones aún se está cargando' };
    setSaving(false);
    const res = resContent.success && resTheme.success && resLayout.success
      ? { success: true }
      : { success: false, error: resContent.error || resTheme.error || resLayout.error };
    if (res.success) {
      setSaved(true);
      setDirty(false);
      themeDirtyRef.current = false;
      sectionLayoutDirtyRef.current = false;
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
    setDirty(sectionLayoutDirtyRef.current);
    setSaved(false);
    setProductsMode(false);
    closeProduct();
  };

  const selectSection = (sectionId: string) => {
    const m = SECTION_MAP[sectionId];
    if (!m) return;
    setMode('content');
    setPageId(m.pageId);
    setGroupId(m.group);
  };

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

  useEffect(() => {
    const sec = sectionForGroup(pageId, activeGroup?.group || '');
    pendingScrollRef.current = sec;
    scrollPreviewToSection(sec);
  }, [groupId, pageId]);

  // Conecta el iframe del preview con modo in-line interactivo
  const wireFrame = () => {
    const frame = iframeRef.current;
    const doc = frame?.contentDocument;
    if (!doc || !frame) return;

    let style = doc.getElementById('ush-editor-style') as HTMLStyleElement | null;
    if (!style) {
      style = doc.createElement('style');
      style.id = 'ush-editor-style';
      style.textContent = `
        [data-editor-section] { cursor: pointer; transition: outline 0.2s ease; }
        [data-editor-section]:hover { outline: 2px dashed #d88193; outline-offset: 2px; }
        [data-field-key] { cursor: text !important; }
        [data-field-key]:hover { outline: 1px dashed #10b981 !important; outline-offset: 1px !important; }
        [contenteditable="true"] { outline: 2px solid #10b981 !important; outline-offset: 3px !important; background: rgba(255,255,255,0.85) !important; color: #1b2333 !important; border-radius: 4px; padding: 2px 4px; }
      `;
      doc.head.appendChild(style);
    }

    const EDITABLE_TAGS = ['H1','H2','H3','H4','H5','H6','P','SPAN','A','BUTTON','LI','DIV','STRONG','EM','B','I','SMALL','LABEL','TD','TH','FIGCAPTION','CITE','Q'];

    // Aplica orden y visibilidad de secciones guardadas
    const applySectionLayout = () => {
      const sections = Array.from(doc.querySelectorAll<HTMLElement>('[data-editor-section]'));
      // 1) Ocultar secciones marcadas
      sections.forEach((el) => {
        const sec = el.getAttribute('data-editor-section') || '';
        const hidden = isSectionHidden(pageId, sec);
        el.style.display = hidden ? 'none' : '';
        el.setAttribute('data-hidden', hidden ? '1' : '');

        // Estilos avanzados por sección (#8 fondo, #9 tipografía, #10 espaciado)
        const bg = values[`__sec_${sec}_bg`];
        const padTop = values[`__sec_${sec}_padTop`];
        const padBottom = values[`__sec_${sec}_padBottom`];
        const fontSize = values[`__sec_${sec}_fontSize`];
        if (bg) el.style.backgroundColor = bg;
        if (padTop) el.style.paddingTop = `${padTop}px`;
        if (padBottom) el.style.paddingBottom = `${padBottom}px`;
        if (fontSize) el.style.fontSize = `${fontSize}px`;

        // Texto con alineación por sección
        const align = values[`__sec_${sec}_align`];
        if (align) el.style.textAlign = align;
      });
      // 2) Reordenar por orden personalizado guardado
      const order = orderedSections(pageId);
      if (order.length > 1) {
        const rank = new Map(order.map((id, index) => [id, index]));
        const byParent = new Map<HTMLElement, HTMLElement[]>();
        sections.filter((el) => rank.has(el.getAttribute('data-editor-section') || '')).forEach((el) => {
          const parent = el.parentElement;
          if (!parent) return;
          byParent.set(parent, [...(byParent.get(parent) || []), el]);
        });
        byParent.forEach((siblings) => {
          const sorted = [...siblings].sort((a, b) =>
            (rank.get(a.getAttribute('data-editor-section') || '') ?? 0)
            - (rank.get(b.getAttribute('data-editor-section') || '') ?? 0)
          );
          const children = Array.from(siblings[0].parentElement?.children || []) as HTMLElement[];
          const slots = children.filter((child) => siblings.includes(child));
          const replacement = new Map(slots.map((slot, index) => [slot, sorted[index]]));
          children.forEach((child) => child.parentElement?.appendChild(replacement.get(child) || child));
        });
      }
    };
    applySectionLayout();

    // ── Toolbar flotante de formato de texto ──
    const createToolbar = (): HTMLElement => {
      let tb = doc.getElementById('ush-format-toolbar') as HTMLElement | null;
      if (!tb) {
        tb = doc.createElement('div');
        tb.id = 'ush-format-toolbar';
        tb.style.cssText = 'position:fixed;z-index:99999;display:none;background:#1b2333;color:#fff;border-radius:8px;box-shadow:0 8px 24px rgba(0,0,0,.25);padding:4px 6px;gap:2px;font:11px/1 -apple-system,sans-serif;align-items:center;';
        const btns: [string, string, string][] = [
          ['B', 'bold', 'Negrita'],
          ['I', 'italic', 'Cursiva'],
          ['S', 'strikeThrough', 'Tachado'],
          ['H1', 'formatBlock', 'Título 1'],
          ['H2', 'formatBlock', 'Título 2'],
          ['P', 'formatBlock', 'Párrafo'],
          ['⟷', 'justifyLeft', 'Izquierda'],
          ['⟵⟶', 'justifyCenter', 'Centro'],
          ['⟶⟵', 'justifyRight', 'Derecha'],
        ];
        btns.forEach(([label, cmd, tip]) => {
          const b = doc.createElement('button');
          b.textContent = label;
          b.title = tip;
          b.style.cssText = 'background:transparent;border:0;color:#fff;font-weight:700;padding:3px 6px;border-radius:4px;cursor:pointer;';
          b.onmouseenter = () => (b.style.background = 'rgba(255,255,255,.15)');
          b.onmouseleave = () => (b.style.background = 'transparent');
          b.addEventListener('mousedown', (ev) => {
            ev.preventDefault();
            doc.execCommand(cmd as any, false, cmd === 'formatBlock' ? (label === 'H1' ? 'H1' : label === 'H2' ? 'H2' : 'P') : undefined);
          });
          tb!.appendChild(b);
        });
        const fsize = doc.createElement('input');
        fsize.type = 'number';
        (fsize as any).min = 12;
        (fsize as any).max = 60;
        fsize.value = '16';
        fsize.title = 'Tamaño de fuente';
        fsize.style.cssText = 'width:44px;background:#fff;color:#1b2333;border:0;border-radius:4px;padding:2px 4px;font-size:11px;';
        fsize.addEventListener('change', () => {
          doc.execCommand('fontSize', false, '7');
          const sels = doc.getSelection();
          if (sels && sels.rangeCount) {
            const span = sels.getRangeAt(0).commonAncestorContainer.parentElement;
            if (span) (span as HTMLElement).style.fontSize = `${fsize.value}px`;
          }
        });
        tb.appendChild(fsize);
        doc.body.appendChild(tb);
      }
      return tb;
    };
    const toolbar = createToolbar();

    const positionToolbar = (target: HTMLElement) => {
      const rect = target.getBoundingClientRect();
      toolbar.style.display = 'flex';
      toolbar.style.top = `${Math.max(rect.top - 40, 8)}px`;
      toolbar.style.left = `${Math.min(Math.max(rect.left + rect.width / 2 - 120, 4), (doc.defaultView?.innerWidth || 800) - 250)}px`;
    };

    // ── Click en imágenes: permite enfocar inspector de imagen ──
    const openImageForField = (img: HTMLElement) => {
      const fieldKeyEl = img.closest('[data-field-key]') as HTMLElement | null;
      const sectionEl = img.closest('[data-editor-section]') as HTMLElement | null;
      if (sectionEl) selectSection(sectionEl.getAttribute('data-editor-section') || '');
      if (fieldKeyEl) {
        const fk = fieldKeyEl.getAttribute('data-field-key');
        if (fk) {
          const map = (window as any).__ushFieldScroll as Record<string, string> | undefined;
          void map;
          const schemaF = PAGE_SCHEMAS.find((s) => s.id === pageId)?.fields.find((f) => f.key === fk);
          if (schemaF && schemaF.type === 'image') {
            // Enfocar el inspector
            groupId && setGroupId(groupId);
            document.getElementById(`field-${fk}`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }
        }
      }
    };

    const onClickOrDbl = (e: Event) => {
      const target = e.target as HTMLElement;
      const sectionEl = target?.closest?.('[data-editor-section]') as HTMLElement | null;
      if (!sectionEl) return;

      const secId = sectionEl.getAttribute('data-editor-section') || '';
      const secMap = SECTION_MAP[secId];
      setActiveSectionLabel(secMap ? secMap.group : secId);
      selectSection(secId);

      // Click en imagen → resaltar campo de imagen en inspector
      if (target.tagName === 'IMG') {
        openImageForField(target);
        return;
      }

      if (!inlineEditEnabled) return;
      if (!EDITABLE_TAGS.includes(target.tagName)) return;
      if (target.contentEditable === 'true') return;

      let fieldKey = target.getAttribute('data-field-key')
        || (target.closest('[data-field-key]') as HTMLElement | null)?.getAttribute('data-field-key');

      if (!fieldKey) return;

      const origText = target.innerText.trim();
      target.setAttribute('data-original-val', origText);
      target.setAttribute('data-field-key-resolved', fieldKey);
      target.contentEditable = 'true';
      target.focus();
      positionToolbar(target);

      const selectAll = () => {
        const range = doc.createRange();
        range.selectNodeContents(target);
        const sel = doc.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(range);
        target.removeEventListener('focus', selectAll);
      };
      target.addEventListener('focus', selectAll);

      const onBlur = () => {
        target.contentEditable = 'false';
        const newText = target.innerText.trim();
        const resolvedKey = target.getAttribute('data-field-key-resolved');
        target.removeAttribute('data-field-key-resolved');
        if (resolvedKey && newText !== origText) {
          handleChange(resolvedKey, newText);
        }
        target.removeEventListener('blur', onBlur);
        toolbar.style.display = 'none';
      };
      target.addEventListener('blur', onBlur);
    };

    doc.addEventListener('click', onClickOrDbl, true);
    doc.addEventListener('dblclick', onClickOrDbl, true);

    if (pendingScrollRef.current) {
      scrollPreviewToSection(pendingScrollRef.current);
    }
  };

  const previewRoute = PAGE_ROUTES[pageId] || '/';
  const iframeSrc = `${previewRoute}${previewRoute.includes('?') ? '&' : '?'}editor=${nonce}`;

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
          {/* In-Line Editing Toggle */}
          <button
            onClick={() => setInlineEditEnabled((v) => !v)}
            className={`hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-wider transition-colors ${
              inlineEditEnabled ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40' : 'bg-white/5 text-neutral-400'
            }`}
            title="Haz clic directo sobre textos o imágenes en el sitio real para editarlos"
          >
            <MousePointerClick size={12} className={inlineEditEnabled ? 'text-emerald-400' : ''} />
            {inlineEditEnabled ? 'Edición In-Line: Activa' : 'Edición In-Line: Inactiva'}
          </button>

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
            className="p-2 text-neutral-300 hover:text-white hover:bg-white/10 rounded-md disabled:opacity-30"
          >
            <Undo2 size={14} />
          </button>
          <button
            onClick={handleRedo}
            disabled={future.length === 0}
            title="Rehacer (Ctrl+Shift+Z)"
            className="p-2 text-neutral-300 hover:text-white hover:bg-white/10 rounded-md disabled:opacity-30"
          >
            <Redo2 size={14} />
          </button>

          {/* Change History Drawer Trigger */}
          <button
            onClick={() => setShowHistoryDrawer((v) => !v)}
            title="Ver historial de revisiones"
            className={`p-2 rounded-md transition-colors ${showHistoryDrawer ? 'bg-[#d88193] text-white' : 'text-neutral-300 hover:bg-white/10'}`}
          >
            <HistoryIcon size={14} />
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
            {dirty ? (
              <span className="hidden md:flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-amber-300">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                Borrador sin publicar
              </span>
            ) : (
              <span className="hidden md:flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                <CheckCircle size={12} /> Publicado en vivo
              </span>
            )}

            <button
              onClick={flushDraft}
              title="Guardar en la nube y en este navegador (Ctrl+S)"
              className="hidden sm:flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white text-[11px] font-black uppercase tracking-widest px-4 py-2.5 rounded shadow"
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
              Publicar Cambios
            </button>
          </div>
        </div>
      </div>

      {/* ── Body: Left Sidebar / Canvas / Right Inspector ── */}
      <div className="flex flex-1 min-h-0 relative">
        {/* Left: Pages + Categories manager */}
        <aside className="w-56 bg-[#121824] text-white flex flex-col flex-shrink-0 min-h-0 border-r border-black/20">
          <div className="p-2 border-b border-white/5 grid grid-cols-2 gap-1">
            <button
              onClick={() => { setMode('content'); setProductsMode(false); closeProduct(); }}
              className={`flex items-center justify-center gap-1.5 py-2 text-[10px] font-black uppercase tracking-wider rounded transition-all ${
                mode === 'content' ? 'bg-[#d88193] text-white shadow-sm' : 'text-neutral-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <FileText size={12} /> Páginas
            </button>
            <button
              onClick={() => { setMode('theme'); setProductsMode(false); closeProduct(); setDirty(sectionLayoutDirtyRef.current); setSaved(false); }}
              className={`flex items-center justify-center gap-1.5 py-2 text-[10px] font-black uppercase tracking-wider rounded transition-all ${
                mode === 'theme' ? 'bg-[#d88193] text-white shadow-sm' : 'text-neutral-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Palette size={12} /> Diseño Global
            </button>
          </div>

          <div className="flex-1 overflow-y-auto py-2">
            {mode === 'content' ? (
              PAGE_SCHEMAS.map((s) => {
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
                        {sGroups.map((g) => {
                          const sec = sectionForGroup(s.id, g.group);
                          const secHidden = sec ? isSectionHidden(s.id, sec) : false;
                          return (
                            <div key={g.group} className="group flex items-center">
                              <button
                                onClick={() => { setGroupId(g.group); setProductsMode(false); closeProduct(); }}
                                className={`flex-1 text-left px-3 py-1.5 text-[10px] font-semibold tracking-wide rounded-l ${
                                  !productsMode && activeGroup?.group === g.group
                                    ? (secHidden ? 'bg-[#d88193]/20 text-[#f9c9d2] line-through opacity-60' : 'bg-[#d88193]/20 text-[#f9c9d2]')
                                    : (secHidden ? 'text-neutral-600 line-through' : 'text-neutral-500 hover:text-white')
                                }`}
                              >
                                <span className="flex items-center gap-1.5">
                                  {g.group}
                                  {secHidden && <EyeOff size={9} className="text-neutral-500" />}
                                </span>
                              </button>
                              {sec && (
                                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity pr-1">
                                  <button
                                    onClick={() => moveSectionUp(s.id, sec)}
                                    title="Mover sección arriba"
                                    className="p-0.5 text-neutral-500 hover:text-white"
                                  >
                                    <ChevronUp size={11} />
                                  </button>
                                  <button
                                    onClick={() => moveSectionDown(s.id, sec)}
                                    title="Mover sección abajo"
                                    className="p-0.5 text-neutral-500 hover:text-white"
                                  >
                                    <ChevronDown size={11} />
                                  </button>
                                  <button
                                    onClick={() => toggleSectionVisible(s.id, sec)}
                                    title={secHidden ? 'Mostrar sección' : 'Ocultar sección'}
                                    className={`p-0.5 ${secHidden ? 'text-amber-400' : 'text-neutral-500 hover:text-amber-300'}`}
                                  >
                                    {secHidden ? <Eye size={11} /> : <EyeOff size={11} />}
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })}

                        {/* Gestor de productos: solo en la página Catálogo */}
                        {s.id === 'catalogo' && (
                          <button
                            onClick={() => { setMode('content'); setProductsMode(true); }}
                            className={`w-full flex items-center gap-1.5 px-3 py-1.5 mt-1 text-[10px] font-bold uppercase tracking-wider rounded-l ${
                              productsMode ? 'bg-[#d88193] text-white' : 'text-neutral-400 hover:text-white hover:bg-white/5'
                            }`}
                          >
                            <Package size={11} /> Catálogo de Prendas
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="p-4 space-y-3">
                <button
                  onClick={() => setMode('content')}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-white/10 hover:bg-white/15 text-white text-[11px] font-black uppercase tracking-wider rounded-lg transition-colors"
                >
                  <ArrowLeft size={13} /> Volver a Páginas
                </button>
                <div className="p-3 bg-white/5 rounded-lg border border-white/5 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-white">
                    <Sparkles size={14} className="text-[#d88193]" />
                    Estilos Globales del Sitio
                  </div>
                  <p className="text-[10px] text-neutral-400 leading-relaxed">
                    Edita tipografías de Google Fonts, estilos de botones redondeados, colores de marca y franja superior en el panel lateral derecho.
                  </p>
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* Center: Canvas or Products Workspace */}
        {productsMode ? (
          <div className="flex-1 min-w-0 bg-[#eef0f3] overflow-auto">
            {selectedId && productDraft ? (
              /* ── VISUAL PRODUCT EDITOR ── */
              <div className="max-w-5xl mx-auto p-6 space-y-4">
                <div className="flex items-center justify-between bg-white px-4 py-3 rounded-xl border border-neutral-200 shadow-sm">
                  <button
                    onClick={closeProduct}
                    className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[#1b2333] hover:text-[#d88193] transition-colors"
                  >
                    <ArrowLeft size={16} /> Volver al listado de prendas
                  </button>
                  <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">
                    Editando: {productDraft.name || `Ref. #${productDraft.reference}`}
                  </span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                {/* Photos */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">Fotos del Producto</p>
                    <span className="text-[10px] text-neutral-400 font-bold">Proporción 3:4 Jeans</span>
                  </div>

                  {/* Main Cover Photo */}
                  <div className="relative group/main bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden aspect-[3/4] max-h-[460px] w-full">
                    {productDraft.images?.[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={productDraft.images[0]} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <label className="absolute inset-0 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-neutral-50 transition-colors">
                        <Upload size={26} className="text-neutral-300" />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Subir foto con recorte</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) handleOpenCropperForProductMain(f);
                            e.target.value = '';
                          }}
                        />
                      </label>
                    )}

                    {productDraft.images?.[0] && (
                      <div className="absolute top-2 left-2 bg-[#1b2333]/90 text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded shadow flex items-center gap-1">
                        <Star size={10} className="text-amber-400 fill-amber-400" /> Foto Principal (Portada)
                      </div>
                    )}

                    {productDraft.images?.[0] && (
                      <button
                        onClick={() => openPreview(productDraft.images || [], 0)}
                        title="Ver imagen grande"
                        className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover/main:bg-black/35 transition-all cursor-zoom-in"
                      >
                        <span className="opacity-0 group-hover/main:opacity-100 transition-opacity bg-white/95 rounded-full p-3 shadow-lg text-[#1b2333]">
                          <Eye size={20} />
                        </span>
                      </button>
                    )}

                    {productDraft.images?.[0] && (
                      <label className="absolute bottom-3 right-3 bg-white/95 shadow px-3 py-1.5 text-[9px] font-black uppercase tracking-wider text-neutral-600 hover:text-[#d88193] cursor-pointer rounded flex items-center gap-1 z-10">
                        <Crop size={10} /> Cambiar / Recortar
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) handleOpenCropperForProductMain(f);
                            e.target.value = '';
                          }}
                        />
                      </label>
                    )}
                    {uploadingSlot === 'main' && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <Loader2 size={22} className="text-white animate-spin" />
                      </div>
                    )}
                  </div>

                  <input
                    type="url"
                    value={productDraft.images?.[0] || ''}
                    onChange={(e) => patchDraft({ images: [e.target.value, ...(productDraft.images || []).slice(1)] })}
                    placeholder="URL de la foto principal"
                    className="w-full border border-neutral-200 px-3 py-2 text-[11px] font-mono focus:outline-none focus:border-[#d88193] rounded bg-white"
                  />

                  {/* Gallery thumbnails with "Poner como principal" and reordering */}
                  {(productDraft.images || []).length > 1 && (
                    <div className="space-y-1.5">
                      <p className="text-[9px] font-black uppercase tracking-widest text-neutral-400">
                        Galería ({productDraft.images.length - 1} fotos adicionales)
                      </p>
                      <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                        {(productDraft.images || []).slice(1).map((img, i) => {
                          const realIdx = i + 1;
                          return (
                            <div key={i} className="relative aspect-[3/4] bg-white rounded-lg overflow-hidden border border-neutral-200 shadow-sm group/thumb">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={img} alt="" className="w-full h-full object-cover" />

                              {/* Overlay actions */}
                              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex flex-col justify-between p-1.5 z-10">
                                <div className="flex items-center justify-between">
                                  <button
                                    onClick={() => setAsMainPhoto(realIdx)}
                                    title="⭐ Poner de primera como foto principal"
                                    className="bg-amber-400 text-neutral-900 rounded p-1 hover:bg-amber-300 transition-colors"
                                  >
                                    <Star size={11} className="fill-neutral-900" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      const f = (productDraft.images || []).filter((_, idx) => idx !== realIdx);
                                      patchDraft({ images: f });
                                    }}
                                    title="Eliminar foto"
                                    className="bg-red-500 text-white rounded p-1 hover:bg-red-600 transition-colors"
                                  >
                                    <Trash2 size={11} />
                                  </button>
                                </div>

                                <div className="flex items-center justify-center gap-1">
                                  <button
                                    onClick={() => openPreview(productDraft.images || [], realIdx)}
                                    title="Ver grande"
                                    className="bg-white/90 text-neutral-800 rounded p-1 hover:bg-white"
                                  >
                                    <Eye size={11} />
                                  </button>
                                  <button
                                    onClick={() => movePhotoInGallery(realIdx, realIdx - 1)}
                                    disabled={realIdx <= 1}
                                    title="Mover a la izquierda"
                                    className="bg-white/90 text-neutral-800 rounded p-1 hover:bg-white disabled:opacity-30"
                                  >
                                    <ChevronLeft size={11} />
                                  </button>
                                  <button
                                    onClick={() => movePhotoInGallery(realIdx, realIdx + 1)}
                                    disabled={realIdx >= (productDraft.images || []).length - 1}
                                    title="Mover a la derecha"
                                    className="bg-white/90 text-neutral-800 rounded p-1 hover:bg-white disabled:opacity-30"
                                  >
                                    <ChevronRight size={11} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <label className="w-full flex items-center justify-center gap-1.5 border border-dashed border-neutral-300 py-2.5 text-[10px] font-black uppercase tracking-wider text-neutral-500 hover:border-[#d88193] hover:text-[#d88193] rounded-lg bg-white cursor-pointer transition-colors">
                    <Plus size={12} /> Agregar otra foto con recorte (3:4)
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleOpenCropperForProductGallery(f, (productDraft.images || []).length);
                        e.target.value = '';
                      }}
                    />
                  </label>
                </div>

                {/* Details Form (Wix Style) */}
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
                      {productDraft.ribbon && (
                        <span className="bg-rose-50 text-ush-pink text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded">
                          {productDraft.ribbon}
                        </span>
                      )}
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
                      rows={6}
                      className="w-full border border-neutral-200 px-3 py-2.5 text-xs leading-relaxed focus:outline-none focus:border-[#d88193] rounded resize-y"
                    />
                  </div>

                  {productSaved && (
                    <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 flex items-center gap-1">
                      <CheckCircle size={12} /> Guardado y publicado en vivo
                    </p>
                  )}
                </div>
                </div>
              </div>
            ) : (
              /* ── PRODUCTS LIST / DRAG & DROP REORDER ── */
              <div className="p-6">
                <div className="mb-4 flex items-center justify-between">
                  <button
                    onClick={() => { setProductsMode(false); }}
                    className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-neutral-700 hover:text-[#d88193] bg-white px-3.5 py-2 rounded-lg border border-neutral-200 shadow-sm transition-colors"
                  >
                    <ArrowLeft size={14} /> Volver a edición de páginas
                  </button>
                  <span className="text-[11px] font-black uppercase tracking-widest text-neutral-400">
                    Catálogo de Prendas ({products.length} referencias)
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                  <div className="relative flex-1 max-w-md">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                    <input
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      placeholder="Buscar por nombre o referencia…"
                      className="w-full bg-white border border-neutral-200 shadow-sm pl-9 pr-3 py-2.5 text-xs focus:outline-none focus:border-[#d88193] rounded-lg"
                    />
                  </div>

                  {/* Mode switcher: Grid vs Drag & Drop Reorder */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center bg-white border border-neutral-200 rounded-lg p-1">
                      <button
                        onClick={() => setProductViewMode('grid')}
                        className={`px-3 py-1.5 text-[10px] font-black uppercase rounded ${
                          productViewMode === 'grid' ? 'bg-[#1b2333] text-white' : 'text-neutral-600 hover:bg-neutral-50'
                        }`}
                      >
                        Cuadrícula
                      </button>
                      <button
                        onClick={() => setProductViewMode('reorder')}
                        className={`px-3 py-1.5 text-[10px] font-black uppercase rounded flex items-center gap-1 ${
                          productViewMode === 'reorder' ? 'bg-[#d88193] text-white' : 'text-neutral-600 hover:bg-neutral-50'
                        }`}
                      >
                        <GripVertical size={12} /> Reordenar (Drag & Drop)
                      </button>
                    </div>

                    <button
                      onClick={createNewProduct}
                      className="flex items-center gap-1.5 bg-[#d88193] hover:bg-[#c56a7e] text-white text-[11px] font-black uppercase tracking-wider px-4 py-2.5 rounded-lg shadow-sm"
                    >
                      <Plus size={14} /> Nueva referencia
                    </button>
                  </div>
                </div>

                {productsLoading && products.length === 0 ? (
                  <div className="py-24 flex justify-center"><Loader2 size={24} className="animate-spin text-neutral-300" /></div>
                ) : filteredProductsList.length === 0 ? (
                  <div className="py-24 text-center">
                    <Package size={34} className="mx-auto text-neutral-300 mb-3" />
                    <p className="text-xs font-bold uppercase tracking-wider text-neutral-400">Sin resultados</p>
                  </div>
                ) : productViewMode === 'reorder' ? (
                  /* Reorder List Mode */
                  <div className="space-y-2 max-w-3xl mx-auto">
                    <div className="bg-amber-50 border border-amber-200 text-amber-900 p-3 rounded-lg text-xs font-semibold flex items-center gap-2">
                      <GripVertical size={16} className="text-amber-700" />
                      Arrastra y suelta los productos para definir la secuencia exacta en que aparecerán en la tienda.
                    </div>
                    {filteredProductsList.map((p) => {
                    // Usa el índice REAL dentro del array completo de productos:
                    // con un filtro de búsqueda activo, el índice filtrado
                    // reordenaría/eliminaría el producto equivocado.
                    const realIdx = products.indexOf(p);
                    return (
                      <div
                        key={p.id}
                        draggable
                        onDragStart={() => handleProductDragStart(realIdx)}
                        onDragOver={(e) => handleProductDragOver(e, realIdx)}
                        onDragEnd={handleProductDragEnd}
                        className={`flex items-center justify-between p-3 bg-white rounded-xl border border-neutral-200 shadow-sm cursor-grab active:cursor-grabbing hover:border-[#d88193] transition-all ${
                          draggedProductIdx === realIdx ? 'opacity-30 border-2 border-dashed border-[#d88193]' : ''
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <GripVertical size={16} className="text-neutral-400 flex-shrink-0" />
                          <span className="w-7 h-7 rounded-full bg-[#1b2333] text-white text-[10px] font-black flex items-center justify-center flex-shrink-0">
                            #{realIdx + 1}
                          </span>
                          <div className="w-12 h-14 bg-neutral-100 rounded overflow-hidden flex-shrink-0">
                            {p.images?.[0] ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={p.images[0]} alt="" className="w-full h-full object-cover" />
                            ) : null}
                          </div>
                          <div>
                            <p className="text-xs font-black uppercase text-[#1b2333]">{p.name}</p>
                            <p className="text-[10px] text-neutral-400 font-bold">REF. {p.reference} · ${(p.price || 0).toLocaleString('es-CO')}</p>
                          </div>
                        </div>

                        <button
                          onClick={() => openProduct(p)}
                          className="px-3 py-1.5 border border-gray-200 text-neutral-700 text-xs font-bold uppercase rounded hover:bg-neutral-50"
                        >
                          Editar
                        </button>
                      </div>
                    );
                    })}
                  </div>
                ) : (
                  /* Standard Grid Mode */
                  <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                    {filteredProductsList.map((p) => {
                      const visible = !p.hidden && p.status !== 'draft';
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
                            <span
                              role="button"
                              title="Ver imagen"
                              onClick={(e) => { e.stopPropagation(); openPreview(p.images || [], 0); }}
                              className="absolute bottom-2 right-2 bg-white/95 rounded-full p-1.5 text-[#1b2333] opacity-0 group-hover:opacity-100 transition-opacity shadow cursor-zoom-in"
                            >
                              <Eye size={13} />
                            </span>
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
          /* Live Page Preview with Interactive Iframe */
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

        {/* Right: Properties Inspector (Wix Style) */}
        <aside className="w-80 bg-white border-l border-neutral-200 flex flex-col flex-shrink-0 min-h-0">
          <div className="px-5 py-4 border-b border-neutral-100 flex-shrink-0">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#d88193]">
              {mode === 'theme' ? <Palette size={12} /> : productsMode ? <Package size={12} /> : <LayoutTemplate size={12} />}
              {mode === 'theme' ? 'Propiedades globales' : productsMode ? (selectedId ? 'Inspector de prenda' : 'Gestor de productos') : 'Propiedades de sección'}
            </div>
            <h3 className="text-sm font-black uppercase tracking-tight text-[#1b2333] mt-1 truncate">
              {mode === 'theme'
                ? 'Diseño del sitio'
                : productsMode
                ? (selectedId && productDraft ? (productDraft.name || 'Prenda') : 'Catálogo')
                : (activeGroup?.group || 'General')}
            </h3>
            {mode === 'content' && !productsMode && (
              <div className="flex items-center gap-1 mt-1.5 text-[9px] font-semibold text-neutral-400 flex-wrap">
                <span className="uppercase tracking-wider">{schema?.label || 'Página'}</span>
                <ChevronRight size={9} className="text-neutral-300" />
                <span className="uppercase tracking-wider text-[#d88193]">{activeGroup?.group || 'General'}</span>
                {activeSectionLabel && activeSectionLabel !== activeGroup?.group && (
                  <>
                    <ChevronRight size={9} className="text-neutral-300" />
                    <span className="text-neutral-400">{activeSectionLabel}</span>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {mode === 'theme' ? (
              <div className="space-y-6">
                {/* 1. TIPOGRAFÍA Y FUENTES (WIX STYLE) */}
                <section className="border border-neutral-200 rounded-lg overflow-hidden">
                  <header className="bg-neutral-50 px-3 py-2 text-[9px] font-black uppercase tracking-widest text-neutral-500 flex items-center justify-between">
                    <span>Tipografía del Sitio (Google Fonts)</span>
                    <Sparkles size={11} className="text-[#d88193]" />
                  </header>
                  <div className="p-3 space-y-2.5">
                    <label className="block text-[9px] font-bold uppercase tracking-wider text-neutral-500">
                      Fuente Principal
                    </label>
                    <select
                      value={theme.fontFamily || 'Montserrat'}
                      onChange={(e) => handleThemeChange('fontFamily', e.target.value)}
                      className="w-full bg-white border border-neutral-200 px-3 py-2 text-xs font-semibold focus:outline-none focus:border-[#d88193] rounded"
                    >
                      <option value="Montserrat">Montserrat (Elegante & Comercial)</option>
                      <option value="Outfit">Outfit (Moderna & Minimalista)</option>
                      <option value="Poppins">Poppins (Geométrica & Suave)</option>
                      <option value="Inter">Inter (Limpia & Corporativa)</option>
                      <option value="Playfair Display">Playfair Display (Editorial / Moda de Lujo)</option>
                      <option value="Plus Jakarta Sans">Plus Jakarta Sans (Moderna Tech)</option>
                      <option value="Cinzel">Cinzel (Clásica & Premium)</option>
                    </select>
                    <p className="text-[9px] text-neutral-400">
                      Aplica a todos los títulos, botones y textos del catálogo en vivo.
                    </p>
                  </div>
                </section>

                {/* 2. ESTILO DE BOTONES (WIX STYLE) */}
                <section className="border border-neutral-200 rounded-lg overflow-hidden">
                  <header className="bg-neutral-50 px-3 py-2 text-[9px] font-black uppercase tracking-widest text-neutral-500">
                    Estilo de Botones
                  </header>
                  <div className="p-3 space-y-2.5">
                    <label className="block text-[9px] font-bold uppercase tracking-wider text-neutral-500">
                      Bordes de Botones
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { val: '0px', label: 'Recto (Clásico)' },
                        { val: '4px', label: 'Sutil (4px)' },
                        { val: '8px', label: 'Redondeado (8px)' },
                        { val: '9999px', label: 'Píldora (Wix)' },
                      ].map((btn) => (
                        <button
                          key={btn.val}
                          type="button"
                          onClick={() => handleThemeChange('btnRadius', btn.val)}
                          className={`py-2 px-2.5 text-[10px] font-bold uppercase tracking-wider border transition-all ${
                            (theme.btnRadius || '0px') === btn.val
                              ? 'border-[#1b2333] bg-[#1b2333] text-white shadow-sm'
                              : 'border-neutral-200 bg-white text-neutral-600 hover:border-[#d88193]'
                          }`}
                          style={{ borderRadius: btn.val }}
                        >
                          {btn.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </section>

                {/* 3. COLORES DE MARCA */}
                <section className="border border-neutral-200 rounded-lg overflow-hidden">
                  <header className="bg-neutral-50 px-3 py-2 text-[9px] font-black uppercase tracking-widest text-neutral-500">
                    Paleta de Colores de Marca
                  </header>
                  <div className="p-3 space-y-3">
                    {THEME_FIELDS.map((f) => (
                      <div key={f.key}>
                        <label className="block text-[9px] font-bold uppercase tracking-wider text-neutral-600 mb-1">
                          {f.label}
                        </label>
                        {f.type === 'color' ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={/^#[0-9a-fA-F]{6}$/.test(theme[f.key] as string) ? (theme[f.key] as string) : '#d88193'}
                              onChange={(e) => handleThemeChange(f.key, e.target.value)}
                              className="w-10 h-8 border border-neutral-200 cursor-pointer bg-white p-0.5 rounded"
                            />
                            <input
                              type="text"
                              value={theme[f.key] as string}
                              onChange={(e) => handleThemeChange(f.key, e.target.value)}
                              className="flex-1 border border-neutral-200 px-2.5 py-1 text-xs font-mono focus:outline-none focus:border-[#d88193] rounded"
                            />
                          </div>
                        ) : (
                          <textarea
                            value={theme.topNoticeText}
                            onChange={(e) => handleThemeChange('topNoticeText', e.target.value)}
                            rows={3}
                            className="w-full border border-neutral-200 px-3 py-2 text-xs leading-relaxed focus:outline-none focus:border-[#d88193] rounded resize-y"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            ) : productsMode ? (
              selectedId && productDraft ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={closeProduct}
                      className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-neutral-500 hover:text-[#d88193]"
                    >
                      <ArrowLeft size={12} /> Volver a lista
                    </button>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleDuplicateProduct}
                        className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-neutral-400 hover:text-[#116dff]"
                      >
                        <Copy size={11} /> Duplicar
                      </button>
                      {!isNewProduct && (
                        <button
                          onClick={handleDeleteProduct}
                          className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-red-400 hover:text-red-600"
                        >
                          <Trash2 size={11} /> Eliminar
                        </button>
                      )}
                    </div>
                  </div>

                  {/* 1. CLASIFICACIÓN & FILTROS (CATEGORÍA, FIT, COLOR) */}
                  <section className="border border-neutral-200 rounded-lg overflow-hidden">
                    <header className="bg-neutral-50 px-3 py-2 text-[9px] font-black uppercase tracking-widest text-neutral-500 flex items-center justify-between">
                      <span>Clasificación & Filtros</span>
                      <button
                        onClick={() => setShowClassify((v) => !v)}
                        className="text-[9px] text-[#d88193] hover:underline font-bold"
                      >
                        {showClassify ? 'Cerrar' : '+ Administrar'}
                      </button>
                    </header>

                    {showClassify && (
                      <div className="p-3 bg-rose-50/50 border-b border-neutral-200 space-y-2">
                        <div>
                          <span className="block text-[8px] font-bold uppercase text-neutral-500 mb-1">Nueva categoría</span>
                          <div className="flex gap-1.5">
                            <input
                              id="newCatInput"
                              placeholder="Ej: Chaquetas"
                              className="flex-1 bg-white border border-neutral-200 px-2 py-1 text-xs rounded"
                            />
                            <button
                              onClick={() => {
                                const el = document.getElementById('newCatInput') as HTMLInputElement;
                                if (el && el.value) { addCategory(el.value); el.value = ''; }
                              }}
                              className="bg-[#d88193] text-white text-[10px] font-bold px-2 py-1 rounded"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        <div>
                          <span className="block text-[8px] font-bold uppercase text-neutral-500 mb-1">Nuevo fit / silueta</span>
                          <div className="flex gap-1.5">
                            <input
                              id="newFitInput"
                              placeholder="Ej: Bootcut"
                              className="flex-1 bg-white border border-neutral-200 px-2 py-1 text-xs rounded"
                            />
                            <button
                              onClick={() => {
                                const el = document.getElementById('newFitInput') as HTMLInputElement;
                                if (el && el.value) { addFit(el.value); el.value = ''; }
                              }}
                              className="bg-[#d88193] text-white text-[10px] font-bold px-2 py-1 rounded"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="p-3 space-y-3">
                      <div>
                        <label className="block text-[9px] font-bold uppercase tracking-wider text-neutral-500 mb-1">Categoría</label>
                        <select
                          value={productDraft.category || categoriesList[0] || 'Jeans'}
                          onChange={(e) => patchDraft({ category: e.target.value })}
                          className="w-full bg-white border border-neutral-200 px-3 py-2 text-xs font-semibold focus:outline-none focus:border-[#d88193] rounded"
                        >
                          {categoriesList.map((cat) => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[9px] font-bold uppercase tracking-wider text-neutral-500 mb-1">Silueta / Fit</label>
                        <select
                          value={productDraft.fit || fitsList[0] || 'Wide Leg'}
                          onChange={(e) => patchDraft({ fit: e.target.value })}
                          className="w-full bg-white border border-neutral-200 px-3 py-2 text-xs font-semibold focus:outline-none focus:border-[#d88193] rounded"
                        >
                          {fitsList.map((fit) => (
                            <option key={fit} value={fit}>{fit}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[9px] font-bold uppercase tracking-wider text-neutral-500 mb-1">Color de la prenda</label>
                        <select
                          value={productDraft.color || ''}
                          onChange={(e) => patchDraft({ color: e.target.value })}
                          className="w-full bg-white border border-neutral-200 px-3 py-2 text-xs font-semibold focus:outline-none focus:border-[#d88193] rounded"
                        >
                          <option value="">(Sin color especificado)</option>
                          {PRODUCT_COLORS.map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </section>

                  {/* 2. ETIQUETAS, DISTINTIVOS & TAGS (WIX) */}
                  <section className="border border-neutral-200 rounded-lg overflow-hidden">
                    <header className="bg-neutral-50 px-3 py-2 text-[9px] font-black uppercase tracking-widest text-neutral-500 flex items-center gap-1.5">
                      <Tag size={11} className="text-[#d88193]" /> Etiquetas & Distintivos (Tags)
                    </header>
                    <div className="p-3 space-y-3">
                      <div>
                        <label className="block text-[9px] font-bold uppercase tracking-wider text-neutral-500 mb-1">Cinta / Ribbon (Insignia visual)</label>
                        <select
                          value={productDraft.ribbon || ''}
                          onChange={(e) => patchDraft({ ribbon: e.target.value })}
                          className="w-full bg-white border border-neutral-200 px-3 py-2 text-xs font-semibold focus:outline-none focus:border-[#d88193] rounded mb-1.5"
                        >
                          <option value="">(Sin cinta)</option>
                          <option value="Nuevo">Nuevo</option>
                          <option value="Oferta">Oferta</option>
                          <option value="Más Vendido">Más Vendido</option>
                          <option value="Últimas Unidades">Últimas Unidades</option>
                          <option value="Tendencia">Tendencia</option>
                        </select>
                        <input
                          type="text"
                          value={productDraft.ribbon || ''}
                          onChange={(e) => patchDraft({ ribbon: e.target.value })}
                          placeholder="O escribe una cinta personalizada…"
                          className="w-full border border-neutral-200 px-3 py-1.5 text-xs focus:outline-none focus:border-[#d88193] rounded"
                        />
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-neutral-100">
                        <span className="text-xs font-bold text-neutral-700 flex items-center gap-1">
                          <Flame size={13} className="text-rose-500 fill-rose-500" /> Más Vendido
                        </span>
                        <input
                          type="checkbox"
                          checked={productDraft.is_best_seller ?? false}
                          onChange={(e) => patchDraft({ is_best_seller: e.target.checked })}
                          className="w-4 h-4 text-[#d88193] rounded cursor-pointer"
                        />
                      </div>

                      {/* TAGS / ETIQUETAS DE BÚSQUEDA */}
                      <div className="pt-2 border-t border-neutral-100">
                        <label className="block text-[9px] font-bold uppercase tracking-wider text-neutral-500 mb-1.5">
                          Tags de búsqueda y filtros
                        </label>
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {(productDraft.tags || []).map((t) => (
                            <span
                              key={t}
                              className="inline-flex items-center gap-1 bg-rose-50 text-ush-pink text-[10px] font-bold px-2 py-0.5 rounded-full border border-rose-100"
                            >
                              #{t}
                              <button
                                type="button"
                                onClick={() => removeTag(t)}
                                className="hover:text-red-600 font-black ml-0.5"
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                        <div className="flex gap-1.5">
                          <input
                            type="text"
                            value={newTagInput}
                            onChange={(e) => setNewTagInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                addTag(newTagInput);
                              }
                            }}
                            placeholder="Añadir tag (ej: rigido, tiro alto)..."
                            className="flex-1 border border-neutral-200 px-2.5 py-1.5 text-xs focus:outline-none focus:border-[#d88193] rounded"
                          />
                          <button
                            type="button"
                            onClick={() => addTag(newTagInput)}
                            className="bg-[#1b2333] hover:bg-black text-white text-[10px] font-bold uppercase px-3 py-1.5 rounded"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* 3. PRECIOS (COP) */}
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
                            value={(productDraft as any)[f.key] ?? 0}
                            onChange={(e) => patchDraft({ [f.key]: parseFloat(e.target.value) || 0 })}
                            className="w-full border border-neutral-200 px-3 py-2 text-xs font-mono font-bold focus:outline-none focus:border-[#d88193] rounded"
                          />
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* 4. INVENTARIO & TALLAS VISIBLES */}
                  <section className="border border-neutral-200 rounded-lg overflow-hidden">
                    <header className="bg-neutral-50 px-3 py-2 text-[9px] font-black uppercase tracking-widest text-neutral-500 flex items-center justify-between">
                      <span>Inventario & Tallas</span>
                      <label className="flex items-center gap-1 text-[9px] font-bold cursor-pointer">
                        <input
                          type="checkbox"
                          checked={productDraft.in_stock ?? true}
                          onChange={(e) => patchDraft({ in_stock: e.target.checked })}
                          className="w-3.5 h-3.5 text-[#d88193] rounded"
                        />
                        <span>En stock</span>
                      </label>
                    </header>
                    <div className="p-3 space-y-3">
                      <div>
                        <span className="block text-[9px] font-bold uppercase tracking-wider text-neutral-500 mb-1.5">Tallas activas para este producto</span>
                        <div className="flex flex-wrap gap-1.5">
                          {PRODUCT_SIZES.map((sz) => {
                            const isVisible = draftSizes.includes(sz);
                            return (
                              <button
                                key={sz}
                                type="button"
                                onClick={() => toggleSizeVisible(sz)}
                                className={`px-2.5 py-1 text-[10px] font-black rounded border transition-colors ${
                                  isVisible ? 'bg-[#1b2333] text-white border-[#1b2333]' : 'bg-neutral-50 text-neutral-400 border-neutral-200 line-through'
                                }`}
                              >
                                Talla {sz}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div>
                        <span className="block text-[9px] font-bold uppercase tracking-wider text-neutral-500 mb-1.5">Cantidad en stock por talla</span>
                        <div className="grid grid-cols-5 gap-1.5">
                          {PRODUCT_SIZES.map((sz) => (
                            <div key={sz} className="text-center">
                              <span className="block text-[9px] font-bold text-neutral-500 mb-1">{sz}</span>
                              <input
                                type="number"
                                value={productDraft.stock_by_size?.[sz] ?? 0}
                                onChange={(e) => {
                                  const s = { ...(productDraft.stock_by_size || {}), [sz]: parseInt(e.target.value) || 0 };
                                  patchDraft({ stock_by_size: s });
                                }}
                                className="w-full border border-neutral-200 py-1 text-center text-xs font-mono font-bold focus:outline-none focus:border-[#d88193] rounded"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* 5. VISIBILIDAD & VIDEO */}
                  <section className="border border-neutral-200 rounded-lg overflow-hidden">
                    <header className="bg-neutral-50 px-3 py-2 text-[9px] font-black uppercase tracking-widest text-neutral-500">Visibilidad & Video</header>
                    <div className="p-3 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-neutral-700">Visible en catálogo público</span>
                        <input
                          type="checkbox"
                          checked={!productDraft.hidden && productDraft.status !== 'draft'}
                          onChange={(e) => {
                            const isVis = e.target.checked;
                            patchDraft({ hidden: !isVis, status: isVis ? 'published' : 'draft' });
                          }}
                          className="w-4 h-4 text-[#d88193] rounded cursor-pointer"
                        />
                      </div>

                      <div>
                        <label className="block text-[9px] font-bold uppercase tracking-wider text-neutral-500 mb-1 flex items-center gap-1">
                          <Video size={11} className="text-[#d88193]" /> Video de la prenda (Google Drive, YouTube o MP4)
                        </label>
                        <input
                          type="url"
                          value={productDraft.video_url || ''}
                          onChange={(e) => patchDraft({ video_url: e.target.value })}
                          placeholder="https://drive.google.com/file/... o YouTube"
                          className="w-full border border-neutral-200 px-3 py-1.5 text-xs font-mono focus:outline-none focus:border-[#d88193] rounded"
                        />
                        <p className="text-[9px] text-neutral-400 mt-1">
                          Pega cualquier enlace de Google Drive o YouTube; se reproducirá automáticamente sin ocupar espacio en Supabase.
                        </p>
                      </div>
                    </div>
                  </section>

                  <button
                    onClick={handleSaveProduct}
                    disabled={savingProduct}
                    className="w-full bg-[#d88193] hover:bg-[#c3687c] text-white font-bold py-3 text-xs uppercase tracking-widest flex items-center justify-center gap-2 rounded-lg transition-colors shadow-md"
                  >
                    {savingProduct ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                    Guardar y Publicar Producto
                  </button>
                </div>
              ) : (
                <p className="text-xs text-neutral-400">Selecciona un producto para editar sus propiedades.</p>
              )
            ) : (
              /* Content Page Properties */
              <div className="space-y-4">
                {activeGroup?.fields.map((f) => (
                  <div key={f.key}>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-600 mb-1.5">
                      {f.label}
                    </label>
                    <FieldInput
                      field={f}
                      value={values[f.key] ?? f.default}
                      onChange={(v) => handleChange(f.key, v)}
                      uploadPath={`content/${pageId}-${f.key}.jpg`}
                      onOpenCropper={handleOpenCropperForField}
                    />
                  </div>
                ))}

                {/* Apariencia de sección (#8 fondo, #9 tipografía, #10 espaciado) */}
                {(() => {
                  const sec = sectionForGroup(pageId, activeGroup?.group || '');
                  if (!sec) return null;
                  const prefix = `__sec_${sec}_`;
                  const controls: { key: string; label: string; type: 'color' | 'number' | 'select' }[] = [
                    { key: 'bg', label: 'Color de fondo de la sección', type: 'color' },
                    { key: 'padTop', label: 'Espaciado superior (px)', type: 'number' },
                    { key: 'padBottom', label: 'Espaciado inferior (px)', type: 'number' },
                    { key: 'fontSize', label: 'Tamaño de fuente base (px)', type: 'number' },
                    { key: 'align', label: 'Alineación del texto', type: 'select' },
                  ];
                  return (
                    <section className="border border-neutral-200 rounded-lg overflow-hidden mt-5">
                      <header className="bg-neutral-50 px-3 py-2 text-[9px] font-black uppercase tracking-widest text-neutral-500 flex items-center justify-between">
                        <span>Apariencia de la sección</span>
                        <Layers size={11} className="text-[#d88193]" />
                      </header>
                      <div className="p-3 space-y-3">
                        {controls.map((c) => {
                          const val = values[prefix + c.key] || '';
                          if (c.type === 'color') {
                            return (
                              <div key={c.key}>
                                <label className="block text-[9px] font-bold uppercase tracking-wider text-neutral-600 mb-1">{c.label}</label>
                                <div className="flex items-center gap-2">
                                  <input
                                    type="color"
                                    value={/^#[0-9a-fA-F]{6}$/.test(val) ? val : '#ffffff'}
                                    onChange={(e) => handleChange(prefix + c.key, e.target.value)}
                                    className="w-10 h-8 border border-neutral-200 cursor-pointer bg-white p-0.5 rounded"
                                  />
                                  <input
                                    type="text"
                                    value={val}
                                    onChange={(e) => handleChange(prefix + c.key, e.target.value)}
                                    className="flex-1 border border-neutral-200 px-2.5 py-1 text-xs font-mono focus:outline-none focus:border-[#d88193] rounded"
                                  />
                                  {val && (
                                    <button onClick={() => handleChange(prefix + c.key, '')} title="Limpiar" className="text-neutral-400 hover:text-red-500">
                                      <X size={14} />
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          }
                          if (c.type === 'select') {
                            return (
                              <div key={c.key}>
                                <label className="block text-[9px] font-bold uppercase tracking-wider text-neutral-600 mb-1">{c.label}</label>
                                <select
                                  value={val}
                                  onChange={(e) => handleChange(prefix + c.key, e.target.value)}
                                  className="w-full bg-white border border-neutral-200 px-3 py-2 text-xs font-semibold focus:outline-none focus:border-[#d88193] rounded"
                                >
                                  <option value="">(Por defecto)</option>
                                  <option value="left">Izquierda</option>
                                  <option value="center">Centro</option>
                                  <option value="right">Derecha</option>
                                </select>
                              </div>
                            );
                          }
                          return (
                            <div key={c.key}>
                              <label className="block text-[9px] font-bold uppercase tracking-wider text-neutral-600 mb-1">{c.label}</label>
                              <div className="flex items-center gap-2">
                                <input
                                  type="number"
                                  min={0}
                                  max={300}
                                  value={val}
                                  onChange={(e) => handleChange(prefix + c.key, e.target.value)}
                                  className="flex-1 border border-neutral-200 px-3 py-1.5 text-xs font-mono focus:outline-none focus:border-[#d88193] rounded"
                                />
                                {val && (
                                  <button onClick={() => handleChange(prefix + c.key, '')} title="Limpiar" className="text-neutral-400 hover:text-red-500">
                                    <X size={14} />
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                        <p className="text-[9px] text-neutral-400">
                          Se aplica en vivo a la sección "{activeGroup?.group}". Guarda y publica para que los usuarios lo vean.
                        </p>
                      </div>
                    </section>
                  );
                })()}
              </div>
            )}
          </div>
        </aside>

        {/* ── REVISION HISTORY SLIDE-OVER DRAWER ── */}
        {showHistoryDrawer && (
          <div className="absolute right-0 top-0 bottom-0 w-80 bg-[#121824] text-white shadow-2xl z-30 flex flex-col border-l border-white/10 animate-slideLeft">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider">
                <HistoryIcon size={14} className="text-[#d88193]" />
                Historial de Cambios
              </div>
              <button onClick={() => setShowHistoryDrawer(false)} className="text-neutral-400 hover:text-white">
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {revisions.length === 0 ? (
                <p className="text-xs text-neutral-400 text-center py-12">
                  No hay cambios registrados en esta sesión aún.
                </p>
              ) : (
                revisions.map((rev) => (
                  <div key={rev.id} className="p-3 bg-white/5 hover:bg-white/10 rounded-lg border border-white/5 space-y-1.5 transition-colors">
                    <div className="flex items-center justify-between text-[10px] text-neutral-400">
                      <span>{new Date(rev.timestamp).toLocaleTimeString()}</span>
                      <button
                        onClick={() => restoreRevision(rev)}
                        className="text-[#d88193] hover:underline font-bold"
                      >
                        Revertir a esta versión
                      </button>
                    </div>
                    <p className="text-xs font-bold text-neutral-200">{rev.title}</p>
                    {rev.desc && <p className="text-[10px] text-neutral-400 truncate">{rev.desc}</p>}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
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

      {/* ── IMAGE CROPPER MODAL INTEGRATION ── */}
      <ImageCropperModal
        isOpen={cropperModal.isOpen}
        imageSrc={cropperModal.imageSrc}
        initialAspectRatio={cropperModal.initialAspect ?? 3 / 4}
        onClose={() => setCropperModal({ isOpen: false, imageSrc: '' })}
        onCropComplete={handleCropComplete}
      />
    </div>
  );
}
