import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { supabase } from '@/lib/supabase';

// Purga el caché cuando la base de datos cambia por fuera del panel admin
// (scripts SQL, ediciones externas, etc.). Un trigger en Supabase llama esta
// ruta tras cada cambio en `products` y `site_config`.
// El secreto vive en la tabla site_config (key: revalidate_secret) para no
// hardcodearlo en el repo ni requerir variables de entorno en Vercel.

const PATHS_TO_REVALIDATE = [
  '/',
  '/catalogo',
  '/producto/[slug]',
  '/api/catalog',
  '/api/top-sellers',
];

let cachedSecret: { value: string; at: number } | null = null;

async function getExpectedSecret(): Promise<string> {
  // Caché corto en memoria: evita una lectura extra por cada evento sin
  // quedarse pegado a un valor viejo más de 30 segundos.
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
