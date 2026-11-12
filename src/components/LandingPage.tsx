import React, { useState } from 'react';
import {
  ArrowRight,
  Calculator,
  CheckCircle2,
  Clock,
  FileSearch,
  FileText,
  MailCheck,
  Mic,
  Printer,
  Scale,
  ShieldAlert,
  Sparkles,
  Wand2,
} from 'lucide-react';
import {
  convertHourlyRate,
  formatMoney,
  formatQuotaBadgeText,
  type CurrencyCode,
  type FreemiumState,
} from '../utils/scopeAnalyzer';
import { BrandLogoIcon } from './BrandLogo';

interface LandingPageProps {
  currency: CurrencyCode;
  hourlyRate: number;
  freemiumState: FreemiumState;
  onStartFreeAudit: () => void;
  onOpenSampleModal: () => void;
  onOpenHistory: () => void;
}

interface HeroShowcaseCase {
  id: string;
  tabLabel: string;
  projectTitle: string;
  contractClauseTitle: string;
  contractClauseText: string;
  callTimecode: string;
  callQuoteText: string;
  usdProtectedTotal: number;
  shiftDays: number;
  detectedItems: Array<{
    title: string;
    hours: number;
    severity: 'Критично' | 'Средний';
    clauseRef: string;
  }>;
}

const HERO_SHOWCASE_CASES: HeroShowcaseCase[] = [
  {
    id: 'b2b-erp',
    tabLabel: 'B2B-портал · +$2 400',
    projectTitle: 'Разработка B2B-портала дистрибуции «АгроСнаб»',
    contractClauseTitle: 'Договор №48/26-ИТ · Приложение №1 (ТЗ, п. 3.2)',
    contractClauseText:
      '«Обмен номенклатурой и остатками выполняется путем односторонней загрузки файла CSV/XLSX администратором портала 1 раз в сутки. Прямая интеграция с 1С:ERP в контур этапа №1 не входит».',
    callTimecode: '14:20',
    callQuoteText:
      '«Давайте вы нам сразу настроите живую двустороннюю синхронизацию с нашей 1С:ERP каждые 5 минут, плюс бота в Telegram для повтора заказов и матрицу согласования лимитов».',
    usdProtectedTotal: 2400,
    shiftDays: 9,
    detectedItems: [
      {
        title: 'Двусторонний онлайн-обмен с 1С:ERP',
        hours: 24,
        severity: 'Критично',
        clauseRef: 'Противоречит п. 3.2 ТЗ (только CSV раз в сутки)',
      },
      {
        title: 'Telegram-бот с повтором заказов',
        hours: 16,
        severity: 'Критично',
        clauseRef: 'Вне п. 4.2 ТЗ (предусмотрены только Email)',
      },
      {
        title: 'Трехуровневое согласование лимитов',
        hours: 10,
        severity: 'Средний',
        clauseRef: 'Вне п. 2.1 ТЗ (1 роль «Покупатель»)',
      },
    ],
  },
  {
    id: 'fintech-edo',
    tabLabel: 'Финтех и ЭДО · +$3 150',
    projectTitle: 'Личный кабинет лизингополучателя «ФинДрайв»',
    contractClauseTitle: 'Договор №19/26-ФТ · Спецификация (п. 2.4 и 5.1)',
    contractClauseText:
      '«Аутентификация пользователей реализуется по связке Email + SMS-код. График платежей отображается в виде чтения таблицы из API без модуля подписания УКЭП».',
    callTimecode: '09:45',
    callQuoteText:
      '«Нам к релизу обязательно нужен вход через Госуслуги (ЕСИА), подписание договоров прямо в браузере через КриптоПро УКЭП и калькулятор досрочного выкупа».',
    usdProtectedTotal: 3150,
    shiftDays: 11,
    detectedItems: [
      {
        title: 'Подписание документов УКЭП (КриптоПро)',
        hours: 28,
        severity: 'Критично',
        clauseRef: 'Противоречит п. 5.1 ТЗ (только чтение PDF)',
      },
      {
        title: 'Интеграция корпоративного SSO / ЕСИА',
        hours: 20,
        severity: 'Критично',
        clauseRef: 'Вне п. 2.4 ТЗ (только Email + SMS)',
      },
      {
        title: 'Интерактивный пересчет графика выкупа',
        hours: 15,
        severity: 'Средний',
        clauseRef: 'Новая бизнес-логика сверх сметы этапа №1',
      },
    ],
  },
  {
    id: 'edtech-lms',
    tabLabel: 'EdTech LMS · +$1 950',
    projectTitle: 'Корпоративная платформа обучения «ТехноСтарт»',
    contractClauseTitle: 'Договор №73/26-ED · Брифинг и ТЗ (п. 4.1)',
    contractClauseText:
      '«Видеоуроки размещаются через защищенный плеер Kinescope/Vimeo. Тестирование сотрудников включает одиночный и множественный выбор без прокторинга».',
    callTimecode: '21:10',
    callQuoteText:
      '«Хотим добавить ИИ-прокторинг по веб-камере во время экзамена, генерацию именных PDF-сертификатов с QR-проверкой и выгрузку отчетов в PowerBI».',
    usdProtectedTotal: 1950,
    shiftDays: 7,
    detectedItems: [
      {
        title: 'Видео-прокторинг экзаменов с детекцией',
        hours: 22,
        severity: 'Критично',
        clauseRef: 'Вне п. 4.1 ТЗ (базовые текстовые тесты)',
      },
      {
        title: 'Конструктор PDF-сертификатов с QR',
        hours: 10,
        severity: 'Средний',
        clauseRef: 'Новый микросервис генерации графики',
      },
      {
        title: 'Коннектор аналитики для PowerBI',
        hours: 8,
        severity: 'Средний',
        clauseRef: 'Вне п. 6.1 ТЗ (только экспорт таблицы в CSV)',
      },
    ],
  },
];

export const LandingPage: React.FC<LandingPageProps> = ({
  currency,
  freemiumState,
  onStartFreeAudit,
  onOpenSampleModal,
  onOpenHistory,
}) => {
  const [activeCaseIdx, setActiveCaseIdx] = useState(0);
  const currentCase =
    HERO_SHOWCASE_CASES[activeCaseIdx] ?? HERO_SHOWCASE_CASES[0];

  const totalCaseHours = currentCase.detectedItems.reduce(
    (acc, item) => acc + item.hours,
    0
  );

  // Convert showcase USD amount to selected currency if needed
  const showcaseDisplayAmount =
    currency === 'USD'
      ? `+$${currentCase.usdProtectedTotal.toLocaleString('ru-RU')}`
      : `+${formatMoney(
          totalCaseHours * convertHourlyRate(4500, 'RUB', currency),
          currency
        )}`;

  const quotaBadge = formatQuotaBadgeText(freemiumState);

  return (
    <div
      data-testid="landing-page"
      className="relative overflow-hidden rounded-[36px] bg-white dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800/80 shadow-[0_8px_40px_-12px_rgba(15,23,42,0.06)] animate-tab-fade"
    >
      {/* GOOGLE NOTEBOOKLM RADIAL AURA GLOW BACKDROP */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[760px] notebooklm-aura"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-28 left-1/2 -translate-x-1/2 w-[780px] h-[360px] rounded-full bg-gradient-to-r from-indigo-300/30 via-sky-200/30 to-violet-300/30 dark:from-indigo-600/20 dark:via-sky-500/15 dark:to-violet-600/20 blur-3xl"
      />

      <div className="relative z-10 px-4 sm:px-8 lg:px-14 pt-7 sm:pt-10 pb-14 sm:pb-20 space-y-14 sm:space-y-20 max-w-[1380px] mx-auto">
        {/* =====================================================================
            1. GOOGLE NOTEBOOKLM CENTERED HERO + FLOATING INTERACTIVE SHOWCASE
           ===================================================================== */}
        <section
          data-testid="landing-hero"
          aria-label="О продукте ScopeGuard Legal"
          className="space-y-7 sm:space-y-9"
        >
          {/* Centered Airy Header */}
          <div className="max-w-4xl mx-auto text-center space-y-4 sm:space-y-5">
            <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-[#EDF2FA] dark:bg-slate-900 border border-indigo-200/60 dark:border-slate-800 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 shadow-2xs">
              <BrandLogoIcon className="w-4 h-4 shrink-0" />
              <span>ScopeGuard Legal</span>
              <span className="text-slate-300 dark:text-slate-600">·</span>
              <span className="text-indigo-600 dark:text-indigo-400 font-semibold">
                ИИ-ассистент проджект-менеджера и IT-юриста
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-slate-900 dark:text-white leading-[1.08] text-balance">
              <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-sky-500 bg-clip-text text-transparent">
                Защитите бюджет проекта от бесплатных правок
              </span>{' '}
              и скрытого Scope Creep
            </h1>

            <p className="text-base sm:text-lg lg:text-xl text-slate-600 dark:text-slate-300 leading-relaxed max-w-3xl mx-auto font-normal">
              Загрузите исходное ТЗ и запись созвона с заказчиком. За 30 секунд
              ScopeGuard сопоставит каждое устное пожелание с пунктами договора,
              оценит трудозатраты в часах и сформирует готовое Дополнительное
              соглашение (Change Order) в формате Google Docs / PDF.
            </p>

            {/* Primary Pill CTA Row */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3.5">
              <button
                type="button"
                data-testid="landing-cta-start"
                onClick={onStartFreeAudit}
                className="w-full sm:w-auto min-h-[52px] inline-flex items-center justify-center gap-2.5 px-8 py-3.5 text-sm sm:text-base font-semibold text-white bg-slate-900 dark:bg-indigo-600 hover:bg-indigo-600 dark:hover:bg-indigo-500 rounded-full shadow-[0_10px_28px_-6px_rgba(79,70,229,0.45)] transition-all cursor-pointer active:scale-[0.98]"
              >
                <Sparkles className="w-4 h-4 text-indigo-300 dark:text-white shrink-0" />
                <span>Попробовать бесплатно</span>
                <ArrowRight className="w-4 h-4 shrink-0" />
              </button>

              <button
                type="button"
                data-testid="landing-cta-sample"
                onClick={onOpenSampleModal}
                className="w-full sm:w-auto min-h-[52px] inline-flex items-center justify-center gap-2 px-7 py-3.5 text-sm sm:text-base font-semibold text-slate-800 dark:text-slate-100 bg-[#EDF2FA]/90 dark:bg-slate-900 hover:bg-[#D3E3FD]/80 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800 rounded-full transition-all cursor-pointer"
              >
                <FileSearch className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <span>Посмотреть пример отчета</span>
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums">
              <span>{quotaBadge}</span>
              <span>•</span>
              <span>PDF, DOCX, TXT, MP3, WAV до 25 МБ</span>
              <span>•</span>
              <span>Готовый Change Order и письмо без конфронтации</span>
            </div>
          </div>

          {/* FLOATING INTERACTIVE HERO SHOWCASE CARD (shadow-2xl rounded-3xl border border-slate-200/60) */}
          <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-3xl border border-slate-200/60 dark:border-slate-800 shadow-2xl p-5 sm:p-8 space-y-6">
            {/* Showcase Top Bar with Interactive Example Switcher Pills */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-200/70 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                    Интерактивная демонстрация ИИ-сверки
                  </div>
                  <div className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                    {currentCase.projectTitle}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 p-1.5 rounded-full bg-[#EDF2FA] dark:bg-slate-800/90">
                <span className="px-3 py-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                  Переключить кейс:
                </span>
                {HERO_SHOWCASE_CASES.map((item, idx) => {
                  const active = idx === activeCaseIdx;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      data-testid={`showcase-case-btn-${idx}`}
                      onClick={() => setActiveCaseIdx(idx)}
                      className={`px-3.5 py-1.5 text-xs font-semibold rounded-full transition-all cursor-pointer whitespace-nowrap ${
                        active
                          ? 'bg-slate-900 text-white dark:bg-indigo-600 shadow-xs'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-white/80 dark:hover:bg-slate-700'
                      }`}
                    >
                      {item.tabLabel}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3-Column Visual Flow: [1. Договор / ТЗ + Звонок] ---> [2. ИИ-Луч анализа] ---> [3. Найдено 3 доработки на +$2 400] */}
            <div
              key={currentCase.id}
              className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch animate-tab-fade"
            >
              {/* Left Column (5 cols): Source Contract / Spec & Call Quote */}
              <div className="lg:col-span-5 flex flex-col justify-between gap-4 bg-[#F8FAFC] dark:bg-slate-950/70 rounded-3xl p-5 border border-slate-200/70 dark:border-slate-800">
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="inline-flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-200">
                      <FileText className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      <span>Исходный Договор / ТЗ</span>
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-200/70 dark:bg-slate-800 text-[11px] font-mono text-slate-600 dark:text-slate-300">
                      PDF · Базовая смета
                    </span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 space-y-1.5 shadow-2xs">
                    <div className="text-[11px] font-mono font-semibold text-slate-500 dark:text-slate-400">
                      {currentCase.contractClauseTitle}
                    </div>
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                      {currentCase.contractClauseText}
                    </p>
                  </div>
                </div>

                <div className="space-y-2.5 pt-2 border-t border-slate-200/60 dark:border-slate-800">
                  <div className="flex items-center justify-between text-xs">
                    <span className="inline-flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-200">
                      <Mic className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                      <span>Запись созвона с клиентом</span>
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-violet-100/80 dark:bg-violet-950/80 text-[11px] font-mono font-semibold text-violet-700 dark:text-violet-300">
                      Таймкод [{currentCase.callTimecode}]
                    </span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-violet-50/60 dark:bg-violet-950/30 border border-violet-200/70 dark:border-violet-800/60">
                    <p className="text-xs italic text-slate-800 dark:text-slate-200 leading-relaxed">
                      {currentCase.callQuoteText}
                    </p>
                  </div>
                </div>
              </div>

              {/* Center Column (2 cols): Animated AI Beam / Arrow Connector */}
              <div className="lg:col-span-2 flex flex-col items-center justify-center py-2 lg:py-0">
                <div className="w-full rounded-3xl bg-gradient-to-b from-[#EDF2FA] via-indigo-50/90 to-violet-50/90 dark:from-slate-800 dark:via-indigo-950/60 dark:to-violet-950/60 border border-indigo-200/60 dark:border-indigo-800/60 p-4 flex flex-col items-center justify-center text-center space-y-3 h-full">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white flex items-center justify-center shadow-md">
                    <Wand2 className="w-5 h-5" />
                  </div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">
                    Gemini Legal AI
                  </div>
                  <div className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 animate-ai-beam">
                    <span className="h-0.5 w-6 bg-indigo-500 rounded-full" />
                    <ArrowRight className="w-4 h-4 shrink-0" />
                  </div>
                  <div className="space-y-1 text-[11px] font-mono text-slate-600 dark:text-slate-300">
                    <div className="px-2 py-0.5 rounded-full bg-white/80 dark:bg-slate-900">
                      Сверка с п. ТЗ
                    </div>
                    <div className="px-2 py-0.5 rounded-full bg-white/80 dark:bg-slate-900">
                      Оценка 1–40 ч
                    </div>
                    <div className="px-2 py-0.5 rounded-full bg-white/80 dark:bg-slate-900">
                      Change Order
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column (5 cols): Detected Scope Creep Card ("Найдено 3 скрытые доработки на +$2 400") */}
              <div className="lg:col-span-5 flex flex-col justify-between bg-gradient-to-br from-[#F3F6FC] via-white to-[#F6F3FF] dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950/40 rounded-3xl p-5 border border-indigo-200/80 dark:border-indigo-800/70 shadow-sm space-y-4">
                <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-200/80 dark:border-slate-800">
                  <div>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-100/90 dark:bg-amber-950/70 text-amber-900 dark:text-amber-300 text-[11px] font-semibold">
                      <ShieldAlert className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                      <span>Обнаружен выход за рамки сметы</span>
                    </span>
                    <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-1.5">
                      Найдено {currentCase.detectedItems.length} скрытые
                      доработки на{' '}
                      <span className="text-indigo-600 dark:text-indigo-400 font-mono tabular-nums">
                        {showcaseDisplayAmount}
                      </span>
                    </h2>
                  </div>
                  <div className="text-right font-mono tabular-nums shrink-0">
                    <div className="text-xs font-bold text-slate-900 dark:text-white">
                      +{totalCaseHours} нормо-ч
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      Сдвиг +{currentCase.shiftDays} раб. дн.
                    </div>
                  </div>
                </div>

                {/* List of 3 detected items */}
                <div className="space-y-2.5">
                  {currentCase.detectedItems.map((item, idx) => (
                    <div
                      key={item.title}
                      className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-start justify-between gap-3 shadow-2xs"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-mono text-slate-400">
                            0{idx + 1}
                          </span>
                          <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {item.title}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {item.clauseRef}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-mono tabular-nums font-bold ${
                            item.severity === 'Критично'
                              ? 'bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300'
                              : 'bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                          }`}
                        >
                          +{item.hours} ч
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-2 flex flex-wrap items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={onOpenSampleModal}
                    className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                  >
                    Открыть полный текст письма и Change Order →
                  </button>
                  <button
                    type="button"
                    onClick={onStartFreeAudit}
                    className="px-4 py-2 rounded-full text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-colors cursor-pointer"
                  >
                    Проверить свой договор
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =====================================================================
            2. ASYMMETRIC BENTO GRID WITH PASTEL BACKDROPS & LIVE UI MINIATURES
           ===================================================================== */}
        <section
          data-testid="landing-features"
          aria-label="Возможности ScopeGuard Legal в формате Bento Grid"
          className="space-y-8"
        >
          <div className="max-w-3xl mx-auto text-center space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/70 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
              <span>Инструментарий Google Workspace для юристов и PM</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-slate-900 dark:text-white text-balance">
              Все доказательства для согласования доплаты — на одном чистом
              листе
            </h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300">
              Каждая карточка отчета связывает устную фразу клиента с конкретным
              пунктом договора и превращает спор в спокойное деловое
              предложение.
            </p>
          </div>

          {/* Asymmetric 12-Column Bento Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* BENTO CARD 1 (Span 7, Pastel Sky-Indigo): Timecode & Contract Clause Matcher */}
            <div className="card-hover-lift lg:col-span-7 rounded-3xl bg-[#F3F6FC] dark:bg-slate-900/90 border border-indigo-100 dark:border-slate-800 p-6 sm:p-8 flex flex-col justify-between space-y-6 shadow-xs hover:shadow-xl">
              <div className="space-y-2.5">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white dark:bg-slate-800 text-xs font-semibold text-indigo-600 dark:text-indigo-400 shadow-2xs">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Аудио- и текстовая сверка</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-semibold text-slate-900 dark:text-white">
                  Точный поиск противоречий с ТЗ по таймкодам созвона
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  Прикрепляйте запись встречи в MP3/WAV или стенограмму из
                  Zoom/Telegram. ИИ выделяет каждую новую «хотелку» и указывает,
                  какому именно пункту исходного договора она противоречит.
                </p>
              </div>

              {/* Live UI Miniature: Audio Waveform + Timecode Quote -> Clause Link */}
              <div className="rounded-2xl bg-white dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 p-4 space-y-3 shadow-xs">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-full bg-indigo-600 text-white text-[11px] font-mono font-semibold">
                      14:20
                    </span>
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      Голосовой запрос клиента на звонке
                    </span>
                  </div>
                  {/* Simulated Audio Waveform */}
                  <div
                    aria-hidden="true"
                    className="hidden sm:flex items-center gap-1 h-4"
                  >
                    {[35, 75, 55, 100, 65, 90, 40, 80, 60, 30].map((h, i) => (
                      <span
                        key={i}
                        className="w-1 rounded-full bg-indigo-500/70"
                        style={{ height: `${h}%` }}
                      />
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
                    <div className="text-[10px] font-mono uppercase text-slate-400">
                      Фраза клиента
                    </div>
                    <div className="font-medium text-slate-800 dark:text-slate-200 mt-0.5">
                      «Добавьте выгрузку в 1С:ERP каждые 5 минут»
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-red-50/70 dark:bg-red-950/30 border border-red-200/60 dark:border-red-900/50">
                    <div className="text-[10px] font-mono uppercase text-red-600 dark:text-red-400">
                      Конфликт с договором
                    </div>
                    <div className="font-medium text-red-900 dark:text-red-200 mt-0.5">
                      Пункт 3.2 ТЗ: только CSV-импорт раз в сутки
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* BENTO CARD 2 (Span 5, Pastel Lavender): Live Hours Chart & Deadline Shift */}
            <div className="card-hover-lift lg:col-span-5 rounded-3xl bg-[#F6F3FF] dark:bg-slate-900/90 border border-violet-100 dark:border-slate-800 p-6 sm:p-8 flex flex-col justify-between space-y-6 shadow-xs hover:shadow-xl">
              <div className="space-y-2.5">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white dark:bg-slate-800 text-xs font-semibold text-violet-700 dark:text-violet-300 shadow-2xs">
                  <Calculator className="w-3.5 h-3.5" />
                  <span>Калькулятор сметы 1–40 ч</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-semibold text-slate-900 dark:text-white">
                  Мгновенный расчет часов, бюджета и сдвига дедлайна
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  Меняйте оценку трудоемкости и ставку часа в USD, RUB, EUR или
                  KZT — сумма доплаты и сдвиг сроков пересчитываются на лету.
                </p>
              </div>

              {/* Live UI Miniature: Mini Bar-Chart of Hours */}
              <div className="rounded-2xl bg-white dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 p-4 space-y-3 shadow-xs">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700 dark:text-slate-200">
                    Трудоемкость новых задач
                  </span>
                  <span className="font-mono font-bold text-violet-600 dark:text-violet-400">
                    76 ч · +13 раб. дн.
                  </span>
                </div>
                <div className="space-y-2 text-xs font-mono">
                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-slate-700 dark:text-slate-300">
                        Модуль 1С:ERP API
                      </span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        36 ч
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div className="h-full w-[90%] rounded-full bg-gradient-to-r from-indigo-600 to-violet-600" />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-slate-700 dark:text-slate-300">
                        Telegram-бот заказов
                      </span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        24 ч
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div className="h-full w-[62%] rounded-full bg-indigo-500" />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-slate-700 dark:text-slate-300">
                        Ролевая матрица RBAC
                      </span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        16 ч
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div className="h-full w-[42%] rounded-full bg-sky-500" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* BENTO CARD 3 (Span 5, Pastel Mint): Diplomatic Email Preview */}
            <div className="card-hover-lift lg:col-span-5 rounded-3xl bg-[#F0FDF6] dark:bg-slate-900/90 border border-emerald-100 dark:border-slate-800 p-6 sm:p-8 flex flex-col justify-between space-y-6 shadow-xs hover:shadow-xl">
              <div className="space-y-2.5">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white dark:bg-slate-800 text-xs font-semibold text-emerald-700 dark:text-emerald-300 shadow-2xs">
                  <MailCheck className="w-3.5 h-3.5" />
                  <span>Переговоры без конфликта</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-semibold text-slate-900 dark:text-white">
                  Дипломатичное письмо клиенту в один клик
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  Подтверждайте готовность сдать базовый проект вовремя и мягко
                  предлагайте клиенту выбор по новым задачам.
                </p>
              </div>

              {/* Live UI Miniature: Diplomatic Email Snippet */}
              <div className="rounded-2xl bg-white dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 p-4 space-y-2.5 shadow-xs text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="font-semibold text-slate-900 dark:text-white">
                    Резюме встречи и план релиза
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] font-semibold">
                    Мягкий тон
                  </span>
                </div>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  «Базовый контур по ТЗ идет строго по графику. Чтобы не
                  задерживать ваш запуск, предлагаем 2 комфортных сценария по
                  новым модулям...»
                </p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <span className="px-2.5 py-1 rounded-full bg-[#EDF2FA] dark:bg-slate-800 text-[11px] font-medium text-slate-800 dark:text-slate-200">
                    Вариант А: Доп. соглашение
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[11px] font-medium text-slate-600 dark:text-slate-300">
                    Вариант Б: Этап Backlog v1.1
                  </span>
                </div>
              </div>
            </div>

            {/* BENTO CARD 4 (Span 7, Pastel Google Docs Blue): Official Change Order Sheet Preview */}
            <div className="card-hover-lift lg:col-span-7 rounded-3xl bg-[#F5F8FF] dark:bg-slate-900/90 border border-sky-100 dark:border-slate-800 p-6 sm:p-8 flex flex-col justify-between space-y-6 shadow-xs hover:shadow-xl">
              <div className="space-y-2.5">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white dark:bg-slate-800 text-xs font-semibold text-indigo-600 dark:text-indigo-400 shadow-2xs">
                  <Scale className="w-3.5 h-3.5" />
                  <span>Юридический документ Google Docs / PDF</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-semibold text-slate-900 dark:text-white">
                  Готовый бланк Дополнительного соглашения (Change Order)
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  Официальное Приложение к договору с реквизитами Заказчика и
                  Исполнителя, таблицей дополнительных работ, расчетом стоимости
                  и подписями сторон. Выгружается в PDF и Word (.doc).
                </p>
              </div>

              {/* Live UI Miniature: Google Docs Paper Sheet */}
              <div className="rounded-2xl bg-white dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="text-[11px] font-mono uppercase tracking-wider text-indigo-600 dark:text-indigo-400 font-semibold">
                    ПРИЛОЖЕНИЕ №2 (CHANGE ORDER) К ДОГОВОРУ
                  </div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white">
                    Спецификация дополнительных работ и сдвиг сроков этапа
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <span className="inline-flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Реквизиты сторон</span>
                    </span>
                    <span>·</span>
                    <span>Таблица нормо-часов</span>
                    <span>·</span>
                    <span>White-Label логотип</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={onOpenSampleModal}
                    className="px-4 py-2 rounded-full bg-[#EDF2FA] dark:bg-slate-800 hover:bg-[#D3E3FD] text-xs font-semibold text-slate-900 dark:text-white transition-colors cursor-pointer"
                  >
                    Превью бланка
                  </button>
                  <button
                    type="button"
                    onClick={onStartFreeAudit}
                    className="px-4 py-2 rounded-full bg-slate-900 dark:bg-indigo-600 text-xs font-semibold text-white hover:bg-indigo-600 transition-colors cursor-pointer"
                  >
                    Создать PDF
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =====================================================================
            3. HOW IT WORKS (3 AIRY GOOGLE WORKSPACE PILL STEPS)
           ===================================================================== */}
        <section
          data-testid="landing-how-it-works"
          aria-label="Как работает ScopeGuard Legal"
          className="space-y-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                Регламент за 30 секунд
              </div>
              <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900 dark:text-white mt-1">
                От записи созвона до подписанного Change Order в 3 шага
              </h2>
            </div>
            <button
              type="button"
              onClick={onOpenHistory}
              className="self-start sm:self-auto inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#EDF2FA] dark:bg-slate-900 hover:bg-[#D3E3FD] text-xs font-semibold text-slate-800 dark:text-slate-200 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Открыть библиотеку готовых отчетов</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              {
                step: 'Шаг 01',
                title: 'Загрузите ТЗ и запись встречи',
                desc: 'Перетащите файл договора (PDF, DOCX, TXT) и аудиозапись созвона с заказчиком (MP3, WAV) либо вставьте стенограмму.',
                pill: 'Gemini File API · до 25 МБ',
              },
              {
                step: 'Шаг 02',
                title: 'Проверьте найденный Scope Creep',
                desc: 'ИИ выделит все скрытые доработки с таймкодами, объяснит противоречие с ТЗ и рассчитает нормо-часы от 1 до 40 ч.',
                pill: 'Живой пересчет сметы на листе',
              },
              {
                step: 'Шаг 03',
                title: 'Отправьте письмо и доп. соглашение',
                desc: 'Скопируйте дипломатичное письмо для клиента и выгрузите официальный Change Order в PDF или Word на подпись.',
                pill: 'Экспорт PDF / Word в 1 клик',
              },
            ].map((item) => (
              <div
                key={item.step}
                className="card-hover-lift rounded-3xl bg-[#F8FAFC] dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 p-6 flex flex-col justify-between space-y-5"
              >
                <div className="space-y-3">
                  <span className="inline-block px-3 py-1 rounded-full bg-white dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700 text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">
                    {item.step}
                  </span>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                    {item.title}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
                <div className="pt-3 border-t border-slate-200/60 dark:border-slate-800 text-xs font-mono text-slate-500 dark:text-slate-400">
                  {item.pill}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* =====================================================================
            4. BOTTOM NOTEBOOKLM CALL-TO-ACTION BANNER
           ===================================================================== */}
        <section
          data-testid="landing-bottom-cta"
          aria-label="Запустить бесплатный аудит"
          className="rounded-3xl bg-gradient-to-r from-[#EEF2FF] via-[#F3F6FC] to-[#F5F3FF] dark:from-slate-900 dark:via-indigo-950/60 dark:to-slate-900 border border-indigo-200/70 dark:border-indigo-900/60 p-8 sm:p-12 text-center space-y-6"
        >
          <div className="max-w-2xl mx-auto space-y-3">
            <h2 className="text-2xl sm:text-4xl font-semibold tracking-tight text-slate-900 dark:text-white text-balance">
              Переведите обсуждение новых «хотелок» на язык цифр и договоров
            </h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300">
              Доступно 2 полных бесплатных аудита сразу без регистрации и карты.
              Откройте рабочий лист Google Docs прямо сейчас.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <button
              type="button"
              data-testid="landing-bottom-cta-start"
              onClick={onStartFreeAudit}
              className="w-full sm:w-auto min-h-[50px] inline-flex items-center justify-center gap-2 px-8 py-3.5 text-sm font-semibold text-white bg-slate-900 dark:bg-indigo-600 hover:bg-indigo-600 dark:hover:bg-indigo-500 rounded-full shadow-md transition-all cursor-pointer"
            >
              <span>Открыть рабочий кабинет</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onOpenSampleModal}
              className="w-full sm:w-auto min-h-[50px] inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-semibold text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800 hover:bg-slate-50 border border-slate-200 dark:border-slate-700 rounded-full transition-colors cursor-pointer"
            >
              <span>Изучить пример отчета</span>
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};
