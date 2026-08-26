import { createClient } from '@supabase/supabase-js';
import { Product, WholesaleLead } from '@/types';
import { INITIAL_PRODUCTS } from '@/data/products';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://uwfkwcrqqwruzfwzppjf.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_kOqjv3pdiOQoIp0AHKXWeg_H61J-N2g';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

const PRODUCTS_STORAGE_KEY = 'ush_products_override_v6';

// Perfil LIGERO para listados/carrito: evita `select('*')` y no baja los campos
// pesados (full_description, video_url, options, tags, color) que inflan el egress.
// `description` y `stock_by_size` se conservan porque el filtrado público y el
// stock por talla los necesitan.
export const PRODUCT_LIST_COLUMNS = `id,reference,slug,name,price,suggested_price,compare_price,ribbon,fit,is_best_seller,images,category,category_id,hidden,in_stock,status,description,stock_by_size`;

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
  fit: item.fit ?? '',
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

// Un producto es visible si tiene foto o nombre válido y no está marcado como oculto.
export function isCompleteProduct(p: Product): boolean {
  if (!p) return false;
  const hasImage = Array.isArray(p.images) && p.images.length > 0 && !!p.images[0] && p.images[0].trim() !== '';
  const title = (p.name || '').trim();
  const hasTitle = title.length > 0;
  return hasImage || hasTitle;
}

export async function fetchProductsFromSupabase(opts: { slim?: boolean } = {}): Promise<Product[]> {
  // Supabase es la única fuente de verdad: cualquier cambio del admin
  // (agregar / editar / ocultar / eliminar) se refleja en cualquier
  // dispositivo, URL o IP. Solo si Supabase falla se usa el catálogo estático.
  try {
    const { data, error } = await supabase
      .from('products')
      .select(opts.slim ? PRODUCT_LIST_COLUMNS : '*')
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
      triggerRevalidate();
      return { success: true, error: undefined };
    }
    if (error) {
      return { success: false, error: error.message };
    }
    // Reflejo inmediato: purga el caché del sitio público
    triggerRevalidate();
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// Actualización ligera del inventario (stock por talla) desde el listado del
// admin, sin tocar el resto de campos del producto. Si se indica inStock, se
// sincroniza también el estado de disponibilidad del producto.
export async function updateProductStock(id: string, stockBySize: Record<string, number>, inStock?: boolean): Promise<{ success: boolean; error?: string }> {
  try {
    const patch: any = { stock_by_size: stockBySize };
    if (typeof inStock === 'boolean') patch.in_stock = inStock;
    const { error } = await supabase.from('products').update(patch).eq('id', id);
    if (error) return { success: false, error: error.message };
    triggerRevalidate();
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
    triggerRevalidate();
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
  // Se sanitiza el slug ANTES de interpolarlo: comas/paréntesis permitirían
  // inyectar condiciones arbitrarias en el filtro .or() de PostgREST.
  const safeSlug = String(slug || '').trim().replace(/[^a-zA-Z0-9_-]/g, '');
  if (!safeSlug) return null;

  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .or(`slug.eq.${safeSlug},id.eq.${safeSlug}`)
      // No exponer borradores/productos ocultos por URL directa
      // (o() con is.null evita excluir filas donde la columna es NULL)
      .or('hidden.is.null,hidden.eq.false')
      .or('status.is.null,status.neq.draft')
      .limit(1)
      .maybeSingle();

    if (!error && data) {
      return mapProductRow(data);
    }
  } catch (_) {
    // Supabase unavailable – fall through to static data
  }

  // Fallback: search in static INITIAL_PRODUCTS list (también sin ocultos)
  const match = INITIAL_PRODUCTS.find(
    (p) => (p.slug === slug || p.id === slug) && !p.hidden && p.status !== 'draft'
  );
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
    // Server-side safety: force status to 'pending' so the client can never
    // bypass the confirm/cancel workflow or create pre-confirmed orders.
    const safePayload = {
      ...orderData,
      status: 'pending',
      customer_name: String(orderData.customer_name || '').trim(),
      customer_doc: String(orderData.customer_doc || '').trim(),
      customer_phone: String(orderData.customer_phone || '').trim(),
      city: String(orderData.city || '').trim(),
    };

    // Reject orders with missing critical fields before hitting the DB.
    if (!safePayload.customer_name || !safePayload.customer_doc || !safePayload.city) {
      return { success: false, error: 'Faltan campos obligatorios: nombre, documento o ciudad.' };
    }
    if (!Array.isArray(safePayload.items) || safePayload.items.length === 0) {
      return { success: false, error: 'El pedido debe contener al menos un producto.' };
    }

    // IMPORTANTE: NO usar .select() aquí. PostgREST convierte .select() en
    // "Prefer: return=representation", que la política RLS de orders rechaza
    // con 42501. Sin ese header el INSERT funciona (201).
    const { data, error } = await supabase.from('orders').insert([safePayload]);
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
// orden como 'confirmed'. Es idempotente: solo procesa la orden si sigue en
// estado 'pending' (reclamo atómico), y lee el stock FRESCO de la BD para cada
// ítem evitando pisar cambios hechos por otras sesiones (lost updates).
export async function confirmOrderAndDeductStock(
  order: any,
  _productsRef?: Product[]
): Promise<{ success: boolean; error?: string; changed?: boolean }> {
  try {
    // 1. Reclamo atómico: solo continúa si la orden aún está 'pending'.
    //    Si otro confirmación llegó primero (p. ej. tras un timeout), aquí
    //    termina sin volver a descontar inventario (doble descuento).
    const claim = await supabase
      .from('orders')
      .update({ status: 'confirmed' }, { count: 'exact' })
      .eq('id', order.id)
      .eq('status', 'pending');
    if (claim.error) return { success: false, error: `estado: ${claim.error.message}` };
    if ((claim.count ?? 0) === 0) {
      const { data: current } = await supabase.from('orders').select('status').eq('id', order.id).maybeSingle();
      if (current?.status === 'confirmed') return { success: true, changed: false };
      return { success: false, error: 'La orden ya no está pendiente; no se modificó el inventario.' };
    }

    const items: Array<{ product_id?: string; reference?: string; size?: string; quantity?: number }> =
      Array.isArray(order.items) ? order.items : [];
    let changed = false;

    for (const item of items) {
      const qty = Number(item.quantity) || 0;
      const size = String(item.size || '').trim();
      const pid = item.product_id;
      if (qty <= 0 || !size || !pid) continue;

      // Lee el stock actual directamente de la BD (no del snapshot local)
      const { data: row, error: readErr } = await supabase
        .from('products')
        .select('stock_by_size')
        .eq('id', pid)
        .maybeSingle();
      if (readErr || !row) continue;

      let stock: Record<string, number>;
      try {
        stock = typeof row.stock_by_size === 'string' ? JSON.parse(row.stock_by_size || '{}') : (row.stock_by_size || {});
      } catch (_) {
        stock = {};
      }
      const currentStock = Number(stock[size] ?? 0);
      if (currentStock <= 0) continue;

      stock[size] = Math.max(0, currentStock - qty);
      changed = true;

      const { error } = await supabase.from('products').update({ stock_by_size: stock }).eq('id', pid);
      if (error) return { success: false, error: `stock ${pid}: ${error.message}` };
    }

    if (changed) publishCatalogChange();
    return { success: true, changed };
  } catch (err: any) {
    return { success: false, error: err.message };
 }
}

// Cancela una orden (carrito abandonado / cliente no tomó el pedido):
// si estaba confirmada, restaura el stock descontado; marca la orden como
// 'canceled' y publica el cambio. Reclamo atómico + stock fresco de la BD.
export async function cancelOrderAndRestoreStock(
  order: any,
  _productsRef?: Product[]
): Promise<{ success: boolean; error?: string; changed?: boolean }> {
  try {
    // 1. Lee el estado real de la orden para saber si debe restaurar inventario
    const { data: currentOrder, error: readErr } = await supabase
      .from('orders')
      .select('status')
      .eq('id', order.id)
      .maybeSingle();
    if (readErr) return { success: false, error: `estado: ${readErr.message}` };
    const wasConfirmed = currentOrder?.status === 'confirmed';

    // 2. Reclamo atómico: solo cancela si sigue 'pending' o 'confirmed'
    const claim = await supabase
      .from('orders')
      .update({ status: 'canceled' }, { count: 'exact' })
      .eq('id', order.id)
      .in('status', ['pending', 'confirmed']);
    if (claim.error) return { success: false, error: `estado: ${claim.error.message}` };
    if ((claim.count ?? 0) === 0) {
      return { success: false, error: 'La orden ya fue procesada con otro estado.' };
    }

    let changed = false;
    if (wasConfirmed) {
      const items: Array<{ product_id?: string; reference?: string; size?: string; quantity?: number }> =
        Array.isArray(order.items) ? order.items : [];

      for (const item of items) {
        const qty = Number(item.quantity) || 0;
        const size = String(item.size || '').trim();
        const pid = item.product_id;
        if (qty <= 0 || !size || !pid) continue;

        const { data: row, error: rowErr } = await supabase
          .from('products')
          .select('stock_by_size')
          .eq('id', pid)
          .maybeSingle();
        if (rowErr || !row) continue;

        let stock: Record<string, number>;
        try {
          stock = typeof row.stock_by_size === 'string' ? JSON.parse(row.stock_by_size || '{}') : (row.stock_by_size || {});
        } catch (_) {
          stock = {};
        }
        stock[size] = (Number(stock[size] ?? 0) || 0) + qty;
        changed = true;

        const { error } = await supabase.from('products').update({ stock_by_size: stock }).eq('id', pid);
        if (error) return { success: false, error: `stock ${pid}: ${error.message}` };
      }
    }

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

// Pide al servidor purgar el caché del edge (verifica la sesión del admin;
// sin token o sin sesión de admin el endpoint responde 401/403 y se ignora).
// Exportada para que cualquier guardado (contenido, tema, WhatsApp…) purgue.
export function triggerRevalidate() {
  try {
    if (typeof window !== 'undefined') {
      supabase.auth
        .getSession()
        .then(({ data }) => {
          const token = data.session?.access_token;
          if (!token) return;
          fetch('/api/revalidate', { method: 'POST', headers: { Authorization: `Bearer ${token}` } }).catch(() => {});
        })
        .catch(() => {});
    }
  } catch (e) {
    console.error('revalidate error:', e);
  }
}

export function publishCatalogChange() {
  sendBroadcast('catalog-changed');
  triggerRevalidate();
}

export function publishOrderChange() {
  sendBroadcast('order-changed');
  triggerRevalidate();
}

// Notifica que un nuevo usuario se acaba de registrar.
// El broadcast lo emite el servidor (/api/auth/register-notify);
// esta función del cliente sirve como fallback si se necesita emitir desde browser.
export function publishUserRegistered() {
  sendBroadcast('user-registered');
}

export function subscribeCatalogChanges(
  cb: () => void,
  onUserRegistered?: (payload?: { email?: string; name?: string }) => void
): () => void {
  if (typeof window === 'undefined') return () => {};
  try {
    const ch = supabase.channel(SYNC_CHANNEL);
    ch
      .on('broadcast', { event: 'catalog-changed' }, () => cb())
      .on('broadcast', { event: 'order-changed' }, () => cb())
      .on('broadcast', { event: 'user-registered' }, ({ payload }) => {
        // Refresca la lista de clientes del admin
        cb();
        // Si el admin pasó un callback dedicado, lo ejecuta con los datos del nuevo usuario
        if (onUserRegistered) onUserRegistered(payload as { email?: string; name?: string });
      })
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

// ── TOP SELLERS CALCULATION (rotación de inventario: pedidos confirmados) ──
const TOP_SELLERS_CACHE_KEY = 'ush_top_sellers_cache_v3';

export interface TopSellingProduct { id: string; units: number }

export async function getTopSellingProducts(daysBack = 30): Promise<TopSellingProduct[]> {
  if (typeof window !== 'undefined') {
    try {
      const cached = localStorage.getItem(TOP_SELLERS_CACHE_KEY);
      if (cached) {
        const { timestamp, list } = JSON.parse(cached);
        // Cache válida 1 hora (antes 12 h): badges y orden más frescos
        if (Date.now() - timestamp < 60 * 60 * 1000 && Array.isArray(list) && list.length > 0) {
          return list;
        }
      }
    } catch (e) {
      console.error('Error reading top sellers cache:', e);
    }
  }

  try {
    // Edge-first: la RPC se sirve cacheada desde Vercel (/api/top-sellers), así el
    // egress de Supabase no crece con cada visitante. Si Vercel falla (sin cuota,
    // caída), caemos directo a la RPC de Supabase como respaldo.
    if (typeof window !== 'undefined') {
      try {
        const res = await fetch('/api/top-sellers');
        if (res.ok) {
          const list = (await res.json()) as TopSellingProduct[];
          if (Array.isArray(list) && list.length > 0) {
            try {
              localStorage.setItem(TOP_SELLERS_CACHE_KEY, JSON.stringify({ timestamp: Date.now(), list }));
            } catch (e) {}
            return list;
          }
        }
      } catch (e) {}
    }

    // La lectura directa de orders ya no está abierta al público (RLS).
    // Usamos una función RPC con SECURITY DEFINER que solo devuelve ids + unidades
    // de pedidos confirmados (salida real de inventario).
    const { data, error } = await supabase.rpc('get_top_selling_ids', { days_back: daysBack });

    if (!error && data && data.length > 0) {
      const list: TopSellingProduct[] = (data as Array<{ id: string; units: number }>).map((r) => ({
        id: r.id,
        units: Number(r.units) || 0,
      }));

      if (typeof window !== 'undefined' && list.length > 0) {
        try {
          localStorage.setItem(
            TOP_SELLERS_CACHE_KEY,
            JSON.stringify({ timestamp: Date.now(), list })
          );
        } catch (e) {}
      }

      return list;
    }
  } catch (e) {
    console.error('Failed to fetch top sellers:', e);
  }

  return [];
}

export async function getTopSellingProductIds(): Promise<string[]> {
  const list = await getTopSellingProducts(30);
  return list.map((p) => p.id);
}
