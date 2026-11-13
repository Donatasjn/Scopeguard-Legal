import { SUPABASE_URL, supabase, type UserProfile } from './supabase';

export const CREATE_CHECKOUT_API_URL = `${SUPABASE_URL}/functions/v1/create-checkout`;
export const PAYMENT_WEBHOOK_API_URL = `${SUPABASE_URL}/functions/v1/payment-webhook`;

export type PaidTariffId = 'freelance' | 'pro';

export interface PaymentHistoryRecord {
  id: string;
  order_id: string;
  user_id: string;
  user_email: string;
  yookassa_payment_id: string | null;
  subscription_tier: PaidTariffId;
  amount: number;
  currency: string;
  status: 'pending' | 'waiting_for_capture' | 'succeeded' | 'canceled';
  confirmation_url?: string | null;
  created_at: string;
}

export interface CreateCheckoutInput {
  planId: PaidTariffId;
  user: UserProfile | null;
  agencyBrandName?: string;
  returnUrl?: string;
}

export interface CreateCheckoutPayload {
  planId: PaidTariffId;
  tier: PaidTariffId;
  amountRub: number;
  userId: string;
  userEmail: string;
  orderId: string;
  returnUrl: string;
  agencyBrandName?: string;
}

export interface CreateCheckoutResponse {
  ok: boolean;
  paymentUrl: string | null;
  paymentId: string | null;
  orderId: string;
  tier: PaidTariffId;
  amountRub: number;
  errorMessage?: string;
}

const LOCAL_PAYMENTS_HISTORY_KEY = 'scopeguard_payments_history_v1';

export const YOOKASSA_TARIFF_PRICES_RUB: Record<
  PaidTariffId,
  { amountRub: number; label: string; auditsLimit: number }
> = {
  freelance: {
    amountRub: 1000,
    label: 'Freelance (1 000 ₽ / мес · до 25 аудитов)',
    auditsLimit: 25,
  },
  pro: {
    amountRub: 2500,
    label: 'Pro / Studio (2 500 ₽ / мес · Безлимит)',
    auditsLimit: 999,
  },
};

export function generateOrderId(nowMs = Date.now()): string {
  const randomSuffix = Math.random().toString(36).slice(2, 10);
  return `sg_${nowMs}_${randomSuffix}`;
}

export function calculateExtendedSubscriptionExpiry(
  currentExpiresAt: string | null | undefined,
  daysToAdd = 30,
  nowMs = Date.now()
): string {
  const parsedCurrent = currentExpiresAt
    ? new Date(currentExpiresAt).getTime()
    : 0;
  const baseMs =
    Number.isFinite(parsedCurrent) && parsedCurrent > nowMs
      ? parsedCurrent
      : nowMs;
  const addedMs = daysToAdd * 24 * 60 * 60 * 1000;
  return new Date(baseMs + addedMs).toISOString();
}

export function buildYooKassaCheckoutPayload(
  input: CreateCheckoutInput,
  nowMs = Date.now()
): CreateCheckoutPayload {
  const planId: PaidTariffId =
    input.planId === 'freelance' ? 'freelance' : 'pro';
  const tariffMeta = YOOKASSA_TARIFF_PRICES_RUB[planId];
  const orderId = generateOrderId(nowMs);
  const origin =
    typeof window !== 'undefined' && window.location?.origin
      ? window.location.origin
      : 'https://scopeguard.legal';
  const defaultReturnUrl = `${origin}/?payment=success&tier=${planId}&order_id=${orderId}`;

  return {
    planId,
    tier: planId,
    amountRub: tariffMeta.amountRub,
    userId: input.user?.id || 'guest_user',
    userEmail: input.user?.email || '',
    orderId,
    returnUrl: input.returnUrl || defaultReturnUrl,
    agencyBrandName: input.agencyBrandName?.trim() || undefined,
  };
}

export function loadLocalPaymentsHistory(): PaymentHistoryRecord[] {
  try {
    const raw = localStorage.getItem(LOCAL_PAYMENTS_HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as PaymentHistoryRecord[]) : [];
  } catch {
    return [];
  }
}

export function saveLocalPaymentRecord(record: PaymentHistoryRecord): void {
  try {
    const current = loadLocalPaymentsHistory();
    const next = [
      record,
      ...current.filter((item) => item.order_id !== record.order_id),
    ].slice(0, 50);
    localStorage.setItem(LOCAL_PAYMENTS_HISTORY_KEY, JSON.stringify(next));
  } catch {
    // ignore storage errors
  }
}

export async function createYooKassaCheckoutSession(
  input: CreateCheckoutInput
): Promise<CreateCheckoutResponse> {
  const payload = buildYooKassaCheckoutPayload(input);

  // Save initial pending payment in local history & attempt Supabase insert
  const pendingRecord: PaymentHistoryRecord = {
    id: `pay_${Date.now()}`,
    order_id: payload.orderId,
    user_id: payload.userId,
    user_email: payload.userEmail,
    yookassa_payment_id: null,
    subscription_tier: payload.planId,
    amount: payload.amountRub,
    currency: 'RUB',
    status: 'pending',
    confirmation_url: null,
    created_at: new Date().toISOString(),
  };
  saveLocalPaymentRecord(pendingRecord);

  try {
    await supabase.from('payments_history').insert({
      order_id: payload.orderId,
      user_id: payload.userId,
      user_email: payload.userEmail || null,
      subscription_tier: payload.planId,
      amount: payload.amountRub,
      currency: 'RUB',
      status: 'pending',
    });
  } catch {
    // Ignore if table is not yet migrated on remote Supabase
  }

  try {
    const response = await fetch(CREATE_CHECKOUT_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const rawText = await response.text();
    let data: Record<string, unknown> = {};
    if (rawText) {
      try {
        data = JSON.parse(rawText) as Record<string, unknown>;
      } catch {
        // non-JSON response
      }
    }

    const confirmationObj = data?.confirmation as
      | Record<string, unknown>
      | undefined;

    const paymentUrl =
      (typeof data?.payment_url === 'string' && data.payment_url) ||
      (typeof data?.confirmation_url === 'string' && data.confirmation_url) ||
      (typeof confirmationObj?.confirmation_url === 'string' &&
        confirmationObj.confirmation_url) ||
      null;

    const paymentId =
      (typeof data?.payment_id === 'string' && data.payment_id) ||
      (typeof data?.id === 'string' && data.id) ||
      null;

    if (response.ok && paymentUrl) {
      saveLocalPaymentRecord({
        ...pendingRecord,
        yookassa_payment_id: paymentId,
        confirmation_url: paymentUrl,
      });

      return {
        ok: true,
        paymentUrl,
        paymentId,
        orderId:
          typeof data?.order_id === 'string' ? data.order_id : payload.orderId,
        tier: payload.planId,
        amountRub: payload.amountRub,
      };
    }

    const remoteErr =
      (typeof data?.error === 'string' && data.error) ||
      (typeof data?.message === 'string' && data.message) ||
      `Edge Function create-checkout вернула статус ${response.status}. Проверьте деплой функции и секреты YOOKASSA_SHOP_ID / YOOKASSA_SECRET_KEY.`;

    return {
      ok: false,
      paymentUrl: null,
      paymentId,
      orderId: payload.orderId,
      tier: payload.planId,
      amountRub: payload.amountRub,
      errorMessage: remoteErr,
    };
  } catch (err) {
    return {
      ok: false,
      paymentUrl: null,
      paymentId: null,
      orderId: payload.orderId,
      tier: payload.planId,
      amountRub: payload.amountRub,
      errorMessage:
        err instanceof Error
          ? `Не удалось связаться с Edge Function create-checkout (${err.message}). Убедитесь, что функция развернута в Supabase.`
          : 'Ошибка соединения с платежным шлюзом.',
    };
  }
}

export const SUPABASE_PAYMENTS_SQL_SCRIPT = `-- Расширение таблицы profiles и создание таблицы payments_history (ЮKassa)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS subscription_tier text NOT NULL DEFAULT 'starter'
    CHECK (subscription_tier IN ('starter', 'freelance', 'pro')),
  ADD COLUMN IF NOT EXISTS subscription_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS yookassa_payment_id text;

CREATE TABLE IF NOT EXISTS public.payments_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id text NOT NULL UNIQUE,
  user_id text NOT NULL,
  user_email text,
  yookassa_payment_id text,
  subscription_tier text NOT NULL CHECK (subscription_tier IN ('freelance', 'pro')),
  amount numeric(12, 2) NOT NULL,
  currency text NOT NULL DEFAULT 'RUB',
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'waiting_for_capture', 'succeeded', 'canceled')),
  confirmation_url text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);`;
