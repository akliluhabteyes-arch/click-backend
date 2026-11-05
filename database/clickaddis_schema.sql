-- =============================================================================
--  ClickAddis Website — Database Schema & Seed Data
--  Target   : Supabase (PostgreSQL 15+)
--  Run in   : Supabase Dashboard → SQL Editor  (or psql against the project DB)
--
--  What this script does
--    1. (Optional) database creation — for LOCAL PostgreSQL only
--    2. Shared helpers (extension, updated_at trigger)
--    3. Tables, constraints, indexes, triggers
--    4. Row Level Security (public read-only on published content)
--    5. Seed data that reproduces the current frontend 1:1
--
--  The script is idempotent: tables use IF NOT EXISTS and seed rows use
--  ON CONFLICT DO NOTHING, so it is safe to run more than once.
--
--  Images: rows that reference images use Cloudinary URLs. Replace
--  YOUR_CLOUD_NAME with your Cloudinary cloud name and upload the files from
--  Frontend/src/assets/ using the public_id given in each row.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- 1. DATABASE CREATION (local PostgreSQL only)
-- -----------------------------------------------------------------------------
-- Supabase provisions the database for you (named "postgres"); CREATE DATABASE
-- is not permitted there. For a local Postgres instance, run these two lines
-- separately first, then run the rest of this file connected to clickaddis:
--
--   CREATE DATABASE clickaddis WITH ENCODING 'UTF8';
--   \c clickaddis
-- -----------------------------------------------------------------------------

BEGIN;

-- -----------------------------------------------------------------------------
-- 2. SHARED HELPERS
-- -----------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pgcrypto;   -- gen_random_uuid()

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;


-- -----------------------------------------------------------------------------
-- 3. TABLES
-- -----------------------------------------------------------------------------

-- 3.1 site_settings ------------------------------------------------------------
-- Single-row table: company identity, contact details, map location, global
-- images and chat widget texts. Used by Contact, Footer, Map, Navbar, Hero,
-- About and ChatWidget.
CREATE TABLE IF NOT EXISTS public.site_settings (
  id                        SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),

  -- identity
  company_name              TEXT NOT NULL,
  legal_name                TEXT NOT NULL,
  tagline                   TEXT,
  short_description         TEXT,

  -- contact
  address_line1             TEXT NOT NULL,          -- "Omega Tower, 8th Floor"
  address_line2             TEXT,                   -- "Kazanchis"
  city                      TEXT NOT NULL,
  country                   TEXT NOT NULL,
  phone                     TEXT NOT NULL,
  email                     TEXT NOT NULL,
  support_email             TEXT,
  working_hours             TEXT,
  timezone                  TEXT NOT NULL DEFAULT 'Africa/Addis_Ababa',

  -- map
  latitude                  DOUBLE PRECISION NOT NULL CHECK (latitude  BETWEEN -90  AND 90),
  longitude                 DOUBLE PRECISION NOT NULL CHECK (longitude BETWEEN -180 AND 180),
  map_zoom                  SMALLINT NOT NULL DEFAULT 19 CHECK (map_zoom BETWEEN 1 AND 21),

  -- global images (NULL = frontend falls back to its bundled asset)
  logo_url                  TEXT,
  logo_public_id            TEXT,
  hero_background_url       TEXT,
  hero_background_public_id TEXT,
  hero_image_url            TEXT,
  hero_image_public_id      TEXT,
  about_image_url           TEXT,
  about_image_public_id     TEXT,
  solutions_background_url  TEXT,
  solutions_background_public_id TEXT,

  -- chat widget
  chat_bot_name             TEXT NOT NULL DEFAULT 'ClickAddis Support',
  chat_welcome_message      TEXT NOT NULL,
  chat_default_response     TEXT NOT NULL,

  created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3.2 site_stats ---------------------------------------------------------------
-- Hero counters: "20+ Happy Clients", "30+ Projects Delivered", ...
CREATE TABLE IF NOT EXISTS public.site_stats (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug           TEXT NOT NULL UNIQUE,
  value          INTEGER NOT NULL CHECK (value >= 0),
  suffix         TEXT NOT NULL DEFAULT '+',
  label          TEXT NOT NULL,
  display_order  INTEGER NOT NULL DEFAULT 0,
  is_active      BOOLEAN NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3.3 company_values -----------------------------------------------------------
-- About section value cards (Mission-Driven, Innovation First, ...)
CREATE TABLE IF NOT EXISTS public.company_values (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug           TEXT NOT NULL UNIQUE,
  title          TEXT NOT NULL,
  description    TEXT NOT NULL,
  icon_key       TEXT NOT NULL,                 -- lucide-react icon name
  display_order  INTEGER NOT NULL DEFAULT 0,
  is_active      BOOLEAN NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3.4 services -----------------------------------------------------------------
-- Services section + Footer "Services" column (show_in_footer)
CREATE TABLE IF NOT EXISTS public.services (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            TEXT NOT NULL UNIQUE,
  title           TEXT NOT NULL,
  description     TEXT NOT NULL,
  icon_key        TEXT NOT NULL,                -- lucide-react icon name
  display_order   INTEGER NOT NULL DEFAULT 0,
  show_in_footer  BOOLEAN NOT NULL DEFAULT FALSE,
  footer_order    INTEGER,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3.5 solutions ----------------------------------------------------------------
-- Enterprise ERP products + Footer "Solutions" column (show_in_footer)
CREATE TABLE IF NOT EXISTS public.solutions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug              TEXT NOT NULL UNIQUE,
  name              TEXT NOT NULL,
  short_description TEXT,                       -- for a future detail page
  icon_key          TEXT NOT NULL,              -- lucide-react icon name
  gradient_classes  TEXT NOT NULL,              -- Tailwind gradient, e.g. "from-orange-500/20 to-red-500/20"
  image_url         TEXT,                       -- Cloudinary screenshot (future)
  image_public_id   TEXT,
  display_order     INTEGER NOT NULL DEFAULT 0,
  show_in_footer    BOOLEAN NOT NULL DEFAULT FALSE,
  footer_order      INTEGER,
  is_active         BOOLEAN NOT NULL DEFAULT TRUE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3.6 customers ----------------------------------------------------------------
-- "Our Customers" grid
CREATE TABLE IF NOT EXISTS public.customers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            TEXT NOT NULL UNIQUE,
  name            TEXT NOT NULL,
  icon            TEXT,                         -- emoji fallback when no logo
  logo_url        TEXT,                         -- Cloudinary
  logo_public_id  TEXT,
  industry        TEXT,
  website_url     TEXT,
  display_order   INTEGER NOT NULL DEFAULT 0,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3.7 testimonials -------------------------------------------------------------
-- "What Our Customers Say". customer_id is optional: a testimonial may come
-- from a client that is not shown in the customers grid (e.g. Sip Cafe).
CREATE TABLE IF NOT EXISTS public.testimonials (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug             TEXT NOT NULL UNIQUE,
  customer_id      UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  client_name      TEXT NOT NULL,
  author_name      TEXT,                        -- person quoted (optional)
  author_role      TEXT NOT NULL,
  icon             TEXT,                        -- emoji fallback
  avatar_url       TEXT,                        -- Cloudinary
  avatar_public_id TEXT,
  quote            TEXT NOT NULL,
  rating           SMALLINT NOT NULL DEFAULT 5 CHECK (rating BETWEEN 1 AND 5),
  display_order    INTEGER NOT NULL DEFAULT 0,
  is_published     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3.8 team_members -------------------------------------------------------------
-- "Meet The Experts"
CREATE TABLE IF NOT EXISTS public.team_members (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug             TEXT NOT NULL UNIQUE,
  full_name        TEXT NOT NULL,
  role             TEXT NOT NULL,
  bio              TEXT,
  image_url        TEXT,                        -- Cloudinary
  image_public_id  TEXT,
  email            TEXT,
  linkedin_url     TEXT,
  display_order    INTEGER NOT NULL DEFAULT 0,
  is_active        BOOLEAN NOT NULL DEFAULT TRUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3.9 social_links -------------------------------------------------------------
-- Footer social icons. The SVG icon stays in the frontend, keyed by platform.
CREATE TABLE IF NOT EXISTS public.social_links (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform       TEXT NOT NULL UNIQUE,          -- facebook, telegram, ...
  label          TEXT NOT NULL,                 -- "Facebook" (aria-label)
  url            TEXT NOT NULL,
  display_order  INTEGER NOT NULL DEFAULT 0,
  is_active      BOOLEAN NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3.10 chat_faqs ---------------------------------------------------------------
-- Chat widget keyword → response rules. Evaluated in ascending priority;
-- the first rule whose keyword is contained in the user's message wins.
CREATE TABLE IF NOT EXISTS public.chat_faqs (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug           TEXT NOT NULL UNIQUE,
  keywords       TEXT[] NOT NULL CHECK (cardinality(keywords) > 0),
  response       TEXT NOT NULL,                 -- Markdown (**bold**, bullets)
  priority       INTEGER NOT NULL DEFAULT 0,
  is_active      BOOLEAN NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3.11 chat_quick_actions ------------------------------------------------------
-- Quick-reply chips under the chat ("Our Products", "Pricing", ...)
CREATE TABLE IF NOT EXISTS public.chat_quick_actions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug           TEXT NOT NULL UNIQUE,
  label          TEXT NOT NULL,
  query          TEXT NOT NULL,
  display_order  INTEGER NOT NULL DEFAULT 0,
  is_active      BOOLEAN NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3.12 contact_messages --------------------------------------------------------
-- Submissions from the "Let's Build Together" form. Write-only from the public
-- site (through the backend); readable only by admins.
CREATE TABLE IF NOT EXISTS public.contact_messages (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name    TEXT NOT NULL CHECK (char_length(full_name) BETWEEN 1 AND 150),
  email        TEXT NOT NULL CHECK (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  phone        TEXT,
  company      TEXT,
  subject      TEXT,
  message      TEXT NOT NULL CHECK (char_length(message) BETWEEN 1 AND 5000),
  source       TEXT NOT NULL DEFAULT 'contact_form'
                 CHECK (source IN ('contact_form', 'demo_request', 'chat_widget')),
  status       TEXT NOT NULL DEFAULT 'new'
                 CHECK (status IN ('new', 'read', 'replied', 'archived', 'spam')),
  ip_address   INET,
  user_agent   TEXT,
  admin_notes  TEXT,
  replied_at   TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- -----------------------------------------------------------------------------
-- 3.13 INDEXES
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_site_stats_order        ON public.site_stats        (display_order) WHERE is_active;
CREATE INDEX IF NOT EXISTS idx_company_values_order    ON public.company_values    (display_order) WHERE is_active;
CREATE INDEX IF NOT EXISTS idx_services_order          ON public.services          (display_order) WHERE is_active;
CREATE INDEX IF NOT EXISTS idx_solutions_order         ON public.solutions         (display_order) WHERE is_active;
CREATE INDEX IF NOT EXISTS idx_customers_order         ON public.customers         (display_order) WHERE is_active;
CREATE INDEX IF NOT EXISTS idx_testimonials_order      ON public.testimonials      (display_order) WHERE is_published;
CREATE INDEX IF NOT EXISTS idx_testimonials_customer   ON public.testimonials      (customer_id);
CREATE INDEX IF NOT EXISTS idx_team_members_order      ON public.team_members      (display_order) WHERE is_active;
CREATE INDEX IF NOT EXISTS idx_social_links_order      ON public.social_links      (display_order) WHERE is_active;
CREATE INDEX IF NOT EXISTS idx_chat_faqs_priority      ON public.chat_faqs         (priority)      WHERE is_active;
CREATE INDEX IF NOT EXISTS idx_chat_quick_actions_ord  ON public.chat_quick_actions(display_order) WHERE is_active;
CREATE INDEX IF NOT EXISTS idx_contact_messages_status ON public.contact_messages  (status, created_at DESC);


-- -----------------------------------------------------------------------------
-- 3.14 updated_at TRIGGERS
-- -----------------------------------------------------------------------------
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'site_settings', 'site_stats', 'company_values', 'services', 'solutions',
    'customers', 'testimonials', 'team_members', 'social_links',
    'chat_faqs', 'chat_quick_actions', 'contact_messages'
  ]
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_%1$s_updated_at ON public.%1$I;', t);
    EXECUTE format(
      'CREATE TRIGGER trg_%1$s_updated_at BEFORE UPDATE ON public.%1$I
         FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();', t);
  END LOOP;
END;
$$;


-- -----------------------------------------------------------------------------
-- 4. ROW LEVEL SECURITY
-- -----------------------------------------------------------------------------
-- The Node backend uses the Supabase SERVICE ROLE key, which bypasses RLS, so
-- it can read/write everything (including contact_messages).
-- The policies below only matter if the anon/public key is ever used directly:
-- visitors may read active/published content and nothing else.
DO $$
DECLARE
  t TEXT;
  cond TEXT;
BEGIN
  -- enable RLS on every table
  FOREACH t IN ARRAY ARRAY[
    'site_settings', 'site_stats', 'company_values', 'services', 'solutions',
    'customers', 'testimonials', 'team_members', 'social_links',
    'chat_faqs', 'chat_quick_actions', 'contact_messages'
  ]
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t);
  END LOOP;

  -- public read policies for content tables
  FOREACH t IN ARRAY ARRAY[
    'site_settings', 'site_stats', 'company_values', 'services', 'solutions',
    'customers', 'testimonials', 'team_members', 'social_links',
    'chat_faqs', 'chat_quick_actions'
  ]
  LOOP
    cond := CASE
              WHEN t = 'site_settings' THEN 'true'
              WHEN t = 'testimonials'  THEN 'is_published'
              ELSE 'is_active'
            END;
    EXECUTE format('DROP POLICY IF EXISTS "public_read_%1$s" ON public.%1$I;', t);
    EXECUTE format(
      'CREATE POLICY "public_read_%1$s" ON public.%1$I
         FOR SELECT TO anon, authenticated USING (%2$s);', t, cond);
  END LOOP;
  -- contact_messages: intentionally NO public policy (backend-only access).
END;
$$;


-- -----------------------------------------------------------------------------
-- 5. SEED DATA  (mirrors the current hard-coded frontend content)
-- -----------------------------------------------------------------------------

-- 5.1 site_settings ------------------------------------------------------------
INSERT INTO public.site_settings (
  id, company_name, legal_name, tagline, short_description,
  address_line1, address_line2, city, country,
  phone, email, support_email, working_hours, timezone,
  latitude, longitude, map_zoom,
  chat_bot_name, chat_welcome_message, chat_default_response
) VALUES (
  1,
  'ClickAddis',
  'ClickAddis IT Solution PLC',
  'We build what people can really use!',
  'Ethiopia''s leading IT solutions company. We build enterprise-grade software that transforms businesses across East Africa.',
  'Omega Tower, 8th Floor',
  'Kazanchis',
  'Addis Ababa',
  'Ethiopia',
  '+251 983412728',
  'info@clickaddiserp.com',
  'support@clickaddis.com',
  'Mon - Fri: 8:30 AM - 5:30 PM EAT',
  'Africa/Addis_Ababa',
  9.01694626964166,
  38.77227299865698,
  19,
  'ClickAddis Support',
  $txt$Hi! 👋 I'm **ClickAddis Assistant**. I can help you learn about our ERP products, services, pricing, and more!

What would you like to know?$txt$,
  $txt$Thanks for your message! I didn't quite catch that. Try asking about:

• Our **ERP products** (restaurant, gym, HRMS, inventory...)
• **Mobile & web development**
• **Pricing** & packages
• **Location** & contact info
• Schedule a **demo**

Or contact us directly at info@clickaddiserp.com / +251 983412728!$txt$
)
ON CONFLICT (id) DO NOTHING;

-- 5.2 site_stats (Hero counters) -----------------------------------------------
INSERT INTO public.site_stats (slug, value, suffix, label, display_order) VALUES
  ('happy-clients',      20, '+', 'Happy Clients',      1),
  ('projects-delivered', 30, '+', 'Projects Delivered', 2),
  ('erp-products',        8, '+', 'ERP Products',       3),
  ('years-experience',    5, '+', 'Years Experience',   4)
ON CONFLICT (slug) DO NOTHING;

-- 5.3 company_values (About section) -------------------------------------------
INSERT INTO public.company_values (slug, title, description, icon_key, display_order) VALUES
  ('mission-driven',   'Mission-Driven',   'Empowering Ethiopian businesses through cutting-edge technology',  'Target',    1),
  ('innovation-first', 'Innovation First', 'Always exploring new technologies to deliver the best solutions',  'Lightbulb', 2),
  ('client-centric',   'Client-Centric',   'Your success is our success — we go the extra mile',               'Heart',     3),
  ('rapid-delivery',   'Rapid Delivery',   'Agile processes that get your product to market fast',             'Rocket',    4)
ON CONFLICT (slug) DO NOTHING;

-- 5.4 services -----------------------------------------------------------------
INSERT INTO public.services (slug, title, description, icon_key, display_order, show_in_footer, footer_order) VALUES
  ('erp-systems',        'ERP Systems',        'End-to-end enterprise resource planning tailored for your industry', 'Monitor',    1, TRUE,  1),
  ('mobile-apps',        'Mobile Apps',        'Custom iOS & Android applications built on demand',                   'Smartphone', 2, TRUE,  2),
  ('web-development',    'Web Development',    'Modern, scalable web applications & portals',                         'Code2',      3, TRUE,  3),
  ('cloud-solutions',    'Cloud Solutions',    'Robust cloud infrastructure and deployment',                          'Database',   4, FALSE, NULL),
  ('business-analytics', 'Business Analytics', 'Data-driven insights to power your decisions',                        'BarChart3',  5, FALSE, NULL),
  ('it-consulting',      'IT Consulting',      'Strategic tech advisory for growing businesses',                      'Shield',     6, TRUE,  4)
ON CONFLICT (slug) DO NOTHING;

-- 5.5 solutions ----------------------------------------------------------------
INSERT INTO public.solutions (slug, name, icon_key, gradient_classes, display_order, show_in_footer, footer_order) VALUES
  ('restaurant-management', 'Restaurant Management', 'UtensilsCrossed', 'from-orange-500/20 to-red-500/20',     1, TRUE,  1),
  ('inventory-system',      'Inventory System',      'Package',         'from-blue-500/20 to-cyan-500/20',      2, FALSE, NULL),
  ('fnb-management',        'F&B Management',        'Wine',            'from-purple-500/20 to-pink-500/20',    3, FALSE, NULL),
  ('hrms',                  'HRMS',                  'UserCheck',       'from-green-500/20 to-emerald-500/20',  4, TRUE,  2),
  ('gym-software',          'GYM Software',          'Dumbbell',        'from-yellow-500/20 to-amber-500/20',   5, TRUE,  4),
  ('compound-management',   'Compound Management',   'Building',        'from-indigo-500/20 to-violet-500/20',  6, TRUE,  3),
  ('boutique-management',   'Boutique Management',   'ShoppingBag',     'from-pink-500/20 to-rose-500/20',      7, FALSE, NULL),
  ('shop-management',       'Shop Management',       'Store',           'from-teal-500/20 to-cyan-500/20',      8, FALSE, NULL)
ON CONFLICT (slug) DO NOTHING;

-- 5.6 customers ----------------------------------------------------------------
INSERT INTO public.customers (slug, name, icon, industry, display_order) VALUES
  ('totot-traditional-restaurant', 'Totot Traditional Restaurant', '🍽️', 'Restaurant', 1),
  ('africa-gym',                   'Africa Gym',                   '💪', 'Fitness',    2),
  ('sawim-gym',                    'Sawim Gym',                    '🏋️', 'Fitness',    3),
  ('juice-plus',                   'Juice Plus',                   '🥤', 'Food & Beverage', 4),
  ('tasma-hospital',               'Tasma Hospital',               '🏥', 'Healthcare', 5),
  ('4u-style',                     '4U Style',                     '👗', 'Retail',     6),
  ('amen-mobile',                  'Amen Mobile',                  '📱', 'Retail',     7),
  ('cremino-cafe',                 'Cremino Cafe',                 '☕', 'Cafe',       8)
ON CONFLICT (slug) DO NOTHING;

-- 5.7 testimonials -------------------------------------------------------------
INSERT INTO public.testimonials (slug, customer_id, client_name, author_role, icon, quote, rating, display_order)
SELECT v.slug, c.id, v.client_name, v.author_role, v.icon, v.quote, v.rating, v.display_order
FROM (VALUES
  ('totot-traditional-restaurant', 'totot-traditional-restaurant', 'Totot Traditional Restaurant', 'Restaurant Owner', '🍽️',
     'ClickAddis simplified our HR—attendance, payroll, and staff management in one system.', 5, 1),
  ('africa-gym',   'africa-gym',   'Africa Gym',   'General Manager', '💪',
     'The gym management software they built for us is outstanding. Member tracking, billing, and scheduling all in one place.', 5, 2),
  ('sip-cafe',     NULL,           'Sip Cafe',     'Founder',         '☕',
     'From POS to inventory management, ClickAddis delivered a system that makes running our café effortless. Highly recommended!', 5, 3),
  ('cremino-cafe', 'cremino-cafe', 'Cremino Cafe', 'Founder',         '☕',
     'From POS to inventory management, ClickAddis delivered a system that makes running our café effortless. Highly recommended!', 5, 4),
  ('4u-style',     '4u-style',     '4U Style',     'Store Manager',   '👗',
     'The boutique management system is exactly what we needed. Sales tracking and inventory are now a breeze.', 5, 5),
  ('juice-plus',   'juice-plus',   'Juice Plus',   'Operations Head', '🥤',
     'ClickAddis understood our unique needs and delivered a solution that exceeded our expectations. Great team, great results!', 5, 6)
) AS v(slug, customer_slug, client_name, author_role, icon, quote, rating, display_order)
LEFT JOIN public.customers c ON c.slug = v.customer_slug
ON CONFLICT (slug) DO NOTHING;

-- 5.8 team_members -------------------------------------------------------------
-- Upload each photo to Cloudinary with the given public_id
-- (source file in Frontend/src/assets/ noted on the right).
INSERT INTO public.team_members (slug, full_name, role, image_url, image_public_id, display_order) VALUES
  ('getacher-aychiluhum', 'Getacher Aychiluhum', 'CEO & Founder',
     'https://res.cloudinary.com/YOUR_CLOUD_NAME/image/upload/clickaddis/team/getacher-aychiluhum.jpg',
     'clickaddis/team/getacher-aychiluhum', 1),                          -- team2.jpg
  ('abdu-adem',           'Abdu Adem',           'CTO',
     'https://res.cloudinary.com/YOUR_CLOUD_NAME/image/upload/clickaddis/team/abdu-adem.jpg',
     'clickaddis/team/abdu-adem', 2),                                    -- team5.jpg
  ('biruk-nesibu',        'Biruk Nesibu',        'Programmer',
     'https://res.cloudinary.com/YOUR_CLOUD_NAME/image/upload/clickaddis/team/biruk-nesibu.jpg',
     'clickaddis/team/biruk-nesibu', 3),                                 -- Abu.jpg
  ('mesfin-aychiluhum',   'Mesfin Aychiluhum',   'Programmer',
     'https://res.cloudinary.com/YOUR_CLOUD_NAME/image/upload/clickaddis/team/mesfin-aychiluhum.jpg',
     'clickaddis/team/mesfin-aychiluhum', 4),                            -- Mesf.jpg
  ('venus-h-meskel',      'Venus H/Meskel',      'Programmer',
     'https://res.cloudinary.com/YOUR_CLOUD_NAME/image/upload/clickaddis/team/venus-h-meskel.jpg',
     'clickaddis/team/venus-h-meskel', 5)                                -- team4.jpg
ON CONFLICT (slug) DO NOTHING;

-- 5.9 social_links -------------------------------------------------------------
-- URLs are "#" exactly as in the current Footer — replace with real profiles.
INSERT INTO public.social_links (platform, label, url, display_order) VALUES
  ('facebook',  'Facebook',  '#', 1),
  ('telegram',  'Telegram',  '#', 2),
  ('instagram', 'Instagram', '#', 3),
  ('linkedin',  'LinkedIn',  '#', 4),
  ('youtube',   'YouTube',   '#', 5),
  ('tiktok',    'TikTok',    '#', 6)
ON CONFLICT (platform) DO NOTHING;

-- 5.10 chat_quick_actions ------------------------------------------------------
INSERT INTO public.chat_quick_actions (slug, label, query, display_order) VALUES
  ('our-products', 'Our Products', 'erp',     1),
  ('pricing',      'Pricing',      'pricing', 2),
  ('book-demo',    'Book Demo',    'demo',    3),
  ('contact',      'Contact',      'contact', 4)
ON CONFLICT (slug) DO NOTHING;

-- 5.11 chat_faqs (priority order = original matching order) --------------------
INSERT INTO public.chat_faqs (slug, priority, keywords, response) VALUES
('erp', 1, ARRAY['erp','enterprise'],
$txt$🏢 **Our ERP Solutions:**

• **Restaurant Management** — POS, kitchen display, table management, order tracking, recipe costing & inventory
• **Inventory System** — Real-time stock tracking, multi-warehouse, auto-reorder, barcode scanning
• **HRMS** — Payroll, attendance, leave management, performance reviews, employee self-service portal
• **GYM Software** — Member management, billing, class scheduling, trainer assignments, equipment tracking
• **Compound Management** — Tenant management, rent collection, maintenance tracking, facility booking
• **Boutique/Shop Management** — POS, inventory, customer loyalty, sales analytics, supplier management
• **F&B Management** — Full food & beverage operations, cost control, menu engineering

All systems include dashboards, reporting, and mobile access. Want a demo? Contact us at info@clickaddiserp.com!$txt$),

('restaurant', 2, ARRAY['restaurant','food','cafe','kitchen','pos'],
$txt$🍽️ **Restaurant Management System:**

✅ Point of Sale (POS) with touch interface
✅ Kitchen Display System (KDS)
✅ Table & reservation management
✅ Order tracking & delivery management
✅ Recipe costing & food waste tracking
✅ Inventory with auto-alerts for low stock
✅ Staff scheduling & tip management
✅ Multi-branch support
✅ Real-time sales dashboards
✅ Customer loyalty programs

Used by Totot Traditional Restaurant, Cremino Cafe & more! Contact us for a live demo.$txt$),

('gym', 3, ARRAY['gym','fitness','member','workout'],
$txt$💪 **GYM Management Software:**

✅ Member registration & profile management
✅ Membership plans & auto-billing
✅ Class/session scheduling
✅ Trainer assignment & tracking
✅ Attendance tracking (biometric/card/QR)
✅ Equipment maintenance logs
✅ Revenue & membership analytics
✅ Mobile app for members
✅ Automated renewal reminders

Powering Africa Gym, Sawim Gym & more! Ask us for a free trial.$txt$),

('hrms', 4, ARRAY['hr','hrms','payroll','employee','attendance','leave'],
$txt$👥 **HRMS - Human Resource Management:**

✅ Employee database & profiles
✅ Payroll processing with tax calculations
✅ Attendance & time tracking
✅ Leave management & approvals
✅ Performance review system
✅ Recruitment & onboarding workflow
✅ Employee self-service portal
✅ Training & development tracking
✅ Compliance & document management

Customized for Ethiopian labor laws & regulations!$txt$),

('inventory', 5, ARRAY['inventory','stock','warehouse','supply'],
$txt$📦 **Inventory Management System:**

✅ Real-time stock levels across locations
✅ Multi-warehouse management
✅ Barcode & QR code scanning
✅ Auto-reorder when stock is low
✅ Supplier management & purchase orders
✅ Batch tracking & expiry management
✅ Stock transfer between branches
✅ Comprehensive reports & analytics
✅ Integration with POS & accounting

Perfect for retail, F&B, healthcare & more!$txt$),

('boutique', 6, ARRAY['boutique','shop','retail','store','fashion'],
$txt$👗 **Boutique & Shop Management:**

✅ Smart POS with barcode scanning
✅ Product catalog with size/color variants
✅ Customer profiles & purchase history
✅ Loyalty programs & gift cards
✅ Sales & profit analytics
✅ Multi-branch inventory sync
✅ Supplier & purchase management
✅ Discount & promotion management
✅ Employee sales tracking

Trusted by 4U Style and other leading retailers!$txt$),

('compound', 7, ARRAY['compound','property','rent','tenant','building'],
$txt$🏗️ **Compound & Property Management:**

✅ Tenant registration & agreements
✅ Automated rent collection & reminders
✅ Maintenance request tracking
✅ Facility & amenity booking
✅ Utility billing & management
✅ Financial reporting & statements
✅ Tenant communication portal
✅ Security & access management
✅ Multi-property dashboard

Ideal for residential compounds, commercial buildings & mixed-use properties!$txt$),

('mobile', 8, ARRAY['mobile','app','ios','android'],
$txt$📱 **Mobile App Development:**

We build native & cross-platform mobile apps:

• **Business Apps** — ERP mobile companions, field service apps
• **Consumer Apps** — E-commerce, food delivery, ride-sharing
• **Healthcare Apps** — Patient portals, telemedicine
• **Fintech Apps** — Digital payments, mobile banking

**Tech Stack:** React Native, Flutter, Swift, Kotlin
**Includes:** UI/UX design, development, testing, deployment & maintenance

All our ERP systems come with companion mobile apps!$txt$),

('web', 9, ARRAY['web','website','portal','development'],
$txt$🌐 **Web Development Services:**

• Corporate websites & landing pages
• E-commerce platforms
• Customer & admin portals
• Progressive Web Apps (PWA)
• API development & integration

**Tech Stack:** React, Next.js, Node.js, PostgreSQL, Cloud hosting
**Includes:** Responsive design, SEO optimization, analytics integration

We build fast, secure, and scalable web solutions!$txt$),

('pricing', 10, ARRAY['price','pricing','cost','how much','budget','quote','payment'],
$txt$💰 **Our Pricing:**

We offer flexible pricing models:

• **Starter Package** — For small businesses, single-module ERP
• **Growth Package** — Multi-module with customization
• **Enterprise Package** — Full suite with premium support

**Payment Options:**
• Monthly subscription
• Annual (save 20%)
• One-time license

Pricing depends on modules, users, and customization needs. Contact us for a **free consultation & custom quote** at info@clickaddiserp.com or call +251 983412728.$txt$),

('location', 11, ARRAY['location','address','office','where','visit','find'],
$txt$📍 **Our Office:**

🏢 Omega Tower, 8th Floor
📌 Kazanchis, Addis Ababa, Ethiopia

🕐 **Hours:** Mon - Fri, 8:30 AM - 5:30 PM EAT
📞 **Phone:** +251 983412728
📧 **Email:** info@clickaddiserp.com

We're located in the heart of Addis Ababa's business district. Walk-ins are welcome during business hours!$txt$),

('contact', 12, ARRAY['contact','reach','call','phone','email'],
$txt$📞 **Contact Us:**

📧 Email: info@clickaddiserp.com
📞 Phone: +251 983412728
📍 Office: Omega Tower, 8th Floor, Kazanchis
🕐 Hours: Mon-Fri, 8:30 AM - 5:30 PM

**Other channels:**
• Facebook: /ClickAddis
• Telegram: @ClickAddis
• LinkedIn: /company/clickaddis

Or fill out the contact form on our website — we respond within 24 hours!$txt$),

('greeting', 13, ARRAY['hello','hi','hey','greetings','good morning','good afternoon'],
$txt$Hello! 👋 Welcome to **ClickAddis**!

I can help you with:
• 🏢 Our ERP products (Restaurant, Gym, HRMS, Inventory...)
• 📱 Mobile & web development
• 💰 Pricing & packages
• 📍 Office location & hours
• 📞 Contact information
• 🎯 Demo scheduling

What would you like to know?$txt$),

('help', 14, ARRAY['help','what can you','options','menu'],
$txt$I can help you with:

🏢 **Products** — Ask about any of our 8+ ERP solutions
📱 **Services** — Mobile apps, web dev, IT consulting
💰 **Pricing** — Packages & payment options
📍 **Location** — Office address & working hours
📞 **Contact** — Phone, email, social media
🎯 **Demo** — Schedule a free product demo
🏆 **Clients** — See who trusts us

Just type your question!$txt$),

('demo', 15, ARRAY['demo','trial','test','try'],
$txt$🎯 **Schedule a Free Demo:**

We offer personalized live demos for all our products:

1. **Choose your product** — Restaurant, Gym, HRMS, Inventory, etc.
2. **Pick a time** — We'll accommodate your schedule
3. **Live walkthrough** — See the system with your actual use cases

**Book now:**
📧 info@clickaddiserp.com
📞 +251 983412728

No commitment required — see the system in action before you decide!$txt$),

('support', 16, ARRAY['support','maintenance','issue','bug','problem'],
$txt$🛠️ **Support & Maintenance:**

• **Business Hours Support** — Mon-Fri, 8:30 AM - 5:30 PM
• **Priority Support** — Available for enterprise clients
• **Regular Updates** — Bug fixes, security patches, new features
• **Training** — On-site and remote training for your team
• **Dedicated Account Manager** — For enterprise plans

📧 support@clickaddis.com
📞 +251 983412728$txt$),

('clients', 17, ARRAY['client','customer','who','portfolio','reference'],
$txt$🏆 **Our Trusted Clients:**

🍽️ Totot Traditional Restaurant
💪 Africa Gym
🏋️ Sawim Gym
🥤 Juice Plus
🏥 Tasma Hospital
👗 4U Style
📱 Amen Mobile
☕ Cremino Cafe

...and **20+ more satisfied businesses** across Ethiopia!

Want to hear directly from them? We can connect you with references!$txt$),

('about', 18, ARRAY['about','company','who are','team','history'],
$txt$🏢 **About ClickAddis:**

ClickAddis IT Solution PLC is a premier software development company based in Addis Ababa.

📊 **By the Numbers:**
• 20+ Happy Clients
• 30+ Projects Delivered
• 8+ ERP Products
• 5+ Years Experience

🎯 **Our Mission:** Empowering Ethiopian businesses through cutting-edge technology
💡 **Our Vision:** To be East Africa's #1 technology solutions provider

We build what people can really use!$txt$),

('consulting', 19, ARRAY['consulting','consult','advice','strategy'],
$txt$🎯 **IT Consulting Services:**

• Digital transformation strategy
• Technology stack assessment
• System architecture design
• Process automation consulting
• Cloud migration planning
• Security auditing
• IT infrastructure optimization

Our consultants have experience across healthcare, hospitality, retail, and fitness industries. Book a consultation at info@clickaddiserp.com!$txt$),

('thanks', 20, ARRAY['thank','thanks','great','awesome','cool','perfect'],
$txt$You're welcome! 😊 Glad I could help!

If you need anything else, just ask. We're here to help you find the perfect solution for your business.

🌟 **Quick actions:**
• Type "demo" to schedule a demo
• Type "pricing" for package details
• Type "contact" to reach our team$txt$)
ON CONFLICT (slug) DO NOTHING;

-- 5.12 contact_messages --------------------------------------------------------
-- Not displayed on the site. Uncomment to get sample rows for testing an
-- admin inbox.
-- INSERT INTO public.contact_messages (full_name, email, message, status) VALUES
--   ('Test User',  'test.user@example.com',  'Hello, I would like a demo of the Restaurant Management system.', 'new'),
--   ('Jane Doe',   'jane.doe@example.com',   'Can you share pricing for the HRMS module for 50 employees?',      'read');

COMMIT;

-- =============================================================================
-- Quick verification (optional)
-- =============================================================================
-- SELECT 'site_stats' AS t, count(*) FROM site_stats
-- UNION ALL SELECT 'company_values', count(*) FROM company_values
-- UNION ALL SELECT 'services',       count(*) FROM services
-- UNION ALL SELECT 'solutions',      count(*) FROM solutions
-- UNION ALL SELECT 'customers',      count(*) FROM customers
-- UNION ALL SELECT 'testimonials',   count(*) FROM testimonials
-- UNION ALL SELECT 'team_members',   count(*) FROM team_members
-- UNION ALL SELECT 'social_links',   count(*) FROM social_links
-- UNION ALL SELECT 'chat_faqs',      count(*) FROM chat_faqs
-- UNION ALL SELECT 'chat_quick_actions', count(*) FROM chat_quick_actions;
-- Expected: 4, 4, 6, 8, 8, 6, 5, 6, 20, 4
