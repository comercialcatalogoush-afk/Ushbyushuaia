import { NextResponse } from 'next/server';
import { fetchProductsFromSupabase, fetchProductBySlug, isCompleteProduct } from '@/lib/supabase';

// Siempre dinámica (nunca se hornea en build), pero el header Cache-Control
// hace que Vercel cachee la respuesta en su Edge Network (s-maxage).
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const CACHE_CONTROL = 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0, s-maxage=0';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get('slug');

  // Detalle de un producto: /api/catalog?slug=ref-xxx
  if (slug) {
    const product = await fetchProductBySlug(slug);
    if (!product) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 });
    }
    return NextResponse.json(product, { headers: { 'Cache-Control': CACHE_CONTROL } });
  }

  // Listado público (perfil ligero): /api/catalog
  const all = await fetchProductsFromSupabase({ slim: true });
  const publicProducts = all.filter((p) => !p.hidden && isCompleteProduct(p));
  return NextResponse.json(publicProducts, { headers: { 'Cache-Control': CACHE_CONTROL } });
}