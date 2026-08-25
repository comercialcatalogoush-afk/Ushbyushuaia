import { supabase } from './supabase';
import * as ExcelJS from 'exceljs';

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

const BACKUP_PAGE_SIZE = 1000;
const BACKUP_MAX_ROWS = 200000;

async function fetchTable(table: string, orderCol?: string): Promise<any[]> {
  try {
    // Paginación completa: antes .limit(5000) truncaba silenciosamente el
    // respaldo y el purgado posterior borraba filas que nunca se exportaron.
    const all: any[] = [];
    let from = 0;
    while (from < BACKUP_MAX_ROWS) {
      let q = supabase
        .from(table)
        .select('*')
        .range(from, from + BACKUP_PAGE_SIZE - 1);
      if (orderCol) q = q.order(orderCol, { ascending: false });
      const { data, error } = await q;
      if (error) {
        console.warn(`backup: no se pudo leer ${table}`, error.message);
        break;
      }
      const rows = data || [];
      all.push(...rows);
      if (rows.length < BACKUP_PAGE_SIZE) break;
      from += BACKUP_PAGE_SIZE;
    }
    return all;
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

// ── Respaldo en Excel: hoja de pedidos + hoja de compras por cliente ──

const PEDIDOS_HEADERS = [
  'FECHA DE COMPRA', 'FECHA DE DESPACHO', 'ESTADO CLIENTE', 'CORREO', 'NOMBRE', 'APELLIDOS',
  'CEDULA/NIT/CE', 'CELULAR', 'DEPARTAMENTO', 'MUNICIPIO', 'DIRECCION', 'BARRIO',
  'DIRECCION COMPLEMENTARIA', 'DESTINATARIO', 'NUM DE GUÍA', 'NUMERO FACTURA', 'NUM DE PEDIDO SAG',
  'BANCO O METODO DE PAGO', 'ESTADO DEL PAGO', 'ESTADO SAG', 'ESTADO DEL ENVÍO',
  'VALOR VENTA', 'VALOR FLETE REAL', 'TOTAL PAGADO',
];

const PEDIDOS_WIDTHS = [15, 15, 14, 30, 20, 24, 16, 16, 14, 16, 40, 22, 24, 16, 14, 16, 16, 22, 14, 12, 16, 14, 14, 14];

const DETALLE_HEADERS = ['CLIENTE', 'REFERENCIA', 'NOMBRE', 'UNIDADES', 'VALOR'];
const DETALLE_WIDTHS = [36, 20, 42, 12, 18];

const NAVY = 'FF1B2333';
const PINK = 'FFD88193';
const LIGHT = 'FFF7F7F7';
const MONEY_FMT = '"$" #,##0';

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

function buildOrderRow(o: any): any[] {
  const [nombres, apellidos] = splitName(o.customer_name);
  const total = o.total ?? 0;
  return [
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
  ];
}

const thinBorder = {
  top: { style: 'thin' as const, color: { argb: 'FFDDDDDD' } },
  left: { style: 'thin' as const, color: { argb: 'FFDDDDDD' } },
  bottom: { style: 'thin' as const, color: { argb: 'FFDDDDDD' } },
  right: { style: 'thin' as const, color: { argb: 'FFDDDDDD' } },
};

const thickTop = {
  top: { style: 'medium' as const, color: { argb: NAVY } },
  left: { style: 'thin' as const, color: { argb: 'FFDDDDDD' } },
  bottom: { style: 'thin' as const, color: { argb: 'FFDDDDDD' } },
  right: { style: 'thin' as const, color: { argb: 'FFDDDDDD' } },
};

function styleHeaderRow(row: ExcelJS.Row, columns: number) {
  row.height = 26;
  row.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY } };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.border = thinBorder;
  });
  for (let c = columns + 1; c <= row.cellCount; c++) row.getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY } };
}

export async function exportOrderExcel(data: BackupData) {
  const orders = Array.isArray(data.orders) ? data.orders : [];
  const dateStr = new Date().toLocaleDateString('es-CO');

  const wb = new ExcelJS.Workbook();
  wb.creator = 'Ush By Ushuaia';
  wb.created = new Date();

  // ── Hoja 1: Pedidos ──
  const ws1 = wb.addWorksheet('Pedidos', { views: [{ state: 'frozen', ySplit: 3 }] });

  // Título
  ws1.mergeCells(1, 1, 1, PEDIDOS_HEADERS.length);
  const title = ws1.getCell(1, 1);
  title.value = 'REPORTE DE PEDIDOS USH BY USHUAIA';
  title.font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
  title.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: PINK } };
  title.alignment = { vertical: 'middle', horizontal: 'center' };
  ws1.getRow(1).height = 28;

  // Subtítulo con fecha de generación
  ws1.mergeCells(2, 1, 2, PEDIDOS_HEADERS.length);
  const sub = ws1.getCell(2, 1);
  sub.value = `Generado: ${dateStr}  ·  ${orders.length} pedidos`;
  sub.font = { italic: true, size: 9, color: { argb: 'FF555555' } };
  sub.alignment = { horizontal: 'right', vertical: 'middle' };
  ws1.getRow(2).height = 18;

  // Encabezados
  const hdrRow = ws1.addRow(PEDIDOS_HEADERS);
  styleHeaderRow(hdrRow, PEDIDOS_HEADERS.length);

  // Datos
  let rowIndex = 4;
  orders.forEach((o: any, idx: number) => {
    const row = ws1.addRow(buildOrderRow(o));
    row.height = 20;
    row.eachCell((cell, colNumber) => {
      cell.alignment = { vertical: 'middle', wrapText: !(colNumber >= 5 && colNumber <= 13) };
      cell.border = thinBorder;
      if (idx % 2 === 1) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: LIGHT } };
    });
    row.getCell(22).numFmt = MONEY_FMT;
    row.getCell(24).numFmt = MONEY_FMT;
    rowIndex++;
  });

  // Fila de totales
  const totalRow = ws1.addRow([]);
  totalRow.height = 22;
  ws1.mergeCells(totalRow.number, 1, totalRow.number, 21);
  totalRow.getCell(1).value = 'TOTAL GENERAL';
  totalRow.getCell(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  totalRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY } };
  totalRow.getCell(1).alignment = { horizontal: 'right', vertical: 'middle' };
  const sumVenta = orders.reduce((s, o: any) => s + (o.total ?? 0), 0);
  totalRow.getCell(22).value = sumVenta;
  totalRow.getCell(22).numFmt = MONEY_FMT;
  totalRow.getCell(22).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  totalRow.getCell(22).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY } };
  totalRow.getCell(24).value = sumVenta;
  totalRow.getCell(24).numFmt = MONEY_FMT;
  totalRow.getCell(24).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  totalRow.getCell(24).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY } };

  // Anchuras + autofiltro
  PEDIDOS_WIDTHS.forEach((w, i) => { ws1.getColumn(i + 1).width = w; });
  ws1.autoFilter = { from: { row: 3, column: 1 }, to: { row: totalRow.number - 1, column: PEDIDOS_HEADERS.length } };

  // ── Hoja 2: Compras por Cliente (referencias y valores) ──
  const ws2 = wb.addWorksheet('Compras por Cliente', { views: [{ state: 'frozen', ySplit: 3 }] });

  ws2.mergeCells(1, 1, 1, DETALLE_HEADERS.length);
  const title2 = ws2.getCell(1, 1);
  title2.value = 'COMPRAS POR CLIENTE USH BY USHUAIA';
  title2.font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
  title2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: PINK } };
  title2.alignment = { vertical: 'middle', horizontal: 'center' };
  ws2.getRow(1).height = 28;

  ws2.mergeCells(2, 1, 2, DETALLE_HEADERS.length);
  const sub2 = ws2.getCell(2, 1);
  sub2.value = `Generado: ${dateStr}  ·  referencias compradas por cliente`;
  sub2.font = { italic: true, size: 9, color: { argb: 'FF555555' } };
  sub2.alignment = { horizontal: 'right', vertical: 'middle' };
  ws2.getRow(2).height = 18;

  const hdr2 = ws2.addRow(DETALLE_HEADERS);
  styleHeaderRow(hdr2, DETALLE_HEADERS.length);

  // Agrupa por cliente y referencia
  const map = new Map<string, { client: string; ref: string; name: string; units: number; value: number }>();
  orders.forEach((o: any) => {
    const client = (o.customer_name || 'SIN NOMBRE').trim();
    const items = Array.isArray(o.items) ? o.items : [];
    items.forEach((it: any) => {
      const ref = it.reference || it.product_id || 'SIN-REFERENCIA';
      const key = `${client}::${ref}`;
      const cur = map.get(key) || { client, ref, name: it.name || '', units: 0, value: 0 };
      const qty = Number(it.quantity) || 0;
      cur.units += qty;
      cur.value += (Number(it.unit_price) || 0) * qty;
      map.set(key, cur);
    });
  });

  const byClient = new Map<string, { client: string; ref: string; name: string; units: number; value: number }[]>();
  Array.from(map.values()).forEach((e) => {
    const arr = byClient.get(e.client) || [];
    arr.push(e);
    byClient.set(e.client, arr);
  });
  const clients = Array.from(byClient.keys()).sort((a, b) => a.localeCompare(b, 'es'));

  let grandUnits = 0;
  let grandValue = 0;
  let dataStart = 4;

  clients.forEach((client, ci) => {
    const rows = byClient.get(client)!.sort((a, b) => b.value - a.value);

    // Fila de cliente (grupo)
    const groupRow = ws2.addRow([]);
    ws2.mergeCells(groupRow.number, 1, groupRow.number, DETALLE_HEADERS.length);
    groupRow.getCell(1).value = client;
    groupRow.getCell(1).font = { bold: true, size: 10, color: { argb: 'FFFFFFFF' } };
    groupRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ci % 2 === 0 ? 'FF3A4A6B' : 'FF4E6091' } };
    groupRow.getCell(1).alignment = { vertical: 'middle' };
    groupRow.height = 18;

    rows.forEach((r, idx) => {
      const row = ws2.addRow([r.client, r.ref, r.name, r.units, r.value]);
      row.height = 18;
      row.eachCell((cell) => { cell.border = thinBorder; if (idx % 2 === 1) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: LIGHT } }; });
      row.getCell(4).numFmt = '#,##0';
      row.getCell(5).numFmt = MONEY_FMT;
    });

    // Subtotal del cliente
    const subRow = ws2.addRow([]);
    ws2.mergeCells(subRow.number, 1, subRow.number, 3);
    subRow.getCell(1).value = `TOTAL ${client.toUpperCase()}`;
    subRow.getCell(1).font = { bold: true };
    subRow.getCell(1).alignment = { horizontal: 'right', vertical: 'middle' };
    const cUnits = rows.reduce((s, r) => s + r.units, 0);
    const cValue = rows.reduce((s, r) => s + r.value, 0);
    subRow.getCell(4).value = cUnits;
    subRow.getCell(4).numFmt = '#,##0';
    subRow.getCell(4).font = { bold: true };
    subRow.getCell(5).value = cValue;
    subRow.getCell(5).numFmt = MONEY_FMT;
    subRow.getCell(5).font = { bold: true };
    for (let c = 1; c <= DETALLE_HEADERS.length; c++) subRow.getCell(c).border = thickTop;
    subRow.getCell(4).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEDF0F5' } };
    subRow.getCell(5).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEDF0F5' } };

    grandUnits += cUnits;
    grandValue += cValue;
  });

  // Total general
  if (clients.length > 0) {
    const grandRow = ws2.addRow([]);
    ws2.mergeCells(grandRow.number, 1, grandRow.number, 3);
    grandRow.getCell(1).value = 'TOTAL GENERAL';
    grandRow.getCell(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    grandRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY } };
    grandRow.getCell(1).alignment = { horizontal: 'right', vertical: 'middle' };
    grandRow.getCell(4).value = grandUnits;
    grandRow.getCell(4).numFmt = '#,##0';
    grandRow.getCell(4).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    grandRow.getCell(4).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY } };
    grandRow.getCell(5).value = grandValue;
    grandRow.getCell(5).numFmt = MONEY_FMT;
    grandRow.getCell(5).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    grandRow.getCell(5).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY } };
  }

  DETALLE_WIDTHS.forEach((w, i) => { ws2.getColumn(i + 1).width = w; });

  // Descargar
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ush_pedidos_${new Date().toISOString().split('T')[0]}.xlsx`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 3000);
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
