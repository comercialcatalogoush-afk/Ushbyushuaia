import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const SESSION_TOKEN = 'ush_admin_session_v2';

export async function POST() {
  try {
    const cookieStore = cookies();
    cookieStore.delete(SESSION_TOKEN);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
