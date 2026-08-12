import { createClient } from '@supabase/supabase-js';
import { Product, WholesaleLead } from '@/types';
import { INITIAL_PRODUCTS } from '@/data/products';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://uwfkwcrqqwruzfwzppjf.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_kOqjv3pdiOQoIp0AHKXWeg_H61J-N2g';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

const PRODUCTS_STORAGE_KEY = 'ush_products_override_v2';

export function getLocalProductsOverride(): Product[] | null {
  if (typeof window === 'undefined') return null;
  try {
    const saved = localStorage.getItem(PRODUCTS_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
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

export async function fetchProductsFromSupabase(): Promise<Product[]> {
  // 1. Check local storage override first (for immediate admin edits reflection)
  const localOverride = getLocalProductsOverride();
  if (localOverride && localOverride.length > 0) {
    return localOverride;
  }

  // 2. Fallback to Supabase fetch
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data || data.length === 0) {
      return INITIAL_PRODUCTS;
    }

    return data.map((item) => ({
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
      category_id: item.category_id
    }));
  } catch (err) {
    return INITIAL_PRODUCTS;
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
    const { data, error } = await supabase.from('orders').insert([orderData]).select();
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err.message };
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
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data, error } = await supabase
      .from('orders')
      .select('items')
      .gte('created_at', thirtyDaysAgo.toISOString());

    if (error || !data || data.length === 0) {
      return [];
    }

    const salesMap: Record<string, number> = {};
    data.forEach((order: any) => {
      const itemsArr = Array.isArray(order.items) ? order.items : [];
      itemsArr.forEach((item: any) => {
        const key = item.product_id || item.reference;
        if (key) {
          salesMap[key] = (salesMap[key] || 0) + (Number(item.quantity) || 1);
        }
      });
    });

    const topIds = Object.entries(salesMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id]) => id);

    if (typeof window !== 'undefined' && topIds.length > 0) {
      try {
        localStorage.setItem(
          TOP_SELLERS_CACHE_KEY,
          JSON.stringify({ timestamp: Date.now(), ids: topIds })
        );
      } catch (e) {}
    }

    return topIds;
  } catch (e) {
    return [];
  }
}
