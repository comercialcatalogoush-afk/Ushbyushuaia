import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { supabase } from '@/lib/supabase';

// Solo el admin (sesión real de Supabase) puede purgar el caché.
const ADMIN_EMAIL = 'comercialmayoristas@ushuaiajeans.com.co';

export async function POST(req: Request) {
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
    // Catálogo, home y páginas de contenido (todas leen Supabase y están cacheadas)
    revalidatePath('/');
    revalidatePath('/catalogo');
    revalidatePath('/como-comprar');
    revalidatePath('/contacto');
    revalidatePath('/politicas');
    revalidatePath('/producto/[slug]');
    revalidatePath('/api/catalog');
    revalidatePath('/api/admin/catalog');
    revalidatePath('/api/top-sellers');
    revalidatePath('/api/site-config');
    revalidatePath('/api/site-layout');
    return NextResponse.json({ revalidated: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'error' }, { status: 500 });
  }
}
