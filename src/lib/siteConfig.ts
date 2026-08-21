import { supabase, triggerRevalidate } from './supabase';

// Solo el override manual del admin vive aquí (nunca el valor traído del servidor,
// para que un caché viejo no congele el número en el dispositivo).
const WHATSAPP_OVERRIDE_KEY = 'ush_whatsapp_override';
const WHATSAPP_SERVER_KEY = 'ush_whatsapp_server';
export const DEFAULT_WHATSAPP_NUMBER = '573011393902';

export function getLocalWhatsAppOverride(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const saved = localStorage.getItem(WHATSAPP_OVERRIDE_KEY);
    if (saved && saved.trim()) return saved.trim();
  } catch (_) {}
  return null;
}

function getServerCachedWhatsApp(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const saved = localStorage.getItem(WHATSAPP_SERVER_KEY);
    if (saved && saved.trim()) return saved.trim();
  } catch (_) {}
  return null;
}

export function saveLocalWhatsAppOverride(number: string) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(WHATSAPP_OVERRIDE_KEY, number.trim());
    window.dispatchEvent(new Event('ush_whatsapp_updated'));
  } catch (_) {}
}

// Devuelve el número de WhatsApp configurado. Prioridad: override del admin →
// Edge de Vercel (/api/site-config) → caché local del servidor → Supabase → default.
export async function getWhatsAppNumber(): Promise<string> {
  const local = getLocalWhatsAppOverride();
  if (local) return local;

  // Red primero: así un cambio del admin se ve de inmediato en todos los dispositivos.
  if (typeof window !== 'undefined') {
    try {
      const res = await fetch('/api/site-config', { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        if (json?.whatsapp) {
          try { localStorage.setItem(WHATSAPP_SERVER_KEY, String(json.whatsapp)); } catch (_) {}
          return String(json.whatsapp);
        }
      }
    } catch (_) {}

    // Sin red/edge caído: usa el último valor conocido del servidor
    const cached = getServerCachedWhatsApp();
    if (cached) return cached;

    // Respaldo directo a Supabase
    try {
      const { data, error } = await supabase
        .from('site_config')
        .select('value')
        .eq('key', 'whatsapp_number')
        .maybeSingle();
      if (!error && data?.value) {
        try { localStorage.setItem(WHATSAPP_SERVER_KEY, data.value); } catch (_) {}
        return data.value;
      }
    } catch (_) {}
  }

  return DEFAULT_WHATSAPP_NUMBER;
}

// Guarda el número en Supabase y purga el caché público (/api/site-config).
export async function saveWhatsAppNumber(number: string): Promise<{ success: boolean; error?: string }> {
  const clean = number.trim().replace(/\D/g, '');
  saveLocalWhatsAppOverride(clean || DEFAULT_WHATSAPP_NUMBER);

  try {
    const { error } = await supabase
      .from('site_config')
      .upsert({ key: 'whatsapp_number', value: clean || DEFAULT_WHATSAPP_NUMBER }, { onConflict: 'key' });
    if (error) return { success: false, error: error.message };
    triggerRevalidate();
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message };
  }
}

// Hook para componentes client: escucha cambios en tiempo real
export function subscribeWhatsApp(cb: (number: string) => void): () => void {
  const handler = () => cb(getLocalWhatsAppOverride() || DEFAULT_WHATSAPP_NUMBER);
  window.addEventListener('ush_whatsapp_updated', handler);
  return () => window.removeEventListener('ush_whatsapp_updated', handler);
}
