import { Product } from '@/types';

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: '6fd569eb-835a-4f76-8ee9-fd8e825f4816',
    name: 'Ref: 556218',
    reference: '556218',
    slug: 'ref-556218-short-largo',
    suggested_price: 79900,
    price: 54900,
    compare_price: 79900,
    ribbon: 'Nuevo',
    description: 'Short largo de alta calidad confeccionado con denim flexible de alta resistencia. Diseñado para ofrecer máximo confort, estilización y durabilidad.',
    full_description: 'Short bermuda largo confeccionado en mezclilla flexible premium con dobladillo reforzado. Excelente rotación en catálogo mayorista para clima cálido y templado. Disponible en tallas 6 a 14.',
    in_stock: true,
    options: [
      {
        id: '1fb7b7af-e9d7-4e1f-a2e2-8ba56001405c',
        key: 'Talla',
        values: ['6', '8', '10', '12', '14']
      }
    ],
    images: [
      'https://static.wixstatic.com/media/e21be4_d636501aedfd4962b899ed38ffb772c6~mv2.jpg',
      'https://static.wixstatic.com/media/e21be4_1ad3c401e63941e285a0788b61b0d925~mv2.jpg'
    ]
  },
  {
    id: 'e5a13c1a-77d2-4183-9650-bbec742398d2',
    name: 'REF: 558077',
    reference: '558077',
    slug: 'ref-558077-falda-dama-rigida-color-crudo',
    suggested_price: 79900,
    price: 54900,
    compare_price: 79900,
    ribbon: '',
    description: 'Falda Dama Rígida Color Crudo. Prenda versátil y en tendencia con acabado premium para distribución mayorista.',
    full_description: 'Falda en denim rígido tono crudo marfil con pretina alta estilizadora y botones metálicos antioxidantes. Diseño moderno y sofisticado de alta rotación para boutiques.',
    in_stock: true,
    options: [
      {
        id: '1fb7b7af-e9d7-4e1f-a2e2-8ba56001405c',
        key: 'Talla',
        values: ['6', '8', '10', '12', '14']
      }
    ],
    images: [
      'https://static.wixstatic.com/media/e21be4_5de40254bc0245f7b63506182d4c27a8~mv2.jpg',
      'https://static.wixstatic.com/media/e21be4_0916a0cddcb8476587eb621f27ec5215~mv2.jpg'
    ]
  },
  {
    id: 'a74f3b2b-ffb7-4f08-8545-d7f43e23a98c',
    name: 'REF: 552851',
    reference: '552851',
    slug: 'ref-552851-jean-dama-wide-leg-tiro-alto-rigido-color-azul-oscuro',
    suggested_price: 149900,
    price: 94900,
    compare_price: 149900,
    ribbon: 'Más vendido',
    description: 'Jean Dama Wide Leg Tiro Alto Rígido Color Azul Oscuro. Silueta moderna de tiro alto con horma estilizadora.',
    full_description: 'Jean Wide Leg rígido tiro alto en índigo azul oscuro con bolsillos estilo cargo y costuras en contraste. La referencia más vendida de la marca por su excelente ajuste y tendencia.',
    in_stock: true,
    options: [
      {
        id: 'ea9db20d-2e1a-4fe7-825f-b45a82a9d1e7',
        key: 'Color',
        values: ['Azul Oscuro']
      },
      {
        id: '1fb7b7af-e9d7-4e1f-a2e2-8ba56001405c',
        key: 'Talla',
        values: ['6', '8', '10', '12', '14']
      }
    ],
    images: [
      'https://static.wixstatic.com/media/e21be4_cedba513ba6f46c7888940de510e1a38~mv2.jpg',
      'https://static.wixstatic.com/media/e21be4_bb1d8310e10343a5810c818521d1a193~mv2.jpg'
    ]
  },
  // Additional official spreadsheet references (Ready for Admin image uploads)
  {
    id: 'ref-558079',
    name: 'REF: 558079',
    reference: '558079',
    slug: 'ref-558079',
    suggested_price: 79900,
    price: 54900,
    compare_price: 79900,
    ribbon: 'En Construcción',
    description: 'Prenda en confección nacional. Foto y detalles próximamente.',
    full_description: 'Referencia oficial del catálogo USH BY USHUAIA.',
    in_stock: true,
    options: [{ id: 'talla-opt', key: 'Talla', values: ['6', '8', '10', '12', '14'] }],
    images: []
  },
  {
    id: 'ref-558075',
    name: 'REF: 558075',
    reference: '558075',
    slug: 'ref-558075',
    suggested_price: 79900,
    price: 54900,
    compare_price: 79900,
    ribbon: 'En Construcción',
    description: 'Prenda en confección nacional. Foto y detalles próximamente.',
    full_description: 'Referencia oficial del catálogo USH BY USHUAIA.',
    in_stock: true,
    options: [{ id: 'talla-opt', key: 'Talla', values: ['6', '8', '10', '12', '14'] }],
    images: []
  },
  {
    id: 'ref-558070',
    name: 'REF: 558070',
    reference: '558070',
    slug: 'ref-558070',
    suggested_price: 79900,
    price: 54900,
    compare_price: 79900,
    ribbon: 'En Construcción',
    description: 'Prenda en confección nacional. Foto y detalles próximamente.',
    full_description: 'Referencia oficial del catálogo USH BY USHUAIA.',
    in_stock: true,
    options: [{ id: 'talla-opt', key: 'Talla', values: ['6', '8', '10', '12', '14'] }],
    images: []
  },
  {
    id: 'ref-558072',
    name: 'REF: 558072',
    reference: '558072',
    slug: 'ref-558072',
    suggested_price: 79900,
    price: 54900,
    compare_price: 79900,
    ribbon: 'En Construcción',
    description: 'Prenda en confección nacional. Foto y detalles próximamente.',
    full_description: 'Referencia oficial del catálogo USH BY USHUAIA.',
    in_stock: true,
    options: [{ id: 'talla-opt', key: 'Talla', values: ['6', '8', '10', '12', '14'] }],
    images: []
  },
  {
    id: 'ref-552682',
    name: 'REF: 552682',
    reference: '552682',
    slug: 'ref-552682',
    suggested_price: 129900,
    price: 74900,
    compare_price: 129900,
    ribbon: 'En Construcción',
    description: 'Prenda en mezclilla rígida. Foto y detalles próximamente.',
    full_description: 'Referencia oficial del catálogo USH BY USHUAIA.',
    in_stock: true,
    options: [{ id: 'talla-opt', key: 'Talla', values: ['6', '8', '10', '12', '14'] }],
    images: []
  },
  {
    id: 'ref-552699',
    name: 'REF: 552699',
    reference: '552699',
    slug: 'ref-552699',
    suggested_price: 119900,
    price: 72900,
    compare_price: 119900,
    ribbon: 'En Construcción',
    description: 'Prenda en mezclilla rígida. Foto y detalles próximamente.',
    full_description: 'Referencia oficial del catálogo USH BY USHUAIA.',
    in_stock: true,
    options: [{ id: 'talla-opt', key: 'Talla', values: ['6', '8', '10', '12', '14'] }],
    images: []
  },
  {
    id: 'ref-552810',
    name: 'REF: 552810',
    reference: '552810',
    slug: 'ref-552810',
    suggested_price: 129900,
    price: 84900,
    compare_price: 129900,
    ribbon: 'En Construcción',
    description: 'Prenda en mezclilla rígida. Foto y detalles próximamente.',
    full_description: 'Referencia oficial del catálogo USH BY USHUAIA.',
    in_stock: true,
    options: [{ id: 'talla-opt', key: 'Talla', values: ['6', '8', '10', '12', '14'] }],
    images: []
  }
];
