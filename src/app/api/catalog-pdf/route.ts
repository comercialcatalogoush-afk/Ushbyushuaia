import { NextResponse } from 'next/server';
import { fetchAllProductsAdmin } from '@/lib/supabase';
import { INITIAL_PRODUCTS } from '@/data/products';
import { Product } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  let products: Product[] = [];
  try {
    const fromDb = await fetchAllProductsAdmin();
    if (fromDb && fromDb.length > 0) {
      products = fromDb.filter((p) => !p.hidden && p.status !== 'draft' && p.images && p.images.length > 0);
    }
  } catch (e) {
    console.error('Error loading products for PDF:', e);
  }

  if (products.length === 0) {
    products = INITIAL_PRODUCTS.filter((p) => p.images && p.images.length > 0);
  }

  // Generate pages: Cover, Editorial Manifest, then 2 products per luxury editorial page
  const featuredProduct = products.find((p) => p.images && p.images.length > 1) || products[0];

  const productPairs: Array<typeof products> = [];
  for (let i = 0; i < products.length; i += 2) {
    productPairs.push(products.slice(i, i + 2));
  }

  const productPagesHtml = productPairs.map((pair, pageIdx) => {
    return `
      <div class="lookbook-page product-spread">
        <div class="spread-header">
          <span class="brand-sub">USH BY USHUAIA</span>
          <span class="collection-title">COLECCIÓN DENIM 2026</span>
          <span class="page-num">${pageIdx + 3}</span>
        </div>

        <div class="products-duo">
          ${pair.map((p, idx) => {
            const img = p.images[0] || '';
            const secondImg = p.images[1] || '';
            const fit = p.fit || 'Denim Rígido';
            const cat = p.category || 'Jeans';
            const sizes = (p.options?.find((o) => o.key.toLowerCase() === 'talla')?.values || ['6', '8', '10', '12', '14']).join(' · ');

            return `
              <div class="product-item ${idx === 0 ? 'item-primary' : 'item-secondary'}">
                <div class="photo-frame">
                  ${img ? `<img src="${img}" alt="${p.name}" class="main-img" />` : ''}
                  ${p.ribbon ? `<div class="tag-ribbon">${p.ribbon}</div>` : ''}
                  <div class="ref-pill">REF. #${p.reference}</div>
                </div>

                <div class="product-details">
                  <div class="title-group">
                    <span class="fit-label">${cat.toUpperCase()} · ${fit.toUpperCase()}</span>
                    <h3 class="item-name">${p.name}</h3>
                  </div>

                  <div class="meta-row">
                    <span class="sizes-tag">TALLAS: ${sizes}</span>
                  </div>

                  <!-- Price area: editable directly by mayorista before print -->
                  <div class="price-container">
                    <span class="price-currency">$</span>
                    <span class="price-val" contenteditable="true" data-ref="${p.reference}" placeholder="Ingresar precio"></span>
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>

        <div class="spread-footer">
          <span>CONFECCIÓN NACIONAL · 100% ALGODÓN</span>
          <span>HECHO EN COLOMBIA</span>
        </div>
      </div>
    `;
  }).join('');

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Catálogo Lookbook Editorial · USH BY USHUAIA</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400;1,600&family=Montserrat:wght@300;400;500;600;700;800;900&family=Playfair+Display:ital,wght@0,600;0,800;1,400&display=swap" rel="stylesheet">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }

  :root {
    --bg-sand: #f7f3ee;
    --bg-cream: #faf7f2;
    --bg-warm-card: #f2ece3;
    --text-navy: #1b2333;
    --text-muted: #7d756d;
    --accent-gold: #c5a47e;
    --accent-rose: #d88193;
    --border-light: #e6ded3;
  }

  body {
    font-family: 'Montserrat', sans-serif;
    background: #e8e2d8;
    color: var(--text-navy);
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
    padding-bottom: 60px;
  }

  /* ── STICKY CONTROL BAR (SCREEN ONLY) ── */
  .control-bar {
    position: sticky;
    top: 0;
    z-index: 1000;
    background: #1b2333;
    color: white;
    padding: 14px 24px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.25);
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    font-family: 'Montserrat', sans-serif;
  }

  .control-title {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .control-title h2 {
    font-size: 13px;
    font-weight: 800;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: #fff;
  }
  .control-title p {
    font-size: 11px;
    color: #a0aec0;
  }

  .control-actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 10px;
  }

  .btn-mode {
    background: rgba(255,255,255,0.08);
    border: 1px solid rgba(255,255,255,0.2);
    color: #fff;
    padding: 8px 14px;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.05em;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s;
  }
  .btn-mode:hover, .btn-mode.active {
    background: var(--accent-rose);
    border-color: var(--accent-rose);
  }

  .btn-print {
    background: #c5a47e;
    color: #1b2333;
    border: none;
    padding: 10px 22px;
    font-size: 12px;
    font-weight: 800;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    border-radius: 4px;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(197, 164, 126, 0.4);
    transition: all 0.2s;
  }
  .btn-print:hover {
    background: #d4b591;
    transform: translateY(-1px);
  }

  /* ── CATALOG CONTAINER ── */
  .catalog-container {
    max-width: 900px;
    margin: 30px auto;
    display: flex;
    flex-direction: column;
    gap: 30px;
  }

  /* ── LOOKBOOK PAGE BASE ── */
  .lookbook-page {
    width: 100%;
    min-height: 1200px;
    aspect-ratio: 1 / 1.414; /* A4 Ratio */
    background: var(--bg-cream);
    box-shadow: 0 10px 35px rgba(0,0,0,0.1);
    position: relative;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 50px 45px;
    page-break-after: always;
    break-after: page;
  }

  /* ── 1. PORTADA EDITORIAL (ESTILO AVEMARÍA / LUXURY) ── */
  .cover-page {
    background: var(--bg-sand);
    padding: 40px;
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }

  .cover-border-box {
    position: absolute;
    inset: 25px;
    border: 1px solid rgba(197, 164, 126, 0.4);
    pointer-events: none;
    z-index: 10;
  }

  .cover-hero-img-wrapper {
    position: absolute;
    inset: 0;
    z-index: 1;
    overflow: hidden;
  }
  .cover-hero-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    filter: brightness(0.92);
  }
  .cover-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(180deg, rgba(27,35,51,0.4) 0%, rgba(27,35,51,0.05) 40%, rgba(27,35,51,0.75) 100%);
    z-index: 2;
  }

  .cover-top {
    position: relative;
    z-index: 5;
    text-align: center;
    padding-top: 20px;
  }
  .cover-tagline {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.4em;
    text-transform: uppercase;
    color: #ffffff;
    text-shadow: 0 2px 4px rgba(0,0,0,0.4);
  }

  .cover-bottom {
    position: relative;
    z-index: 5;
    text-align: center;
    padding-bottom: 30px;
    color: white;
  }
  .cover-brand-sub {
    font-size: 13px;
    letter-spacing: 0.35em;
    font-weight: 600;
    text-transform: uppercase;
    color: #e6ded3;
    margin-bottom: 8px;
  }
  .cover-main-title {
    font-family: 'Playfair Display', serif;
    font-size: 52px;
    font-weight: 800;
    letter-spacing: 0.02em;
    text-transform: uppercase;
    line-height: 1.05;
    color: #ffffff;
    text-shadow: 0 4px 15px rgba(0,0,0,0.4);
  }
  .cover-line {
    width: 80px;
    height: 2px;
    background: var(--accent-gold);
    margin: 20px auto;
  }
  .cover-desc {
    font-size: 12px;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: #f7f3ee;
    font-weight: 400;
  }

  /* ── 2. MANIFESTO / MOODBOARD PAGE ── */
  .manifesto-page {
    background: var(--bg-sand);
  }
  .manifesto-grid {
    display: grid;
    grid-template-columns: 1.2fr 1fr;
    gap: 25px;
    height: 100%;
    margin-top: 15px;
    margin-bottom: 15px;
  }
  .manifesto-left {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }
  .manifesto-img-tall {
    width: 100%;
    height: 70%;
    object-fit: cover;
    border-radius: 2px;
  }
  .manifesto-quote-card {
    background: var(--bg-warm-card);
    border: 1px solid var(--border-light);
    padding: 24px;
    border-radius: 2px;
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }
  .manifesto-quote-card h4 {
    font-family: 'Playfair Display', serif;
    font-size: 20px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--text-navy);
    margin-bottom: 8px;
  }
  .manifesto-quote-card p {
    font-family: 'Cormorant Garamond', serif;
    font-size: 16px;
    line-height: 1.5;
    color: var(--text-muted);
    font-style: italic;
  }

  .manifesto-right {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }
  .manifesto-img-detail {
    width: 100%;
    height: 48%;
    object-fit: cover;
    border-radius: 2px;
  }

  /* ── 3. PRODUCT SPREAD PAGES (2 PRODUCTOS POR PÁGINA) ── */
  .product-spread {
    background: var(--bg-cream);
  }

  .spread-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid var(--border-light);
    padding-bottom: 15px;
    font-size: 9px;
    letter-spacing: 0.25em;
    font-weight: 700;
    text-transform: uppercase;
    color: var(--text-muted);
  }
  .spread-header .collection-title {
    color: var(--accent-gold);
    font-weight: 800;
  }

  .products-duo {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 35px;
    margin: auto 0;
    padding: 20px 0;
  }

  .product-item {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .photo-frame {
    position: relative;
    width: 100%;
    aspect-ratio: 3 / 4;
    background: #eee6db;
    overflow: hidden;
    border-radius: 2px;
    box-shadow: 0 4px 15px rgba(0,0,0,0.04);
  }
  .photo-frame .main-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  .tag-ribbon {
    position: absolute;
    top: 12px;
    left: 0;
    background: var(--accent-rose);
    color: white;
    font-size: 8px;
    font-weight: 800;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    padding: 4px 10px;
    box-shadow: 0 2px 8px rgba(216,129,147,0.4);
  }

  .ref-pill {
    position: absolute;
    bottom: 12px;
    right: 12px;
    background: rgba(255,255,255,0.92);
    backdrop-filter: blur(4px);
    color: var(--text-navy);
    font-size: 9px;
    font-weight: 800;
    letter-spacing: 0.12em;
    padding: 4px 10px;
    border-radius: 2px;
  }

  .product-details {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .fit-label {
    font-size: 8.5px;
    letter-spacing: 0.25em;
    font-weight: 700;
    color: var(--accent-gold);
    text-transform: uppercase;
  }

  .item-name {
    font-family: 'Playfair Display', serif;
    font-size: 17px;
    font-weight: 700;
    color: var(--text-navy);
    line-height: 1.25;
    text-transform: capitalize;
  }

  .sizes-tag {
    font-size: 8.5px;
    letter-spacing: 0.15em;
    color: var(--text-muted);
    font-weight: 600;
    text-transform: uppercase;
  }

  /* ── PRICE STYLES (EDITABLE / BLANK) ── */
  .price-container {
    margin-top: 6px;
    padding-top: 8px;
    border-top: 1px dashed var(--border-light);
    display: flex;
    align-items: baseline;
    gap: 4px;
  }

  .price-currency {
    font-family: 'Playfair Display', serif;
    font-size: 18px;
    font-weight: 700;
    color: var(--text-navy);
  }

  .price-val {
    font-family: 'Playfair Display', serif;
    font-size: 20px;
    font-weight: 800;
    color: var(--text-navy);
    min-width: 90px;
    display: inline-block;
    border-bottom: 1.5px solid transparent;
    transition: all 0.2s;
  }
  .price-val:focus {
    outline: none;
    border-bottom-color: var(--accent-rose);
    background: #fff;
    padding: 0 4px;
  }
  .price-val:empty::before {
    content: attr(placeholder);
    color: #c4b8aa;
    font-family: 'Montserrat', sans-serif;
    font-size: 10px;
    font-weight: 500;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }

  /* Blank line mode */
  body.mode-blank .price-val {
    border-bottom: 1.5px solid #a89f91;
    min-width: 110px;
  }
  body.mode-blank .price-val:empty::before {
    content: '';
  }

  /* Hidden price mode */
  body.mode-hide .price-container {
    display: none;
  }

  .spread-footer {
    display: flex;
    justify-content: space-between;
    border-top: 1px solid var(--border-light);
    padding-top: 15px;
    font-size: 8px;
    letter-spacing: 0.25em;
    font-weight: 600;
    color: var(--text-muted);
  }

  /* ── PRINT RULES ── */
  @media print {
    .control-bar { display: none !important; }
    body {
      background: #fff;
      padding: 0;
    }
    .catalog-container {
      margin: 0;
      max-width: 100%;
      gap: 0;
    }
    .lookbook-page {
      box-shadow: none;
      min-height: 100vh;
      page-break-after: always;
      break-after: page;
      padding: 40px 35px;
    }
    .cover-page {
      padding: 30px;
    }
    @page {
      size: A4 portrait;
      margin: 0;
    }
  }
</style>
</head>
<body class="mode-blank">

<!-- ── STICKY CONTROL BAR ── -->
<div class="control-bar">
  <div class="control-title">
    <h2>Catálogo Lookbook Editorial · USH BY USHUAIA</h2>
    <p>Haz clic en los precios para escribirlos, déjalos en blanco con línea para escribir a mano, o descarga el PDF.</p>
  </div>

  <div class="control-actions">
    <button class="btn-mode active" onclick="setMode('blank', this)">
      ✏️ Línea en Blanco (para escribir)
    </button>
    <button class="btn-mode" onclick="setMode('edit', this)">
      💲 Precios Personalizados (Escribir)
    </button>
    <button class="btn-mode" onclick="setMode('hide', this)">
      🚫 Sin Precios
    </button>
    <button class="btn-print" onclick="window.print()">
      📄 Descargar / Guardar PDF
    </button>
  </div>
</div>

<div class="catalog-container">

  <!-- ── 1. PORTADA EDITORIAL ── -->
  <div class="lookbook-page cover-page">
    <div class="cover-border-box"></div>
    <div class="cover-hero-img-wrapper">
      <img src="${featuredProduct.images[0]}" alt="Cover Hero" class="cover-hero-img" />
      <div class="cover-overlay"></div>
    </div>

    <div class="cover-top">
      <div class="cover-tagline">CATÁLOGO OFICIAL · 2026</div>
    </div>

    <div class="cover-bottom">
      <div class="cover-brand-sub">CONFECCIÓN NACIONAL</div>
      <h1 class="cover-main-title">USH BY USHUAIA</h1>
      <div class="cover-line"></div>
      <p class="cover-desc">COLECCIÓN DENIM RÍGIDO & SILUETAS ATEMPORALES</p>
    </div>
  </div>

  <!-- ── 2. MANIFESTO & MOODBOARD ── -->
  <div class="lookbook-page manifesto-page">
    <div class="spread-header">
      <span class="brand-sub">USH BY USHUAIA</span>
      <span class="collection-title">INSPIRACIÓN & ARTE DENIM</span>
      <span class="page-num">02</span>
    </div>

    <div class="manifesto-grid">
      <div class="manifesto-left">
        ${products[1]?.images[0] ? `<img src="${products[1].images[0]}" alt="Mood 1" class="manifesto-img-tall" />` : ''}
        <div class="manifesto-quote-card">
          <h4>Denim Rígido Colombiano</h4>
          <p>“Diseñamos piezas con carácter, confección impecable y telas de alta resistencia que moldean la silueta con elegancia y autenticidad.”</p>
        </div>
      </div>

      <div class="manifesto-right">
        ${products[2]?.images[0] ? `<img src="${products[2].images[0]}" alt="Mood 2" class="manifesto-img-detail" />` : ''}
        ${products[3]?.images[0] ? `<img src="${products[3].images[0]}" alt="Mood 3" class="manifesto-img-detail" />` : ''}
      </div>
    </div>

    <div class="spread-footer">
      <span>HECHO EN ITAGÜÍ, ANTIOQUIA</span>
      <span>CALIDAD Y VANGUARDIA</span>
    </div>
  </div>

  <!-- ── 3. PRODUCT SPREADS ── -->
  ${productPagesHtml}

</div>

<script>
  function setMode(mode, btn) {
    document.body.className = 'mode-' + mode;
    document.querySelectorAll('.btn-mode').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');

    if (mode === 'blank') {
      document.querySelectorAll('.price-val').forEach(el => el.innerText = '');
    }
  }

  // Double click price to edit
  document.querySelectorAll('.price-val').forEach(el => {
    el.addEventListener('focus', () => {
      document.body.classList.remove('mode-blank');
      document.body.classList.add('mode-edit');
      document.querySelectorAll('.btn-mode').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.btn-mode')[1].classList.add('active');
    });
  });
</script>

</body>
</html>`;

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}
