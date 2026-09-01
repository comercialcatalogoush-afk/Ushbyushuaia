import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { supabase } from '@/lib/supabase';

// Purga el caché cuando la base de datos cambia por fuera del panel admin
// (scripts SQL, ediciones externas, etc.). Un trigger en Supabase llama esta
// ruta tras cada cambio en `products` y `site_config`.
//
// SEGURIDAD: el secreto DEBE configurarse como variable de entorno del
// servidor (REVALIDATE_SECRET en Vercel). Históricamente vivía en la tabla
// pública `site_config`, que es legible por cualquier visitante anónimo, lo
// que permitía forzar purgas de caché de forma no autorizada. Con la variable
// de entorno definida, el valor de `site_config` se IGNORA por completo, de
// modo que el secreto expuesto deja de tener efecto.

const PATHS_TO_REVALIDATE = [
  '/',
  '/catalogo',
  '/producto/[slug]',
  '/api/catalog',
  '/api/top-sellers',
  '/api/site-config',
  '/api/site-layout',
  '/api/site-content',
  '/api/site-theme',
];

let cachedSecret: { value: string; at: number } | null = null;

async function getExpectedSecret(): Promise<string> {
  const envSecret = process.env.REVALIDATE_SECRET;
  if (envSecret) {
    // Prioridad total a la variable de entorno: si no coincide, se rechaza.
    return envSecret;
  }

  // Fallback (solo temporal, mientras no exista la variable): lectura desde
  // site_config para no romper el trigger de Supabase existente. Al definir
  // REVALIDATE_SECRET en el servidor esta rama deja de usarse.
  if (cachedSecret && Date.now() - cachedSecret.at < 30_000) {
    return cachedSecret.value;
  }
  try {
    const { data } = await supabase
      .from('site_config')
      .select('value')
      .eq('key', 'revalidate_secret')
      .maybeSingle();
    const value = (data?.value as string) || '';
    cachedSecret = { value, at: Date.now() };
    return value;
  } catch (_) {
    return '';
  }
}

async function handle(req: Request): Promise<NextResponse> {
  const url = new URL(req.url);
  const provided =
    req.headers.get('x-webhook-secret') ||
    url.searchParams.get('secret') ||
    '';

  const expected = await getExpectedSecret();
  if (!expected || provided !== expected) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  for (const p of PATHS_TO_REVALIDATE) {
    try {
      revalidatePath(p);
    } catch (_) {}
  }
  return NextResponse.json({ revalidated: true });
}

export async function POST(req: Request) {
  return handle(req);
}

export async function GET(req: Request) {
  return handle(req);
}
