'use client';

import { useEffect, useState } from 'react';
import { Product } from '@/types';
import { subscribeCatalogChanges } from '@/lib/supabase';

// Suscribe a los cambios del catálogo vía Realtime Broadcast de Supabase.
// Cuando el admin confirma un pago (o edita/oculta un producto), el stock y
// los datos cambian en la base; aquí se re-descarga y se actualiza la UI al
// instante en todos los dispositivos conectados.
export function useCatalogSync(initialProducts: Product[]): Product[] {
  const [products, setProducts] = useState<Product[]>(initialProducts);

  useEffect(() => {
    let active = true;
    const refresh = () => {
      // Se sirve desde el cache del edge de Vercel (/api/catalog con s-maxage=60),
      // no se consulta Supabase por cada cliente ante cada broadcast.
      fetch('/api/catalog')
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error('catalog ' + r.status))))
        .then((fresh: Product[]) => {
          if (active) setProducts(fresh);
        })
        .catch(() => {});
    };

    const unsubscribe = subscribeCatalogChanges(refresh);

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  return products;
}
