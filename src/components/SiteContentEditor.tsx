'use client';

import React, { useState, useEffect } from 'react';
import { Save, CheckCircle, ImagePlus, Upload, LayoutTemplate, Palette } from 'lucide-react';
import {
  PAGE_SCHEMAS,
  DEFAULT_THEME,
  SiteTheme,
  ContentValues,
  FieldDef,
  getPageContentClient,
  savePageContent,
  fetchThemeFromRemote,
  saveTheme,
  applyTheme,
} from '@/lib/siteContent';
import { usePageContent, useSiteTheme } from '@/lib/siteContentHooks';
import { uploadProductImage } from '@/lib/supabase';
import { publishCatalogChange } from '@/lib/supabase';

const compressImage = (file: File): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = document.createElement('img');
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxDim = 1920;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Sin blob'))), 'image/jpeg', 0.92);
        } else {
          reject(new Error('Canvas no disponible'));
        }
      };
      img.onerror = reject;
      img.src = event.target?.result as string;
    };
    reader.onerror = reject;
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
    return (
      <div className="flex items-center gap-3">
        <input
          type="color"
          value={/^#[0-9a-fA-F]{6}$/.test(value) ? value : '#d88193'}
          onChange={(e) => onChange(e.target.value)}
          className="w-12 h-10 border border-gray-300 cursor-pointer bg-white p-1"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#d88193"
          className="flex-1 border border-gray-300 p-2.5 text-xs focus:outline-none focus:border-[#d88193]"
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
        placeholder={field.placeholder || ''}
        className="w-full border border-gray-300 p-2.5 text-xs leading-relaxed focus:outline-none focus:border-[#d88193]"
      />
    );
  }

  if (field.type === 'image') {
    return (
      <div className="space-y-2">
        <div className="flex items-start gap-3">
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="URL de la imagen (https://…)"
            className="flex-1 border border-gray-300 p-2.5 text-xs focus:outline-none focus:border-[#d88193]"
          />
          <label className="inline-flex items-center gap-2 bg-[#1b2333] text-white text-xs font-bold px-4 py-2.5 cursor-pointer hover:bg-[#d88193] transition-colors flex-shrink-0">
            <Upload size={14} /> {uploading ? 'Subiendo…' : 'Subir'}
            <input type="file" accept="image/*" className="hidden" onChange={handleFile} disabled={uploading} />
          </label>
        </div>
        {value && (
          <div className="relative h-36 bg-neutral-100 border border-gray-200 overflow-hidden">
            <img src={value} alt={field.label} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0.2'; }} />
          </div>
        )}
      </div>
    );
  }

  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={field.placeholder || ''}
      className="w-full border border-gray-300 p-2.5 text-xs focus:outline-none focus:border-[#d88193]"
    />
  );
}

function groupFields(fields: FieldDef[]): { group: string; fields: FieldDef[] }[] {
  const groups: { group: string; fields: FieldDef[] }[] = [];
  for (const f of fields) {
    let g = groups.find((x) => x.group === f.group);
    if (!g) {
      g = { group: f.group, fields: [] };
      groups.push(g);
    }
    g.fields.push(f);
  }
  return groups;
}

export function PageContentEditor({ pageId }: { pageId: string }) {
  const schema = PAGE_SCHEMAS.find((s) => s.id === pageId);
  const current = usePageContent(pageId);
  const [values, setValues] = useState<ContentValues>({});
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (schema) {
      setValues(current);
    }
  }, [schema, pageId, current]);

  if (!schema) return null;

  const groups = groupFields(schema.fields);

  const handleSave = async () => {
    setSaving(true);
    const res = await savePageContent(pageId, values);
    setSaving(false);
    if (res.success) {
      setSaved(true);
      publishCatalogChange();
      setTimeout(() => setSaved(false), 4000);
    } else {
      alert('No se pudo guardar: ' + (res.error || 'error'));
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 shadow-sm p-5">
        <h2 className="text-sm font-black uppercase text-[#1b2333]">{schema.label}</h2>
        <p className="text-[11px] text-neutral-500 mt-1">{schema.description}</p>
      </div>

      {groups.map((g) => (
        <div key={g.group} className="bg-white border border-gray-200 shadow-sm overflow-hidden">
          <div className="bg-neutral-50 border-b border-gray-200 px-5 py-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-700">{g.group}</h3>
          </div>
          <div className="p-5 space-y-4">
            {g.fields.map((f) => (
              <div key={f.key}>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-600 mb-1.5">
                  {f.label}
                </label>
                <FieldInput
                  field={f}
                  value={values[f.key] ?? f.default}
                  uploadPath={`site/${pageId}-${f.key}.jpg`}
                  onChange={(v) => {
                    setValues((prev) => ({ ...prev, [f.key]: v }));
                    setDirty(true);
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="sticky bottom-4 flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 bg-[#116dff] text-white text-xs font-bold uppercase tracking-widest px-6 py-3.5 shadow-lg hover:bg-[#0d5cd6] transition-colors disabled:opacity-50"
        >
          <Save size={16} /> {saving ? 'Guardando…' : 'Guardar cambios'}
        </button>
        {dirty && <span className="text-[11px] text-amber-600 font-bold uppercase">Cambios sin guardar</span>}
        {saved && (
          <span className="inline-flex items-center gap-2 text-[11px] text-emerald-700 font-bold uppercase">
            <CheckCircle size={16} className="text-emerald-600" /> ¡Publicado!
          </span>
        )}
      </div>
    </div>
  );
}

export function ThemeEditor() {
  const liveTheme = useSiteTheme();
  const [values, setValues] = useState<SiteTheme>(DEFAULT_THEME);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setValues(liveTheme);
  }, [liveTheme]);

  const set = (key: keyof SiteTheme) => (v: string) => {
    const next = { ...values, [key]: v };
    setValues(next);
    setDirty(true);
    applyTheme(next); // preview instantáneo en todo el sitio
  };

  const colorFields: { key: keyof SiteTheme; label: string }[] = [
    { key: 'pink', label: 'Color principal (rosa)' },
    { key: 'pinkDark', label: 'Rosa oscuro' },
    { key: 'pinkHover', label: 'Rosa hover' },
    { key: 'pinkLight', label: 'Rosa claro (fondos)' },
    { key: 'pinkSoft', label: 'Rosa suave' },
    { key: 'navy', label: 'Color oscuro (navy)' },
    { key: 'navyDark', label: 'Navy oscuro' },
    { key: 'accent', label: 'Color de acento' },
    { key: 'bodyBg', label: 'Color de fondo de página' },
  ];

  const handleSave = async () => {
    setSaving(true);
    const res = await saveTheme(values);
    setSaving(false);
    if (res.success) {
      setSaved(true);
      publishCatalogChange();
      setTimeout(() => setSaved(false), 4000);
    } else {
      alert('No se pudo guardar el tema: ' + (res.error || 'error'));
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 shadow-sm p-5">
        <h2 className="flex items-center gap-2 text-sm font-black uppercase text-[#1b2333]">
          <Palette size={16} className="text-[#d88193]" /> Colores de marca
        </h2>
        <p className="text-[11px] text-neutral-500 mt-1">
          Se aplican en todo el sitio al instante (botones, fondos, encabezados). El catálogo usa estos colores automáticamente.
        </p>
      </div>

      <div className="bg-white border border-gray-200 shadow-sm overflow-hidden">
        <div className="bg-neutral-50 border-b border-gray-200 px-5 py-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-700">Colores</h3>
        </div>
        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          {colorFields.map(({ key, label }) => (
            <div key={key as string}>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-600 mb-1.5">{label}</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={/^#[0-9a-fA-F]{6}$/.test(values[key]) ? values[key] : '#d88193'}
                  onChange={(e) => set(key)(e.target.value)}
                  className="w-12 h-10 border border-gray-300 cursor-pointer bg-white p-1"
                />
                <input
                  type="text"
                  value={values[key]}
                  onChange={(e) => set(key)(e.target.value)}
                  className="flex-1 border border-gray-300 p-2.5 text-xs focus:outline-none focus:border-[#d88193]"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white border border-gray-200 shadow-sm overflow-hidden">
        <div className="bg-neutral-50 border-b border-gray-200 px-5 py-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-700">Barra superior (marquee)</h3>
        </div>
        <div className="p-5">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-600 mb-1.5">Texto del anuncio</label>
          <textarea
            value={values.topNoticeText}
            onChange={(e) => set('topNoticeText')(e.target.value)}
            rows={2}
            className="w-full border border-gray-300 p-2.5 text-xs focus:outline-none focus:border-[#d88193]"
          />
        </div>
      </div>

      <div className="sticky bottom-4 flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 bg-[#116dff] text-white text-xs font-bold uppercase tracking-widest px-6 py-3.5 shadow-lg hover:bg-[#0d5cd6] transition-colors disabled:opacity-50"
        >
          <Save size={16} /> {saving ? 'Guardando…' : 'Guardar tema'}
        </button>
        {dirty && <span className="text-[11px] text-amber-600 font-bold uppercase">Cambios sin guardar</span>}
        {saved && (
          <span className="inline-flex items-center gap-2 text-[11px] text-emerald-700 font-bold uppercase">
            <CheckCircle size={16} className="text-emerald-600" /> ¡Tema publicado!
          </span>
        )}
      </div>
    </div>
  );
}

export function SiteContentEditor() {
  const [activePage, setActivePage] = useState<string>('theme');

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <div className="bg-[#1b2333] text-white p-2 flex items-center gap-2">
          <LayoutTemplate size={16} className="text-[#d88193]" />
          <span className="text-xs font-bold uppercase tracking-widest">Editor del Sitio Web</span>
        </div>
        <p className="text-[11px] text-neutral-500">Cambia textos, imágenes, botones y colores de cada página. Se publica al instante.</p>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-6 border-b border-gray-200 pb-3">
        <button
          onClick={() => setActivePage('theme')}
          className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
            activePage === 'theme' ? 'bg-[#1b2333] text-white shadow-sm' : 'text-neutral-600 hover:bg-neutral-100'
          }`}
        >
          <Palette size={14} /> Colores globales
        </button>
        {PAGE_SCHEMAS.map((s) => (
          <button
            key={s.id}
            onClick={() => setActivePage(s.id)}
            className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
              activePage === s.id ? 'bg-[#1b2333] text-white shadow-sm' : 'text-neutral-600 hover:bg-neutral-100'
            }`}
          >
            <ImagePlus size={14} /> {s.label}
          </button>
        ))}
      </div>

      {activePage === 'theme' ? <ThemeEditor /> : <PageContentEditor key={activePage} pageId={activePage} />}
    </div>
  );
}