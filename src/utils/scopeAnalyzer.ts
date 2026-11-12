export type SeverityLevel = 'low' | 'medium' | 'critical';

export interface OutOfScopeItem {
  id: number;
  title: string;
  client_quote: string;
  scope_conflict_reason: string;
  suggested_hours: number;
  severity: SeverityLevel;
}

export interface ClientEmailDraft {
  subject: string;
  body: string;
}

export interface ScopeAuditReport {
  project_name: string;
  audit_date: string;
  out_of_scope_items: OutOfScopeItem[];
  in_scope_items: string[];
  client_email_draft: ClientEmailDraft;
  change_order_summary: string;
}

export interface ScopeMetrics {
  totalHours: number;
  totalCost: number;
  criticalCount: number;
  mediumCount: number;
  lowCount: number;
  itemCount: number;
}

/**
 * Enforces the 1 to 40 hours estimation boundary per single scope creep item.
 */
export function clampSuggestedHours(hours: number): number {
  if (!Number.isFinite(hours)) return 4;
  return Math.max(1, Math.min(40, Math.round(hours)));
}

/**
 * Ensures item title stays concise (up to 6 words as specified in schema description).
 */
export function truncateTitleToSixWords(title: string): string {
  const cleaned = title.trim().replace(/\s+/g, ' ');
  if (!cleaned) return 'Дополнительная доработка функционала';
  const words = cleaned.split(' ');
  if (words.length <= 6) return cleaned;
  return words.slice(0, 6).join(' ');
}

/**
 * Calculates aggregate hours, budget impact, and severity breakdown.
 */
export function calculateScopeMetrics(
  items: OutOfScopeItem[],
  hourlyRate: number
): ScopeMetrics {
  const safeRate = Number.isFinite(hourlyRate) && hourlyRate >= 0 ? hourlyRate : 0;
  let totalHours = 0;
  let criticalCount = 0;
  let mediumCount = 0;
  let lowCount = 0;

  for (const item of items) {
    const h = clampSuggestedHours(item.suggested_hours);
    totalHours += h;
    if (item.severity === 'critical') criticalCount += 1;
    else if (item.severity === 'medium') mediumCount += 1;
    else lowCount += 1;
  }

  return {
    totalHours,
    totalCost: totalHours * safeRate,
    criticalCount,
    mediumCount,
    lowCount,
    itemCount: items.length,
  };
}

export type CurrencyCode = 'USD' | 'RUB' | 'EUR' | 'KZT';

export interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  label: string;
  rateToUsd: number;
  defaultHourlyRate: number;
  freelancePriceDisplay: string;
  agencyPriceDisplay: string;
  paymentMethods: string[];
}

export const CURRENCY_CONFIGS: Record<CurrencyCode, CurrencyConfig> = {
  USD: {
    code: 'USD',
    symbol: '$',
    label: 'USD ($)',
    rateToUsd: 1,
    defaultHourlyRate: 50,
    freelancePriceDisplay: '$19',
    agencyPriceDisplay: '$49',
    paymentMethods: [
      'Банковская карта (Stripe)',
      'Криптовалюта (USDT / TON)',
      'Telegram Stars',
    ],
  },
  RUB: {
    code: 'RUB',
    symbol: '₽',
    label: 'RUB (₽)',
    rateToUsd: 95,
    defaultHourlyRate: 4500,
    freelancePriceDisplay: '1 800 ₽',
    agencyPriceDisplay: '4 600 ₽',
    paymentMethods: ['СБП', 'Карта Мир / РФ', 'ЮKassa / T-Bank'],
  },
  EUR: {
    code: 'EUR',
    symbol: '€',
    label: 'EUR (€)',
    rateToUsd: 0.92,
    defaultHourlyRate: 46,
    freelancePriceDisplay: '17.5 €',
    agencyPriceDisplay: '45 €',
    paymentMethods: [
      'Банковская карта (Stripe)',
      'Криптовалюта (USDT / TON)',
      'Telegram Stars',
    ],
  },
  KZT: {
    code: 'KZT',
    symbol: '₸',
    label: 'KZT (₸)',
    rateToUsd: 480,
    defaultHourlyRate: 24000,
    freelancePriceDisplay: '9 000 ₸',
    agencyPriceDisplay: '23 500 ₸',
    paymentMethods: ['Kaspi Pay / QR', 'Карта Казахстана (Halyk/BCC)'],
  },
};

export function getCurrencyConfig(currency: CurrencyCode = 'RUB'): CurrencyConfig {
  return CURRENCY_CONFIGS[currency] ?? CURRENCY_CONFIGS.RUB;
}

export function formatMoney(
  amount: number,
  currency: CurrencyCode = 'RUB'
): string {
  const cfg = getCurrencyConfig(currency);
  const rounded =
    currency === 'USD' || currency === 'EUR'
      ? Math.round(amount * 100) / 100
      : Math.round(amount);
  const formattedNum = rounded.toLocaleString('ru-RU');
  if (currency === 'USD') {
    return `$${formattedNum}`;
  }
  return `${formattedNum} ${cfg.symbol}`;
}

export function convertHourlyRate(
  currentRate: number,
  fromCurrency: CurrencyCode,
  toCurrency: CurrencyCode
): number {
  if (fromCurrency === toCurrency) return currentRate;
  const fromCfg = getCurrencyConfig(fromCurrency);
  const toCfg = getCurrencyConfig(toCurrency);
  const inUsd = currentRate / fromCfg.rateToUsd;
  const rawTarget = inUsd * toCfg.rateToUsd;
  if (toCurrency === 'RUB') return Math.max(500, Math.round(rawTarget / 100) * 100);
  if (toCurrency === 'KZT') return Math.max(2000, Math.round(rawTarget / 500) * 500);
  return Math.max(5, Math.round(rawTarget));
}

export function getPlanPriceDisplay(
  plan: 'freelance' | 'agency',
  currency: CurrencyCode
): string {
  const cfg = getCurrencyConfig(currency);
  return plan === 'freelance'
    ? cfg.freelancePriceDisplay
    : cfg.agencyPriceDisplay;
}

export function getPaymentMethodsForCurrency(currency: CurrencyCode): string[] {
  return getCurrencyConfig(currency).paymentMethods;
}

/**
 * Generates a formal Russian legal Change Order (Дополнительное соглашение) clause.
 */
export function rebuildChangeOrderSummary(
  projectName: string,
  auditDate: string,
  items: OutOfScopeItem[],
  hourlyRate = 4500,
  currency: CurrencyCode = 'RUB'
): string {
  const metrics = calculateScopeMetrics(items, hourlyRate);
  if (items.length === 0) {
    return `ДОПОЛНИТЕЛЬНОЕ СОГЛАШЕНИЕ К ДОГОВОРУ РАЗРАБОТКИ («${projectName}») от ${auditDate}: Дополнительных работ, выходящих за рамки утвержденного Технического задания, не выявлено.`;
  }

  const lines = items.map(
    (item, idx) =>
      `1.${idx + 1}. «${item.title}» (основание: запрос Заказчика ${item.client_quote}; расхождение с ТЗ: ${item.scope_conflict_reason}) — объем трудозатрат: ${clampSuggestedHours(item.suggested_hours)} нормо-ч.`
  );

  const formattedCost = formatMoney(metrics.totalCost, currency);
  const formattedRate = formatMoney(hourlyRate, currency);

  return [
    `ПРИЛОЖЕНИЕ №1 (CHANGE ORDER) К ДОГОВОРУ НА РАЗРАБОТКУ ПРОГРАММНОГО ОБЕСПЕЧЕНИЯ по проекту «${projectName}» от ${auditDate}.`,
    `1. Стороны пришли к соглашению расширить перечень работ по Техническому заданию следующими дополнительными задачами, инициированными Заказчиком в ходе рабочей встречи:`,
    ...lines,
    `2. Совокупная оценка дополнительных трудозатрат Исполнителя составляет ${metrics.totalHours} нормо-часов. При расчетной ставке ${formattedRate}/час стоимость дополнительных работ составляет ${formattedCost} (без НДС).`,
    `3. Сроки сдачи этапа по Основному договору соразмерно сдвигаются на ${Math.max(1, Math.ceil(metrics.totalHours / 6))} рабочих дн. с момента подписания настоящего Дополнительного соглашения и внесения предоплаты.`,
  ].join('\n');
}

/**
 * Generates a diplomatic, calm, non-confrontational client email in Russian.
 */
export function rebuildClientEmailDraft(
  projectName: string,
  items: OutOfScopeItem[],
  inScopeItems: string[],
  hourlyRate = 4500,
  currency: CurrencyCode = 'RUB'
): ClientEmailDraft {
  const metrics = calculateScopeMetrics(items, hourlyRate);
  const subject = `Итоги рабочей встречи по проекту «${projectName}»: фиксация договоренностей и оценка новых задач`;

  const inScopeBlock =
    inScopeItems.length > 0
      ? `1. ЗАДАЧИ В РАМКАХ ТЕКУЩЕГО ТЗ (уже в работе без доплат и сдвига сроков):\n` +
        inScopeItems.map((entry) => `• ${entry}`).join('\n')
      : `1. ЗАДАЧИ В РАМКАХ ТЕКУЩЕГО ТЗ:\n• Все базовые требования согласно исходной спецификации выполняются по графику.`;

  if (items.length === 0) {
    return {
      subject,
      body: `Здравствуйте!\n\nБлагодарим за продуктивный созвон по проекту «${projectName}». Мы сверили все обсуждавшиеся вопросы с нашим текущим Техническим заданием.\n\n${inScopeBlock}\n\nВсе озвученные пожелания полностью укладываются в утвержденный объем работ. Продолжаем разработку в штатном режиме!`,
    };
  }

  const outOfScopeBlock = items
    .map(
      (item, index) =>
        `${index + 1}) ${item.title} — предварительная оценка: ${clampSuggestedHours(item.suggested_hours)} ч (${formatMoney(clampSuggestedHours(item.suggested_hours) * hourlyRate, currency)}).\n   Контекст созвона: ${item.client_quote}\n   Статус по ТЗ: ${item.scope_conflict_reason}`
    )
    .join('\n\n');

  const formattedCost = formatMoney(metrics.totalCost, currency);

  const body = [
    `Здравствуйте!`,
    `Спасибо за продуктивное обсуждение проекта «${projectName}». Мы внимательно разобрали запись встречи и резюмировали все тезисы, чтобы синхронизировать ожидания и защитить сроки запуска основного релиза.`,
    inScopeBlock,
    `2. НОВЫЕ ПОЖЕЛАНИЯ И РАЗВИТИЕ ПРОДУКТА (выходят за рамки утвержденного ТЗ):\nВ ходе обсуждения прозвучали отличные идеи, которые усилят продукт, но требуют дополнительной архитектуры и не были заложены в исходную смету:\n\n${outOfScopeBlock}`,
    `Суммарная оценка дополнительных доработок составляет ${metrics.totalHours} ч. (${formattedCost} по ставке договора).`,
    `Как предлагаем поступить:\nВариант А — Мы фиксируем эти задачи в Дополнительном соглашении (Change Order, проект текста приложен ниже) и включаем их в план работ.\nВариант Б — Чтобы не сдвигать дату ближайшего релиза и не увеличивать бюджет текущего спринта, выносим эти пункты во 2-ю очередь развития (Backlog v1.1) сразу после сдачи базовой версии.`,
    `Подскажите, какой вариант для вас комфортнее по приоритетам и бюджету?`,
    `С уважением,\nКоманда управления проектом и правового сопровождения`,
  ].join('\n\n');

  return { subject, body };
}

/**
 * Validates and normalizes any raw object into a strict ScopeAuditReport.
 */
export function validateAuditReportSchema(
  raw: unknown,
  fallbackProjectName = 'Проект разработки ПО'
): ScopeAuditReport {
  const obj = (typeof raw === 'object' && raw !== null ? raw : {}) as Record<
    string,
    unknown
  >;

  const project_name =
    typeof obj.project_name === 'string' && obj.project_name.trim()
      ? obj.project_name.trim()
      : fallbackProjectName;

  const audit_date =
    typeof obj.audit_date === 'string' && obj.audit_date.trim()
      ? obj.audit_date.trim()
      : new Date().toISOString().slice(0, 10);

  const rawOut = Array.isArray(obj.out_of_scope_items)
    ? obj.out_of_scope_items
    : [];

  const out_of_scope_items: OutOfScopeItem[] = rawOut.map((entry, idx) => {
    const item = (typeof entry === 'object' && entry !== null ? entry : {}) as Record<
      string,
      unknown
    >;
    const rawSeverity =
      typeof item.severity === 'string' ? item.severity.toLowerCase() : 'medium';
    const severity: SeverityLevel =
      rawSeverity === 'critical' || rawSeverity === 'low' || rawSeverity === 'medium'
        ? rawSeverity
        : 'medium';

    return {
      id: typeof item.id === 'number' && Number.isInteger(item.id) ? item.id : idx + 1,
      title: truncateTitleToSixWords(
        typeof item.title === 'string' ? item.title : `Доработка №${idx + 1}`
      ),
      client_quote:
        typeof item.client_quote === 'string' && item.client_quote.trim()
          ? item.client_quote.trim()
          : '[Без таймкода] Запрос в ходе обсуждения',
      scope_conflict_reason:
        typeof item.scope_conflict_reason === 'string' &&
        item.scope_conflict_reason.trim()
          ? item.scope_conflict_reason.trim()
          : 'Отсутствует в утвержденном ТЗ и смете проекта.',
      suggested_hours: clampSuggestedHours(Number(item.suggested_hours ?? 8)),
      severity,
    };
  });

  const in_scope_items: string[] = Array.isArray(obj.in_scope_items)
    ? obj.in_scope_items
        .filter((x): x is string => typeof x === 'string' && x.trim().length > 0)
        .map((x) => x.trim())
    : [];

  const rawEmail = (
    typeof obj.client_email_draft === 'object' && obj.client_email_draft !== null
      ? obj.client_email_draft
      : {}
  ) as Record<string, unknown>;

  const fallbackEmail = rebuildClientEmailDraft(
    project_name,
    out_of_scope_items,
    in_scope_items
  );

  const client_email_draft: ClientEmailDraft = {
    subject:
      typeof rawEmail.subject === 'string' && rawEmail.subject.trim()
        ? rawEmail.subject.trim()
        : fallbackEmail.subject,
    body:
      typeof rawEmail.body === 'string' && rawEmail.body.trim()
        ? rawEmail.body.trim()
        : fallbackEmail.body,
  };

  const change_order_summary =
    typeof obj.change_order_summary === 'string' &&
    obj.change_order_summary.trim()
      ? obj.change_order_summary.trim()
      : rebuildChangeOrderSummary(project_name, audit_date, out_of_scope_items);

  return {
    project_name,
    audit_date,
    out_of_scope_items,
    in_scope_items,
    client_email_draft,
    change_order_summary,
  };
}

/**
 * Deterministic rule-based scope creep extractor used as instant local analyzer or fallback.
 */
export function analyzeDocumentsHeuristic(
  projectName: string,
  specText: string,
  transcriptText: string,
  auditDate = '2026-11-11',
  hourlyRate = 4500
): ScopeAuditReport {
  const cleanProject = projectName.trim() || 'Аудит проекта';
  const lines = transcriptText
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(Boolean);

  const outOfScope: OutOfScopeItem[] = [];
  const inScope: string[] = [];

  const triggerPatterns: Array<{
    regex: RegExp;
    title: string;
    reason: string;
    hours: number;
    severity: SeverityLevel;
  }> = [
    {
      regex: /1с|erp|sap|битрикс24|bitrix|amo|амо/i,
      title: 'Двусторонняя интеграция с внешней системой',
      reason:
        'В ТЗ не предусмотрена двусторонняя синхронизация с внешними учетными системами (ERP/1С/CRM).',
      hours: 28,
      severity: 'critical',
    },
    {
      regex: /телеграм|telegram|чат-?бот|бот\b|бота\b|боту\b|ботом\b|whatsapp|мессенджер/i,
      title: 'Разработка бота и уведомлений мессенджеров',
      reason:
        'В исходном ТЗ зафиксированы только базовые Email-уведомления; разработка Telegram/WhatsApp-бота отсутствует в смете.',
      hours: 18,
      severity: 'medium',
    },
    {
      regex: /темн(ая|ую)\s+тем|dark\s*mode|анимац|3d|кастомн.*дизайн/i,
      title: 'Кастомная темная тема и анимации',
      reason:
        'Раздел UI/UX ТЗ предусматривает только одну светлую дизайн-тему по базовому UI-киту без темного режима.',
      hours: 14,
      severity: 'low',
    },
    {
      regex: /мультиязыч|английск|китайск|локализац|i18n|валют/i,
      title: 'Мультиязычная локализация и мульти-валютность',
      reason:
        'Пункт 1.2 ТЗ фиксирует разработку интерфейса исключительно на русском языке и расчеты в одной базовой валюте.',
      hours: 22,
      severity: 'medium',
    },
    {
      regex: /приложени(е|я)|ios|android|мобильн.*приложен|pwa|офлайн/i,
      title: 'Мобильное приложение и офлайн-режим',
      reason:
        'Предмет договора ограничен адаптивным веб-приложением; нативная/офлайн мобильная функциональность не входит в ТЗ.',
      hours: 36,
      severity: 'critical',
    },
    {
      regex: /роли|права\s+доступа|суперадмин|аудит\s+лог|rbac|иерархи/i,
      title: 'Гибкая ролевая матрица прав доступа',
      reason:
        'В ТЗ заложены только 2 фиксированные роли (Администратор и Пользователь) без конструктора гранулярных прав.',
      hours: 20,
      severity: 'medium',
    },
    {
      regex: /экспорт|pdf|excel|xlsx|отчет.*конструктор|bi|аналитик/i,
      title: 'Генерация кастомных PDF/Excel отчетов',
      reason:
        'Раздел отчетности в ТЗ включает только просмотр таблицы в браузере без генератора печатных форм PDF/XLSX.',
      hours: 12,
      severity: 'low',
    },
  ];

  for (const line of lines) {
    let matchedOut = false;
    for (const pat of triggerPatterns) {
      if (pat.regex.test(line)) {
        // Check if already in spec explicitly as included
        const alreadyExcludedInSpec =
          specText.toLowerCase().includes('не входит') ||
          !pat.regex.test(specText);
        if (alreadyExcludedInSpec && !outOfScope.some((i) => i.title === pat.title)) {
          outOfScope.push({
            id: outOfScope.length + 1,
            title: truncateTitleToSixWords(pat.title),
            client_quote: line,
            scope_conflict_reason: pat.reason,
            suggested_hours: clampSuggestedHours(pat.hours),
            severity: pat.severity,
          });
          matchedOut = true;
        }
      }
    }

    if (
      !matchedOut &&
      /авторизац|каталог|корзин|базов|по\s+тз|стандартн|главн.*страниц|фильтр/i.test(
        line
      )
    ) {
      if (inScope.length < 4) {
        inScope.push(
          `Подтверждена реализация штатного функционала из ТЗ: «${line.slice(0, 110)}»`
        );
      }
    }
  }

  if (outOfScope.length === 0 && lines.length > 0) {
    outOfScope.push({
      id: 1,
      title: 'Дополнительные правки вне исходного ТЗ',
      client_quote: lines[lines.length - 1],
      scope_conflict_reason:
        'Требование озвучено устно на созвоне и отсутствует в зафиксированной спецификации Приложения №1.',
      suggested_hours: 10,
      severity: 'medium',
    });
  }

  if (inScope.length === 0) {
    inScope.push(
      'Базовая архитектура и ключевые пользовательские сценарии в рамках утвержденного Технического задания'
    );
  }

  const client_email_draft = rebuildClientEmailDraft(
    cleanProject,
    outOfScope,
    inScope,
    hourlyRate
  );
  const change_order_summary = rebuildChangeOrderSummary(
    cleanProject,
    auditDate,
    outOfScope,
    hourlyRate
  );

  return {
    project_name: cleanProject,
    audit_date: auditDate,
    out_of_scope_items: outOfScope,
    in_scope_items: inScope,
    client_email_draft,
    change_order_summary,
  };
}

export type SubscriptionTier = 'free' | 'freelance' | 'agency';

export interface FreemiumState {
  tier: SubscriptionTier;
  usedAudits: number;
  maxFreeAudits: number;
  freelanceQuota: number;
  agencyBrandName: string;
  executorRequisites: string;
  clientRequisites: string;
}

export const FREE_AUDIT_LIMIT = 2;
export const FREELANCE_AUDIT_LIMIT = 20;

export function createInitialFreemiumState(): FreemiumState {
  return {
    tier: 'free',
    usedAudits: 0,
    maxFreeAudits: FREE_AUDIT_LIMIT,
    freelanceQuota: FREELANCE_AUDIT_LIMIT,
    agencyBrandName: 'ScopeGuard Legal Agency',
    executorRequisites: 'ООО «ИТ-Агентство Разработки», ИНН 7701234567 / КПП 770101001',
    clientRequisites: 'ООО «Заказчик Проекта», ИНН 7709876543 / КПП 770901001',
  };
}

export function getRemainingAudits(state: FreemiumState): number | 'unlimited' {
  if (state.tier === 'agency') return 'unlimited';
  if (state.tier === 'freelance') {
    return Math.max(0, state.freelanceQuota - state.usedAudits);
  }
  return Math.max(0, state.maxFreeAudits - state.usedAudits);
}

export function canPerformAudit(state: FreemiumState): boolean {
  const remaining = getRemainingAudits(state);
  if (remaining === 'unlimited') return true;
  return remaining > 0;
}

export function consumeAuditQuota(state: FreemiumState): FreemiumState {
  if (!canPerformAudit(state)) {
    return state;
  }
  return {
    ...state,
    usedAudits: state.usedAudits + 1,
  };
}

export function upgradeSubscription(
  state: FreemiumState,
  newTier: 'freelance' | 'agency',
  customAgencyBrand?: string
): FreemiumState {
  return {
    ...state,
    tier: newTier,
    usedAudits: 0,
    agencyBrandName:
      customAgencyBrand && customAgencyBrand.trim()
        ? customAgencyBrand.trim()
        : state.agencyBrandName,
  };
}

export function formatQuotaBadgeText(state: FreemiumState): string {
  if (state.tier === 'agency') {
    return 'Тариф Agency: Безлимит';
  }
  if (state.tier === 'freelance') {
    const rem = getRemainingAudits(state);
    return `Тариф Freelance: ${rem}/${state.freelanceQuota}`;
  }
  const rem = getRemainingAudits(state);
  return `Бесплатных проверок осталось: ${rem}/${state.maxFreeAudits}`;
}

export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024; // 25 MB

export const ALLOWED_SPEC_EXTENSIONS = ['.pdf', '.docx', '.doc', '.txt', '.md'];
export const ALLOWED_TRANSCRIPT_EXTENSIONS = [
  '.mp3',
  '.wav',
  '.m4a',
  '.ogg',
  '.mp4',
  '.webm',
  '.txt',
  '.pdf',
  '.docx',
];

export interface FileValidationResult {
  valid: boolean;
  error?: string;
  extension: string;
}

export function getFileExtension(filename: string): string {
  const clean = filename.trim().toLowerCase();
  const idx = clean.lastIndexOf('.');
  return idx >= 0 ? clean.slice(idx) : '';
}

export function validateUploadedFileMeta(
  filename: string,
  sizeBytes: number,
  fieldType: 'spec' | 'transcript'
): FileValidationResult {
  const ext = getFileExtension(filename);
  const allowed =
    fieldType === 'spec'
      ? ALLOWED_SPEC_EXTENSIONS
      : ALLOWED_TRANSCRIPT_EXTENSIONS;

  if (!ext || !allowed.includes(ext)) {
    return {
      valid: false,
      extension: ext,
      error:
        fieldType === 'spec'
          ? `Неподдерживаемый формат файла ТЗ (${ext || 'без расширения'}). Разрешены: PDF, DOCX, TXT.`
          : `Неподдерживаемый формат записи встречи (${ext || 'без расширения'}). Разрешены: MP3, WAV, M4A, MP4, WEBM, TXT, PDF, DOCX.`,
    };
  }

  if (!Number.isFinite(sizeBytes) || sizeBytes <= 0) {
    return {
      valid: false,
      extension: ext,
      error: 'Файл пуст или поврежден.',
    };
  }

  if (sizeBytes > MAX_UPLOAD_BYTES) {
    return {
      valid: false,
      extension: ext,
      error: `Размер файла превышает максимально допустимый лимит 25 МБ.`,
    };
  }

  return {
    valid: true,
    extension: ext,
  };
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} Б`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} КБ`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} МБ`;
}

export type ActiveNavTab = 'audit' | 'history' | 'pricing';

export interface AuditHistoryEntry {
  id: string;
  projectName: string;
  contractNumber: string;
  auditDate: string;
  createdAtIso: string;
  hourlyRate: number;
  currency: CurrencyCode;
  totalHours: number;
  totalCost: number;
  outOfScopeCount: number;
  criticalCount: number;
  specText: string;
  transcriptText: string;
  report: ScopeAuditReport;
}

export function buildAuditHistoryEntry(params: {
  id?: string;
  projectName: string;
  contractNumber: string;
  auditDate: string;
  hourlyRate: number;
  currency: CurrencyCode;
  specText: string;
  transcriptText: string;
  report: ScopeAuditReport;
  createdAtIso?: string;
}): AuditHistoryEntry {
  const metrics = calculateScopeMetrics(
    params.report.out_of_scope_items,
    params.hourlyRate
  );
  const cleanProject =
    params.projectName.trim() ||
    params.report.project_name.trim() ||
    'Аудит ИТ-проекта';
  const cleanDate =
    params.auditDate.trim() ||
    params.report.audit_date.trim() ||
    new Date().toISOString().slice(0, 10);

  return {
    id:
      params.id ||
      `audit-${cleanDate}-${Date.now().toString(36)}-${Math.random()
        .toString(36)
        .slice(2, 6)}`,
    projectName: cleanProject,
    contractNumber: params.contractNumber.trim() || 'Договор б/н',
    auditDate: cleanDate,
    createdAtIso: params.createdAtIso || new Date().toISOString(),
    hourlyRate: params.hourlyRate,
    currency: params.currency,
    totalHours: metrics.totalHours,
    totalCost: metrics.totalCost,
    outOfScopeCount: metrics.itemCount,
    criticalCount: metrics.criticalCount,
    specText: params.specText,
    transcriptText: params.transcriptText,
    report: params.report,
  };
}

export function upsertAuditHistoryEntry(
  entries: AuditHistoryEntry[],
  newEntry: AuditHistoryEntry
): AuditHistoryEntry[] {
  const withoutDuplicate = entries.filter(
    (item) =>
      item.id !== newEntry.id &&
      !(
        item.projectName.toLowerCase() === newEntry.projectName.toLowerCase() &&
        item.auditDate === newEntry.auditDate &&
        item.outOfScopeCount === newEntry.outOfScopeCount &&
        item.totalHours === newEntry.totalHours
      )
  );
  return [newEntry, ...withoutDuplicate].slice(0, 50);
}

export function deleteAuditHistoryEntry(
  entries: AuditHistoryEntry[],
  idToDelete: string
): AuditHistoryEntry[] {
  return entries.filter((item) => item.id !== idToDelete);
}

export function filterAuditHistory(
  entries: AuditHistoryEntry[],
  searchQuery: string,
  dateFilter: string
): AuditHistoryEntry[] {
  const q = searchQuery.trim().toLowerCase();
  const d = dateFilter.trim();

  return entries.filter((entry) => {
    const matchesSearch =
      !q ||
      entry.projectName.toLowerCase().includes(q) ||
      entry.contractNumber.toLowerCase().includes(q) ||
      entry.report.out_of_scope_items.some((item) =>
        item.title.toLowerCase().includes(q)
      );

    const matchesDate = !d || d === 'all' || entry.auditDate === d;
    return matchesSearch && matchesDate;
  });
}



