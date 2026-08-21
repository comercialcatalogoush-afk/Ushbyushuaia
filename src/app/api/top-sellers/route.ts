import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Siempre dinámica (nunca se hornea en build), pero cacheada en el Edge de Vercel.
// Así los clientes NO consultan la RPC de Supabase directamente: leen del edge y
// el egress de la base de datos no crece con cada visitante.
export const dynamic = 'force-dynamic';

const CACHE_CONTROL = 'public, s-maxage=3600, stale-while-revalidate=86400';

export async function GET() {
  try {
    const { data, error } = await supabase.rpc('get_top_selling_ids', { days_back: 30 });
    if (error) throw new Error(error.message);
    const list = (data || []).map((r: any) => ({ id: String(r.id), units: Number(r.units) || 0 }));
    return NextResponse.json(list, { headers: { 'Cache-Control': CACHE_CONTROL } });
  } catch {
    return NextResponse.json([], { headers: { 'Cache-Control': CACHE_CONTROL } });
  }
}
