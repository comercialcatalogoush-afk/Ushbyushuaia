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
    const clean = sentence.replace(/^\s*[•\-–—]\s*/, '').trim();
    if (!clean || isEmojiLine(clean)) continue;

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
          return `<p class="mb-3 text-sm text-neutral-700 leading-relaxed">${sec.items[0]}</p>`;

        case 'features':
          return `
            <div class="mb-3">
              ${sec.title ? `<h4 class="text-[11px] font-black uppercase tracking-widest text-ush-navy mb-2">${sec.title}</h4>` : ''}
              <ul class="space-y-1.5">
                ${sec.items
                  .map(
                    (item) =>
                      `<li class="flex items-start gap-2 text-sm text-neutral-600">
                        <span class="mt-1.5 w-1.5 h-1.5 rounded-full bg-ush-pink flex-shrink-0"></span>
                        <span>${item}</span>
                      </li>`
                  )
                  .join('')}
              </ul>
            </div>`;

        case 'specs':
          return `
            <div class="mb-3 bg-neutral-50 border border-gray-100 p-3">
              <h4 class="text-[11px] font-black uppercase tracking-widest text-ush-navy mb-2">${sec.title || 'Detalles'}</h4>
              <dl class="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
                ${sec.items
                  .map((item) => {
                    const [key, ...rest] = item.split(':');
                    const val = rest.join(':').trim();
                    return `
                      <div class="flex items-baseline gap-2 text-xs">
                        <dt class="font-bold text-neutral-500 uppercase tracking-wide shrink-0">${key.trim()}:</dt>
                        <dd class="text-neutral-800 font-medium">${val}</dd>
                      </div>`;
                  })
                  .join('')}
              </dl>
            </div>`;

        case 'note':
          return `<p class="text-xs text-neutral-500 italic leading-relaxed mt-2">${sec.items[0]}</p>`;

        default:
          return '';
      }
    })
    .join('\n');
}
