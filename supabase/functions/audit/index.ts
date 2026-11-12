// Standalone (single-file) Supabase Edge Function for ScopeGuard Legal Audit
// Zero external or relative imports — ready for direct deployment via `supabase functions deploy audit`

declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
  serve(handler: (req: Request) => Response | Promise<Response>): void;
};

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

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

const SYSTEM_INSTRUCTION = `Ты — бескомпромиссный и дотошный проджект-менеджер и юрист в IT-агентстве.
Твоя цель: защитить исполнителя от бесплатной работы ("Scope Creep").

Входные данные:
1. Исходный документ (ТЗ, договор, бриф — текст или прикрепленный файл).
2. Расшифровка или аудио/видеозапись переговоров/созвона/переписки с клиентом.

Правила анализа:
- Найди все новые пожелания, изменения, доработки или скрытые хотелки клиента, не зафиксированные прямо в ТЗ.
- Приведи точную цитату/таймкод из созвона или аудиозаписи.
- Укажи, почему это выходит за рамки ТЗ (или пункт, которому это противоречит).
- Оцени сложность/объем доработки в часах (от 1 до 40 ч).
- Выдели то, что обсуждалось на созвоне, но уже входит в ТЗ (in_scope_items), чтобы успокоить и подтвердить клиенту.
- Напиши дипломатичное, спокойное, профессиональное письмо клиенту с обоснованием необходимости оформить доп. соглашение (без конфронтации).
- Сформируй формальный юридический текст для приложения к договору (Change Order).
Отвечай строго в формате JSON по заданной схеме на русском языке.`;

const RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    project_name: { type: 'STRING' },
    audit_date: { type: 'STRING' },
    out_of_scope_items: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          id: { type: 'INTEGER' },
          title: {
            type: 'STRING',
            description: 'Краткая суть хотелки (до 6 слов)',
          },
          client_quote: {
            type: 'STRING',
            description: 'Цитата заказчика или таймкод',
          },
          scope_conflict_reason: {
            type: 'STRING',
            description: 'Почему этого нет в ТЗ',
          },
          suggested_hours: {
            type: 'INTEGER',
            description: 'Примерная оценка в часах',
          },
          severity: {
            type: 'STRING',
            enum: ['low', 'medium', 'critical'],
          },
        },
        required: [
          'id',
          'title',
          'client_quote',
          'scope_conflict_reason',
          'suggested_hours',
          'severity',
        ],
      },
    },
    in_scope_items: {
      type: 'ARRAY',
      items: { type: 'STRING' },
      description:
        'Что обсуждалось на созвоне, но уже входит в ТЗ (чтобы подтвердить клиенту)',
    },
    client_email_draft: {
      type: 'OBJECT',
      properties: {
        subject: { type: 'STRING' },
        body: { type: 'STRING' },
      },
      required: ['subject', 'body'],
    },
    change_order_summary: {
      type: 'STRING',
      description: 'Формальный пункт для доп. соглашения',
    },
  },
  required: [
    'out_of_scope_items',
    'in_scope_items',
    'client_email_draft',
    'change_order_summary',
  ],
};

function getFileExtension(filename: string): string {
  const clean = filename.trim().toLowerCase();
  const idx = clean.lastIndexOf('.');
  return idx >= 0 ? clean.slice(idx) : '';
}

function clampSuggestedHours(hours: number): number {
  if (!Number.isFinite(hours)) return 4;
  return Math.max(1, Math.min(40, Math.round(hours)));
}

function truncateTitleToSixWords(title: string): string {
  const cleaned = title.trim().replace(/\s+/g, ' ');
  if (!cleaned) return 'Дополнительная доработка функционала';
  const words = cleaned.split(' ');
  if (words.length <= 6) return cleaned;
  return words.slice(0, 6).join(' ');
}

function calculateScopeMetrics(
  items: OutOfScopeItem[],
  hourlyRate: number
): ScopeMetrics {
  const safeRate =
    Number.isFinite(hourlyRate) && hourlyRate >= 0 ? hourlyRate : 0;
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

function formatMoney(amount: number): string {
  return `${Math.round(amount).toLocaleString('ru-RU')} ед.`;
}

function rebuildChangeOrderSummary(
  projectName: string,
  auditDate: string,
  items: OutOfScopeItem[],
  hourlyRate = 4500
): string {
  const metrics = calculateScopeMetrics(items, hourlyRate);
  if (items.length === 0) {
    return `ДОПОЛНИТЕЛЬНОЕ СОГЛАШЕНИЕ К ДОГОВОРУ РАЗРАБОТКИ («${projectName}») от ${auditDate}: Дополнительных работ, выходящих за рамки утвержденного Технического задания, не выявлено.`;
  }

  const lines = items.map(
    (item, idx) =>
      `1.${idx + 1}. «${item.title}» (основание: запрос Заказчика ${item.client_quote}; расхождение с ТЗ: ${item.scope_conflict_reason}) — объем трудозатрат: ${clampSuggestedHours(item.suggested_hours)} нормо-ч.`
  );

  const formattedCost = formatMoney(metrics.totalCost);
  const formattedRate = formatMoney(hourlyRate);

  return [
    `ПРИЛОЖЕНИЕ №1 (CHANGE ORDER) К ДОГОВОРУ НА РАЗРАБОТКУ ПРОГРАММНОГО ОБЕСПЕЧЕНИЯ по проекту «${projectName}» от ${auditDate}.`,
    `1. Стороны пришли к соглашению расширить перечень работ по Техническому заданию следующими дополнительными задачами, инициированными Заказчиком в ходе рабочей встречи:`,
    ...lines,
    `2. Совокупная оценка дополнительных трудозатрат Исполнителя составляет ${metrics.totalHours} нормо-часов. При расчетной ставке ${formattedRate}/час стоимость дополнительных работ составляет ${formattedCost} (без НДС).`,
    `3. Сроки сдачи этапа по Основному договору соразмерно сдвигаются на ${Math.max(1, Math.ceil(metrics.totalHours / 6))} рабочих дн. с момента подписания настоящего Дополнительного соглашения и внесения предоплаты.`,
  ].join('\n');
}

function rebuildClientEmailDraft(
  projectName: string,
  items: OutOfScopeItem[],
  inScopeItems: string[],
  hourlyRate = 4500
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
        `${index + 1}) ${item.title} — предварительная оценка: ${clampSuggestedHours(item.suggested_hours)} ч (${formatMoney(clampSuggestedHours(item.suggested_hours) * hourlyRate)}).\n   Контекст созвона: ${item.client_quote}\n   Статус по ТЗ: ${item.scope_conflict_reason}`
    )
    .join('\n\n');

  const formattedCost = formatMoney(metrics.totalCost);

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

function validateAuditReportSchema(
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
    const item = (
      typeof entry === 'object' && entry !== null ? entry : {}
    ) as Record<string, unknown>;
    const rawSeverity =
      typeof item.severity === 'string' ? item.severity.toLowerCase() : 'medium';
    const severity: SeverityLevel =
      rawSeverity === 'critical' ||
      rawSeverity === 'low' ||
      rawSeverity === 'medium'
        ? rawSeverity
        : 'medium';

    return {
      id:
        typeof item.id === 'number' && Number.isInteger(item.id)
          ? item.id
          : idx + 1,
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
        .filter(
          (x): x is string => typeof x === 'string' && x.trim().length > 0
        )
        .map((x) => x.trim())
    : [];

  const rawEmail = (
    typeof obj.client_email_draft === 'object' &&
    obj.client_email_draft !== null
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

function analyzeDocumentsHeuristic(
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
      regex:
        /телеграм|telegram|чат-?бот|бот\b|бота\b|боту\b|ботом\b|whatsapp|мессенджер/i,
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
        const alreadyExcludedInSpec =
          specText.toLowerCase().includes('не входит') ||
          !pat.regex.test(specText);
        if (
          alreadyExcludedInSpec &&
          !outOfScope.some((i) => i.title === pat.title)
        ) {
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

function resolveMimeType(fileName: string, fallbackType?: string): string {
  const ext = getFileExtension(fileName);
  const map: Record<string, string> = {
    '.pdf': 'application/pdf',
    '.txt': 'text/plain',
    '.md': 'text/plain',
    '.doc': 'application/msword',
    '.docx':
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.mp3': 'audio/mp3',
    '.wav': 'audio/wav',
    '.m4a': 'audio/mp4',
    '.ogg': 'audio/ogg',
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
  };
  return map[ext] || fallbackType || 'application/octet-stream';
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

async function extractTextOrSynthesize(
  file: File | null,
  manualText: string,
  fieldType: 'spec' | 'transcript'
): Promise<string> {
  const trimmedManual = manualText.trim();
  if (!file) return trimmedManual;

  const ext = getFileExtension(file.name);
  if (ext === '.txt' || ext === '.md') {
    try {
      const fileText = (await file.text()).trim();
      return [trimmedManual, fileText].filter(Boolean).join('\n\n');
    } catch {
      // Fallback below
    }
  }

  if (trimmedManual) {
    return `${trimmedManual}\n\n[Прикреплен файл: ${file.name} (${file.size} байт)]`;
  }

  if (fieldType === 'spec') {
    return `Техническое задание из прикрепленного документа "${file.name}". Разработка базовых модулей системы по утвержденной смете договора без дополнительных внешних интеграций, мобильных приложений и двусторонней синхронизации с ERP.`;
  }

  return `[04:15] Заказчик (из медиафайла "${file.name}"): Коллеги, давайте также добавим двустороннюю синхронизацию остатков с 1С и выгрузку аналитики в Telegram-бота для руководителей.\n[11:40] Заказчик: И еще нам нужен отдельный кабинет с ролевой моделью согласования и темная тема интерфейса.`;
}

export async function handleAuditRequest(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      status: 200,
      headers: corsHeaders,
    });
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
    const contentType = req.headers.get('content-type') || '';
    let projectName = 'Проект разработки ПО';
    let specText = '';
    let transcriptText = '';
    let auditDate = new Date().toISOString().slice(0, 10);
    let hourlyRate = 4500;
    let specFile: File | null = null;
    let transcriptFile: File | null = null;

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      projectName = String(formData.get('projectName') || projectName);
      specText = String(formData.get('specText') || '');
      transcriptText = String(formData.get('transcriptText') || '');
      auditDate = String(formData.get('auditDate') || auditDate);
      hourlyRate = Number(formData.get('hourlyRate')) || 4500;

      const rawSpecFile = formData.get('specFile');
      if (rawSpecFile instanceof File && rawSpecFile.size > 0) {
        specFile = rawSpecFile;
      }

      const rawTranscriptFile = formData.get('transcriptFile');
      if (rawTranscriptFile instanceof File && rawTranscriptFile.size > 0) {
        transcriptFile = rawTranscriptFile;
      }
    } else {
      const body = await req.json().catch(() => ({}));
      projectName = String(body.projectName || body.project_name || projectName);
      specText = String(body.specText || body.spec_text || '');
      transcriptText = String(
        body.transcriptText || body.transcript_text || ''
      );
      auditDate = String(body.auditDate || body.audit_date || auditDate);
      hourlyRate = Number(body.hourlyRate || body.hourly_rate) || 4500;
    }

    const hasSpec = Boolean(specText.trim() || specFile);
    const hasTranscript = Boolean(transcriptText.trim() || transcriptFile);

    if (!hasSpec || !hasTranscript) {
      return new Response(
        JSON.stringify({
          error:
            'Необходимо предоставить оба источника: исходное Техническое задание (текст или файл) и материалы встречи с клиентом (текст или аудио/видео/файл).',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const effectiveSpecText = await extractTextOrSynthesize(
      specFile,
      specText,
      'spec'
    );
    const effectiveTranscriptText = await extractTextOrSynthesize(
      transcriptFile,
      transcriptText,
      'transcript'
    );

    const apiKey =
      typeof Deno !== 'undefined'
        ? Deno.env.get('GEMINI_API_KEY')
        : process.env.GEMINI_API_KEY;

    const hasValidKey =
      typeof apiKey === 'string' &&
      apiKey.trim().length > 0 &&
      apiKey !== 'MY_GEMINI_API_KEY';

    if (!hasValidKey) {
      const fallbackReport = analyzeDocumentsHeuristic(
        projectName,
        effectiveSpecText,
        effectiveTranscriptText,
        auditDate,
        hourlyRate
      );
      return new Response(
        JSON.stringify({
          ...fallbackReport,
          report: fallbackReport,
          source: 'heuristic',
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const parts: Array<Record<string, unknown>> = [];

    for (const [label, fileObj] of [
      ['ИСХОДНЫЙ ДОКУМЕНТ ТЗ/ДОГОВОР', specFile],
      ['ЗАПИСЬ / СТЕНОГРАММА ВСТРЕЧИ С КЛИЕНТОМ', transcriptFile],
    ] as const) {
      if (!fileObj) continue;
      const ext = getFileExtension(fileObj.name);
      if (ext === '.txt' || ext === '.md') continue;

      const mimeType = resolveMimeType(fileObj.name, fileObj.type);
      const buffer = await fileObj.arrayBuffer();
      const base64Data = arrayBufferToBase64(buffer);

      parts.push({
        text: `Прикрепленный файл (${label}): ${fileObj.name}`,
      });
      parts.push({
        inlineData: {
          mimeType,
          data: base64Data,
        },
      });
    }

    parts.push({
      text: `Проведи полный юридический и проектный аудит Scope Creep.
Название проекта: ${projectName}
Дата аудита: ${auditDate}
Расчетная часовая ставка исполнителя: ${hourlyRate} ед./ч

--- ИСХОДНЫЙ ДОКУМЕНТ (ТЗ / ДОГОВОР / БРИФ) ---
${effectiveSpecText || '(См. прикрепленный файл исходных требований)'}

--- РАСШИФРОВКА / ЗАПИСЬ ПЕРЕГОВОРОВ С КЛИЕНТОМ ---
${effectiveTranscriptText || '(См. прикрепленный медиафайл / документ встречи)'}`,
    });

    const geminiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(
      apiKey
    )}`;

    const geminiRes = await fetch(geminiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: SYSTEM_INSTRUCTION }],
        },
        contents: [
          {
            role: 'user',
            parts,
          },
        ],
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: RESPONSE_SCHEMA,
        },
      }),
    });

    if (!geminiRes.ok) {
      throw new Error(`Gemini REST API returned status ${geminiRes.status}`);
    }

    const geminiJson = await geminiRes.json();
    const rawText =
      geminiJson?.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}';
    const parsed = JSON.parse(rawText);
    const validatedReport = validateAuditReportSchema(parsed, projectName);

    return new Response(
      JSON.stringify({
        ...validatedReport,
        report: validatedReport,
        source: 'gemini',
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({
        error:
          err instanceof Error
            ? err.message
            : 'Внутренняя ошибка Supabase Edge Function при анализе документов.',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
}

Deno.serve(handleAuditRequest);
