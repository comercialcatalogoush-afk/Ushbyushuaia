import { createClient } from '@supabase/supabase-js';
import { Product, WholesaleLead } from '@/types';
import { INITIAL_PRODUCTS } from '@/data/products';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://uwfkwcrqqwruzfwzppjf.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_kOqjv3pdiOQoIp0AHKXWeg_H61J-N2g';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

const PRODUCTS_STORAGE_KEY = 'ush_products_override_v6';

export function getLocalProductsOverride(): Product[] | null {
  if (typeof window === 'undefined') return null;
  try {
    // Purge obsolete legacy cache keys that were trapping old empty-image data
    localStorage.removeItem('ush_products_override_v4');
    localStorage.removeItem('ush_products_override_v3');
    localStorage.removeItem('ush_products_override_v2');
    localStorage.removeItem('ush_products_override');

    const saved = localStorage.getItem(PRODUCTS_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const existingRefs = new Set(parsed.map((p: Product) => p.reference || p.id));
        const missing = INITIAL_PRODUCTS.filter((p) => !existingRefs.has(p.reference) && !existingRefs.has(p.id));
        const merged = [...parsed, ...missing];

        // The admin override is authoritative for edits (name, prices, category,
        // fit, description, tags, stock, hidden, ribbon). Images always come from
        // the Drive bridge (INITIAL_PRODUCTS) so updates to the bridge propagate
        // even when the local override was saved with stale Drive data.
        const byRef = new Map(INITIAL_PRODUCTS.map((p) => [p.reference || p.id, p]));
        return merged.map((p) => {
          const base = byRef.get(p.reference || p.id);
          if (base && base.images && base.images.length > 0) {
            return { ...p, images: base.images };
          }
          return p;
        });
      }
    }
  } catch (e) {
    console.error('Error reading local products override:', e);
  }
  return null;
}

export function saveLocalProductsOverride(products: Product[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(products));
    window.dispatchEvent(new Event('ush_products_updated'));
  } catch (e) {
    console.error('Error saving local products override:', e);
  }
}

const mapProductRow = (item: any): Product => ({
  id: item.id,
  name: item.name,
  reference: item.reference || item.name.replace(/ref:?/i, '').trim(),
  slug: item.slug,
  suggested_price: item.suggested_price ? Number(item.suggested_price) : Number(item.compare_price || item.price || 49900),
  price: Number(item.price),
  compare_price: item.compare_price ? Number(item.compare_price) : 0,
  ribbon: item.ribbon || '',
  fit: item.fit || 'Wide Leg',
  status: item.status || (item.hidden ? 'draft' : 'published'),
  stock_by_size: typeof item.stock_by_size === 'string' ? JSON.parse(item.stock_by_size) : (item.stock_by_size || { '6': 10, '8': 10, '10': 10, '12': 10, '14': 10 }),
  is_best_seller: item.is_best_seller === true,
  description: item.description || '',
  full_description: item.full_description || '',
  video_url: item.video_url || '',
  in_stock: item.in_stock !== false,
  hidden: item.hidden === true || item.status === 'draft',
  options: typeof item.options === 'string' ? JSON.parse(item.options) : (item.options || []),
  images: Array.isArray(item.images) ? item.images : (item.images ? [item.images] : []),
  tags: Array.isArray(item.tags) ? item.tags : [],
  category: item.category || '',
  color: item.color || '',
  category_id: item.category_id
});

// Merge Supabase rows with INITIAL_PRODUCTS so the full 90-ref catalog always shows
function mergeWithInitial(supabaseProducts: Product[]): Product[] {
  const supabaseIds = new Set(supabaseProducts.map((p) => p.id));
  const supabaseSlugs = new Set(supabaseProducts.map((p) => p.slug));
  const localOnly = INITIAL_PRODUCTS.filter(
    (p) => !supabaseIds.has(p.id) && !supabaseSlugs.has(p.slug)
  );
  return [...supabaseProducts, ...localOnly];
}

// Un producto es "completo" (visible al público) si tiene foto, título y
// descripción detallada. Los incompletos (ej. "REF: 552631") se ocultan del
// público para que el admin los complete desde el panel.
export function isCompleteProduct(p: Product): boolean {
  const hasImage = Array.isArray(p.images) && p.images.length > 0 && !!p.images[0] && p.images[0].trim() !== '';
  const title = (p.name || '').trim();
  const hasTitle = title.length > 0 && !/^REF:?\s*\d+$/i.test(title);
  const desc = (p.description || '').trim();
  const hasDetail = desc.length >= 30 && !/^REF:?\s*\d+$/i.test(desc);
  return hasImage && hasTitle && hasDetail;
}

export async function fetchProductsFromSupabase(): Promise<Product[]> {
  // Supabase es la única fuente de verdad: cualquier cambio del admin
  // (agregar / editar / ocultar / eliminar) se refleja en cualquier
  // dispositivo, URL o IP. Solo si Supabase falla se usa el catálogo estático.
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data || data.length === 0) {
      return INITIAL_PRODUCTS;
    }

    return data.map(mapProductRow);
  } catch (err) {
    return INITIAL_PRODUCTS;
  }
}

// ── ADMIN-ONLY: Always fetch directly from Supabase + merge with INITIAL_PRODUCTS ──
// This bypasses localStorage so the admin always sees ALL products (including ones
// not yet saved to localStorage on the current device).
export async function fetchAllProductsAdmin(): Promise<Product[]> {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1000); // ensure no implicit 100-row cap

    if (!error && data && data.length > 0) {
      return mergeWithInitial(data.map(mapProductRow));
    }
  } catch (e) {
    console.error('fetchAllProductsAdmin Supabase error:', e);
  }

  // Fallback: return local override if available, else INITIAL_PRODUCTS
  const localOverride = getLocalProductsOverride();
  return localOverride && localOverride.length > 0 ? localOverride : INITIAL_PRODUCTS;
}

// ── PERSISTENCE: Save / Update / Delete a product in Supabase ──
export async function upsertProduct(product: Product): Promise<{ success: boolean; error?: string }> {
  const buildPayload = (withColor: boolean) => ({
    id: product.id,
    name: product.name,
    reference: product.reference || product.name.replace(/ref:?/i, '').trim(),
    slug: product.slug,
    suggested_price: product.suggested_price || 0,
    price: product.price || 0,
    compare_price: product.compare_price || product.suggested_price || 0,
    ribbon: product.ribbon || '',
    fit: product.fit || 'Wide Leg',
    status: product.status || (product.hidden ? 'draft' : 'published'),
    stock_by_size: product.stock_by_size || {},
    is_best_seller: product.is_best_seller === true,
    description: product.description || '',
    full_description: product.full_description || '',
    video_url: product.video_url || '',
    in_stock: product.in_stock !== false,
    hidden: product.hidden === true || product.status === 'draft',
    options: product.options || [],
    images: product.images || [],
    tags: product.tags || [],
    category: product.category || '',
    category_id: product.category_id || null,
    ...(withColor ? { color: product.color || '' } : {})
  });

  try {
    const { error } = await supabase
      .from('products')
      .upsert(buildPayload(true), { onConflict: 'id' });
    if (error && /column\s+"color"|column color/i.test(error.message)) {
      // Columna aún no existe en la BD: reintenta sin color (no romper el guardado)
      const { error: retryError } = await supabase
        .from('products')
        .upsert(buildPayload(false), { onConflict: 'id' });
      if (retryError) return { success: false, error: retryError.message };
      return { success: true, error: undefined };
    }
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function deleteProductFromSupabase(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// ── PRODUCT IMAGE STORAGE (Supabase Storage, public bucket) ──
const PRODUCT_IMAGES_BUCKET = 'product-images';

export async function uploadProductImage(
  blob: Blob,
  path: string
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const { error } = await supabase.storage
      .from(PRODUCT_IMAGES_BUCKET)
      .upload(path, blob, { contentType: 'image/jpeg', upsert: true });

    if (error) {
      return { success: false, error: error.message };
    }
    const { data } = supabase.storage.from(PRODUCT_IMAGES_BUCKET).getPublicUrl(path);
    return { success: true, url: data.publicUrl };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function deleteProductImage(path: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.storage.from(PRODUCT_IMAGES_BUCKET).remove([path]);
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}


export async function fetchProductBySlug(slug: string): Promise<Product | null> {
  // On the server localStorage is unavailable, so we query Supabase directly
  // to ensure newly-added products (not yet in INITIAL_PRODUCTS) resolve correctly.
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .or(`slug.eq.${slug},id.eq.${slug}`)
      .limit(1)
      .single();

    // Busca directa sin interpolación dentro del filtro (evita inyección PostgREST)
    if (error) {
      const safeSlug = slug.replace(/[^a-zA-Z0-9-]/g, '');
      const fallback = await supabase
        .from('products')
        .select('*')
        .or(`slug.eq.${safeSlug},id.eq.${safeSlug}`)
        .limit(1)
        .maybeSingle();
      if (!fallback.error && fallback.data) {
        return {
          id: fallback.data.id,
          name: fallback.data.name,
          reference: fallback.data.reference || fallback.data.name.replace(/ref:?/i, '').trim(),
          slug: fallback.data.slug,
          suggested_price: fallback.data.suggested_price ? Number(fallback.data.suggested_price) : Number(fallback.data.compare_price || fallback.data.price || 49900),
          price: Number(fallback.data.price),
          compare_price: fallback.data.compare_price ? Number(fallback.data.compare_price) : 0,
          ribbon: fallback.data.ribbon || '',
          fit: fallback.data.fit || 'Wide Leg',
          status: fallback.data.status || (fallback.data.hidden ? 'draft' : 'published'),
          stock_by_size: typeof fallback.data.stock_by_size === 'string' ? JSON.parse(fallback.data.stock_by_size) : (fallback.data.stock_by_size || { '6': 10, '8': 10, '10': 10, '12': 10, '14': 10 }),
          is_best_seller: fallback.data.is_best_seller === true,
          description: fallback.data.description || '',
          full_description: fallback.data.full_description || '',
          color: fallback.data.color || '',
          tags: Array.isArray(fallback.data.tags) ? fallback.data.tags : (fallback.data.tags ? JSON.parse(fallback.data.tags) : []),
          video_url: fallback.data.video_url || '',
          in_stock: fallback.data.in_stock !== false,
          hidden: fallback.data.hidden === true || fallback.data.status === 'draft',
          options: typeof fallback.data.options === 'string' ? JSON.parse(fallback.data.options) : (fallback.data.options || []),
          images: Array.isArray(fallback.data.images) ? fallback.data.images : (fallback.data.images ? [fallback.data.images] : []),
          category_id: fallback.data.category_id,
        };
      }
    }

    if (!error && data) {
      return {
        id: data.id,
        name: data.name,
        reference: data.reference || data.name.replace(/ref:?/i, '').trim(),
        slug: data.slug,
        suggested_price: data.suggested_price ? Number(data.suggested_price) : Number(data.compare_price || data.price || 49900),
        price: Number(data.price),
        compare_price: data.compare_price ? Number(data.compare_price) : 0,
        ribbon: data.ribbon || '',
        fit: data.fit || 'Wide Leg',
        status: data.status || (data.hidden ? 'draft' : 'published'),
        stock_by_size: typeof data.stock_by_size === 'string' ? JSON.parse(data.stock_by_size) : (data.stock_by_size || { '6': 10, '8': 10, '10': 10, '12': 10, '14': 10 }),
        is_best_seller: data.is_best_seller === true,
        description: data.description || '',
        full_description: data.full_description || '',
        color: data.color || '',
        tags: Array.isArray(data.tags) ? data.tags : (data.tags ? JSON.parse(data.tags) : []),
        video_url: data.video_url || '',
        in_stock: data.in_stock !== false,
        hidden: data.hidden === true || data.status === 'draft',
        options: typeof data.options === 'string' ? JSON.parse(data.options) : (data.options || []),
        images: Array.isArray(data.images) ? data.images : (data.images ? [data.images] : []),
        category_id: data.category_id,
      };
    }
  } catch (_) {
    // Supabase unavailable – fall through to static data
  }

  // Fallback: search in static INITIAL_PRODUCTS list
  const match = INITIAL_PRODUCTS.find(p => p.slug === slug || p.id === slug);
  return match || null;
}

export async function submitWholesaleLead(lead: WholesaleLead) {
  try {
    const { data, error } = await supabase.from('wholesale_leads').insert([lead]);
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function submitOrder(orderData: any): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    // IMPORTANTE: NO usar .select() aquí. PostgREST convierte .select() en
    // "Prefer: return=representation", que la política RLS de orders rechaza
    // con 42501. Sin ese header el INSERT funciona (201).
    const { data, error } = await supabase.from('orders').insert([orderData]);
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// ── ÓRDENES: listado y confirmación de pago (admin) ─────────────────
export async function fetchOrdersAdmin(): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(500);
    if (error || !data) return [];
    return data;
  } catch (e) {
    console.error('fetchOrdersAdmin error:', e);
    return [];
  }
}

export async function updateOrderStatus(orderId: string, status: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.from('orders').update({ status }).eq('id', orderId);
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// Confirma una orden: descuenta stock de cada ítem en products y marca la
// orden como 'confirmed'. Devuelve true y publica evento de sincronización.
export async function confirmOrderAndDeductStock(
  order: any,
  productsRef: Product[]
): Promise<{ success: boolean; error?: string; changed?: boolean }> {
  try {
    const items: Array<{ product_id?: string; reference?: string; size?: string; quantity?: number }> =
      Array.isArray(order.items) ? order.items : [];
    let changed = false;

    for (const item of items) {
      const qty = Number(item.quantity) || 0;
      const size = String(item.size || '').trim();
      const pid = item.product_id;
      if (qty <= 0 || !size || !pid) continue;

      const current = productsRef.find((p) => p.id === pid) || productsRef.find((p) => p.reference === pid);
      if (!current) continue;

      const stock = { ...(current.stock_by_size || {}) };
      const currentStock = Number(stock[size] ?? 0);
      if (currentStock <= 0) continue;

      const newStock = Math.max(0, currentStock - qty);
      stock[size] = newStock;
      changed = true;

      const { error } = await supabase.from('products').update({ stock_by_size: stock }).eq('id', current.id);
      if (error) return { success: false, error: `stock ${current.reference}: ${error.message}` };
    }

    const { error: statusErr } = await supabase.from('orders').update({ status: 'confirmed' }).eq('id', order.id);
    if (statusErr) return { success: false, error: `estado: ${statusErr.message}` };

    if (changed) publishCatalogChange();
    return { success: true, changed };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// ── REALTIME: broadcast de cambios (gratis, sin SQL) ────────────────
const SYNC_CHANNEL = 'ush-catalog-sync';

function sendBroadcast(event: string) {
  if (typeof window === 'undefined') return;
  try {
    // Emisor y receptor deben usar el MISMO canal para que el broadcast se propague
    const ch = supabase.channel(SYNC_CHANNEL);
    ch.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        ch.send({ type: 'broadcast', event, payload: { ts: Date.now() } });
        setTimeout(() => supabase.removeChannel(ch), 2000);
      }
    });
  } catch (e) {
    console.error('broadcast error:', e);
  }
}

export function publishCatalogChange() {
  sendBroadcast('catalog-changed');
}

export function publishOrderChange() {
  sendBroadcast('order-changed');
}

export function subscribeCatalogChanges(cb: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  try {
    const ch = supabase.channel(SYNC_CHANNEL);
    ch
      .on('broadcast', { event: 'catalog-changed' }, () => cb())
      .on('broadcast', { event: 'order-changed' }, () => cb())
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  } catch (e) {
    console.error('subscribe error:', e);
    return () => {};
  }
}

// ── PRICE HISTORY LOGGING ──────────────────────────────────────────
export async function logPriceChange(record: {
  product_id: string;
  product_name: string;
  old_wholesale_price: number;
  new_wholesale_price: number;
  old_suggested_price: number;
  new_suggested_price: number;
  changed_by?: string;
}) {
  try {
    const payload = {
      product_id: record.product_id,
      product_name: record.product_name,
      old_wholesale_price: record.old_wholesale_price,
      new_wholesale_price: record.new_wholesale_price,
      old_suggested_price: record.old_suggested_price,
      new_suggested_price: record.new_suggested_price,
      changed_at: new Date().toISOString(),
      changed_by: record.changed_by || 'admin@ushuaiajeans.com.co',
    };
    await supabase.from('price_history').insert([payload]);
  } catch (e) {
    console.error('Failed to log price history to Supabase:', e);
  }
}

export async function fetchPriceHistory() {
  try {
    const { data, error } = await supabase
      .from('price_history')
      .select('*')
      .order('changed_at', { ascending: false });
    if (error || !data) return [];
    return data;
  } catch (e) {
    console.error('Failed to fetch price history:', e);
    return [];
  }
}

// ── TOP SELLERS CALCULATION (Last 30 days) ──────────────────────────
const TOP_SELLERS_CACHE_KEY = 'ush_top_sellers_cache_v1';

export async function getTopSellingProductIds(): Promise<string[]> {
  if (typeof window !== 'undefined') {
    try {
      const cached = localStorage.getItem(TOP_SELLERS_CACHE_KEY);
      if (cached) {
        const { timestamp, ids } = JSON.parse(cached);
        // Cache valid for 12 hours
        if (Date.now() - timestamp < 12 * 60 * 60 * 1000 && Array.isArray(ids) && ids.length > 0) {
          return ids;
        }
      }
    } catch (e) {
      console.error('Error reading top sellers cache:', e);
    }
  }

  try {
    // La lectura directa de orders ya no está abierta al público (RLS).
    // Usamos una función RPC con SECURITY DEFINER que solo devuelve ids.
    const { data, error } = await supabase.rpc('get_top_selling_ids', { days_back: 30 });

    if (!error && data && data.length > 0) {
      const topIds: string[] = (data as Array<{ id: string }>).map((r) => r.id);

      if (typeof window !== 'undefined' && topIds.length > 0) {
        try {
          localStorage.setItem(
            TOP_SELLERS_CACHE_KEY,
            JSON.stringify({ timestamp: Date.now(), ids: topIds })
          );
        } catch (e) {}
      }

      return topIds;
    }
  } catch (e) {
    return [];
  }

  return [];
}
