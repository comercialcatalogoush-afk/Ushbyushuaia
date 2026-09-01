import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

const ADMIN_EMAIL = 'comercialmayoristas@ushuaiajeans.com.co';
const CONFIG_KEY = 'lookbook_pdf_config';

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

async function getUser(req: Request) {
  const authorization = req.headers.get('authorization') || '';
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7).trim() : '';
  if (!token) return null;
  const { data, error } = await supabase.auth.getUser(token);
  return error || !data.user ? null : data.user;
}

function normalizeConfig(value: unknown) {
  if (!value || typeof value !== 'object') return null;
  const raw = value as Record<string, unknown>;
  const selectedProductIds = Array.isArray(raw.selectedProductIds)
    ? raw.selectedProductIds.filter((id): id is string => typeof id === 'string' && id.length <= 120).slice(0, 500)
    : [];
  if (!selectedProductIds.length) return null;
  return {
    selectedProductIds: Array.from(new Set(selectedProductIds)),
    groupMode: raw.groupMode === 'fit' ? 'fit' as const : 'category' as const,
    customerPriceMode: raw.customerPriceMode === 'blank' ? 'blank' as const : 'ecommerce' as const,
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : undefined,
  };
}

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const user = await getUser(req);
  if (!user?.email) return NextResponse.json({ error: 'Debes iniciar sesión para acceder al catálogo.' }, { status: 401 });
  const serviceClient = getServiceClient();
  if (!serviceClient) return NextResponse.json({ error: 'El catálogo PDF aún no está configurado.' }, { status: 503 });

  const { data, error } = await serviceClient.from('site_config').select('value').eq('key', CONFIG_KEY).maybeSingle();
  if (error) {
    console.error('Error loading lookbook config:', error);
    return NextResponse.json({ error: 'No se pudo cargar el catálogo PDF.' }, { status: 500 });
  }
  let config = null;
  try { config = normalizeConfig(data?.value ? JSON.parse(String(data.value)) : null); } catch (_) {}
  return NextResponse.json({ config }, { headers: { 'Cache-Control': 'private, no-store' } });
}

export async function POST(req: Request) {
  const user = await getUser(req);
  if (!user?.email || user.email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
    return NextResponse.json({ error: 'Solo el administrador puede publicar el catálogo PDF.' }, { status: 403 });
  }
  const serviceClient = getServiceClient();
  if (!serviceClient) return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY no configurada.' }, { status: 503 });

  const body = await req.json().catch(() => ({}));
  const config = normalizeConfig({ ...body, updatedAt: new Date().toISOString() });
  if (!config) return NextResponse.json({ error: 'Selecciona al menos una referencia.' }, { status: 400 });

  const { error } = await serviceClient.from('site_config').upsert({
    key: CONFIG_KEY,
    value: JSON.stringify(config),
    updated_at: config.updatedAt,
  }, { onConflict: 'key' });
  if (error) {
    console.error('Error saving lookbook config:', error);
    return NextResponse.json({ error: 'No se pudo publicar el catálogo PDF.' }, { status: 500 });
  }
  return NextResponse.json({ success: true, config }, { headers: { 'Cache-Control': 'no-store' } });
}
