import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

const NOTIFICATION_EMAIL = 'comercial.catalogoush@gmail.com';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, name = '', phone = '' } = body;

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Correo electrónico no válido' }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const origin = req.headers.get('origin') || 'https://ushuaiajeans.com.co';

    // 1. Trigger Supabase Auth reset password email (100% automated & free)
    const { error: resetErr } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
      redirectTo: `${origin}/profile`,
    });

    if (resetErr) {
      console.warn('Supabase resetPasswordForEmail notice:', resetErr.message);
    }

    // 2. Record request in database (site_config) so admin sees it in the panel
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
      message: `Te hemos enviado un enlace a ${normalizedEmail} para restablecer tu contraseña. Revisa tu bandeja de entrada o spam.`,
    });
  } catch (err: any) {
    console.error('Recovery request error:', err);
    return NextResponse.json({ error: err.message || 'Error del servidor' }, { status: 500 });
  }
}
