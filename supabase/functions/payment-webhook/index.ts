// ============================================================================
// Supabase Edge Function: payment-webhook
// Путь деплоя: supabase/functions/payment-webhook/index.ts
// Назначение: Прием асинхронных HTTP-уведомлений (Webhook) от ЮKassa:
//   - Событие: payment.succeeded
//   - Обновляет статус в payments_history
//   - Через supabase-admin-client выставляет пользователю купленный тариф
//     (freelance = 25 аудитов, pro = 999 аудитов) и прибавляет +30 дней
//     к subscription_expires_at.
// ============================================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface YooKassaWebhookPayload {
  type: string;
  event: 'payment.succeeded' | 'payment.waiting_for_capture' | 'payment.canceled';
  object: {
    id: string;
    status: 'pending' | 'waiting_for_capture' | 'succeeded' | 'canceled';
    paid: boolean;
    amount: {
      value: string;
      currency: string;
    };
    metadata?: {
      order_id?: string;
      user_id?: string;
      user_email?: string;
      subscription_tier?: 'freelance' | 'pro';
      agency_brand_name?: string;
    };
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const payload = (await req.json()) as YooKassaWebhookPayload;
    const event = payload?.event;
    const paymentObj = payload?.object;

    if (!paymentObj || !paymentObj.id) {
      return new Response(
        JSON.stringify({ error: 'Invalid YooKassa webhook payload' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({
          error: 'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY',
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const paymentId = paymentObj.id;
    const orderId = paymentObj.metadata?.order_id;
    const userId = paymentObj.metadata?.user_id;
    const purchasedTier: 'freelance' | 'pro' =
      paymentObj.metadata?.subscription_tier === 'freelance'
        ? 'freelance'
        : 'pro';

    // 1. Обновляем запись в таблице payments_history
    if (orderId) {
      await supabaseAdmin
        .from('payments_history')
        .update({
          status: paymentObj.status,
          yookassa_payment_id: paymentId,
          updated_at: new Date().toISOString(),
        })
        .eq('order_id', orderId);
    } else {
      await supabaseAdmin
        .from('payments_history')
        .update({
          status: paymentObj.status,
          updated_at: new Date().toISOString(),
        })
        .eq('yookassa_payment_id', paymentId);
    }

    // 2. Если платеж успешно завершен (payment.succeeded) — активируем подписку на +30 дней
    if (event === 'payment.succeeded' && paymentObj.status === 'succeeded') {
      if (userId && userId !== 'guest_user') {
        const { data: existingProfile } = await supabaseAdmin
          .from('profiles')
          .select('id, subscription_expires_at, full_name')
          .eq('id', userId)
          .maybeSingle();

        const nowMs = Date.now();
        const currentExpMs = existingProfile?.subscription_expires_at
          ? new Date(existingProfile.subscription_expires_at).getTime()
          : 0;
        const baseMs =
          Number.isFinite(currentExpMs) && currentExpMs > nowMs
            ? currentExpMs
            : nowMs;

        const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
        const nextExpiresAt = new Date(baseMs + thirtyDaysMs).toISOString();
        const nextAuditsLimit = purchasedTier === 'freelance' ? 25 : 999;

        const updatePayload: Record<string, unknown> = {
          plan: 'pro',
          subscription_tier: purchasedTier,
          subscription_expires_at: nextExpiresAt,
          yookassa_payment_id: paymentId,
          audits_limit: nextAuditsLimit,
        };

        if (
          paymentObj.metadata?.agency_brand_name &&
          paymentObj.metadata.agency_brand_name.trim()
        ) {
          updatePayload.full_name =
            paymentObj.metadata.agency_brand_name.trim();
        }

        await supabaseAdmin
          .from('profiles')
          .update(updatePayload)
          .eq('id', userId);

        // Логируем успешное продление в activity_logs
        await supabaseAdmin.from('activity_logs').insert({
          user_id: userId,
          user_email: paymentObj.metadata?.user_email || '',
          action: `Оплата тарифа ${purchasedTier.toUpperCase()} (ЮKassa)`,
          details: `Платеж ${paymentId} на сумму ${paymentObj.amount.value} ${paymentObj.amount.currency}. Подписка продлена до ${nextExpiresAt.slice(0, 10)}.`,
        });
      }
    }

    return new Response(
      JSON.stringify({
        received: true,
        event,
        payment_id: paymentId,
        status: paymentObj.status,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({
        error: err instanceof Error ? err.message : 'Webhook handler failed',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
