import test from 'node:test';
import assert from 'node:assert/strict';
import {
  clampSuggestedHours,
  truncateTitleToSixWords,
  calculateScopeMetrics,
  rebuildChangeOrderSummary,
  rebuildClientEmailDraft,
  validateAuditReportSchema,
  analyzeDocumentsHeuristic,
  createInitialFreemiumState,
  canPerformAudit,
  consumeAuditQuota,
  getRemainingAudits,
  upgradeSubscription,
  formatQuotaBadgeText,
  getPlanPriceDisplay,
  getPaymentMethodsForCurrency,
  formatMoney,
  convertHourlyRate,
  validateUploadedFileMeta,
  MAX_UPLOAD_BYTES,
  buildAuditHistoryEntry,
  upsertAuditHistoryEntry,
  deleteAuditHistoryEntry,
  filterAuditHistory,
  type OutOfScopeItem,
} from './scopeAnalyzer';

test('clampSuggestedHours enforces strict 1..40h range', () => {
  assert.equal(clampSuggestedHours(0), 1);
  assert.equal(clampSuggestedHours(-10), 1);
  assert.equal(clampSuggestedHours(15.4), 15);
  assert.equal(clampSuggestedHours(85), 40);
  assert.equal(clampSuggestedHours(NaN), 4);
});

test('truncateTitleToSixWords limits title to maximum 6 words', () => {
  assert.equal(
    truncateTitleToSixWords('Интеграция с 1С Предприятие через кастомный шлюз обмена данными'),
    'Интеграция с 1С Предприятие через кастомный'
  );
  assert.equal(
    truncateTitleToSixWords('Темная тема личного кабинета'),
    'Темная тема личного кабинета'
  );
});

test('calculateScopeMetrics computes total hours, cost, and severity counts accurately', () => {
  const sampleItems: OutOfScopeItem[] = [
    {
      id: 1,
      title: 'Двусторонняя синхронизация с 1С',
      client_quote: '[04:15] Давайте сразу с 1С свяжем',
      scope_conflict_reason: 'В п. 3.2 ТЗ указан только ручной импорт CSV.',
      suggested_hours: 24,
      severity: 'critical',
    },
    {
      id: 2,
      title: 'Бот уведомлений в Telegram',
      client_quote: '[12:40] И чтобы в Телеграм падали статусы',
      scope_conflict_reason: 'В ТЗ заложены только Email-уведомления.',
      suggested_hours: 12,
      severity: 'medium',
    },
  ];

  const metrics = calculateScopeMetrics(sampleItems, 5000);
  assert.equal(metrics.totalHours, 36);
  assert.equal(metrics.totalCost, 180000);
  assert.equal(metrics.criticalCount, 1);
  assert.equal(metrics.mediumCount, 1);
  assert.equal(metrics.lowCount, 0);
  assert.equal(metrics.itemCount, 2);
});

test('validateAuditReportSchema guarantees required JSON schema fields', () => {
  const validated = validateAuditReportSchema({
    project_name: 'B2B Портал Дистрибуции',
    audit_date: '2026-11-11',
    out_of_scope_items: [
      {
        id: 1,
        title: 'Слишком длинный заголовок который содержит больше шести слов подряд',
        client_quote: '[09:10] Хотим еще модуль',
        scope_conflict_reason: 'Нет в ТЗ',
        suggested_hours: 55,
        severity: 'critical',
      },
    ],
    in_scope_items: ['Каталог товаров с фильтрацией'],
  });

  assert.equal(validated.project_name, 'B2B Портал Дистрибуции');
  assert.equal(validated.out_of_scope_items.length, 1);
  assert.equal(validated.out_of_scope_items[0].suggested_hours, 40);
  assert.ok(validated.out_of_scope_items[0].title.split(' ').length <= 6);
  assert.ok(validated.client_email_draft.subject.length > 5);
  assert.ok(validated.client_email_draft.body.length > 20);
  assert.ok(validated.change_order_summary.includes('ПРИЛОЖЕНИЕ №1'));
});

test('analyzeDocumentsHeuristic identifies scope creep from transcript vs spec', () => {
  const spec = 'ТЗ: Разработка веб-каталога на русском языке. Уведомления только по Email.';
  const transcript = [
    '[02:10] Клиент: По базовому каталогу и фильтрам все отлично, делаем по ТЗ.',
    '[08:45] Клиент: Еще нам обязательно нужен Telegram-бот для менеджеров и выгрузка в 1С.',
  ].join('\n');

  const report = analyzeDocumentsHeuristic('Маркетплейс Спецтехники', spec, transcript, '2026-11-11', 4500);
  assert.equal(report.project_name, 'Маркетплейс Спецтехники');
  assert.ok(report.out_of_scope_items.length >= 2);
  assert.ok(report.in_scope_items.length >= 1);
  assert.ok(report.change_order_summary.includes('Маркетплейс Спецтехники'));
  const email = rebuildClientEmailDraft(
    report.project_name,
    report.out_of_scope_items,
    report.in_scope_items,
    4500
  );
  assert.ok(email.body.includes('Вариант А'));
});

test('freemium quota allows 2 free audits then blocks until upgraded to Pro', () => {
  let state = createInitialFreemiumState();
  assert.equal(getRemainingAudits(state), 2);
  assert.equal(formatQuotaBadgeText(state), 'Бесплатных проверок осталось: 2/2');
  assert.equal(canPerformAudit(state), true);

  state = consumeAuditQuota(state);
  assert.equal(getRemainingAudits(state), 1);
  assert.equal(formatQuotaBadgeText(state), 'Бесплатных проверок осталось: 1/2');

  state = consumeAuditQuota(state);
  assert.equal(getRemainingAudits(state), 0);
  assert.equal(formatQuotaBadgeText(state), 'Бесплатных проверок осталось: 0/2');
  assert.equal(canPerformAudit(state), false);

  const upgraded = upgradeSubscription(state, 'agency', 'Nordic Legal IT');
  assert.equal(canPerformAudit(upgraded), true);
  assert.equal(getRemainingAudits(upgraded), 'unlimited');
  assert.equal(upgraded.agencyBrandName, 'Nordic Legal IT');
});

test('multi-currency pricing, payment methods, and Change Order formatting match specification', () => {
  assert.equal(getPlanPriceDisplay('freelance', 'USD'), '$19');
  assert.equal(getPlanPriceDisplay('freelance', 'RUB'), '1 800 ₽');
  assert.equal(getPlanPriceDisplay('freelance', 'EUR'), '17.5 €');
  assert.equal(getPlanPriceDisplay('freelance', 'KZT'), '9 000 ₸');

  assert.equal(getPlanPriceDisplay('agency', 'USD'), '$49');
  assert.equal(getPlanPriceDisplay('agency', 'RUB'), '4 600 ₽');
  assert.equal(getPlanPriceDisplay('agency', 'EUR'), '45 €');
  assert.equal(getPlanPriceDisplay('agency', 'KZT'), '23 500 ₸');

  assert.deepEqual(getPaymentMethodsForCurrency('RUB'), [
    'СБП',
    'Карта Мир / РФ',
    'ЮKassa / T-Bank',
  ]);
  assert.deepEqual(getPaymentMethodsForCurrency('KZT'), [
    'Kaspi Pay / QR',
    'Карта Казахстана (Halyk/BCC)',
  ]);
  assert.deepEqual(getPaymentMethodsForCurrency('USD'), [
    'Банковская карта (Stripe)',
    'Криптовалюта (USDT / TON)',
    'Telegram Stars',
  ]);

  assert.equal(formatMoney(1500, 'USD'), '$1\u00a0500');
  assert.ok(convertHourlyRate(4500, 'RUB', 'USD') > 0);
});

test('validateUploadedFileMeta enforces allowed extensions and 25MB size limit', () => {
  assert.equal(
    validateUploadedFileMeta('contract_tz.pdf', 1024 * 500, 'spec').valid,
    true
  );
  assert.equal(
    validateUploadedFileMeta('brief.docx', 1024 * 120, 'spec').valid,
    true
  );
  assert.equal(
    validateUploadedFileMeta('malware.exe', 1024, 'spec').valid,
    false
  );
  assert.equal(
    validateUploadedFileMeta('zoom_call.mp3', 5 * 1024 * 1024, 'transcript').valid,
    true
  );
  assert.equal(
    validateUploadedFileMeta('voice_note.m4a', 2 * 1024 * 1024, 'transcript').valid,
    true
  );
  assert.equal(
    validateUploadedFileMeta('huge_video.mp4', MAX_UPLOAD_BYTES + 100, 'transcript').valid,
    false
  );
});

test('audit history helpers build, upsert, filter by search/date, and delete records accurately', () => {
  const report1 = analyzeDocumentsHeuristic(
    'Портал АгроСнаб',
    'ТЗ базовое',
    '[04:10] Хотим 1С и Telegram-бот',
    '2026-11-10',
    50
  );
  const report2 = analyzeDocumentsHeuristic(
    'Кабинет ФинДрайв',
    'ТЗ лизинг',
    '[09:00] Хотим мобильное приложение iOS',
    '2026-11-11',
    60
  );

  const entry1 = buildAuditHistoryEntry({
    id: 'h-1',
    projectName: 'Портал АгроСнаб',
    contractNumber: 'Договор №1',
    auditDate: '2026-11-10',
    hourlyRate: 50,
    currency: 'USD',
    specText: 'ТЗ базовое',
    transcriptText: '[04:10] Хотим 1С и Telegram-бот',
    report: report1,
  });

  const entry2 = buildAuditHistoryEntry({
    id: 'h-2',
    projectName: 'Кабинет ФинДрайв',
    contractNumber: 'Договор №2',
    auditDate: '2026-11-11',
    hourlyRate: 60,
    currency: 'USD',
    specText: 'ТЗ лизинг',
    transcriptText: '[09:00] Хотим мобильное приложение iOS',
    report: report2,
  });

  let history = upsertAuditHistoryEntry([], entry1);
  history = upsertAuditHistoryEntry(history, entry2);
  assert.equal(history.length, 2);
  assert.equal(history[0].id, 'h-2');

  const bySearch = filterAuditHistory(history, 'АгроСнаб', 'all');
  assert.equal(bySearch.length, 1);
  assert.equal(bySearch[0].id, 'h-1');

  const byDate = filterAuditHistory(history, '', '2026-11-11');
  assert.equal(byDate.length, 1);
  assert.equal(byDate[0].id, 'h-2');

  const afterDelete = deleteAuditHistoryEntry(history, 'h-1');
  assert.equal(afterDelete.length, 1);
  assert.equal(afterDelete[0].id, 'h-2');
});




