-- ========================================================
-- USH BY USHUAIA - Supabase Database Schema & Initial Data
-- Project Ref: uwfkwcrqqwruzfwzppjf
-- ========================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    reference TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    price NUMERIC(12, 2) NOT NULL,
    compare_price NUMERIC(12, 2) DEFAULT 0,
    ribbon TEXT,
    description TEXT,
    full_description TEXT,
    video_url TEXT,
    in_stock BOOLEAN DEFAULT TRUE,
    options JSONB DEFAULT '[]'::jsonb,
    images TEXT[] DEFAULT '{}',
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. WHOLESALE LEADS / CONTACT MESSAGES
CREATE TABLE IF NOT EXISTS public.wholesale_leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    doc_type TEXT DEFAULT 'CC',
    doc_number TEXT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    city TEXT,
    message TEXT,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. ORDERS TABLE
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    shipping_address TEXT NOT NULL,
    city TEXT NOT NULL,
    total NUMERIC(12, 2) NOT NULL,
    items JSONB NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for Security
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wholesale_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Public Read / Insert Policies
CREATE POLICY "Public categories read access" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Public products read access" ON public.products FOR SELECT USING (true);
CREATE POLICY "Public products insert access" ON public.products FOR INSERT WITH CHECK (true);
CREATE POLICY "Public products update access" ON public.products FOR UPDATE USING (true);
CREATE POLICY "Public wholesale leads insert access" ON public.wholesale_leads FOR INSERT WITH CHECK (true);
CREATE POLICY "Public orders insert access" ON public.orders FOR INSERT WITH CHECK (true);

-- Insert Default Category
INSERT INTO public.categories (id, name, slug, description)
VALUES ('99f75e2f-cdcb-4227-a2c8-71f3b2e72db8', 'Todos los productos', 'todos', 'Catálogo completo mayorista USH BY USHUAIA')
ON CONFLICT (slug) DO NOTHING;

-- Insert Products extracted from Wix Catalog with size 6-14
INSERT INTO public.products (id, name, reference, slug, price, compare_price, ribbon, description, full_description, in_stock, options, images, category_id)
VALUES 
(
    '6fd569eb-835a-4f76-8ee9-fd8e825f4816',
    'Ref: 556218',
    '556218',
    'ref-556218-short-largo',
    49900.00,
    0.00,
    'Nuevo',
    'Short largo de alta calidad confeccionado con denim flexible de alta resistencia.',
    'Short bermuda largo confeccionado en mezclilla flexible premium con dobladillo reforzado. Excelente rotación en catálogo mayorista para clima cálido y templado.',
    TRUE,
    '[{"id":"1fb7b7af-e9d7-4e1f-a2e2-8ba56001405c","key":"Talla","values":["6","8","10","12","14"]}]'::jsonb,
    ARRAY[
        'https://static.wixstatic.com/media/e21be4_d636501aedfd4962b899ed38ffb772c6~mv2.jpg',
        'https://static.wixstatic.com/media/e21be4_1ad3c401e63941e285a0788b61b0d925~mv2.jpg'
    ],
    '99f75e2f-cdcb-4227-a2c8-71f3b2e72db8'
),
(
    'e5a13c1a-77d2-4183-9650-bbec742398d2',
    'REF: 558077',
    '558077',
    'ref-558077-falda-dama-rigida-color-crudo',
    79900.00,
    0.00,
    '',
    'Falda Dama Rígida Color Crudo. Prenda versátil y en tendencia con acabado premium para distribución mayorista.',
    'Falda en denim rígido tono crudo marfil con pretina alta estilizadora y botones metálicos antioxidantes.',
    TRUE,
    '[{"id":"1fb7b7af-e9d7-4e1f-a2e2-8ba56001405c","key":"Talla","values":["6","8","10","12","14"]}]'::jsonb,
    ARRAY[
        'https://static.wixstatic.com/media/e21be4_5de40254bc0245f7b63506182d4c27a8~mv2.jpg',
        'https://static.wixstatic.com/media/e21be4_0916a0cddcb8476587eb621f27ec5215~mv2.jpg'
    ],
    '99f75e2f-cdcb-4227-a2c8-71f3b2e72db8'
),
(
    'a74f3b2b-ffb7-4f08-8545-d7f43e23a98c',
    'REF: 552851',
    '552851',
    'ref-552851-jean-dama-wide-leg-tiro-alto-rigido-color-azul-oscuro',
    125000.00,
    0.00,
    'Más vendido',
    'Jean Dama Wide Leg Tiro Alto Rígido Color Azul Oscuro. Silueta moderna de tiro alto con horma estilizadora.',
    'Jean Wide Leg rígido tiro alto en índigo azul oscuro con bolsillos estilo cargo y costuras en contraste.',
    TRUE,
    '[{"id":"ea9db20d-2e1a-4fe7-825f-b45a82a9d1e7","key":"Color","values":["Azul Oscuro"]},{"id":"1fb7b7af-e9d7-4e1f-a2e2-8ba56001405c","key":"Talla","values":["6","8","10","12","14"]}]'::jsonb,
    ARRAY[
        'https://static.wixstatic.com/media/e21be4_cedba513ba6f46c7888940de510e1a38~mv2.jpg',
        'https://static.wixstatic.com/media/e21be4_bb1d8310e10343a5810c818521d1a193~mv2.jpg'
    ],
    '99f75e2f-cdcb-4227-a2c8-71f3b2e72db8'
)
ON CONFLICT (slug) DO UPDATE SET 
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    images = EXCLUDED.images;
