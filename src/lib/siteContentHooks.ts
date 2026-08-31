'use client';

import { useState, useEffect } from 'react';
import type { CSSProperties } from 'react';
import {
  mergeContent,
  getPageContentClient,
  fetchThemeFromRemote,
  DEFAULT_THEME,
  applyTheme,
  CONTENT_EVENT,
  THEME_EVENT,
} from './siteContent';
import { subscribeCatalogChanges } from './supabase';
import type { CatalogSyncPayload } from './supabase';
import type { ContentValues, SiteTheme } from './siteContent';

export function usePageContent(pageId: string): ContentValues {
  const [content, setContent] = useState<ContentValues>(() => mergeContent(pageId, null));

  useEffect(() => {
    let cancelled = false;
    const load = async (payload?: CatalogSyncPayload) => {
      const values = await getPageContentClient(pageId, payload?.ts);
      if (!cancelled) setContent(values);
    };
    load();
    const unsubscribe = subscribeCatalogChanges(load);

    const handler = () => { load(); };
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'ush_content_' + pageId || e.key === null) load();
    };
    window.addEventListener(CONTENT_EVENT, handler);
    window.addEventListener('ush_catalog_updated', handler);
    window.addEventListener('ush_products_updated', handler);
    window.addEventListener('storage', onStorage);

    return () => {
      cancelled = true;
      window.removeEventListener(CONTENT_EVENT, handler);
      window.removeEventListener('ush_catalog_updated', handler);
      window.removeEventListener('ush_products_updated', handler);
      window.removeEventListener('storage', onStorage);
      unsubscribe();
    };
  }, [pageId]);

  return content;
}

export function useSectionStyle(sectionId: string, content: ContentValues): CSSProperties {
  const prefix = `__sec_${sectionId}_`;
  const style: CSSProperties = {};
  const bg = content[prefix + 'bg'];
  const padTop = content[prefix + 'padTop'];
  const padBottom = content[prefix + 'padBottom'];
  const fontSize = content[prefix + 'fontSize'];
  const align = content[prefix + 'align'];
  if (bg) style.backgroundColor = bg;
  if (padTop) style.paddingTop = `${padTop}px`;
  if (padBottom) style.paddingBottom = `${padBottom}px`;
  if (fontSize) style.fontSize = `${fontSize}px`;
  if (align) style.textAlign = align as CSSProperties['textAlign'];
  return style;
}

export function useSiteTheme(): SiteTheme {
  // Siempre inicia con DEFAULT en servidor Y cliente para evitar hydration
  // mismatch; el caché local se aplica justo después en el efecto.
  const [theme, setTheme] = useState<SiteTheme>(DEFAULT_THEME);

  useEffect(() => {
    let cancelled = false;

    // Aplica primero el caché local (si existe) para evitar el flash de tema default
    try {
      const cached = localStorage.getItem('ush_theme_cache');
      if (cached) {
        const merged = { ...DEFAULT_THEME, ...JSON.parse(cached) };
        setTheme(merged);
        applyTheme(merged);
      }
    } catch (_) {}

    const load = async (payload?: CatalogSyncPayload) => {
      const t = await fetchThemeFromRemote(payload?.ts);
      if (cancelled || !t) {
        // Si falla la red NO se pisa el tema ya aplicado (caché o default):
        // antes se forzaba DEFAULT y la UI quedaba desincronizada del hook.
        return;
      }
      setTheme(t);
      applyTheme(t);
    };
    load();
    const unsubscribe = subscribeCatalogChanges(load);

    const handler = () => { load(); };
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'ush_theme_cache' || e.key === null) load();
    };
    window.addEventListener(THEME_EVENT, handler);
    window.addEventListener('storage', onStorage);
    return () => {
      cancelled = true;
      window.removeEventListener(THEME_EVENT, handler);
      window.removeEventListener('storage', onStorage);
      unsubscribe();
    };
  }, []);

  return theme;
}
