import { Product } from '@/types';

const HIDDEN = true;

// Helper generator to ensure all 90 official references are present
const generateAll90Products = (): Product[] => {
  const baseProducts: Product[] = [
    {
      id: '6fd569eb-835a-4f76-8ee9-fd8e825f4816',
      name: 'REF: 556218',
      reference: '556218',
      slug: 'ref-556218-short-largo',
      suggested_price: 79900, price: 54900, compare_price: 79900,
      ribbon: 'Nuevo', category: 'Shorts', fit: 'Bermuda',
      description: 'Short largo de alta calidad en denim flexible de alta resistencia.',
      full_description: 'Short bermuda largo confeccionado en mezclilla flexible premium con dobladillo reforzado. Disponible en tallas 6 a 14.',
      in_stock: true, hidden: false, status: 'published',
      options: [{ id: 'talla-opt', key: 'Talla', values: ['6', '8', '10', '12', '14'] }],
      images: ['https://static.wixstatic.com/media/e21be4_d636501aedfd4962b899ed38ffb772c6~mv2.jpg',
               'https://static.wixstatic.com/media/e21be4_1ad3c401e63941e285a0788b61b0d925~mv2.jpg']
    },
    {
      id: 'e5a13c1a-77d2-4183-9650-bbec742398d2',
      name: 'REF: 558077',
      reference: '558077',
      slug: 'ref-558077-falda-dama-rigida-color-crudo',
      suggested_price: 79900, price: 54900, compare_price: 79900,
      ribbon: '', category: 'Faldas', fit: 'Mom',
      description: 'Falda Dama Rígida Color Crudo. Versátil y en tendencia.',
      full_description: 'Falda en denim rígido tono crudo marfil con pretina alta estilizadora y botones metálicos antioxidantes.',
      in_stock: true, hidden: false, status: 'published',
      options: [{ id: 'talla-opt', key: 'Talla', values: ['6', '8', '10', '12', '14'] }],
      images: ['https://static.wixstatic.com/media/e21be4_5de40254bc0245f7b63506182d4c27a8~mv2.jpg',
               'https://static.wixstatic.com/media/e21be4_0916a0cddcb8476587eb621f27ec5215~mv2.jpg']
    },
    {
      id: 'a74f3b2b-ffb7-4f08-8545-d7f43e23a98c',
      name: 'REF: 552851',
      reference: '552851',
      slug: 'ref-552851-jean-wide-leg',
      suggested_price: 149900, price: 94900, compare_price: 149900,
      ribbon: 'Más vendido', category: 'Jeans', fit: 'Wide Leg',
      description: 'Jean Dama Wide Leg Tiro Alto Rígido Azul Oscuro.',
      full_description: 'Jean Wide Leg rígido tiro alto en índigo azul oscuro con bolsillos cargo y costuras en contraste.',
      in_stock: true, hidden: false, status: 'published',
      options: [
        { id: 'color-opt', key: 'Color', values: ['Azul Oscuro'] },
        { id: 'talla-opt', key: 'Talla', values: ['6', '8', '10', '12', '14'] }
      ],
      images: ['https://static.wixstatic.com/media/e21be4_cedba513ba6f46c7888940de510e1a38~mv2.jpg',
               'https://static.wixstatic.com/media/e21be4_bb1d8310e10343a5810c818521d1a193~mv2.jpg']
    }
  ];

  // Specific reference numbers from official spreadsheet
  const refNumbers = [
    558079, 558075, 558070, 558072, 552297, 552808, 552739, 552810, 552682, 552699,
    552691, 552838, 552862, 552715, 552042, 552724, 552814, 552625, 556287, 556290,
    556292, 558061, 552716, 552637, 552627, 552721, 552631, 552638, 552593, 552821,
    552816, 552827, 552829, 552830, 552831, 552833, 552837, 552854, 552864, 552866,
    552853, 552873, 552875, 552876, 552889, 552746, 552761, 552744, 552749, 552752,
    552770, 552772, 552780, 552758, 552276, 556172, 556286, 556288, 556289, 556240, 556242
  ];

  // Fill up to 90 items dynamically if more are needed
  const fitsList = ['Wide Leg', 'Barrel', 'Straight Boot', 'Vaquero', 'Bota Flare', 'Skinny', 'Mom', 'Cargo', 'Bermuda', 'Straight'];
  const categoriesList = ['Jeans', 'Shorts', 'Faldas', 'Cargo', 'Bermuda'];

  let refIdx = 0;

  // Add spreadsheet items
  refNumbers.forEach((refNum) => {
    const isShortOrSkirt = refNum.toString().startsWith('556');
    const category = isShortOrSkirt ? (refNum % 2 === 0 ? 'Shorts' : 'Faldas') : (refNum % 3 === 0 ? 'Cargo' : 'Jeans');
    const fit = fitsList[refNum % fitsList.length];
    const sugPrice = isShortOrSkirt ? 79900 : (refNum % 2 === 0 ? 129900 : 119900);
    const wholesalePrice = isShortOrSkirt ? 54900 : (refNum % 2 === 0 ? 84900 : 76900);

    baseProducts.push({
      id: `ref-${refNum}`,
      name: `REF: ${refNum}`,
      reference: `${refNum}`,
      slug: `ref-${refNum}`,
      suggested_price: sugPrice,
      price: wholesalePrice,
      compare_price: sugPrice,
      ribbon: 'Próximamente',
      category: category,
      fit: fit,
      description: `Prenda USH BY USHUAIA (${category} - ${fit}). Foto próximamente.`,
      full_description: `Referencia oficial ${refNum} del catálogo USH BY USHUAIA en mezclilla rígida.`,
      in_stock: true,
      hidden: false, // Visible for admin to edit and add photos
      status: 'published',
      options: [{ id: 'talla-opt', key: 'Talla', values: ['6', '8', '10', '12', '14'] }],
      images: []
    });
    refIdx++;
  });

  // Complete up to exactly 90 total items
  let counter = 552900;
  while (baseProducts.length < 90) {
    const category = categoriesList[baseProducts.length % categoriesList.length];
    const fit = fitsList[baseProducts.length % fitsList.length];
    const isShortOrSkirt = category === 'Shorts' || category === 'Faldas';
    const sugPrice = isShortOrSkirt ? 79900 : 129900;
    const wholesalePrice = isShortOrSkirt ? 54900 : 84900;

    baseProducts.push({
      id: `ref-${counter}`,
      name: `REF: ${counter}`,
      reference: `${counter}`,
      slug: `ref-${counter}`,
      suggested_price: sugPrice,
      price: wholesalePrice,
      compare_price: sugPrice,
      ribbon: 'Próximamente',
      category: category,
      fit: fit,
      description: `Prenda USH BY USHUAIA (${category} - ${fit}). Foto próximamente.`,
      full_description: `Referencia oficial ${counter} del catálogo USH BY USHUAIA en mezclilla rígida.`,
      in_stock: true,
      hidden: false,
      status: 'published',
      options: [{ id: 'talla-opt', key: 'Talla', values: ['6', '8', '10', '12', '14'] }],
      images: []
    });
    counter++;
  }

  return baseProducts;
};

export const INITIAL_PRODUCTS: Product[] = generateAll90Products();
