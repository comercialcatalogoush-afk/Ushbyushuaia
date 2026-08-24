import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Configuración pública del sitio servida desde el Edge de Vercel.
// Evita que cada visitante consulte site_config directamente en Supabase.
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const CACHE_CONTROL = 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0, s-maxage=0';
const DEFAULT_WHATSAPP_NUMBER = '573011393902';

export async function GET() {
  let whatsapp = DEFAULT_WHATSAPP_NUMBER;
  try {
    const { data, error } = await supabase
      .from('site_config')
      .select('value')
      .eq('key', 'whatsapp_number')
      .maybeSingle();
    if (!error && data?.value) whatsapp = String(data.value);
  } catch {}
  return NextResponse.json({ whatsapp }, { headers: { 'Cache-Control': CACHE_CONTROL } });
}
