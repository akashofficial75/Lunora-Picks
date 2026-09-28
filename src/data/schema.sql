-- =========================================================
-- Lunora Picks — Supabase PostgreSQL Schema & RLS Policies
-- Target: Supabase SQL Editor
-- Brand: Lunora Picks (by AkashProg)
-- =========================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Products Table
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  category TEXT NOT NULL,
  image_urls TEXT[] NOT NULL DEFAULT '{}',
  amazon_url TEXT NOT NULL,
  badge TEXT,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  is_live BOOLEAN NOT NULL DEFAULT true,
  click_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast lookup by slug (crucial for Pinterest traffic landings & /out/:slug redirects)
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_is_live ON public.products(is_live);
CREATE INDEX IF NOT EXISTS idx_products_is_featured ON public.products(is_featured);

-- 3. Settings Table (Single-row configuration for Affiliate Tag)
CREATE TABLE IF NOT EXISTS public.settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  amazon_affiliate_tag TEXT NOT NULL DEFAULT 'lunorapicks-20',
  site_title TEXT NOT NULL DEFAULT 'Lunora Picks',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT single_row_check CHECK (id = 1)
);

-- Seed initial settings row if not exists
INSERT INTO public.settings (id, amazon_affiliate_tag, site_title)
VALUES (1, 'lunorapicks-20', 'Lunora Picks')
ON CONFLICT (id) DO NOTHING;

-- 4. Newsletter Subscribers Table (Nice-to-have)
CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  subscribed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Row Level Security (RLS) Setup
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Products Policies:
DROP POLICY IF EXISTS "Allow public read of live products" ON public.products;
DROP POLICY IF EXISTS "Allow authenticated admin full access to products" ON public.products;
DROP POLICY IF EXISTS "Allow authenticated admin full access" ON public.products;
DROP POLICY IF EXISTS "Allow authenticated delete of products" ON public.products;
DROP POLICY IF EXISTS "Allow authenticated insert of products" ON public.products;
DROP POLICY IF EXISTS "Allow authenticated update of products" ON public.products;

-- 1. SELECT: Public read of live products, authenticated can view all
CREATE POLICY "Allow public read of live products"
ON public.products FOR SELECT
USING (is_live = true OR auth.role() = 'authenticated');

-- 2. INSERT: Authenticated admin can insert products
CREATE POLICY "Allow authenticated insert of products"
ON public.products FOR INSERT
TO authenticated
WITH CHECK (true);

-- 3. UPDATE: Authenticated admin can update products
CREATE POLICY "Allow authenticated update of products"
ON public.products FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- 4. DELETE: Authenticated admin can delete products (CRITICAL)
CREATE POLICY "Allow authenticated delete of products"
ON public.products FOR DELETE
TO authenticated
USING (true);

-- 5. Universal full access policy for authenticated admin
CREATE POLICY "Allow authenticated admin full access to products"
ON public.products FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Settings Policies:
-- Anyone can read the affiliate tag (needed for redirects & disclosures)
CREATE POLICY "Allow public read of settings"
ON public.settings FOR SELECT
USING (true);

-- Authenticated admin can update settings
CREATE POLICY "Allow authenticated admin to update settings"
ON public.settings FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Newsletter Policies:
-- Public can subscribe
DROP POLICY IF EXISTS "Allow public newsletter signups" ON public.newsletter_subscribers;
CREATE POLICY "Allow public newsletter signups"
ON public.newsletter_subscribers FOR INSERT
WITH CHECK (true);

-- Authenticated and admin can view subscribers
DROP POLICY IF EXISTS "Allow authenticated read of newsletter subscribers" ON public.newsletter_subscribers;
CREATE POLICY "Allow authenticated read of newsletter subscribers"
ON public.newsletter_subscribers FOR SELECT
USING (true);

-- Authenticated and admin can delete subscribers
DROP POLICY IF EXISTS "Allow authenticated delete of newsletter subscribers" ON public.newsletter_subscribers;
CREATE POLICY "Allow authenticated delete of newsletter subscribers"
ON public.newsletter_subscribers FOR DELETE
USING (true);

-- Function to safely increment click count on redirect without requiring full write permissions
CREATE OR REPLACE FUNCTION increment_product_clicks(target_slug TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.products
  SET click_count = click_count + 1,
      updated_at = now()
  WHERE slug = target_slug;
END;
$$;
