-- ========================================================
-- USH BY USHUAIA - HARDEN RLS (cerrar acceso público de escritura)
-- Proyecto: uwfkwcrqqwruzfwzppjf
-- Objetivo: el catálogo sigue siendo de lectura pública, el checkout
-- (pedidos y leads) sigue insertando públicamente, PERO toda la
-- gestión (leer pedidos/leads/historial, editar productos, precios,
-- config, subir/borrar imágenes) queda reservada a usuarios
-- autenticados de Supabase Auth (el admin).
-- ========================================================

-- ── PRODUCTS: lectura pública, escritura solo autenticados ──
DROP POLICY IF EXISTS "Public products insert access" ON public.products;
DROP POLICY IF EXISTS "Public products update access" ON public.products;
DROP POLICY IF EXISTS "Public products delete access" ON public.products;
CREATE POLICY "Authenticated products insert access" ON public.products FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated products update access" ON public.products FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated products delete access" ON public.products FOR DELETE TO authenticated USING (true);

-- ── ORDERS: checkout inserta (público), lectura/gestión solo admin ──
DROP POLICY IF EXISTS "Public orders read access" ON public.orders;
DROP POLICY IF EXISTS "Public orders update access" ON public.orders;
DROP POLICY IF EXISTS "Public orders delete access" ON public.orders;
CREATE POLICY "Authenticated orders read access" ON public.orders FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated orders update access" ON public.orders FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated orders delete access" ON public.orders FOR DELETE TO authenticated USING (true);

-- ── WHOLESALE LEADS: formulario inserta (público), lectura/gestión solo admin ──
DROP POLICY IF EXISTS "Public wholesale leads read access" ON public.wholesale_leads;
DROP POLICY IF EXISTS "Public wholesale leads update access" ON public.wholesale_leads;
DROP POLICY IF EXISTS "Public wholesale leads delete access" ON public.wholesale_leads;
CREATE POLICY "Authenticated wholesale leads read access" ON public.wholesale_leads FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated wholesale leads update access" ON public.wholesale_leads FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated wholesale leads delete access" ON public.wholesale_leads FOR DELETE TO authenticated USING (true);

-- ── PRICE HISTORY: solo admin (lectura y escritura) ──
DROP POLICY IF EXISTS "Public price history read access" ON public.price_history;
DROP POLICY IF EXISTS "Public price history insert access" ON public.price_history;
DROP POLICY IF EXISTS "Public price history update access" ON public.price_history;
DROP POLICY IF EXISTS "Public price history delete access" ON public.price_history;
CREATE POLICY "Authenticated price history read access" ON public.price_history FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated price history insert access" ON public.price_history FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated price history update access" ON public.price_history FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated price history delete access" ON public.price_history FOR DELETE TO authenticated USING (true);

-- ── SITE_CONFIG: lectura pública, escritura solo admin ──
ALTER TABLE public.site_config ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public site_config upsert access" ON public.site_config;
DROP POLICY IF EXISTS "Public site_config update access" ON public.site_config;
CREATE POLICY "Authenticated site_config upsert access" ON public.site_config FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated site_config update access" ON public.site_config FOR UPDATE TO authenticated USING (true);

-- ── STORAGE (product-images): lectura pública, escritura solo admin ──
DROP POLICY IF EXISTS "Public product-images insert access" ON storage.objects;
DROP POLICY IF EXISTS "Public product-images update access" ON storage.objects;
DROP POLICY IF EXISTS "Public product-images delete access" ON storage.objects;
CREATE POLICY "Authenticated product-images insert access" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'product-images');
CREATE POLICY "Authenticated product-images update access" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'product-images');
CREATE POLICY "Authenticated product-images delete access" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'product-images');

-- ── CATEGORIES: lectura pública, escritura solo admin ──
DROP POLICY IF EXISTS "Public categories read access" ON public.categories;
DROP POLICY IF EXISTS "Authenticated categories insert access" ON public.categories;
DROP POLICY IF EXISTS "Authenticated categories update access" ON public.categories;
DROP POLICY IF EXISTS "Authenticated categories delete access" ON public.categories;
CREATE POLICY "Public categories read access" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Authenticated categories insert access" ON public.categories FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated categories update access" ON public.categories FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated categories delete access" ON public.categories FOR DELETE TO authenticated USING (true);

-- ── RPC: top vendedores por rotación de inventario (el público puede llamarla, pero solo devuelve ids) ──
CREATE OR REPLACE FUNCTION public.get_top_selling_ids(days_back integer DEFAULT 30)
RETURNS TABLE(id text, units numeric)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT item->>'product_id'::text AS id,
         SUM(COALESCE((item->>'quantity')::numeric, 1)) AS units
  FROM public.orders o
  CROSS JOIN LATERAL jsonb_array_elements(o.items) AS item
  WHERE o.created_at >= NOW() - make_interval(days => days_back)
    AND o.status = 'confirmed'
    AND item->>'product_id' IS NOT NULL
  GROUP BY item->>'product_id'
  ORDER BY units DESC
  LIMIT 12;
END;
$$;

REVOKE ALL ON FUNCTION public.get_top_selling_ids(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_top_selling_ids(integer) TO anon, authenticated;
