import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

function getServiceClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://uwfkwcrqqwruzfwzppjf.supabase.co';
  if (!serviceRoleKey) return null;
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (!token) return NextResponse.json({ error: 'Debes iniciar sesión.' }, { status: 401 });

  const { data: authData, error: authError } = await supabase.auth.getUser(token);
  const email = authData.user?.email?.trim().toLowerCase();
  if (authError || !email) return NextResponse.json({ error: 'Sesión no válida.' }, { status: 401 });

  const adminClient = getServiceClient();
  if (!adminClient) {
    return NextResponse.json({ error: 'Historial temporalmente no disponible.' }, { status: 503 });
  }

  const { data, error } = await adminClient
    .from('orders')
    .select('id, order_date, created_at, status, total, discount, items')
    .ilike('customer_email', email)
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) {
    console.error('Error loading customer order history:', error);
    return NextResponse.json({ error: 'No se pudo cargar tu historial.' }, { status: 500 });
  }

  return NextResponse.json({ orders: data || [] }, {
    headers: { 'Cache-Control': 'private, no-store' },
  });
}
