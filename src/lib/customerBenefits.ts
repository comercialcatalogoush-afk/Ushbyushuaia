import { supabase } from '@/lib/supabase';

export interface CustomerWatch {
  productId: string;
  reference: string;
  name: string;
  color?: string;
  size?: string;
  createdAt: string;
}

const WATCHES_METADATA_KEY = 'ush_customer_watches';
const MAX_WATCHES = 50;

function cleanWatch(value: unknown): CustomerWatch | null {
  if (!value || typeof value !== 'object') return null;
  const raw = value as Record<string, unknown>;
  if (typeof raw.productId !== 'string' || !raw.productId.trim()) return null;
  if (typeof raw.reference !== 'string' || !raw.reference.trim()) return null;
  if (typeof raw.name !== 'string' || !raw.name.trim()) return null;

  return {
    productId: raw.productId.trim(),
    reference: raw.reference.trim(),
    name: raw.name.trim(),
    color: typeof raw.color === 'string' && raw.color.trim() ? raw.color.trim() : undefined,
    size: typeof raw.size === 'string' && raw.size.trim() ? raw.size.trim() : undefined,
    createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : new Date().toISOString(),
  };
}

export function normalizeCustomerWatches(value: unknown): CustomerWatch[] {
  if (!Array.isArray(value)) return [];
  const unique = new Map<string, CustomerWatch>();
  value.forEach((item) => {
    const watch = cleanWatch(item);
    if (!watch) return;
    const key = `${watch.productId}|${watch.color || ''}|${watch.size || ''}`;
    unique.set(key, watch);
  });
  return Array.from(unique.values()).slice(0, MAX_WATCHES);
}

export async function getCustomerWatches() {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return [];
  return normalizeCustomerWatches(data.user.user_metadata?.[WATCHES_METADATA_KEY]);
}

export async function saveCustomerWatches(watches: CustomerWatch[]) {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error('Debes iniciar sesión para guardar tus alertas.');

  const cleanWatches = normalizeCustomerWatches(watches);
  const { error: updateError } = await supabase.auth.updateUser({
    data: {
      ...(data.user.user_metadata || {}),
      [WATCHES_METADATA_KEY]: cleanWatches,
    },
  });
  if (updateError) throw updateError;

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('ush_customer_watches_updated'));
  }
  return cleanWatches;
}

export async function addCustomerWatch(watch: Omit<CustomerWatch, 'createdAt'>) {
  const current = await getCustomerWatches();
  const next = [
    { ...watch, createdAt: new Date().toISOString() },
    ...current.filter((item) => !(
      item.productId === watch.productId &&
      (item.color || '') === (watch.color || '') &&
      (item.size || '') === (watch.size || '')
    )),
  ];
  return saveCustomerWatches(next);
}

export async function removeCustomerWatch(watch: CustomerWatch) {
  const current = await getCustomerWatches();
  return saveCustomerWatches(current.filter((item) => !(
    item.productId === watch.productId &&
    (item.color || '') === (watch.color || '') &&
    (item.size || '') === (watch.size || '')
  )));
}

