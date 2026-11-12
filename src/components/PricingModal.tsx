import React, { useEffect, useState } from 'react';
import { Check, CreditCard, ShieldCheck, X } from 'lucide-react';
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

const CURRENCY_ORDER: CurrencyCode[] = ['USD', 'RUB', 'EUR', 'KZT'];

export const PricingModal: React.FC<PricingModalProps> = ({
  isOpen,
  inlineMode = false,
  onClose,
  currentTier,
  freemiumState,
  currency,
  onChangeCurrency,
  quotaExhaustedReason,
  initialAgencyBrand,
  onCompleteUpgrade,
  onResetDemoQuota,
}) => {
  const [selectedPlan, setSelectedPlan] = useState<'freelance' | 'agency' | null>(
    null
  );
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

  const freelancePrice = getPlanPriceDisplay('freelance', currency);
  const agencyPrice = getPlanPriceDisplay('agency', currency);
  const activePlanPrice =
    selectedPlan === 'freelance' ? freelancePrice : agencyPrice;

  const activeMethod = availableMethods.includes(selectedMethod)
    ? selectedMethod
    : availableMethods[0];

  const isCardLikeMethod =
    activeMethod.includes('Карта') || activeMethod.includes('Stripe');

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
          'Проверьте реквизиты тестовой карты (номер, срок действия и CVC-код).'
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
    }, 200);
  };

  const innerContent = (
    <div
      className={
        inlineMode
          ? 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-8'
          : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-4xl w-full p-6 sm:p-8 shadow-xl my-8'
      }
    >
      {/* Header with Currency Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-800">
        <div>
          {quotaExhaustedReason && (
            <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 mb-1">
              Лимит бесплатных проверок (2/2) исчерпан — выберите тариф для снятия ограничений
            </p>
          )}
          <h2
            id="pricing-modal-title"
            className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white"
          >
            {selectedPlan
              ? `Оформление подписки: тариф ${
                  selectedPlan === 'freelance'
                    ? `Freelance (${freelancePrice}/мес)`
                    : `Agency (${agencyPrice}/мес)`
                }`
              : 'Тарифные планы и лимиты проверок'}
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            {selectedPlan
              ? `Валюта расчетов: ${CURRENCY_CONFIGS[currency].label}. Доступны локальные способы оплаты.`
              : freemiumState
              ? `${formatQuotaBadgeText(freemiumState)} · Окупается с первого согласованного Change Order.`
              : 'Окупается с первого же согласованного дополнительного соглашения (Change Order).'}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Currency Segmented Control */}
          <div
            role="group"
            aria-label="Валюта тарифов"
            className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl"
          >
            {CURRENCY_ORDER.map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => onChangeCurrency(code)}
                className={`min-h-[36px] px-2.5 py-1 text-xs font-mono font-semibold rounded-lg transition-colors cursor-pointer ${
                  currency === code
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
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
              className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Step 1: Plan Selection Grid */}
      {!selectedPlan ? (
        <div className="mt-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
            {/* Freelance Plan */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col justify-between bg-slate-50/50 dark:bg-slate-800/40">
              <div>
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    Freelance
                  </h3>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    Для частных ПМ и фрилансеров
                  </span>
                </div>

                <div className="mt-4 flex items-baseline gap-1.5 font-mono tabular-nums">
                  <span
                    data-testid="price-freelance"
                    className="text-3xl font-bold text-slate-900 dark:text-white"
                  >
                    {freelancePrice}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    / мес
                  </span>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">
                  Оптимально для ведения 3–5 активных клиентских проектов одновременно.
                </p>

                <ul className="mt-5 space-y-2.5 text-xs text-slate-700 dark:text-slate-300">
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                    <span>
                      <strong>20 аудитов ТЗ и созвонов</strong> в месяц
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                    <span>
                      <strong>Экспорт в PDF и Word (.doc)</strong> готового листа Change Order
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                    <span>
                      <strong>Мультивалютный калькулятор ставки</strong> ({CURRENCY_CONFIGS[currency].symbol}/ч) и сдвига сроков
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                    <span>
                      Способы оплаты: {availableMethods.join(' · ')}
                    </span>
                  </li>
                </ul>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedPlan('freelance')}
                  className="w-full min-h-[44px] py-2.5 px-4 text-xs font-semibold text-white bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 dark:hover:bg-slate-600 rounded-xl transition-colors cursor-pointer"
                >
                  {currentTier === 'freelance'
                    ? 'Продлить тариф Freelance'
                    : 'Подключить тариф Freelance'}
                </button>
              </div>
            </div>

            {/* Agency Plan */}
            <div className="border-2 border-indigo-600 dark:border-indigo-500 rounded-2xl p-6 flex flex-col justify-between bg-white dark:bg-slate-900">
              <div>
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    Agency
                  </h3>
                  <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                    Для студий и IT-агентств
                  </span>
                </div>

                <div className="mt-4 flex items-baseline gap-1.5 font-mono tabular-nums">
                  <span
                    data-testid="price-agency"
                    className="text-3xl font-bold text-slate-900 dark:text-white"
                  >
                    {agencyPrice}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    / мес
                  </span>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">
                  Полная юридическая защита портфеля проектов и брендирование документов.
                </p>

                <ul className="mt-5 space-y-2.5 text-xs text-slate-700 dark:text-slate-300">
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <span>
                      <strong>Безлимитное количество аудитов</strong> ТЗ, брифов и созвонов
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <span>
                      <strong>Кастомный логотип и бренд агентства</strong> на официальном бланке Change Order
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <span>
                      <strong>Командный доступ</strong> для проджект-менеджеров и юристов
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <span>
                      Способы оплаты: {availableMethods.join(' · ')}
                    </span>
                  </li>
                </ul>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedPlan('agency')}
                  className="w-full min-h-[44px] py-2.5 px-4 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-colors cursor-pointer"
                >
                  {currentTier === 'agency'
                    ? 'Тариф Agency активен (Обновить)'
                    : 'Подключить тариф Agency'}
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-4 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
            <span>
              Текущий статус:{' '}
              {currentTier === 'free'
                ? 'Базовый (Free — 2 аудита)'
                : currentTier.toUpperCase()}{' '}
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
        /* Step 2: Interactive Currency-Adapted Checkout Simulation */
        <form onSubmit={handleCheckoutSubmit} className="mt-6 space-y-5">
          <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl">
            <div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Выбранный план
              </div>
              <div className="text-sm font-bold text-slate-900 dark:text-white">
                Тариф{' '}
                {selectedPlan === 'freelance'
                  ? 'Freelance (20 аудитов/мес)'
                  : 'Agency (Безлимит + White-Label)'}
              </div>
            </div>
            <div className="text-right">
              <div
                data-testid="checkout-total-price"
                className="text-lg font-bold font-mono tabular-nums text-slate-900 dark:text-white"
              >
                {activePlanPrice}
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
                В демо-режиме нажатие кнопки оплаты мгновенно подтверждает транзакцию по выбранному шлюзу ({selectedMethod}).
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
                Мгновенная активация тарифа без реального списания средств
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedPlan(null)}
                className="min-h-[44px] px-4 py-2.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white cursor-pointer"
              >
                Назад
              </button>
              <button
                type="submit"
                disabled={isProcessing}
                className="min-h-[44px] px-5 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-colors cursor-pointer"
              >
                {isProcessing
                  ? 'Подтверждение оплаты...'
                  : `Оплатить ${activePlanPrice} и активировать`}
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto"
    >
      {innerContent}
    </div>
  );
};
