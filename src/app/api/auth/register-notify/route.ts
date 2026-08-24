import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';

// Notifica al admin en tiempo real cuando un nuevo usuario se registra.
// Guarda el registro en site_config y emite un broadcast al canal ush-catalog-sync.
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, name = '' } = body;

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Correo electrónico no válido' }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const now = new Date().toISOString();

    // 1. Guardar en site_config para que el admin lo vea si recarga
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

      // Evitar duplicados: si ya está, actualiza la fecha
      const existingIdx = registrations.findIndex(
        (r) => (r.email || '').toLowerCase() === normalizedEmail
      );

      const entry = {
        email: normalizedEmail,
        name: name || 'Cliente Nuevo',
        registered_at: now,
        status: 'new',
      };

      if (existingIdx >= 0) {
        registrations[existingIdx] = entry;
      } else {
        registrations.unshift(entry);
      }

      // Rolling de 100 registros
      registrations = registrations.slice(0, 100);

      await supabase.from('site_config').upsert({
        key: 'new_user_registrations',
        value: JSON.stringify(registrations),
        updated_at: now,
      });
    } catch (dbErr) {
      console.error('Error saving new user registration to site_config:', dbErr);
    }

    // 2. Emitir broadcast desde el servidor via Supabase Realtime
    // Usamos el cliente anon con broadcast (no requiere service role para broadcast)
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
    return NextResponse.json({ error: err.message || 'Error del servidor' }, { status: 500 });
  }
}
