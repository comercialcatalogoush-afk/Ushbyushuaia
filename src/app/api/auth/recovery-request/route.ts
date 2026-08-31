import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Rate limit básico en memoria: máx. 5 solicitudes por hora por IP.
// Mitiga email-bombing desde el endpoint público.
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const rateMap = new Map<string, number[]>();

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const hits = (rateMap.get(key) || []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  if (hits.length >= RATE_LIMIT_MAX) return true;
  hits.push(now);
  rateMap.set(key, hits);
  return false;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    let { email, name = '', phone = '' } = body;

    email = typeof email === 'string' ? email.trim() : '';
    name = String(name || '').slice(0, 120);
    phone = String(phone || '').slice(0, 40);

    if (!email || !email.includes('@') || email.length > 254) {
      return NextResponse.json({ error: 'Correo electrónico no válido' }, { status: 400 });
    }

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: 'Demasiadas solicitudes. Inténtalo de nuevo más tarde.' },
        { status: 429 }
      );
    }

    const normalizedEmail = email.toLowerCase();

    // Supabase Auth sends the actual reset email from the client flow. This
    // endpoint only records the request so the admin can see it, avoiding a
    // duplicate email when the form calls both paths.
    try {
      const { data: configRow } = await supabase
        .from('site_config')
        .select('value')
        .eq('key', 'password_reset_requests')
        .maybeSingle();

      let currentRequests: any[] = [];
      if (configRow?.value) {
        try { currentRequests = JSON.parse(configRow.value); } catch (_) {}
      }

      // Add or update request
      const existingIdx = currentRequests.findIndex(
        (r) => (r.email || '').toLowerCase() === normalizedEmail
      );

      const requestEntry = {
        email: normalizedEmail,
        name: name || 'Cliente',
        phone: phone,
        created_at: new Date().toISOString(),
        status: 'pending',
      };

      if (existingIdx >= 0) {
        currentRequests[existingIdx] = requestEntry;
      } else {
        currentRequests.unshift(requestEntry);
      }

      // Keep only recent 50 requests
      currentRequests = currentRequests.slice(0, 50);

      await supabase.from('site_config').upsert({
        key: 'password_reset_requests',
        value: JSON.stringify(currentRequests),
        updated_at: new Date().toISOString(),
      });
    } catch (dbErr) {
      console.error('Error saving recovery request to site_config:', dbErr);
    }

    return NextResponse.json({
      success: true,
      message: `Solicitud registrada para ${normalizedEmail}. El enlace de recuperación se gestiona desde Supabase Auth.`,
    });
  } catch (err: any) {
    console.error('Recovery request error:', err);
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
