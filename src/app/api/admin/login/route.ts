import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'comercialmayoristas@ushuaiajeans.com.co';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Colombia2025*';
const SESSION_TOKEN = 'ush_admin_session_v2';

// Rate limiting en memoria (gratis, sin dependencias): máx. 5 intentos por IP cada 10 min
const attempts = new Map<string, { count: number; resetAt: number }>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 10 * 60 * 1000;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = attempts.get(ip);
  if (!entry || now > entry.resetAt) {
    attempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > MAX_ATTEMPTS;
}

export async function POST(req: NextRequest) {
  try {
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('x-real-ip') ||
      'unknown';

    if (isRateLimited(ip)) {
      return NextResponse.json(
        { success: false, error: 'Demasiados intentos. Intenta de nuevo en unos minutos.' },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { email, password } = body;

    if (
      email?.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase() &&
      password === ADMIN_PASSWORD
    ) {
      const cookieStore = cookies();
      cookieStore.set(SESSION_TOKEN, 'authenticated', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 8, // 8 hours
        path: '/',
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { success: false, error: 'Correo o contraseña incorrectos.' },
      { status: 401 }
    );
  } catch (err) {
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor.' },
      { status: 500 }
    );
  }
}
