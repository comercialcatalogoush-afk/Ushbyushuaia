-- ========================================================
-- USH BY USHUAIA - RECONCILIACIÓN RLS
-- Proyecto: uwfkwcrqqwruzfwzppjf
-- Problema: fix_rls.sql aplicó USING (true) sobre orders,
-- wholesale_leads, price_history y site_config, lo que abre
-- SELECT/UPDATE/DELETE a cualquier visitante anónimo.
-- harden_rls.sql tenía las políticas correctas (solo authenticated)
-- pero fix_rls.sql se ejecutó después y las sobreescribió.
-- Este archivo restaura las políticas de harden_rls.sql.
-- ========================================================

-- ── ORDERS: checkout sigue insertando público (anon),
--    pero SELECT/UPDATE/DELETE solo para admin (authenticated) ──
DROP POLICY IF EXISTS "Public orders read access" ON public.orders;
DROP POLICY IF EXISTS "Public orders update access" ON public.orders;
DROP POLICY IF EXISTS "Public orders delete access" ON public.orders;
DROP POLICY IF EXISTS "Authenticated orders read access" ON public.orders;
DROP POLICY IF EXISTS "Authenticated orders update access" ON public.orders;
DROP POLICY IF EXISTS "Authenticated orders delete access" ON public.orders;
CREATE POLICY "Authenticated orders read access" ON public.orders
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated orders update access" ON public.orders
  FOR UPDATE TO authenticated USING (true);
CREATE POLICY IF NOT EXISTS "Authenticated orders delete access" ON public.orders
  FOR DELETE TO authenticated USING (true);

-- ── WHOLESALE LEADS: formulario público inserta,
--    lectura/gestión solo admin ──
DROP POLICY IF EXISTS "Public wholesale leads read access" ON public.wholesale_leads;
DROP POLICY IF EXISTS "Public wholesale leads update access" ON public.wholesale_leads;
DROP POLICY IF EXISTS "Public wholesale leads delete access" ON public.wholesale_leads;
DROP POLICY IF EXISTS "Authenticated wholesale leads read access" ON public.wholesale_leads;
DROP POLICY IF EXISTS "Authenticated wholesale leads update access" ON public.wholesale_leads;
DROP POLICY IF EXISTS "Authenticated wholesale leads delete access" ON public.wholesale_leads;
CREATE POLICY "Authenticated wholesale leads read access" ON public.wholesale_leads
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated wholesale leads update access" ON public.wholesale_leads
  FOR UPDATE TO authenticated USING (true);
CREATE POLICY IF NOT EXISTS "Authenticated wholesale leads delete access" ON public.wholesale_leads
  FOR DELETE TO authenticated USING (true);

-- ── PRICE HISTORY: solo admin (lectura y escritura) ──
DROP POLICY IF EXISTS "Public price history read access" ON public.price_history;
DROP POLICY IF EXISTS "Public price history update access" ON public.price_history;
DROP POLICY IF EXISTS "Public price history delete access" ON public.price_history;
DROP POLICY IF EXISTS "Authenticated price history read access" ON public.price_history;
DROP POLICY IF EXISTS "Authenticated price history insert access" ON public.price_history;
DROP POLICY IF EXISTS "Authenticated price history update access" ON public.price_history;
DROP POLICY IF EXISTS "Authenticated price history delete access" ON public.price_history;
CREATE POLICY "Authenticated price history read access" ON public.price_history
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated price history insert access" ON public.price_history
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated price history update access" ON public.price_history
  FOR UPDATE TO authenticated USING (true);
CREATE POLICY IF NOT EXISTS "Authenticated price history delete access" ON public.price_history
  FOR DELETE TO authenticated USING (true);

-- ── SITE_CONFIG: lectura pública (catálogo / config),
--    INSERT público (register-notify, recovery-request),
--    escritura solo admin ──
DROP POLICY IF EXISTS "Public site_config read access" ON public.site_config;
DROP POLICY IF EXISTS "Public site_config upsert access" ON public.site_config;
DROP POLICY IF EXISTS "Public site_config update access" ON public.site_config;
DROP POLICY IF EXISTS "Public site_config insert access" ON public.site_config;
CREATE POLICY "Public site_config read access" ON public.site_config
  FOR SELECT USING (true);
CREATE POLICY "Public site_config insert access" ON public.site_config
  FOR INSERT WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Authenticated site_config update access" ON public.site_config
  FOR UPDATE TO authenticated USING (true);

-- ── RPC: deduct_stock ──
-- Función atómica para descontar stock por talla. Devuelve true si se
-- descontó, false si no había stock suficiente o el producto/talla no existe.
CREATE OR REPLACE FUNCTION public.deduct_stock(
  p_product_id text,
  p_size text,
  p_qty numeric
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_stock numeric;
  new_stock numeric;
BEGIN
  SELECT (stock_by_size ->> p_size)::numeric
    INTO current_stock
    FROM public.products
    WHERE id = p_product_id;

  IF current_stock IS NULL OR current_stock < p_qty THEN
    RETURN false;
  END IF;

  new_stock := GREATEST(0, current_stock - p_qty);

  UPDATE public.products
    SET stock_by_size = jsonb_set(
      COALESCE(stock_by_size, '{}'::jsonb),
      ARRAY[p_size],
      to_jsonb(new_stock)
    )
    WHERE id = p_product_id;

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.deduct_stock(text, text, numeric) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.deduct_stock(text, text, numeric) TO authenticated;
