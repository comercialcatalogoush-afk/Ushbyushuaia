import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Contenido público de las páginas servido desde el Edge. El navegador usa
// el caché local como primera pintura y solo llega aquí para validar; cuando
// el admin publica, el timestamp del broadcast crea una versión fresca.
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const PUBLIC_PAGE_IDS = new Set([
  'home', 'outlet', 'como-comprar', 'contacto', 'rastreo', 'catalogo', 'politicas', 'footer',
]);
const CACHE_CONTROL = 'public, max-age=0, s-maxage=300, stale-while-revalidate=86400';
const NO_STORE = 'no-store';

export async function GET(req: Request) {
  const pageId = new URL(req.url).searchParams.get('page') || '';
  if (!PUBLIC_PAGE_IDS.has(pageId)) {
    return NextResponse.json({ error: 'invalid_page' }, { status: 400 });
  }

  try {
    const { data, error } = await supabase
      .from('site_config')
      .select('value')
      .eq('key', `page_${pageId}`)
      .maybeSingle();
    if (!error && data?.value) {
      const parsed = JSON.parse(data.value);
      if (parsed && typeof parsed === 'object') {
        return NextResponse.json(parsed, {
          headers: { 'Cache-Control': CACHE_CONTROL, 'CDN-Cache-Control': CACHE_CONTROL },
        });
      }
    }
  } catch (_) {}

  return NextResponse.json({}, {
    headers: { 'Cache-Control': NO_STORE, 'CDN-Cache-Control': NO_STORE },
  });
}
