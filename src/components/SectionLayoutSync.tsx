'use client';

import { useEffect } from 'react';
import { getSectionLayoutClient, SECTION_PAGE_MAP, subscribeSectionLayout } from '@/lib/siteContent';
import { subscribeCatalogChanges } from '@/lib/supabase';
import type { CatalogSyncPayload } from '@/lib/supabase';

function applySectionLayout(layout: { orders: Record<string, string[]>; hidden: Record<string, string[]> }) {
  if (typeof document === 'undefined') return;

  const sections = Array.from(document.querySelectorAll<HTMLElement>('[data-editor-section]'));
  const grouped = new Map<HTMLElement, HTMLElement[]>();

  sections.forEach((section) => {
    const id = section.getAttribute('data-editor-section') || '';
    const pageId = SECTION_PAGE_MAP[id];
    if (!pageId) return;

    const hidden = (layout.hidden[pageId] || []).includes(id);
    section.style.display = hidden ? 'none' : '';

    const parent = section.parentElement;
    if (!parent) return;
    const siblings = grouped.get(parent) || [];
    siblings.push(section);
    grouped.set(parent, siblings);
  });

  // Solo se reordenan bloques hermanos. Esto evita sacar, por ejemplo, los
  // bloques internos del outlet fuera de su contenedor principal.
  grouped.forEach((siblings) => {
    const pageId = SECTION_PAGE_MAP[siblings[0]?.getAttribute('data-editor-section') || ''];
    const order = pageId ? layout.orders[pageId] || [] : [];
    if (order.length < 2) return;
    const rank = new Map(order.map((id, index) => [id, index]));
    const sorted = [...siblings].filter((section) => rank.has(section.getAttribute('data-editor-section') || '')).sort((a, b) => {
      const aRank = rank.get(a.getAttribute('data-editor-section') || '');
      const bRank = rank.get(b.getAttribute('data-editor-section') || '');
      return (aRank ?? 0) - (bRank ?? 0);
    });
    if (sorted.length < 2) return;

    // Mantiene en su sitio los nodos no administrados por este editor (por
    // ejemplo, un bloque dinámico del catálogo) y solo reemplaza las
    // posiciones ocupadas por secciones configurables.
    const children = Array.from(siblings[0].parentElement?.children || []) as HTMLElement[];
    const slots = children.filter((child) => siblings.includes(child));
    const replacement = new Map(slots.map((slot, index) => [slot, sorted[index]]));
    children.forEach((child) => child.parentElement?.appendChild(replacement.get(child) || child));
  });
}

export function SectionLayoutSync() {
  useEffect(() => {
    let cancelled = false;
    const load = async (payload?: CatalogSyncPayload) => {
      const layout = await getSectionLayoutClient(payload?.ts);
      if (!cancelled) applySectionLayout(layout);
    };

    load();
    const unsubscribeCatalog = subscribeCatalogChanges(load);
    const unsubscribeLayout = subscribeSectionLayout(load);

    return () => {
      cancelled = true;
      unsubscribeCatalog();
      unsubscribeLayout();
    };
  }, []);

  return null;
}
