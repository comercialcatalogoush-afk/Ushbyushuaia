interface AbbrevInput {
  name: string;
  fit?: string;
  category?: string;
}

export interface AbbreviatedName {
  short: string;
  color?: string;
}

const COLOR_KEYWORDS = [
  'azul claro', 'azul oscuro', 'azul medio', 'azul dirty', 'azul claro',
  'azul oscuro', 'azul medio', 'azul dirty', 'gris oscuro', 'gris humo',
  'gris', 'negro', 'blanco', 'ivory', 'crudo', 'kaki', 'mocca', 'baby blue',
  'babyblue', 'oliva', 'café', 'cafe', 'mostaza', 'vino', 'burdeos',
];

export function extractColorFromName(name: string): string {
  let color = '';
  const colorMatch = name.match(/color[:\s]+([^,;]+)/i);
  if (colorMatch) {
    color = colorMatch[1].replace(/\s*\d+%\s*$/i, '').replace(/\s+$/g, '').trim();
  }
  if (!color) {
    const lower = name.toLowerCase();
    for (const kw of COLOR_KEYWORDS) {
      if (lower.includes(kw)) {
        color = kw;
        break;
      }
    }
  }
  if (color) {
    color = color
      .split(' ')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }
  return color;
}

export function abbreviateProductName(input: AbbrevInput): AbbreviatedName {
  const name = input.name || '';

  // Tipo de prenda según categoría
  const cat = input.category || '';
  let type = 'Prenda';
  if (/jean/i.test(cat)) type = 'Jean';
  else if (/pantal/i.test(cat)) type = 'Pantalón';
  else if (/fald/i.test(cat)) type = 'Falda';
  else if (/short/i.test(cat)) type = 'Short';
  else if (/bermuda/i.test(cat)) type = 'Bermuda';
  else if (/cargo/i.test(cat)) type = 'Cargo';

  // Fit disponible en el producto
  const fit = input.fit && input.fit !== 'No definido' ? input.fit : '';

  // Color: después de "color" o al final del nombre
  let color = extractColorFromName(name);
  if (color) {
    color = color
      .split(' ')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }

  return { short: [type, fit].filter(Boolean).join(' '), color: color || undefined };
}
