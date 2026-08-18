'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Save, CheckCircle, ChevronRight, ChevronDown, Monitor, Tablet, Smartphone,
  LayoutTemplate, Palette, FileText, Loader2, ExternalLink, ImagePlus, Upload, RotateCcw,
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
import { uploadProductImage, publishCatalogChange } from '@/lib/supabase';

// Ruta pública de cada página del CMS (para el preview)
const PAGE_ROUTES: Record<string, string> = {
  'home': '/',
  'outlet': '/',
  'como-comprar': '/como-comprar',
  'contacto': '/contacto',
  'rastreo': '/rastreo',
  'tarjeta-de-regalo': '/tarjeta-de-regalo',
  'catalogo': '/catalogo',
  'politicas': '/politicas',
};

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
export function SiteContentEditor() {
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

  const schema = PAGE_SCHEMAS.find((s) => s.id === pageId);
  const groups = schema ? groupFields(schema.fields) : [];
  const activeGroup = groups.find((g) => g.group === groupId) || groups[0];

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
    setValues((prev) => ({ ...prev, [key]: val }));
    setDirty(true);
    setSaved(false);
  };

  const handleThemeChange = (key: keyof SiteTheme, val: string) => {
    setTheme((prev) => ({ ...prev, [key]: val }));
    setDirty(true);
    setSaved(false);
  };

  const handleReset = () => {
    if (mode === 'theme') {
      setTheme(DEFAULT_THEME);
      setDirty(true);
    } else {
      setValues({});
      setDirty(true);
    }
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
  };

  const previewRoute = PAGE_ROUTES[pageId] || '/';
  const iframeSrc = `${previewRoute}${previewRoute.includes('?') ? '&' : '?'}editor=${nonce}`;

  return (
    <div
      className="-mx-4 sm:-mx-6 lg:-mx-8 flex flex-col overflow-hidden border border-neutral-200 bg-[#f3f4f6] shadow-xl"
      style={{ height: 'calc(100vh - 225px)' }}
    >
      {/* ── Top Toolbar ── */}
      <div className="h-14 bg-[#1b2333] text-white flex items-center justify-between px-4 flex-shrink-0">
        <div className="flex items-center gap-3 min-w-0">
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
            {dirty && <span className="hidden md:block text-[10px] font-bold uppercase tracking-wider text-amber-300">Sin publicar</span>}
            {saved && (
              <span className="hidden md:flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                <CheckCircle size={12} /> Publicado
              </span>
            )}
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

      {/* ── Body: left / canvas / right ── */}
      <div className="flex flex-1 min-h-0">
        {/* Left: Pages + layers */}
        <aside className="w-60 bg-[#121824] text-white flex flex-col flex-shrink-0 min-h-0 border-r border-black/20">
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
                    <span className="flex-1">{s.label}</span>
                    {isActive ? <ChevronDown size={13} className="text-neutral-400" /> : <ChevronRight size={13} className="text-neutral-600" />}
                  </button>

                  {isActive && (
                    <div className="ml-3 pl-3 border-l border-white/10 pb-2">
                      {sGroups.map((g) => (
                        <button
                          key={g.group}
                          onClick={() => setGroupId(g.group)}
                          className={`w-full text-left px-3 py-1.5 text-[10px] font-semibold tracking-wide rounded-l ${
                            activeGroup?.group === g.group ? 'bg-[#d88193]/20 text-[#f9c9d2]' : 'text-neutral-500 hover:text-white'
                          }`}
                        >
                          {g.group}
                        </button>
                      ))}
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

        {/* Center: live preview canvas */}
        <div className="flex-1 min-w-0 bg-[#e5e7eb] p-5 overflow-auto flex justify-center">
          <div
            className="bg-white shadow-2xl ring-1 ring-black/10 transition-all duration-300"
            style={{ width: DEVICE_WIDTH[device], height: '100%', minHeight: '100%' }}
          >
            <iframe
              key={pageId + nonce}
              src={iframeSrc}
              className="w-full h-full"
              style={{ border: 'none' }}
              title="Preview del sitio"
            />
          </div>
        </div>

        {/* Right: properties */}
        <aside className="w-80 bg-white border-l border-neutral-200 flex flex-col flex-shrink-0 min-h-0">
          <div className="px-5 py-4 border-b border-neutral-100 flex-shrink-0">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#d88193]">
              {mode === 'theme' ? <Palette size={12} /> : <LayoutTemplate size={12} />}
              {mode === 'theme' ? 'Propiedades globales' : 'Propiedades de sección'}
            </div>
            <h3 className="text-sm font-black uppercase tracking-tight text-[#1b2333] mt-1">
              {mode === 'theme' ? 'Diseño del sitio' : (activeGroup?.group || 'General')}
            </h3>
            <p className="text-[11px] text-neutral-500 mt-0.5">
              {mode === 'theme'
                ? 'Colores de marca y texto de la franja superior. Cambia y publica.'
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
    </div>
  );
}