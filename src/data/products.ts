import { Product } from '@/types';
import { DRIVE_IMAGES } from './drive-map';
import { extractColorFromName } from '@/lib/productName';

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

// Datos oficiales del sitio ushuaiajeans.com.co (nombre, categoria, fit) por referencia
const STORE_DATA: Record<string, { name?: string; category?: string; fit?: string; section?: string }> = {
 "552516": {
  "name": "Jean dama barrel straight tiro medio rígido 100% algodón, color gris oscuro",
  "category": "Jeans",
  "fit": "Barrel",
  "section": "Mujer"
 },
 "552576": {},
 "552593": {},
 "552604": {},
 "552605": {
  "name": "Jean skinny tiro medio en denim stretch, color gris oscuro 100%",
  "category": "Pantalones",
  "fit": "Skinny",
  "section": "Mujer"
 },
 "552627": {},
 "552631": {},
 "552637": {
  "name": "Jean straight boot licrado tiro medio en denim azul claro",
  "category": "Jeans",
  "fit": "Straight Boot",
  "section": "Mujer"
 },
 "552638": {
  "name": "Jean straight boot licrado tiro medio en denim negro",
  "category": "Pantalones",
  "fit": "Straight Boot",
  "section": "Mujer"
 },
 "552640": {
  "name": "Jean straight boot licrado tiro medio en denim azul oscuro",
  "category": "Jeans",
  "fit": "Straight Boot",
  "section": "Mujer"
 },
 "552642": {},
 "552682": {},
 "552691": {
  "name": "Jean dama barrel tiro medio rígido, color Kaki",
  "category": "Jeans",
  "fit": "Barrel",
  "section": "Mujer"
 },
 "552697": {
  "name": "Jean straight rígido tiro medio 100% algodón, color baby blue",
  "category": "Jeans",
  "fit": "Straight Boot",
  "section": "Mujer"
 },
 "552699": {
  "name": "Jean straight rígido tiro medio 100% algodón, color negro",
  "category": "Pantalones",
  "fit": "Straight Boot",
  "section": "Mujer"
 },
 "552715": {
  "name": "Jean flare boot licrado tiro medio en denim color azul medio",
  "category": "Jeans",
  "fit": "Bota Flare",
  "section": "Mujer"
 },
 "552716": {
  "name": "Jean dama flare tiro medio licrado, color azul claro",
  "category": "Jeans",
  "fit": "Bota Flare",
  "section": "Mujer"
 },
 "552717": {},
 "552721": {
  "name": "Jean straight boot licrado tiro medio en denim color gris humo",
  "category": "Pantalones",
  "fit": "Straight Boot",
  "section": "Mujer"
 },
 "552724": {},
 "552725": {},
 "552738": {
  "name": "Jean dama barrel tiro medio rígido, color azúl claro",
  "category": "Jeans",
  "fit": "Barrel",
  "section": "Mujer"
 },
 "552739": {
  "name": "Jean dama barrel tiro medio rígido 100% algodón, color azul dirty",
  "category": "Jeans",
  "fit": "Barrel",
  "section": "Mujer"
 },
 "552744": {
  "name": "Jean vaquero flare tiro medio en denim licrado, color azul oscuro",
  "category": "Jeans",
  "fit": "Vaquero",
  "section": "Mujer"
 },
 "552746": {
  "name": "Jean vaquero flare tiro medio en denim licrado, color azul claro",
  "category": "Jeans",
  "fit": "Vaquero",
  "section": "Mujer"
 },
 "552749": {
  "name": "Jean straight boot rígido tiro medio en denim, color azul medio",
  "category": "Jeans",
  "fit": "Straight Boot",
  "section": "Mujer"
 },
 "552750": {},
 "552758": {
  "name": "JEAN WIDE LEG TIRO MEDIO Ref: 552758",
  "category": "Jeans",
  "fit": "Wide Leg",
  "section": "Mujer"
 },
 "552761": {
  "name": "Jean straight tiro medio en denim rígido 100% algodón, color ivory",
  "category": "Pantalones",
  "fit": "Straight Boot",
  "section": "Mujer"
 },
 "552770": {
  "name": "Jean vaquero flare tiro medio en denim licrado, color Mocca dirty",
  "category": "Pantalones",
  "fit": "Vaquero",
  "section": "Mujer"
 },
 "552773": {
  "name": "Jean vaquero flare tiro medio en denim licrado, color kaki dirty",
  "category": "Pantalones",
  "fit": "Vaquero",
  "section": "Mujer"
 },
 "552776": {
  "name": "Jean wide leg tiro medio en denim rígido, color golden Black",
  "category": "Pantalones",
  "fit": "Wide Leg",
  "section": "Mujer"
 },
 "552778": {},
 "552780": {
  "name": "Jean straight tiro alto en denim rígido 100% algodón, color azúl medio",
  "category": "Jeans",
  "fit": "Straight Boot",
  "section": "Mujer"
 },
 "552782": {
  "name": "Jean vaquero flare tiro medio en denim licrado, color ivory",
  "category": "Pantalones",
  "fit": "Vaquero",
  "section": "Mujer"
 },
 "552808": {
  "name": "Jean dama vaquero tiro medio licrado, color Gris oscuro",
  "category": "Pantalones",
  "fit": "Vaquero",
  "section": "Mujer"
 },
 "552809": {
  "name": "Jean dama wide leg tiro alto licrado, color Azul oscuro",
  "category": "Pantalones",
  "fit": "Wide Leg",
  "section": "Mujer"
 },
 "552810": {
  "name": "Jean dama wide leg tiro medio licrado, color Negro",
  "category": "Jeans",
  "fit": "Wide Leg",
  "section": "Mujer"
 },
 "552813": {},
 "552814": {
  "name": "Jean dama straight tiro medio licrado, color Ivory",
  "category": "Pantalones",
  "fit": "Straight Boot",
  "section": "Mujer"
 },
 "552816": {
  "name": "Jean dama flare tiro medio licrado, color Azul medio",
  "category": "Jeans",
  "fit": "Bota Flare",
  "section": "Mujer"
 },
 "552821": {
  "name": "Jean dama skinny tiro medio licrado, color Azul medio",
  "category": "Jeans",
  "fit": "Skinny",
  "section": "Mujer"
 },
 "552828": {
  "name": "Jean dama vaquero licrado color azul oscuro",
  "category": "Jeans",
  "fit": "Vaquero",
  "section": "Mujer"
 },
 "552829": {
  "name": "Jean straight tiro alto rígido, color Azul claro",
  "category": "Jeans",
  "fit": "Straight Boot",
  "section": "Mujer"
 },
 "552830": {
  "name": "Jean dama wide leg tiro alto licrado, color Negro",
  "category": "Pantalones",
  "fit": "Wide Leg",
  "section": "Mujer"
 },
 "552836": {
  "name": "Jean wide leg tiro alto rígido con sesgo lateral en contraste, color Azul medio",
  "category": "Pantalones",
  "fit": "Wide Leg",
  "section": "Mujer"
 },
 "552839": {
  "name": "Jean dama flare tiro medio licrado, color Azul oscuro",
  "category": "Jeans",
  "fit": "Bota Flare",
  "section": "Mujer"
 },
 "552850": {
  "name": "Jean dama straight tiro alto rígido con destellos metalizados, color Gris oscuro",
  "category": "Pantalones",
  "fit": "Straight Boot",
  "section": "Mujer"
 },
 "552851": {
  "name": "Jean dama wide leg tiro alto rígido, color azul oscuro",
  "category": "Jeans",
  "fit": "Wide Leg",
  "section": "Mujer"
 },
 "552853": {
  "name": "Jean wide leg tiro alto rígido con bota doblada fija, color azul medio",
  "category": "Pantalones",
  "fit": "Wide Leg",
  "section": "Mujer"
 },
 "552854": {
  "name": "Jean wide leg tiro alto licrado con bolsillos de tapa color azul claro",
  "category": "Pantalones",
  "fit": "Wide Leg",
  "section": "Mujer"
 },
 "552859": {
  "name": "Jean dama wide leg tiro alto rígido con bota en contraste color Gris",
  "category": "Pantalones",
  "fit": "Wide Leg",
  "section": "Mujer"
 },
 "552862": {
  "name": "Jean dama straight tiro alto rígido con detalle de amarre, color Azul dirty",
  "category": "Jeans",
  "fit": "Straight Boot",
  "section": "Mujer"
 },
 "552863": {
  "name": "Jean dama barrel straight rígido con bolsillos de tapa, color gris",
  "category": "Jeans",
  "fit": "Barrel",
  "section": "Mujer"
 },
 "552864": {
  "name": "Jean dama barrel straight rígido con pretina asimétrica, color Azul claro",
  "category": "Jeans",
  "fit": "Barrel",
  "section": "Mujer"
 },
 "552865": {
  "name": "Jean dama mom fit tiro alto rígido con estampado frutal, color Crudo",
  "category": "Jeans",
  "fit": "Mom",
  "section": "Mujer"
 },
 "552866": {
  "name": "Jean dama mom fit tiro alto rígido con estampado floral, color Crudo",
  "category": "Jeans",
  "fit": "Mom",
  "section": "Mujer"
 },
 "552868": {
  "name": "Jean dama wide leg tiro alto licrado, color Azul oscuro",
  "category": "Pantalones",
  "fit": "Wide Leg",
  "section": "Mujer"
 },
 "552869": {
  "name": "Jean dama wide leg tiro alto licrado, color Azul medio",
  "category": "Pantalones",
  "fit": "Wide Leg",
  "section": "Mujer"
 },
 "552870": {
  "name": "Jean dama wide leg tiro alto rígido, color Azul claro",
  "category": "Pantalones",
  "fit": "Wide Leg",
  "section": "Mujer"
 },
 "552871": {
  "name": "Jean dama wide leg tiro alto rígido, color Gris oscuro",
  "category": "Pantalones",
  "fit": "Wide Leg",
  "section": "Mujer"
 },
 "552872": {
  "name": "Jean dama wide leg tiro alto rígido, color Gris medio",
  "category": "Pantalones",
  "fit": "Wide Leg",
  "section": "Mujer"
 },
 "552873": {
  "name": "Jean dama wide leg tiro alto licrado, color Ivory",
  "category": "Pantalones",
  "fit": "Wide Leg",
  "section": "Mujer"
 },
 "552874": {
  "name": "Jean dama wide leg tiro alto rígido. color Almendra",
  "category": "Pantalones",
  "fit": "Wide Leg",
  "section": "Mujer"
 },
 "552875": {
  "name": "Jean dama wide leg tiro alto rígido, color Azul dirty",
  "category": "Pantalones",
  "fit": "Wide Leg",
  "section": "Mujer"
 },
 "552878": {
  "name": "Jean dama barrel straight rígido con bordado paisley, color Café",
  "category": "Jeans",
  "fit": "Barrel",
  "section": "Mujer"
 },
 "552879": {
  "name": "Jean dama barrel straight rígido con botón en la bota, color Ivory",
  "category": "Jeans",
  "fit": "Barrel",
  "section": "Mujer"
 },
 "556172": {
  "name": "Short corto dama rígido, color Azul oscuro",
  "category": "Shorts",
  "fit": "",
  "section": "Mujer"
 },
 "556240": {},
 "556242": {},
 "556247": {
  "name": "Short largo rígido en denim azul medio",
  "category": "Shorts",
  "fit": "",
  "section": "Mujer"
 },
 "556280": {},
 "556283": {
  "name": "Short corto dama licrado, color Gris oscuro",
  "category": "Shorts",
  "fit": "",
  "section": "Mujer"
 },
 "556284": {
  "name": "Short corto dama rígido con encaje y desgastes, color Azul claro",
  "category": "Shorts",
  "fit": "",
  "section": "Mujer"
 },
 "556286": {},
 "556287": {},
 "556288": {},
 "556289": {},
 "556290": {},
 "556291": {},
 "556292": {},
 "558061": {
  "name": "Falda corta rígida de tiro medio en denim, color ivory",
  "category": "Faldas",
  "fit": "",
  "section": "Mujer"
 },
 "558063": {
  "name": "Falda corta dama rígida 100% algodón, color blanco",
  "category": "Faldas",
  "fit": "",
  "section": "Mujer"
 },
 "558066": {
  "name": "Falda corta en denim rígido, color azul oscuro 100% algodón",
  "category": "Faldas",
  "fit": "",
  "section": "Mujer"
 },
 "558070": {
  "name": "Falda dama licrada, color Azul oscuro",
  "category": "Faldas",
  "fit": "",
  "section": "Mujer"
 },
 "558071": {
  "name": "Falda dama rígida 100% algodón, color Azul medio",
  "category": "Faldas",
  "fit": "",
  "section": "Mujer"
 },
 "558072": {
  "name": "Falda dama rígida 100% algodón, color Gris",
  "category": "Faldas",
  "fit": "",
  "section": "Mujer"
 },
 "558075": {
  "name": "Falda dama rígida, color Negro",
  "category": "Faldas",
  "fit": "",
  "section": "Mujer"
 },
 "558077": {
  "name": "Falda dama rígida, color crudo",
  "category": "Faldas",
  "fit": "",
  "section": "Mujer"
 },
 "558079": {
  "name": "Falda dama licrada, color Azul claro",
  "category": "Faldas",
  "fit": "",
  "section": "Mujer"
 }
};

// Precios oficiales (ecommerce y mayorista 12+ uds) segun tabla del proveedor
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
  const store = STORE_DATA[refStr];
  const p = PRICE_DATA[refStr] || { e: 119900, w: 76900 };
  const driveImages = DRIVE_IMAGES[refStr] || [];
  const category = store?.category || (refStr.startsWith('556') || refStr.startsWith('558') ? 'Shorts' : 'Jeans');
  const fit = normalizeFit(store?.fit);
  const suggested = p.e > 0 ? p.e : 119900;
  const wholesale = p.w > 0 ? p.w : Math.round(suggested * 0.65);
  const name = store?.name ? `${store.name.replace(/^REF:?\s*/i, '')}` : `REF: ${refNum}`;
  return {
    id: `ref-${refNum}`,
    name,
    reference: refStr,
    slug: `ref-${refNum}`,
    suggested_price: suggested,
    price: wholesale,
    compare_price: suggested,
    ribbon: BEST_SELLER_REFS.has(refStr) ? 'Más vendido' : (index % 5 === 0 ? 'Nuevo' : ''),
    category,
    fit,
    color: extractColorFromName(name) || undefined,
    description: store?.name ? store.name.replace(/^REF:?\s*/i, '') : `Prenda USH BY USHUAIA (${category}).`,
    full_description: store?.name ? store.name.replace(/^REF:?\s*/i, '') : `Referencia oficial ${refNum} del catálogo USH BY USHUAIA.`,
    in_stock: true,
    hidden: driveImages.length === 0,
    status: 'published',
    is_best_seller: BEST_SELLER_REFS.has(refStr),
    options: [{ id: 'talla-opt', key: 'Talla', values: ['6', '8', '10', '12', '14'] }],
    images: driveImages
  };
});

function normalizeFit(fit?: string): string {
  const map: Record<string, string> = { 'Wide Leg': 'Wide Leg', 'Barrel': 'Barrel', 'Straight Boot': 'Straight Boot', 'Vaquero': 'Vaquero', 'Bota Flare': 'Bota Flare', 'Skinny': 'Skinny', 'Straight': 'Straight' };
  return fit && map[fit] ? map[fit] : (fit || '');
}
