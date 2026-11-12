import React from 'react';
import {
  ArrowRight,
  Briefcase,
  Building2,
  Calculator,
  CheckCircle2,
  Clock,
  FileSearch,
  Layers,
  MailCheck,
  Printer,
  Scale,
  ShieldCheck,
  Users,
} from 'lucide-react';
import {
  formatMoney,
  formatQuotaBadgeText,
  type CurrencyCode,
  type FreemiumState,
} from '../utils/scopeAnalyzer';

interface LandingPageProps {
  currency: CurrencyCode;
  hourlyRate: number;
  freemiumState: FreemiumState;
  onStartFreeAudit: () => void;
  onViewSampleReport: () => void;
  onOpenHistory: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  currency,
  hourlyRate,
  freemiumState,
  onStartFreeAudit,
  onViewSampleReport,
  onOpenHistory,
}) => {
  const sampleProtectedHours = 46;
  const sampleProtectedAmount = formatMoney(
    sampleProtectedHours * hourlyRate,
    currency
  );
  const quotaBadge = formatQuotaBadgeText(freemiumState);

  const steps = [
    {
      num: '01.',
      title: 'Загрузите договор/ТЗ и расшифровку звонка',
      description:
        'Прикрепите исходную спецификацию (PDF, DOCX, TXT) и аудиозапись встречи с заказчиком (MP3, WAV, M4A) либо вставьте текст переписки из мессенджера.',
      detail: 'Поддержка файлов до 25 МБ · Прямая передача в Gemini File API',
    },
    {
      num: '02.',
      title: 'ИИ сопоставит требования и найдет выходы за рамки сметы',
      description:
        'Система посекундно сверяет каждое озвученное пожелание клиента с пунктами ТЗ, отделяет штатные задачи от скрытого Scope Creep и оценивает трудоемкость.',
      detail: 'Точные таймкоды цитат · Оценка от 1 до 40 нормо-часов на задачу',
    },
    {
      num: '03.',
      title:
        'Получите готовый Change Order, доп. соглашение и дипломатичное письмо',
      description:
        'Отправьте клиенту спокойное аргументированное резюме встречи без конфронтации и выгрузите официальный бланк Дополнительного соглашения в PDF или Word.',
      detail: 'Готовый юридический текст · Расчет стоимости и сдвига дедлайна',
    },
  ];

  const audiences = [
    {
      icon: Building2,
      title: 'Веб-студии и Digital-агентства',
      role: 'Защита маржинальности Fixed-Price проектов',
      description:
        'Исключите бесплатные итерации дизайна, верстки и фронтенда, когда заказчик просит «слегка докрутить личный кабинет» перед самой сдачей этапа.',
      metric: '+24% сохраненной рентабельности спринта',
    },
    {
      icon: Layers,
      title: 'IT-интеграторы и заказная разработка',
      role: 'Контроль границ ТЗ на сложных внедрениях',
      description:
        'Фиксируйте все устные запросы на двусторонний обмен с 1С/ERP, кастомные ролевые матрицы RBAC и внешние API-шлюзы в официальные доп. соглашения.',
      metric: '100% прозрачность истории изменений ТЗ',
    },
    {
      icon: Briefcase,
      title: 'Продакт- и проджект-менеджеры',
      role: 'Переговоры с заказчиком без стресса и конфликтов',
      description:
        'Делегируйте системе подготовку юридических формулировок и дипломатичных писем, сохраняя партнерские отношения с клиентом и защищая команду от переработок.',
      metric: 'Экономия до 4 часов PM-работы после каждого созвона',
    },
    {
      icon: Users,
      title: 'Фриланс-команды и подрядчики',
      role: 'Быстрая аргументация доплат за новые задачи',
      description:
        'Переводите неформальные пожелания из голосовых сообщений и звонков в четкую смету нормо-часов и брендированный PDF-документ на подпись.',
      metric: 'Оформление Change Order за 30 секунд',
    },
  ];

  return (
    <div
      data-testid="landing-page"
      className="space-y-8 sm:space-y-12 pb-6 text-slate-900 dark:text-slate-100"
    >
      {/* 1. HERO SECTION */}
      <section
        data-testid="landing-hero"
        aria-label="О продукте ScopeGuard Legal"
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 lg:p-10"
      >
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-stretch">
          {/* Left Column: Value Proposition & Primary Actions */}
          <div className="xl:col-span-7 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                  ScopeGuard Legal B2B
                </span>
                <span aria-hidden="true">·</span>
                <span>Юридическая и техническая защита ИТ-исполнителей</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono tabular-nums">Аудит за 30 сек</span>
              </div>

              <h1 className="text-2xl sm:text-4xl lg:text-[42px] font-bold tracking-tight text-slate-900 dark:text-white leading-[1.15] text-balance">
                Защитите бюджет проектов от бесплатных «хотелок» заказчика
                (Scope Creep)
              </h1>

              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl">
                Автоматический юридический и технический аудит исходного ТЗ,
                договора и записи созвона с клиентом за 30 секунд. Находим
                скрытые доработки с привязкой к таймкодам, рассчитываем
                нормо-часы и формируем готовое Дополнительное соглашение (Change
                Order) вместе с дипломатичным письмом заказчику.
              </p>
            </div>

            <div className="space-y-4 pt-2">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <button
                  type="button"
                  data-testid="landing-cta-start"
                  onClick={onStartFreeAudit}
                  className="min-h-[48px] inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-colors cursor-pointer whitespace-nowrap"
                >
                  <span>Запустить бесплатный аудит</span>
                  <ArrowRight className="w-4 h-4 shrink-0" />
                </button>

                <button
                  type="button"
                  data-testid="landing-cta-sample"
                  onClick={onViewSampleReport}
                  className="min-h-[48px] inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold text-slate-800 dark:text-slate-100 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl transition-colors cursor-pointer whitespace-nowrap"
                >
                  <FileSearch className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                  <span>Посмотреть пример отчета</span>
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                <span>{quotaBadge}</span>
                <span aria-hidden="true">·</span>
                <span>Поддержка PDF, DOCX, TXT, MP3, WAV</span>
                <span aria-hidden="true">·</span>
                <span>Выгрузка Change Order в PDF и Word</span>
              </div>
            </div>
          </div>

          {/* Right Column: Live Legal Audit Specimen Card */}
          <div className="xl:col-span-5 flex flex-col justify-between bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                  ПРИМЕР ОБНАРУЖЕНИЯ SCOPE CREEP
                </div>
                <div className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                  Разработка B2B-портала дистрибуции
                </div>
              </div>
              <span className="text-xs font-mono tabular-nums font-semibold text-red-600 dark:text-red-400 whitespace-nowrap shrink-0">
                Критично · +28 ч
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5">
                <div className="font-mono text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold">
                  Цитата созвона [14:20]
                </div>
                <p className="text-slate-700 dark:text-slate-200 italic leading-relaxed">
                  «Давайте сразу сделаем двустороннюю синхронизацию остатков и
                  резервов с нашей 1С:ERP каждые 5 минут, без этого запуск не
                  имеет смысла».
                </p>
              </div>

              <div className="p-3.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5">
                <div className="font-mono text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
                  Юридическое обоснование расхождения с ТЗ
                </div>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  Противоречит п. 3.4 Приложения №1 к Договору: в утвержденной
                  смете предусмотрен только односторонний импорт каталога из
                  CSV/XML раз в сутки.
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
              <div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  Защищенный бюджет по Change Order
                </div>
                <div className="text-lg font-bold font-mono tabular-nums text-indigo-600 dark:text-indigo-400">
                  +{sampleProtectedAmount}
                </div>
              </div>
              <div className="text-right font-mono tabular-nums text-xs text-slate-600 dark:text-slate-300">
                <div>+{sampleProtectedHours} нормо-ч</div>
                <div className="text-slate-500 dark:text-slate-400">
                  Сдвиг +8 раб. дн.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Full-Width 4-Column Quantitative Proof Row below Hero Split */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 pt-6 mt-6 border-t border-slate-200 dark:border-slate-800">
          <div>
            <div className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
              30 секунд
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Среднее время полной сверки ТЗ и стенограммы встречи
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
              1–40 нормо-ч
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Калиброванная оценка каждой дополнительной доработки
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-indigo-600 dark:text-indigo-400">
              4 документа
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Реестр правок, письмо клиенту, Change Order PDF и JSON-отчет
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
              2 проверки
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Доступны бесплатно сразу без привязки банковской карты
            </div>
          </div>
        </div>
      </section>

      {/* 2. HOW IT WORKS (3 CLEAR STEPS) */}
      <section
        data-testid="landing-how-it-works"
        aria-label="Как это работает"
        className="space-y-5"
      >
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <div className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
              Регламент работы системы
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white mt-1 text-balance">
              Как это работает: от записи созвона до подписанного доп.
              соглашения
            </h2>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-mono whitespace-nowrap shrink-0">
            3 простых шага без ручной вычитки протоколов
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {steps.map((step) => (
            <div
              key={step.num}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="text-lg font-bold font-mono tabular-nums text-indigo-600 dark:text-indigo-400">
                  {step.num}
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                  {step.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {step.description}
                </p>
              </div>
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-xs font-mono text-slate-500 dark:text-slate-400">
                {step.detail}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. KEY CAPABILITIES (ASYMMETRIC BENTO GRID) */}
      <section
        data-testid="landing-features"
        aria-label="Ключевые возможности"
        className="space-y-5"
      >
        <div>
          <div className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
            Инструментарий проджект-менеджера и юриста
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white mt-1 text-balance">
            Ключевые возможности для защиты сметы и сроков разработки
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Feature 1: Span 7 */}
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <Clock className="w-5 h-5" />
              </div>
              <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                Таймкоды · Пункты договора · Входящие в ТЗ задачи
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              01. Поиск противоречий с ТЗ с привязкой к таймкодам созвона
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Каждая найденная «хотелка» подкрепляется дословной цитатой
              заказчика из аудиозаписи или стенограммы и четким юридическим
              объяснением, почему задача не входит в исходную спецификацию.
              Параллельно формируется список задач, которые уже входят в ТЗ,
              чтобы успокоить клиента.
            </p>
          </div>

          {/* Feature 2: Span 5 */}
          <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <Calculator className="w-5 h-5" />
              </div>
              <span className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
                USD · RUB · EUR · KZT
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              02. Авторасчет нормо-часов и сдвига дедлайна
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Интерактивная таблица позволяет на лету корректировать оценку
              каждой задачи (от 1 до 40 ч), менять часовую ставку, валюту
              расчета и мгновенно видеть итоговую сумму доплаты и правовой сдвиг
              сроков релиза в рабочих днях.
            </p>
          </div>

          {/* Feature 3: Span 5 */}
          <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <MailCheck className="w-5 h-5" />
              </div>
              <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                Дипломатичный тон · Без конфронтации
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              03. Генератор дипломатичных писем для переговоров
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Готовое письмо для отправки в почту или мессенджер: подтверждает
              выполнение базового объема работ по графику и мягко предлагает
              клиенту выбор — оформить Change Order сейчас или перенести новые
              идеи во 2-й этап (Backlog v1.1).
            </p>
          </div>

          {/* Feature 4: Span 7 */}
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <Scale className="w-5 h-5" />
              </div>
              <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                Печатная форма PDF · Word (.doc) · JSON Schema
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              04. Юридическое доп. соглашение (Change Order) и экспорт в PDF
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Формирование официального Приложения к договору на разработку ПО с
              реквизитами сторон, брендингом вашего агентства, спецификацией
              дополнительных работ, расчетом стоимости и местом для подписей
              Заказчика и Исполнителя.
            </p>
          </div>
        </div>
      </section>

      {/* 4. WHO IT IS FOR */}
      <section
        data-testid="landing-audience"
        aria-label="Для кого подходит"
        className="space-y-5"
      >
        <div>
          <div className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
            Профильные сценарии применения
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white mt-1 text-balance">
            Для кого создан ScopeGuard Legal
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {audiences.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {item.role}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {item.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 text-xs font-mono text-indigo-600 dark:text-indigo-400 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>{item.metric}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 5. BOTTOM CTA BLOCK */}
      <section
        data-testid="landing-bottom-cta"
        aria-label="Запустить бесплатную проверку"
        className="bg-slate-900 dark:bg-indigo-950/60 border border-slate-800 dark:border-indigo-900/60 rounded-2xl p-6 sm:p-8 lg:p-10 text-white"
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2 text-xs font-mono text-indigo-300">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>Быстрый старт без регистрации и привязки карты</span>
            </div>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-white text-balance">
              Протестируйте 2 бесплатных аудита прямо сейчас на ваших реальных
              документах
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Загрузите текущее ТЗ и запись последнего созвона с заказчиком или
              изучите готовые кейсы из библиотеки проверок.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <button
              type="button"
              data-testid="landing-bottom-cta-start"
              onClick={onStartFreeAudit}
              className="min-h-[48px] inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-colors cursor-pointer whitespace-nowrap"
            >
              <span>Перейти к аудиту ТЗ</span>
              <ArrowRight className="w-4 h-4 shrink-0" />
            </button>

            <button
              type="button"
              onClick={onOpenHistory}
              className="min-h-[48px] inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold text-slate-100 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-colors cursor-pointer whitespace-nowrap"
            >
              <Printer className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>Библиотека отчетов</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
