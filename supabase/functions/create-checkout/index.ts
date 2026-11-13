// ============================================================================
// Supabase Edge Function: create-checkout
// Путь деплоя: supabase/functions/create-checkout/index.ts
// Назначение: Создание платежа в ЮKassa (REST API v3) для тарифов:
//   - freelance: 1 000.00 RUB
//   - pro:       2 500.00 RUB
// Возвращает confirmation_url / payment_url для редиректа пользователя.
// ============================================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface CreateCheckoutRequest {
  planId: 'freelance' | 'pro' | 'agency';
  userId?: string;
  userEmail?: string;
  returnUrl?: string;
  agencyBrandName?: string;
}

const PLAN_PRICING_RUB: Record<
  'freelance' | 'pro',
  { amount: string; tier: 'freelance' | 'pro'; description: string }
> = {
  freelance: {
    amount: '1000.00',
    tier: 'freelance',
    description:
      'Подписка ScopeGuard Legal — Тариф Freelance (до 25 аудитов в месяц)',
  },
  pro: {
    amount: '2500.00',
    tier: 'pro',
    description:
      'Подписка ScopeGuard Legal — Тариф Pro / Studio (Безлимитные аудиты)',
  },
};

Deno.serve(async (req: Request) => {
  // 1. Обработка CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method Not Allowed. Use POST.' }),
      {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  try {
    const body = (await req.json()) as CreateCheckoutRequest;
    const normalizedPlan: 'freelance' | 'pro' =
      body.planId === 'freelance' ? 'freelance' : 'pro';
    const planMeta = PLAN_PRICING_RUB[normalizedPlan];

    const userId = (body.userId || 'guest_user').trim();
    const userEmail = (body.userEmail || '').trim();
    const orderId = `sg_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;
    const idempotenceKey = crypto.randomUUID();

    const returnUrl =
      body.returnUrl ||
      `https://scopeguard.legal/?payment=success&tier=${planMeta.tier}&order_id=${orderId}`;

    // 2. Получение ключей ЮKassa из переменных окружения Supabase Secrets
    const shopId = Deno.env.get('YOOKASSA_SHOP_ID');
    const secretKey = Deno.env.get('YOOKASSA_SECRET_KEY');

    if (!shopId || !secretKey) {
      return new Response(
        JSON.stringify({
          error:
            'Не заданы секреты YOOKASSA_SHOP_ID или YOOKASSA_SECRET_KEY в Supabase Edge Functions.',
          order_id: orderId,
          tier: planMeta.tier,
          amount: planMeta.amount,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // 3. Формирование стандартного REST POST-запроса к API ЮKassa v3
    const yookassaPayload = {
      amount: {
        value: planMeta.amount,
        currency: 'RUB',
      },
      capture: true,
      confirmation: {
        type: 'redirect',
        return_url: returnUrl,
      },
      description: `${planMeta.description} (Заказ ${orderId})`,
      metadata: {
        order_id: orderId,
        user_id: userId,
        user_email: userEmail,
        subscription_tier: planMeta.tier,
        agency_brand_name: body.agencyBrandName || '',
      },
    };

    const basicAuth = btoa(`${shopId}:${secretKey}`);
    const yookassaRes = await fetch('https://api.yookassa.ru/v3/payments', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${basicAuth}`,
        'Idempotence-Key': idempotenceKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(yookassaPayload),
    });

    const yookassaData = await yookassaRes.json();

    if (!yookassaRes.ok) {
      return new Response(
        JSON.stringify({
          error:
            yookassaData?.description ||
            `Ошибка API ЮKassa: HTTP ${yookassaRes.status}`,
          details: yookassaData,
        }),
        {
          status: yookassaRes.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const paymentId: string = yookassaData.id;
    const confirmationUrl: string | undefined =
      yookassaData?.confirmation?.confirmation_url;

    // 4. Запись созданного платежа в таблицу payments_history и обновление profiles
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (supabaseUrl && supabaseServiceKey) {
      const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

      await supabaseAdmin.from('payments_history').insert({
        order_id: orderId,
        user_id: userId,
        user_email: userEmail || null,
        yookassa_payment_id: paymentId,
        subscription_tier: planMeta.tier,
        amount: Number(planMeta.amount),
        currency: 'RUB',
        status: yookassaData.status || 'pending',
        confirmation_url: confirmationUrl || null,
        metadata: yookassaPayload.metadata,
      });

      if (userId && userId !== 'guest_user') {
        await supabaseAdmin
          .from('profiles')
          .update({ yookassa_payment_id: paymentId })
          .eq('id', userId);
      }
    }

    return new Response(
      JSON.stringify({
        payment_url: confirmationUrl,
        confirmation_url: confirmationUrl,
        payment_id: paymentId,
        order_id: orderId,
        tier: planMeta.tier,
        amount: planMeta.amount,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({
        error: err instanceof Error ? err.message : 'Internal Server Error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
