// Precios por escala mayorista y códigos de descuento/referido

export interface PriceTier {
  key: 'detalle' | 'escala3' | 'escala7' | 'mayorista12';
  label: string;
  min: number;
  max?: number;
  discount: number; // % de descuento sobre precio sugerido
  usesWholesalePrice: boolean;
}

// Escalas del negocio: quanto más unidades, mayor descuento.
export const PRICE_TIERS: PriceTier[] = [
  { key: 'detalle', label: 'Detal (1–2 uds)', min: 1, max: 2, discount: 0.2, usesWholesalePrice: false },
  { key: 'escala3', label: 'Mayorista 3–6 uds', min: 3, max: 6, discount: 0.25, usesWholesalePrice: false },
  { key: 'escala7', label: 'Mayorista 7–11 uds', min: 7, max: 11, discount: 0.3, usesWholesalePrice: false },
  { key: 'mayorista12', label: 'Mayorista 12+ uds', min: 12, discount: 0.42, usesWholesalePrice: true },
];

export function getTierForUnits(units: number): PriceTier {
  return PRICE_TIERS.find((t) => units >= t.min && (t.max === undefined || units <= t.max)) || PRICE_TIERS[0];
}

export function isWholesale(units: number): boolean {
  return units >= 12;
}

// Precio unitario según la escala total de unidades del pedido.
export function getUnitPrice(suggestedPrice: number, wholesalePrice: number, totalUnits: number): number {
  const tier = getTierForUnits(totalUnits);
  if (tier.usesWholesalePrice) return wholesalePrice;
  return Math.round(suggestedPrice * (1 - tier.discount));
}

// ── Códigos de descuento / referido ──────────────────────────────
export interface Coupon {
  code: string;
  discount: number; // 0..1 (p. ej. 0.05 = 5%)
  minUnits?: number; // mínimo de unidades para usarlo
}

const DEFAULT_COUPONS: Coupon[] = [
  { code: 'BIENVENIDA10', discount: 0.1, minUnits: 3 },
  { code: 'USH10', discount: 0.1, minUnits: 6 },
];

const COUPONS_KEY = 'ush_coupons_v1';

export function getCoupons(): Coupon[] {
  if (typeof window === 'undefined') return DEFAULT_COUPONS;
  try {
    const saved = localStorage.getItem(COUPONS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (_) {}
  return DEFAULT_COUPONS;
}

export function saveCoupons(coupons: Coupon[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(COUPONS_KEY, JSON.stringify(coupons));
    window.dispatchEvent(new Event('ush_coupons_updated'));
  } catch (_) {}
}

export function validateCoupon(code: string, totalUnits: number): { valid: boolean; coupon?: Coupon; message?: string } {
  const clean = (code || '').trim().toUpperCase();
  if (!clean) return { valid: false, message: 'Ingresa un código.' };
  const coupon = getCoupons().find((c) => c.code.toUpperCase() === clean);
  if (!coupon) return { valid: false, message: 'El código no es válido.' };
  if (coupon.minUnits && totalUnits < coupon.minUnits) {
    return { valid: false, message: `Este código requiere mínimo ${coupon.minUnits} unidades.` };
  }
  return { valid: true, coupon };
}
