import { createClient } from '@supabase/supabase-js';
import { Product, WholesaleLead } from '@/types';
import { INITIAL_PRODUCTS } from '@/data/products';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://uwfkwcrqqwruzfwzppjf.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_kOqjv3pdiOQoIp0AHKXWeg_H61J-N2g';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function fetchProductsFromSupabase(): Promise<Product[]> {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data || data.length === 0) {
      console.warn('Supabase fetch products empty or returned error, using initial dataset:', error?.message);
      return INITIAL_PRODUCTS;
    }

    return data.map((item) => ({
      id: item.id,
      name: item.name,
      reference: item.reference || item.name.replace(/ref:?/i, '').trim(),
      slug: item.slug,
      price: Number(item.price),
      compare_price: item.compare_price ? Number(item.compare_price) : 0,
      ribbon: item.ribbon || '',
      description: item.description || '',
      in_stock: item.in_stock !== false,
      options: typeof item.options === 'string' ? JSON.parse(item.options) : (item.options || []),
      images: Array.isArray(item.images) ? item.images : (item.images ? [item.images] : []),
      category_id: item.category_id
    }));
  } catch (err) {
    console.error('Error connecting to Supabase:', err);
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
      console.error('Error inserting wholesale lead:', error);
      return { success: false, error: error.message };
    }
    return { success: true, data };
  } catch (err: any) {
    console.error('Submission failed:', err);
    return { success: false, error: err.message };
  }
}

export async function submitOrder(orderData: any) {
  try {
    const { data, error } = await supabase.from('orders').insert([orderData]);
    if (error) {
      console.error('Error submitting order:', error);
      return { success: false, error: error.message };
    }
    return { success: true, data };
  } catch (err: any) {
    console.error('Order submission failed:', err);
    return { success: false, error: err.message };
  }
}
