'use client';

import { useEffect, useState } from 'react';
import { Product } from '@/types';
import { subscribeCatalogChanges } from '@/lib/supabase';

// Mantiene el catálogo del sitio sincronizado con lo que guarda el admin:
//  1. Trae datos frescos de /api/catalog (edge de Vercel) AL ABRIR la página,
//     aunque el HTML venga de ISR.
//  2. Se re-descarga en cuanto el admin publica un cambio (Realtime Broadcast).
//  3. Se re-descarga al volver a enfocar la pestaña (si pasaron +30 s).
export function useCatalogSync(initialProducts: Product[]): Product[] {
  const [products, setProducts] = useState<Product[]>(initialProducts);

  useEffect(() => {
    let active = true;
    let lastFetch = 0;

    const refresh = () => {
      lastFetch = Date.now();
      // Edge de Vercel; no consulta Supabase por cada cliente.
      fetch('/api/catalog', { cache: 'no-store' })
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error('catalog ' + r.status))))
        .then((fresh: Product[]) => {
          if (active) setProducts(fresh);
        })
        .catch(() => {});
    };

    // Fresco inmediatamente al montar (evita ver contenido viejo en otros dispositivos)
    refresh();

    const unsubscribe = subscribeCatalogChanges(refresh);

    // Al regresar a la pestaña, refresca si el dato puede estar viejo
    const onFocus = () => {
      if (Date.now() - lastFetch > 30000) refresh();
    };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onFocus);

    return () => {
      active = false;
      unsubscribe();
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onFocus);
    };
  }, []);

  return products;
}
