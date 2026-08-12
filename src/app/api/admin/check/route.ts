import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const SESSION_TOKEN = 'ush_admin_session_v2';

export async function GET() {
  try {
    const cookieStore = cookies();
    const session = cookieStore.get(SESSION_TOKEN);
    if (session?.value === 'authenticated') {
      return NextResponse.json({ authenticated: true });
    }
    return NextResponse.json({ authenticated: false });
  } catch {
    return NextResponse.json({ authenticated: false });
  }
}
