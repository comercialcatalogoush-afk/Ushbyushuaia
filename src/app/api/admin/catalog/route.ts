import { NextResponse } from 'next/server';
import { supabase, fetchAllProductsAdmin } from '@/lib/supabase';

// Solo el admin (sesión real de Supabase) puede leer el catálogo completo.
// La respuesta queda cacheada en el edge de Vercel (s-maxage), así el admin
// no lee Supabase en cada carga/refrescado. Se purga con /api/revalidate.
const ADMIN_EMAIL = 'comercialmayoristas@ushuaiajeans.com.co';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const auth = req.headers.get('authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (!token) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  try {
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user || data.user.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }
  } catch {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  try {
    const products = await fetchAllProductsAdmin();
    return NextResponse.json(products, {
      // Datos autenticados: NUNCA cacheables en caché compartida del CDN.
      // Con 'public, s-maxage' el edge servía esta respuesta a cualquier
      // visitante anónimo durante la ventana de caché (fuga de datos).
      headers: { 'Cache-Control': 'private, no-store' },
    });
  } catch (e: any) {
    console.error('API catalog error:', e);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
