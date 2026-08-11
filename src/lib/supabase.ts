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
      description: item.description || '',
      full_description: item.full_description || '',
      video_url: item.video_url || '',
      in_stock: item.in_stock !== false,
      hidden: item.hidden === true,
      options: typeof item.options === 'string' ? JSON.parse(item.options) : (item.options || []),
      images: Array.isArray(item.images) ? item.images : (item.images ? [item.images] : []),
      category_id: item.category_id
    }));
  } catch (err) {
    return INITIAL_PRODUCTS;
  }
}

export async function fetchProductBySlug(slug: string): Promise<Product | null> {
  const allProducts = await fetchProductsFromSupabase();
  const match = allProducts.find(p => p.slug === slug || p.id === slug);
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

export async function submitOrder(orderData: any) {
  try {
    const { data, error } = await supabase.from('orders').insert([orderData]);
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
