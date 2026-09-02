import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';
import { sendBrevoEmail, upsertBrevoContact } from '@/lib/brevo';
import { welcomeEmail } from '@/lib/brevoTemplates';

// Notifica al admin en tiempo real cuando un nuevo usuario se registra.
// Guarda el registro en site_config y emite un broadcast al canal ush-catalog-sync.
export const dynamic = 'force-dynamic';

// Rate limit básico en memoria por IP (mitiga spam/email-bombing)
const RATE_LIMIT_MAX = 10;
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
    let { email, name = '', marketingOptIn = false } = body;

    email = typeof email === 'string' ? email.trim() : '';
    name = String(name || '').slice(0, 120);
    marketingOptIn = marketingOptIn === true;

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
    const now = new Date().toISOString();

    // 1. Guardar en site_config para que el admin lo vea si recarga
    let isNewRegistration = false;
    try {
      const { data: configRow } = await supabase
        .from('site_config')
        .select('value')
        .eq('key', 'new_user_registrations')
        .maybeSingle();

      let registrations: any[] = [];
      if (configRow?.value) {
        try { registrations = JSON.parse(configRow.value); } catch (_) {}
      }

      // Evitar duplicados: si ya existe se conserva su entrada original.
      // Antes se sobrescribía con status:'new' y fecha actual en CADA llamada,
      // re-marcando usuarios antiguos como "nuevos" en el panel del admin.
      const existingIdx = registrations.findIndex(
        (r) => (r.email || '').toLowerCase() === normalizedEmail
      );

      if (existingIdx < 0) {
        isNewRegistration = true;
        registrations.unshift({
          email: normalizedEmail,
          name: name || 'Cliente Nuevo',
          registered_at: now,
          marketing_opt_in: marketingOptIn,
          status: 'new',
        });
        // Rolling de 100 registros
        registrations = registrations.slice(0, 100);

        await supabase.from('site_config').upsert({
          key: 'new_user_registrations',
          value: JSON.stringify(registrations),
          updated_at: now,
        }, { onConflict: 'key' });
      }
    } catch (dbErr) {
      console.error('Error saving new user registration to site_config:', dbErr);
    }

    // 2. Emitir broadcast SOLO para registros genuinamente nuevos.
    // Antes se emitía en cada evento de sesión (TOKEN_REFRESHED cada hora,
    // recargas de /profile…) y el admin recibía notificaciones infinitas.
    if (!isNewRegistration) {
      return NextResponse.json({
        success: true,
        message: `Registro ya conocido para ${normalizedEmail}`,
        duplicate: true,
      });
    }

    // Marketing is strictly opt-in. Auth confirmation emails remain managed by
    // Supabase, while Brevo handles only the optional welcome communication.
    if (marketingOptIn) {
      const catalogUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://ushbyushuaia.vercel.app/catalogo';
      await Promise.allSettled([
        upsertBrevoContact({ email: normalizedEmail, name, marketingOptIn: true }),
        sendBrevoEmail({
          to: { email: normalizedEmail, name: name || 'Cliente' },
          subject: 'Tu cuenta mayorista ya está lista | USH BY USHUAIA',
          htmlContent: welcomeEmail(name, catalogUrl),
          textContent: `Hola ${name || 'cliente'}, tu cuenta mayorista ya está lista. Explora el catálogo: ${catalogUrl}`,
          tags: ['welcome', 'customer-account'],
        }),
      ]);
    }

    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://uwfkwcrqqwruzfwzppjf.supabase.co';
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_kOqjv3pdiOQoIp0AHKXWeg_H61J-N2g';
      const serverClient = createClient(supabaseUrl, supabaseAnonKey);

      const ch = serverClient.channel('ush-catalog-sync');
      await new Promise<void>((resolve) => {
        ch.subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            ch.send({
              type: 'broadcast',
              event: 'user-registered',
              payload: { email: normalizedEmail, name: name || 'Cliente Nuevo', ts: Date.now() },
            }).then(() => {
              setTimeout(() => {
                serverClient.removeChannel(ch);
                resolve();
              }, 500);
            }).catch(() => resolve());
          }
        });

        // Timeout de seguridad: no bloquear la respuesta más de 3 segundos
        setTimeout(resolve, 3000);
      });
    } catch (broadcastErr) {
      console.warn('Broadcast user-registered fallback (no crítico):', broadcastErr);
    }

    return NextResponse.json({
      success: true,
      message: `Registro notificado para ${normalizedEmail}`,
    });
  } catch (err: any) {
    console.error('register-notify error:', err);
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
