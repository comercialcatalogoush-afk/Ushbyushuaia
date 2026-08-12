import { Product } from '@/types';

export const OFFICIAL_90_REFS = [
  558077, 558079, 558075, 558070, 558072, 558071, 558066, 558063,
  552682, 552699, 552697, 552810, 552800, 552739, 552516, 552691,
  552850, 552809, 552738, 552830, 552829, 552836, 552758, 552776,
  552773, 552749, 552782, 552780, 552750, 552770, 552746, 552761,
  552744, 552871, 552874, 552872, 552870, 552869, 552875, 552873,
  552868, 552865, 552862, 552854, 552864, 552859, 552863, 552866,
  552828, 552853, 552879, 552878, 552851, 552576, 552627, 552637,
  552721, 552715, 552717, 552642, 552716, 552725, 552631, 552640,
  552724, 552638, 552593, 552821, 552813, 552814, 552778, 552816,
  552839, 552605, 552604, 556291, 556287, 556280, 556172, 556286,
  556283, 556290, 556289, 556288, 556292, 556284, 556240, 556242,
  556247, 558061
];

// Helper generator to build all 90 official product items
const generateAll90Products = (): Product[] => {
  // Known products with high-res photos
  const knownProductsMap: Record<string, Partial<Product>> = {
    '556218': {
      id: '6fd569eb-835a-4f76-8ee9-fd8e825f4816',
      name: 'REF: 556218',
      reference: '556218',
      slug: 'ref-556218-short-largo',
      suggested_price: 79900, price: 54900, compare_price: 79900,
      ribbon: 'Nuevo', category: 'Shorts', fit: 'Bermuda',
      description: 'Short largo de alta calidad en denim flexible de alta resistencia.',
      full_description: 'Short bermuda largo confeccionado en mezclilla flexible premium con dobladillo reforzado. Disponible en tallas 6 a 14.',
      images: [
        'https://static.wixstatic.com/media/e21be4_d636501aedfd4962b899ed38ffb772c6~mv2.jpg',
        'https://static.wixstatic.com/media/e21be4_1ad3c401e63941e285a0788b61b0d925~mv2.jpg'
      ]
    },
    '558077': {
      id: 'e5a13c1a-77d2-4183-9650-bbec742398d2',
      name: 'REF: 558077',
      reference: '558077',
      slug: 'ref-558077-falda-dama-rigida-color-crudo',
      suggested_price: 79900, price: 54900, compare_price: 79900,
      ribbon: 'Oferta', category: 'Faldas', fit: 'Wide Leg',
      description: 'Falda Dama Rígida Color Crudo. Versátil y en tendencia.',
      full_description: 'Falda en denim rígido tono crudo marfil con pretina alta estilizadora y botones metálicos antioxidantes.',
      images: [
        'https://static.wixstatic.com/media/e21be4_5de40254bc0245f7b63506182d4c27a8~mv2.jpg',
        'https://static.wixstatic.com/media/e21be4_0916a0cddcb8476587eb621f27ec5215~mv2.jpg'
      ]
    },
    '552851': {
      id: 'a74f3b2b-ffb7-4f08-8545-d7f43e23a98c',
      name: 'REF: 552851',
      reference: '552851',
      slug: 'ref-552851-jean-wide-leg',
      suggested_price: 149900, price: 94900, compare_price: 149900,
      ribbon: 'Más vendido', category: 'Jeans', fit: 'Wide Leg',
      description: 'Jean Dama Wide Leg Tiro Alto Rígido Azul Oscuro.',
      full_description: 'Jean Wide Leg rígido tiro alto en índigo azul oscuro con bolsillos cargo y costuras en contraste.',
      images: [
        'https://static.wixstatic.com/media/e21be4_cedba513ba6f46c7888940de510e1a38~mv2.jpg',
        'https://static.wixstatic.com/media/e21be4_bb1d8310e10343a5810c818521d1a193~mv2.jpg'
      ]
    },
    '558079': {
      id: 'ref-558079-photo',
      name: 'REF: 558079',
      reference: '558079',
      slug: 'ref-558079',
      suggested_price: 139900, price: 89900, compare_price: 139900,
      ribbon: 'Próximamente', category: 'Jeans', fit: 'Wide Leg',
      description: 'Jean Dama tiro alto bota ancha en tono índigo intenso.',
      images: [
        'https://static.wixstatic.com/media/e21be4_868b3b4f981e4fa8b2aa6d582f3a61d1~mv2.jpg'
      ]
    }
  };

  const fitsList = ['Wide Leg', 'Barrel', 'Straight Boot', 'Vaquero', 'Bota Flare', 'Skinny', 'Mom', 'Cargo', 'Bermuda', 'Straight'];
  
  const products: Product[] = OFFICIAL_90_REFS.map((refNum, index) => {
    const refStr = refNum.toString();
    const known = knownProductsMap[refStr];

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
        options: [{ id: 'talla-opt', key: 'Talla', values: ['6', '8', '10', '12', '14'] }],
        images: known.images || []
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
      description: `Prenda USH BY USHUAIA (${category} - ${fit}). Foto próximamente.`,
      full_description: `Referencia oficial ${refNum} del catálogo USH BY USHUAIA en mezclilla rígida.`,
      in_stock: true,
      hidden: false,
      status: 'published',
      options: [{ id: 'talla-opt', key: 'Talla', values: ['6', '8', '10', '12', '14'] }],
      images: []
    };
  });

  return products;
};

export const INITIAL_PRODUCTS: Product[] = generateAll90Products();
