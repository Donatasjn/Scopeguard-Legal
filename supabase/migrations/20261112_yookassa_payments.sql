-- ============================================================================
-- ScopeGuard Legal — Миграция БД Supabase для приема платежей ЮKassa (REST API v3)
-- Тарифы:
--   • starter   — 0 ₽ / мес (2 аудита в подарок)
--   • freelance — 1 000 ₽ / мес (до 25 аудитов в месяц)
--   • pro       — 2 500 ₽ / мес (безлимитные аудиты, 999)
-- ============================================================================

-- 1. Расширение таблицы public.profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS subscription_tier text NOT NULL DEFAULT 'starter'
    CHECK (subscription_tier IN ('starter', 'freelance', 'pro')),
  ADD COLUMN IF NOT EXISTS subscription_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS yookassa_payment_id text;

CREATE INDEX IF NOT EXISTS idx_profiles_subscription_tier
  ON public.profiles (subscription_tier);

CREATE INDEX IF NOT EXISTS idx_profiles_yookassa_payment_id
  ON public.profiles (yookassa_payment_id);

-- 2. Создание таблицы public.payments_history для хранения логов оплат
CREATE TABLE IF NOT EXISTS public.payments_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id text NOT NULL UNIQUE,
  user_id text NOT NULL,
  user_email text,
  yookassa_payment_id text,
  subscription_tier text NOT NULL
    CHECK (subscription_tier IN ('freelance', 'pro')),
  amount numeric(12, 2) NOT NULL,
  currency text NOT NULL DEFAULT 'RUB',
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'waiting_for_capture', 'succeeded', 'canceled')),
  confirmation_url text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payments_history_user_id
  ON public.payments_history (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_payments_history_yookassa_payment_id
  ON public.payments_history (yookassa_payment_id);

-- 3. Включение RLS и политик безопасности для payments_history
ALTER TABLE public.payments_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own payments history" ON public.payments_history;
CREATE POLICY "Users can view own payments history"
  ON public.payments_history
  FOR SELECT
  USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Service role can manage all payments" ON public.payments_history;
CREATE POLICY "Service role can manage all payments"
  ON public.payments_history
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
