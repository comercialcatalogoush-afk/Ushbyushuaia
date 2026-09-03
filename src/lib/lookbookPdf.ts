import { jsPDF } from 'jspdf';
import { Product } from '@/types';
import { getGoogleDriveImageUrl } from '@/lib/drive';
import { abbreviateProductName } from '@/lib/productName';

export type LookbookGroupMode = 'category' | 'fit';
export type LookbookPriceMode = 'wholesale' | 'ecommerce' | 'custom' | 'blank';

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

export function getAvailableProductSizes(product: Product) {
  const stockEntries = Object.entries(product.stock_by_size || {});
  const stockSizes = stockEntries
    .filter(([, quantity]) => Number(quantity) > 0)
    .map(([size]) => size);
  if (stockEntries.length) {
    return stockSizes.sort((a, b) => {
      const numericDifference = Number(a) - Number(b);
      return Number.isNaN(numericDifference) ? a.localeCompare(b, 'es') : numericDifference;
    });
  }
  return product.options?.find((option) => /talla/i.test(option.key))?.values || [];
}

export function getLookbookProductName(product: Product) {
  return abbreviateProductName({ name: product.name, category: product.category, fit: product.fit }).short || 'Prenda';
}

export function getLookbookPrice(product: Product, mode: LookbookPriceMode, customPrices: Record<string, string> = {}) {
  if (mode === 'blank') return '';
  if (mode === 'custom') {
    const custom = Number(customPrices[product.id]);
    return custom > 0 ? money(custom) : '';
  }
  if (mode === 'wholesale') return money(product.price || product.suggested_price || product.compare_price || 0);
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
  const entries: Array<readonly [string, PdfImage[]]> = [];
  const batchSize = 8;
  let completed = 0;
  onProgress?.(0, products.length);
  for (let index = 0; index < products.length; index += batchSize) {
    const batch = products.slice(index, index + batchSize);
    const loaded = await Promise.all(batch.map(async (product) => {
      const urls = (product.images || []).slice(0, 3).map((url) => getGoogleDriveImageUrl(url)).filter(Boolean);
      const images = (await Promise.all(urls.map((url) => loadPdfImage(url)))).filter((image): image is PdfImage => Boolean(image));
      return [product.id, images] as const;
    }));
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
  doc.line(14, 150, pageWidth - 14, 150);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(150, 156, 165);
  doc.text('USH BY USHUAIA - Catalogo digital - Imagenes desde URLs externas', 14, 154.5);
  doc.text(`Pagina ${page} de ${totalPages}`, pageWidth - 14, 154.5, { align: 'right' });
}

export async function generateLookbookPdf(
  products: Product[],
  options: {
    priceMode: LookbookPriceMode;
    groupMode: LookbookGroupMode;
    customPrices?: Record<string, string>;
    selectedSizes?: Record<string, string[]>;
    onProgress?: (completed: number, total: number) => void;
  }
): Promise<{ blob: Blob; fileName: string; failedImages: string[]; pageCount: number }> {
  const publicProducts = products.filter((product) => !product.hidden && product.status !== 'draft');
  if (!publicProducts.length) throw new Error('No hay referencias publicadas para generar el catálogo.');

  const imageMap = await loadImagesInBatches(publicProducts, options.onProgress);
  const failedImages = publicProducts.filter((product) => product.images?.length && !imageMap.get(product.id)?.length).map((product) => product.reference);
  const totalPages = publicProducts.length + 1;
  const pageWidth = 280;
  const pageHeight = 157.5;
  const doc = new jsPDF({ unit: 'mm', format: [pageWidth, pageHeight] });
  const logo = await loadLogo();
  let page = 1;

  // La portada conserva la proporción horizontal del PDF de Canva.
  doc.setFillColor(244, 244, 245);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');
  doc.setFillColor(27, 35, 51);
  doc.rect(0, 0, 92, pageHeight, 'F');
  if (logo) {
    try { doc.addImage(logo, 'JPEG', 18, 18, 38, 38); } catch (_) {}
  }
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(27);
  doc.text('CATÁLOGO', 18, 82);
  doc.setTextColor(243, 179, 192);
  doc.setFontSize(22);
  doc.text('DIGITAL', 18, 102);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('USH BY USHUAIA · MAYORISTAS', 18, 121);
  doc.text(`${publicProducts.length} referencias seleccionadas`, 18, 132);
  doc.setTextColor(27, 35, 51);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text('Tu colección,', 112, 70);
  doc.setTextColor(216, 129, 147);
  doc.text('a tu manera.', 112, 93);
  doc.setTextColor(75, 80, 90);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.text(options.priceMode === 'blank' ? 'Catálogo sin precios' : options.priceMode === 'custom' ? 'Precios personalizados' : 'Moda, calidad y tendencia para tu boutique.', 112, 113);
  doc.setFontSize(8);
  doc.text('Editado desde tu selección de referencias.', 112, 128);

  for (const product of publicProducts) {
    doc.addPage();
    page += 1;
    const margin = 12;
    const imageAreaWidth = 165;
    const detailX = 184;
    const detailWidth = pageWidth - detailX - margin;
    const images = imageMap.get(product.id) || [];
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');
    doc.setFillColor(239, 239, 241);
    doc.rect(0, 0, imageAreaWidth, 150, 'F');
    if (images.length) {
      const imageWidth = images.length >= 3 ? 53 : images.length === 2 ? 80 : 150;
      const imageGap = images.length >= 3 ? 3 : 5;
      images.slice(0, 3).forEach((image, index) => {
        const slotX = margin + index * (imageWidth + imageGap);
        const slotWidth = images.length === 1 ? 140 : imageWidth;
        const slotHeight = 132;
        const scale = Math.min(slotWidth / image.width, slotHeight / image.height);
        const renderedWidth = image.width * scale;
        const renderedHeight = image.height * scale;
        doc.addImage(image.data, 'JPEG', slotX + (slotWidth - renderedWidth) / 2, 9 + (slotHeight - renderedHeight) / 2, renderedWidth, renderedHeight, undefined, 'FAST');
      });
    } else {
      doc.setTextColor(216, 129, 147);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(22);
      doc.text('USH', imageAreaWidth / 2, 76, { align: 'center' });
    }
    doc.setTextColor(27, 35, 51);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text(`REF: ${String(product.reference || product.id)}`, detailX, 48);
    doc.setFontSize(13);
    doc.text(clipPdfText(doc, product.name, detailWidth, 2).map((line) => line.toUpperCase()), detailX, 58);
    doc.setTextColor(75, 80, 90);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    const sizes = options.selectedSizes?.[product.id] || getAvailableProductSizes(product);
    doc.text(`TALLA: ${sizes.join(' · ') || 'POR DEFINIR'}`, detailX, 76);
    if (product.video_url) {
      doc.setTextColor(27, 35, 51);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.text('VER VIDEO', detailX, 89);
    }
    if (options.priceMode !== 'blank') {
      const customPrice = getLookbookPrice(product, 'custom', options.customPrices);
      const wholesalePrice = getLookbookPrice(product, 'wholesale');
      const ecommercePrice = getLookbookPrice(product, 'ecommerce');
      doc.setTextColor(110, 116, 130);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      if (options.priceMode === 'custom') {
        doc.text('PRECIO PARA TUS CLIENTES:', detailX, 111);
        doc.setTextColor(27, 35, 51);
        doc.setFontSize(17);
        doc.text(customPrice || 'EDITABLE', detailX, 124);
      } else if (options.priceMode === 'wholesale') {
        doc.text('COMPRA EN:', detailX, 111);
        doc.setTextColor(27, 35, 51);
        doc.setFontSize(17);
        doc.text(wholesalePrice, detailX, 124);
      } else {
        doc.text('COMPRA EN:', detailX, 105);
        doc.setTextColor(27, 35, 51);
        doc.setFontSize(17);
        doc.text(wholesalePrice, detailX, 117);
        doc.setTextColor(110, 116, 130);
        doc.setFontSize(7);
        doc.text('PRECIO SUGERIDO EN:', detailX, 130);
        doc.setTextColor(27, 35, 51);
        doc.setFontSize(17);
        doc.text(ecommercePrice, detailX, 142);
      }
    }
    doc.setFillColor(27, 35, 51);
    doc.rect(detailX, 146, detailWidth, 4, 'F');
    if (logo) {
      try { doc.addImage(logo, 'JPEG', pageWidth - 32, 130, 20, 15); } catch (_) {}
    }
    drawFooter(doc, page, totalPages, pageWidth);
  }

  return {
    blob: doc.output('blob'),
    fileName: `Catalogo-Lookbook-2026-${options.priceMode}.pdf`,
    failedImages,
    pageCount: totalPages,
  };
}
