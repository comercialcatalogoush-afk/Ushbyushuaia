import type { MetadataRoute } from 'next';
import { supabase } from '@/lib/supabase';

const BASE = 'https://ushbyushuaia-catalogo-mayorista.vercel.app';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE}/`, changeFrequency: 'weekly', priority: 1 },
    { url: `${BASE}/catalogo`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE}/como-comprar`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE}/contacto`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE}/rastreo`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE}/politicas`, changeFrequency: 'yearly', priority: 0.3 },
  ];

  let productRoutes: MetadataRoute.Sitemap = [];
  try {
    const { data } = await supabase.from('products').select('slug, created_at');
    if (data && data.length > 0) {
      productRoutes = data
        .filter((p) => p.slug)
        .map((p) => ({
          url: `${BASE}/producto/${p.slug}`,
          lastModified: p.created_at ? new Date(p.created_at) : undefined,
          changeFrequency: 'weekly' as const,
          priority: 0.8,
        }));
    }
  } catch (e) {
    console.error('sitemap: error fetching products', e);
  }

  return [...staticRoutes, ...productRoutes];
}