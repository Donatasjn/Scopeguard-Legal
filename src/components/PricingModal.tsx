import React, { useEffect, useState } from 'react';
import {
  Check,
  Code2,
  Copy,
  CreditCard,
  Database,
  ExternalLink,
  Loader2,
  Lock,
  ShieldCheck,
  Sparkles,
  Webhook,
  X,
} from 'lucide-react';
import { useI18n } from '../lib/i18n';
import {
  CREATE_CHECKOUT_API_URL,
  PAYMENT_WEBHOOK_API_URL,
  SUPABASE_PAYMENTS_SQL_SCRIPT,
  YOOKASSA_TARIFF_PRICES_RUB,
  createYooKassaCheckoutSession,
  type PaidTariffId,
} from '../lib/payments';
import { type UserProfile } from '../lib/supabase';
import {
  CURRENCY_CONFIGS,
  formatQuotaBadgeText,
  getPaymentMethodsForCurrency,
  getPlanPriceDisplay,
  type CurrencyCode,
  type FreemiumState,
  type SubscriptionTier,
} from '../utils/scopeAnalyzer';

interface PricingModalProps {
  isOpen: boolean;
  inlineMode?: boolean;
  onClose: () => void;
  currentTier: SubscriptionTier;
  freemiumState?: FreemiumState;
  currentUser?: UserProfile | null;
  currency: CurrencyCode;
  onChangeCurrency: (currency: CurrencyCode) => void;
  quotaExhaustedReason: boolean;
  initialAgencyBrand: string;
  onCompleteUpgrade: (
    tier: 'freelance' | 'agency',
    customAgencyBrand?: string
  ) => void;
  onResetDemoQuota: () => void;
}

const CURRENCY_ORDER: CurrencyCode[] = [
  'RUB',
  'USD',
  'EUR',
  'KZT',
  'CNY',
  'BYN',
  'GBP',
  'AED',
  'JPY',
];

export const PricingModal: React.FC<PricingModalProps> = ({
  isOpen,
  inlineMode = false,
  onClose,
  currentTier,
  freemiumState,
  currentUser = null,
  currency,
  onChangeCurrency,
  quotaExhaustedReason,
  initialAgencyBrand,
  onCompleteUpgrade,
  onResetDemoQuota,
}) => {
  const { lang } = useI18n();
  const isRuOrKk = lang === 'ru' || lang === 'kk';
  const perMonthLabel = isRuOrKk ? '/ мес' : '/ mo';

  const [selectedPlan, setSelectedPlan] = useState<'freelance' | 'agency' | null>(
    null
  );
  const [creatingCheckoutFor, setCreatingCheckoutFor] =
    useState<PaidTariffId | null>(null);
  const [lastOrderId, setLastOrderId] = useState<string | null>(null);
  const [gatewayDiagnosticMessage, setGatewayDiagnosticMessage] = useState<
    string | null
  >(null);
  const [showInfraDocs, setShowInfraDocs] = useState<boolean>(false);
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);

  const availableMethods = getPaymentMethodsForCurrency(currency);
  const [selectedMethod, setSelectedMethod] = useState<string>(
    availableMethods[0]
  );

  // Sync payment method when currency changes
  useEffect(() => {
    const methods = getPaymentMethodsForCurrency(currency);
    if (!methods.includes(selectedMethod)) {
      setSelectedMethod(methods[0]);
    }
  }, [currency, selectedMethod]);

  const [cardNumber, setCardNumber] = useState('4276 3800 9142 8819');
  const [cardExpiry, setCardExpiry] = useState('09/28');
  const [cardCvc, setCardCvc] = useState('412');
  const [cardHolder, setCardHolder] = useState('VICTOR SMIRNOV');
  const [payerAccount, setPayerAccount] = useState('@pm_legal_agency');
  const [agencyBrand, setAgencyBrand] = useState(initialAgencyBrand);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen && !inlineMode) return null;

  const starterPrice = getPlanPriceDisplay('starter', currency);
  const freelancePrice = getPlanPriceDisplay('freelance', currency);
  const agencyPrice = getPlanPriceDisplay('agency', currency);
  const activePlanPrice =
    selectedPlan === 'freelance' ? freelancePrice : agencyPrice;

  const activeMethod = availableMethods.includes(selectedMethod)
    ? selectedMethod
    : availableMethods[0];

  const isCardLikeMethod =
    activeMethod.includes('Карта') || activeMethod.includes('Stripe');

  /**
   * Обработчик кнопок "Перейти на Freelance" (1 000 ₽) и "Перейти на Pro" (2 500 ₽):
   * 1. Выставляет состояние лоадера "Создание защищенного платежа..."
   * 2. Отправляет POST-запрос на Supabase Edge Function `create-checkout`
   * 3. При получении `payment_url` / `confirmation_url` выполняет редирект `window.location.href`
   */
  const handleInitiateYooKassaPayment = async (
    paidTier: PaidTariffId,
    uiTier: 'freelance' | 'agency'
  ) => {
    setCheckoutError(null);
    setGatewayDiagnosticMessage(null);
    setCreatingCheckoutFor(paidTier);

    // Ensure readable spinner visibility during network request
    const minWaitPromise = new Promise((resolve) => setTimeout(resolve, 420));

    try {
      const [checkoutRes] = await Promise.all([
        createYooKassaCheckoutSession({
          planId: paidTier,
          user: currentUser,
          agencyBrandName: agencyBrand,
        }),
        minWaitPromise,
      ]);

      setLastOrderId(checkoutRes.orderId);

      if (checkoutRes.ok && checkoutRes.paymentUrl) {
        window.location.href = checkoutRes.paymentUrl;
        return;
      }

      // If Edge Function is not yet deployed or YooKassa secrets are not yet configured,
      // open the interactive YooKassa checkout confirmation screen with diagnostics
      setSelectedPlan(uiTier);
      if (checkoutRes.errorMessage) {
        setGatewayDiagnosticMessage(checkoutRes.errorMessage);
      }
    } finally {
      setCreatingCheckoutFor(null);
    }
  };

  const handleCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan) return;

    if (isCardLikeMethod) {
      const digits = cardNumber.replace(/\D/g, '');
      if (
        digits.length < 12 ||
        !cardExpiry.trim() ||
        cardCvc.trim().length < 3
      ) {
        setCheckoutError(
          'Проверьте реквизиты карты (номер, срок действия и CVC-код).'
        );
        return;
      }
    } else {
      if (!payerAccount.trim()) {
        setCheckoutError(
          'Укажите идентификатор плательщика или телефон для подтверждения.'
        );
        return;
      }
    }

    setCheckoutError(null);
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      onCompleteUpgrade(selectedPlan, agencyBrand);
      setSelectedPlan(null);
    }, 250);
  };

  const handleCopyText = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedSnippet(key);
      setTimeout(() => setCopiedSnippet(null), 2200);
    } catch {
      // ignore clipboard errors
    }
  };

  const innerContent = (
    <div
      data-testid="pricing-modal"
      onClick={(e) => e.stopPropagation()}
      className={
        inlineMode
          ? 'glass-card rounded-3xl p-6 sm:p-8 animate-tab-fade'
          : 'bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 rounded-3xl max-w-6xl w-full p-6 sm:p-8 shadow-2xl my-8 animate-modal-content'
      }
    >
      {/* Header with Instant Multi-Currency Switcher */}
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 pb-5 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          {quotaExhaustedReason && (
            <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 mb-1">
              Лимит бесплатных проверок (2/2) исчерпан — выберите тариф для снятия ограничений
            </p>
          )}
          <div className="inline-flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60">
              <Lock className="w-3 h-3" />
              <span>Шлюз ЮKassa REST API v3 · СБП · Карты РФ и мира</span>
            </span>
          </div>
          <h2
            id="pricing-modal-title"
            className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white"
          >
            {selectedPlan
              ? `Защищенная оплата ЮKassa: тариф ${
                  selectedPlan === 'freelance'
                    ? `Freelance (${freelancePrice}${perMonthLabel})`
                    : `Pro / Studio (${agencyPrice}${perMonthLabel})`
                }`
              : 'Тарифные планы ScopeGuard Legal'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {selectedPlan
              ? `Заказ ${lastOrderId || 'sg_checkout'} · Автоматическое продление +30 дней через Webhook ЮKassa.`
              : freemiumState
              ? `${formatQuotaBadgeText(freemiumState)} · Окупается с первого согласованного Change Order.`
              : 'Окупается с первого же согласованного дополнительного соглашения (Change Order).'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {/* 9-Currency Pill Switcher */}
          <div
            role="group"
            aria-label="Валюта тарифов"
            data-testid="pricing-currency-switcher"
            className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200/70 dark:border-slate-700"
          >
            {CURRENCY_ORDER.map((code) => (
              <button
                key={code}
                type="button"
                data-testid={`pricing-currency-btn-${code}`}
                onClick={() => onChangeCurrency(code)}
                className={`min-h-[32px] px-2.5 py-1 text-xs font-mono font-bold rounded-xl transition-all cursor-pointer ${
                  currency === code
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {CURRENCY_CONFIGS[code].label}
              </button>
            ))}
          </div>

          {!inlineMode && (
            <button
              type="button"
              onClick={() => {
                setSelectedPlan(null);
                onClose();
              }}
              aria-label="Закрыть окно тарифов"
              className="min-h-[38px] min-w-[38px] inline-flex items-center justify-center p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Prominent Loading Banner while calling Edge Function create-checkout */}
      {creatingCheckoutFor && (
        <div
          role="status"
          aria-live="polite"
          data-testid="checkout-loading-banner"
          className="mt-5 p-4 rounded-2xl bg-indigo-50/90 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center justify-between gap-3 animate-fade-up"
        >
          <div className="flex items-center gap-3">
            <Loader2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400 animate-spin shrink-0" />
            <div>
              <div className="text-xs sm:text-sm font-bold text-indigo-950 dark:text-indigo-100">
                Создание защищенного платежа...
              </div>
              <div className="text-[11px] font-mono text-indigo-700 dark:text-indigo-300">
                POST {CREATE_CHECKOUT_API_URL} · Тариф{' '}
                {creatingCheckoutFor === 'freelance'
                  ? 'Freelance (1 000 ₽)'
                  : 'Pro / Studio (2 500 ₽)'}
              </div>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white text-[11px] font-mono font-bold">
            ЮKassa SSL
          </span>
        </div>
      )}

      {/* Step 1: 3-Tier Plan Selection Grid (Starter, Freelance, Pro / Studio) */}
      {!selectedPlan ? (
        <div className="mt-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
            {/* Tier 1: Starter (Бесплатный) */}
            <div
              data-testid="plan-card-starter"
              className="border border-slate-200 dark:border-slate-800 rounded-3xl p-6 flex flex-col justify-between bg-slate-50/70 dark:bg-slate-800/30"
            >
              <div>
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    Starter (Бесплатный)
                  </h3>
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    Старт за 30 секунд
                  </span>
                </div>

                <div className="mt-4 flex items-baseline gap-1.5 font-mono tabular-nums">
                  <span
                    data-testid="price-starter"
                    className="text-3xl font-extrabold text-slate-900 dark:text-white"
                  >
                    {starterPrice}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {perMonthLabel}
                  </span>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">
                  2 полных аудита в подарок для проверки ТЗ и записи созвона на реальном проекте.
                </p>

                <ul className="mt-5 space-y-2.5 text-xs text-slate-700 dark:text-slate-300">
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                    <span>
                      <strong>2 полных аудита в подарок</strong> (сверка ТЗ и стенограммы)
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                    <span>
                      <strong>Детектор Scope Creep</strong> с точными цитатами и таймкодами
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                    <span>
                      <strong>Дипломатичное письмо</strong> и черновик Change Order
                    </span>
                  </li>
                </ul>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full min-h-[44px] py-2.5 px-5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-2xl transition-colors cursor-pointer"
                >
                  {currentTier === 'free'
                    ? 'Текущий план (Starter — 2 аудита)'
                    : 'Базовый пакет включен'}
                </button>
              </div>
            </div>

            {/* Tier 2: Freelance (1 000 ₽ / $11 / 10 € / 5 200 ₸ / 80 ¥) */}
            <div
              data-testid="plan-card-freelance"
              className="border border-indigo-200 dark:border-indigo-900/70 rounded-3xl p-6 flex flex-col justify-between bg-slate-50/90 dark:bg-slate-800/50"
            >
              <div>
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    Freelance
                  </h3>
                  <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                    Для ПМ и фрилансеров
                  </span>
                </div>

                <div className="mt-4 flex items-baseline gap-1.5 font-mono tabular-nums">
                  <span
                    data-testid="price-freelance"
                    className="text-3xl font-extrabold text-slate-900 dark:text-white"
                  >
                    {freelancePrice}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {perMonthLabel}
                  </span>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">
                  До 25 аудитов в месяц, экспорт PDF, шаблоны писем и базовая кастомизация.
                </p>

                <ul className="mt-5 space-y-2.5 text-xs text-slate-700 dark:text-slate-300">
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                    <span>
                      <strong>До 25 аудитов в месяц</strong> (ТЗ, договоры, аудио и стенограммы)
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                    <span>
                      <strong>Экспорт PDF и Word (.doc)</strong> официального листа Change Order
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                    <span>
                      <strong>Шаблоны писем клиенту</strong> и базовая кастомизация ставки ({CURRENCY_CONFIGS[currency].symbol}/ч)
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                    <span>
                      Шлюз ЮKassa: {availableMethods.join(' · ')}
                    </span>
                  </li>
                </ul>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  data-testid="select-freelance-btn"
                  disabled={creatingCheckoutFor !== null}
                  onClick={() =>
                    handleInitiateYooKassaPayment('freelance', 'freelance')
                  }
                  className="w-full min-h-[44px] inline-flex items-center justify-center gap-2 py-2.5 px-5 text-xs font-bold text-white bg-slate-900 dark:bg-indigo-600 hover:bg-indigo-600 dark:hover:bg-indigo-500 rounded-2xl transition-colors cursor-pointer disabled:opacity-70"
                >
                  {creatingCheckoutFor === 'freelance' ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                      <span>Создание защищенного платежа...</span>
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-3.5 h-3.5 shrink-0" />
                      <span>
                        Перейти на Freelance ({freelancePrice}
                        {perMonthLabel})
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Tier 3: Pro / Studio (Агентство) (2 500 ₽ / $27 / 25 € / 13 000 ₸ / 200 ¥) */}
            <div
              data-testid="plan-card-agency"
              className="border-2 border-indigo-600 dark:border-indigo-500 rounded-3xl p-6 flex flex-col justify-between bg-white dark:bg-slate-900 shadow-lg relative overflow-hidden"
            >
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -right-10 -top-10 w-32 h-32 rounded-full bg-indigo-500/10 blur-2xl"
              />
              <div className="relative">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    Pro / Studio (Агентство)
                  </h3>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-600 text-white">
                    <Sparkles className="w-3 h-3" />
                    <span>Хит для студий</span>
                  </span>
                </div>

                <div className="mt-4 flex items-baseline gap-1.5 font-mono tabular-nums">
                  <span
                    data-testid="price-agency"
                    className="text-3xl font-extrabold text-slate-900 dark:text-white"
                  >
                    {agencyPrice}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {perMonthLabel}
                  </span>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">
                  Безлимитные аудиты, командный доступ, приоритетная модель ИИ и кастомные бланки Change Order.
                </p>

                <ul className="mt-5 space-y-2.5 text-xs text-slate-700 dark:text-slate-300">
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <span>
                      <strong>Безлимитные аудиты</strong> ТЗ, договоров, брифов и созвонов
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <span>
                      <strong>Кастомные бланки Change Order</strong> (White-Label бренд и реквизиты студии)
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <span>
                      <strong>Командный доступ</strong> и приоритетная модель ИИ
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <span>
                      Шлюз ЮKassa: {availableMethods.join(' · ')}
                    </span>
                  </li>
                </ul>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800 relative">
                <button
                  type="button"
                  data-testid="select-agency-btn"
                  disabled={creatingCheckoutFor !== null}
                  onClick={() => handleInitiateYooKassaPayment('pro', 'agency')}
                  className="w-full min-h-[44px] inline-flex items-center justify-center gap-2 py-2.5 px-5 text-xs font-bold text-white bg-gradient-to-r from-indigo-600 via-violet-600 to-emerald-500 hover:from-indigo-500 hover:to-emerald-400 rounded-2xl shadow-sm transition-all active:scale-95 cursor-pointer disabled:opacity-70"
                >
                  {creatingCheckoutFor === 'pro' ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                      <span>Создание защищенного платежа...</span>
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-3.5 h-3.5 shrink-0" />
                      <span>
                        Перейти на Pro ({agencyPrice}
                        {perMonthLabel})
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Infrastructure & SQL / Edge Function Inspector Toggle */}
          <div className="rounded-2xl bg-slate-50/90 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-200">
                <Database className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>
                  Платежная инфраструктура ЮKassa REST API v3 + Supabase Edge Functions (`create-checkout` & `payment-webhook`)
                </span>
              </div>
              <button
                type="button"
                data-testid="toggle-payment-infra-btn"
                onClick={() => setShowInfraDocs((prev) => !prev)}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                {showInfraDocs
                  ? 'Скрыть SQL и эндпоинты'
                  : 'Показать SQL-скрипт и Webhook URL'}
              </button>
            </div>

            {showInfraDocs && (
              <div
                data-testid="payment-infra-details"
                className="pt-3 border-t border-slate-200/70 dark:border-slate-700/70 space-y-3 text-xs"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 space-y-1">
                    <div className="flex items-center gap-1.5 font-semibold text-indigo-600 dark:text-indigo-400">
                      <Code2 className="w-3.5 h-3.5" />
                      <span>Edge Function 1: Создание платежа</span>
                    </div>
                    <div className="font-mono text-[11px] text-slate-700 dark:text-slate-300 break-all">
                      POST {CREATE_CHECKOUT_API_URL}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Файл: <code>supabase/functions/create-checkout/index.ts</code>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 space-y-1">
                    <div className="flex items-center gap-1.5 font-semibold text-emerald-600 dark:text-emerald-400">
                      <Webhook className="w-3.5 h-3.5" />
                      <span>Edge Function 2: Webhook ЮKassa (payment.succeeded)</span>
                    </div>
                    <div className="font-mono text-[11px] text-slate-700 dark:text-slate-300 break-all">
                      POST {PAYMENT_WEBHOOK_API_URL}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Файл: <code>supabase/functions/payment-webhook/index.ts</code> (+30 дней к подписке)
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 text-slate-100 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[11px] text-emerald-400">
                      supabase/migrations/20261112_yookassa_payments.sql
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        handleCopyText('sql', SUPABASE_PAYMENTS_SQL_SCRIPT)
                      }
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[11px] font-semibold text-white cursor-pointer"
                    >
                      <Copy className="w-3 h-3" />
                      <span>
                        {copiedSnippet === 'sql'
                          ? 'SQL скопирован!'
                          : 'Копировать SQL'}
                      </span>
                    </button>
                  </div>
                  <pre className="text-[11px] font-mono text-slate-300 overflow-x-auto max-h-40 custom-scrollbar">
                    {SUPABASE_PAYMENTS_SQL_SCRIPT}
                  </pre>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-4 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
            <span>
              Текущий статус:{' '}
              {currentTier === 'free'
                ? `Starter (${starterPrice}${perMonthLabel} — 2 аудита в подарок)`
                : currentTier === 'freelance'
                ? `Freelance (${freelancePrice}${perMonthLabel} — 25 аудитов)`
                : `Pro / Studio (${agencyPrice}${perMonthLabel} — Безлимит)`}{' '}
              · Валюта: {CURRENCY_CONFIGS[currency].label}
            </span>
            <button
              type="button"
              onClick={onResetDemoQuota}
              className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white underline cursor-pointer text-left sm:text-right"
            >
              Сбросить демо-счетчик до 2/2 бесплатных проверок
            </button>
          </div>
        </div>
      ) : (
        /* Step 2: Interactive YooKassa Checkout Confirmation & Gateway Redirect */
        <form onSubmit={handleCheckoutSubmit} className="mt-6 space-y-5">
          {gatewayDiagnosticMessage && (
            <div
              data-testid="yookassa-gateway-notice"
              className="p-4 rounded-2xl bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 space-y-2 text-xs"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-amber-900 dark:text-amber-200">
                  Шлюз ЮKassa (REST API v3) · Заказ {lastOrderId || 'sg_order'}
                </span>
                <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-800 dark:text-amber-300">
                  {selectedPlan === 'freelance' ? '1 000.00 RUB' : '2 500.00 RUB'}
                </span>
              </div>
              <p className="text-amber-800 dark:text-amber-300 leading-relaxed">
                Запрос к Edge Function <code>create-checkout</code> выполнен ({gatewayDiagnosticMessage}). Ниже доступна форма мгновенного подтверждения платежа и тестового срабатывания Webhook <code>payment.succeeded</code> (+30 дней к <code>subscription_expires_at</code>).
              </p>
            </div>
          )}

          <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl">
            <div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Выбранный план (счет ЮKassa: {selectedPlan === 'freelance' ? `${YOOKASSA_TARIFF_PRICES_RUB.freelance.amountRub} ₽` : `${YOOKASSA_TARIFF_PRICES_RUB.pro.amountRub} ₽`})
              </div>
              <div className="text-sm font-bold text-slate-900 dark:text-white">
                Тариф{' '}
                {selectedPlan === 'freelance'
                  ? 'Freelance (до 25 аудитов/мес)'
                  : 'Pro / Studio (Агентство · Безлимит + White-Label)'}
              </div>
            </div>
            <div className="text-right">
              <div
                data-testid="checkout-total-price"
                className="text-lg font-bold font-mono tabular-nums text-slate-900 dark:text-white"
              >
                {activePlanPrice}
                {perMonthLabel}
              </div>
              <button
                type="button"
                onClick={() => setSelectedPlan(null)}
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
              >
                Изменить тариф
              </button>
            </div>
          </div>

          {/* Agency custom branding input */}
          {selectedPlan === 'agency' && (
            <div>
              <label
                htmlFor="checkout-agency-brand"
                className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1"
              >
                Название вашего агентства для шапки Change Order (White-Label логотип)
              </label>
              <input
                id="checkout-agency-brand"
                type="text"
                value={agencyBrand}
                onChange={(e) => setAgencyBrand(e.target.value)}
                placeholder="Например: Digital Legal Studio / ООО «ТехноЛаб»"
                className="w-full min-h-[44px] px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:border-indigo-500 focus:outline-none"
              />
            </div>
          )}

          {/* Dynamic Payment Methods adapted to selected Currency */}
          <div>
            <span className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Способ оплаты для валюты {CURRENCY_CONFIGS[currency].label}
            </span>
            <div
              data-testid="payment-methods-list"
              className="grid grid-cols-1 sm:grid-cols-3 gap-2.5"
            >
              {availableMethods.map((method) => {
                const active = activeMethod === method;
                return (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setSelectedMethod(method)}
                    className={`min-h-[44px] flex items-center justify-center gap-2 py-2.5 px-3 text-xs font-semibold rounded-xl border transition-colors cursor-pointer ${
                      active
                        ? 'border-indigo-600 bg-indigo-600 text-white'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700'
                    }`}
                  >
                    <CreditCard className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{method}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {isCardLikeMethod ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl">
              <div className="sm:col-span-2">
                <label
                  htmlFor="card-number-input"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                >
                  Номер карты ({activeMethod})
                </label>
                <input
                  id="card-number-input"
                  type="text"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  className="w-full min-h-[44px] px-3.5 py-2 text-xs font-mono tabular-nums bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label
                  htmlFor="card-expiry-input"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                >
                  Срок действия (MM/YY)
                </label>
                <input
                  id="card-expiry-input"
                  type="text"
                  value={cardExpiry}
                  onChange={(e) => setCardExpiry(e.target.value)}
                  className="w-full min-h-[44px] px-3.5 py-2 text-xs font-mono tabular-nums bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label
                  htmlFor="card-cvc-input"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                >
                  CVC / CVV
                </label>
                <input
                  id="card-cvc-input"
                  type="text"
                  value={cardCvc}
                  onChange={(e) => setCardCvc(e.target.value)}
                  className="w-full min-h-[44px] px-3.5 py-2 text-xs font-mono tabular-nums bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              <div className="sm:col-span-2">
                <label
                  htmlFor="card-holder-input"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                >
                  Имя владельца карты
                </label>
                <input
                  id="card-holder-input"
                  type="text"
                  value={cardHolder}
                  onChange={(e) => setCardHolder(e.target.value)}
                  className="w-full min-h-[44px] px-3.5 py-2 text-xs font-mono bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>
            </div>
          ) : (
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3">
              <label
                htmlFor="alt-payment-input"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                Платежный идентификатор / аккаунт для метода «{selectedMethod}»
              </label>
              <input
                id="alt-payment-input"
                type="text"
                value={payerAccount}
                onChange={(e) => setPayerAccount(e.target.value)}
                placeholder="Телефон, кошелек USDT/TON или @username"
                className="w-full min-h-[44px] px-3.5 py-2 text-xs font-mono bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              />
              <p className="text-xs text-slate-500 dark:text-slate-400">
                После оплаты ЮKassa отправляет уведомление <code>payment.succeeded</code> в функцию <code>payment-webhook</code>, начисляя тариф и +30 дней подписки.
              </p>
            </div>
          )}

          {checkoutError && (
            <div
              role="alert"
              className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl text-xs text-red-700 dark:text-red-300 font-medium"
            >
              {checkoutError}
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>
                Защищенный протокол ЮKassa · Начисление +30 дней подписки
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedPlan(null)}
                className="min-h-[44px] px-4 py-2.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white cursor-pointer"
              >
                Назад
              </button>
              <button
                type="button"
                onClick={() =>
                  handleInitiateYooKassaPayment(
                    selectedPlan === 'freelance' ? 'freelance' : 'pro',
                    selectedPlan
                  )
                }
                disabled={creatingCheckoutFor !== null}
                className="min-h-[44px] inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 border border-indigo-200 dark:border-indigo-800 rounded-xl transition-colors cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Повторить редирект ЮKassa</span>
              </button>
              <button
                type="submit"
                data-testid="confirm-checkout-submit-btn"
                disabled={isProcessing}
                className="min-h-[44px] px-5 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-colors cursor-pointer"
              >
                {isProcessing
                  ? 'Создание защищенного платежа...'
                  : `Оплатить ${activePlanPrice} и активировать (+30 дней)`}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );

  if (inlineMode) {
    return innerContent;
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="pricing-modal-title"
      onClick={() => {
        setSelectedPlan(null);
        onClose();
      }}
      className="fixed inset-0 z-50 flex items-start justify-center py-6 px-4 bg-slate-900/45 backdrop-blur-md overflow-y-auto animate-modal-backdrop"
    >
      {innerContent}
    </div>
  );
};
