interface AbbrevInput {
  name: string;
  fit?: string;
  category?: string;
}

export interface AbbreviatedName {
  short: string;
  color?: string;
}

/** Texto seguro para mostrar en el catálogo sin cambiar el dato original. */
export function replaceMezclilla(text: string): string {
  return text.replace(/\bmezclilla\b/gi, 'tela');
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
  const isTeens = /teens/i.test(`${cat} ${name}`);
  let type = 'Prenda';
  if (isTeens) type = 'Jean Niña';
  else if (/jean/i.test(cat)) type = 'Jean';
  else if (/camisa/i.test(cat)) type = 'Camisa';
  else if (/pantal/i.test(cat)) type = 'Pantalón';
  else if (/fald/i.test(cat)) type = 'Falda';
  else if (/short/i.test(cat)) type = 'Short';
  else if (/bermuda/i.test(cat)) type = 'Bermuda';
  else if (/cargo/i.test(cat)) type = 'Cargo';

  // Fit: prefieren una palabra corta reconocible (Slim, Skinny, Regular, Recto...)
  // que provenga del fit del producto o del propio nombre comercial.
  const FIT_KEYWORDS: Array<{ test: RegExp; label: string }> = [
    { test: /\bslim fit\b/i, label: 'Slim' },
    { test: /\bslim\b/i, label: 'Slim' },
    { test: /\bskinny\b/i, label: 'Skinny' },
    { test: /\bbootcut\b/i, label: 'Bootcut' },
    { test: /\brecto\b/i, label: 'Recto' },
    { test: /\bstraight\b/i, label: 'Straight' },
    { test: /\bregular\b/i, label: 'Regular' },
    { test: /\bajustado\b/i, label: 'Ajustado' },
    { test: /\boversize\b/i, label: 'Oversize' },
    { test: /\brelaxed\b/i, label: 'Relaxed' },
  ];

  let fit = '';
  // Prioridad: el fit del producto si es una palabra corta reconocible;
  // si no, se busca en el nombre comercial ("Jean slim fit...").
  if (input.fit && input.fit !== 'No definido') {
    for (const fk of FIT_KEYWORDS) {
      if (fk.test.test(input.fit)) {
        fit = fk.label;
        break;
      }
    }
  }
  if (!fit) {
    for (const fk of FIT_KEYWORDS) {
      if (fk.test.test(name)) {
        fit = fk.label;
        break;
      }
    }
  }

  // Género: "Hombre" o "Dama" cuando el nombre lo declara, para que el título
  // no quede flojo ("Jean Hombre", "Camisa Dama").
  let gender = '';
  if (/hombre/i.test(name)) gender = 'Hombre';
  else if (/\bdama\b/i.test(name) || /mujer/i.test(name)) gender = 'Dama';

  // Color: después de "color" o al final del nombre
  let color = extractColorFromName(name);
  if (color) {
    color = color
      .split(' ')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }

  return { short: [type, fit, gender].filter(Boolean).join(' '), color: color || undefined };
}
