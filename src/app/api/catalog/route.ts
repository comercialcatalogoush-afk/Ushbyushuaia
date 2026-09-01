import { NextResponse } from 'next/server';
import { fetchProductsFromSupabase, fetchProductBySlug, isCompleteProduct } from '@/lib/supabase';

// Se genera bajo demanda y se cachea en el Edge de Vercel. La invalidación
// se dispara desde /api/revalidate cuando el admin publica cambios.
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// max-age=0 mantiene fresca la navegación del navegador; s-maxage permite que
// Vercel reutilice la respuesta para los visitantes durante cinco minutos.
// stale-while-revalidate evita picos de consultas mientras se actualiza el Edge.
const CACHE_CONTROL = 'public, max-age=0, s-maxage=300, stale-while-revalidate=86400';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get('slug');

  // Detalle de un producto: /api/catalog?slug=ref-xxx
  if (slug) {
    const product = await fetchProductBySlug(slug);
    if (!product) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 });
    }
    return NextResponse.json(product, {
      headers: { 'Cache-Control': CACHE_CONTROL, 'CDN-Cache-Control': CACHE_CONTROL },
    });
  }

  // Listado público (perfil ligero): /api/catalog
  const all = await fetchProductsFromSupabase({ slim: true });
  const publicProducts = all.filter((p) => !p.hidden && isCompleteProduct(p));
  return NextResponse.json(publicProducts, {
    headers: { 'Cache-Control': CACHE_CONTROL, 'CDN-Cache-Control': CACHE_CONTROL },
  });
}
