import { supabase } from './supabase';

// ── Respaldos y limpieza mensual ──────────────────────────────────
// El plan gratuito de Supabase tiene límites de almacenamiento/DB. Para no
// saturarlo, el admin exporta un respaldo (JSON) y luego se vacían las tablas
// transaccionales (orders, wholesale_leads, price_history). products NO se toca.

export interface BackupData {
  exported_at: string;
  products: any[];
  orders: any[];
  wholesale_leads: any[];
  price_history: any[];
}

async function fetchTable(table: string, orderCol?: string): Promise<any[]> {
  try {
    let q = supabase.from(table).select('*').limit(5000);
    if (orderCol) q = q.order(orderCol, { ascending: false });
    const { data, error } = await q;
    if (error) {
      console.warn(`backup: no se pudo leer ${table}`, error.message);
      return [];
    }
    return data || [];
  } catch (_) {
    return [];
  }
}

export async function exportBackup(): Promise<BackupData> {
  const [products, orders, wholesale_leads, price_history] = await Promise.all([
    fetchTable('products', 'created_at'),
    fetchTable('orders', 'created_at'),
    fetchTable('wholesale_leads', 'created_at'),
    fetchTable('price_history', 'changed_at'),
  ]);
  return { exported_at: new Date().toISOString(), products, orders, wholesale_leads, price_history };
}

export function downloadBackup(data: BackupData) {
  const date = new Date().toISOString().split('T')[0];
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ushbackup_${date}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 3000);
}

// Vacía las tablas transaccionales (las que crecen). NO borra products.
export async function purgeTransactionalData(): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.from('orders').delete().neq('id', 'never');
    if (error) return { success: false, error: `orders: ${error.message}` };
  } catch (e: any) {
    return { success: false, error: `orders: ${e?.message}` };
  }
  try {
    const { error } = await supabase.from('wholesale_leads').delete().neq('id', 'never');
    if (error) return { success: false, error: `wholesale_leads: ${error.message}` };
  } catch (e: any) {
    return { success: false, error: `wholesale_leads: ${e?.message}` };
  }
  try {
    const { error } = await supabase.from('price_history').delete().neq('id', 'never');
    if (error) return { success: false, error: `price_history: ${error.message}` };
  } catch (e: any) {
    return { success: false, error: `price_history: ${e?.message}` };
  }
  return { success: true };
}

// ── Recordatorio: último viernes del mes a las 3:30 PM ────────────
export function getLastFridayOfMonth(year: number, month: number): Date {
  // month: 0-11
  const lastDay = new Date(year, month + 1, 0); // último día del mes
  const dow = lastDay.getDay(); // 0=domingo ... 5=viernes
  // retroceder hasta el viernes
  let friday = lastDay;
  while (friday.getDay() !== 5) {
    friday.setDate(friday.getDate() - 1);
  }
  friday.setHours(15, 30, 0, 0);
  return friday;
}

export function getNextBackupReminder(now: Date = new Date()): Date {
  const y = now.getFullYear();
  const m = now.getMonth();
  const thisMonth = getLastFridayOfMonth(y, m);
  if (thisMonth.getTime() > now.getTime()) return thisMonth;
  const nextMonth = getLastFridayOfMonth(y + (m === 11 ? 1 : 0), (m + 1) % 12);
  return nextMonth;
}

export function formatReminder(date: Date): string {
  const opts: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  };
  return date.toLocaleString('es-CO', opts);
}

// Genera un archivo .ics para agregar el recordatorio al calendario
export function downloadReminderIcs(reminder: Date) {
  const fmt = (d: Date) =>
    d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const start = new Date(reminder.getTime() - 15 * 60 * 1000); // 15 min antes
  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//USH//BackupReminder//ES',
    'BEGIN:VEVENT',
    `UID:ush-backup-${fmt(reminder)}`,
    `DTSTAMP:${fmt(new Date())}`,
    `DTSTART:${fmt(start)}`,
    `DTEND:${fmt(reminder)}`,
    'SUMMARY:Respaldar y limpiar datos USH BY USHUAIA (Supabase)',
    'DESCRIPTION:Exporta el respaldo desde el panel admin (Respaldos > Exportar JSON) y luego vacía las tablas transaccionales para no saturar el plan gratuito.',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'ush-respaldo-mensual.ics';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 3000);
}

// Cuenta regresiva hasta el recordatorio
export function getReminderCountdown(target: Date, now: Date = new Date()): {
  days: number; hours: number; minutes: number; overdue: boolean;
} {
  const diff = target.getTime() - now.getTime();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, overdue: true };
  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff % 86400000) / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
    overdue: false,
  };
}
