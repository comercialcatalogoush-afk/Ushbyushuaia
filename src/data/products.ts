import { Product } from '@/types';
import { DRIVE_IMAGES } from './drive-map';

// Referencias destacadas como "Más Vendidas" (se muestran con animación en el hero)
const BEST_SELLER_REFS = new Set<string>([
  '552851', '552850', '552810', '552739',
  '552699', '552697', '558079', '552691'
]);

export const OFFICIAL_90_REFS = [
  558079, 558075, 558070, 558072, 558071, 558066, 558063,
  552699, 552697, 552810, 552739, 552516, 552691,
  552850, 552809, 552738, 552830, 552829, 552758, 552776,
  552773, 552749, 552782, 552780, 552750, 552770, 552746, 552761,
  552744, 552871, 552874, 552872, 552870, 552869, 552875, 552873,
  552868, 552865, 552862, 552854, 552864, 552859, 552863, 552866,
  552828, 552853, 552879, 552878, 552851,
  552637, 552721, 552715, 552717, 552716, 552640, 552638,
  552821, 552814, 552816, 552839, 552605,
  556172, 556283, 556290, 556284, 556247, 558061
];

// Helper generator to build all catalog products with their Google Drive photos
const generateAll90Products = (): Product[] => {
  // Known products with real catalog data (name, prices, categories, descriptions)
  const knownProductsMap: Record<string, Partial<Product>> = {
    '552851': {
      id: 'a74f3b2b-ffb7-4f08-8545-d7f43e23a98c',
      name: 'REF: 552851',
      reference: '552851',
      slug: 'ref-552851-jean-wide-leg',
      suggested_price: 149900, price: 94900, compare_price: 149900,
      ribbon: 'Más vendido', category: 'Jeans', fit: 'Wide Leg',
      description: 'Jean Dama Wide Leg Tiro Alto Rígido Azul Oscuro.',
      full_description: 'Jean Wide Leg rígido tiro alto en índigo azul oscuro con bolsillos cargo y costuras en contraste.'
    },
    '558079': {
      id: 'ref-558079-photo',
      name: 'REF: 558079',
      reference: '558079',
      slug: 'ref-558079',
      suggested_price: 139900, price: 89900, compare_price: 139900,
      ribbon: 'Próximamente', category: 'Jeans', fit: 'Wide Leg',
      description: 'Jean Dama tiro alto bota ancha en tono índigo intenso.',
      full_description: 'Jean Wide Leg rígido tiro alto en mezclilla índigo con costuras de contraste.'
    }
  };

  const fitsList = ['Wide Leg', 'Barrel', 'Straight Boot', 'Vaquero', 'Bota Flare', 'Skinny', 'Mom', 'Cargo', 'Bermuda', 'Straight'];

  const products: Product[] = OFFICIAL_90_REFS.map((refNum, index) => {
    const refStr = refNum.toString();
    const known = knownProductsMap[refStr];
    const driveImages = DRIVE_IMAGES[refStr] || [];

    const isShortOrSkirt = refStr.startsWith('556') || refStr.startsWith('558');
    const category = isShortOrSkirt ? (refNum % 2 === 0 ? 'Shorts' : 'Faldas') : (refNum % 3 === 0 ? 'Cargo' : 'Jeans');
    const fit = fitsList[index % fitsList.length];
    const sugPrice = isShortOrSkirt ? 79900 : (refNum % 2 === 0 ? 129900 : 119900);
    const wholesalePrice = isShortOrSkirt ? 54900 : (refNum % 2 === 0 ? 84900 : 76900);

    if (known) {
      return {
        id: known.id || `ref-${refNum}`,
        name: known.name || `REF: ${refNum}`,
        reference: refStr,
        slug: known.slug || `ref-${refNum}`,
        suggested_price: known.suggested_price || sugPrice,
        price: known.price || wholesalePrice,
        compare_price: known.compare_price || sugPrice,
        ribbon: known.ribbon || 'Nuevo',
        category: known.category || category,
        fit: known.fit || fit,
        description: known.description || `Prenda USH BY USHUAIA (${category} - ${fit}).`,
        full_description: known.full_description || `Referencia oficial ${refNum} del catálogo USH BY USHUAIA en mezclilla rígida.`,
        in_stock: true,
        hidden: false,
        status: 'published',
        is_best_seller: BEST_SELLER_REFS.has(refStr),
        options: [{ id: 'talla-opt', key: 'Talla', values: ['6', '8', '10', '12', '14'] }],
        images: driveImages
      };
    }

    return {
      id: `ref-${refNum}`,
      name: `REF: ${refNum}`,
      reference: refStr,
      slug: `ref-${refNum}`,
      suggested_price: sugPrice,
      price: wholesalePrice,
      compare_price: sugPrice,
      ribbon: index % 5 === 0 ? 'Nuevo' : (index % 7 === 0 ? 'Más vendido' : ''),
      category: category,
      fit: fit,
      description: `Prenda USH BY USHUAIA (${category} - ${fit}).`,
      full_description: `Referencia oficial ${refNum} del catálogo USH BY USHUAIA en mezclilla rígida.`,
      in_stock: true,
      hidden: false,
      status: 'published',
      is_best_seller: BEST_SELLER_REFS.has(refStr),
      options: [{ id: 'talla-opt', key: 'Talla', values: ['6', '8', '10', '12', '14'] }],
      images: driveImages
    };
  });

  return products;
};

export const INITIAL_PRODUCTS: Product[] = generateAll90Products();