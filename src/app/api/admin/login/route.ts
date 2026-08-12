import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'comercialmayoristas@ushuaiajeans.com.co';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Colombia2025*';
const SESSION_TOKEN = 'ush_admin_session_v2';

export async function POST(req: NextRequest) {
  try {
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
