'use client';

import { useEffect } from 'react';

// Activa las clases .reveal/visible conforme el usuario hace scroll.
// Usa IntersectionObserver nativo + MutationObserver para soportar
// navegación SPA (páginas que se montan después del layout).
export function ScrollReveal() {
  useEffect(() => {
    let observer: IntersectionObserver | null = null;

    const observeAll = () => {
      const els = Array.from(document.querySelectorAll<HTMLElement>('.reveal:not(.visible)'));
      if (els.length === 0) return;

      if (!observer) {
        observer = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer?.unobserve(entry.target);
              }
            });
          },
          { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
        );
      }
      els.forEach((el) => observer?.observe(el));
    };

    observeAll();

    // Re-observa elementos agregados por navegación entre rutas
    const mo = new MutationObserver(observeAll);
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer?.disconnect();
      mo.disconnect();
    };
  }, []);

  return null;
}
