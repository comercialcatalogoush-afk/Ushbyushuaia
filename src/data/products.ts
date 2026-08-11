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

  // ─── REMAINING REFERENCES FROM OFFICIAL SPREADSHEET ──────────────

  // Serie 552xxx - Jeans ($119,900 – $139,900 PVP)
  { id: 'ref-552716', name: 'REF: 552716', reference: '552716', slug: 'ref-552716', suggested_price: 119900, price: 76900, compare_price: 119900, ribbon: 'Próximamente', description: 'Jean dama rígido. Foto próximamente.', full_description: 'Referencia oficial del catálogo USH BY USHUAIA.', in_stock: true, hidden: HIDDEN, options: [{ id: 'talla-opt', key: 'Talla', values: ['6', '8', '10', '12', '14'] }], images: [] },
  { id: 'ref-552637', name: 'REF: 552637', reference: '552637', slug: 'ref-552637', suggested_price: 119900, price: 76000, compare_price: 119900, ribbon: 'Próximamente', description: 'Jean dama rígido. Foto próximamente.', full_description: 'Referencia oficial del catálogo USH BY USHUAIA.', in_stock: true, hidden: HIDDEN, options: [{ id: 'talla-opt', key: 'Talla', values: ['6', '8', '10', '12', '14'] }], images: [] },
  { id: 'ref-552627', name: 'REF: 552627', reference: '552627', slug: 'ref-552627', suggested_price: 119900, price: 76000, compare_price: 119900, ribbon: 'Próximamente', description: 'Jean dama rígido. Foto próximamente.', full_description: 'Referencia oficial del catálogo USH BY USHUAIA.', in_stock: true, hidden: HIDDEN, options: [{ id: 'talla-opt', key: 'Talla', values: ['6', '8', '10', '12', '14'] }], images: [] },
  { id: 'ref-552721', name: 'REF: 552721', reference: '552721', slug: 'ref-552721', suggested_price: 119900, price: 76900, compare_price: 119900, ribbon: 'Próximamente', description: 'Jean dama rígido. Foto próximamente.', full_description: 'Referencia oficial del catálogo USH BY USHUAIA.', in_stock: true, hidden: HIDDEN, options: [{ id: 'talla-opt', key: 'Talla', values: ['6', '8', '10', '12', '14'] }], images: [] },
  { id: 'ref-552631', name: 'REF: 552631', reference: '552631', slug: 'ref-552631', suggested_price: 119900, price: 76000, compare_price: 119900, ribbon: 'Próximamente', description: 'Jean dama rígido. Foto próximamente.', full_description: 'Referencia oficial del catálogo USH BY USHUAIA.', in_stock: true, hidden: HIDDEN, options: [{ id: 'talla-opt', key: 'Talla', values: ['6', '8', '10', '12', '14'] }], images: [] },
  { id: 'ref-552638', name: 'REF: 552638', reference: '552638', slug: 'ref-552638', suggested_price: 119900, price: 76000, compare_price: 119900, ribbon: 'Próximamente', description: 'Jean dama rígido. Foto próximamente.', full_description: 'Referencia oficial del catálogo USH BY USHUAIA.', in_stock: true, hidden: HIDDEN, options: [{ id: 'talla-opt', key: 'Talla', values: ['6', '8', '10', '12', '14'] }], images: [] },
  { id: 'ref-552593', name: 'REF: 552593', reference: '552593', slug: 'ref-552593', suggested_price: 119900, price: 76000, compare_price: 119900, ribbon: 'Próximamente', description: 'Jean dama rígido. Foto próximamente.', full_description: 'Referencia oficial del catálogo USH BY USHUAIA.', in_stock: true, hidden: HIDDEN, options: [{ id: 'talla-opt', key: 'Talla', values: ['6', '8', '10', '12', '14'] }], images: [] },
  { id: 'ref-552821', name: 'REF: 552821', reference: '552821', slug: 'ref-552821', suggested_price: 119900, price: 76000, compare_price: 119900, ribbon: 'Próximamente', description: 'Jean dama rígido. Foto próximamente.', full_description: 'Referencia oficial del catálogo USH BY USHUAIA.', in_stock: true, hidden: HIDDEN, options: [{ id: 'talla-opt', key: 'Talla', values: ['6', '8', '10', '12', '14'] }], images: [] },
  { id: 'ref-552816', name: 'REF: 552816', reference: '552816', slug: 'ref-552816', suggested_price: 119900, price: 76000, compare_price: 119900, ribbon: 'Próximamente', description: 'Jean dama rígido. Foto próximamente.', full_description: 'Referencia oficial del catálogo USH BY USHUAIA.', in_stock: true, hidden: HIDDEN, options: [{ id: 'talla-opt', key: 'Talla', values: ['6', '8', '10', '12', '14'] }], images: [] },

  // Serie 552xxx - Jeans Premium ($129,900 – $139,900 PVP)
  { id: 'ref-552827', name: 'REF: 552827', reference: '552827', slug: 'ref-552827', suggested_price: 129900, price: 84900, compare_price: 129900, ribbon: 'Próximamente', description: 'Jean premium rígido tiro alto. Foto próximamente.', full_description: 'Referencia oficial del catálogo USH BY USHUAIA.', in_stock: true, hidden: HIDDEN, options: [{ id: 'talla-opt', key: 'Talla', values: ['6', '8', '10', '12', '14'] }], images: [] },
  { id: 'ref-552829', name: 'REF: 552829', reference: '552829', slug: 'ref-552829', suggested_price: 119900, price: 76000, compare_price: 119900, ribbon: 'Próximamente', description: 'Jean dama rígido. Foto próximamente.', full_description: 'Referencia oficial del catálogo USH BY USHUAIA.', in_stock: true, hidden: HIDDEN, options: [{ id: 'talla-opt', key: 'Talla', values: ['6', '8', '10', '12', '14'] }], images: [] },
  { id: 'ref-552830', name: 'REF: 552830', reference: '552830', slug: 'ref-552830', suggested_price: 129900, price: 79000, compare_price: 129900, ribbon: 'Próximamente', description: 'Jean premium rígido. Foto próximamente.', full_description: 'Referencia oficial del catálogo USH BY USHUAIA.', in_stock: true, hidden: HIDDEN, options: [{ id: 'talla-opt', key: 'Talla', values: ['6', '8', '10', '12', '14'] }], images: [] },
  { id: 'ref-552831', name: 'REF: 552831', reference: '552831', slug: 'ref-552831', suggested_price: 129900, price: 84900, compare_price: 129900, ribbon: 'Próximamente', description: 'Jean premium rígido. Foto próximamente.', full_description: 'Referencia oficial del catálogo USH BY USHUAIA.', in_stock: true, hidden: HIDDEN, options: [{ id: 'talla-opt', key: 'Talla', values: ['6', '8', '10', '12', '14'] }], images: [] },
  { id: 'ref-552833', name: 'REF: 552833', reference: '552833', slug: 'ref-552833', suggested_price: 129900, price: 84900, compare_price: 129900, ribbon: 'Próximamente', description: 'Jean premium rígido. Foto próximamente.', full_description: 'Referencia oficial del catálogo USH BY USHUAIA.', in_stock: true, hidden: HIDDEN, options: [{ id: 'talla-opt', key: 'Talla', values: ['6', '8', '10', '12', '14'] }], images: [] },
  { id: 'ref-552837', name: 'REF: 552837', reference: '552837', slug: 'ref-552837', suggested_price: 129900, price: 84900, compare_price: 129900, ribbon: 'Próximamente', description: 'Jean premium rígido. Foto próximamente.', full_description: 'Referencia oficial del catálogo USH BY USHUAIA.', in_stock: true, hidden: HIDDEN, options: [{ id: 'talla-opt', key: 'Talla', values: ['6', '8', '10', '12', '14'] }], images: [] },
  { id: 'ref-552854', name: 'REF: 552854', reference: '552854', slug: 'ref-552854', suggested_price: 129900, price: 84900, compare_price: 129900, ribbon: 'Próximamente', description: 'Jean premium rígido. Foto próximamente.', full_description: 'Referencia oficial del catálogo USH BY USHUAIA.', in_stock: true, hidden: HIDDEN, options: [{ id: 'talla-opt', key: 'Talla', values: ['6', '8', '10', '12', '14'] }], images: [] },
  { id: 'ref-552864', name: 'REF: 552864', reference: '552864', slug: 'ref-552864', suggested_price: 129900, price: 74900, compare_price: 129900, ribbon: 'Próximamente', description: 'Jean premium rígido. Foto próximamente.', full_description: 'Referencia oficial del catálogo USH BY USHUAIA.', in_stock: true, hidden: HIDDEN, options: [{ id: 'talla-opt', key: 'Talla', values: ['6', '8', '10', '12', '14'] }], images: [] },
  { id: 'ref-552866', name: 'REF: 552866', reference: '552866', slug: 'ref-552866', suggested_price: 129900, price: 84900, compare_price: 129900, ribbon: 'Próximamente', description: 'Jean premium rígido. Foto próximamente.', full_description: 'Referencia oficial del catálogo USH BY USHUAIA.', in_stock: true, hidden: HIDDEN, options: [{ id: 'talla-opt', key: 'Talla', values: ['6', '8', '10', '12', '14'] }], images: [] },
  { id: 'ref-552853', name: 'REF: 552853', reference: '552853', slug: 'ref-552853', suggested_price: 129900, price: 84900, compare_price: 129900, ribbon: 'Próximamente', description: 'Jean premium rígido. Foto próximamente.', full_description: 'Referencia oficial del catálogo USH BY USHUAIA.', in_stock: true, hidden: HIDDEN, options: [{ id: 'talla-opt', key: 'Talla', values: ['6', '8', '10', '12', '14'] }], images: [] },
  { id: 'ref-552873', name: 'REF: 552873', reference: '552873', slug: 'ref-552873', suggested_price: 129900, price: 84900, compare_price: 129900, ribbon: 'Próximamente', description: 'Jean premium rígido. Foto próximamente.', full_description: 'Referencia oficial del catálogo USH BY USHUAIA.', in_stock: true, hidden: HIDDEN, options: [{ id: 'talla-opt', key: 'Talla', values: ['6', '8', '10', '12', '14'] }], images: [] },
  { id: 'ref-552875', name: 'REF: 552875', reference: '552875', slug: 'ref-552875', suggested_price: 129900, price: 84900, compare_price: 129900, ribbon: 'Próximamente', description: 'Jean premium rígido. Foto próximamente.', full_description: 'Referencia oficial del catálogo USH BY USHUAIA.', in_stock: true, hidden: HIDDEN, options: [{ id: 'talla-opt', key: 'Talla', values: ['6', '8', '10', '12', '14'] }], images: [] },
  { id: 'ref-552876', name: 'REF: 552876', reference: '552876', slug: 'ref-552876', suggested_price: 129900, price: 84900, compare_price: 129900, ribbon: 'Próximamente', description: 'Jean premium rígido. Foto próximamente.', full_description: 'Referencia oficial del catálogo USH BY USHUAIA.', in_stock: true, hidden: HIDDEN, options: [{ id: 'talla-opt', key: 'Talla', values: ['6', '8', '10', '12', '14'] }], images: [] },
  { id: 'ref-552889', name: 'REF: 552889', reference: '552889', slug: 'ref-552889', suggested_price: 129900, price: 74900, compare_price: 129900, ribbon: 'Próximamente', description: 'Jean premium rígido. Foto próximamente.', full_description: 'Referencia oficial del catálogo USH BY USHUAIA.', in_stock: true, hidden: HIDDEN, options: [{ id: 'talla-opt', key: 'Talla', values: ['6', '8', '10', '12', '14'] }], images: [] },

  // Serie 552xxx - Jeans Wide Leg / Cargo ($129,900 – $149,900 PVP)
  { id: 'ref-552746', name: 'REF: 552746', reference: '552746', slug: 'ref-552746', suggested_price: 119900, price: 74900, compare_price: 119900, ribbon: 'Próximamente', description: 'Jean wide leg rígido. Foto próximamente.', full_description: 'Referencia oficial del catálogo USH BY USHUAIA.', in_stock: true, hidden: HIDDEN, options: [{ id: 'talla-opt', key: 'Talla', values: ['6', '8', '10', '12', '14'] }], images: [] },
  { id: 'ref-552761', name: 'REF: 552761', reference: '552761', slug: 'ref-552761', suggested_price: 129900, price: 84900, compare_price: 129900, ribbon: 'Próximamente', description: 'Jean wide leg rígido. Foto próximamente.', full_description: 'Referencia oficial del catálogo USH BY USHUAIA.', in_stock: true, hidden: HIDDEN, options: [{ id: 'talla-opt', key: 'Talla', values: ['6', '8', '10', '12', '14'] }], images: [] },
  { id: 'ref-552744', name: 'REF: 552744', reference: '552744', slug: 'ref-552744', suggested_price: 119900, price: 74900, compare_price: 119900, ribbon: 'Próximamente', description: 'Jean wide leg rígido. Foto próximamente.', full_description: 'Referencia oficial del catálogo USH BY USHUAIA.', in_stock: true, hidden: HIDDEN, options: [{ id: 'talla-opt', key: 'Talla', values: ['6', '8', '10', '12', '14'] }], images: [] },
  { id: 'ref-552749', name: 'REF: 552749', reference: '552749', slug: 'ref-552749', suggested_price: 129900, price: 79000, compare_price: 129900, ribbon: 'Próximamente', description: 'Jean wide leg rígido. Foto próximamente.', full_description: 'Referencia oficial del catálogo USH BY USHUAIA.', in_stock: true, hidden: HIDDEN, options: [{ id: 'talla-opt', key: 'Talla', values: ['6', '8', '10', '12', '14'] }], images: [] },
  { id: 'ref-552752', name: 'REF: 552752', reference: '552752', slug: 'ref-552752', suggested_price: 129900, price: 84900, compare_price: 129900, ribbon: 'Próximamente', description: 'Jean wide leg rígido. Foto próximamente.', full_description: 'Referencia oficial del catálogo USH BY USHUAIA.', in_stock: true, hidden: HIDDEN, options: [{ id: 'talla-opt', key: 'Talla', values: ['6', '8', '10', '12', '14'] }], images: [] },
  { id: 'ref-552770', name: 'REF: 552770', reference: '552770', slug: 'ref-552770', suggested_price: 139900, price: 84500, compare_price: 139900, ribbon: 'Próximamente', description: 'Jean wide leg tiro alto rígido. Foto próximamente.', full_description: 'Referencia oficial del catálogo USH BY USHUAIA.', in_stock: true, hidden: HIDDEN, options: [{ id: 'talla-opt', key: 'Talla', values: ['6', '8', '10', '12', '14'] }], images: [] },
  { id: 'ref-552772', name: 'REF: 552772', reference: '552772', slug: 'ref-552772', suggested_price: 139900, price: 84500, compare_price: 139900, ribbon: 'Próximamente', description: 'Jean wide leg tiro alto rígido. Foto próximamente.', full_description: 'Referencia oficial del catálogo USH BY USHUAIA.', in_stock: true, hidden: HIDDEN, options: [{ id: 'talla-opt', key: 'Talla', values: ['6', '8', '10', '12', '14'] }], images: [] },
  { id: 'ref-552780', name: 'REF: 552780', reference: '552780', slug: 'ref-552780', suggested_price: 139900, price: 84500, compare_price: 139900, ribbon: 'Próximamente', description: 'Jean wide leg tiro alto rígido. Foto próximamente.', full_description: 'Referencia oficial del catálogo USH BY USHUAIA.', in_stock: true, hidden: HIDDEN, options: [{ id: 'talla-opt', key: 'Talla', values: ['6', '8', '10', '12', '14'] }], images: [] },
  { id: 'ref-552758', name: 'REF: 552758', reference: '552758', slug: 'ref-552758', suggested_price: 129900, price: 84900, compare_price: 129900, ribbon: 'Próximamente', description: 'Jean rígido tiro alto. Foto próximamente.', full_description: 'Referencia oficial del catálogo USH BY USHUAIA.', in_stock: true, hidden: HIDDEN, options: [{ id: 'talla-opt', key: 'Talla', values: ['6', '8', '10', '12', '14'] }], images: [] },
  { id: 'ref-552276', name: 'REF: 552276', reference: '552276', slug: 'ref-552276', suggested_price: 119900, price: 76000, compare_price: 119900, ribbon: 'Próximamente', description: 'Jean dama rígido. Foto próximamente.', full_description: 'Referencia oficial del catálogo USH BY USHUAIA.', in_stock: true, hidden: HIDDEN, options: [{ id: 'talla-opt', key: 'Talla', values: ['6', '8', '10', '12', '14'] }], images: [] },

  // Serie 556xxx - Shorts / Faldas ($79,900 PVP)
  { id: 'ref-556172', name: 'REF: 556172', reference: '556172', slug: 'ref-556172', suggested_price: 79900, price: 54900, compare_price: 79900, ribbon: 'Próximamente', description: 'Short / Falda dama. Foto próximamente.', full_description: 'Referencia oficial del catálogo USH BY USHUAIA.', in_stock: true, hidden: HIDDEN, options: [{ id: 'talla-opt', key: 'Talla', values: ['6', '8', '10', '12', '14'] }], images: [] },
  { id: 'ref-556286', name: 'REF: 556286', reference: '556286', slug: 'ref-556286', suggested_price: 79900, price: 54900, compare_price: 79900, ribbon: 'Próximamente', description: 'Short / Falda dama. Foto próximamente.', full_description: 'Referencia oficial del catálogo USH BY USHUAIA.', in_stock: true, hidden: HIDDEN, options: [{ id: 'talla-opt', key: 'Talla', values: ['6', '8', '10', '12', '14'] }], images: [] },
  { id: 'ref-556288', name: 'REF: 556288', reference: '556288', slug: 'ref-556288', suggested_price: 79900, price: 54900, compare_price: 79900, ribbon: 'Próximamente', description: 'Short / Falda dama. Foto próximamente.', full_description: 'Referencia oficial del catálogo USH BY USHUAIA.', in_stock: true, hidden: HIDDEN, options: [{ id: 'talla-opt', key: 'Talla', values: ['6', '8', '10', '12', '14'] }], images: [] },
  { id: 'ref-556289', name: 'REF: 556289', reference: '556289', slug: 'ref-556289', suggested_price: 79900, price: 54900, compare_price: 79900, ribbon: 'Próximamente', description: 'Short / Falda dama. Foto próximamente.', full_description: 'Referencia oficial del catálogo USH BY USHUAIA.', in_stock: true, hidden: HIDDEN, options: [{ id: 'talla-opt', key: 'Talla', values: ['6', '8', '10', '12', '14'] }], images: [] },
  { id: 'ref-556240', name: 'REF: 556240', reference: '556240', slug: 'ref-556240', suggested_price: 79900, price: 54900, compare_price: 79900, ribbon: 'Próximamente', description: 'Short / Falda dama. Foto próximamente.', full_description: 'Referencia oficial del catálogo USH BY USHUAIA.', in_stock: true, hidden: HIDDEN, options: [{ id: 'talla-opt', key: 'Talla', values: ['6', '8', '10', '12', '14'] }], images: [] },
  { id: 'ref-556242', name: 'REF: 556242', reference: '556242', slug: 'ref-556242', suggested_price: 79900, price: 54900, compare_price: 79900, ribbon: 'Próximamente', description: 'Short / Falda dama. Foto próximamente.', full_description: 'Referencia oficial del catálogo USH BY USHUAIA.', in_stock: true, hidden: HIDDEN, options: [{ id: 'talla-opt', key: 'Talla', values: ['6', '8', '10', '12', '14'] }], images: [] },
];

