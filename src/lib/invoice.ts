import { jsPDF } from 'jspdf';
import { supabase } from './supabase';
import { Product } from '@/types';

// ── Formato de moneda COP ──
const fmtCOP = (v: number) => '$ ' + new Intl.NumberFormat('es-CO').format(Math.round(v || 0));

const COMPANY = {
  name: 'USH BY USHUAIA',
  tagline: 'Catálogo Mayorista — Ushuaia Jeans',
  web: 'www.ushuaiajeans.com.co',
  email: 'comercialmayoristas@ushuaiajeans.com.co',
  address: 'Cll. 85 Sur #50-72, Itagüí, Antioquia — Colombia',
};

const NAVY: [number, number, number] = [27, 35, 51];
const PINK: [number, number, number] = [216, 129, 147];
const GRAY: [number, number, number] = [110, 116, 130];
const LIGHT: [number, number, number] = [245, 245, 247];
const GRID: [number, number, number] = [229, 229, 232];
const PALE_PINK: [number, number, number] = [253, 242, 244];

// ── Logo (cacheado como dataURL) ──
let logoCache: string | null = null;
async function loadLogo(): Promise<string | null> {
  if (logoCache) return logoCache;
  try {
    const res = await fetch('/images/ush-logo.jpg');
    if (!res.ok) return null;
    const blob = await res.blob();
    logoCache = await new Promise<string | null>((ok) => {
      const r = new FileReader();
      r.onload = () => ok(r.result as string);
      r.onerror = () => ok(null);
      r.readAsDataURL(blob);
    });
  } catch (_) {
    return null;
  }
  return logoCache;
}

// ── Agrupación de ítems por referencia ──
interface InvoiceRow {
  ref: string;
  name: string;
  sizes: string[];
  units: number;
  ecommercePrice: number;
  wholesalePrice: number;
  total: number;
}

function buildRows(order: any, products: Product[]): InvoiceRow[] {
  const byRef: Record<string, InvoiceRow> = {};
  const items: any[] = Array.isArray(order.items) ? order.items : [];
  for (const it of items) {
    const ref = String(it.reference || it.product_id || '');
    if (!byRef[ref]) {
      const prod =
        products.find((p) => p.id === it.product_id) ||
        products.find((p) => p.reference === ref);
      byRef[ref] = {
        ref,
        name: String(it.name || prod?.name || ''),
        sizes: [],
        units: 0,
        ecommercePrice: Math.max(0, Number(prod?.suggested_price) || 0),
        wholesalePrice: Number(it.unit_price) || 0,
        total: 0,
      };
    }
    const row = byRef[ref];
    if (it.size && !row.sizes.includes(String(it.size))) row.sizes.push(String(it.size));
    row.units += Number(it.quantity) || 0;
    row.total += (Number(it.unit_price) || 0) * (Number(it.quantity) || 0);
  }
  return Object.values(byRef);
}

const PAY_LABELS: Record<string, string> = {
  transfer: 'Transferencia bancaria',
  card: 'Tarjeta débito/crédito',
  addi: 'Addi',
};

function fmtDate(order: any): string {
  const raw = order.order_date || order.created_at;
  // "YYYY-MM-DD" se parsea como fecha local para evitar el off-by-one por UTC
  // (medianoche UTC en es-CO/UTC-5 retrocede al día anterior).
  let d: Date;
  if (typeof raw === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(raw.trim())) {
    const [yy, mm, dd] = raw.trim().split('-').map(Number);
    d = new Date(yy, mm - 1, dd);
  } else {
    d = raw ? new Date(raw) : new Date();
  }
  return isNaN(d.getTime())
    ? String(raw || '')
    : d.toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' });
}

function clipText(doc: jsPDF, value: unknown, maxWidth: number): string {
  const text = String(value || '—').replace(/\s+/g, ' ').trim();
  if (!text) return '—';
  const lines = doc.splitTextToSize(text, maxWidth) as string[];
  return lines[0] || '—';
}

function drawInvoiceFooter(doc: jsPDF, page: number, totalPages: number) {
  doc.setDrawColor(...GRID);
  doc.setLineWidth(0.25);
  doc.line(14, 283, 196, 283);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.2);
  doc.setTextColor(...GRAY);
  doc.text('USH BY USHUAIA · Documento generado electrónicamente', 14, 289);
  doc.text(`Página ${page} de ${totalPages}`, 196, 289, { align: 'right' });
}

// ── Genera el PDF de la factura ──
export async function generateInvoicePdf(
  order: any,
  products: Product[]
): Promise<{ blob: Blob | null; fileName: string; error?: string }> {
  try {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const M = 14; // margen
    const W = 210 - M * 2; // 182mm útiles
    const rows = buildRows(order, products);

    // ══ ENCABEZADO: franja de marca + logo + datos empresa ══
    doc.setFillColor(...PALE_PINK);
    doc.rect(0, 0, 210, 4, 'F');
    const logo = await loadLogo();
    let headerBottom = 30;
    if (logo) {
      try {
        const dim = doc.getImageProperties(logo);
        const maxW = 42;
        const maxH = 19;
        let w = maxW;
        let h = (w * dim.height) / dim.width;
        if (h > maxH) { h = maxH; w = (h * dim.width) / dim.height; }
        doc.addImage(logo, 'JPEG', M, 9, w, h);
      } catch (_) {}
    }
    doc.setTextColor(...NAVY);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text(COMPANY.name, 196, 15, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...GRAY);
    doc.setFontSize(7.5);
    doc.text(COMPANY.tagline, 196, 20, { align: 'right' });
    doc.text(COMPANY.web, 196, 24, { align: 'right' });
    doc.text(COMPANY.email, 196, 28, { align: 'right' });
    doc.text(COMPANY.address, 196, 32, { align: 'right' });
    headerBottom = Math.max(headerBottom, 36);

    // Línea rosa separadora
    doc.setDrawColor(...PINK);
    doc.setLineWidth(0.8);
    doc.line(M, headerBottom + 2, M + W, headerBottom + 2);

    // ══ TÍTULO ══
    let y = headerBottom + 11;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(17);
    doc.setTextColor(...NAVY);
    doc.text('FACTURA DE VENTA', M, y);
    doc.setFillColor(...PALE_PINK);
    doc.roundedRect(M + W - 59, y - 9, 59, 10, 2, 2, 'F');
    doc.setFontSize(7.2);
    doc.setTextColor(...PINK);
    doc.text('PEDIDO', M + W - 55, y - 3.5);
    doc.setFontSize(9.5);
    doc.setTextColor(...NAVY);
    doc.text(String(order.id || '—'), M + W - 4, y - 3.5, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...GRAY);
    doc.text(`Fecha: ${fmtDate(order)}`, M + W, y + 4.5, { align: 'right' });

    // ══ DATOS DEL CLIENTE ══
    y += 6;
    const boxH = 26;
    doc.setFillColor(...LIGHT);
    doc.setDrawColor(...GRID);
    doc.setLineWidth(0.3);
    doc.rect(M, y, W, boxH, 'FD');
    const col2x = M + W / 2 + 4;
    const labelVal = (
      label: string, value: string, x: number, ly: number
    ) => {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.3);
      doc.setTextColor(...GRAY);
      doc.text(label.toUpperCase(), x, ly);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.2);
      doc.setTextColor(...NAVY);
      doc.text(clipText(doc, value, 76), x, ly + 4);
    };
    labelVal('Cliente', order.customer_name, M + 4, y + 6);
    labelVal('Documento', order.customer_doc, M + 4, y + 13.5);
    labelVal('Teléfono', order.customer_phone, M + 4, y + 21);
    labelVal('Correo', order.customer_email, col2x, y + 6);
    labelVal('Ciudad / Departamento', [order.city, order.department].filter(Boolean).join(' — '), col2x, y + 13.5);
    labelVal('Dirección de envío', order.shipping_address, col2x, y + 21);
    y += boxH + 8;

    // ══ TABLA DE REFERENCIAS ══
    const cols = [
      { key: 'ref', label: 'REF', w: 20, align: 'left' as const },
      { key: 'name', label: 'PRENDA', w: 45, align: 'left' as const },
      { key: 'sizes', label: 'TALLAS', w: 24, align: 'center' as const },
      { key: 'units', label: 'UNID.', w: 15, align: 'center' as const },
      { key: 'may', label: 'PRECIO\nUNITARIO', w: 28, align: 'right' as const },
      { key: 'pct', label: 'DSCTO.', w: 17, align: 'center' as const },
      { key: 'tot', label: 'TOTAL', w: 33, align: 'right' as const },
    ];
    const headH = 11;

    const drawTableHead = (yy: number) => {
      doc.setFillColor(...NAVY);
      doc.rect(M, yy, W, headH, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.2);
      doc.setTextColor(255, 255, 255);
      let x = M;
      for (const c of cols) {
        const lines = c.label.split('\n');
        if (lines.length === 1) {
          doc.text(c.label, c.align === 'right' ? x + c.w - 2 : c.align === 'center' ? x + c.w / 2 : x + 2, yy + 7, { align: c.align });
        } else {
          doc.text(lines[0], c.align === 'right' ? x + c.w - 2 : c.align === 'center' ? x + c.w / 2 : x + 2, yy + 4.4, { align: c.align });
          doc.text(lines[1], c.align === 'right' ? x + c.w - 2 : c.align === 'center' ? x + c.w / 2 : x + 2, yy + 8.2, { align: c.align });
        }
        x += c.w;
      }
      return yy + headH;
    };

    y = drawTableHead(y);
    doc.setFont('helvetica', 'normal');

    let zebra = false;
    for (const r of rows) {
      if (y + 12 > 240) { doc.addPage(); y = drawTableHead(16); }
      const rowH = 11;
      if (zebra) {
        doc.setFillColor(250, 250, 251);
        doc.rect(M, y, W, rowH, 'F');
      }
      zebra = !zebra;
      doc.setDrawColor(...GRID);
      doc.setLineWidth(0.2);
      doc.rect(M, y, W, rowH);
      let x = M;
      // línea vertical entre columnas
      for (let i = 0; i < cols.length - 1; i++) {
        x += cols[i].w;
        doc.line(x, y, x, y + rowH);
      }
      // Offset acumulado real de cada columna (evita textos sobrepuestos)
      const colX: number[] = [];
      let acc = M;
      for (const c of cols) { colX.push(acc); acc += c.w; }
      const cell = (text: string, ci: number, opts: { size?: number; bold?: boolean; color?: [number,number,number] } = {}) => {
        const c = cols[ci];
        const baseX = colX[ci];
        const cx = c.align === 'right' ? baseX + c.w - 2 : c.align === 'center' ? baseX + c.w / 2 : baseX + 2;
        doc.setFont('helvetica', opts.bold ? 'bold' : 'normal');
        doc.setFontSize(opts.size || 8);
        doc.setTextColor(...(opts.color || NAVY));
        doc.text(text, cx, y + rowH / 2 + 1.2, { align: c.align });
      };
      cell(r.ref, 0, { bold: true, size: 7.8 });
      cell(clipText(doc, r.name, cols[1].w - 4), 1, { size: 7.4 });
      cell(r.sizes.join('-') || '—', 2, { size: 7.3 });
      cell(String(r.units), 3);
      cell(fmtCOP(r.wholesalePrice), 4, { size: 7.4 });
      const pct = r.ecommercePrice > 0 && r.wholesalePrice < r.ecommercePrice
        ? ((1 - r.wholesalePrice / r.ecommercePrice) * 100).toFixed(2) + '%'
        : '0%';
        cell(pct, 5, { color: PINK, bold: true, size: 7.8 });
      cell(fmtCOP(r.total), 6, { bold: true, size: 7.6 });
      y += rowH;
    }

    // ══ TOTALES ══
    const totalUnits = rows.reduce((a, r) => a + r.units, 0);
    const itemsTotal = rows.reduce((a, r) => a + r.total, 0);
    // Descuento a nivel de orden (cupón aplicado en el checkout)
    const orderDiscount = Math.max(0, Number(order.discount) || 0);
    const grandTotal = Math.max(0, itemsTotal - orderDiscount);

    if (orderDiscount > 0) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(...GRAY);
      const couponLabel = order.coupon_code ? ` (${String(order.coupon_code)})` : '';
      doc.text(`Subtotal: ${fmtCOP(itemsTotal)}`, M + W - 4, y + 5, { align: 'right' });
      doc.text(`Descuento${couponLabel}: -${fmtCOP(orderDiscount)}`, M + W - 4, y + 9.5, { align: 'right' });
      y += 12;
    }

    doc.setFillColor(...NAVY);
    doc.rect(M + W - 78, y, 78, 11, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text('TOTAL A PAGAR', M + W - 74, y + 7);
    doc.setFontSize(11.5);
    doc.text(fmtCOP(grandTotal), M + W - 4, y + 7.4, { align: 'right' });
    doc.setFontSize(8.5);
    doc.setTextColor(...GRAY);
    doc.text(`TOTAL UNIDADES: ${totalUnits}`, M, y + 7);
    y += 11;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...GRAY);
    doc.text(`Forma de pago: ${PAY_LABELS[order.payment_method] || order.payment_method || '—'}`, M, y + 6);
    if (order.notes) {
      doc.text(`Notas: ${String(order.notes).slice(0, 90)}`, M, y + 11);
      y += 5;
    }
    y += 12;

    // ══ AGRADECIMIENTO ══
    if (y + 30 > 250) { doc.addPage(); y = 20; }
    const th = 25;
    doc.setFillColor(...PALE_PINK);
    doc.roundedRect(M, y, W, th, 2, 2, 'F');
    doc.setFillColor(...PINK);
    doc.roundedRect(M, y, 2.4, th, 1.2, 1.2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12.5);
    doc.setTextColor(...NAVY);
    doc.text('Gracias por su compra', M + 9, y + 9.5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.2);
    doc.setTextColor(...GRAY);
    doc.text('Su pedido fue confirmado con éxito y ya se encuentra en proceso de despacho.', M + 9, y + 15.2);
    doc.text('Para cambios, reposiciones o novedades escríbanos por WhatsApp; con gusto le asesoramos.', M + 9, y + 19.4);
    y += th + 11;

    // ══ POLÍTICAS (pie) ══
    if (y + 42 > 282) { doc.addPage(); y = 20; }
    doc.setDrawColor(...GRID);
    doc.setLineWidth(0.3);
    doc.line(M, y, M + W, y);
    y += 6.5;
    doc.setFillColor(...PINK);
    doc.rect(M, y - 2.3, 2.6, 2.6, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.2);
    doc.setTextColor(...NAVY);
    doc.text('POLÍTICAS Y CONDICIONES', M + 5.5, y);
    y += 5.5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.1);
    doc.setTextColor(...GRAY);
    const polItems = [
      'Precios con IVA incluido. Los valores facturados corresponden al precio mayorista según la cantidad adquirida.',
      'Cambios y reposiciones dentro de los 3 días hábiles siguientes al recibo del pedido, con prendas sin uso y etiquetas intactas (Ley 1480 de 2011 y Decreto 587 de 2016).',
      'Despachos nacionales desde Cll. 85 Sur #50-72, Itagüí, Antioquia. Los tiempos de entrega se cuentan a partir de la confirmación del pago.',
      'Tratamiento de datos personales conforme a la Ley 1581 de 2012 (Habeas Data).',
      `Contacto: WhatsApp de lunes a jueves, 7:00 a. m. – 4:00 p. m. · ${COMPANY.email} · ${COMPANY.web}`,
    ];
    for (const item of polItems) {
      doc.setFillColor(...PINK);
      doc.circle(M + 1.1, y + 0.7, 0.55, 'F');
      const wrapped = doc.splitTextToSize(item, W - 6);
      doc.text(wrapped, M + 5, y + 1);
      y += 3.2 + wrapped.length * 2.7;
    }
    doc.setFontSize(5.8);
    const totalPages = doc.getNumberOfPages();
    for (let page = 1; page <= totalPages; page++) {
      doc.setPage(page);
      drawInvoiceFooter(doc, page, totalPages);
    }

    const blob = doc.output('blob');
    return { blob, fileName: `Factura-${order.id}.pdf` };
  } catch (e: any) {
    return { blob: null, fileName: '', error: e?.message || 'error generando PDF' };
  }
}

// ── Sube el PDF al bucket público 'invoices' y devuelve su URL ──
export async function uploadInvoicePdf(
  blob: Blob,
  orderId: string
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const path = `${orderId}-${Date.now()}.pdf`;
    const { error } = await supabase.storage
      .from('invoices')
      .upload(path, blob, { contentType: 'application/pdf', upsert: false });
    if (error) return { success: false, error: error.message };
    const { data } = supabase.storage.from('invoices').getPublicUrl(path);
    return { success: true, url: data?.publicUrl };
  } catch (e: any) {
    return { success: false, error: e?.message || 'error subiendo factura' };
  }
}

// ── Link wa.me con mensaje prellenado + URL de la factura ──
export function buildInvoiceWhatsAppUrl(
  phone: string,
  customerName: string,
  orderId: string,
  invoiceUrl: string
): string {
  let digits = String(phone || '').replace(/\D/g, '');
  if (digits.length === 10) digits = '57' + digits;
  const msg =
    `¡Hola ${customerName}! 🧾 Tu pedido ${orderId} fue confirmado con éxito.\n\n` +
    `Aquí puedes ver y descargar tu factura:\n${invoiceUrl}\n\n` +
    `Gracias por comprar en Ush By Ushuaia 💜 Quedamos atentos para tu próximo despacho.`;
  return `https://wa.me/${digits}?text=${encodeURIComponent(msg)}`;
}
