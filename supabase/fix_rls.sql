-- ========================================================
-- USH BY USHUAIA - FIX RLS + STORAGE (ejecutar en SQL Editor)
-- Proyecto: uwfkwcrqqwruzfwzppjf
-- Problema: los pedidos se guardan (201) pero el admin NO los ve
-- porque faltan políticas de LECTURA (SELECT) en orders,
-- wholesale_leads y price_history. También falta el bucket de imágenes.
-- ========================================================

-- 1. ÓRDENES: permitir lectura y gestión al admin (y al público por simplicidad)
DROP POLICY IF EXISTS "Public orders read access" ON public.orders;
CREATE POLICY "Public orders read access" ON public.orders FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public orders update access" ON public.orders;
CREATE POLICY "Public orders update access" ON public.orders FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Public orders delete access" ON public.orders;
CREATE POLICY "Public orders delete access" ON public.orders FOR DELETE USING (true);

-- 2. LEADS MAYORISTAS: lectura para el admin
DROP POLICY IF EXISTS "Public wholesale leads read access" ON public.wholesale_leads;
CREATE POLICY "Public wholesale leads read access" ON public.wholesale_leads FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public wholesale leads update access" ON public.wholesale_leads;
CREATE POLICY "Public wholesale leads update access" ON public.wholesale_leads FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Public wholesale leads delete access" ON public.wholesale_leads;
CREATE POLICY "Public wholesale leads delete access" ON public.wholesale_leads FOR DELETE USING (true);

-- 3. HISTORIAL DE PRECIOS: lectura para el admin
DROP POLICY IF EXISTS "Public price history read access" ON public.price_history;
CREATE POLICY "Public price history read access" ON public.price_history FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public price history update access" ON public.price_history;
CREATE POLICY "Public price history update access" ON public.price_history FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Public price history delete access" ON public.price_history;
CREATE POLICY "Public price history delete access" ON public.price_history FOR DELETE USING (true);

-- 4. BUCKET DE IMÁGENES (crear si no existe)
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', TRUE)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public product-images read access" ON storage.objects;
CREATE POLICY "Public product-images read access"
ON storage.objects FOR SELECT USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Public product-images insert access" ON storage.objects;
CREATE POLICY "Public product-images insert access"
ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Public product-images update access" ON storage.objects;
CREATE POLICY "Public product-images update access"
ON storage.objects FOR UPDATE USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Public product-images delete access" ON storage.objects;
CREATE POLICY "Public product-images delete access"
ON storage.objects FOR DELETE USING (bucket_id = 'product-images');

-- 5. CONFIGURACIÓN (opcional: número WhatsApp en la nube)
CREATE TABLE IF NOT EXISTS public.site_config (
    key TEXT PRIMARY KEY,
    value TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

DROP POLICY IF EXISTS "Public site_config read access" ON public.site_config;
CREATE POLICY "Public site_config read access" ON public.site_config FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public site_config upsert access" ON public.site_config;
CREATE POLICY "Public site_config upsert access" ON public.site_config FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public site_config update access" ON public.site_config;
CREATE POLICY "Public site_config update access" ON public.site_config FOR UPDATE USING (true);

INSERT INTO public.site_config (key, value)
VALUES ('whatsapp_number', '573011393902')
ON CONFLICT (key) DO NOTHING;