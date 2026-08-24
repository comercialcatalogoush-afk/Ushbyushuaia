import { NextResponse } from 'next/server';
import { fetchAllProductsAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

function formatCOP(n: number) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency', currency: 'COP', minimumFractionDigits: 0,
  }).format(n);
}

export async function GET() {
  const allProducts = await fetchAllProductsAdmin();
  const products = (allProducts || []).filter(
    (p) => !p.hidden && p.status !== 'draft' && p.images && p.images.length > 0
  );

  const rows = products.map((p) => {
    const img = p.images[0] || '';
    const ref = p.reference;
    const name = p.name;
    const cat = p.category || '';
    const fit = p.fit || '';
    const wholesale = formatCOP(p.price || 0);
    const suggested = p.suggested_price ? formatCOP(p.suggested_price) : '';
    const sizes = (p.options?.find((o) => o.key.toLowerCase() === 'talla')?.values || []).join(' · ') || '';
    const ribbon = p.ribbon || '';

    return `
      <div class="product-card">
        <div class="product-img">
          ${img ? `<img src="${img}" alt="${name}" />` : '<div class="no-img">Sin foto</div>'}
          ${ribbon ? `<span class="ribbon">${ribbon}</span>` : ''}
        </div>
        <div class="product-info">
          <div class="ref">REF. #${ref}</div>
          <div class="name">${name}</div>
          ${cat ? `<div class="cat">${cat}${fit ? ` · ${fit}` : ''}</div>` : ''}
          ${sizes ? `<div class="sizes">${sizes}</div>` : ''}
          <div class="prices">
            <div class="price-item">
              <span class="price-label">Mayorista</span>
              <span class="price-val">${wholesale}</span>
            </div>
            ${suggested ? `<div class="price-item">
              <span class="price-label">Sugerido</span>
              <span class="price-val suggested">${suggested}</span>
            </div>` : ''}
          </div>
        </div>
      </div>`;
  }).join('');

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Catálogo Mayorista USH BY USHUAIA 2026</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;900&display=swap');

  * { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    font-family: 'Montserrat', Arial, sans-serif;
    background: #fff;
    color: #1b2333;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  /* ── COVER PAGE ── */
  .cover {
    width: 100%;
    min-height: 100vh;
    background: #1b2333;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    page-break-after: always;
    break-after: page;
    color: white;
    text-align: center;
    padding: 60px 40px;
  }
  .cover-badge {
    font-size: 10px;
    letter-spacing: 0.35em;
    text-transform: uppercase;
    color: #d88193;
    font-weight: 700;
    margin-bottom: 24px;
  }
  .cover-brand {
    font-size: 64px;
    font-weight: 900;
    letter-spacing: -0.02em;
    text-transform: uppercase;
    line-height: 1;
    color: #ffffff;
  }
  .cover-subtitle {
    font-size: 12px;
    letter-spacing: 0.3em;
    text-transform: uppercase;
    color: #8b9cb5;
    margin-top: 16px;
    font-weight: 600;
  }
  .cover-divider {
    width: 60px;
    height: 3px;
    background: #d88193;
    margin: 32px auto;
  }
  .cover-tagline {
    font-size: 13px;
    color: #c4cfdd;
    line-height: 1.7;
    max-width: 480px;
    font-weight: 400;
  }
  .cover-info {
    margin-top: 60px;
    font-size: 10px;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: #556070;
  }
  .cover-info span { color: #d88193; }

  /* ── PRODUCTS GRID ── */
  .catalog-body { padding: 20px; }

  .section-header {
    padding: 10px 0 8px;
    margin-bottom: 14px;
    border-bottom: 2px solid #1b2333;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .section-title {
    font-size: 9px;
    font-weight: 900;
    letter-spacing: 0.35em;
    text-transform: uppercase;
    color: #1b2333;
  }
  .section-count {
    font-size: 9px;
    color: #888;
    letter-spacing: 0.1em;
  }

  .products-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
  }

  .product-card {
    border: 1px solid #e8e8e8;
    overflow: hidden;
    break-inside: avoid;
    page-break-inside: avoid;
  }

  .product-img {
    position: relative;
    width: 100%;
    aspect-ratio: 3 / 4;
    background: #f2f2f2;
    overflow: hidden;
  }
  .product-img img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
  .no-img {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 9px;
    color: #bbb;
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }
  .ribbon {
    position: absolute;
    top: 8px;
    left: 0;
    background: #d88193;
    color: white;
    font-size: 7px;
    font-weight: 900;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    padding: 3px 8px;
  }

  .product-info {
    padding: 8px;
    background: #fff;
    border-top: 1px solid #f0f0f0;
  }
  .ref {
    font-size: 8px;
    font-weight: 700;
    letter-spacing: 0.2em;
    color: #d88193;
    text-transform: uppercase;
  }
  .name {
    font-size: 9px;
    font-weight: 900;
    text-transform: uppercase;
    color: #1b2333;
    margin-top: 2px;
    line-height: 1.3;
  }
  .cat {
    font-size: 8px;
    color: #888;
    margin-top: 2px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  .sizes {
    font-size: 7.5px;
    color: #aaa;
    margin-top: 3px;
    letter-spacing: 0.05em;
  }
  .prices {
    margin-top: 6px;
    padding-top: 5px;
    border-top: 1px solid #f0f0f0;
    display: flex;
    justify-content: space-between;
    gap: 4px;
  }
  .price-item { display: flex; flex-direction: column; gap: 1px; }
  .price-label {
    font-size: 7px;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: #aaa;
    font-weight: 700;
  }
  .price-val {
    font-size: 9px;
    font-weight: 900;
    color: #1b2333;
  }
  .price-val.suggested { color: #888; font-weight: 600; }

  /* ── FOOTER ── */
  .catalog-footer {
    margin-top: 20px;
    padding: 14px 0;
    border-top: 2px solid #1b2333;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .catalog-footer .brand { font-size: 10px; font-weight: 900; letter-spacing: 0.2em; text-transform: uppercase; }
  .catalog-footer .note { font-size: 8px; color: #888; letter-spacing: 0.1em; text-transform: uppercase; }

  /* ── PRINT ONLY ── */
  @media screen {
    body { max-width: 1200px; margin: 0 auto; }
    .print-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: #1b2333;
      color: white;
      padding: 12px 24px;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      position: sticky;
      top: 0;
      z-index: 100;
    }
    .print-btn {
      background: #d88193;
      color: white;
      border: none;
      padding: 8px 20px;
      font-weight: 900;
      font-size: 11px;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      cursor: pointer;
      font-family: inherit;
    }
    .print-btn:hover { background: #c06579; }
  }
  @media print {
    .print-bar { display: none; }
    .cover { min-height: 100vh; }
    @page { size: A4; margin: 14mm; }
    body { font-size: 9px; }
  }
</style>
</head>
<body>

<!-- Top bar (screen only) -->
<div class="print-bar">
  <span>📄 Catálogo Mayorista USH BY USHUAIA — ${products.length} referencias</span>
  <button class="print-btn" onclick="window.print()">⬇ Descargar / Imprimir PDF</button>
</div>

<!-- Cover page -->
<div class="cover">
  <div class="cover-badge">Catálogo Oficial · Temporada 2026</div>
  <div class="cover-brand">USH BY<br/>USHUAIA</div>
  <div class="cover-divider"></div>
  <div class="cover-tagline">
    Jeans, pantalones y faldas en mezclilla rígida de alta confección nacional.<br/>
    Precios especiales por volumen para tiendas y distribuidores en Colombia.
  </div>
  <div class="cover-subtitle" style="margin-top: 20px;">Catálogo Mayorista · ${products.length} Referencias</div>
  <div class="cover-info" style="margin-top: 50px;">
    Pedidos mínimos <span>12 unidades</span> · Envío gratis desde 12 uds ·
    Confección nacional — <span>Itagüí, Antioquia</span>
  </div>
</div>

<!-- Catalog body -->
<div class="catalog-body">
  <div class="section-header">
    <span class="section-title">USH BY USHUAIA · Colección 2026</span>
    <span class="section-count">${products.length} referencias activas</span>
  </div>

  <div class="products-grid">
    ${rows}
  </div>

  <div class="catalog-footer">
    <span class="brand">USH BY USHUAIA</span>
    <span class="note">ushbyushuaia-catalogo-mayorista.vercel.app · Itagüí, Antioquia, Colombia</span>
    <span class="note">Pedidos: 12+ uds · Envío gratis incluido</span>
  </div>
</div>

</body>
</html>`;

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}
