import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendBrevoEmail } from '@/lib/brevo';
import { orderConfirmationEmail } from '@/lib/brevoTemplates';

export const dynamic = 'force-dynamic';

const RATE_LIMIT_MAX = 12;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const EMAIL_SENT_MARKER = '[USH_EMAIL_SENT]';
const rateMap = new Map<string, number[]>();

function isRateLimited(key: string) {
  const now = Date.now();
  const recent = (rateMap.get(key) || []).filter((timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS);
  if (recent.length >= RATE_LIMIT_MAX) return true;
  recent.push(now);
  rateMap.set(key, recent);
  return false;
}

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

export async function POST(req: Request) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    if (isRateLimited(ip)) return NextResponse.json({ success: false }, { status: 429 });

    const body = await req.json().catch(() => ({}));
    const orderId = typeof body?.orderId === 'string' ? body.orderId.trim() : '';
    if (!/^FE[A-Z0-9-]{6,80}$/.test(orderId)) {
      return NextResponse.json({ success: false }, { status: 400 });
    }

    const admin = getAdminClient();
    if (!admin) return NextResponse.json({ success: false, configured: false }, { status: 503 });

    const { data: order, error } = await admin.from('orders').select('*').eq('id', orderId).maybeSingle();
    if (error || !order || typeof order.customer_email !== 'string' || !order.customer_email.includes('@')) {
      return NextResponse.json({ success: false }, { status: 404 });
    }

    // Reclamo atómico para que el mismo pedido no dispare varios correos si el
    // navegador reintenta o alguien repite la solicitud con el mismo ID.
    const currentNotes = typeof order.notes === 'string' ? order.notes : null;
    if (currentNotes?.includes(EMAIL_SENT_MARKER)) {
      return NextResponse.json({ success: true, alreadySent: true });
    }
    const claimedNotes = currentNotes === null
      ? EMAIL_SENT_MARKER
      : `${currentNotes}\n${EMAIL_SENT_MARKER}`;
    let claim = admin.from('orders').update({ notes: claimedNotes }).eq('id', orderId);
    claim = currentNotes === null ? claim.is('notes', null) : claim.eq('notes', currentNotes);
    const { data: claimed, error: claimError } = await claim.select('id').maybeSingle();
    if (claimError || !claimed) {
      return NextResponse.json({ success: false, alreadySent: true }, { status: 409 });
    }

    const name = String(order.customer_name || 'Cliente').split('/')[0].trim();
    const catalogUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://ushbyushuaia.vercel.app/catalogo';
    const sent = await sendBrevoEmail({
      to: { email: order.customer_email.trim().toLowerCase(), name },
      subject: `Recibimos tu pedido #${orderId} | USH BY USHUAIA`,
      htmlContent: orderConfirmationEmail(order, catalogUrl),
      textContent: `Hola ${name}, recibimos tu pedido #${orderId}. Nuestro equipo te contactará para confirmar disponibilidad, pago y despacho.`,
      tags: ['order-received', 'transactional'],
    });

    if (!sent.success) {
      await admin.from('orders').update({ notes: currentNotes }).eq('id', orderId).eq('notes', claimedNotes);
    }

    return NextResponse.json({ success: sent.success, configured: sent.configured });
  } catch (error) {
    console.error('Order notification error:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
