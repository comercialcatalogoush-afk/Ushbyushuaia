import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';

const ADMIN_EMAIL = 'comercialmayoristas@ushuaiajeans.com.co';

// Verifica que la petición venga de la sesión del administrador.
async function verifyAdmin(req: Request) {
  const auth = req.headers.get('authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (!token) return null;
  try {
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user || data.user.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
      return null;
    }
    return data.user;
  } catch {
    return null;
  }
}

// Cliente con rol de servicio (bypasa RLS): necesario para el borrado masivo
// de las tablas transaccionales desde el servidor.
function getAdminSupabase() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://uwfkwcrqqwruzfwzppjf.supabase.co';
  if (!serviceRoleKey) return null;
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const admin = await verifyAdmin(req);
  if (!admin) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const serviceClient = getAdminSupabase();
  if (!serviceClient) {
    return NextResponse.json(
      { error: 'SUPABASE_SERVICE_ROLE_KEY no configurada. Configure la variable de entorno.' },
      { status: 503 }
    );
  }

  const ZERO_UUID = '00000000-0000-0000-0000-000000000000';
  const tables = ['orders', 'wholesale_leads', 'price_history'] as const;
  const results: Record<string, number> = {};

  try {
    for (const table of tables) {
      const { data, error } = await serviceClient
        .from(table)
        .delete()
        .neq('id', ZERO_UUID)
        .select('id');
      if (error) {
        return NextResponse.json({ error: `${table}: ${error.message}` }, { status: 500 });
      }
      results[table] = Array.isArray(data) ? data.length : 0;
    }
    return NextResponse.json({ success: true, results });
  } catch (e: any) {
    return NextResponse.json({ error: (e?.message || 'Error interno del servidor') }, { status: 500 });
  }
}