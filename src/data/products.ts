import { Product } from '@/types';

const HIDDEN = true; // Admin must toggle to false to show publicly

export const INITIAL_PRODUCTS: Product[] = [
  // ─── VISIBLE REFERENCES ───────────────────────────────────────────
  {
    id: '6fd569eb-835a-4f76-8ee9-fd8e825f4816',
    name: 'Ref: 556218',
    reference: '556218',
    slug: 'ref-556218-short-largo',
    suggested_price: 79900, price: 54900, compare_price: 79900,
    ribbon: 'Nuevo',
    description: 'Short largo de alta calidad en denim flexible de alta resistencia.',
    full_description: 'Short bermuda largo confeccionado en mezclilla flexible premium con dobladillo reforzado. Disponible en tallas 6 a 14.',
    in_stock: true, hidden: false,
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
    ribbon: '',
    description: 'Falda Dama Rígida Color Crudo. Versátil y en tendencia.',
    full_description: 'Falda en denim rígido tono crudo marfil con pretina alta estilizadora y botones metálicos antioxidantes.',
    in_stock: true, hidden: false,
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
    ribbon: 'Más vendido',
    description: 'Jean Dama Wide Leg Tiro Alto Rígido Azul Oscuro.',
    full_description: 'Jean Wide Leg rígido tiro alto en índigo azul oscuro con bolsillos cargo y costuras en contraste.',
    in_stock: true, hidden: false,
    options: [
      { id: 'color-opt', key: 'Color', values: ['Azul Oscuro'] },
      { id: 'talla-opt', key: 'Talla', values: ['6', '8', '10', '12', '14'] }
    ],
    images: ['https://static.wixstatic.com/media/e21be4_cedba513ba6f46c7888940de510e1a38~mv2.jpg',
             'https://static.wixstatic.com/media/e21be4_bb1d8310e10343a5810c818521d1a193~mv2.jpg']
  },

  // ─── HIDDEN REFERENCES (Admin pendiente de agregar fotos) ─────────
  {
    id: 'ref-558079', name: 'REF: 558079', reference: '558079', slug: 'ref-558079',
    suggested_price: 79900, price: 54900, compare_price: 79900,
    ribbon: 'Próximamente', description: 'Prenda USH BY USHUAIA. Foto próximamente.',
    full_description: 'Referencia oficial del catálogo USH BY USHUAIA. En preparación.',
    in_stock: true, hidden: HIDDEN,
    options: [{ id: 'talla-opt', key: 'Talla', values: ['6', '8', '10', '12', '14'] }],
    images: []
  },
  {
    id: 'ref-558075', name: 'REF: 558075', reference: '558075', slug: 'ref-558075',
    suggested_price: 79900, price: 54900, compare_price: 79900,
    ribbon: 'Próximamente', description: 'Prenda USH BY USHUAIA. Foto próximamente.',
    full_description: 'Referencia oficial del catálogo USH BY USHUAIA. En preparación.',
    in_stock: true, hidden: HIDDEN,
    options: [{ id: 'talla-opt', key: 'Talla', values: ['6', '8', '10', '12', '14'] }],
    images: []
  },
  {
    id: 'ref-558070', name: 'REF: 558070', reference: '558070', slug: 'ref-558070',
    suggested_price: 79900, price: 54900, compare_price: 79900,
    ribbon: 'Próximamente', description: 'Prenda USH BY USHUAIA. Foto próximamente.',
    full_description: 'Referencia oficial del catálogo USH BY USHUAIA. En preparación.',
    in_stock: true, hidden: HIDDEN,
    options: [{ id: 'talla-opt', key: 'Talla', values: ['6', '8', '10', '12', '14'] }],
    images: []
  },
  {
    id: 'ref-558072', name: 'REF: 558072', reference: '558072', slug: 'ref-558072',
    suggested_price: 79900, price: 54900, compare_price: 79900,
    ribbon: 'Próximamente', description: 'Prenda USH BY USHUAIA. Foto próximamente.',
    full_description: 'Referencia oficial del catálogo USH BY USHUAIA. En preparación.',
    in_stock: true, hidden: HIDDEN,
    options: [{ id: 'talla-opt', key: 'Talla', values: ['6', '8', '10', '12', '14'] }],
    images: []
  },
  {
    id: 'ref-552297', name: 'REF: 552297', reference: '552297', slug: 'ref-552297',
    suggested_price: 119900, price: 72900, compare_price: 119900,
    ribbon: 'Próximamente', description: 'Prenda USH BY USHUAIA. Foto próximamente.',
    full_description: 'Referencia oficial del catálogo USH BY USHUAIA. En preparación.',
    in_stock: true, hidden: HIDDEN,
    options: [{ id: 'talla-opt', key: 'Talla', values: ['6', '8', '10', '12', '14'] }],
    images: []
  },
  {
    id: 'ref-552808', name: 'REF: 552808', reference: '552808', slug: 'ref-552808',
    suggested_price: 129900, price: 84900, compare_price: 129900,
    ribbon: 'Próximamente', description: 'Prenda USH BY USHUAIA. Foto próximamente.',
    full_description: 'Referencia oficial del catálogo USH BY USHUAIA. En preparación.',
    in_stock: true, hidden: HIDDEN,
    options: [{ id: 'talla-opt', key: 'Talla', values: ['6', '8', '10', '12', '14'] }],
    images: []
  },
  {
    id: 'ref-552739', name: 'REF: 552739', reference: '552739', slug: 'ref-552739',
    suggested_price: 139900, price: 84500, compare_price: 139900,
    ribbon: 'Próximamente', description: 'Prenda USH BY USHUAIA. Foto próximamente.',
    full_description: 'Referencia oficial del catálogo USH BY USHUAIA. En preparación.',
    in_stock: true, hidden: HIDDEN,
    options: [{ id: 'talla-opt', key: 'Talla', values: ['6', '8', '10', '12', '14'] }],
    images: []
  },
  {
    id: 'ref-552810', name: 'REF: 552810', reference: '552810', slug: 'ref-552810',
    suggested_price: 129900, price: 84900, compare_price: 129900,
    ribbon: 'Próximamente', description: 'Prenda USH BY USHUAIA. Foto próximamente.',
    full_description: 'Referencia oficial del catálogo USH BY USHUAIA. En preparación.',
    in_stock: true, hidden: HIDDEN,
    options: [{ id: 'talla-opt', key: 'Talla', values: ['6', '8', '10', '12', '14'] }],
    images: []
  },
  {
    id: 'ref-552682', name: 'REF: 552682', reference: '552682', slug: 'ref-552682',
    suggested_price: 119900, price: 74900, compare_price: 119900,
    ribbon: 'Próximamente', description: 'Prenda USH BY USHUAIA. Foto próximamente.',
    full_description: 'Referencia oficial del catálogo USH BY USHUAIA. En preparación.',
    in_stock: true, hidden: HIDDEN,
    options: [{ id: 'talla-opt', key: 'Talla', values: ['6', '8', '10', '12', '14'] }],
    images: []
  },
  {
    id: 'ref-552699', name: 'REF: 552699', reference: '552699', slug: 'ref-552699',
    suggested_price: 119900, price: 72900, compare_price: 119900,
    ribbon: 'Próximamente', description: 'Prenda USH BY USHUAIA. Foto próximamente.',
    full_description: 'Referencia oficial del catálogo USH BY USHUAIA. En preparación.',
    in_stock: true, hidden: HIDDEN,
    options: [{ id: 'talla-opt', key: 'Talla', values: ['6', '8', '10', '12', '14'] }],
    images: []
  },
  {
    id: 'ref-552691', name: 'REF: 552691', reference: '552691', slug: 'ref-552691',
    suggested_price: 139900, price: 89500, compare_price: 139900,
    ribbon: 'Próximamente', description: 'Prenda USH BY USHUAIA. Foto próximamente.',
    full_description: 'Referencia oficial del catálogo USH BY USHUAIA. En preparación.',
    in_stock: true, hidden: HIDDEN,
    options: [{ id: 'talla-opt', key: 'Talla', values: ['6', '8', '10', '12', '14'] }],
    images: []
  },
  {
    id: 'ref-552838', name: 'REF: 552838', reference: '552838', slug: 'ref-552838',
    suggested_price: 119900, price: 76000, compare_price: 119900,
    ribbon: 'Próximamente', description: 'Prenda USH BY USHUAIA. Foto próximamente.',
    full_description: 'Referencia oficial del catálogo USH BY USHUAIA. En preparación.',
    in_stock: true, hidden: HIDDEN,
    options: [{ id: 'talla-opt', key: 'Talla', values: ['6', '8', '10', '12', '14'] }],
    images: []
  },
  {
    id: 'ref-552862', name: 'REF: 552862', reference: '552862', slug: 'ref-552862',
    suggested_price: 129900, price: 74900, compare_price: 129900,
    ribbon: 'Próximamente', description: 'Prenda USH BY USHUAIA. Foto próximamente.',
    full_description: 'Referencia oficial del catálogo USH BY USHUAIA. En preparación.',
    in_stock: true, hidden: HIDDEN,
    options: [{ id: 'talla-opt', key: 'Talla', values: ['6', '8', '10', '12', '14'] }],
    images: []
  },
  {
    id: 'ref-552715', name: 'REF: 552715', reference: '552715', slug: 'ref-552715',
    suggested_price: 119900, price: 76900, compare_price: 119900,
    ribbon: 'Próximamente', description: 'Prenda USH BY USHUAIA. Foto próximamente.',
    full_description: 'Referencia oficial del catálogo USH BY USHUAIA. En preparación.',
    in_stock: true, hidden: HIDDEN,
    options: [{ id: 'talla-opt', key: 'Talla', values: ['6', '8', '10', '12', '14'] }],
    images: []
  },
  {
    id: 'ref-552042', name: 'REF: 552042', reference: '552042', slug: 'ref-552042',
    suggested_price: 119900, price: 76900, compare_price: 119900,
    ribbon: 'Próximamente', description: 'Prenda USH BY USHUAIA. Foto próximamente.',
    full_description: 'Referencia oficial del catálogo USH BY USHUAIA. En preparación.',
    in_stock: true, hidden: HIDDEN,
    options: [{ id: 'talla-opt', key: 'Talla', values: ['6', '8', '10', '12', '14'] }],
    images: []
  },
  {
    id: 'ref-552724', name: 'REF: 552724', reference: '552724', slug: 'ref-552724',
    suggested_price: 119900, price: 76500, compare_price: 119900,
    ribbon: 'Próximamente', description: 'Prenda USH BY USHUAIA. Foto próximamente.',
    full_description: 'Referencia oficial del catálogo USH BY USHUAIA. En preparación.',
    in_stock: true, hidden: HIDDEN,
    options: [{ id: 'talla-opt', key: 'Talla', values: ['6', '8', '10', '12', '14'] }],
    images: []
  },
  {
    id: 'ref-552814', name: 'REF: 552814', reference: '552814', slug: 'ref-552814',
    suggested_price: 119900, price: 76900, compare_price: 119900,
    ribbon: 'Próximamente', description: 'Prenda USH BY USHUAIA. Foto próximamente.',
    full_description: 'Referencia oficial del catálogo USH BY USHUAIA. En preparación.',
    in_stock: true, hidden: HIDDEN,
    options: [{ id: 'talla-opt', key: 'Talla', values: ['6', '8', '10', '12', '14'] }],
    images: []
  },
  {
    id: 'ref-552625', name: 'REF: 552625', reference: '552625', slug: 'ref-552625',
    suggested_price: 119900, price: 76000, compare_price: 119900,
    ribbon: 'Próximamente', description: 'Prenda USH BY USHUAIA. Foto próximamente.',
    full_description: 'Referencia oficial del catálogo USH BY USHUAIA. En preparación.',
    in_stock: true, hidden: HIDDEN,
    options: [{ id: 'talla-opt', key: 'Talla', values: ['6', '8', '10', '12', '14'] }],
    images: []
  },
  {
    id: 'ref-556287', name: 'REF: 556287', reference: '556287', slug: 'ref-556287',
    suggested_price: 79900, price: 54900, compare_price: 79900,
    ribbon: 'Próximamente', description: 'Prenda USH BY USHUAIA. Foto próximamente.',
    full_description: 'Referencia oficial del catálogo USH BY USHUAIA. En preparación.',
    in_stock: true, hidden: HIDDEN,
    options: [{ id: 'talla-opt', key: 'Talla', values: ['6', '8', '10', '12', '14'] }],
    images: []
  },
  {
    id: 'ref-556290', name: 'REF: 556290', reference: '556290', slug: 'ref-556290',
    suggested_price: 79900, price: 54900, compare_price: 79900,
    ribbon: 'Próximamente', description: 'Prenda USH BY USHUAIA. Foto próximamente.',
    full_description: 'Referencia oficial del catálogo USH BY USHUAIA. En preparación.',
    in_stock: true, hidden: HIDDEN,
    options: [{ id: 'talla-opt', key: 'Talla', values: ['6', '8', '10', '12', '14'] }],
    images: []
  },
  {
    id: 'ref-556292', name: 'REF: 556292', reference: '556292', slug: 'ref-556292',
    suggested_price: 79900, price: 54900, compare_price: 79900,
    ribbon: 'Próximamente', description: 'Prenda USH BY USHUAIA. Foto próximamente.',
    full_description: 'Referencia oficial del catálogo USH BY USHUAIA. En preparación.',
    in_stock: true, hidden: HIDDEN,
    options: [{ id: 'talla-opt', key: 'Talla', values: ['6', '8', '10', '12', '14'] }],
    images: []
  },
  {
    id: 'ref-558061', name: 'REF: 558061', reference: '558061', slug: 'ref-558061',
    suggested_price: 79900, price: 54900, compare_price: 79900,
    ribbon: 'Próximamente', description: 'Prenda USH BY USHUAIA. Foto próximamente.',
    full_description: 'Referencia oficial del catálogo USH BY USHUAIA. En preparación.',
    in_stock: true, hidden: HIDDEN,
    options: [{ id: 'talla-opt', key: 'Talla', values: ['6', '8', '10', '12', '14'] }],
    images: []
  },
];
