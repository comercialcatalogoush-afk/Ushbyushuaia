'use client';

import { useState, useEffect } from 'react';
import {
  mergeContent,
  getPageContentClient,
  fetchThemeFromRemote,
  DEFAULT_THEME,
  applyTheme,
  CONTENT_EVENT,
  THEME_EVENT,
} from './siteContent';
import type { ContentValues, SiteTheme } from './siteContent';

export function usePageContent(pageId: string): ContentValues {
  const [content, setContent] = useState<ContentValues>(() => mergeContent(pageId, null));

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const values = await getPageContentClient(pageId);
      if (!cancelled) setContent(values);
    };
    load();

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
    };
  }, [pageId]);

  return content;
}

export function useSiteTheme(): SiteTheme {
  const [theme, setTheme] = useState<SiteTheme>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('ush_theme_cache');
        if (cached) return { ...DEFAULT_THEME, ...JSON.parse(cached) };
      } catch (e) {}
    }
    return DEFAULT_THEME;
  });

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const t = await fetchThemeFromRemote();
      if (!cancelled && t) {
        setTheme(t);
        applyTheme(t);
      } else if (!cancelled) {
        applyTheme(DEFAULT_THEME);
      }
    };
    load();

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
    };
  }, []);

  return theme;
}