'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { Product } from '@/types';
import { ProductCard } from './ProductCard';
import { Flame, ChevronRight } from 'lucide-react';
import { isCompleteProduct, getTopSellingProducts } from '@/lib/supabase';
import { useCatalogSync } from '@/lib/useCatalogSync';
import { getCatalogProductsOrder } from '@/lib/siteContent';
import { isReference2026 } from '@/data/references2026';
import { isMenReference } from '@/lib/menCatalog';

interface CatalogGridProps {
  products: Product[];
}

const PAGE_SIZE = 12;

// Normaliza la etiqueta del menú (ej: "VAQUERO", "WIDE LEG") al fit real del producto
function normalizeFitLabel(label: string): string {
  const map: Record<string, string> = {
    'WIDE LEG': 'Wide Leg', 'WIDELEG': 'Wide Leg', 'BARREL': 'Barrel',
    'STRAIGHT BOOT': 'Straight Boot', 'STRAIGHTBOOT': 'Straight Boot',
    'VAQUERO': 'Vaquero', 'BOTA FLARE': 'Flare', 'BOTAFLARE': 'Flare', 'FLARE': 'Flare',
    'SKINNY': 'Skinny', 'STRAIGHT': 'Straight', 'MOM': 'Mom', 'CARGO': 'Cargo', 'BERMUDA': 'Bermuda'
  };
  return map[label.toUpperCase()] || label;
}

// Algunas categorías se muestran en plural, pero Supabase guarda el fit en
// singular (por ejemplo, el menú dice "Cargos" y el producto usa "Cargo").
function normalizeCategoryLabel(label: string): string {
  const map: Record<string, string> = {
    CARGOS: 'Cargo',
    CARGO: 'Cargo',
    BERMUDAS: 'Bermuda',
    BERMUDA: 'Bermuda',
  };
  const clean = label.trim().toUpperCase();
  return map[clean] || label.trim();
}

export const CatalogGrid: React.FC<CatalogGridProps> = ({ products }) => {
  const searchParams = useSearchParams();
  const syncedProducts = useCatalogSync(products);
  const [displayProducts, setDisplayProducts] = useState<Product[]>(syncedProducts);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [customProductsOrder, setCustomProductsOrder] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'top' | 'price-asc' | 'price-desc' | 'name'>('top');

  // Filtros de prendas (estilo colecciones del sitio)
  const [activeCategory, setActiveCategory] = useState<string>('Todos');
  const [activeFit, setActiveFit] = useState<string>('Todos');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeCollection, setActiveCollection] = useState<string>('');
  const [activeGender, setActiveGender] = useState<string>('todos');

  // Top sellers (rotación real: unidades vendidas en pedidos confirmados)
  const [topUnitsById, setTopUnitsById] = useState<Map<string, number>>(new Map());

  const refreshOrders = () => {
    getCatalogProductsOrder().then(setCustomProductsOrder);
  };

  useEffect(() => {
    refreshOrders();
    window.addEventListener('ush_categories_updated', refreshOrders);
    window.addEventListener('ush_products_updated', refreshOrders);
    return () => {
      window.removeEventListener('ush_categories_updated', refreshOrders);
      window.removeEventListener('ush_products_updated', refreshOrders);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    getTopSellingProducts(30).then((list) => {
      if (cancelled || list.length === 0) return;
      setTopUnitsById(new Map(list.map((t) => [t.id, t.units])));
    });
    return () => { cancelled = true; };
  }, []);

  // Lee los filtros del menú superior (?categoria=...&fit=...) y la búsqueda (?buscar=...&coleccion=2026)
  useEffect(() => {
    const cat = searchParams.get('categoria');
    const fit = searchParams.get('fit');
    const buscar = searchParams.get('buscar');
    const coleccion = searchParams.get('coleccion');
    const genero = searchParams.get('genero');
    // Cada navegación reemplaza el estado completo: los parámetros ausentes
    // deben limpiar el filtro anterior y no quedarse pegados entre categorías.
    setActiveCategory(cat || 'Todos');
    setActiveFit(fit ? normalizeFitLabel(fit) : 'Todos');
    setSearchQuery(buscar || '');
    setActiveCollection(coleccion || '');
    setActiveGender(genero || 'todos');
  }, [searchParams]);

  // Supabase es la fuente de verdad: usamos los productos que trae el servidor
  // (o los que refresca la sincronización realtime).
  useEffect(() => {
    const updateList = () => {
      setDisplayProducts(syncedProducts.filter((p) => !p.hidden && p.status !== 'draft'));
    };
    updateList();

    const onProductsUpdated = () => updateList();
    window.addEventListener('ush_products_updated', onProductsUpdated);

    return () => {
      window.removeEventListener('ush_products_updated', onProductsUpdated);
    };
  }, [syncedProducts]);

  // Reset pagination only when the visible query changes. The catalog is
  // refreshed from the edge after mounting and on realtime updates; resetting
  // here on every data-array replacement made "Cargar más" jump back to the
  // first page while the shopper was browsing.
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [activeCategory, activeFit, searchQuery, sortBy, activeCollection, activeGender]);

  // Public grid: only complete products (photo + title + detailed description)
  const visibleProducts = displayProducts.filter((p) => isCompleteProduct(p));

  // ── Filtro de prendas (aplica al catálogo completo) ──
  const catalogProducts = visibleProducts.filter((p) => {
    const name = (p.name || '').toLowerCase();
    const tags = (p.tags || []).join(' ').toLowerCase();
    const ref = (p.reference || '').toLowerCase();
    const searchTerm = searchQuery.trim().toLowerCase();

    if (searchTerm) {
      const haystack = [name, ref, (p.fit || '').toLowerCase(), (p.category || '').toLowerCase(), (p.color || '').toLowerCase(), tags].join(' ');
      if (!haystack.includes(searchTerm)) return false;
    }

    // Filtro colección 2026: solo refs del set references2026
    if (activeCollection === '2026') {
      if (!isReference2026(p.reference)) return false;
    }

    // Filtro de género Hombre: solo refs del set menCatalog
    if (activeGender === 'hombre') {
      if (!isMenReference(p.reference)) return false;
    }

    if (activeCategory !== 'Todos') {
      const cat = normalizeCategoryLabel(p.category || '').toLowerCase();
      const catActive = normalizeCategoryLabel(activeCategory).toLowerCase();
      // La categoría real del producto manda: solo se cae a coincidencia por
      // nombre/tags cuando el producto no tiene categoría registrada. Esto
      // evita que un "jean vaquero" de otra categoría aparezca bajo JEANS.
      if (cat !== catActive) {
        if (!cat) {
          const catWord = new RegExp(`(^|[^a-z0-9])${catActive.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^a-z0-9]|$)`, 'i');
          if (!(catWord.test(name) || catWord.test(tags))) return false;
        } else {
          return false;
        }
      }
    }
    if (activeFit !== 'Todos') {
      const fit = normalizeFitLabel(p.fit || '').toLowerCase();
      const fitActive = activeFit.toLowerCase();
      // El fit real del producto manda: solo se cae a coincidencia por
      // nombre/tags cuando el producto no tiene fit declarado. Así "Vaquero"
      // no arrastra un "Jean vaquero flare" cuyo fit real es Flare.
      if (fit) {
        if (fit !== fitActive) return false;
      } else {
        const word = new RegExp(`(^|[^a-z0-9])${fitActive.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^a-z0-9]|$)`, 'i');
        if (!(word.test(name) || word.test(tags))) return false;
      }
    }
    return true;
  });

  /** Un producto tiene foto si al menos una imagen no está vacía. */
  const hasPhoto = (p: Product) =>
    Array.isArray(p.images) && p.images.length > 0 && !!p.images[0] && p.images[0].trim() !== '';

  const paginatedProducts = useMemo(() => {
    const sorted = [...catalogProducts];
    switch (sortBy) {
      case 'top': {
        const orderMap = new Map<string, number>();
        if (customProductsOrder && customProductsOrder.length > 0) {
          customProductsOrder.forEach((id, idx) => orderMap.set(id, idx));
        }

        sorted.sort((a, b) => {
          const aManual = orderMap.get(a.id);
          const bManual = orderMap.get(b.id);
          if (aManual !== undefined && bManual !== undefined) return aManual - bManual;
          if (aManual !== undefined) return -1;
          if (bManual !== undefined) return 1;

          const aTop = topUnitsById.get(a.id) ?? 0;
          const bTop = topUnitsById.get(b.id) ?? 0;
          if (bTop !== aTop) return bTop - aTop;
          return 0;
        });
        break;
      }
      case 'price-asc':
        sorted.sort((a, b) => (a.price || 0) - (b.price || 0));
        break;
      case 'price-desc':
        sorted.sort((a, b) => (b.price || 0) - (a.price || 0));
        break;
      case 'name':
        sorted.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'es'));
        break;
    }

    // Reordenación global: referencias 2026 al inicio, sin foto al final.
    // Se aplica DESPUÉS del orden seleccionado por el usuario, de modo que
    // dentro de cada bloque (2026 / resto / sin foto) se mantiene el sort elegido.
    sorted.sort((a, b) => {
      const a2026 = isReference2026(a.reference);
      const b2026 = isReference2026(b.reference);
      const aPhoto = hasPhoto(a);
      const bPhoto = hasPhoto(b);

      // Prioridad: 0 = 2026 con foto, 1 = 2026 sin foto, 2 = resto con foto, 3 = sin foto
      const tier = (is2026: boolean, photo: boolean) =>
        is2026 ? (photo ? 0 : 1) : (photo ? 2 : 3);

      const ta = tier(a2026, aPhoto);
      const tb = tier(b2026, bPhoto);
      return ta - tb;
    });

    return sorted.slice(0, visibleCount);
  }, [catalogProducts, sortBy, topUnitsById, customProductsOrder, visibleCount]);
  const hasMore = visibleCount < catalogProducts.length;

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + PAGE_SIZE);
  };

  return (
    <section id="catalogo" className="scroll-mt-20 bg-white">
      <div className="py-4 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {paginatedProducts.length > 0 ? (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {paginatedProducts.map((product, i) => (
                  <div
                    key={product.id}
                    className={`animate-fadeInUp delay-${Math.min((i % 4) * 100 + 100, 500)}`}
                  >
                    <ProductCard product={product} isTopSeller={(topUnitsById.get(product.id) ?? 0) > 0} />
                  </div>
                ))}
              </div>

              {/* Load More Button */}
              {hasMore && (
                <div className="mt-12 text-center">
                  <button
                    onClick={handleLoadMore}
                    className="inline-flex items-center gap-2 bg-[#1b2333] text-white text-xs font-bold uppercase tracking-widest px-10 py-4 hover:bg-[#d88193] transition-colors shadow-md group"
                  >
                    <span>Cargar más ({catalogProducts.length - visibleCount} referencias restantes)</span>
                    <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                  <p className="text-[11px] text-neutral-400 mt-3">
                    Mostrando {paginatedProducts.length} de {catalogProducts.length} referencias
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-20 bg-neutral-50 border border-dashed border-gray-200">
              <Flame size={36} className="mx-auto text-neutral-300 mb-3" />
              <p className="text-sm font-bold uppercase text-neutral-700">No hay prendas en esta categoría</p>
              <p className="text-xs text-neutral-400 mt-1">
                {activeCategory === 'Cargos'
                  ? 'Estamos añadiendo cargos a la colección. Pronto habrá novedades.'
                  : 'Prueba con otra categoría o fit.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
