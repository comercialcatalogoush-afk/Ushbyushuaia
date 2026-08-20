import { supabase } from './supabase';
import * as XLSX from 'xlsx';

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

// ── Respaldo en Excel: hoja de pedidos + hoja de referencias ────────

const PEDIDOS_HEADERS = [
  'FECHA DE COMPRA', 'FECHA DE DESPACHO', 'ESTADO CLIENTE', 'CORREO', 'NOMBRE', 'APELLIDOS',
  'CEDULA/NIT/CE', 'CELULAR', 'DEPARTAMENTO', 'MUNICIPIO', 'DIRECCION', 'BARRIO',
  'DIRECCION COMPLEMENTARIA', 'DESTINATARIO', 'NUM DE GUÍA', 'NUMERO FACTURA', 'NUM DE PEDIDO SAG',
  'BANCO O METODO DE PAGO', 'ESTADO DEL PAGO', 'ESTADO SAG', 'ESTADO DEL ENVÍO',
  'VALOR VENTA', 'VALOR FLETE REAL', 'TOTAL PAGADO',
];

const PEDIDOS_WIDTHS = [15, 15, 14, 30, 20, 24, 16, 16, 14, 16, 40, 22, 24, 16, 14, 16, 16, 22, 14, 12, 16, 14, 14, 14];

const REFERENCIAS_HEADERS = ['REFERENCIA', 'NOMBRE', 'UNIDADES', 'VALOR'];

function splitName(fullName?: string): [string, string] {
  const parts = (fullName || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 4) return [parts.slice(0, 2).join(' '), parts.slice(2).join(' ')];
  if (parts.length === 3) return [parts[0], parts.slice(1).join(' ')];
  return [parts[0] || '', parts.slice(1).join(' ') || ''];
}

function formatFecha(value?: string): string {
  if (!value) return '';
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (m) return `${m[3]}/${m[2]}/${m[1]}`;
  return value;
}

function orderStatusLabel(status?: string): string {
  if (!status) return '';
  const s = status.toLowerCase();
  if (s === 'confirmed') return 'CONFIRMADO';
  if (s === 'canceled' || s === 'cancelled') return 'CANCELADO';
  if (s === 'pending') return 'PENDIENTE';
  return status.toUpperCase();
}

function paymentLabel(method?: string): string {
  const map: Record<string, string> = {
    transfer: 'TRANSFERENCIA BANCARIA',
    card: 'PAGO CON TARJETA',
    addi: 'ADDI',
    'mercado-pago': 'MERCADO PAGO',
    'mercado pago': 'MERCADO PAGO',
    pse: 'PSE',
    efectivo: 'EFECTIVO',
    nequi: 'NEQUI',
    daviplata: 'DAVIPLATA',
  };
  return map[(method || '').toLowerCase()] || method || '';
}

function applyNumberFormat(ws: XLSX.WorkSheet, col: number, format: string) {
  if (!ws['!ref']) return;
  const range = XLSX.utils.decode_range(ws['!ref']);
  for (let r = range.s.r + 1; r <= range.e.r; r++) {
    const addr = XLSX.utils.encode_cell({ r, c: col });
    const cell = ws[addr];
    if (cell && typeof cell.v === 'number') cell.z = format;
  }
}

function boldHeader(ws: XLSX.WorkSheet, columns: number) {
  for (let c = 0; c < columns; c++) {
    const cell = ws[XLSX.utils.encode_cell({ r: 0, c })];
    if (cell) cell.s = { font: { bold: true } };
  }
}

export function exportOrderExcel(data: BackupData) {
  const orders = Array.isArray(data.orders) ? data.orders : [];

  // ── Hoja 1: Pedidos ──
  const rows: any[][] = [PEDIDOS_HEADERS];
  orders.forEach((o: any) => {
    const [nombres, apellidos] = splitName(o.customer_name);
    const total = o.total ?? 0;
    rows.push([
      formatFecha(o.order_date || (o.created_at ? o.created_at.slice(0, 10) : '')),
      '',                                            // FECHA DE DESPACHO
      orderStatusLabel(o.status),                     // ESTADO CLIENTE
      o.customer_email || '',
      nombres,
      apellidos,
      o.customer_doc || '',
      o.customer_phone || '',
      o.department || '',
      o.city || '',
      o.shipping_address || '',
      '',                                            // BARRIO
      '',                                            // DIRECCION COMPLEMENTARIA
      '',                                            // DESTINATARIO
      '',                                            // NUM DE GUÍA
      o.id || '',                                    // NUMERO FACTURA
      '',                                            // NUM DE PEDIDO SAG
      paymentLabel(o.payment_method),
      '',                                            // ESTADO DEL PAGO
      '',                                            // ESTADO SAG
      '',                                            // ESTADO DEL ENVÍO
      total,                                         // VALOR VENTA
      '',                                            // VALOR FLETE REAL
      total,                                         // TOTAL PAGADO
    ]);
  });

  const wsPedidos = XLSX.utils.aoa_to_sheet(rows);
  wsPedidos['!cols'] = PEDIDOS_WIDTHS.map((wch) => ({ wch }));
  applyNumberFormat(wsPedidos, 21, '#,##0');
  applyNumberFormat(wsPedidos, 23, '#,##0');
  boldHeader(wsPedidos, PEDIDOS_HEADERS.length);

  // ── Hoja 2: Referencias (qué se compró, unidades y valores) ──
  const refMap = new Map<string, { ref: string; name: string; units: number; value: number }>();
  orders.forEach((o: any) => {
    const items = Array.isArray(o.items) ? o.items : [];
    items.forEach((it: any) => {
      const ref = it.reference || it.product_id || 'SIN-REFERENCIA';
      const cur = refMap.get(ref) || { ref, name: it.name || '', units: 0, value: 0 };
      const qty = Number(it.quantity) || 0;
      cur.units += qty;
      cur.value += (Number(it.unit_price) || 0) * qty;
      refMap.set(ref, cur);
    });
  });

  const refRows: any[][] = [REFERENCIAS_HEADERS];
  Array.from(refMap.values())
    .sort((a, b) => b.value - a.value)
    .forEach((r) => refRows.push([r.ref, r.name, r.units, r.value]));

  const wsRefs = XLSX.utils.aoa_to_sheet(refRows);
  wsRefs['!cols'] = [{ wch: 18 }, { wch: 40 }, { wch: 12 }, { wch: 16 }];
  applyNumberFormat(wsRefs, 2, '0');
  applyNumberFormat(wsRefs, 3, '#,##0');
  boldHeader(wsRefs, REFERENCIAS_HEADERS.length);

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, wsPedidos, 'Pedidos');
  XLSX.utils.book_append_sheet(wb, wsRefs, 'Referencias');
  XLSX.writeFile(wb, `ush_pedidos_${new Date().toISOString().split('T')[0]}.xlsx`);
}

// Vacía las tablas transaccionales (las que crecen). NO borra products.
export async function purgeTransactionalData(): Promise<{ success: boolean; error?: string }> {
  // La columna id es uuid en wholesale_leads y price_history; orders usa texto.
  // Un filtro neq con un UUID de ceros es sintácticamente válido para ambos tipos
  // y nunca coincide con un id real, por lo que borra todas las filas.
  const ZERO_UUID = '00000000-0000-0000-0000-000000000000';

  try {
    const { error } = await supabase.from('orders').delete().neq('id', ZERO_UUID);
    if (error) return { success: false, error: `orders: ${error.message}` };
  } catch (e: any) {
    return { success: false, error: `orders: ${e?.message}` };
  }
  try {
    const { error } = await supabase.from('wholesale_leads').delete().neq('id', ZERO_UUID);
    if (error) return { success: false, error: `wholesale_leads: ${error.message}` };
  } catch (e: any) {
    return { success: false, error: `wholesale_leads: ${e?.message}` };
  }
  try {
    const { error } = await supabase.from('price_history').delete().neq('id', ZERO_UUID);
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
