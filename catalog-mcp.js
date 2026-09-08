// Servidor MCP (stdio) para administrar y sincronizar el Catálogo Digital de Ush By Ushuaia.
// Permite consultar productos, extraer fotos desde Google Drive, cruzar datos con la tienda retail,
// actualizar precios/visibilidad en Supabase, sincronizar drive-map.ts y revalidar la caché de Vercel.
// Protocolo: MCP over stdio (JSON-RPC 2.0, una línea JSON por mensaje).

const fs = require('fs');
const path = require('path');
const https = require('https');
const readline = require('readline');

// Directorio raíz del proyecto
const PROJECT_DIR = path.resolve(__dirname);

// Cargar variables de entorno desde .env.local sin librerías externas
function loadEnv() {
  const envPath = path.join(PROJECT_DIR, '.env.local');
  const env = { ...process.env };
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx !== -1) {
        const k = trimmed.substring(0, eqIdx).trim();
        const v = trimmed.substring(eqIdx + 1).trim().replace(/^['"]|['"]$/g, '');
        env[k] = v;
      }
    }
  }
  return env;
}

const env = loadEnv();
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL || 'https://uwfkwcrqqwruzfwzppjf.supabase.co';
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY || '';
const FOLDER_FRAGMENT = '1CjduDOEllqXQjR7mhNxp69u5vfO-vkfL';
const REVALIDATE_SECRET = env.REVALIDATE_SECRET || '';

// Helper HTTPS GET genérico
function httpGet(url, headers = {}, maxBytes = 4000000) {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https://');
    const client = isHttps ? https : require('http');
    const req = client.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', ...headers },
    }, (res) => {
      if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location) {
        return httpGet(res.headers.location, headers, maxBytes).then(resolve).catch(reject);
      }
      let d = '';
      res.on('data', c => { d += c; if (d.length > maxBytes) req.destroy(); });
      res.on('end', () => resolve({ status: res.statusCode, body: d, headers: res.headers }));
    });
    req.on('error', (err) => {
      if (['ECONNRESET', 'ECONNABORTED'].includes(err.code)) resolve({ status: 200, body: '' });
      else reject(err);
    });
    req.setTimeout(25000, () => { req.destroy(); resolve({ status: 408, body: '' }); });
  });
}

// Peticiones a Supabase REST
function supabaseRest(subpath, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const bodyStr = body ? JSON.stringify(body) : null;
    const reqHeaders = {
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
    };
    if (method === 'PATCH' || method === 'POST') {
      reqHeaders['Prefer'] = 'return=representation';
    }
    if (bodyStr) {
      reqHeaders['Content-Length'] = Buffer.byteLength(bodyStr);
    }

    const req = https.request(`${SUPABASE_URL}${subpath}`, {
      method,
      headers: reqHeaders,
    }, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try {
          const json = d ? JSON.parse(d) : null;
          resolve({ status: res.statusCode, data: json, raw: d });
        } catch (e) {
          resolve({ status: res.statusCode, data: null, raw: d });
        }
      });
    });
    req.on('error', reject);
    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

// ── Herramientas Principales ──

// 1. Diagnóstico completo del catálogo
async function getCatalogStatus() {
  const res = await supabaseRest('/rest/v1/products?select=id,reference,name,price,suggested_price,images,hidden,category,status&limit=1000');
  if (res.status !== 200 || !Array.isArray(res.data)) {
    return { success: false, message: `Error al consultar Supabase (HTTP ${res.status}): ${res.raw}` };
  }

  const products = res.data;
  const total = products.length;
  let visible = 0;
  let hidden = 0;
  let withGoodPhotos = 0;
  let withoutPhotos = 0;
  let withFolderPlaceholder = 0;
  let pendingWholesalePrice = 0;

  const categories = {};

  for (const p of products) {
    if (p.hidden) hidden++;
    else visible++;

    const imgs = p.images || [];
    if (imgs.length === 0) {
      withoutPhotos++;
    } else if (imgs.some(u => u.includes(FOLDER_FRAGMENT))) {
      withFolderPlaceholder++;
    } else {
      withGoodPhotos++;
    }

    // Pendientes de precio mayorista: price es null, 0 o igual al suggested_price en productos nuevos
    if (!p.price || p.price <= 0 || (p.price === p.suggested_price && p.hidden)) {
      pendingWholesalePrice++;
    }

    const cat = p.category || 'Sin categoría';
    categories[cat] = (categories[cat] || 0) + 1;
  }

  return {
    success: true,
    total_products: total,
    visible_in_store: visible,
    hidden_drafts: hidden,
    photos_status: {
      with_active_photos: withGoodPhotos,
      empty_photos: withoutPhotos,
      folder_placeholder: withFolderPlaceholder,
    },
    pricing_status: {
      wholesale_price_confirmed: total - pendingWholesalePrice,
      wholesale_price_pending: pendingWholesalePrice,
    },
    categories,
  };
}

// 2. Obtener producto por referencia
async function getProduct(reference) {
  const refClean = String(reference).replace(/^ref-/, '').trim();
  const res = await supabaseRest(`/rest/v1/products?or=(reference.eq.${refClean},id.eq.ref-${refClean})&limit=1`);
  if (res.status !== 200 || !res.data || res.data.length === 0) {
    return { success: false, message: `Producto con referencia ${reference} no encontrado.` };
  }
  return { success: true, product: res.data[0] };
}

// 3. Listar productos con filtros
async function listProducts(filter = 'all', query = '', limit = 30, offset = 0) {
  let subpath = '/rest/v1/products?select=id,reference,name,price,suggested_price,images,hidden,category,fit&order=reference.asc';

  if (filter === 'visible') subpath += '&hidden=eq.false';
  else if (filter === 'hidden') subpath += '&hidden=eq.true';

  if (query) {
    const qClean = encodeURIComponent(query.trim());
    subpath += `&or=(name.ilike.*${qClean}*,reference.ilike.*${qClean}*,category.ilike.*${qClean}*)`;
  }

  subpath += `&limit=${limit}&offset=${offset}`;

  const res = await supabaseRest(subpath);
  if (res.status !== 200 || !Array.isArray(res.data)) {
    return { success: false, message: `Error al listar productos: ${res.raw}` };
  }

  let list = res.data;
  if (filter === 'without_photos') {
    list = list.filter(p => !p.images || p.images.length === 0);
  } else if (filter === 'pending_price') {
    list = list.filter(p => !p.price || p.price === p.suggested_price);
  }

  return {
    success: true,
    count: list.length,
    limit,
    offset,
    products: list.map(p => ({
      reference: p.reference,
      name: p.name,
      category: p.category,
      fit: p.fit,
      price_wholesale: p.price,
      price_retail: p.suggested_price,
      images_count: (p.images || []).length,
      hidden: p.hidden,
    })),
  };
}

// 4. Sincronizar fotos desde Google Drive
async function syncDrivePhotos(reference, folderUrlOrId) {
  const refClean = String(reference).replace(/^ref-/, '').trim();
  let folderId = folderUrlOrId;
  const match = String(folderUrlOrId).match(/\/folders\/([A-Za-z0-9_-]+)/);
  if (match) folderId = match[1];

  if (!folderId || folderId.length < 20) {
    return { success: false, message: `ID o enlace de carpeta de Google Drive inválido: ${folderUrlOrId}` };
  }

  // Consultar subcarpeta en Google Drive
  const driveRes = await httpGet(`https://drive.google.com/embeddedfolderview?id=${folderId}#list`);
  if (driveRes.status !== 200) {
    return { success: false, message: `No se pudo acceder a la carpeta de Drive (HTTP ${driveRes.status})` };
  }

  const fileIds = [];
  const pat = /id="entry-([A-Za-z0-9_-]{20,})"/g;
  let m;
  while ((m = pat.exec(driveRes.body)) !== null) {
    if (m[1] !== folderId && m[1] !== FOLDER_FRAGMENT) {
      fileIds.push(m[1]);
    }
  }

  const imageUrls = fileIds.map(id => `https://lh3.googleusercontent.com/d/${id}`);

  // Actualizar en Supabase
  const patchRes = await supabaseRest(`/rest/v1/products?reference=eq.${refClean}`, 'PATCH', { images: imageUrls });
  if (patchRes.status !== 200 && patchRes.status !== 204) {
    return { success: false, message: `Supabase no pudo actualizar fotos (HTTP ${patchRes.status}): ${patchRes.raw}` };
  }

  // Actualizar en drive-map.ts
  const driveMapPath = path.join(PROJECT_DIR, 'src', 'data', 'drive-map.ts');
  if (fs.existsSync(driveMapPath)) {
    let content = fs.readFileSync(driveMapPath, 'utf8');
    const formattedUrls = imageUrls.map(u => `'${u}'`).join(', ');
    const newLine = `  '${refClean}': [${formattedUrls}],`;
    const regex = new RegExp(`^\\s*'${refClean}':\\s*\\[[^\\]]*\\],?`, 'm');

    if (regex.test(content)) {
      content = content.replace(regex, newLine);
    } else {
      content = content.replace(/\n\};\s*$/, `\n${newLine}\n};\n`);
    }
    fs.writeFileSync(driveMapPath, content, 'utf8');
  }

  return {
    success: true,
    reference: refClean,
    folder_id: folderId,
    photos_found: imageUrls.length,
    image_urls: imageUrls,
    message: imageUrls.length > 0
      ? `Se vincularon ${imageUrls.length} fotos exitosamente a la referencia ${refClean}.`
      : `La carpeta de Drive no contiene fotos (0 archivos). Se actualizó con lista vacía.`,
  };
}

// 5. Sincronizar desde la tienda oficial retail ushuaiajeans.com.co
async function syncFromRetail(reference) {
  const refClean = String(reference).replace(/^ref-/, '').trim();
  const shopifyRes = await httpGet('https://ushuaiajeans.com.co/products.json?limit=250');
  if (shopifyRes.status !== 200) {
    return { success: false, message: `Error al consultar la tienda retail (HTTP ${shopifyRes.status})` };
  }

  let products = [];
  try {
    products = JSON.parse(shopifyRes.body).products || [];
  } catch (e) {
    return { success: false, message: 'Respuesta inválida de Shopify' };
  }

  // Buscar por referencia en el título
  const match = products.find(p => {
    const title = p.title || '';
    const refRegex = new RegExp(`\\b(?:Ref|REF|ref)\\s*:?\\s*${refClean}\\b`, 'i');
    return refRegex.test(title);
  });

  if (!match) {
    return { success: false, message: `La referencia ${refClean} no fue encontrada en la tienda retail oficial ushuaiajeans.com.co.` };
  }

  // Extraer información
  const titleClean = match.title.replace(/^Ref:?\s*\d+\s*-?\s*/i, '').trim();
  const firstVariant = (match.variants && match.variants[0]) || {};
  const priceRetail = parseFloat(firstVariant.compare_at_price || firstVariant.price || '0');

  // Inferir fit y categoría
  let fit = '';
  const lowerTitle = match.title.toLowerCase();
  if (lowerTitle.includes('wide leg')) fit = 'Wide Leg';
  else if (lowerTitle.includes('flare')) fit = 'Flare';
  else if (lowerTitle.includes('skinny')) fit = 'Skinny';
  else if (lowerTitle.includes('straight')) fit = 'Straight';
  else if (lowerTitle.includes('mom')) fit = 'Mom';
  else if (lowerTitle.includes('bootcut')) fit = 'Bootcut';
  else if (lowerTitle.includes('cargo')) fit = 'Cargo';
  else if (lowerTitle.includes('bota recta')) fit = 'Bota Recta';

  let category = 'Jeans';
  if (lowerTitle.includes('short') || lowerTitle.includes('bermuda')) category = 'Shorts';
  else if (lowerTitle.includes('falda')) category = 'Faldas';
  else if (lowerTitle.includes('pantalon') || lowerTitle.includes('pantalón') || lowerTitle.includes('cargo') || lowerTitle.includes('dockers')) category = 'Pantalones';

  const updatePayload = {
    name: titleClean || match.title,
    suggested_price: priceRetail > 0 ? priceRetail : undefined,
    compare_price: priceRetail > 0 ? priceRetail : undefined,
    category,
  };
  if (fit) updatePayload.fit = fit;
  if (match.body_html) {
    const cleanDesc = match.body_html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    if (cleanDesc) updatePayload.description = cleanDesc;
  }

  // Actualizar en Supabase
  const patchRes = await supabaseRest(`/rest/v1/products?reference=eq.${refClean}`, 'PATCH', updatePayload);
  if (patchRes.status !== 200 && patchRes.status !== 204) {
    return { success: false, message: `Error al guardar en Supabase (HTTP ${patchRes.status}): ${patchRes.raw}` };
  }

  return {
    success: true,
    reference: refClean,
    matched_retail_title: match.title,
    applied_updates: updatePayload,
  };
}

// 6. Actualizar producto manualmente
async function updateProduct(reference, fields) {
  const refClean = String(reference).replace(/^ref-/, '').trim();
  const allowed = ['name', 'price', 'suggested_price', 'compare_price', 'hidden', 'category', 'fit', 'description', 'full_description', 'status', 'stock_by_size'];
  const payload = {};

  for (const k of allowed) {
    if (fields[k] !== undefined) {
      payload[k] = fields[k];
    }
  }

  if (Object.keys(payload).length === 0) {
    return { success: false, message: 'No se pasaron campos válidos para actualizar.' };
  }

  const patchRes = await supabaseRest(`/rest/v1/products?reference=eq.${refClean}`, 'PATCH', payload);
  if (patchRes.status !== 200 && patchRes.status !== 204) {
    return { success: false, message: `Error al actualizar en Supabase (HTTP ${patchRes.status}): ${patchRes.raw}` };
  }

  return {
    success: true,
    reference: refClean,
    updated_fields: payload,
  };
}

// 7. Publicar u ocultar producto
async function setProductVisibility(reference, visible) {
  const refClean = String(reference).replace(/^ref-/, '').trim();
  const prodRes = await getProduct(refClean);
  if (!prodRes.success) return prodRes;

  const prod = prodRes.product;

  if (visible) {
    // Validaciones para publicar
    const errors = [];
    if (!prod.price || prod.price <= 0) errors.push('No tiene precio mayorista asignado');
    if (!prod.images || prod.images.length === 0) errors.push('No tiene fotografías asignadas');
    if (errors.length > 0) {
      return {
        success: false,
        message: `No se puede hacer visible la referencia ${refClean} porque: ${errors.join(', ')}. Asigna el precio/fotos antes de publicar.`,
      };
    }
  }

  const patchRes = await supabaseRest(`/rest/v1/products?reference=eq.${refClean}`, 'PATCH', { hidden: !visible });
  if (patchRes.status !== 200 && patchRes.status !== 204) {
    return { success: false, message: `Error al actualizar visibilidad (HTTP ${patchRes.status})` };
  }

  return {
    success: true,
    reference: refClean,
    visible,
    status: visible ? 'VISIBLE en el catálogo' : 'OCULTO (Borrador)',
  };
}

// 8. Revalidar caché de Vercel
async function revalidateCache() {
  const siteUrl = 'https://ushbyushuaia.vercel.app';
  const postData = JSON.stringify({ secret: REVALIDATE_SECRET });

  return new Promise((resolve) => {
    const req = https.request(`${siteUrl}/api/revalidate-db`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
      },
    }, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        resolve({
          success: res.statusCode === 200,
          http_status: res.statusCode,
          response: d,
          message: res.statusCode === 200
            ? 'Caché de Vercel purgada exitosamente. Los cambios son visibles de inmediato en producción.'
            : `Respuesta de revalidación HTTP ${res.statusCode}: ${d}`,
        });
      });
    });
    req.on('error', (err) => {
      resolve({ success: false, message: `Error al conectar con endpoint de revalidación: ${err.message}` });
    });
    req.write(postData);
    req.end();
  });
}

// ── Definición de Herramientas MCP ──
const tools = [
  {
    name: 'catalog_status',
    description: 'Diagnóstico en tiempo real del catálogo digital: total de productos, visibles, ocultos, fotos activas y pendientes de precio mayorista.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'get_product',
    description: 'Obtiene el detalle completo de un producto por su número de referencia (ej. 552605).',
    inputSchema: {
      type: 'object',
      properties: {
        reference: { type: 'string', description: 'Número de referencia o código de producto (ej. "552605")' },
      },
      required: ['reference'],
    },
  },
  {
    name: 'list_products',
    description: 'Lista referencias con filtros avanzados (visible, hidden, without_photos, pending_price) y búsqueda por texto.',
    inputSchema: {
      type: 'object',
      properties: {
        filter: {
          type: 'string',
          enum: ['all', 'visible', 'hidden', 'without_photos', 'pending_price'],
          description: 'Filtro de visualización (por defecto "all")',
        },
        query: { type: 'string', description: 'Término de búsqueda opcional por nombre o ref' },
        limit: { type: 'number', description: 'Cantidad máxima de registros (default 30)' },
        offset: { type: 'number', description: 'Salto de página (default 0)' },
      },
    },
  },
  {
    name: 'sync_drive_photos',
    description: 'Extrae automáticamente las fotos de alta resolución de una carpeta de Google Drive y las guarda en Supabase y drive-map.ts.',
    inputSchema: {
      type: 'object',
      properties: {
        reference: { type: 'string', description: 'Número de referencia a actualizar (ej. "552843")' },
        folder_url_or_id: { type: 'string', description: 'Enlace completo de la carpeta de Drive o su ID' },
      },
      required: ['reference', 'folder_url_or_id'],
    },
  },
  {
    name: 'sync_from_retail',
    description: 'Cruza una referencia con la tienda oficial ushuaiajeans.com.co y actualiza título comercial, fit, descripción y precio al detal.',
    inputSchema: {
      type: 'object',
      properties: {
        reference: { type: 'string', description: 'Número de referencia a cruzar (ej. "552605")' },
      },
      required: ['reference'],
    },
  },
  {
    name: 'update_product',
    description: 'Actualiza campos específicos de un producto en Supabase (precio mayorista, detal, tallas, categoría, etc.).',
    inputSchema: {
      type: 'object',
      properties: {
        reference: { type: 'string', description: 'Referencia a actualizar' },
        fields: {
          type: 'object',
          description: 'Campos a modificar (price, suggested_price, name, category, fit, description, hidden, stock_by_size)',
        },
      },
      required: ['reference', 'fields'],
    },
  },
  {
    name: 'publish_product',
    description: 'Publica (visible: true) u oculta (visible: false) un producto en el catálogo digital validando que tenga precio y fotos.',
    inputSchema: {
      type: 'object',
      properties: {
        reference: { type: 'string', description: 'Número de referencia' },
        visible: { type: 'boolean', description: 'true para publicar en catálogo público, false para pasar a borrador/oculto' },
      },
      required: ['reference', 'visible'],
    },
  },
  {
    name: 'revalidate_cache',
    description: 'Purga la caché de Vercel para que los cambios en Supabase sean visibles de inmediato en ushbyushuaia.vercel.app.',
    inputSchema: { type: 'object', properties: {} },
  },
];

// ── Bucle de Entrada/Salida MCP over stdio ──
const rl = readline.createInterface({ input: process.stdin, crlfDelay: Infinity });

function respond(msg, result, isError = false) {
  const obj = { jsonrpc: '2.0', id: msg.id, result };
  if (isError) obj.error = { code: -32000, message: typeof result === 'string' ? result : 'Error de ejecución' };
  process.stdout.write(JSON.stringify(obj) + '\n');
}

async function executeTool(name, args = {}) {
  switch (name) {
    case 'catalog_status':
      return { content: [{ type: 'text', text: JSON.stringify(await getCatalogStatus(), null, 2) }] };
    case 'get_product':
      return { content: [{ type: 'text', text: JSON.stringify(await getProduct(args.reference), null, 2) }] };
    case 'list_products':
      return { content: [{ type: 'text', text: JSON.stringify(await listProducts(args.filter, args.query, args.limit, args.offset), null, 2) }] };
    case 'sync_drive_photos':
      return { content: [{ type: 'text', text: JSON.stringify(await syncDrivePhotos(args.reference, args.folder_url_or_id), null, 2) }] };
    case 'sync_from_retail':
      return { content: [{ type: 'text', text: JSON.stringify(await syncFromRetail(args.reference), null, 2) }] };
    case 'update_product':
      return { content: [{ type: 'text', text: JSON.stringify(await updateProduct(args.reference, args.fields), null, 2) }] };
    case 'publish_product':
      return { content: [{ type: 'text', text: JSON.stringify(await setProductVisibility(args.reference, args.visible), null, 2) }] };
    case 'revalidate_cache':
      return { content: [{ type: 'text', text: JSON.stringify(await revalidateCache(), null, 2) }] };
    default:
      return { content: [{ type: 'text', text: JSON.stringify({ success: false, message: `Herramienta desconocida: ${name}` }) }] };
  }
}

rl.on('close', () => { process.exit(0); });

rl.on('line', async (line) => {
  if (!line.trim()) return;
  let msg;
  try { msg = JSON.parse(line); } catch (e) { return; }
  const method = msg.method;

  if (method === 'initialize') {
    respond(msg, {
      protocolVersion: '2024-11-05',
      capabilities: { tools: {} },
      serverInfo: { name: 'ush-catalog-mcp', version: '1.0.0' },
    });
  } else if (method === 'notifications/initialized') {
    // sin respuesta
  } else if (method === 'ping') {
    respond(msg, {});
  } else if (method === 'tools/list') {
    respond(msg, { tools });
  } else if (method === 'tools/call') {
    try {
      const out = await executeTool(msg.params.name, msg.params.arguments || {});
      respond(msg, out);
    } catch (e) {
      respond(msg, { content: [{ type: 'text', text: JSON.stringify({ success: false, message: e.message || String(e) }) }] });
    }
  } else {
    if (msg.id !== undefined) respond(msg, {});
  }
});
