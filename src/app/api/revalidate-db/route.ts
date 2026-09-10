import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

// Purga el caché cuando la base de datos cambia por fuera del panel admin
// (scripts SQL, ediciones externas, etc.). Un trigger en Supabase llama esta
// ruta tras cada cambio en `products` y `site_config`.
//
// SEGURIDAD: el secreto debe configurarse como variable de entorno del
// servidor (REVALIDATE_SECRET en Vercel). Nunca se lee desde Supabase ni se
// acepta por URL, porque ambos caminos pueden dejarlo expuesto en registros.

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

async function handle(req: Request): Promise<NextResponse> {
  const expected = process.env.REVALIDATE_SECRET || '';
  if (!expected) {
    return NextResponse.json({ error: 'not_configured' }, { status: 503 });
  }

  const provided = req.headers.get('x-webhook-secret') || '';
  if (provided !== expected) {
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

// GET eliminado: el secreto en query string se registra en logs del servidor
// y del CDN. Solo se admite POST con el secreto en header/body.
