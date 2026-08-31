import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Tema público servido por el Edge para que cada visita no consulte Supabase.
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const CACHE_CONTROL = 'public, max-age=0, s-maxage=300, stale-while-revalidate=86400';
const NO_STORE = 'no-store';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('site_config')
      .select('value')
      .eq('key', 'theme')
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
