/**
 * Formateador de descripciones de productos.
 * Convierte texto corrido de Supabase en secciones estructuradas
 * con bullets, highlights y especificaciones técnicas.
 */

export interface DescriptionSection {
  kind: 'intro' | 'features' | 'specs' | 'note';
  title?: string;
  items: string[];
}

const SPEC_KEYS = [
  'material', 'tipo de denim', 'elasticidad', 'grosor', 'fit', 'ajuste',
  'largo de bota', 'cierre', 'tallas disponibles', 'lavado', 'composición',
  'colores disponibles', 'talla', 'hecho en', 'origen', 'género',
];

// Datos clave de decisión de compra que deben verse de inmediato, arriba de la descripción.
// prefix = texto que se quita de la línea para dejar solo el valor.
// searches = términos literales (minúscula) para localizar la clave en texto corrido.
const KEY_FACT_PATTERNS: Array<{ label: string; regex: RegExp; prefix?: string; searches: string[] }> = [
  { label: 'Modelo mide', regex: /^la\s+modelo\s+mide\s*:?\s*(.+)$/i, searches: ['la modelo mide', 'modelo mide'] },
  { label: 'Tallas', regex: /^(?:disponible\s+)?(?:desde\s+la\s+talla|tallas?\s+disponibles?\s*:?)\s*(.+)$/i, searches: ['disponible desde la talla', 'desde la talla', 'tallas disponibles', 'talla disponible', 'talla'] },
  { label: 'Fit', regex: /^fit\s*:\s*(.+)$/i, prefix: 'fit:', searches: ['fit'] },
  { label: 'Denim', regex: /^tipo\s+de\s+denim\s*:\s*(.+)$/i, searches: ['tipo de denim'] },
  { label: 'Elasticidad', regex: /^elasticidad\s*:\s*(.+)$/i, searches: ['elasticidad'] },
  { label: 'Grosor', regex: /^grosor\s*:\s*(.+)$/i, prefix: 'grosor:', searches: ['grosor'] },
  { label: 'Cierre', regex: /^cierre\s*:\s*(.+)$/i, prefix: 'cierre:', searches: ['cierre'] },
  { label: 'Material', regex: /^(?:material|composici[oó]n)\s*:\s*(.+)$/i, searches: ['material', 'composición', 'composicion'] },
  { label: 'Hecho en', regex: /^hecho\s+en\s+(.+)$/i, searches: ['hecho en'] },
];

/** Quita emojis decorativos que anteceden o cierran una línea (🇨🇴, 📏, 📐, etc.). */
function stripEmojis(s: string): string {
  return Array.from(s)
    .map((ch) => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const cp = ch.codePointAt(0)!;
      const isEmoji =
        (cp >= 0x1f000 && cp <= 0x1faff) ||
        (cp >= 0x2600 && cp <= 0x27bf) ||
        cp === 0xfe0f ||
        (cp >= 0x1f1e6 && cp <= 0x1f1ff) ||
        cp === 0x200d;
      return isEmoji ? ' ' : ch;
    })
    .join('')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/** Detecta si una línea contiene un dato clave de decisión (modelo, tallas, fit, etc.). */
function isKeyFactLine(line: string): boolean {
  const lower = line.toLowerCase().trim();
  return KEY_FACT_PATTERNS.some((p) => p.regex.test(lower));
}

export interface KeyFact {
  label: string;
  value: string;
}

// Escapa el texto del catálogo antes de insertarlo en el HTML de la ficha.
// Las descripciones vienen de datos editables y nunca deben interpretarse como código.
function escapeHTML(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };
    return entities[character] || character;
  });
}

/** Extrae los datos clave de compra para mostrarlos arriba, sin esperar el "Ver más". */
export function extractKeyFacts(raw: string | null | undefined): KeyFact[] {
  if (!raw || raw.trim().length === 0) return [];
  const norm = stripEmojis(raw).replace(/\r?\n/g, ' ').replace(/\s+/g, ' ').trim();
  const lower = norm.toLowerCase();

  // Primera aparición de cada clave (scan en orden de prioridad por término).
  const hits: Array<{ index: number; label: string; len: number }> = [];
  for (const pattern of KEY_FACT_PATTERNS) {
    for (const search of pattern.searches) {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const re = new RegExp(`\\b${escaped}\\b`, 'i');
      const m = re.exec(lower);
      if (m) {
        hits.push({ index: m.index, label: pattern.label, len: search.length });
        break;
      }
    }
  }
  hits.sort((a, b) => a.index - b.index);

  // Valor de cada hit: desde el término hasta la siguiente clave o "Etiqueta técnica:".
  const facts: KeyFact[] = [];
  const seen = new Set<string>();
  for (let i = 0; i < hits.length; i++) {
    if (seen.has(hits[i].label)) continue;
    const end = i + 1 < hits.length ? hits[i + 1].index : norm.length;
    let value = norm.slice(hits[i].index + hits[i].len, end).replace(/^:?\s*/, '');
    // Detener el valor en la primera etiqueta "Palabra:" que no era la clave.
    const labelMatch = /^([\s\S]*?)\s+(?=[A-ZÁÉÍÓÚÑ][a-záéíóúñ]{2,}(?:\s+[A-Za-zÁÉÍÓÚÑáéíóúñ]+){0,3}:)/.exec(value);
    if (labelMatch) value = labelMatch[1];
    // Recortar si el valor incluye una frase narrativa que empieza con mayúscula
    // (p. ej. "... hasta la 14 Un diseño ideal" o "... 1.65 m Disponible").
    value = value.replace(/\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]{1,}[\s\S]*$/, '');
    value = value.trim().replace(/[.,;)\]}]+$/, '').trim();
    if (!value) continue;
    seen.add(hits[i].label);
    facts.push({ label: hits[i].label, value });
  }

  // Devolver en el orden preferido de KEY_FACT_PATTERNS.
  return KEY_FACT_PATTERNS.filter((p) => seen.has(p.label))
    .map((p) => ({ label: p.label, value: facts.find((f) => f.label === p.label)!.value }));
}

/** Detecta si una línea es una especificación técnica (clave: valor). */
function isSpecLine(line: string): boolean {
  const lower = line.toLowerCase().trim();
  return SPEC_KEYS.some((k) => lower.startsWith(k + ':'));
}

/** Detecta si la línea es un emoji suelto o decorativo (🇨🇴, 📏, etc.). */
function isEmojiLine(line: string): boolean {
  const trimmed = line.trim();
  // Si tiene 3 o menos caracteres y ningún letter ASCII, probablemente es emoji
  if (trimmed.length === 0 || trimmed.length > 4) return false;
  return !/[a-zA-Z0-9]/.test(trimmed);
}

/**
 * Parsea una descripción cruda en secciones estructuradas.
 *
 * Flujo:
 *  1. Se separa por oraciones (punto + espacio, salto de línea, o punto seguido
 *     de mayúscula sin espacio).
 *  2. Se detecta el título/introducción (primera oración si es descriptiva).
 *  3. Las líneas que matchean SPEC_KEYS van a "specs".
 *  4. Las demás oraciones van a "features" (puntos de interés).
 *  5. Si hay notas al final (guía de talla, "hecho en"), van a "note".
 */
export function parseDescription(raw: string | null | undefined): DescriptionSection[] {
  if (!raw || raw.trim().length === 0) return [];

  const sections: DescriptionSection[] = [];

  // Normalizar saltos de línea dobles y espacios múltiples
  let text = raw
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/  +/g, ' ')
    .trim();

  // Separar por oraciones: punto + espacio, o punto + mayúscula
  const sentences = text
    .split(/(?<=[.!?])\s+(?=[A-ZÁÉÍÓÚÑ])/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  const features: string[] = [];
  const specs: string[] = [];
  let intro = '';
  let note = '';

  for (const sentence of sentences) {
    const clean = stripEmojis(sentence).replace(/^\s*[•\-–—]\s*/, '').trim();
    if (!clean || isEmojiLine(clean)) continue;

    // Datos clave de decisión ya se muestran arriba como resumen; no repetirlos en el detalle.
    if (isKeyFactLine(clean)) continue;

    const lower = clean.toLowerCase();

    // Nota al final: guía de talla, "diseñado para...", "hecho en Colombia"
    if (
      lower.startsWith('guía de talla') ||
      lower.startsWith('guia de talla') ||
      lower.startsWith('la modelo') ||
      lower.startsWith('diseñado para') ||
      lower.startsWith('disenado para') ||
      lower.startsWith('hecho en') ||
      lower.startsWith('ideal para') ||
      lower.startsWith('recuerda que') ||
      lower.startsWith('recuerde que')
    ) {
      note = note ? note + ' ' + clean : clean;
      continue;
    }

    // Especificación técnica
    if (isSpecLine(clean)) {
      specs.push(clean);
      continue;
    }

    // Introducción: primera oración descriptiva (antes de features)
    if (!intro && !features.length && clean.length > 10) {
      // Si es muy larga, dividir: título + primer párrafo
      const dashSplit = clean.split(/ – | — |- /);
      if (dashSplit.length >= 2) {
        intro = dashSplit[0].trim();
        const rest = dashSplit.slice(1).join(' – ').trim();
        if (rest.length > 10) features.push(rest);
      } else {
        intro = clean;
      }
      continue;
    }

    // Feature / punto de interés
    if (clean.length > 5) {
      features.push(clean);
    }
  }

  // Construir secciones
  if (intro) {
    sections.push({ kind: 'intro', items: [intro] });
  }

  if (features.length > 0) {
    sections.push({ kind: 'features', title: 'Puntos de interés', items: features });
  }

  if (specs.length > 0) {
    sections.push({ kind: 'specs', title: 'Especificaciones técnicas', items: specs });
  }

  if (note) {
    sections.push({ kind: 'note', items: [note] });
  }

  return sections;
}

/**
 * Genera HTML para una sección de descripción.
 * Se usa para renderizar en ProductDetailClient con dangerouslySetInnerHTML.
 */
export function renderDescriptionHTML(sections: DescriptionSection[]): string {
  return sections
    .map((sec) => {
      switch (sec.kind) {
        case 'intro':
          return `<p class="mb-3 text-sm text-neutral-700 leading-relaxed">${escapeHTML(sec.items[0] || '')}</p>`;

        case 'features':
          return `
            <div class="mb-3">
              ${sec.title ? `<h4 class="text-[11px] font-black uppercase tracking-widest text-ush-navy mb-2">${escapeHTML(sec.title)}</h4>` : ''}
              <ul class="space-y-1.5">
                ${sec.items
                  .map(
                    (item) =>
                      `<li class="flex items-start gap-2 text-sm text-neutral-600">
                         <span class="mt-1.5 w-1.5 h-1.5 rounded-full bg-ush-pink flex-shrink-0"></span>
                         <span>${escapeHTML(item)}</span>
                       </li>`
                  )
                  .join('')}
              </ul>
            </div>`;

        case 'specs':
          return `
            <div class="mb-3 bg-neutral-50 border border-gray-100 p-3">
              <h4 class="text-[11px] font-black uppercase tracking-widest text-ush-navy mb-2">${escapeHTML(sec.title || 'Detalles')}</h4>
              <dl class="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
                ${sec.items
                  .map((item) => {
                    const [key, ...rest] = item.split(':');
                    const val = rest.join(':').trim();
                    return `
                      <div class="flex items-baseline gap-2 text-xs">
                        <dt class="font-bold text-neutral-500 uppercase tracking-wide shrink-0">${escapeHTML(key.trim())}:</dt>
                        <dd class="text-neutral-800 font-medium">${escapeHTML(val)}</dd>
                      </div>`;
                  })
                  .join('')}
              </dl>
            </div>`;

        case 'note':
          return `<p class="text-xs text-neutral-500 italic leading-relaxed mt-2">${escapeHTML(sec.items[0] || '')}</p>`;

        default:
          return '';
      }
    })
    .join('\n');
}
