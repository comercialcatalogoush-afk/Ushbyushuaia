import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// La estructura publicada se sirve por el Edge para que los visitantes no
// consulten site_config directamente en cada carga. El broadcast del admin y
// /api/revalidate invalidan esta respuesta después de publicar.
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const CACHE_CONTROL = 'public, max-age=0, s-maxage=300, stale-while-revalidate=86400';
const NO_STORE = 'no-store';
const EMPTY_LAYOUT = { orders: {}, hidden: {} };

export async function GET() {
  let readFailed = false;
  try {
    const { data, error } = await supabase
      .from('site_config')
      .select('value')
      .eq('key', 'section_layout')
      .maybeSingle();

    if (error) readFailed = true;
    if (!error && data?.value) {
      try {
        const parsed = JSON.parse(data.value);
        if (parsed && typeof parsed === 'object') {
          return NextResponse.json(parsed, {
            headers: { 'Cache-Control': CACHE_CONTROL, 'CDN-Cache-Control': CACHE_CONTROL },
          });
        }
      } catch (_) {}
    }
  } catch (_) { readFailed = true; }

  return NextResponse.json(EMPTY_LAYOUT, {
    headers: {
      'Cache-Control': readFailed ? NO_STORE : CACHE_CONTROL,
      'CDN-Cache-Control': readFailed ? NO_STORE : CACHE_CONTROL,
    },
  });
}
