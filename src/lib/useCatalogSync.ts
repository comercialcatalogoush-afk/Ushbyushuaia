'use client';

import { useEffect, useState } from 'react';
import { Product } from '@/types';
import { subscribeCatalogChanges, fetchProductsFromSupabase } from '@/lib/supabase';

// Suscribe a los cambios del catálogo vía Realtime Broadcast de Supabase.
// Cuando el admin confirma un pago (o edita/oculta un producto), el stock y
// los datos cambian en la base; aquí se re-descarga y se actualiza la UI al
// instante en todos los dispositivos conectados.
export function useCatalogSync(initialProducts: Product[]): Product[] {
  const [products, setProducts] = useState<Product[]>(initialProducts);

  useEffect(() => {
    let active = true;
    const refresh = () => {
      fetchProductsFromSupabase().then((fresh) => {
        if (active) setProducts(fresh);
      });
    };

    const unsubscribe = subscribeCatalogChanges(refresh);

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  return products;
}
