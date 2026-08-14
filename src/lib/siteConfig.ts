import { supabase } from './supabase';

const WHATSAPP_STORAGE_KEY = 'ush_whatsapp_override';
export const DEFAULT_WHATSAPP_NUMBER = '573022028477';

export function getLocalWhatsAppOverride(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const saved = localStorage.getItem(WHATSAPP_STORAGE_KEY);
    if (saved && saved.trim()) return saved.trim();
  } catch (_) {}
  return null;
}

export function saveLocalWhatsAppOverride(number: string) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(WHATSAPP_STORAGE_KEY, number.trim());
    window.dispatchEvent(new Event('ush_whatsapp_updated'));
  } catch (_) {}
}

// Devuelve el número de WhatsApp configurado. Prioridad: localStorage (admin) → Supabase → default.
export async function getWhatsAppNumber(): Promise<string> {
  const local = getLocalWhatsAppOverride();
  if (local) return local;

  try {
    const { data, error } = await supabase
      .from('site_config')
      .select('value')
      .eq('key', 'whatsapp_number')
      .maybeSingle();
    if (!error && data?.value) {
      if (typeof window !== 'undefined') {
        try { localStorage.setItem(WHATSAPP_STORAGE_KEY, data.value); } catch (_) {}
      }
      return data.value;
    }
  } catch (_) {}

  return DEFAULT_WHATSAPP_NUMBER;
}

// Guarda el número en Supabase (y en localStorage). Si la tabla no existe, reintenta sin ella.
export async function saveWhatsAppNumber(number: string): Promise<{ success: boolean; error?: string }> {
  const clean = number.trim().replace(/\D/g, '');
  saveLocalWhatsAppOverride(clean || DEFAULT_WHATSAPP_NUMBER);

  try {
    const { error } = await supabase
      .from('site_config')
      .upsert({ key: 'whatsapp_number', value: clean || DEFAULT_WHATSAPP_NUMBER }, { onConflict: 'key' });
    if (error) return { success: false, error: error.message };
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