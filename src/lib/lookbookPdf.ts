import { jsPDF } from 'jspdf';
import { Product } from '@/types';
import { getGoogleDriveImageUrl } from '@/lib/drive';

export type LookbookGroupMode = 'category' | 'fit';
export type LookbookPriceMode = 'ecommerce' | 'custom' | 'blank';

export interface LookbookConfig {
  selectedProductIds: string[];
  groupMode: LookbookGroupMode;
  customerPriceMode: 'ecommerce' | 'blank';
  updatedAt?: string;
}

export const DEFAULT_LOOKBOOK_CONFIG: LookbookConfig = {
  selectedProductIds: [],
  groupMode: 'category',
  customerPriceMode: 'ecommerce',
};

const money = (value: number) => `$ ${new Intl.NumberFormat('es-CO').format(Math.round(value || 0))}`;

export function getLookbookPrice(product: Product, mode: LookbookPriceMode, customPrices: Record<string, string> = {}) {
  if (mode === 'blank') return '';
  if (mode === 'custom') {
    const custom = Number(customPrices[product.id]);
    return custom > 0 ? money(custom) : '';
  }
  return money(product.suggested_price || product.compare_price || product.price || 0);
}

function clipPdfText(doc: jsPDF, value: unknown, maxWidth: number, maxLines = 2) {
  const text = String(value || '').replace(/\s+/g, ' ').trim() || '-';
  return (doc.splitTextToSize(text, maxWidth) as string[]).slice(0, maxLines);
}

interface PdfImage {
  data: string;
  width: number;
  height: number;
}

function loadPdfImage(url: string): Promise<PdfImage | null> {
  if (!url) return Promise.resolve(null);
  return new Promise((resolve) => {
    const image = new Image();
    let settled = false;
    const finish = (value: PdfImage | null) => {
      if (settled) return;
      settled = true;
      resolve(value);
    };
    const timeout = window.setTimeout(() => finish(null), 4500);
    image.crossOrigin = 'anonymous';
    image.onload = () => {
      window.clearTimeout(timeout);
      try {
        const canvas = document.createElement('canvas');
        canvas.width = image.naturalWidth || image.width;
        canvas.height = image.naturalHeight || image.height;
        const context = canvas.getContext('2d');
        if (!context || !canvas.width || !canvas.height) return finish(null);
        context.drawImage(image, 0, 0);
        finish({ data: canvas.toDataURL('image/jpeg', 0.84), width: canvas.width, height: canvas.height });
      } catch (_) {
        finish(null);
      }
    };
    image.onerror = () => {
      window.clearTimeout(timeout);
      finish(null);
    };
    image.src = url;
  });
}

async function loadImagesInBatches(products: Product[], onProgress?: (completed: number, total: number) => void) {
  const entries: Array<readonly [string, PdfImage | null]> = [];
  const batchSize = 8;
  let completed = 0;
  onProgress?.(0, products.length);
  for (let index = 0; index < products.length; index += batchSize) {
    const batch = products.slice(index, index + batchSize);
    const loaded = await Promise.all(batch.map(async (product) => [
      product.id,
      await loadPdfImage(getGoogleDriveImageUrl(product.images?.[0] || '')),
    ] as const));
    entries.push(...loaded);
    completed += batch.length;
    onProgress?.(completed, products.length);
  }
  return new Map(entries);
}

async function loadLogo() {
  try {
    const response = await fetch('/images/ush-logo.jpg', { cache: 'force-cache' });
    if (!response.ok) return null;
    const blob = await response.blob();
    return await new Promise<string | null>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : null);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch (_) {
    return null;
  }
}

function drawFooter(doc: jsPDF, page: number, totalPages: number, pageWidth: number) {
  doc.setDrawColor(229, 229, 232);
  doc.setLineWidth(0.25);
  doc.line(14, 246, pageWidth - 14, 246);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(150, 156, 165);
  doc.text('USH BY USHUAIA - Catalogo digital - Imagenes desde URLs externas', 14, 252);
  doc.text(`Pagina ${page} de ${totalPages}`, pageWidth - 14, 252, { align: 'right' });
}

export async function generateLookbookPdf(
  products: Product[],
  options: {
    priceMode: LookbookPriceMode;
    groupMode: LookbookGroupMode;
    customPrices?: Record<string, string>;
    onProgress?: (completed: number, total: number) => void;
  }
): Promise<{ blob: Blob; fileName: string; failedImages: string[]; pageCount: number }> {
  const publicProducts = products.filter((product) => !product.hidden && product.status !== 'draft');
  if (!publicProducts.length) throw new Error('No hay referencias publicadas para generar el catálogo.');

  const imageMap = await loadImagesInBatches(publicProducts, options.onProgress);
  const failedImages = publicProducts.filter((product) => !imageMap.get(product.id) && product.images?.[0]).map((product) => product.reference);
  const groups = new Map<string, Product[]>();
  publicProducts.forEach((product) => {
    const label = options.groupMode === 'category' ? (product.category || 'Sin categoría') : (product.fit || 'Sin fit');
    groups.set(label, [...(groups.get(label) || []), product]);
  });
  const groupedProducts = Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b, 'es'));
  const totalPages = 1 + groupedProducts.reduce((total, [, groupProducts]) => total + Math.max(1, Math.ceil(groupProducts.length / 9)), 0);
  const pageWidth = 175;
  const pageHeight = 260;
  const doc = new jsPDF({ unit: 'mm', format: [pageWidth, pageHeight] });
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  const gap = 4;
  const cardWidth = (contentWidth - gap * 2) / 3;
  const imageHeight = 43;
  const cardHeight = 66;
  const logo = await loadLogo();
  let page = 1;

  // Portada editorial: bloques con posiciones fijas para evitar solapamientos
  // incluso cuando cambian la cantidad de referencias o el modo de precios.
  doc.setFillColor(27, 35, 51);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');
  doc.setFillColor(216, 129, 147);
  doc.rect(0, 0, pageWidth, 5, 'F');
  if (logo) {
    try {
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(margin, 18, 32, 32, 1, 1, 'F');
      doc.addImage(logo, 'JPEG', margin + 3, 21, 26, 26);
    } catch (_) {}
  }
  doc.setTextColor(215, 219, 228);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text('EDICION MAYORISTA', pageWidth - margin, 26, { align: 'right' });
  doc.text('2026', pageWidth - margin, 36, { align: 'right' });
  doc.setDrawColor(216, 129, 147);
  doc.setLineWidth(0.5);
  doc.line(pageWidth - 46, 42, pageWidth - margin, 42);

  doc.setTextColor(243, 179, 192);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('USH BY USHUAIA - MAYORISTAS', margin, 75);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(29);
  doc.text('CATALOGO', margin, 103);
  doc.setTextColor(243, 179, 192);
  doc.setFontSize(25);
  doc.text('LOOKBOOK', margin, 126);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(17);
  doc.text('2026', margin, 141);
  doc.setDrawColor(216, 129, 147);
  doc.setLineWidth(1);
  doc.line(margin, 154, margin + 56, 154);

  doc.setFillColor(35, 44, 63);
  doc.roundedRect(margin, 171, contentWidth, 40, 2, 2, 'F');
  doc.setTextColor(215, 219, 228);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('EDICION DISPONIBLE', margin + 7, 183);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(`${publicProducts.length} referencias`, margin + 7, 195);
  doc.setTextColor(243, 179, 192);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(options.priceMode === 'ecommerce' ? 'Precios ecommerce' : options.priceMode === 'custom' ? 'Precios personalizados' : 'Catalogo sin precios', margin + 7, 206);
  doc.setTextColor(215, 219, 228);
  doc.setFontSize(9);
  doc.text('Moda, calidad y tendencia para tu boutique.', margin, 229);
  doc.text('USH BY USHUAIA - Itagui, Antioquia - Colombia', margin, 240);
  doc.setTextColor(158, 166, 180);
  doc.setFontSize(7.5);
  doc.text('Catalogo digital elaborado con imagenes externas del producto.', margin, 250);

  for (const [group, groupProducts] of groupedProducts) {
    const pagesInGroup = Math.max(1, Math.ceil(groupProducts.length / 9));
    for (let groupPage = 0; groupPage < pagesInGroup; groupPage += 1) {
      doc.addPage();
      page += 1;
      doc.setTextColor(216, 129, 147);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.text(options.groupMode === 'category' ? 'CATEGORIA' : 'FIT', margin, 17);
      doc.setTextColor(27, 35, 51);
      doc.setFontSize(19);
      doc.text(`${String(group).toUpperCase()}${groupPage > 0 ? ' - CONTINUACION' : ''}`, margin, 26);
      doc.setDrawColor(229, 229, 232);
      doc.setLineWidth(0.35);
      doc.line(margin, 31, margin + contentWidth, 31);

      const pageProducts = groupProducts.slice(groupPage * 9, groupPage * 9 + 9);
      pageProducts.forEach((product, index) => {
        const col = index % 3;
        const row = Math.floor(index / 3);
        const x = margin + col * (cardWidth + gap);
        const y = 35 + row * 70;
        doc.setFillColor(250, 250, 251);
        doc.setDrawColor(236, 236, 238);
        doc.roundedRect(x, y, cardWidth, cardHeight, 1.5, 1.5, 'FD');
        const image = imageMap.get(product.id);
        if (image) {
          const scale = Math.min((cardWidth - 2) / image.width, imageHeight / image.height);
          const imageWidth = image.width * scale;
          const imageY = y + 1 + (imageHeight - image.height * scale) / 2;
          doc.addImage(image.data, 'JPEG', x + (cardWidth - imageWidth) / 2, imageY, imageWidth, image.height * scale, undefined, 'FAST');
        } else {
          doc.setFillColor(255, 243, 245);
          doc.rect(x + 1, y + 1, cardWidth - 2, imageHeight, 'F');
          doc.setTextColor(216, 129, 147);
          doc.setFontSize(15);
          doc.text('USH', x + cardWidth / 2, y + imageHeight / 2, { align: 'center' });
        }
        doc.setTextColor(216, 129, 147);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7);
        doc.text(`REF. ${String(product.reference || product.id)}`, x + 3, y + 50);
        doc.setTextColor(27, 35, 51);
        doc.setFontSize(8.2);
        doc.text(clipPdfText(doc, product.name, cardWidth - 6, 2).map((line) => line.toUpperCase()), x + 3, y + 56);
        doc.setTextColor(110, 116, 130);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.text(product.fit ? clipPdfText(doc, product.fit, cardWidth - 6, 1) : ' ', x + 3, y + 63);
        const price = getLookbookPrice(product, options.priceMode, options.customPrices);
        if (price) {
          doc.setTextColor(27, 35, 51);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(8.5);
          doc.text(price, x + cardWidth - 3, y + 63, { align: 'right' });
        }
      });
      drawFooter(doc, page, totalPages, pageWidth);
    }
  }

  return {
    blob: doc.output('blob'),
    fileName: `Catalogo-Lookbook-2026-${options.priceMode}.pdf`,
    failedImages,
    pageCount: totalPages,
  };
}
