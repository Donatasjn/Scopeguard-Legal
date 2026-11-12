import React, { useState } from 'react';
import {
  ArrowRight,
  Calculator,
  CheckCircle2,
  Clock,
  FileSearch,
  FileText,
  Layers,
  MailCheck,
  Mic,
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
      '«Обмен номенклатурой и остатками выполняется путем односторонней загрузки файла CSV/XLSX администратором 1 раз в сутки. Прямая интеграция с 1С:ERP в этап №1 не входит».',
    callTimecode: '14:20',
    callQuoteText:
      '«Давайте сразу настроим двустороннюю синхронизацию с нашей 1С:ERP каждые 5 минут, плюс Telegram-бота для повтора заказов и трехуровневое согласование лимитов».',
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
      '«Аутентификация пользователей реализуется по связке Email + SMS-код. График платежей отображается в режиме чтения таблицы без модуля подписания УКЭП».',
    callTimecode: '09:45',
    callQuoteText:
      '«К релизу обязательно нужен вход через Госуслуги (ЕСИА), подписание договоров прямо в браузере через КриптоПро УКЭП и калькулятор досрочного выкупа».',
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
      '«Видеоуроки размещаются через защищенный плеер Kinescope. Тестирование сотрудников включает одиночный и множественный выбор без прокторинга».',
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

  const showcaseDisplayAmount =
    currency === 'USD'
      ? `+$${currentCase.usdProtectedTotal.toLocaleString('ru-RU')}`
      : `+${formatMoney(
          totalCaseHours * convertHourlyRate(4500, 'RUB', currency),
          currency
        )}`;

  const quotaBadge = formatQuotaBadgeText(freemiumState);

  return (
    <div data-testid="landing-page" className="animate-fade-up">
      {/* =====================================================================
          1. DEEP CONTRAST DARK HERO STAGE (#0B0F19 + Indigo/Emerald Aurora Glow)
         ===================================================================== */}
      <section
        data-testid="landing-hero"
        aria-label="Стартовый экран ScopeGuard Legal"
        className="relative -mt-22 pt-28 sm:pt-32 pb-16 sm:pb-24 px-4 sm:px-6 lg:px-8 bg-[#0B0F19] text-white overflow-hidden rounded-b-[40px] sm:rounded-b-[56px] shadow-[0_24px_60px_-15px_rgba(11,15,25,0.45)]"
      >
        {/* Architectural Grid + Animated Indigo/Emerald Aurora Glow */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 hero-grid-pattern opacity-70"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 left-1/4 w-[520px] h-[360px] rounded-full bg-indigo-600/30 blur-[120px] animate-aurora-1"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-16 right-1/5 w-[460px] h-[340px] rounded-full bg-emerald-500/20 blur-[120px] animate-aurora-2"
        />

        <div className="relative z-10 max-w-6xl mx-auto space-y-10 sm:space-y-12">
          {/* Centered Framer / Linear / Apple Headline */}
          <div className="max-w-4xl mx-auto text-center space-y-5">
            <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white/[0.06] border border-white/15 backdrop-blur-md text-xs sm:text-sm text-slate-200">
              <BrandLogoIcon className="w-4 h-4 shrink-0" />
              <span className="font-semibold text-white">
                ScopeGuard Legal 2.0
              </span>
              <span className="text-slate-500">·</span>
              <span className="text-emerald-300 font-medium">
                ИИ-защита ИТ-проектов от бесплатного Scope Creep
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-[1.07] text-balance">
              <span className="bg-gradient-to-r from-indigo-400 via-sky-300 to-emerald-300 bg-clip-text text-transparent">
                Защитите бюджет проекта от бесплатных правок
              </span>{' '}
              за 30 секунд
            </h1>

            <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-3xl mx-auto font-normal">
              Загрузите исходное ТЗ и запись созвона с клиентом. Нейросеть
              посекундно сверит каждое пожелание заказчика с договором, оценит
              нормо-часы (1–40 ч) и сформирует готовое Дополнительное соглашение
              (Change Order) вместе с дипломатичным письмом.
            </p>

            {/* Primary Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3.5">
              <button
                type="button"
                data-testid="landing-cta-start"
                onClick={onStartFreeAudit}
                className="w-full sm:w-auto min-h-[52px] inline-flex items-center justify-center gap-2.5 px-8 py-3.5 text-sm sm:text-base font-semibold text-white bg-gradient-to-r from-indigo-600 via-indigo-500 to-emerald-500 hover:from-indigo-500 hover:to-emerald-400 rounded-2xl shadow-[0_12px_32px_-6px_rgba(79,70,229,0.6)] transition-all active:scale-95 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-emerald-200 shrink-0" />
                <span>Открыть рабочую зону · Начать аудит</span>
                <ArrowRight className="w-4 h-4 shrink-0" />
              </button>

              <button
                type="button"
                data-testid="landing-cta-sample"
                onClick={onOpenSampleModal}
                className="w-full sm:w-auto min-h-[52px] inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm sm:text-base font-semibold text-white bg-white/[0.08] hover:bg-white/[0.14] border border-white/15 backdrop-blur-xl rounded-2xl transition-all active:scale-95 cursor-pointer"
              >
                <FileSearch className="w-4 h-4 text-emerald-300 shrink-0" />
                <span>Посмотреть пример отчета</span>
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-slate-400 font-mono tabular-nums">
              <span className="text-emerald-300 font-semibold">
                {quotaBadge}
              </span>
              <span>•</span>
              <span>PDF, DOCX, TXT, MP3, WAV до 25 МБ</span>
              <span>•</span>
              <span>Выгрузка Change Order в PDF и Word</span>
            </div>
          </div>

          {/* INTERACTIVE GLASS PRODUCT SHOWCASE CONSOLE INSIDE DARK HERO */}
          <div className="rounded-3xl bg-slate-900/80 backdrop-blur-2xl border border-white/12 shadow-[0_24px_70px_-15px_rgba(0,0,0,0.75)] p-5 sm:p-7 space-y-5">
            {/* Top Console Bar + Interactive Case Switcher */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400/80" />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400/80" />
                </div>
                <div className="h-4 w-px bg-white/10" />
                <div>
                  <div className="text-[11px] font-mono uppercase tracking-wider text-emerald-400">
                    Интерактивная демонстрация ИИ-сверки
                  </div>
                  <div className="text-sm sm:text-base font-bold text-white">
                    {currentCase.projectTitle}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-white/[0.06] border border-white/10">
                {HERO_SHOWCASE_CASES.map((item, idx) => {
                  const active = idx === activeCaseIdx;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      data-testid={`showcase-case-btn-${idx}`}
                      onClick={() => setActiveCaseIdx(idx)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all active:scale-95 cursor-pointer whitespace-nowrap ${
                        active
                          ? 'bg-gradient-to-r from-indigo-600 to-emerald-500 text-white shadow-xs'
                          : 'text-slate-300 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      {item.tabLabel}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3-Column Interactive Showcase Grid */}
            <div
              key={currentCase.id}
              className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch animate-tab-fade"
            >
              {/* Col 1 (5 cols): Source Spec & Call Quote */}
              <div className="lg:col-span-5 rounded-2xl bg-white/[0.04] border border-white/10 p-4 flex flex-col justify-between gap-3.5">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="inline-flex items-center gap-1.5 font-semibold text-indigo-300">
                      <FileText className="w-3.5 h-3.5" />
                      <span>Исходный Договор / ТЗ</span>
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-white/10 text-[10px] font-mono text-slate-300">
                      PDF · Базовая смета
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950/70 border border-white/8 space-y-1">
                    <div className="text-[11px] font-mono text-slate-400">
                      {currentCase.contractClauseTitle}
                    </div>
                    <p className="text-xs text-slate-200 leading-relaxed">
                      {currentCase.contractClauseText}
                    </p>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-white/10">
                  <div className="flex items-center justify-between text-xs">
                    <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-300">
                      <Mic className="w-3.5 h-3.5" />
                      <span>Стенограмма созвона</span>
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-[10px] font-mono font-semibold text-emerald-300">
                      Таймкод [{currentCase.callTimecode}]
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-indigo-950/50 border border-indigo-500/30">
                    <p className="text-xs italic text-slate-100 leading-relaxed">
                      {currentCase.callQuoteText}
                    </p>
                  </div>
                </div>
              </div>

              {/* Col 2 (2 cols): Pulsing AI Engine Beam */}
              <div className="lg:col-span-2 flex flex-col items-center justify-center">
                <div className="w-full h-full rounded-2xl bg-gradient-to-b from-indigo-950/70 via-slate-900 to-emerald-950/60 border border-indigo-500/30 p-4 flex flex-col items-center justify-center text-center space-y-2.5">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-emerald-500 text-white flex items-center justify-center animate-ai-pulse">
                    <Wand2 className="w-5 h-5" />
                  </div>
                  <div className="text-xs font-bold text-white">
                    ScopeGuard AI
                  </div>
                  <div className="flex items-center gap-1 text-emerald-400 animate-ai-beam">
                    <span className="h-0.5 w-6 bg-emerald-400 rounded-full" />
                    <ArrowRight className="w-4 h-4 shrink-0" />
                  </div>
                  <div className="space-y-1 text-[10px] font-mono text-slate-300">
                    <div className="px-2 py-0.5 rounded bg-white/8">
                      Сверка ТЗ
                    </div>
                    <div className="px-2 py-0.5 rounded bg-white/8">
                      Оценка 1–40 ч
                    </div>
                    <div className="px-2 py-0.5 rounded bg-white/8">
                      Change Order
                    </div>
                  </div>
                </div>
              </div>

              {/* Col 3 (5 cols): Detected Scope Creep Output */}
              <div className="lg:col-span-5 rounded-2xl bg-gradient-to-br from-indigo-950/60 via-slate-900 to-emerald-950/40 border border-emerald-500/30 p-4 flex flex-col justify-between space-y-3.5">
                <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-white/10">
                  <div>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-[10px] font-semibold">
                      <ShieldAlert className="w-3 h-3" />
                      <span>Выход за рамки договора</span>
                    </span>
                    <h2 className="text-sm sm:text-base font-bold text-white mt-1">
                      Найдено {currentCase.detectedItems.length} доработки на{' '}
                      <span className="text-emerald-400 font-mono tabular-nums">
                        {showcaseDisplayAmount}
                      </span>
                    </h2>
                  </div>
                  <div className="text-right font-mono tabular-nums shrink-0">
                    <div className="text-xs font-bold text-white">
                      +{totalCaseHours} нормо-ч
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Сдвиг +{currentCase.shiftDays} раб. дн.
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  {currentCase.detectedItems.map((item, idx) => (
                    <div
                      key={item.title}
                      className="p-2.5 rounded-xl bg-slate-950/80 border border-white/10 flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-mono text-slate-500">
                            0{idx + 1}
                          </span>
                          <span className="text-xs font-semibold text-white truncate">
                            {item.title}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 truncate mt-0.5">
                          {item.clauseRef}
                        </div>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-md text-[11px] font-mono tabular-nums font-bold shrink-0 ${
                          item.severity === 'Критично'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        +{item.hours} ч
                      </span>
                    </div>
                  ))}
                </div>

                <div className="pt-1 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={onOpenSampleModal}
                    className="text-xs font-semibold text-emerald-300 hover:text-emerald-200 underline cursor-pointer"
                  >
                    Текст письма и доп. соглашения →
                  </button>
                  <button
                    type="button"
                    onClick={onStartFreeAudit}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 transition-all active:scale-95 cursor-pointer"
                  >
                    Открыть в кабинете
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          2. CRYSTAL-CLEAR LIGHT INTERFACE (#F8FAFC) + GLASS BENTO GRID
         ===================================================================== */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20 space-y-16 sm:space-y-20">
        <section
          data-testid="landing-features"
          aria-label="Архитектура защиты бюджета"
          className="space-y-8"
        >
          <div className="max-w-3xl mx-auto text-center space-y-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200/60 dark:border-indigo-800/60 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
              <Layers className="w-3.5 h-3.5" />
              <span>Полный цикл юридической и технической аргументации</span>
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white text-balance">
              Четыре документа, которые закрывают любой спор о «бесплатных
              доработках»
            </h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300">
              Вместо эмоциональных споров с клиентом отправьте структурированный
              отчет с таймкодами, расчетом нормо-часов и готовым Приложением к
              договору.
            </p>
          </div>

          {/* Asymmetric Bento Grid with Translucent Glass Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Bento Card 1 (7 cols) */}
            <div className="glass-card card-hover-lift lg:col-span-7 rounded-3xl p-6 sm:p-8 flex flex-col justify-between space-y-6">
              <div className="space-y-2.5">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                  <Clock className="w-3.5 h-3.5" />
                  <span>01 · Детектор Scope Creep по таймкодам</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                  Сверка аудиозаписи и стенограммы с пунктами ТЗ
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  Поддержка загрузки PDF, DOCX, TXT и аудиозаписей встреч (MP3,
                  WAV, M4A). Каждая новая хотелка клиента связывается с точной
                  цитатой и номером пункта договора, которому она противоречит.
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50/90 dark:bg-slate-950/80 border border-slate-200/80 dark:border-slate-800 p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800">
                  <div className="font-mono text-[10px] text-indigo-600 dark:text-indigo-400 font-bold">
                    ЦИТАТА СОЗВОНА [06:40]
                  </div>
                  <div className="font-medium text-slate-800 dark:text-slate-200 mt-1">
                    «Настройте двусторонний обмен с 1С:ERP каждые 5 минут»
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200/70 dark:border-rose-900/50">
                  <div className="font-mono text-[10px] text-rose-600 dark:text-rose-400 font-bold">
                    КОНФЛИКТ С ТЗ
                  </div>
                  <div className="font-medium text-rose-900 dark:text-rose-200 mt-1">
                    Пункт 3.2 ТЗ: предусмотрен только ручной импорт CSV
                  </div>
                </div>
              </div>
            </div>

            {/* Bento Card 2 (5 cols) */}
            <div className="glass-card card-hover-lift lg:col-span-5 rounded-3xl p-6 sm:p-8 flex flex-col justify-between space-y-6">
              <div className="space-y-2.5">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                  <Calculator className="w-3.5 h-3.5" />
                  <span>02 · Живая смета 1–40 нормо-ч</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                  Авторасчет бюджета и сдвига сроков релиза
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  Интерактивный пересчет в USD, RUB, EUR и KZT с автоматическим
                  расчетом правового сдвига дедлайна в рабочих днях.
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50/90 dark:bg-slate-950/80 border border-slate-200/80 dark:border-slate-800 p-4 space-y-2.5 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-500">Интеграция 1С:ERP API</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    36 ч · $1 692
                  </span>
                </div>
                <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                  <div className="h-full w-[88%] rounded-full bg-gradient-to-r from-indigo-600 to-emerald-500" />
                </div>
                <div className="flex justify-between pt-1">
                  <span className="text-slate-500">Telegram-бот заказов</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    24 ч · $1 128
                  </span>
                </div>
                <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                  <div className="h-full w-[62%] rounded-full bg-indigo-500" />
                </div>
              </div>
            </div>

            {/* Bento Card 3 (5 cols) */}
            <div className="glass-card card-hover-lift lg:col-span-5 rounded-3xl p-6 sm:p-8 flex flex-col justify-between space-y-6">
              <div className="space-y-2.5">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-sky-50 dark:bg-sky-950/70 text-xs font-semibold text-sky-700 dark:text-sky-300">
                  <MailCheck className="w-3.5 h-3.5" />
                  <span>03 · Дипломатичное письмо</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                  Аргументация доплаты без конфликта с заказчиком
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  Готовое резюме встречи подтверждает выполнение базового ТЗ в
                  срок и мягко предлагает выбор: Change Order сейчас или Backlog
                  v1.1.
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50/90 dark:bg-slate-950/80 border border-slate-200/80 dark:border-slate-800 p-4 space-y-2 text-xs">
                <div className="font-semibold text-slate-900 dark:text-white">
                  Два комфортных сценария для клиента:
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white font-semibold">
                    Вариант А: Доп. соглашение
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium">
                    Вариант Б: Этап v1.1 после релиза
                  </span>
                </div>
              </div>
            </div>

            {/* Bento Card 4 (7 cols) */}
            <div className="glass-card card-hover-lift lg:col-span-7 rounded-3xl p-6 sm:p-8 flex flex-col justify-between space-y-6">
              <div className="space-y-2.5">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-violet-50 dark:bg-violet-950/70 text-xs font-semibold text-violet-700 dark:text-violet-300">
                  <Scale className="w-3.5 h-3.5" />
                  <span>04 · Юридический Change Order (PDF / Word)</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                  Официальное Приложение к договору с реквизитами сторон
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  Автоматическая сборка печатного бланка Дополнительного
                  соглашения с вашим брендингом, таблицей работ, расчетом суммы
                  и блоком подписей Заказчика и Исполнителя.
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50/90 dark:bg-slate-950/80 border border-slate-200/80 dark:border-slate-800 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1 text-xs">
                  <div className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                    ПРИЛОЖЕНИЕ №1 (CHANGE ORDER)
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-slate-600 dark:text-slate-300">
                    <span className="inline-flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Печатный лист А4</span>
                    </span>
                    <span>·</span>
                    <span>Выгрузка .PDF и .DOC</span>
                    <span>·</span>
                    <span>Строгая JSON-схема</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onStartFreeAudit}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-indigo-600 hover:bg-indigo-600 text-xs font-semibold text-white transition-all active:scale-95 cursor-pointer shrink-0"
                >
                  Перейти в рабочую зону →
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Bottom High-Contrast Call-To-Action Card */}
        <section
          data-testid="landing-bottom-cta"
          aria-label="Запустить аудит"
          className="rounded-3xl bg-[#0B0F19] text-white p-8 sm:p-12 border border-slate-800 shadow-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-6"
        >
          <div className="space-y-2 max-w-2xl">
            <div className="text-xs font-mono text-emerald-400 uppercase tracking-wider">
              Готово к проверке ваших документов
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white text-balance">
              Запустите бесплатный аудит ТЗ и созвона прямо сейчас
            </h2>
            <p className="text-sm text-slate-300">
              Перейдите в рабочую зону, выберите готовый демо-кейс в 1 клик или
              перетащите свои файлы PDF/DOCX/MP3.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <button
              type="button"
              data-testid="landing-bottom-cta-start"
              onClick={onStartFreeAudit}
              className="min-h-[48px] inline-flex items-center justify-center gap-2 px-7 py-3 text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-emerald-500 hover:from-indigo-500 hover:to-emerald-400 rounded-2xl shadow-lg transition-all active:scale-95 cursor-pointer whitespace-nowrap"
            >
              <span>Открыть рабочую зону</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onOpenHistory}
              className="min-h-[48px] inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold text-slate-200 bg-white/10 hover:bg-white/15 border border-white/15 rounded-2xl transition-all active:scale-95 cursor-pointer whitespace-nowrap"
            >
              <span>Архив проверок</span>
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};
