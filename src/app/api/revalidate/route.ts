import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

// Clave compartida con publishCatalogChange (supabase.ts). Su único efecto es
// purgar el caché del edge de Vercel para que los cambios del admin se reflejen
// de inmediato en páginas y /api/catalog.
const REVALIDATE_SECRET = 'ush_cat_rev_2026';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  if (searchParams.get('secret') !== REVALIDATE_SECRET) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  try {
    // Catálogo, home y páginas de contenido (todas leen Supabase y están cacheadas)
    revalidatePath('/');
    revalidatePath('/catalogo');
    revalidatePath('/como-comprar');
    revalidatePath('/contacto');
    revalidatePath('/politicas');
    revalidatePath('/producto/[slug]');
    revalidatePath('/api/catalog');
    return NextResponse.json({ revalidated: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'error' }, { status: 500 });
  }
}