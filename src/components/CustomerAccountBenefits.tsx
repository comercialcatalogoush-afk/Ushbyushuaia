'use client';

import { useEffect, useMemo, useState } from 'react';
import { BellRing, CheckCircle2, History, Loader2, Package, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { Product } from '@/types';
import { useCart } from '@/context/CartContext';
import { supabase } from '@/lib/supabase';
import { CustomerWatch, getCustomerWatches, removeCustomerWatch } from '@/lib/customerBenefits';
import { LookbookConfig } from '@/lib/lookbookPdf';

interface CustomerOrder {
  id: string;
  order_date?: string;
  created_at?: string;
  status?: string;
  total?: number;
  discount?: number;
  items?: Array<{ product_id?: string; reference?: string; name?: string; size?: string; color?: string; quantity?: number }>;
}

function statusLabel(status?: string) {
  const labels: Record<string, string> = {
    pending: 'Pendiente',
    confirmed: 'Confirmado',
    cancelled: 'Cancelado',
    shipped: 'Enviado',
    delivered: 'Entregado',
  };
  return labels[status || ''] || status || 'Registrado';
}

export function CustomerAccountBenefits({ user, products = [], config = null }: { user: any; products?: Product[]; config?: LookbookConfig | null }) {
  const { addToCart, formatCOP } = useCart();
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [watches, setWatches] = useState<CustomerWatch[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [loadingWatches, setLoadingWatches] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [repeatingId, setRepeatingId] = useState('');

  const productsById = useMemo(() => new Map(products.map((product) => [product.id, product])), [products]);
  const productsByReference = useMemo(() => new Map(products.map((product) => [product.reference, product])), [products]);

  const loadBenefits = async () => {
    setError('');
    setLoadingOrders(true);
    setLoadingWatches(true);

    const [{ data: sessionData }, customerWatches] = await Promise.all([
      supabase.auth.getSession(),
      getCustomerWatches(),
    ]);

    setWatches(customerWatches);
    setLoadingWatches(false);

    const token = sessionData.session?.access_token;
    if (!token) {
      setLoadingOrders(false);
      return;
    }
    const authHeaders = { Authorization: `Bearer ${token}` };
    const ordersResponse = await fetch('/api/account/orders', { cache: 'no-store', headers: authHeaders });
    const ordersPayload = await ordersResponse.json().catch(() => ({}));
    if (!ordersResponse.ok) setError(ordersPayload.error || 'No se pudo cargar tu historial.');
    setOrders(Array.isArray(ordersPayload.orders) ? ordersPayload.orders : []);
    setLoadingOrders(false);
  };

  useEffect(() => {
    let cancelled = false;
    loadBenefits().catch(() => {
      if (!cancelled) {
        setError('No se pudieron cargar tus beneficios. Intenta actualizar la página.');
        setLoadingOrders(false);
        setLoadingWatches(false);
      }
    });
    return () => { cancelled = true; };
    // The account user is stable for the lifetime of this panel.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const isWatchAvailable = (watch: CustomerWatch) => {
    const product = productsById.get(watch.productId) || productsByReference.get(watch.reference);
    if (!product || product.hidden || product.status === 'draft' || product.in_stock === false) return false;
    if (watch.size && product.stock_by_size?.[watch.size] === 0) return false;
    return true;
  };

  const handleRemoveWatch = async (watch: CustomerWatch) => {
    try {
      const next = await removeCustomerWatch(watch);
      setWatches(next);
      setMessage('Alerta eliminada.');
    } catch (err: any) {
      setError(err?.message || 'No se pudo eliminar la alerta.');
    }
  };

  const handleRepeatOrder = (order: CustomerOrder) => {
    setRepeatingId(order.id);
    let addedCount = 0;
    (order.items || []).forEach((item) => {
      const product = (item.product_id && productsById.get(item.product_id)) || (item.reference && productsByReference.get(item.reference));
      if (!product || product.hidden || product.status === 'draft' || product.in_stock === false) return;
      const quantity = Math.max(1, Number(item.quantity) || 1);
      addToCart(product, item.size || undefined, item.color || undefined, quantity);
      addedCount += 1;
    });
    setRepeatingId('');
    setMessage(addedCount ? `Se agregaron ${addedCount} referencias al carrito.` : 'Las referencias de este pedido ya no están disponibles.');
  };

  return (
    <div className="mt-6 space-y-5 text-left">
      {message && <div className="flex items-center gap-2 border border-emerald-200 bg-emerald-50 p-3 text-xs font-medium text-emerald-700"><CheckCircle2 size={16} />{message}</div>}
      {error && <div className="border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700">{error}</div>}

      <section className="border border-neutral-200 bg-white p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-wide text-[#1b2333]"><History size={17} className="text-[#d88193]" /> Repetir un pedido</h2>
            <p className="mt-1 text-xs leading-relaxed text-neutral-500">Recupera tus referencias anteriores en un clic. Se valida el stock actual antes de agregarlas.</p>
          </div>
          <button type="button" onClick={() => loadBenefits()} aria-label="Actualizar pedidos" className="rounded-full p-2 text-neutral-400 hover:bg-neutral-100 hover:text-[#d88193]"><RefreshCw size={16} /></button>
        </div>
        {loadingOrders ? <div className="flex justify-center py-6"><Loader2 size={22} className="animate-spin text-[#d88193]" /></div> : orders.length === 0 ? (
          <p className="mt-4 border-t border-neutral-100 pt-4 text-xs text-neutral-500">Tus próximos pedidos aparecerán aquí.</p>
        ) : (
          <div className="mt-4 space-y-3 border-t border-neutral-100 pt-4">
            {orders.map((order) => (
              <div key={order.id} className="flex flex-col gap-3 rounded-lg border border-neutral-100 bg-neutral-50 p-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="text-xs font-black text-[#1b2333]">Pedido #{order.id}</p>
                  <p className="mt-1 text-[11px] text-neutral-500">{order.order_date || order.created_at?.slice(0, 10) || 'Fecha no disponible'} · {statusLabel(order.status)} · {formatCOP(Number(order.total) || 0)}</p>
                </div>
                <button type="button" onClick={() => handleRepeatOrder(order)} disabled={repeatingId === order.id || products.length === 0} className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg bg-[#1b2333] px-3 py-2.5 text-[10px] font-black uppercase tracking-wide text-white hover:bg-[#d88193] disabled:cursor-not-allowed disabled:opacity-50">
                  {repeatingId === order.id ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Repetir pedido
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="border border-neutral-200 bg-white p-4 sm:p-5">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-wide text-[#1b2333]"><BellRing size={17} className="text-[#d88193]" /> Mis alertas de reposición</h2>
          <p className="mt-1 text-xs leading-relaxed text-neutral-500">Guarda una referencia, color y talla. Cuando vuelvas a entrar, verás si ya está disponible.</p>
        </div>
        {loadingWatches ? <div className="flex justify-center py-6"><Loader2 size={22} className="animate-spin text-[#d88193]" /></div> : watches.length === 0 ? (
          <p className="mt-4 border-t border-neutral-100 pt-4 text-xs text-neutral-500">Aún no tienes alertas. Puedes crear una desde la ficha de cualquier prenda agotada o que quieras vigilar.</p>
        ) : (
          <div className="mt-4 space-y-2 border-t border-neutral-100 pt-4">
            {watches.map((watch) => {
              const available = isWatchAvailable(watch);
              return <div key={`${watch.productId}-${watch.color || ''}-${watch.size || ''}`} className="flex items-center gap-3 rounded-lg border border-neutral-100 p-3">
                <div className="min-w-0 flex-1"><p className="truncate text-xs font-bold text-[#1b2333]">{watch.name}</p><p className="mt-1 text-[10px] text-neutral-500">Ref. {watch.reference}{watch.color ? ` · ${watch.color}` : ''}{watch.size ? ` · Talla ${watch.size}` : ''}</p></div>
                <span className={`shrink-0 text-[10px] font-black uppercase ${available ? 'text-emerald-600' : 'text-neutral-400'}`}>{available ? 'Disponible' : 'Sin stock'}</span>
                <button type="button" onClick={() => handleRemoveWatch(watch)} aria-label={`Eliminar alerta de ${watch.name}`} className="shrink-0 rounded-full p-1.5 text-neutral-400 hover:bg-red-50 hover:text-red-600"><Trash2 size={15} /></button>
              </div>;
            })}
          </div>
        )}
      </section>

      <div className="flex items-start gap-2 border border-[#d88193]/20 bg-[#fff7f8] p-3 text-[11px] leading-relaxed text-neutral-600"><Package size={16} className="mt-0.5 shrink-0 text-[#d88193]" /><span>Las alertas se guardan en tu cuenta, no solo en este dispositivo. No almacenamos fotos nuevas: seguimos usando las URLs externas del catálogo.</span></div>
    </div>
  );
}
