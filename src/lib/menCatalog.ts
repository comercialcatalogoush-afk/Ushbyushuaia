/**
 * Catálogo de Hombre USH.
 * Refs detectadas por tags `USH HM AYA -2026`, `HM`, o nombre con "hombre"/"tvnt"/"Dockers".
 * - Camisas → tallas S-M-L-XL
 * - Jeans / Pantalones / Bermudas → tallas 28-30-32-34-36
 * Actualizado: 2026-09-10
 */
export const MEN_REFERENCES: ReadonlySet<string> = new Set([
  '201450', '201452', '201454', '201455', '201456',
  '201462', '201463', '201464', '201465', '201466',
  '201471', '201472', '201479', '201480', '201481',
  '201482', '201483', '201487', '201488', '201489',
  '201490', '201491',
  '600691', '600692', '600693', '600742', '600744',
  '600745', '600747', '600749', '600752', '600753',
  '600759', '600761', '600763', '600764', '600767',
  '600772', '600773', '600774', '600777', '600778',
  '600779', '600780', '600781', '600786', '600787',
  '600788', '600790', '600791', '600792', '600793',
  '600804', '600805', '600807', '600812',
  '8A7001', '8A7002', '8A7003', '8A7012', '8A7013',
  '800081', '800083',
]);

/** Categorías de hombre con tallas de pantalón (28-36). */
const MEN_PANTS_CATEGORIES: ReadonlySet<string> = new Set([
  'Jeans', 'Pantalones', 'Bermudas',
]);

/** Tallas de camisas de hombre. */
export const MEN_SHIRT_SIZES: ReadonlyArray<string> = ['S', 'M', 'L', 'XL'];

/** Tallas de pantalón/jeans/bermudas de hombre. */
export const MEN_PANTS_SIZES: ReadonlyArray<string> = ['28', '30', '32', '34', '36'];

/** Verifica si una referencia pertenece al catálogo de Hombre. */
export function isMenReference(reference: string): boolean {
  return MEN_REFERENCES.has(reference);
}

/**
 * Devuelve las tallas correctas para una prenda de hombre según su categoría.
 * Camisas → S-M-L-XL; el resto de categorías de hombre → 28-30-32-34-36.
 * Si la referencia no es de hombre, devuelve null para usar las tallas estándar.
 */
export function getMenSizesForProduct(
  reference: string,
  category?: string | null,
): ReadonlyArray<string> | null {
  if (!isMenReference(reference)) return null;
  if (category && MEN_PANTS_CATEGORIES.has(category)) return MEN_PANTS_SIZES;
  return MEN_SHIRT_SIZES;
}