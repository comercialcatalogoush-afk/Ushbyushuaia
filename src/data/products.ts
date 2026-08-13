import { Product } from '@/types';
import { DRIVE_IMAGES } from './drive-map';

// Referencias destacadas como "Más Vendidas"
const BEST_SELLER_REFS = new Set<string>([
  '552851', '552850', '552810', '552739', '552699', '552697', '558079', '552691'
]);

export const OFFICIAL_90_REFS = [
  552516, 552576, 552593, 552604, 552605, 552627, 552631, 552637, 552638, 552640,
  552642, 552682, 552691, 552697, 552699, 552715, 552716, 552717, 552721, 552724,
  552725, 552738, 552739, 552744, 552746, 552749, 552750, 552758, 552761, 552770,
  552773, 552776, 552778, 552780, 552782, 552808, 552809, 552810, 552813, 552814,
  552816, 552821, 552828, 552829, 552830, 552836, 552839, 552850, 552851, 552853,
  552854, 552859, 552862, 552863, 552864, 552865, 552866, 552868, 552869, 552870,
  552871, 552872, 552873, 552874, 552875, 552878, 552879, 556172, 556240, 556242,
  556247, 556280, 556283, 556284, 556286, 556287, 556288, 556289, 556290, 556291,
  556292, 558061, 558063, 558066, 558070, 558071, 558072, 558075, 558077, 558079,
];


const WEB_DATA: Record<string, { name?: string; desc?: string; category?: string; fit?: string }> = {
  "552516": {
    "name": "Jean dama barrel straight tiro medio rígido 100% algodón",
    "desc": "Jean femenino con diseño moderno y estructurado. Silueta barrel straight que combina volumen sutil en pierna con caída recta contemporánea. Denim rígido 100% algodón, firmeza y horma definida. Detalle de dos botones en la bota que permite ajustar el bajo y crear un efecto tipo aladino. Tallas disponibles: 6 a la 14. Hecho en Colombia.",
    "category": "Jeans",
    "fit": "Barrel"
  },
  "552691": {
    "name": "Jean dama barrel tiro medio rígido, color Kaki",
    "desc": "Jean femenino de silueta barrel para un fit moderno con volumen controlado y personalidad. Tiro medio cómodo, color khaki versátil. Confeccionado en denim rígido 100% algodón, mantiene la estructura y la horma. Tallas disponibles: 6 a la 14. Hecho en Colombia.",
    "category": "Jeans",
    "fit": "Barrel"
  },
  "552738": {
    "name": "Jean dama barrel tiro medio rígido, color Azul claro",
    "desc": "Jean femenino de silueta barrel con fit moderno, volumen controlado y estilo auténtico. Tiro medio cómodo, tono azul claro fresco y versátil. Denim rígido 100% algodón, estructura y horma definida. Tallas disponibles: 6 a la 14. Hecho en Colombia.",
    "category": "Jeans",
    "fit": "Barrel"
  },
  "552816": {
    "name": "Jean dama flare tiro medio licrado, color Azul medio",
    "desc": "Jean dama silueta flare tiro medio licrado.",
    "category": "Jeans",
    "fit": "Bota Flare"
  },
  "552821": {
    "name": "Jean dama skinny tiro medio licrado, color Azul medio",
    "desc": "Jean dama silueta skinny tiro medio licrado.",
    "category": "Jeans",
    "fit": "Skinny"
  },
  "552830": {
    "name": "Jean dama wide leg tiro alto licrado, color Negro",
    "desc": "Jean colombiano para mujer diseñado para estilizar la cintura y alargar la figura. Tiro alto define el abdomen, silueta wide leg con caída elegante. Denim stretch que se adapta al cuerpo. Detalle de corte en V en la pretina trasera que realza cintura y cadera. Tallas disponibles: 6 a la 14. Hecho en Colombia.",
    "category": "Jeans",
    "fit": "Wide Leg"
  },
  "552836": {
    "name": "Jean wide leg tiro alto rígido con sesgo lateral en contraste",
    "desc": "Jean para mujer que estiliza la cintura y alarga la figura. Tiro alto, silueta wide leg con caída amplia y elegante. Denim rígido 100% algodón. Detalle de doble sesgo lateral en tono contraste que aporta diseño y efecto visual estilizador. Tallas disponibles: 6 a la 14. Hecho en Colombia.",
    "category": "Jeans",
    "fit": "Wide Leg"
  },
  "552839": {
    "name": "Jean dama flare tiro medio licrado push up, color Azul oscuro",
    "desc": "Jean femenino de silueta flare con tiro medio que estiliza la figura, ajustándose en cadera y muslo y abriendo suavemente desde la rodilla. Tecnología push up que moldea y realza de forma natural. Denim licrado con excelente adaptación y recuperación. Tallas disponibles: 6 a la 14. Hecho en Colombia.",
    "category": "Jeans",
    "fit": "Bota Flare"
  },
  "552850": {
    "name": "Jean dama straight tiro alto rígido con destellos metalizados, color Gris oscuro",
    "desc": "Jean para mujer de silueta straight con tiro alto que define la cintura y estiliza la figura. Acabado con destellos plateados que aporta un brillo sutil. Denim rígido con mezcla de fibras, ofrece estructura, durabilidad y un efecto visual diferenciador. Tallas disponibles: 6 a la 14. Hecho en Colombia.",
    "category": "Jeans",
    "fit": "Straight"
  },
  "552851": {
    "name": "Jean dama straight tiro alto rígido con destellos metalizados, color Café",
    "desc": "Jean para mujer de silueta straight con tiro alto que define la cintura y estiliza la figura. Acabado con destellos dorados que aporta un brillo sutil. Denim rígido con mezcla de fibras, ofrece estructura, durabilidad y un acabado visual diferenciador. Tallas disponibles: 6 a la 14. Hecho en Colombia.",
    "category": "Jeans",
    "fit": "Straight"
  },
  "552869": {
    "name": "Jean dama wide leg tiro alto licrado, color Azul medio",
    "desc": "Jean dama silueta wide leg tiro alto licrado.",
    "category": "Jeans",
    "fit": "Wide Leg"
  },
  "552870": {
    "name": "Jean dama wide leg tiro alto rígido, color Azul claro",
    "desc": "Jean dama silueta wide leg tiro alto rígido.",
    "category": "Jeans",
    "fit": "Wide Leg"
  },
  "552871": {
    "name": "Jean dama wide leg tiro alto rígido, color Gris oscuro",
    "desc": "Jean dama silueta wide leg tiro alto rígido.",
    "category": "Jeans",
    "fit": "Wide Leg"
  },
  "552872": {
    "name": "Jean dama wide leg tiro alto rígido, color Gris medio",
    "desc": "Jean dama silueta wide leg tiro alto rígido.",
    "category": "Jeans",
    "fit": "Wide Leg"
  },
  "552874": {
    "name": "Jean dama wide leg tiro alto rígido, color Almendra",
    "desc": "Jean dama silueta wide leg tiro alto rígido.",
    "category": "Jeans",
    "fit": "Wide Leg"
  },
  "552875": {
    "name": "Jean dama wide leg tiro alto rígido, color Azul dirty",
    "desc": "Jean dama silueta wide leg tiro alto rígido.",
    "category": "Jeans",
    "fit": "Wide Leg"
  },
  "556283": {
    "name": "Short corto dama licrado, color Gris oscuro",
    "desc": "Short corto dama licrado.",
    "category": "Shorts",
    "fit": "Bermuda"
  },
  "558070": {
    "name": "Falda dama licrada, color Azul oscuro",
    "desc": "Falda femenina versátil que combina comodidad y estilo en una silueta favorecedora. Tono azul oscuro elegante y fácil de combinar. Confeccionada en denim licrado, se adapta al cuerpo brindando mayor confort y libertad de movimiento, manteniendo una horma limpia. Tallas disponibles: 6 a la 14. Hecho en Colombia.",
    "category": "Faldas",
    "fit": "Straight"
  },
  "558072": {
    "name": "Falda dama rígida 100% algodón, color Gris",
    "desc": "Falda femenina de diseño moderno y estructurado, tono gris versátil. Confeccionada en denim rígido 100% algodón, mantiene la horma y ofrece excelente durabilidad. Destaca por su detalle de costura asimétrica en la parte delantera. Tallas disponibles: 6 a la 14. Hecho en Colombia.",
    "category": "Faldas",
    "fit": "Straight"
  },
  "558075": {
    "name": "Falda dama rígida, color Negro",
    "desc": "Falda femenina de diseño estructurado que combina elegancia y un toque moderno. Su color negro la convierte en una prenda versátil, ideal para looks sofisticados o casuales. Confeccionada en denim rígido 100% algodón, mantiene la horma y aporta mayor durabilidad. Destaca por sus pequeñas tablas en el ruedo, un detalle que añade movimiento y un acabado femenino. Tallas disponibles: 6 a la 14. Hecho en Colombia.",
    "category": "Faldas",
    "fit": "Straight"
  }
};
const PRICE_DATA: Record<string, { e: number; w: number }> = {
  "552516": {
    "e": 129900,
    "w": 0
  },
  "552576": {
    "e": 119900,
    "w": 76900
  },
  "552593": {
    "e": 119900,
    "w": 76900
  },
  "552604": {
    "e": 119900,
    "w": 76900
  },
  "552605": {
    "e": 119900,
    "w": 76900
  },
  "552627": {
    "e": 119900,
    "w": 76900
  },
  "552631": {
    "e": 119900,
    "w": 76900
  },
  "552637": {
    "e": 119900,
    "w": 76900
  },
  "552638": {
    "e": 119900,
    "w": 76900
  },
  "552640": {
    "e": 119900,
    "w": 76900
  },
  "552642": {
    "e": 119900,
    "w": 76900
  },
  "552682": {
    "e": 129900,
    "w": 74900
  },
  "552691": {
    "e": 139900,
    "w": 84900
  },
  "552697": {
    "e": 119900,
    "w": 72900
  },
  "552699": {
    "e": 119900,
    "w": 72900
  },
  "552715": {
    "e": 119900,
    "w": 76900
  },
  "552716": {
    "e": 119900,
    "w": 76900
  },
  "552717": {
    "e": 119900,
    "w": 76900
  },
  "552721": {
    "e": 119900,
    "w": 76900
  },
  "552724": {
    "e": 119900,
    "w": 76900
  },
  "552725": {
    "e": 119900,
    "w": 76900
  },
  "552738": {
    "e": 129900,
    "w": 84900
  },
  "552739": {
    "e": 139900,
    "w": 84900
  },
  "552744": {
    "e": 119900,
    "w": 74900
  },
  "552746": {
    "e": 119900,
    "w": 74900
  },
  "552749": {
    "e": 129900,
    "w": 79900
  },
  "552750": {
    "e": 0,
    "w": 0
  },
  "552758": {
    "e": 119900,
    "w": 76900
  },
  "552761": {
    "e": 129900,
    "w": 84900
  },
  "552770": {
    "e": 129900,
    "w": 79900
  },
  "552773": {
    "e": 129900,
    "w": 79900
  },
  "552776": {
    "e": 139900,
    "w": 84900
  },
  "552778": {
    "e": 119900,
    "w": 76900
  },
  "552780": {
    "e": 139900,
    "w": 84900
  },
  "552782": {
    "e": 119900,
    "w": 74900
  },
  "552808": {
    "e": 129900,
    "w": 84900
  },
  "552809": {
    "e": 129900,
    "w": 79900
  },
  "552810": {
    "e": 129900,
    "w": 84900
  },
  "552813": {
    "e": 119900,
    "w": 76900
  },
  "552814": {
    "e": 119900,
    "w": 76900
  },
  "552816": {
    "e": 119900,
    "w": 76900
  },
  "552821": {
    "e": 119900,
    "w": 76900
  },
  "552828": {
    "e": 119900,
    "w": 76900
  },
  "552829": {
    "e": 119900,
    "w": 76900
  },
  "552830": {
    "e": 129900,
    "w": 79900
  },
  "552836": {
    "e": 129900,
    "w": 0
  },
  "552839": {
    "e": 119900,
    "w": 76900
  },
  "552850": {
    "e": 149900,
    "w": 89900
  },
  "552851": {
    "e": 149900,
    "w": 94900
  },
  "552853": {
    "e": 129900,
    "w": 84900
  },
  "552854": {
    "e": 129900,
    "w": 84900
  },
  "552859": {
    "e": 129900,
    "w": 84900
  },
  "552862": {
    "e": 119900,
    "w": 74900
  },
  "552863": {
    "e": 129900,
    "w": 84900
  },
  "552864": {
    "e": 139900,
    "w": 84900
  },
  "552865": {
    "e": 129900,
    "w": 79900
  },
  "552866": {
    "e": 129900,
    "w": 79900
  },
  "552868": {
    "e": 119900,
    "w": 74900
  },
  "552869": {
    "e": 119900,
    "w": 74900
  },
  "552870": {
    "e": 119900,
    "w": 74900
  },
  "552871": {
    "e": 119900,
    "w": 74900
  },
  "552872": {
    "e": 119900,
    "w": 74900
  },
  "552873": {
    "e": 119900,
    "w": 74900
  },
  "552874": {
    "e": 119900,
    "w": 74900
  },
  "552875": {
    "e": 119900,
    "w": 74900
  },
  "552878": {
    "e": 159900,
    "w": 99900
  },
  "552879": {
    "e": 129900,
    "w": 84900
  },
  "556172": {
    "e": 79900,
    "w": 54900
  },
  "556240": {
    "e": 79900,
    "w": 54900
  },
  "556242": {
    "e": 79900,
    "w": 54900
  },
  "556247": {
    "e": 79900,
    "w": 54900
  },
  "556280": {
    "e": 79900,
    "w": 54900
  },
  "556283": {
    "e": 79900,
    "w": 54900
  },
  "556284": {
    "e": 79900,
    "w": 54900
  },
  "556286": {
    "e": 79900,
    "w": 54900
  },
  "556287": {
    "e": 79900,
    "w": 54900
  },
  "556288": {
    "e": 79900,
    "w": 54900
  },
  "556289": {
    "e": 79900,
    "w": 54900
  },
  "556290": {
    "e": 79900,
    "w": 54900
  },
  "556291": {
    "e": 79900,
    "w": 54900
  },
  "556292": {
    "e": 79900,
    "w": 54900
  },
  "558061": {
    "e": 79900,
    "w": 54900
  },
  "558063": {
    "e": 74900,
    "w": 54900
  },
  "558066": {
    "e": 74900,
    "w": 54900
  },
  "558070": {
    "e": 79900,
    "w": 54900
  },
  "558071": {
    "e": 79900,
    "w": 54900
  },
  "558072": {
    "e": 79900,
    "w": 54900
  },
  "558075": {
    "e": 79900,
    "w": 54900
  },
  "558077": {
    "e": 79900,
    "w": 54900
  },
  "558079": {
    "e": 79900,
    "w": 54900
  }
};

export const INITIAL_PRODUCTS: Product[] = OFFICIAL_90_REFS.map((refNum, index) => {
  const refStr = refNum.toString();
  const web = WEB_DATA[refStr];
  const p = PRICE_DATA[refStr] || { e: 119900, w: 76900 };
  const driveImages = DRIVE_IMAGES[refStr] || [];
  const isShortOrSkirt = refStr.startsWith('556') || refStr.startsWith('558');
  const category = web?.category || (isShortOrSkirt ? (refNum % 2 === 0 ? 'Shorts' : 'Faldas') : (refNum % 3 === 0 ? 'Cargo' : 'Jeans'));
  const fit = web?.fit || 'Wide Leg';
  const hasPrice = p.e > 0;
  const suggested = p.e || 119900;
  const wholesale = p.w || Math.round(suggested * 0.65);
  return {
    id: `ref-${refNum}`,
    name: web?.name || `REF: ${refNum}`,
    reference: refStr,
    slug: `ref-${refNum}`,
    suggested_price: suggested,
    price: wholesale,
    compare_price: suggested,
    ribbon: BEST_SELLER_REFS.has(refStr) ? 'Más vendido' : (index % 5 === 0 ? 'Nuevo' : ''),
    category,
    fit,
    description: web?.desc || `Prenda USH BY USHUAIA (${category} - ${fit}).`,
    full_description: web?.desc || `Referencia oficial ${refNum} del catálogo USH BY USHUAIA en mezclilla rígida.`,
    in_stock: true,
    hidden: driveImages.length === 0,
    status: 'published',
    is_best_seller: BEST_SELLER_REFS.has(refStr),
    options: [{ id: 'talla-opt', key: 'Talla', values: ['6', '8', '10', '12', '14'] }],
    images: driveImages
  };
});
