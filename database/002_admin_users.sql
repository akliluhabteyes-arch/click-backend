-- =============================================================================
--  ClickAddis — Migration 002: admin accounts (superadmin / admin)
--  Run AFTER clickaddis_schema.sql, in Supabase → SQL Editor. Safe to re-run.
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 1. admin_users — username/password accounts for the Admin panel
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_users (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username             TEXT NOT NULL UNIQUE
                         CHECK (username ~ '^[a-z0-9._-]{3,50}$'),
  full_name            TEXT NOT NULL CHECK (char_length(full_name) BETWEEN 1 AND 150),
  password_hash        TEXT NOT NULL,
  role                 TEXT NOT NULL DEFAULT 'admin'
                         CHECK (role IN ('superadmin', 'admin')),
  is_active            BOOLEAN NOT NULL DEFAULT TRUE,
  last_login_at        TIMESTAMPTZ,
  password_changed_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by           UUID REFERENCES public.admin_users(id) ON DELETE SET NULL,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_users_role ON public.admin_users (role);

DROP TRIGGER IF EXISTS trg_admin_users_updated_at ON public.admin_users;
CREATE TRIGGER trg_admin_users_updated_at
  BEFORE UPDATE ON public.admin_users
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Backend-only table: RLS on, no public policies (service role bypasses RLS).
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- 2. team_members — social links shown under each team card
--    (the cards show Telegram, Instagram and Email icons)
-- -----------------------------------------------------------------------------
ALTER TABLE public.team_members ADD COLUMN IF NOT EXISTS telegram_url  TEXT;
ALTER TABLE public.team_members ADD COLUMN IF NOT EXISTS instagram_url TEXT;

-- -----------------------------------------------------------------------------
-- 3. Clean Windows line endings (\r) left by copy-pasting the first script
-- -----------------------------------------------------------------------------
UPDATE public.chat_faqs
   SET response = replace(response, E'\r', '')
 WHERE response LIKE E'%\r%';

UPDATE public.site_settings
   SET chat_welcome_message  = replace(chat_welcome_message,  E'\r', ''),
       chat_default_response = replace(chat_default_response, E'\r', '')
 WHERE chat_welcome_message LIKE E'%\r%' OR chat_default_response LIKE E'%\r%';

COMMIT;

-- Next step: create the first superadmin from the Backend folder:
--   npm run create:superadmin -- <username> <password> "<Full Name>"
