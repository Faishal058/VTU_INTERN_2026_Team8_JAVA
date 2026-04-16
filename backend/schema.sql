-- =====================================================
-- WealthWise — Schema v3.0 (Migration-Safe)
-- Works with Spring Boot JPA backend (public.users)
-- Safe to run on existing DB — uses ALTER/IF NOT EXISTS
-- Run in psql or Supabase SQL Editor
-- =====================================================

-- ── Extensions (required before any table creation) ──
CREATE EXTENSION IF NOT EXISTS pgcrypto;   -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pg_trgm;    -- fuzzy scheme-name search

-- ═══════════════════════════════════════════════════
-- FIX: Re-point all auth.users FKs → public.users
-- Old Supabase schema used auth.users; Spring Boot
-- uses public.users. Drop old constraints, add new.
-- ═══════════════════════════════════════════════════
DO $$ BEGIN
  -- investment_plans
  ALTER TABLE public.investment_plans
    DROP CONSTRAINT IF EXISTS investment_plans_user_id_fkey;
  ALTER TABLE public.investment_plans
    DROP CONSTRAINT IF EXISTS fk_investment_plans_goal;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
  -- financial_goals
  ALTER TABLE public.financial_goals
    DROP CONSTRAINT IF EXISTS financial_goals_user_id_fkey;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
  -- user_alerts
  ALTER TABLE public.user_alerts
    DROP CONSTRAINT IF EXISTS user_alerts_user_id_fkey;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
  -- investment_transactions
  ALTER TABLE public.investment_transactions
    DROP CONSTRAINT IF EXISTS investment_transactions_user_id_fkey;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
  -- user_profiles
  ALTER TABLE public.user_profiles
    DROP CONSTRAINT IF EXISTS user_profiles_user_id_fkey;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
  -- notification_preferences
  ALTER TABLE public.notification_preferences
    DROP CONSTRAINT IF EXISTS notification_preferences_user_id_fkey;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
  -- investment_lots
  ALTER TABLE public.investment_lots
    DROP CONSTRAINT IF EXISTS investment_lots_user_id_fkey;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
  -- goal_fund_links
  ALTER TABLE public.goal_fund_links
    DROP CONSTRAINT IF EXISTS goal_fund_links_user_id_fkey;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Now re-add all FKs pointing to public.users (NOT auth.users)
DO $$ BEGIN
  ALTER TABLE public.investment_plans
    ADD CONSTRAINT investment_plans_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.financial_goals
    ADD CONSTRAINT financial_goals_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.user_alerts
    ADD CONSTRAINT user_alerts_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.investment_transactions
    ADD CONSTRAINT investment_transactions_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.user_profiles
    ADD CONSTRAINT user_profiles_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.notification_preferences
    ADD CONSTRAINT notification_preferences_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;


-- ═══════════════════════════════════════════════════
-- 0. USERS  (Spring Boot manages auth here)
-- ═══════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.users (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT        NOT NULL UNIQUE,
  password_hash TEXT        NOT NULL,
  full_name     TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add any missing columns to existing users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS phone         TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS pan           TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS risk_tolerance TEXT DEFAULT 'Moderate';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS avatar_url    TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_active     BOOLEAN DEFAULT TRUE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;

-- ═══════════════════════════════════════════════════
-- 1. USER PROFILES  (extended KYC info)
-- ═══════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID        NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  full_name           TEXT,
  phone               TEXT,
  pan                 TEXT,
  date_of_birth       DATE,
  risk_tolerance      TEXT        DEFAULT 'Moderate',
  financial_year_pref TEXT        DEFAULT 'April-March',
  currency_format     TEXT        DEFAULT 'INR_INDIAN',
  nominee_name        TEXT,
  nominee_relation    TEXT,
  avatar_url          TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- Add missing columns if table already exists from old schema
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS pan              TEXT;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS date_of_birth    DATE;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS risk_tolerance   TEXT DEFAULT 'Moderate';
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS financial_year_pref TEXT DEFAULT 'April-March';
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS currency_format  TEXT DEFAULT 'INR_INDIAN';
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS nominee_name     TEXT;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS nominee_relation TEXT;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS avatar_url       TEXT;

-- ═══════════════════════════════════════════════════
-- 2. INVESTMENT PLANS  (SIP/Lumpsum tracker)
-- ═══════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.investment_plans (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  fund_name       TEXT        NOT NULL,
  scheme_code     TEXT,
  amc             TEXT,
  category        TEXT,
  investment_mode TEXT        NOT NULL,
  amount          NUMERIC(14,2) NOT NULL,
  frequency       TEXT        DEFAULT 'Monthly',
  start_date      DATE,
  end_date        DATE,
  next_due_date   DATE,
  step_up_pct     NUMERIC(5,2) DEFAULT 0,
  note            TEXT,
  risk_profile    TEXT        DEFAULT 'Moderate',
  goal_id         UUID,
  folio_number    TEXT,
  is_paused       BOOLEAN     DEFAULT FALSE,
  is_deleted      BOOLEAN     DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Add missing columns to existing investment_plans
ALTER TABLE public.investment_plans ADD COLUMN IF NOT EXISTS scheme_code    TEXT;
ALTER TABLE public.investment_plans ADD COLUMN IF NOT EXISTS end_date       DATE;
ALTER TABLE public.investment_plans ADD COLUMN IF NOT EXISTS next_due_date  DATE;
ALTER TABLE public.investment_plans ADD COLUMN IF NOT EXISTS step_up_pct    NUMERIC(5,2) DEFAULT 0;
ALTER TABLE public.investment_plans ADD COLUMN IF NOT EXISTS folio_number   TEXT;

CREATE INDEX IF NOT EXISTS idx_plans_user ON public.investment_plans (user_id, created_at DESC);

-- ═══════════════════════════════════════════════════
-- 3. FINANCIAL GOALS  (M10)
-- ═══════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.financial_goals (
  id                        UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                   UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name                      TEXT        NOT NULL,
  category                  TEXT        DEFAULT 'Custom',
  goal_type                 TEXT        DEFAULT 'Custom',
  priority                  TEXT        DEFAULT 'Medium',
  target_amount             NUMERIC(14,2) NOT NULL,
  target_amount_today_value NUMERIC(14,2),
  invested_amount           NUMERIC(14,2) DEFAULT 0,
  current_corpus            NUMERIC(14,2) DEFAULT 0,
  monthly_need              NUMERIC(14,2) DEFAULT 0,
  required_sip              NUMERIC(14,2) DEFAULT 0,
  projected_value           NUMERIC(14,2) DEFAULT 0,
  monthly_sip_allocation    NUMERIC(14,2) DEFAULT 0,
  probability_of_success    NUMERIC(5,2)  DEFAULT 0,
  target_date               DATE          NOT NULL,
  inflation_rate            NUMERIC(5,2)  DEFAULT 6,
  expected_return           NUMERIC(5,2)  DEFAULT 12,
  status                    TEXT          DEFAULT 'Active',
  created_at                TIMESTAMPTZ   DEFAULT NOW(),
  updated_at                TIMESTAMPTZ   DEFAULT NOW()
);

-- Add missing columns to existing financial_goals table
ALTER TABLE public.financial_goals ADD COLUMN IF NOT EXISTS goal_type                 TEXT DEFAULT 'Custom';
ALTER TABLE public.financial_goals ADD COLUMN IF NOT EXISTS target_amount_today_value NUMERIC(14,2);
ALTER TABLE public.financial_goals ADD COLUMN IF NOT EXISTS current_corpus            NUMERIC(14,2) DEFAULT 0;
ALTER TABLE public.financial_goals ADD COLUMN IF NOT EXISTS required_sip              NUMERIC(14,2) DEFAULT 0;
ALTER TABLE public.financial_goals ADD COLUMN IF NOT EXISTS projected_value           NUMERIC(14,2) DEFAULT 0;
ALTER TABLE public.financial_goals ADD COLUMN IF NOT EXISTS monthly_sip_allocation    NUMERIC(14,2) DEFAULT 0;
ALTER TABLE public.financial_goals ADD COLUMN IF NOT EXISTS probability_of_success    NUMERIC(5,2)  DEFAULT 0;

-- Fix priority constraint: old had 'Essential/Important/Aspirational', new uses 'High/Medium/Low'
-- Drop old constraint if it exists, add new one
DO $$ BEGIN
  ALTER TABLE public.financial_goals DROP CONSTRAINT IF EXISTS financial_goals_priority_check;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.financial_goals DROP CONSTRAINT IF EXISTS financial_goals_status_check;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Migrate old priority values to new
UPDATE public.financial_goals SET priority = 'High'   WHERE priority = 'Essential';
UPDATE public.financial_goals SET priority = 'Medium'  WHERE priority = 'Important';
UPDATE public.financial_goals SET priority = 'Low'     WHERE priority = 'Aspirational';

-- Migrate old status values
UPDATE public.financial_goals SET status = 'Abandoned' WHERE status = 'Archived';

ALTER TABLE public.financial_goals
  ADD CONSTRAINT financial_goals_priority_check
  CHECK (priority IN ('High','Medium','Low')) NOT VALID;

ALTER TABLE public.financial_goals
  ADD CONSTRAINT financial_goals_status_check
  CHECK (status IN ('Active','Achieved','Abandoned')) NOT VALID;

CREATE INDEX IF NOT EXISTS idx_goals_user ON public.financial_goals (user_id, created_at DESC);

-- ═══════════════════════════════════════════════════
-- 4. USER ALERTS  (M18)
-- ═══════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.user_alerts (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title       TEXT        NOT NULL,
  description TEXT,
  severity    TEXT        DEFAULT 'Info' CHECK (severity IN ('Info','Watch','Action')),
  is_read     BOOLEAN     DEFAULT FALSE,
  source_type TEXT,
  source_id   UUID,
  action_url  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.user_alerts ADD COLUMN IF NOT EXISTS action_url TEXT;

CREATE INDEX IF NOT EXISTS idx_alerts_user ON public.user_alerts (user_id, is_read, created_at DESC);

-- ═══════════════════════════════════════════════════
-- 5. INVESTMENT TRANSACTIONS  (immutable ledger)
-- ═══════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.investment_transactions (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  plan_id          UUID,
  scheme_code      TEXT,
  fund_name        TEXT,
  folio_number     TEXT        DEFAULT 'DEFAULT',
  transaction_type TEXT        NOT NULL,
  amount           NUMERIC(14,4),
  nav              NUMERIC(12,6),
  units            NUMERIC(14,6),
  stamp_duty       NUMERIC(10,4) DEFAULT 0,
  exit_load        NUMERIC(10,4) DEFAULT 0,
  transaction_date DATE        NOT NULL,
  status           TEXT        DEFAULT 'Completed',
  stcg_units       NUMERIC(14,6) DEFAULT 0,
  ltcg_units       NUMERIC(14,6) DEFAULT 0,
  stcg_gain        NUMERIC(14,4) DEFAULT 0,
  ltcg_gain        NUMERIC(14,4) DEFAULT 0,
  note             TEXT,
  source           TEXT        DEFAULT 'Manual',
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Add columns missing from old schema
ALTER TABLE public.investment_transactions ADD COLUMN IF NOT EXISTS scheme_code      TEXT;
ALTER TABLE public.investment_transactions ADD COLUMN IF NOT EXISTS fund_name        TEXT;
ALTER TABLE public.investment_transactions ADD COLUMN IF NOT EXISTS folio_number     TEXT DEFAULT 'DEFAULT';
ALTER TABLE public.investment_transactions ADD COLUMN IF NOT EXISTS stamp_duty       NUMERIC(10,4) DEFAULT 0;
ALTER TABLE public.investment_transactions ADD COLUMN IF NOT EXISTS exit_load        NUMERIC(10,4) DEFAULT 0;
ALTER TABLE public.investment_transactions ADD COLUMN IF NOT EXISTS stcg_units       NUMERIC(14,6) DEFAULT 0;
ALTER TABLE public.investment_transactions ADD COLUMN IF NOT EXISTS ltcg_units       NUMERIC(14,6) DEFAULT 0;
ALTER TABLE public.investment_transactions ADD COLUMN IF NOT EXISTS stcg_gain        NUMERIC(14,4) DEFAULT 0;
ALTER TABLE public.investment_transactions ADD COLUMN IF NOT EXISTS ltcg_gain        NUMERIC(14,4) DEFAULT 0;
ALTER TABLE public.investment_transactions ADD COLUMN IF NOT EXISTS source           TEXT DEFAULT 'Manual';

-- Widen amount and nav precision (safe — widens only)
ALTER TABLE public.investment_transactions
  ALTER COLUMN amount TYPE NUMERIC(14,4),
  ALTER COLUMN nav    TYPE NUMERIC(12,6),
  ALTER COLUMN units  TYPE NUMERIC(14,6);

-- Drop old restrictive transaction_type constraint (BUY/SELL/SWITCH)
-- and replace with the full WealthWise type list
DO $$ BEGIN
  ALTER TABLE public.investment_transactions
    DROP CONSTRAINT IF EXISTS investment_transactions_transaction_type_check;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Migrate old BUY→PURCHASE_LUMPSUM, SELL→REDEMPTION, SWITCH→SWITCH_OUT
UPDATE public.investment_transactions SET transaction_type = 'PURCHASE_LUMPSUM' WHERE transaction_type = 'BUY';
UPDATE public.investment_transactions SET transaction_type = 'REDEMPTION'       WHERE transaction_type = 'SELL';
UPDATE public.investment_transactions SET transaction_type = 'SWITCH_OUT'       WHERE transaction_type = 'SWITCH';

ALTER TABLE public.investment_transactions
  ADD CONSTRAINT investment_transactions_transaction_type_check
  CHECK (transaction_type IN (
    'PURCHASE_LUMPSUM','PURCHASE_SIP','REDEMPTION',
    'SWITCH_IN','SWITCH_OUT','STP_IN','STP_OUT',
    'SWP','DIVIDEND_PAYOUT','DIVIDEND_REINVEST','REVERSAL'
  )) NOT VALID;

CREATE INDEX IF NOT EXISTS idx_tx_user_date   ON public.investment_transactions (user_id, transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_tx_scheme_user ON public.investment_transactions (scheme_code, user_id);

-- ═══════════════════════════════════════════════════
-- 6. NOTIFICATION PREFERENCES  (M19)
-- ═══════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 UUID        NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  sip_due_in_app          BOOLEAN     DEFAULT TRUE,
  sip_due_email           BOOLEAN     DEFAULT FALSE,
  goal_milestones_in_app  BOOLEAN     DEFAULT TRUE,
  goal_milestones_email   BOOLEAN     DEFAULT FALSE,
  daily_digest_email      BOOLEAN     DEFAULT FALSE,
  market_alerts_in_app    BOOLEAN     DEFAULT TRUE,
  missed_sip_alert        BOOLEAN     DEFAULT TRUE,
  tax_reminder_email      BOOLEAN     DEFAULT TRUE,
  created_at              TIMESTAMPTZ DEFAULT NOW(),
  updated_at              TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.notification_preferences ADD COLUMN IF NOT EXISTS missed_sip_alert   BOOLEAN DEFAULT TRUE;
ALTER TABLE public.notification_preferences ADD COLUMN IF NOT EXISTS tax_reminder_email  BOOLEAN DEFAULT TRUE;

-- ═══════════════════════════════════════════════════
-- 7. SCHEME MASTER  (M02 — AMFI registry, ~45k funds)
-- ═══════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.scheme_master (
  id            BIGSERIAL   PRIMARY KEY,
  amfi_code     TEXT        NOT NULL UNIQUE,
  isin_growth   TEXT,
  isin_idcw     TEXT,
  scheme_name   TEXT        NOT NULL,
  amc_name      TEXT,
  category      TEXT,
  sub_category  TEXT,
  scheme_type   TEXT,
  plan_type     TEXT,
  option_type   TEXT,
  fund_type     TEXT        DEFAULT 'OPEN_ENDED',
  risk_level    INT,
  min_lumpsum   NUMERIC(12,2),
  min_sip       NUMERIC(12,2),
  last_nav      NUMERIC(14,6),
  last_nav_date DATE,
  is_active     BOOLEAN     DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scheme_name_trgm ON public.scheme_master
  USING GIN (scheme_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_scheme_amc       ON public.scheme_master (amc_name);
CREATE INDEX IF NOT EXISTS idx_scheme_active    ON public.scheme_master (is_active, last_nav_date DESC);

-- ═══════════════════════════════════════════════════
-- 8. NAV DAILY  (M03 — historical NAV store)
-- ═══════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.nav_daily (
  id          BIGSERIAL     PRIMARY KEY,
  scheme_code TEXT          NOT NULL,
  nav_date    DATE          NOT NULL,
  nav_value   NUMERIC(14,6) NOT NULL,
  created_at  TIMESTAMPTZ   DEFAULT NOW(),
  UNIQUE (scheme_code, nav_date)
);

CREATE INDEX IF NOT EXISTS idx_nav_scheme_date ON public.nav_daily (scheme_code, nav_date DESC);

-- ═══════════════════════════════════════════════════
-- 9. INVESTMENT LOTS  (M08 — FIFO cost-basis tracking)
-- ═══════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.investment_lots (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  transaction_id    UUID        NOT NULL REFERENCES public.investment_transactions(id),
  scheme_code       TEXT        NOT NULL,
  fund_name         TEXT,
  folio_number      TEXT,
  purchase_date     DATE        NOT NULL,
  units_purchased   NUMERIC(14,6) NOT NULL,
  cost_nav          NUMERIC(14,6) NOT NULL,
  cost_per_unit     NUMERIC(14,6) NOT NULL,
  units_remaining   NUMERIC(14,6) NOT NULL,
  is_fully_redeemed BOOLEAN     DEFAULT FALSE,
  lock_in_until     DATE,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lot_user_scheme ON public.investment_lots (user_id, scheme_code, purchase_date ASC);
CREATE INDEX IF NOT EXISTS idx_lot_active      ON public.investment_lots (user_id, is_fully_redeemed, purchase_date);

-- ═══════════════════════════════════════════════════
-- 10. GOAL FUND LINKS  (M15 — link holdings to goals)
-- ═══════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.goal_fund_links (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  goal_id        UUID        NOT NULL REFERENCES public.financial_goals(id) ON DELETE CASCADE,
  scheme_code    TEXT        NOT NULL,
  fund_name      TEXT,
  folio_number   TEXT,
  allocation_pct NUMERIC(5,2) NOT NULL DEFAULT 100,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (goal_id, scheme_code, folio_number)
);

-- ═══════════════════════════════════════════════════
-- 11. AUDIT LOG  (M24 — immutable mutation trail)
-- ═══════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.audit_log (
  id          BIGSERIAL   PRIMARY KEY,
  user_id     UUID,
  action      TEXT        NOT NULL,
  entity_type TEXT,
  entity_id   TEXT,
  old_value   JSONB,
  new_value   JSONB,
  ip_address  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_user ON public.audit_log (user_id, created_at DESC);

-- ═══════════════════════════════════════════════════
-- SEED: notification preferences for existing users
-- ═══════════════════════════════════════════════════
INSERT INTO public.notification_preferences (user_id)
SELECT id FROM public.users
WHERE id NOT IN (SELECT user_id FROM public.notification_preferences)
ON CONFLICT DO NOTHING;

-- ═══════════════════════════════════════════════════
-- VERIFY
-- ═══════════════════════════════════════════════════
SELECT
  table_name,
  pg_size_pretty(pg_total_relation_size(quote_ident(table_name))) AS size
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'users','user_profiles','investment_plans','financial_goals',
    'user_alerts','investment_transactions','notification_preferences',
    'scheme_master','nav_daily','investment_lots','goal_fund_links','audit_log'
  )
ORDER BY table_name;
