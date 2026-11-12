import React, { createContext, useContext, useEffect, useState } from 'react';

export type LanguageCode =
  | 'ru'
  | 'en'
  | 'zh'
  | 'es'
  | 'de'
  | 'fr'
  | 'pt'
  | 'ar'
  | 'ja'
  | 'kk';

export type ReportLanguageOption = 'interface' | LanguageCode;

export interface LanguageMeta {
  code: LanguageCode;
  shortLabel: string;
  flag: string;
  nativeName: string;
  fullName: string;
  fullLabel: string;
  dir: 'ltr' | 'rtl';
  aiLanguageName: string;
}

export const SUPPORTED_LANGUAGES: LanguageMeta[] = [
  {
    code: 'ru',
    shortLabel: 'RU',
    flag: '🇷🇺',
    nativeName: 'Русский',
    fullName: 'RU — Русский',
    fullLabel: 'RU — Русский',
    dir: 'ltr',
    aiLanguageName: 'Russian (Русский)',
  },
  {
    code: 'en',
    shortLabel: 'EN',
    flag: '🇺🇸',
    nativeName: 'English',
    fullName: 'EN — English',
    fullLabel: 'EN — English',
    dir: 'ltr',
    aiLanguageName: 'English',
  },
  {
    code: 'zh',
    shortLabel: 'ZH',
    flag: '🇨🇳',
    nativeName: '简体中文',
    fullName: 'ZH — 简体中文',
    fullLabel: 'ZH — 简体中文',
    dir: 'ltr',
    aiLanguageName: 'Simplified Chinese (简体中文)',
  },
  {
    code: 'es',
    shortLabel: 'ES',
    flag: '🇪🇸',
    nativeName: 'Español',
    fullName: 'ES — Español',
    fullLabel: 'ES — Español',
    dir: 'ltr',
    aiLanguageName: 'Spanish (Español)',
  },
  {
    code: 'de',
    shortLabel: 'DE',
    flag: '🇩🇪',
    nativeName: 'Deutsch',
    fullName: 'DE — Deutsch',
    fullLabel: 'DE — Deutsch',
    dir: 'ltr',
    aiLanguageName: 'German (Deutsch)',
  },
  {
    code: 'fr',
    shortLabel: 'FR',
    flag: '🇫🇷',
    nativeName: 'Français',
    fullName: 'FR — Français',
    fullLabel: 'FR — Français',
    dir: 'ltr',
    aiLanguageName: 'French (Français)',
  },
  {
    code: 'pt',
    shortLabel: 'PT',
    flag: '🇧🇷',
    nativeName: 'Português',
    fullName: 'PT — Português',
    fullLabel: 'PT — Português',
    dir: 'ltr',
    aiLanguageName: 'Portuguese (Português - Brasil)',
  },
  {
    code: 'ar',
    shortLabel: 'AR',
    flag: '🇦🇪',
    nativeName: 'العربية',
    fullName: 'AR — العربية',
    fullLabel: 'AR — العربية',
    dir: 'rtl',
    aiLanguageName: 'Arabic (العربية)',
  },
  {
    code: 'ja',
    shortLabel: 'JA',
    flag: '🇯🇵',
    nativeName: '日本語',
    fullName: 'JA — 日本語',
    fullLabel: 'JA — 日本語',
    dir: 'ltr',
    aiLanguageName: 'Japanese (日本語)',
  },
  {
    code: 'kk',
    shortLabel: 'KK',
    flag: '🇰🇿',
    nativeName: 'Қазақша',
    fullName: 'KK — Қазақша',
    fullLabel: 'KK — Қазақша',
    dir: 'ltr',
    aiLanguageName: 'Kazakh (Қазақша)',
  },
];

export function getLanguageMeta(code: LanguageCode): LanguageMeta {
  return (
    SUPPORTED_LANGUAGES.find((l) => l.code === code) ?? SUPPORTED_LANGUAGES[0]
  );
}

export function resolveEffectiveLanguage(
  interfaceLang: LanguageCode,
  reportLang: ReportLanguageOption
): LanguageCode {
  return reportLang === 'interface' ? interfaceLang : reportLang;
}

export type DateFormatOption = 'DD.MM.YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';

export function formatDateByPreference(
  isoOrDateStr: string,
  format: DateFormatOption = 'DD.MM.YYYY'
): string {
  if (!isoOrDateStr) return '';
  const match = isoOrDateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
  let yyyy = '';
  let mm = '';
  let dd = '';
  if (match) {
    [, yyyy, mm, dd] = match;
  } else {
    const parsed = new Date(isoOrDateStr);
    if (Number.isNaN(parsed.getTime())) return isoOrDateStr;
    yyyy = String(parsed.getFullYear());
    mm = String(parsed.getMonth() + 1).padStart(2, '0');
    dd = String(parsed.getDate()).padStart(2, '0');
  }
  if (format === 'MM/DD/YYYY') return `${mm}/${dd}/${yyyy}`;
  if (format === 'YYYY-MM-DD') return `${yyyy}-${mm}-${dd}`;
  return `${dd}.${mm}.${yyyy}`;
}

export interface TranslationDictionary {
  // Navigation & TopBar
  navLanding: string;
  navWorkspace: string;
  navArchive: string;
  navAccount: string;
  navAdmin: string;
  navLoginRegister: string;
  navSignOut: string;
  navLanguageLabel: string;
  navCurrencyLabel: string;
  navFreeChecksLeft: string;
  navChecksUsed: string;
  navManagePlan: string;
  navAccountAndLibrary: string;
  navProfileMobile: string;

  // Landing Page
  heroBadgeSubtitle: string;
  heroTitleHighlight: string;
  heroTitleSuffix: string;
  heroSubtitle: string;
  heroCtaStart: string;
  heroCtaSample: string;
  heroFormatsNote: string;
  heroExportNote: string;
  heroShowcaseBadge: string;
  heroSourceSpecLabel: string;
  heroCallTranscriptLabel: string;
  heroTimecodeLabel: string;
  heroOutOfScopeBadge: string;
  heroFoundItemsPrefix: string;
  heroFoundItemsOn: string;
  heroHoursUnit: string;
  heroShiftPrefix: string;
  heroShiftDaysUnit: string;
  heroEmailAndCoLink: string;
  heroOpenInWorkspace: string;
  bentoBadge: string;
  bentoTitle: string;
  bentoSubtitle: string;
  bento1Tag: string;
  bento1Title: string;
  bento1Desc: string;
  bento2Tag: string;
  bento2Title: string;
  bento2Desc: string;
  bento3Tag: string;
  bento3Title: string;
  bento3Desc: string;
  bento4Tag: string;
  bento4Title: string;
  bento4Desc: string;
  bottomCtaKicker: string;
  bottomCtaTitle: string;
  bottomCtaDesc: string;
  bottomCtaPrimary: string;
  bottomCtaSecondary: string;

  // Workspace ("Кабинет")
  workspaceBadge: string;
  workspaceDefaultTitle: string;
  workspaceSampleBtn: string;
  workspaceLibraryBtn: string;
  workspaceArchiveBtn: string;
  workspacePrintPdfBtn: string;
  step1Kicker: string;
  step1Title: string;
  demoTemplatesLabel: string;
  resetInputsBtn: string;
  fieldProjectName: string;
  fieldHourlyRate: string;
  fieldAuditDate: string;
  fieldReportLang: string;
  fieldReportLangMatchUi: string;
  specFieldTitle: string;
  specDropTitle: string;
  specDropSub: string;
  specChooseBtn: string;
  specTextareaPlaceholder: string;
  transcriptFieldTitle: string;
  transcriptDropTitle: string;
  transcriptDropSub: string;
  transcriptChooseBtn: string;
  transcriptTextareaPlaceholder: string;
  submitAuditBtn: string;
  autoSaveArchiveNote: string;

  // KPI Metrics & Results
  kpiProtectedBudget: string;
  kpiRateNote: string;
  kpiHoursOut: string;
  kpiHoursSub: string;
  kpiDeadlineShift: string;
  kpiDeadlineSub: string;
  kpiDetectedCount: string;
  tabAllSections: string;
  tabRegistry: string;
  tabClientEmail: string;
  tabChangeOrder: string;
  tabJsonSchema: string;
  syncTemplatesBtn: string;
  copyEmailBtn: string;
  copiedBadge: string;
  exportPdfPrintBtn: string;

  // Account & Settings
  accountTabOverview: string;
  accountTabSettings: string;
  accountTabLibrary: string;
  accountNewAuditBtn: string;
  accountRegisteredLabel: string;
  accountQuotaTitle: string;
  accountUsedAuditsLabel: string;
  accountAvailableNow: string;
  accountCloudAuditsLabel: string;
  accountUpgradeBtn: string;
  accountManageProBtn: string;

  // 4 Settings Cards in Personal Account
  settingsHeaderKicker: string;
  settingsHeaderTitle: string;
  settingsHeaderDesc: string;
  settingsSaveAllBtn: string;
  settingsSavedToastTitle: string;
  settingsSavedToastDesc: string;

  // Card A: Localization & Region
  settingsCardATitle: string;
  settingsCardADesc: string;
  settingsUiLangLabel: string;
  settingsReportLangLabel: string;
  settingsDateFormatLabel: string;
  settingsTimezoneLabel: string;

  // Card B: Financial & Work Standards
  settingsCardBTitle: string;
  settingsCardBDesc: string;
  settingsDefaultCurrencyLabel: string;
  settingsDefaultRateLabel: string;
  settingsWorkHoursDayLabel: string;
  settingsTaxNoteLabel: string;
  taxVatExempt: string;
  taxVat20: string;
  taxUsn: string;
  taxVatExclusive: string;

  // Card C: AI Auditor & Legal Templates
  settingsCardCTitle: string;
  settingsCardCDesc: string;
  settingsEmailToneLabel: string;
  toneDiplomatic: string;
  toneStrictLegal: string;
  tonePartnerBacklog: string;
  settingsStrictnessLabel: string;
  strictnessStandard: string;
  strictnessMeticulous: string;
  strictnessCriticalOnly: string;
  settingsDefaultSignatureLabel: string;
  settingsSignaturePlaceholder: string;

  // Card D: Security, Notifications & Data
  settingsCardDTitle: string;
  settingsCardDDesc: string;
  settingsEmailCopyToggle: string;
  settingsQuotaAlertToggle: string;
  settingsAutoSaveDraftsToggle: string;
  settingsPasswordSectionLabel: string;
  settingsSendOtpBtn: string;
  settingsExportJsonBtn: string;
  settingsExportCsvBtn: string;

  // Auth Modal & Pricing
  authLoginTitle: string;
  authRegisterTitle: string;
  authTabLogin: string;
  authTabRegister: string;
  authStudioNameLabel: string;
  authEmailLabel: string;
  authPasswordLabel: string;
  authLoginWithOtp: string;
  authLoginWithPassword: string;
  authSubmitLogin: string;
  authSubmitRegister: string;
  footerTagline: string;
}

export const TRANSLATIONS: Record<LanguageCode, TranslationDictionary> = {
  ru: {
    navLanding: 'Главная',
    navWorkspace: 'Кабинет',
    navArchive: 'Архив',
    navAccount: 'Личный кабинет',
    navAdmin: 'Кабинет разработчика',
    navLoginRegister: 'Войти / Регистрация',
    navSignOut: 'Выйти',
    navLanguageLabel: 'Язык интерфейса',
    navCurrencyLabel: 'Выбор валюты',
    navFreeChecksLeft: 'Бесплатных проверок',
    navChecksUsed: 'Проверок',
    navManagePlan: 'Управление тарифом',
    navAccountAndLibrary: 'Личный кабинет и настройки',
    navProfileMobile: 'Профиль',

    heroBadgeSubtitle: 'ИИ-защита ИТ-проектов от бесплатного Scope Creep',
    heroTitleHighlight: 'Защитите бюджет проекта от бесплатных правок',
    heroTitleSuffix: 'за 30 секунд',
    heroSubtitle:
      'Загрузите исходное ТЗ и запись созвона с клиентом. Нейросеть посекундно сверит каждое пожелание заказчика с договором, оценит нормо-часы (1–40 ч) и сформирует готовое Дополнительное соглашение (Change Order) вместе с дипломатичным письмом.',
    heroCtaStart: 'Открыть рабочую зону · Начать аудит',
    heroCtaSample: 'Посмотреть пример отчета',
    heroFormatsNote: 'PDF, DOCX, TXT, MP3, WAV до 25 МБ',
    heroExportNote: 'Выгрузка Change Order в PDF и Word',
    heroShowcaseBadge: 'Интерактивная демонстрация ИИ-сверки',
    heroSourceSpecLabel: 'Исходный Договор / ТЗ',
    heroCallTranscriptLabel: 'Стенограмма созвона',
    heroTimecodeLabel: 'Таймкод',
    heroOutOfScopeBadge: 'Выход за рамки договора',
    heroFoundItemsPrefix: 'Найдено доработок:',
    heroFoundItemsOn: 'на сумму',
    heroHoursUnit: 'нормо-ч',
    heroShiftPrefix: 'Сдвиг',
    heroShiftDaysUnit: 'раб. дн.',
    heroEmailAndCoLink: 'Текст письма и доп. соглашения →',
    heroOpenInWorkspace: 'Открыть в кабинете',
    bentoBadge: 'Полный цикл юридической и технической аргументации',
    bentoTitle: 'Четыре документа, которые закрывают любой спор о «бесплатных доработках»',
    bentoSubtitle:
      'Вместо эмоциональных споров с клиентом отправьте структурированный отчет с таймкодами, расчетом нормо-часов и готовым Приложением к договору.',
    bento1Tag: '01 · Детектор Scope Creep по таймкодам',
    bento1Title: 'Сверка аудиозаписи и стенограммы с пунктами ТЗ',
    bento1Desc:
      'Поддержка загрузки PDF, DOCX, TXT и аудиозаписей встреч (MP3, WAV, M4A). Каждая новая хотелка клиента связывается с точной цитатой и номером пункта договора.',
    bento2Tag: '02 · Живая смета 1–40 нормо-ч',
    bento2Title: 'Авторасчет бюджета и сдвига сроков релиза',
    bento2Desc:
      'Интерактивный пересчет в 7 мировых валютах с автоматическим расчетом правового сдвига дедлайна в рабочих днях.',
    bento3Tag: '03 · Дипломатичное письмо',
    bento3Title: 'Аргументация доплаты без конфликта с заказчиком',
    bento3Desc:
      'Готовое резюме встречи подтверждает выполнение базового ТЗ в срок и мягко предлагает выбор: Change Order сейчас или Backlog v1.1.',
    bento4Tag: '04 · Юридический Change Order (PDF / Word)',
    bento4Title: 'Официальное Приложение к договору с реквизитами сторон',
    bento4Desc:
      'Автоматическая сборка печатного бланка Дополнительного соглашения с вашим брендингом, таблицей работ, расчетом суммы и блоком подписей.',
    bottomCtaKicker: 'Готово к проверке ваших документов',
    bottomCtaTitle: 'Запустите бесплатный аудит ТЗ и созвона прямо сейчас',
    bottomCtaDesc:
      'Перейдите в рабочую зону, выберите готовый демо-кейс в 1 клик или перетащите свои файлы PDF/DOCX/MP3.',
    bottomCtaPrimary: 'Открыть рабочую зону',
    bottomCtaSecondary: 'Архив проверок',

    workspaceBadge: 'Рабочий кабинет ScopeGuard',
    workspaceDefaultTitle: 'Аудит ТЗ и расшифровки переговоров',
    workspaceSampleBtn: 'Пример отчета',
    workspaceLibraryBtn: 'Библиотека',
    workspaceArchiveBtn: 'Архив',
    workspacePrintPdfBtn: 'Бланк PDF / Печать',
    step1Kicker: 'Шаг 1 · Загрузка материалов',
    step1Title: 'Исходное ТЗ и запись встречи с заказчиком',
    demoTemplatesLabel: 'Демо-шаблоны:',
    resetInputsBtn: 'Сбросить',
    fieldProjectName: 'Наименование проекта / Договор',
    fieldHourlyRate: 'Ставка часа',
    fieldAuditDate: 'Дата проведения аудита',
    fieldReportLang: 'Язык генерации отчета ИИ',
    fieldReportLangMatchUi: 'На языке интерфейса',
    specFieldTitle: '1. Исходные требования (ТЗ, договор, бриф)',
    specDropTitle: 'Перетащите файл ТЗ (PDF, DOCX, TXT)',
    specDropSub: 'Или нажмите для выбора документа с устройства',
    specChooseBtn: 'Выбрать файл',
    specTextareaPlaceholder:
      'Или вставьте зафиксированные пункты Технического задания / условия договора вручную...',
    transcriptFieldTitle: '2. Материалы встречи (аудио созвона или стенограмма)',
    transcriptDropTitle: 'Запись созвона (MP3, WAV, M4A) или видео',
    transcriptDropSub: 'Нажмите для загрузки аудио или вставьте стенограмму ниже',
    transcriptChooseBtn: 'Загрузить медиа',
    transcriptTextareaPlaceholder:
      'Или вставьте текстовую стенограмму встречи Zoom/Meet / переписку из Telegram...',
    submitAuditBtn: 'Запустить юридический аудит Scope Creep',
    autoSaveArchiveNote:
      'Все найденные расхождения автоматически сохраняются в раздел «Архив» и облако',

    kpiProtectedBudget: 'Защищенный бюджет',
    kpiRateNote: 'Ставка договора · Change Order',
    kpiHoursOut: 'Часы сверх ТЗ',
    kpiHoursSub: 'Калибровка 1–40 ч на каждую задачу',
    kpiDeadlineShift: 'Сдвиг срока сдачи',
    kpiDeadlineSub: 'Правовое продление дедлайна этапа',
    kpiDetectedCount: 'Выявлено хотелок вне ТЗ',
    tabAllSections: 'Все разделы',
    tabRegistry: 'Реестр',
    tabClientEmail: 'Письмо клиенту',
    tabChangeOrder: 'Доп. соглашение',
    tabJsonSchema: 'JSON Схема',
    syncTemplatesBtn: 'Синхронизировать шаблоны с реестром',
    copyEmailBtn: 'Копировать письмо',
    copiedBadge: 'Скопировано',
    exportPdfPrintBtn: 'Экспорт PDF / Печать',

    accountTabOverview: 'Обзор и профиль',
    accountTabSettings: 'Настройки и предпочтения',
    accountTabLibrary: 'Библиотека работ',
    accountNewAuditBtn: 'Новый аудит ТЗ',
    accountRegisteredLabel: 'Регистрация',
    accountQuotaTitle: 'Подписка и лимиты аудитов',
    accountUsedAuditsLabel: 'Израсходовано проверок ТЗ',
    accountAvailableNow: 'Доступно сейчас',
    accountCloudAuditsLabel: 'Аудитов в облаке',
    accountUpgradeBtn: 'Перейти на тариф Pro (999 проверок + White-Label)',
    accountManageProBtn: 'Управление тарифом Pro и реквизитами',

    settingsHeaderKicker: 'Глобальная конфигурация рабочего места',
    settingsHeaderTitle: 'Настройки и предпочтения аккаунта',
    settingsHeaderDesc:
      'Настройте локализацию, финансовые стандарты по умолчанию, тон ИИ-аудитора и параметры безопасности. Настройки мгновенно применяются к новым аудитам.',
    settingsSaveAllBtn: 'Сохранить настройки',
    settingsSavedToastTitle: 'Настройки успешно сохранены',
    settingsSavedToastDesc:
      'Стандарты локализации, ставки, формулы сдвига сроков и подпись синхронизированы.',

    settingsCardATitle: 'А) Локализация и регион',
    settingsCardADesc: 'Язык интерфейса, язык генерации ИИ-документов и формат дат',
    settingsUiLangLabel: 'Язык интерфейса (10 мировых рынков)',
    settingsReportLangLabel: 'Язык генерируемых документов ИИ',
    settingsDateFormatLabel: 'Формат даты и времени',
    settingsTimezoneLabel: 'Часовой пояс',

    settingsCardBTitle: 'Б) Финансовые и рабочие стандарты по умолчанию',
    settingsCardBDesc: 'Автоподстановка ставки, валюты, рабочего дня и НДС в новый аудит',
    settingsDefaultCurrencyLabel: 'Базовая валюта по умолчанию',
    settingsDefaultRateLabel: 'Стандартная часовая ставка студии',
    settingsWorkHoursDayLabel: 'Рабочих часов в 1 рабочем дне (формула дедлайна)',
    settingsTaxNoteLabel: 'Налоговая пометка для Доп. соглашений (Change Order)',
    taxVatExempt: 'Без НДС (НДС не облагается)',
    taxVat20: 'С учетом НДС 20%',
    taxUsn: 'УСН (Упрощенная система налогообложения)',
    taxVatExclusive: 'VAT Exclusive (Сверх суммы договора)',

    settingsCardCTitle: 'В) Настройки ИИ-аудитора и юридических шаблонов',
    settingsCardCDesc: 'Тональность писем клиенту, строгость поиска и автоподпись',
    settingsEmailToneLabel: 'Тон письма клиенту',
    toneDiplomatic: 'Дипломатичный и мягкий (без конфронтации)',
    toneStrictLegal: 'Строгий юридический (ссылки на пункты договора)',
    tonePartnerBacklog: 'Партнерский с предложением Backlog v1.1',
    settingsStrictnessLabel: 'Строгость поиска Scope Creep',
    strictnessStandard: 'Стандартная (сбалансированный аудит)',
    strictnessMeticulous: 'Максимально дотошная (искать даже мелкие правки UI)',
    strictnessCriticalOnly: 'Только критичные архитектурные расхождения',
    settingsDefaultSignatureLabel: 'Подпись по умолчанию для писем и PDF-бланков',
    settingsSignaturePlaceholder:
      'ФИО / Название агентства, должность, Telegram / Email / Телефон',

    settingsCardDTitle: 'Г) Безопасность, уведомления и данные',
    settingsCardDDesc: 'Email-уведомления, автосохранение черновиков и экспорт архива',
    settingsEmailCopyToggle: 'Отправлять копию готового отчета на почту',
    settingsQuotaAlertToggle: 'Уведомлять об окончании лимита проверок',
    settingsAutoSaveDraftsToggle: 'Автосохранение черновиков ТЗ и стенограммы в браузере',
    settingsPasswordSectionLabel: 'Смена пароля или вход по 6-значному коду',
    settingsSendOtpBtn: 'Отправить 6-значный код на почту',
    settingsExportJsonBtn: 'Экспортировать все мои отчеты (JSON)',
    settingsExportCsvBtn: 'Экспортировать все мои отчеты (CSV)',

    authLoginTitle: 'Вход в личный кабинет',
    authRegisterTitle: 'Регистрация аккаунта',
    authTabLogin: 'Вход',
    authTabRegister: 'Регистрация',
    authStudioNameLabel: 'Имя или название ИТ-студии',
    authEmailLabel: 'Рабочий Email',
    authPasswordLabel: 'Пароль (минимум 6 символов)',
    authLoginWithOtp: 'Войти по коду из почты',
    authLoginWithPassword: 'Войти по паролю',
    authSubmitLogin: 'Войти в личный кабинет',
    authSubmitRegister: 'Зарегистрироваться и начать',
    footerTagline:
      'ScopeGuard Legal — Система защиты ИТ-исполнителей от несогласованного расширения объема работ',
  },

  en: {
    navLanding: 'Home',
    navWorkspace: 'Workspace',
    navArchive: 'Archive',
    navAccount: 'My Account',
    navAdmin: 'Developer Console',
    navLoginRegister: 'Sign In / Sign Up',
    navSignOut: 'Sign Out',
    navLanguageLabel: 'Interface Language',
    navCurrencyLabel: 'Select Currency',
    navFreeChecksLeft: 'Free audits left',
    navChecksUsed: 'Audits',
    navManagePlan: 'Manage Subscription',
    navAccountAndLibrary: 'Account & Preferences',
    navProfileMobile: 'Account',

    heroBadgeSubtitle: 'AI Scope Creep Protection for IT Agencies & Freelancers',
    heroTitleHighlight: 'Protect your project budget from unpaid scope creep',
    heroTitleSuffix: 'in 30 seconds',
    heroSubtitle:
      'Upload your baseline SOW/Specification and client meeting transcript. AI cross-examines every client request against contract clauses, estimates effort (1–40h), and drafts a formal Change Order with a diplomatic client email.',
    heroCtaStart: 'Open Workspace · Start Audit',
    heroCtaSample: 'View Sample Report',
    heroFormatsNote: 'PDF, DOCX, TXT, MP3, WAV up to 25 MB',
    heroExportNote: 'Export Change Order to PDF & Word',
    heroShowcaseBadge: 'Interactive AI Scope Audit Showcase',
    heroSourceSpecLabel: 'Baseline Contract / SOW',
    heroCallTranscriptLabel: 'Meeting Transcript',
    heroTimecodeLabel: 'Timecode',
    heroOutOfScopeBadge: 'Out of Contract Scope',
    heroFoundItemsPrefix: 'Detected out-of-scope items:',
    heroFoundItemsOn: 'worth',
    heroHoursUnit: 'hrs',
    heroShiftPrefix: 'Shift',
    heroShiftDaysUnit: 'work days',
    heroEmailAndCoLink: 'Client Email & Change Order draft →',
    heroOpenInWorkspace: 'Open in Workspace',
    bentoBadge: 'End-to-End Legal & Technical Justification',
    bentoTitle: 'Four deliverables that settle any "free revision" dispute',
    bentoSubtitle:
      'Replace emotional client arguments with a structured audit featuring timecodes, hour estimates, and a ready-to-sign Contract Addendum.',
    bento1Tag: '01 · Timecoded Scope Creep Detector',
    bento1Title: 'Cross-check audio & transcripts against SOW clauses',
    bento1Desc:
      'Upload PDF, DOCX, TXT, and call recordings (MP3, WAV, M4A). Every extra request is linked to an exact client quote and conflicting contract clause.',
    bento2Tag: '02 · Live 1–40h Cost Estimator',
    bento2Title: 'Automated budget & release deadline shift calculation',
    bento2Desc:
      'Instant multi-currency conversion across 7 global currencies with automatic calculation of legal deadline extensions in business days.',
    bento3Tag: '03 · Diplomatic Client Email',
    bento3Title: 'Justify extra billing without client confrontation',
    bento3Desc:
      'A calm meeting summary confirms on-time baseline delivery and offers a clear choice: sign a Change Order now or move items to Backlog v1.1.',
    bento4Tag: '04 · Legal Change Order (PDF / Word)',
    bento4Title: 'Official Contract Addendum with party requisites',
    bento4Desc:
      'Instant printable Change Order sheet with your agency branding, itemized scope table, tax notes, and signature blocks.',
    bottomCtaKicker: 'Ready to audit your project documents',
    bottomCtaTitle: 'Run a free Specification & Call Audit right now',
    bottomCtaDesc:
      'Jump into the workspace, load a 1-click demo case, or drag and drop your own PDF/DOCX/MP3 files.',
    bottomCtaPrimary: 'Open Workspace',
    bottomCtaSecondary: 'Audit Archive',

    workspaceBadge: 'ScopeGuard Workspace',
    workspaceDefaultTitle: 'Specification & Meeting Transcript Audit',
    workspaceSampleBtn: 'Sample Report',
    workspaceLibraryBtn: 'Library',
    workspaceArchiveBtn: 'Archive',
    workspacePrintPdfBtn: 'PDF Sheet / Print',
    step1Kicker: 'Step 1 · Upload Source Materials',
    step1Title: 'Baseline Specification & Client Call Recording',
    demoTemplatesLabel: 'Demo Cases:',
    resetInputsBtn: 'Reset',
    fieldProjectName: 'Project Name / Contract #',
    fieldHourlyRate: 'Hourly Rate',
    fieldAuditDate: 'Audit Date',
    fieldReportLang: 'AI Report Generation Language',
    fieldReportLangMatchUi: 'Match Interface Language',
    specFieldTitle: '1. Baseline Requirements (SOW, Contract, Brief)',
    specDropTitle: 'Drag & drop SOW file (PDF, DOCX, TXT)',
    specDropSub: 'Or click to browse document from your device',
    specChooseBtn: 'Choose File',
    specTextareaPlaceholder:
      'Or paste fixed specification clauses / contract terms manually...',
    transcriptFieldTitle: '2. Meeting Materials (Call Audio or Transcript)',
    transcriptDropTitle: 'Call recording (MP3, WAV, M4A) or video',
    transcriptDropSub: 'Click to upload audio or paste transcript below',
    transcriptChooseBtn: 'Upload Media',
    transcriptTextareaPlaceholder:
      'Or paste Zoom/Meet transcript or Telegram/Slack chat messages...',
    submitAuditBtn: 'Run Legal Scope Creep Audit',
    autoSaveArchiveNote:
      'All detected out-of-scope items are automatically saved to Archive & Cloud',

    kpiProtectedBudget: 'Protected Budget',
    kpiRateNote: 'Contract Rate · Change Order',
    kpiHoursOut: 'Hours Out of Scope',
    kpiHoursSub: '1–40h calibration per task',
    kpiDeadlineShift: 'Deadline Shift',
    kpiDeadlineSub: 'Legal milestone extension',
    kpiDetectedCount: 'Out-of-Scope Requests',
    tabAllSections: 'All Sections',
    tabRegistry: 'Registry',
    tabClientEmail: 'Client Email',
    tabChangeOrder: 'Change Order',
    tabJsonSchema: 'JSON Schema',
    syncTemplatesBtn: 'Sync Templates with Registry',
    copyEmailBtn: 'Copy Email',
    copiedBadge: 'Copied',
    exportPdfPrintBtn: 'Export PDF / Print',

    accountTabOverview: 'Profile & Overview',
    accountTabSettings: 'Settings & Preferences',
    accountTabLibrary: 'Cloud Library',
    accountNewAuditBtn: 'New Scope Audit',
    accountRegisteredLabel: 'Registered',
    accountQuotaTitle: 'Subscription & Audit Quotas',
    accountUsedAuditsLabel: 'Audits Used',
    accountAvailableNow: 'Available now',
    accountCloudAuditsLabel: 'Audits in Cloud',
    accountUpgradeBtn: 'Upgrade to Pro Plan (999 audits + White-Label)',
    accountManageProBtn: 'Manage Pro Plan & Requisites',

    settingsHeaderKicker: 'Global Workspace Configuration',
    settingsHeaderTitle: 'Account Settings & Preferences',
    settingsHeaderDesc:
      'Configure localization, default financial & work standards, AI auditor tone, and security. Preferences automatically apply to new audits.',
    settingsSaveAllBtn: 'Save Settings',
    settingsSavedToastTitle: 'Settings saved successfully',
    settingsSavedToastDesc:
      'Localization, default hourly rate, work-day formula, and signature have been synced.',

    settingsCardATitle: 'A) Localization & Region',
    settingsCardADesc: 'Interface language, AI document generation language, and date format',
    settingsUiLangLabel: 'Interface Language (10 Global Markets)',
    settingsReportLangLabel: 'AI Generated Documents Language',
    settingsDateFormatLabel: 'Date & Time Format',
    settingsTimezoneLabel: 'Timezone',

    settingsCardBTitle: 'B) Default Financial & Work Standards',
    settingsCardBDesc: 'Auto-populated currency, hourly rate, work day hours, and tax note',
    settingsDefaultCurrencyLabel: 'Default Base Currency',
    settingsDefaultRateLabel: 'Standard Studio Hourly Rate',
    settingsWorkHoursDayLabel: 'Work Hours per Business Day (Deadline Formula)',
    settingsTaxNoteLabel: 'Tax Clause for Change Orders',
    taxVatExempt: 'VAT Exempt (Without VAT)',
    taxVat20: 'Including 20% VAT',
    taxUsn: 'Simplified Tax Regime (USN)',
    taxVatExclusive: 'VAT Exclusive (+ applicable tax)',

    settingsCardCTitle: 'C) AI Auditor & Legal Template Preferences',
    settingsCardCDesc: 'Client email tone, scope creep detection strictness, and signature',
    settingsEmailToneLabel: 'Client Email Tone',
    toneDiplomatic: 'Diplomatic & Soft (Non-confrontational)',
    toneStrictLegal: 'Strict Legal (Formal contract clause citations)',
    tonePartnerBacklog: 'Partner-style with Backlog v1.1 proposal',
    settingsStrictnessLabel: 'Scope Creep Detection Strictness',
    strictnessStandard: 'Standard (Balanced audit)',
    strictnessMeticulous: 'Maximum Meticulousness (Catch minor UI tweaks)',
    strictnessCriticalOnly: 'Critical Architectural Divergences Only',
    settingsDefaultSignatureLabel: 'Default Signature for Emails & PDF Sheets',
    settingsSignaturePlaceholder:
      'Full Name / Agency Name, Title, Telegram / Email / Phone',

    settingsCardDTitle: 'D) Security, Notifications & Data',
    settingsCardDDesc: 'Email notifications, browser draft auto-save, and archive export',
    settingsEmailCopyToggle: 'Send a copy of completed audit reports to my email',
    settingsQuotaAlertToggle: 'Notify me when audit quota is running low',
    settingsAutoSaveDraftsToggle: 'Auto-save SOW and transcript drafts in browser',
    settingsPasswordSectionLabel: 'Change Password or Send 6-Digit Email Code',
    settingsSendOtpBtn: 'Send 6-Digit Code to Email',
    settingsExportJsonBtn: 'Export All My Reports (JSON)',
    settingsExportCsvBtn: 'Export All My Reports (CSV)',

    authLoginTitle: 'Sign In to Your Account',
    authRegisterTitle: 'Create Studio Account',
    authTabLogin: 'Sign In',
    authTabRegister: 'Sign Up',
    authStudioNameLabel: 'Your Name or IT Agency Name',
    authEmailLabel: 'Work Email',
    authPasswordLabel: 'Password (minimum 6 characters)',
    authLoginWithOtp: 'Sign in with Email Code',
    authLoginWithPassword: 'Sign in with Password',
    authSubmitLogin: 'Sign In to Workspace',
    authSubmitRegister: 'Create Account & Start',
    footerTagline:
      'ScopeGuard Legal — Protecting IT Agencies & Engineers from Unpaid Scope Creep',
  },

  zh: {
    navLanding: '首页',
    navWorkspace: '工作台',
    navArchive: '归档',
    navAccount: '个人中心',
    navAdmin: '开发者后台',
    navLoginRegister: '登录 / 注册',
    navSignOut: '退出登录',
    navLanguageLabel: '界面语言',
    navCurrencyLabel: '选择货币',
    navFreeChecksLeft: '剩余免费审计',
    navChecksUsed: '已用审计',
    navManagePlan: '管理订阅方案',
    navAccountAndLibrary: '账户与偏好设置',
    navProfileMobile: '账户',

    heroBadgeSubtitle: 'IT开发团队与自由职业者的 AI 需求蔓延防护系统',
    heroTitleHighlight: '30秒内保护您的项目预算免受免费改稿侵害',
    heroTitleSuffix: '精准核对',
    heroSubtitle:
      '上传原始技术规格书（SOW）与客户会议录音/纪要。AI逐句比对合同条款，评估工时（1–40小时），并自动生成正式《变更单（Change Order）》与高情商客户沟通邮件。',
    heroCtaStart: '打开工作台 · 开始审计',
    heroCtaSample: '查看报告示例',
    heroFormatsNote: '支持 PDF, DOCX, TXT, MP3, WAV (最大 25 MB)',
    heroExportNote: '一键导出 PDF 与 Word 变更协议',
    heroShowcaseBadge: 'AI 需求核对交互演示',
    heroSourceSpecLabel: '原始合同 / 技术规格书',
    heroCallTranscriptLabel: '会议沟通纪要',
    heroTimecodeLabel: '时间戳',
    heroOutOfScopeBadge: '超出合同范围',
    heroFoundItemsPrefix: '发现超纲需求：',
    heroFoundItemsOn: '价值',
    heroHoursUnit: '工时',
    heroShiftPrefix: '工期顺延',
    heroShiftDaysUnit: '个工作日',
    heroEmailAndCoLink: '查看客户邮件与变更单草稿 →',
    heroOpenInWorkspace: '在工作台中打开',
    bentoBadge: '全流程法务与技术工时论证',
    bentoTitle: '四份核心交付物，彻底终结“免费加功能”争议',
    bentoSubtitle:
      '用带时间戳的客观审计报告、工时核算表与正式补充协议代替情绪化争论。',
    bento1Tag: '01 · 时间戳需求蔓延检测',
    bento1Title: '自动比对会议录音纪要与合同条款',
    bento1Desc: '支持上传文档与通话录音，将客户每一项新增要求与原话引用及冲突条款精准绑定。',
    bento2Tag: '02 · 1–40小时动态预算核算',
    bento2Title: '自动计算增项费用与交付延期天数',
    bento2Desc: '支持 7 种主流货币实时换算，并按标准工作日自动计算法定交期顺延。',
    bento3Tag: '03 · 高情商客户沟通邮件',
    bento3Title: '温和坚定地论证增项费用，维护客户关系',
    bento3Desc: '确认基础功能按期推进，并向客户提供双赢选择：签署变更协议或列入 v1.1 迭代。',
    bento4Tag: '04 · 法务变更协议 (PDF / Word)',
    bento4Title: '带双方抬头与签章栏的正式合同补充协议',
    bento4Desc: '自动生成带工作室品牌的 A4 打印级变更单，支持一键导出 PDF 与 Word。',
    bottomCtaKicker: '立即开始核对您的项目文档',
    bottomCtaTitle: '立即免费启动技术规格书与会议纪要审计',
    bottomCtaDesc: '进入工作台一键加载演示案例，或拖拽上传您的 PDF/DOCX/MP3 文件。',
    bottomCtaPrimary: '打开工作台',
    bottomCtaSecondary: '审计历史归档',

    workspaceBadge: 'ScopeGuard 审计工作台',
    workspaceDefaultTitle: '技术规格书与会议纪要法务审计',
    workspaceSampleBtn: '报告示例',
    workspaceLibraryBtn: '云端文库',
    workspaceArchiveBtn: '归档',
    workspacePrintPdfBtn: 'PDF 变更单 / 打印',
    step1Kicker: '第 1 步 · 上传核对材料',
    step1Title: '原始技术规格书（ТЗ）与客户会议记录',
    demoTemplatesLabel: '演示模板：',
    resetInputsBtn: '重置',
    fieldProjectName: '项目名称 / 合同编号',
    fieldHourlyRate: '标准时薪',
    fieldAuditDate: '审计日期',
    fieldReportLang: 'AI 报告生成语言',
    fieldReportLangMatchUi: '跟随界面语言',
    specFieldTitle: '1. 原始合同需求（规格书、合同、Brief）',
    specDropTitle: '拖拽规格书文件至此 (PDF, DOCX, TXT)',
    specDropSub: '或点击从设备选择文档',
    specChooseBtn: '选择文件',
    specTextareaPlaceholder: '或在此手动粘贴已签署的技术规格书条款...',
    transcriptFieldTitle: '2. 会议沟通材料（录音或文字纪要）',
    transcriptDropTitle: '会议录音 (MP3, WAV, M4A) 或视频',
    transcriptDropSub: '点击上传音频或在下方粘贴沟通记录',
    transcriptChooseBtn: '上传媒体',
    transcriptTextareaPlaceholder: '或在此粘贴会议文字纪要 / 聊天记录...',
    submitAuditBtn: '启动 Scope Creep 法务审计',
    autoSaveArchiveNote: '所有检测结果将自动保存至归档与云端文库',

    kpiProtectedBudget: '已保护预算金额',
    kpiRateNote: '按合同费率 · Change Order',
    kpiHoursOut: '超纲总工时',
    kpiHoursSub: '单项 1–40 小时精准评估',
    kpiDeadlineShift: '交期顺延天数',
    kpiDeadlineSub: '法定里程碑工期顺延',
    kpiDetectedCount: '发现超纲需求数',
    tabAllSections: '全部板块',
    tabRegistry: '增项清单',
    tabClientEmail: '客户沟通邮件',
    tabChangeOrder: '补充协议 (Change Order)',
    tabJsonSchema: 'JSON 结构',
    syncTemplatesBtn: '与清单同步更新模板',
    copyEmailBtn: '复制邮件',
    copiedBadge: '已复制',
    exportPdfPrintBtn: '导出 PDF / 打印',

    accountTabOverview: '账户概览',
    accountTabSettings: '设置与偏好',
    accountTabLibrary: '云端项目库',
    accountNewAuditBtn: '新建审计',
    accountRegisteredLabel: '注册时间',
    accountQuotaTitle: '订阅方案与审计额度',
    accountUsedAuditsLabel: '已使用审计次数',
    accountAvailableNow: '当前可用',
    accountCloudAuditsLabel: '云端保存报告',
    accountUpgradeBtn: '升级至 Pro 方案（999 次审计 + 品牌定制）',
    accountManageProBtn: '管理 Pro 方案与企业信息',

    settingsHeaderKicker: '全局工作台配置',
    settingsHeaderTitle: '账户设置与工作偏好',
    settingsHeaderDesc: '配置界面与报告语言、默认财务费率、AI 审计语气及安全选项。保存后自动应用于新审计。',
    settingsSaveAllBtn: '保存设置',
    settingsSavedToastTitle: '设置已成功保存',
    settingsSavedToastDesc: '语言、默认时薪、工期公式与邮件签名已同步更新。',

    settingsCardATitle: 'A) 语言与区域设置',
    settingsCardADesc: '界面语言、AI 生成文档语言及日期格式',
    settingsUiLangLabel: '界面语言（10 大主流市场）',
    settingsReportLangLabel: 'AI 生成报告与协议语言',
    settingsDateFormatLabel: '日期与时间格式',
    settingsTimezoneLabel: '时区设置',

    settingsCardBTitle: 'B) 默认财务与工作标准',
    settingsCardBDesc: '新建审计时自动填充的货币、时薪、日工时与税务说明',
    settingsDefaultCurrencyLabel: '默认结算货币',
    settingsDefaultRateLabel: '团队标准时薪',
    settingsWorkHoursDayLabel: '每个工作日标准工时（影响延期计算）',
    settingsTaxNoteLabel: '补充协议税务条款说明',
    taxVatExempt: '不含增值税 (VAT Exempt)',
    taxVat20: '含 20% 增值税',
    taxUsn: '简易征收税制 (USN)',
    taxVatExclusive: '税前金额 (VAT Exclusive)',

    settingsCardCTitle: 'C) AI 审计师与法务模板偏好',
    settingsCardCDesc: '客户邮件语气、超纲检测严格度与默认署名',
    settingsEmailToneLabel: '客户沟通邮件语气',
    toneDiplomatic: '温和外交风（避免冲突）',
    toneStrictLegal: '严谨法务风（精准引用合同条款）',
    tonePartnerBacklog: '合作伙伴风（建议列入 Backlog v1.1）',
    settingsStrictnessLabel: 'Scope Creep 检测严格度',
    strictnessStandard: '标准模式（平衡检测）',
    strictnessMeticulous: '极致严谨（捕捉细微 UI 改动）',
    strictnessCriticalOnly: '仅检测核心架构变更',
    settingsDefaultSignatureLabel: '邮件与 PDF 变更单默认署名',
    settingsSignaturePlaceholder: '姓名 / 团队名称、职位、联系方式',

    settingsCardDTitle: 'D) 安全、通知与数据管理',
    settingsCardDDesc: '邮件通知、草稿自动保存与全量数据导出',
    settingsEmailCopyToggle: '将完成的审计报告副本发送至我的邮箱',
    settingsQuotaAlertToggle: '当审计额度即将用尽时提醒我',
    settingsAutoSaveDraftsToggle: '在浏览器中自动保存规格书与纪要草稿',
    settingsPasswordSectionLabel: '修改密码或发送 6 位邮箱验证码',
    settingsSendOtpBtn: '发送 6 位验证码至邮箱',
    settingsExportJsonBtn: '导出全部报告 (JSON)',
    settingsExportCsvBtn: '导出全部报告 (CSV)',

    authLoginTitle: '登录个人中心',
    authRegisterTitle: '注册团队账户',
    authTabLogin: '登录',
    authTabRegister: '注册',
    authStudioNameLabel: '您的姓名或工作室名称',
    authEmailLabel: '工作邮箱',
    authPasswordLabel: '密码（至少 6 位字符）',
    authLoginWithOtp: '使用邮箱验证码登录',
    authLoginWithPassword: '使用密码登录',
    authSubmitLogin: '登录工作台',
    authSubmitRegister: '注册并开始使用',
    footerTagline: 'ScopeGuard Legal — 保护 IT 团队免受无偿需求蔓延侵害的智能法务系统',
  },

  es: {
    navLanding: 'Inicio',
    navWorkspace: 'Cabina',
    navArchive: 'Archivo',
    navAccount: 'Mi Cuenta',
    navAdmin: 'Consola Admin',
    navLoginRegister: 'Entrar / Registro',
    navSignOut: 'Salir',
    navLanguageLabel: 'Idioma de interfaz',
    navCurrencyLabel: 'Moneda',
    navFreeChecksLeft: 'Auditorías gratis',
    navChecksUsed: 'Auditorías',
    navManagePlan: 'Gestionar Plan',
    navAccountAndLibrary: 'Cuenta y Ajustes',
    navProfileMobile: 'Perfil',

    heroBadgeSubtitle: 'Protección IA contra Scope Creep para Agencias IT y Freelancers',
    heroTitleHighlight: 'Protege el presupuesto de tu proyecto de cambios gratuitos',
    heroTitleSuffix: 'en 30 segundos',
    heroSubtitle:
      'Sube el pliego técnico (SOW) y la grabación o transcripción de la reunión. La IA compara cada petición con el contrato, estima horas (1–40h) y redacta un Change Order formal junto con un correo diplomático.',
    heroCtaStart: 'Abrir Cabina · Iniciar Auditoría',
    heroCtaSample: 'Ver Informe de Ejemplo',
    heroFormatsNote: 'PDF, DOCX, TXT, MP3, WAV hasta 25 MB',
    heroExportNote: 'Exportación de Change Order a PDF y Word',
    heroShowcaseBadge: 'Demostración Interactiva de Auditoría IA',
    heroSourceSpecLabel: 'Contrato / Especificación Base',
    heroCallTranscriptLabel: 'Transcripción de Llamada',
    heroTimecodeLabel: 'Minuto',
    heroOutOfScopeBadge: 'Fuera del Alcance Contractual',
    heroFoundItemsPrefix: 'Cambios detectados:',
    heroFoundItemsOn: 'por',
    heroHoursUnit: 'h',
    heroShiftPrefix: 'Plazo',
    heroShiftDaysUnit: 'días лаб.',
    heroEmailAndCoLink: 'Ver correo y Change Order →',
    heroOpenInWorkspace: 'Abrir en Cabina',
    bentoBadge: 'Argumentación Legal y Técnica Completa',
    bentoTitle: 'Cuatro documentos que cierran cualquier disputa por «cambios gratis»',
    bentoSubtitle:
      'En lugar de discusiones tensas, envía un informe con códigos de tiempo, cálculo de horas y un Anexo contractual listo para firmar.',
    bento1Tag: '01 · Detector de Scope Creep con Timecodes',
    bento1Title: 'Cruce de audio y transcripción con cláusulas del contrato',
    bento1Desc: 'Soporta PDF, DOCX, TXT y audio MP3/WAV. Cada petición extra se vincula a la cita exacta del cliente.',
    bento2Tag: '02 · Presupuesto Vivo 1–40h',
    bento2Title: 'Cálculo automático de presupuesto y extensión de entrega',
    bento2Desc: 'Conversión instantánea en 7 divisas y cálculo de días hábiles adicionales.',
    bento3Tag: '03 · Correo Diplomático al Cliente',
    bento3Title: 'Justifica cargos adicionales sin fricción comercial',
    bento3Desc: 'Confirma el avance puntual del alcance base y ofrece firmar un Change Order o mover tareas al Backlog v1.1.',
    bento4Tag: '04 · Change Order Legal (PDF / Word)',
    bento4Title: 'Anexo Oficial al Contrato con datos de las partes',
    bento4Desc: 'Generación automática de hoja A4 lista para firma en PDF y Word.',
    bottomCtaKicker: 'Listo para auditar tus documentos',
    bottomCtaTitle: 'Inicia una auditoría gratuita de especificaciones ahora mismo',
    bottomCtaDesc: 'Entra a la cabina, prueba un caso demo en 1 clic o sube tus archivos.',
    bottomCtaPrimary: 'Abrir Cabina',
    bottomCtaSecondary: 'Archivo de Auditorías',

    workspaceBadge: 'Cabina de Auditoría ScopeGuard',
    workspaceDefaultTitle: 'Auditoría de Especificación y Reunión',
    workspaceSampleBtn: 'Ejemplo',
    workspaceLibraryBtn: 'Biblioteca',
    workspaceArchiveBtn: 'Archivo',
    workspacePrintPdfBtn: 'Hoja PDF / Imprimir',
    step1Kicker: 'Paso 1 · Carga de Documentos',
    step1Title: 'Especificación Base y Grabación de Reunión',
    demoTemplatesLabel: 'Casos Demo:',
    resetInputsBtn: 'Limpiar',
    fieldProjectName: 'Nombre del Proyecto / Contrato',
    fieldHourlyRate: 'Tarifa por Hora',
    fieldAuditDate: 'Fecha de Auditoría',
    fieldReportLang: 'Idioma del Informe IA',
    fieldReportLangMatchUi: 'Igual al idioma de interfaz',
    specFieldTitle: '1. Requisitos Base (SOW, Contrato, Brief)',
    specDropTitle: 'Arrastra el archivo técnico (PDF, DOCX, TXT)',
    specDropSub: 'O haz clic para seleccionar desde tu dispositivo',
    specChooseBtn: 'Elegir archivo',
    specTextareaPlaceholder: 'O pega manualmente las cláusulas de la especificación técnica...',
    transcriptFieldTitle: '2. Materiales de Reunión (Audio o Transcripción)',
    transcriptDropTitle: 'Grabación de llamada (MP3, WAV, M4A)',
    transcriptDropSub: 'Haz clic para subir audio o pega la transcripción abajo',
    transcriptChooseBtn: 'Subir audio',
    transcriptTextareaPlaceholder: 'O pega la transcripción de Zoom/Meet o chat de WhatsApp/Telegram...',
    submitAuditBtn: 'Ejecutar Auditoría Legal de Scope Creep',
    autoSaveArchiveNote: 'Los resultados se guardan automáticamente en el Archivo y en la nube',

    kpiProtectedBudget: 'Presupuesto Protegido',
    kpiRateNote: 'Tarifa contractual · Change Order',
    kpiHoursOut: 'Horas Fuera de Alcance',
    kpiHoursSub: 'Calibración 1–40h por tarea',
    kpiDeadlineShift: 'Extensión de Plazo',
    kpiDeadlineSub: 'Prórroga legal de entrega',
    kpiDetectedCount: 'Peticiones Extra',
    tabAllSections: 'Todo',
    tabRegistry: 'Registro',
    tabClientEmail: 'Correo al Cliente',
    tabChangeOrder: 'Change Order',
    tabJsonSchema: 'Esquema JSON',
    syncTemplatesBtn: 'Sincronizar plantillas con registro',
    copyEmailBtn: 'Copiar correo',
    copiedBadge: 'Copiado',
    exportPdfPrintBtn: 'Exportar PDF / Imprimir',

    accountTabOverview: 'Perfil y Resumen',
    accountTabSettings: 'Ajustes y Preferencias',
    accountTabLibrary: 'Biblioteca en la Nube',
    accountNewAuditBtn: 'Nueva Auditoría',
    accountRegisteredLabel: 'Registro',
    accountQuotaTitle: 'Suscripción y Límites',
    accountUsedAuditsLabel: 'Auditorías utilizadas',
    accountAvailableNow: 'Disponibles ahora',
    accountCloudAuditsLabel: 'Informes en la nube',
    accountUpgradeBtn: 'Pasar al Plan Pro (999 auditorías + White-Label)',
    accountManageProBtn: 'Gestionar Plan Pro y Datos Fiscales',

    settingsHeaderKicker: 'Configuración Global del Espacio de Trabajo',
    settingsHeaderTitle: 'Ajustes y Preferencias de Cuenta',
    settingsHeaderDesc: 'Configura idioma, estándares financieros, tono del auditor IA y seguridad.',
    settingsSaveAllBtn: 'Guardar Ajustes',
    settingsSavedToastTitle: 'Ajustes guardados correctamente',
    settingsSavedToastDesc: 'Idioma, tarifa por defecto, jornada laboral y firma actualizados.',

    settingsCardATitle: 'A) Localización y Región',
    settingsCardADesc: 'Idioma de interfaz, idioma de documentos IA y formato de fecha',
    settingsUiLangLabel: 'Idioma de la Interfaz (10 mercados globales)',
    settingsReportLangLabel: 'Idioma de Documentos Generados por IA',
    settingsDateFormatLabel: 'Formato de Fecha y Hora',
    settingsTimezoneLabel: 'Zona Horaria',

    settingsCardBTitle: 'B) Estándares Financieros y Laborales por Defecto',
    settingsCardBDesc: 'Moneda, tarifa por hora, horas por día e impuestos automáticos',
    settingsDefaultCurrencyLabel: 'Moneda Base por Defecto',
    settingsDefaultRateLabel: 'Tarifa por Hora Estándar del Estudio',
    settingsWorkHoursDayLabel: 'Horas Laborales por Día (Fórmula de Plazo)',
    settingsTaxNoteLabel: 'Cláusula Fiscal para Change Orders',
    taxVatExempt: 'Exento de IVA (Sin IVA)',
    taxVat20: 'IVA 20% Incluido',
    taxUsn: 'Régimen Fiscal Simplificado',
    taxVatExclusive: 'VAT Exclusive (Más impuestos aplicables)',

    settingsCardCTitle: 'C) Preferencias del Auditor IA y Plantillas Legales',
    settingsCardCDesc: 'Tono del correo al cliente, rigor de detección y firma por defecto',
    settingsEmailToneLabel: 'Tono del Correo al Cliente',
    toneDiplomatic: 'Diplomático y Suave (Sin confrontación)',
    toneStrictLegal: 'Jurídico Estricto (Citas formales del contrato)',
    tonePartnerBacklog: 'Estilo Socio con propuesta de Backlog v1.1',
    settingsStrictnessLabel: 'Rigor de Detección de Scope Creep',
    strictnessStandard: 'Estándar (Auditoría equilibrada)',
    strictnessMeticulous: 'Máxima Meticulosidad (Incluir micro-ajustes UI)',
    strictnessCriticalOnly: 'Solo Divergencias Arquitectónicas Críticas',
    settingsDefaultSignatureLabel: 'Firma por Defecto para Correos y PDF',
    settingsSignaturePlaceholder: 'Nombre / Agencia, Cargo, Contacto',

    settingsCardDTitle: 'D) Seguridad, Notificaciones y Datos',
    settingsCardDDesc: 'Alertas por correo, autoguardado de borradores y exportación',
    settingsEmailCopyToggle: 'Enviar copia del informe finalizado a mi correo',
    settingsQuotaAlertToggle: 'Notificarme cuando se agote el límite de auditorías',
    settingsAutoSaveDraftsToggle: 'Autoguardar borradores en el navegador',
    settingsPasswordSectionLabel: 'Cambiar Contraseña o Enviar Código de 6 Dígitos',
    settingsSendOtpBtn: 'Enviar Código de 6 Dígitos al Correo',
    settingsExportJsonBtn: 'Exportar Todos Mis Informes (JSON)',
    settingsExportCsvBtn: 'Exportar Todos Mis Informes (CSV)',

    authLoginTitle: 'Iniciar Sesión',
    authRegisterTitle: 'Crear Cuenta de Agencia',
    authTabLogin: 'Entrar',
    authTabRegister: 'Registro',
    authStudioNameLabel: 'Nombre o Agencia IT',
    authEmailLabel: 'Email Profesional',
    authPasswordLabel: 'Contraseña (mínimo 6 caracteres)',
    authLoginWithOtp: 'Entrar con código por email',
    authLoginWithPassword: 'Entrar con contraseña',
    authSubmitLogin: 'Entrar al Espacio de Trabajo',
    authSubmitRegister: 'Registrarse y Comenzar',
    footerTagline: 'ScopeGuard Legal — Protección de Agencias IT contra el Scope Creep no remunerado',
  },

  de: {
    navLanding: 'Startseite',
    navWorkspace: 'Workspace',
    navArchive: 'Archiv',
    navAccount: 'Mein Konto',
    navAdmin: 'Entwickler-Konsole',
    navLoginRegister: 'Anmelden / Registrieren',
    navSignOut: 'Abmelden',
    navLanguageLabel: 'Oberflächensprache',
    navCurrencyLabel: 'Währung wählen',
    navFreeChecksLeft: 'Freie Audits übrig',
    navChecksUsed: 'Audits',
    navManagePlan: 'Tarif verwalten',
    navAccountAndLibrary: 'Konto & Einstellungen',
    navProfileMobile: 'Profil',

    heroBadgeSubtitle: 'KI-Schutz vor Scope Creep für IT-Agenturen & Freelancer',
    heroTitleHighlight: 'Schützen Sie Ihr Projektbudget vor unbezahlten Zusatzwünschen',
    heroTitleSuffix: 'in 30 Sekunden',
    heroSubtitle:
      'Laden Sie Pflichtenheft (SOW) und Meeting-Transkript hoch. Die KI prüft jede Kundenanfrage gegen den Vertrag, kalkuliert Stunden (1–40 Std.) und erstellt einen Change Order samt diplomatischer Kunden-E-Mail.',
    heroCtaStart: 'Workspace öffnen · Audit starten',
    heroCtaSample: 'Beispielbericht ansehen',
    heroFormatsNote: 'PDF, DOCX, TXT, MP3, WAV bis 25 MB',
    heroExportNote: 'Change Order als PDF & Word exportieren',
    heroShowcaseBadge: 'Interaktive KI-Scope-Audit-Vorschau',
    heroSourceSpecLabel: 'Ursprungsvertrag / Pflichtenheft',
    heroCallTranscriptLabel: 'Meeting-Protokoll',
    heroTimecodeLabel: 'Timecode',
    heroOutOfScopeBadge: 'Außerhalb des Vertragsumfangs',
    heroFoundItemsPrefix: 'Zusatzanforderungen erkannt:',
    heroFoundItemsOn: 'im Wert von',
    heroHoursUnit: 'Std.',
    heroShiftPrefix: 'Verzug',
    heroShiftDaysUnit: 'Arbeitstage',
    heroEmailAndCoLink: 'E-Mail & Change Order Entwurf →',
    heroOpenInWorkspace: 'Im Workspace öffnen',
    bentoBadge: 'Vollständige rechtliche & technische Begründung',
    bentoTitle: 'Vier Dokumente, die jede Diskussion über „kostenlose Änderungen“ beenden',
    bentoSubtitle:
      'Senden Sie statt emotionaler Diskussionen einen strukturierten Prüfbericht mit Timecodes, Stundenkalkulation und fertigem Vertragsnachtrag.',
    bento1Tag: '01 · Scope-Creep-Detektor mit Timecodes',
    bento1Title: 'Abgleich von Audio & Transkript mit Vertragsklauseln',
    bento1Desc: 'Unterstützt PDF, DOCX, TXT und Audioaufnahmen. Jede Zusatzanforderung wird mit Zitat und Vertragspunkt belegt.',
    bento2Tag: '02 · Live-Kalkulation 1–40 Std.',
    bento2Title: 'Automatische Budget- und Terminverschiebungsrechnung',
    bento2Desc: 'Sofortige Umrechnung in 7 Währungen inklusive Berechnung zusätzlicher Arbeitstage.',
    bento3Tag: '03 · Diplomatische Kunden-E-Mail',
    bento3Title: 'Mehrkosten souverän und konfliktfrei begründen',
    bento3Desc: 'Bestätigt die pünktliche Umsetzung des Basispakets und bietet Change Order oder Backlog v1.1 zur Wahl.',
    bento4Tag: '04 · Juristischer Change Order (PDF / Word)',
    bento4Title: 'Offizieller Vertragsnachtrag mit Firmendaten',
    bento4Desc: 'Druckfertiges A4-Dokument mit Ihrem Agentur-Branding und Unterschriftsfeldern.',
    bottomCtaKicker: 'Bereit für Ihre Projektdokumente',
    bottomCtaTitle: 'Starten Sie jetzt Ihr kostenloses Pflichtenheft-Audit',
    bottomCtaDesc: 'Öffnen Sie den Workspace, wählen Sie ein Demo-Szenario oder laden Sie eigene Dateien hoch.',
    bottomCtaPrimary: 'Workspace öffnen',
    bottomCtaSecondary: 'Audit-Archiv',

    workspaceBadge: 'ScopeGuard Workspace',
    workspaceDefaultTitle: 'Pflichtenheft- & Meeting-Audit',
    workspaceSampleBtn: 'Beispielbericht',
    workspaceLibraryBtn: 'Bibliothek',
    workspaceArchiveBtn: 'Archiv',
    workspacePrintPdfBtn: 'PDF-Blatt / Drucken',
    step1Kicker: 'Schritt 1 · Unterlagen hochladen',
    step1Title: 'Ursprüngliches Pflichtenheft & Kundengespräch',
    demoTemplatesLabel: 'Demo-Vorlagen:',
    resetInputsBtn: 'Zurücksetzen',
    fieldProjectName: 'Projektname / Vertrags-Nr.',
    fieldHourlyRate: 'Stundensatz',
    fieldAuditDate: 'Audit-Datum',
    fieldReportLang: 'KI-Berichtssprache',
    fieldReportLangMatchUi: 'Wie Oberflächensprache',
    specFieldTitle: '1. Basis-Anforderungen (Pflichtenheft, Vertrag, Brief)',
    specDropTitle: 'Pflichtenheft hierher ziehen (PDF, DOCX, TXT)',
    specDropSub: 'Oder klicken, um Datei vom Gerät zu wählen',
    specChooseBtn: 'Datei wählen',
    specTextareaPlaceholder: 'Oder vereinbarte Vertragsklauseln manuell einfügen...',
    transcriptFieldTitle: '2. Meeting-Materialien (Audio oder Transkript)',
    transcriptDropTitle: 'Gesprächsaufnahme (MP3, WAV, M4A)',
    transcriptDropSub: 'Klicken zum Hochladen oder Transkript unten einfügen',
    transcriptChooseBtn: 'Medien laden',
    transcriptTextareaPlaceholder: 'Oder Zoom/Meet-Transkript bzw. Chatverlauf einfügen...',
    submitAuditBtn: 'Juristisches Scope-Creep-Audit starten',
    autoSaveArchiveNote: 'Alle Ergebnisse werden automatisch im Archiv und in der Cloud gespeichert',

    kpiProtectedBudget: 'Geschütztes Budget',
    kpiRateNote: 'Vertragssatz · Change Order',
    kpiHoursOut: 'Zusatzstunden',
    kpiHoursSub: '1–40 Std. Kalibrierung je Aufgabe',
    kpiDeadlineShift: 'Terminverschiebung',
    kpiDeadlineSub: 'Rechtliche Fristverlängerung',
    kpiDetectedCount: 'Erkannte Zusatzwünsche',
    tabAllSections: 'Alle Bereiche',
    tabRegistry: 'Register',
    tabClientEmail: 'Kunden-E-Mail',
    tabChangeOrder: 'Nachtrag (Change Order)',
    tabJsonSchema: 'JSON-Schema',
    syncTemplatesBtn: 'Vorlagen mit Register synchronisieren',
    copyEmailBtn: 'E-Mail kopieren',
    copiedBadge: 'Kopiert',
    exportPdfPrintBtn: 'PDF Export / Drucken',

    accountTabOverview: 'Profil & Übersicht',
    accountTabSettings: 'Einstellungen & Präferenzen',
    accountTabLibrary: 'Cloud-Bibliothek',
    accountNewAuditBtn: 'Neues Audit',
    accountRegisteredLabel: 'Registriert',
    accountQuotaTitle: 'Abonnement & Audit-Kontingent',
    accountUsedAuditsLabel: 'Verbrauchte Audits',
    accountAvailableNow: 'Jetzt verfügbar',
    accountCloudAuditsLabel: 'Cloud-Berichte',
    accountUpgradeBtn: 'Upgrade auf Pro (999 Audits + White-Label)',
    accountManageProBtn: 'Pro-Tarif & Firmendaten verwalten',

    settingsHeaderKicker: 'Globale Workspace-Konfiguration',
    settingsHeaderTitle: 'Kontoeinstellungen & Präferenzen',
    settingsHeaderDesc: 'Konfigurieren Sie Lokalisierung, Finanzstandards, KI-Tonalität und Sicherheit.',
    settingsSaveAllBtn: 'Einstellungen speichern',
    settingsSavedToastTitle: 'Einstellungen erfolgreich gespeichert',
    settingsSavedToastDesc: 'Lokalisierung, Stundensatz, Arbeitstage-Formel und Signatur wurden aktualisiert.',

    settingsCardATitle: 'A) Lokalisierung & Region',
    settingsCardADesc: 'Oberflächensprache, Sprache der KI-Dokumente und Datumsformat',
    settingsUiLangLabel: 'Oberflächensprache (10 globale Märkte)',
    settingsReportLangLabel: 'Sprache der generierten KI-Dokumente',
    settingsDateFormatLabel: 'Datums- und Zeitformat',
    settingsTimezoneLabel: 'Zeitzone',

    settingsCardBTitle: 'B) Finanz- & Arbeitsstandards (Standardwerte)',
    settingsCardBDesc: 'Automatische Übernahme von Währung, Stundensatz, Tagessoll und Steuerhinweis',
    settingsDefaultCurrencyLabel: 'Standardwährung',
    settingsDefaultRateLabel: 'Standard-Stundensatz der Agentur',
    settingsWorkHoursDayLabel: 'Arbeitsstunden pro Arbeitstag (Deadline-Formel)',
    settingsTaxNoteLabel: 'Steuerhinweis für Change Orders',
    taxVatExempt: 'Umsatzsteuerfrei (Ohne MwSt.)',
    taxVat20: 'Inklusive 20% MwSt.',
    taxUsn: 'Kleinunternehmerregelung / USN',
    taxVatExclusive: 'VAT Exclusive (Zzgl. gesetzlicher MwSt.)',

    settingsCardCTitle: 'C) KI-Auditor & Juristische Vorlagen',
    settingsCardCDesc: 'E-Mail-Tonalität, Prüfstrenge und Standardsignatur',
    settingsEmailToneLabel: 'Tonalität der Kunden-E-Mail',
    toneDiplomatic: 'Diplomatisch & verbindlich (konfliktfrei)',
    toneStrictLegal: 'Strikt juristisch (Formale Vertragsverweise)',
    tonePartnerBacklog: 'Partnerschaftlich mit Backlog v1.1 Vorschlag',
    settingsStrictnessLabel: 'Strenge der Scope-Creep-Erkennung',
    strictnessStandard: 'Standard (Ausgewogene Prüfung)',
    strictnessMeticulous: 'Maximale Akribie (Auch kleine UI-Änderungen erfassen)',
    strictnessCriticalOnly: 'Nur kritische Architektur-Abweichungen',
    settingsDefaultSignatureLabel: 'Standardsignatur für E-Mails & PDF-Blätter',
    settingsSignaturePlaceholder: 'Name / Agentur, Position, Kontakt',

    settingsCardDTitle: 'D) Sicherheit, Benachrichtigungen & Daten',
    settingsCardDDesc: 'E-Mail-Kopien, Entwurf-Autospeicherung und Datenexport',
    settingsEmailCopyToggle: 'Kopie fertiger Prüfberichte an meine E-Mail senden',
    settingsQuotaAlertToggle: 'Benachrichtigen, wenn das Audit-Kontingent endet',
    settingsAutoSaveDraftsToggle: 'Entwürfe automatisch im Browser speichern',
    settingsPasswordSectionLabel: 'Passwort ändern oder 6-stelligen E-Mail-Code senden',
    settingsSendOtpBtn: '6-stelligen Code per E-Mail senden',
    settingsExportJsonBtn: 'Alle Berichte exportieren (JSON)',
    settingsExportCsvBtn: 'Alle Berichte exportieren (CSV)',

    authLoginTitle: 'Im Konto anmelden',
    authRegisterTitle: 'Agenturkonto erstellen',
    authTabLogin: 'Anmelden',
    authTabRegister: 'Registrieren',
    authStudioNameLabel: 'Name oder IT-Agentur',
    authEmailLabel: 'Geschäftliche E-Mail',
    authPasswordLabel: 'Passwort (mind. 6 Zeichen)',
    authLoginWithOtp: 'Mit E-Mail-Code anmelden',
    authLoginWithPassword: 'Mit Passwort anmelden',
    authSubmitLogin: 'Im Workspace anmelden',
    authSubmitRegister: 'Konto erstellen & starten',
    footerTagline: 'ScopeGuard Legal — Schutz für IT-Agenturen vor unbezahltem Scope Creep',
  },

  fr: {
    navLanding: 'Accueil',
    navWorkspace: 'Espace Audit',
    navArchive: 'Archives',
    navAccount: 'Mon Compte',
    navAdmin: 'Console Admin',
    navLoginRegister: 'Connexion / Inscription',
    navSignOut: 'Déconnexion',
    navLanguageLabel: 'Langue de l’interface',
    navCurrencyLabel: 'Devise',
    navFreeChecksLeft: 'Audits gratuits',
    navChecksUsed: 'Audits',
    navManagePlan: 'Gérer l’abonnement',
    navAccountAndLibrary: 'Compte et Préférences',
    navProfileMobile: 'Profil',

    heroBadgeSubtitle: 'Protection IA contre le Scope Creep pour Agences IT & Freelances',
    heroTitleHighlight: 'Protégez le budget de vos projets contre les ajouts gratuits',
    heroTitleSuffix: 'en 30 secondes',
    heroSubtitle:
      'Importez votre cahier des charges (CDC) et la transcription de réunion. L’IA compare chaque demande client au contrat, estime la charge (1–40h) et rédige un avenant (Change Order) avec un e-mail diplomatique.',
    heroCtaStart: 'Ouvrir l’espace · Lancer l’audit',
    heroCtaSample: 'Voir un exemple de rapport',
    heroFormatsNote: 'PDF, DOCX, TXT, MP3, WAV jusqu’à 25 Mo',
    heroExportNote: 'Exportation du Change Order en PDF et Word',
    heroShowcaseBadge: 'Démonstration Interactive de l’Audit IA',
    heroSourceSpecLabel: 'Contrat / Cahier des Charges',
    heroCallTranscriptLabel: 'Transcription de l’appel',
    heroTimecodeLabel: 'Timecode',
    heroOutOfScopeBadge: 'Hors Périmètre Contractuel',
    heroFoundItemsPrefix: 'Ajouts hors périmètre :',
    heroFoundItemsOn: 'valorisés à',
    heroHoursUnit: 'h',
    heroShiftPrefix: 'Délai',
    heroShiftDaysUnit: 'j. ouvrés',
    heroEmailAndCoLink: 'Voir l’e-mail et l’avenant →',
    heroOpenInWorkspace: 'Ouvrir dans l’espace',
    bentoBadge: 'Argumentation Juridique et Technique Complète',
    bentoTitle: 'Quatre livrables qui mettent fin aux litiges sur les « modifications gratuites »',
    bentoSubtitle:
      'Remplacez les négociations tendues par un rapport structuré avec timecodes, chiffrage horaire et avenant prêt à signer.',
    bento1Tag: '01 · Détecteur de Scope Creep horodaté',
    bento1Title: 'Croisement audio & transcription avec les clauses du CDC',
    bento1Desc: 'Prend en charge PDF, DOCX, TXT et fichiers audio MP3/WAV avec citation exacte du client.',
    bento2Tag: '02 · Chiffrage dynamique 1–40h',
    bento2Title: 'Calcul automatique du budget et du report de livraison',
    bento2Desc: 'Conversion instantanée en 7 devises et calcul du décalage légal en jours ouvrés.',
    bento3Tag: '03 · E-mail Client Diplomatique',
    bento3Title: 'Justifiez la facturation complémentaire sans conflit',
    bento3Desc: 'Confirme le respect du périmètre initial et propose le choix entre un Change Order ou le Backlog v1.1.',
    bento4Tag: '04 · Avenant Juridique (PDF / Word)',
    bento4Title: 'Annexe officielle au contrat avec coordonnées des parties',
    bento4Desc: 'Génération automatique d’un feuillet A4 prêt à signer en PDF et Word.',
    bottomCtaKicker: 'Prêt à auditer vos documents',
    bottomCtaTitle: 'Lancez un audit gratuit de votre cahier des charges',
    bottomCtaDesc: 'Accédez à l’espace de travail, chargez un cas démo en 1 clic ou déposez vos fichiers.',
    bottomCtaPrimary: 'Ouvrir l’espace de travail',
    bottomCtaSecondary: 'Archives des audits',

    workspaceBadge: 'Espace ScopeGuard',
    workspaceDefaultTitle: 'Audit du Cahier des Charges et de Réunion',
    workspaceSampleBtn: 'Exemple',
    workspaceLibraryBtn: 'Bibliothèque',
    workspaceArchiveBtn: 'Archives',
    workspacePrintPdfBtn: 'Fiche PDF / Imprimer',
    step1Kicker: 'Étape 1 · Importation des documents',
    step1Title: 'Cahier des charges initial & Enregistrement de réunion',
    demoTemplatesLabel: 'Cas de démo :',
    resetInputsBtn: 'Réinitialiser',
    fieldProjectName: 'Nom du projet / Contrat n°',
    fieldHourlyRate: 'Taux horaire',
    fieldAuditDate: 'Date de l’audit',
    fieldReportLang: 'Langue du rapport IA',
    fieldReportLangMatchUi: 'Identique à l’interface',
    specFieldTitle: '1. Exigences initiales (CDC, Contrat, Brief)',
    specDropTitle: 'Glissez le fichier du CDC (PDF, DOCX, TXT)',
    specDropSub: 'Ou cliquez pour sélectionner un document',
    specChooseBtn: 'Choisir un fichier',
    specTextareaPlaceholder: 'Ou collez manuellement les clauses du cahier des charges...',
    transcriptFieldTitle: '2. Notes de réunion (Audio ou Transcription)',
    transcriptDropTitle: 'Enregistrement d’appel (MP3, WAV, M4A)',
    transcriptDropSub: 'Cliquez pour importer l’audio ou collez la transcription ci-dessous',
    transcriptChooseBtn: 'Importer média',
    transcriptTextareaPlaceholder: 'Ou collez la transcription Zoom/Meet ou les messages...',
    submitAuditBtn: 'Lancer l’audit juridique Scope Creep',
    autoSaveArchiveNote: 'Toutes les divergences détectées sont sauvegardées dans les Archives et le Cloud',

    kpiProtectedBudget: 'Budget Protégé',
    kpiRateNote: 'Taux contractuel · Change Order',
    kpiHoursOut: 'Heures Hors Périmètre',
    kpiHoursSub: 'Calibrage 1–40h par tâche',
    kpiDeadlineShift: 'Report de Délai',
    kpiDeadlineSub: 'Prolongation légale du jalon',
    kpiDetectedCount: 'Demandes Hors CDC',
    tabAllSections: 'Toutes les sections',
    tabRegistry: 'Registre',
    tabClientEmail: 'E-mail Client',
    tabChangeOrder: 'Avenant (Change Order)',
    tabJsonSchema: 'Schéma JSON',
    syncTemplatesBtn: 'Synchroniser les modèles',
    copyEmailBtn: 'Copier l’e-mail',
    copiedBadge: 'Copié',
    exportPdfPrintBtn: 'Exporter PDF / Imprimer',

    accountTabOverview: 'Profil & Résumé',
    accountTabSettings: 'Paramètres & Préférences',
    accountTabLibrary: 'Bibliothèque Cloud',
    accountNewAuditBtn: 'Nouvel Audit',
    accountRegisteredLabel: 'Inscription',
    accountQuotaTitle: 'Abonnement & Quotas d’Audit',
    accountUsedAuditsLabel: 'Audits utilisés',
    accountAvailableNow: 'Disponibles',
    accountCloudAuditsLabel: 'Audits dans le Cloud',
    accountUpgradeBtn: 'Passer au Plan Pro (999 audits + White-Label)',
    accountManageProBtn: 'Gérer le Plan Pro et les mentions légales',

    settingsHeaderKicker: 'Configuration Globale de l’Espace',
    settingsHeaderTitle: 'Paramètres et Préférences du Compte',
    settingsHeaderDesc: 'Configurez la langue, vos standards financiers, le ton de l’auditeur IA et la sécurité.',
    settingsSaveAllBtn: 'Enregistrer les paramètres',
    settingsSavedToastTitle: 'Paramètres enregistrés',
    settingsSavedToastDesc: 'Langue, taux horaire, formule de délai et signature synchronisés.',

    settingsCardATitle: 'A) Localisation et Région',
    settingsCardADesc: 'Langue de l’interface, langue des documents IA et format de date',
    settingsUiLangLabel: 'Langue de l’interface (10 marchés mondiaux)',
    settingsReportLangLabel: 'Langue des documents générés par l’IA',
    settingsDateFormatLabel: 'Format de date et d’heure',
    settingsTimezoneLabel: 'Fuseau horaire',

    settingsCardBTitle: 'B) Standards Financiers et de Travail par Défaut',
    settingsCardBDesc: 'Devise, taux horaire, durée journalière et mention fiscale automatiques',
    settingsDefaultCurrencyLabel: 'Devise par défaut',
    settingsDefaultRateLabel: 'Taux horaire standard de l’agence',
    settingsWorkHoursDayLabel: 'Heures ouvrées par jour (Formule de délai)',
    settingsTaxNoteLabel: 'Mention fiscale pour les Avenants (Change Order)',
    taxVatExempt: 'Exonéré de TVA (Hors TVA)',
    taxVat20: 'TVA 20% incluse',
    taxUsn: 'Régime simplifié (Micro-entreprise / USN)',
    taxVatExclusive: 'VAT Exclusive (HT + taxes applicables)',

    settingsCardCTitle: 'C) Préférences de l’Auditeur IA et Modèles Juridiques',
    settingsCardCDesc: 'Ton de l’e-mail client, rigueur de détection et signature par défaut',
    settingsEmailToneLabel: 'Ton de l’e-mail client',
    toneDiplomatic: 'Diplomatique et souple (Sans confrontation)',
    toneStrictLegal: 'Juridique strict (Références contractuelles)',
    tonePartnerBacklog: 'Partenaire avec proposition de Backlog v1.1',
    settingsStrictnessLabel: 'Rigueur de détection du Scope Creep',
    strictnessStandard: 'Standard (Audit équilibré)',
    strictnessMeticulous: 'Méticuleuse (Détecter même les retouches UI mineures)',
    strictnessCriticalOnly: 'Écarts architecturaux critiques uniquement',
    settingsDefaultSignatureLabel: 'Signature par défaut pour e-mails et PDF',
    settingsSignaturePlaceholder: 'Nom / Agence, Fonction, Contact',

    settingsCardDTitle: 'D) Sécurité, Notifications et Données',
    settingsCardDDesc: 'Alertes e-mail, sauvegarde automatique des brouillons et exportation',
    settingsEmailCopyToggle: 'Envoyer une copie du rapport final par e-mail',
    settingsQuotaAlertToggle: 'M’avertir lorsque mon quota d’audits arrive à expiration',
    settingsAutoSaveDraftsToggle: 'Sauvegarde automatique des brouillons dans le navigateur',
    settingsPasswordSectionLabel: 'Modifier le mot de passe ou envoyer un code à 6 chiffres',
    settingsSendOtpBtn: 'Envoyer un code à 6 chiffres par e-mail',
    settingsExportJsonBtn: 'Exporter tous mes rapports (JSON)',
    settingsExportCsvBtn: 'Exporter tous mes rapports (CSV)',

    authLoginTitle: 'Connexion à votre compte',
    authRegisterTitle: 'Créer un compte Agence',
    authTabLogin: 'Connexion',
    authTabRegister: 'Inscription',
    authStudioNameLabel: 'Votre nom ou nom de l’agence IT',
    authEmailLabel: 'E-mail professionnel',
    authPasswordLabel: 'Mot de passe (6 caractères min.)',
    authLoginWithOtp: 'Se connecter avec un code e-mail',
    authLoginWithPassword: 'Se connecter avec mot de passe',
    authSubmitLogin: 'Accéder à l’espace',
    authSubmitRegister: 'Créer un compte et démarrer',
    footerTagline: 'ScopeGuard Legal — Protection des agences IT contre le Scope Creep non facturé',
  },

  pt: {
    navLanding: 'Início',
    navWorkspace: 'Painel',
    navArchive: 'Arquivo',
    navAccount: 'Minha Conta',
    navAdmin: 'Painel Dev',
    navLoginRegister: 'Entrar / Cadastrar',
    navSignOut: 'Sair',
    navLanguageLabel: 'Idioma da interface',
    navCurrencyLabel: 'Moeda',
    navFreeChecksLeft: 'Auditorias grátis',
    navChecksUsed: 'Auditorias',
    navManagePlan: 'Gerenciar Plano',
    navAccountAndLibrary: 'Conta e Configurações',
    navProfileMobile: 'Perfil',

    heroBadgeSubtitle: 'Proteção com IA contra Scope Creep para Agências de TI e Freelancers',
    heroTitleHighlight: 'Proteja o orçamento do seu projeto contra alterações gratuitas',
    heroTitleSuffix: 'em 30 segundos',
    heroSubtitle:
      'Envie o escopo inicial (SOW) e a gravação ou transcrição da reunião. A IA cruza cada pedido do cliente com o contrato, estima horas (1–40h) e gera um Termo Aditivo (Change Order) com um e-mail diplomático.',
    heroCtaStart: 'Abrir Painel · Iniciar Auditoria',
    heroCtaSample: 'Ver Relatório de Exemplo',
    heroFormatsNote: 'PDF, DOCX, TXT, MP3, WAV até 25 MB',
    heroExportNote: 'Exportação de Change Order em PDF e Word',
    heroShowcaseBadge: 'Demonstração Interativa de Auditoria IA',
    heroSourceSpecLabel: 'Contrato / Escopo Base',
    heroCallTranscriptLabel: 'Transcrição da Reunião',
    heroTimecodeLabel: 'Minuto',
    heroOutOfScopeBadge: 'Fora do Escopo Contratual',
    heroFoundItemsPrefix: 'Demandas extras encontradas:',
    heroFoundItemsOn: 'no valor de',
    heroHoursUnit: 'h',
    heroShiftPrefix: 'Prazo',
    heroShiftDaysUnit: 'dias úteis',
    heroEmailAndCoLink: 'Ver e-mail e Termo Aditivo →',
    heroOpenInWorkspace: 'Abrir no Painel',
    bentoBadge: 'Argumentação Jurídica e Técnica Completa',
    bentoTitle: 'Quatro documentos que encerram qualquer disputa sobre “ajustes grátis”',
    bentoSubtitle:
      'Em vez de desgaste com o cliente, envie um relatório estruturado com minutagem, cálculo de horas e Termo Aditivo pronto para assinatura.',
    bento1Tag: '01 · Detector de Scope Creep com Minutagem',
    bento1Title: 'Cruzamento de áudio e transcrição com cláusulas do escopo',
    bento1Desc: 'Suporta PDF, DOCX, TXT e gravações MP3/WAV com citação exata do cliente.',
    bento2Tag: '02 · Orçamento Dinâmico 1–40h',
    bento2Title: 'Cálculo automático de orçamento e prorrogação de prazo',
    bento2Desc: 'Conversão instantânea em 7 moedas com cálculo automático de dias úteis adicionais.',
    bento3Tag: '03 · E-mail Diplomático ao Cliente',
    bento3Title: 'Justifique horas extras sem atrito comercial',
    bento3Desc: 'Confirma a entrega do escopo base no prazo e oferece aprovar o Change Order ou mover para o Backlog v1.1.',
    bento4Tag: '04 · Change Order Jurídico (PDF / Word)',
    bento4Title: 'Termo Aditivo Oficial com dados das partes',
    bento4Desc: 'Folha A4 pronta para impressão e assinatura em PDF e Word.',
    bottomCtaKicker: 'Pronto para auditar seus documentos',
    bottomCtaTitle: 'Inicie uma auditoria gratuita de escopo e reunião agora',
    bottomCtaDesc: 'Acesse o painel, escolha um caso de demonstração em 1 clique ou envie seus arquivos.',
    bottomCtaPrimary: 'Abrir Painel',
    bottomCtaSecondary: 'Arquivo de Auditorias',

    workspaceBadge: 'Painel ScopeGuard',
    workspaceDefaultTitle: 'Auditoria de Escopo Técnico e Reunião',
    workspaceSampleBtn: 'Exemplo',
    workspaceLibraryBtn: 'Biblioteca',
    workspaceArchiveBtn: 'Arquivo',
    workspacePrintPdfBtn: 'Folha PDF / Imprimir',
    step1Kicker: 'Passo 1 · Envio de Materiais',
    step1Title: 'Escopo Técnico Inicial e Gravação da Reunião',
    demoTemplatesLabel: 'Modelos Demo:',
    resetInputsBtn: 'Limpar',
    fieldProjectName: 'Nome do Projeto / Contrato',
    fieldHourlyRate: 'Valor da Hora',
    fieldAuditDate: 'Data da Auditoria',
    fieldReportLang: 'Idioma do Relatório IA',
    fieldReportLangMatchUi: 'Igual ao idioma da interface',
    specFieldTitle: '1. Requisitos Iniciais (Escopo, Contrato, Brief)',
    specDropTitle: 'Arraste o arquivo de escopo (PDF, DOCX, TXT)',
    specDropSub: 'Ou clique para selecionar do seu dispositivo',
    specChooseBtn: 'Escolher arquivo',
    specTextareaPlaceholder: 'Ou cole manualmente as cláusulas do escopo técnico...',
    transcriptFieldTitle: '2. Materiais da Reunião (Áudio ou Transcrição)',
    transcriptDropTitle: 'Gravação da chamada (MP3, WAV, M4A)',
    transcriptDropSub: 'Clique para enviar áudio ou cole a transcrição abaixo',
    transcriptChooseBtn: 'Enviar mídia',
    transcriptTextareaPlaceholder: 'Ou cole a transcrição do Zoom/Meet ou conversa do WhatsApp...',
    submitAuditBtn: 'Executar Auditoria Jurídica de Scope Creep',
    autoSaveArchiveNote: 'Todas as divergências são salvas automaticamente no Arquivo e na Nuvem',

    kpiProtectedBudget: 'Orçamento Protegido',
    kpiRateNote: 'Taxa contratual · Change Order',
    kpiHoursOut: 'Horas Extras Fora do Escopo',
    kpiHoursSub: 'Calibragem de 1–40h por tarefa',
    kpiDeadlineShift: 'Adicional de Prazo',
    kpiDeadlineSub: 'Prorrogação contratual da entrega',
    kpiDetectedCount: 'Itens Fora do Escopo',
    tabAllSections: 'Todas as Seções',
    tabRegistry: 'Registro',
    tabClientEmail: 'E-mail ao Cliente',
    tabChangeOrder: 'Termo Aditivo',
    tabJsonSchema: 'Esquema JSON',
    syncTemplatesBtn: 'Sincronizar modelos com o registro',
    copyEmailBtn: 'Copiar e-mail',
    copiedBadge: 'Copiado',
    exportPdfPrintBtn: 'Exportar PDF / Imprimir',

    accountTabOverview: 'Perfil e Visão Geral',
    accountTabSettings: 'Configurações e Preferências',
    accountTabLibrary: 'Biblioteca na Nuvem',
    accountNewAuditBtn: 'Nova Auditoria',
    accountRegisteredLabel: 'Cadastro',
    accountQuotaTitle: 'Assinatura e Limites de Auditoria',
    accountUsedAuditsLabel: 'Auditorias realizadas',
    accountAvailableNow: 'Disponíveis agora',
    accountCloudAuditsLabel: 'Relatórios na nuvem',
    accountUpgradeBtn: 'Mudar para o Plano Pro (999 auditorias + White-Label)',
    accountManageProBtn: 'Gerenciar Plano Pro e Dados da Agência',

    settingsHeaderKicker: 'Configuração Global do Espaço de Trabalho',
    settingsHeaderTitle: 'Configurações e Preferências da Conta',
    settingsHeaderDesc: 'Configure localização, padrões financeiros, tom do auditor IA e segurança.',
    settingsSaveAllBtn: 'Salvar Configurações',
    settingsSavedToastTitle: 'Configurações salvas com sucesso',
    settingsSavedToastDesc: 'Idioma, valor hora padrão, fórmula de prazo e assinatura sincronizados.',

    settingsCardATitle: 'A) Localização e Região',
    settingsCardADesc: 'Idioma da interface, idioma dos documentos IA e formato de data',
    settingsUiLangLabel: 'Idioma da Interface (10 mercados globais)',
    settingsReportLangLabel: 'Idioma dos Documentos Gerados pela IA',
    settingsDateFormatLabel: 'Formato de Data e Hora',
    settingsTimezoneLabel: 'Fuso Horário',

    settingsCardBTitle: 'B) Padrões Financeiros e de Trabalho',
    settingsCardBDesc: 'Moeda, valor/hora, horas por dia útil e nota fiscal automáticos',
    settingsDefaultCurrencyLabel: 'Moeda Padrão',
    settingsDefaultRateLabel: 'Taxa Horária Padrão da Agência',
    settingsWorkHoursDayLabel: 'Horas de Trabalho por Dia Útil (Fórmula de Prazo)',
    settingsTaxNoteLabel: 'Observação Tributária para Termos Aditivos',
    taxVatExempt: 'Isento de Impostos / Sem IVA',
    taxVat20: 'Impostos Inclusos (20%)',
    taxUsn: 'Simples Nacional / Regime Simplificado',
    taxVatExclusive: 'VAT Exclusive (+ impostos aplicáveis)',

    settingsCardCTitle: 'C) Preferências do Auditor IA e Modelos Jurídicos',
    settingsCardCDesc: 'Tom do e-mail ao cliente, rigor da análise e assinatura padrão',
    settingsEmailToneLabel: 'Tom do E-mail ao Cliente',
    toneDiplomatic: 'Diplomático e Suave (Sem confronto)',
    toneStrictLegal: 'Jurídico Estrito (Citações formais do contrato)',
    tonePartnerBacklog: 'Parceiro com proposta de Backlog v1.1',
    settingsStrictnessLabel: 'Rigor na Detecção de Scope Creep',
    strictnessStandard: 'Padrão (Auditoria equilibrada)',
    strictnessMeticulous: 'Máxima Minúcia (Detectar pequenos ajustes de UI)',
    strictnessCriticalOnly: 'Apenas Divergências Arquiteturais Críticas',
    settingsDefaultSignatureLabel: 'Assinatura Padrão para E-mails e PDF',
    settingsSignaturePlaceholder: 'Nome / Agência, Cargo, Contato',

    settingsCardDTitle: 'D) Segurança, Notificações e Dados',
    settingsCardDDesc: 'Notificações por e-mail, salvamento automático e exportação',
    settingsEmailCopyToggle: 'Enviar cópia do relatório concluído para meu e-mail',
    settingsQuotaAlertToggle: 'Avisar quando o limite de auditorias estiver acabando',
    settingsAutoSaveDraftsToggle: 'Salvar rascunhos automaticamente no navegador',
    settingsPasswordSectionLabel: 'Alterar Senha ou Enviar Código de 6 Dígitos',
    settingsSendOtpBtn: 'Enviar Código de 6 Dígitos por E-mail',
    settingsExportJsonBtn: 'Exportar Todos os Meus Relatórios (JSON)',
    settingsExportCsvBtn: 'Exportar Todos os Meus Relatórios (CSV)',

    authLoginTitle: 'Entrar na Sua Conta',
    authRegisterTitle: 'Criar Conta da Agência',
    authTabLogin: 'Entrar',
    authTabRegister: 'Cadastrar',
    authStudioNameLabel: 'Seu Nome ou Nome da Agência de TI',
    authEmailLabel: 'E-mail Corporativo',
    authPasswordLabel: 'Senha (mínimo de 6 caracteres)',
    authLoginWithOtp: 'Entrar com código por e-mail',
    authLoginWithPassword: 'Entrar com senha',
    authSubmitLogin: 'Entrar no Painel',
    authSubmitRegister: 'Criar Conta e Começar',
    footerTagline: 'ScopeGuard Legal — Proteção para Agências de TI contra Scope Creep não remunerado',
  },

  ar: {
    navLanding: 'الرئيسية',
    navWorkspace: 'مساحة العمل',
    navArchive: 'الأرشيف',
    navAccount: 'حسابي',
    navAdmin: 'لوحة المطور',
    navLoginRegister: 'دخول / تسجيل',
    navSignOut: 'تسجيل الخروج',
    navLanguageLabel: 'لغة الواجهة',
    navCurrencyLabel: 'العملة',
    navFreeChecksLeft: 'عمليات التدقيق المتبقية',
    navChecksUsed: 'التدقيقات',
    navManagePlan: 'إدارة الباقة',
    navAccountAndLibrary: 'الحساب والإعدادات',
    navProfileMobile: 'الملف الشخصي',

    heroBadgeSubtitle: 'حماية ذكية لمشاريع تقنية المعلومات من توسع النطاق غير المدفوع',
    heroTitleHighlight: 'احمِ ميزانية مشروعك من التعديلات المجانية غير المتفق عليها',
    heroTitleSuffix: 'خلال 30 ثانية',
    heroSubtitle:
      'ارفع وثيقة المواصفات الفنية (SOW) وتسجيل أو نص اجتماع العميل. يقوم الذكاء الاصطناعي بمطابقة كل طلب مع بنود العقد، وتقدير الساعات (1–40 ساعة)، وصياغة ملحق عقد رسمي (Change Order) ورسالة دبلوماسية للعميل.',
    heroCtaStart: 'افتح مساحة العمل · ابدأ التدقيق',
    heroCtaSample: 'معاينة تقرير نموذجي',
    heroFormatsNote: 'PDF, DOCX, TXT, MP3, WAV حتى 25 ميجابايت',
    heroExportNote: 'تصدير ملحق العقد بصيغة PDF و Word',
    heroShowcaseBadge: 'عرض تفاعلي للتدقيق القانوني بالذكاء الاصطناعي',
    heroSourceSpecLabel: 'العقد الأصلي / كراسة الشروط',
    heroCallTranscriptLabel: 'نص الاجتماع',
    heroTimecodeLabel: 'التوقيت',
    heroOutOfScopeBadge: 'خارج نطاق العقد',
    heroFoundItemsPrefix: 'إضافات مكتشفة:',
    heroFoundItemsOn: 'بقيمة',
    heroHoursUnit: 'ساعة',
    heroShiftPrefix: 'تمديد',
    heroShiftDaysUnit: 'يوم عمل',
    heroEmailAndCoLink: 'عرض نص الرسالة وملحق العقد ←',
    heroOpenInWorkspace: 'فتح في مساحة العمل',
    bentoBadge: 'حجج قانونية وفنية متكاملة',
    bentoTitle: 'أربع وثائق تنهي أي جدال حول «التعديلات المجانية»',
    bentoSubtitle:
      'بدلاً من النقاشات المرهقة، أرسل تقريراً موثقاً بالتوقيت الزمني وحساب الساعات وملحق عقد جاهز للتوقيع.',
    bento1Tag: '01 · كاشف توسع النطاق بالتوقيت الزمني',
    bento1Title: 'مطابقة التسجيلات الصوتية والنصوص مع بنود العقد',
    bento1Desc: 'يدعم ملفات PDF و DOCX و MP3/WAV ويربط كل طلب إضافي باقتباس العميل الدقيق.',
    bento2Tag: '02 · حاسبة تكلفة فورية 1–40 ساعة',
    bento2Title: 'حساب تلقائي للميزانية وتمديد موعد التسليم',
    bento2Desc: 'تحويل فوري بين 7 عملات عالمية مع احتساب أيام العمل الإضافية قانونياً.',
    bento3Tag: '03 · رسالة بريد إلكتروني دبلوماسية',
    bento3Title: 'تبرير التكلفة الإضافية بهدوء واحترافية',
    bento3Desc: 'تؤكد الالتزام بتسليم النطاق الأساسي وتخير العميل بين توقيع ملحق عقد أو التأجيل للمرحلة v1.1.',
    bento4Tag: '04 · ملحق عقد قانوني (PDF / Word)',
    bento4Title: 'ملحق رسمي للعقد ببيانات الطرفين وجدول الأعمال',
    bento4Desc: 'توليد فوري لوثيقة A4 جاهزة للطباعة والتوقيع بصيغتي PDF و Word.',
    bottomCtaKicker: 'جاهز لتدقيق وثائق مشروعك',
    bottomCtaTitle: 'ابدأ التدقيق المجاني لكراسة الشروط والاجتماع الآن',
    bottomCtaDesc: 'انتقل إلى مساحة العمل، اختر نموذجاً جاهزاً بنقرة واحدة أو ارفع ملفاتك.',
    bottomCtaPrimary: 'افتح مساحة العمل',
    bottomCtaSecondary: 'أرشيف التدقيقات',

    workspaceBadge: 'مساحة عمل ScopeGuard',
    workspaceDefaultTitle: 'تدقيق المواصفات الفنية ومحضر الاجتماع',
    workspaceSampleBtn: 'نموذج تقرير',
    workspaceLibraryBtn: 'المكتبة',
    workspaceArchiveBtn: 'الأرشيف',
    workspacePrintPdfBtn: 'وثيقة PDF / طباعة',
    step1Kicker: 'الخطوة 1 · رفع المستندات',
    step1Title: 'المواصفات الفنية الأصلية وتسجيل اجتماع العميل',
    demoTemplatesLabel: 'نماذج تجريبية:',
    resetInputsBtn: 'إعادة ضبط',
    fieldProjectName: 'اسم المشروع / رقم العقد',
    fieldHourlyRate: 'سعر الساعة',
    fieldAuditDate: 'تاريخ التدقيق',
    fieldReportLang: 'لغة توليد تقرير الذكاء الاصطناعي',
    fieldReportLangMatchUi: 'مطابق للغة الواجهة',
    specFieldTitle: '1. المتطلبات الأساسية (كراسة الشروط، العقد)',
    specDropTitle: 'اسحب ملف المواصفات هنا (PDF, DOCX, TXT)',
    specDropSub: 'أو انقر لاختيار ملف من جهازك',
    specChooseBtn: 'اختيار ملف',
    specTextareaPlaceholder: 'أو الصق بنود المواصفات الفنية المتفق عليها يدوياً...',
    transcriptFieldTitle: '2. مواد الاجتماع (تسجيل صوتي أو نص المحضر)',
    transcriptDropTitle: 'تسجيل المكالمة (MP3, WAV, M4A)',
    transcriptDropSub: 'انقر لرفع الملف الصوتي أو الصق النص أدناه',
    transcriptChooseBtn: 'رفع وسائط',
    transcriptTextareaPlaceholder: 'أو الصق نص اجتماع Zoom/Meet أو محادثات العميل...',
    submitAuditBtn: 'تشغيل التدقيق القانوني لتوسع النطاق',
    autoSaveArchiveNote: 'يتم حفظ جميع الفروقات المكتشفة تلقائياً في الأرشيف والسحابة',

    kpiProtectedBudget: 'الميزانية المحمية',
    kpiRateNote: 'بسعر العقد · Change Order',
    kpiHoursOut: 'ساعات خارج النطاق',
    kpiHoursSub: 'معايرة 1–40 ساعة لكل مهمة',
    kpiDeadlineShift: 'تمديد موعد التسليم',
    kpiDeadlineSub: 'تمديد قانوني للمرحلة',
    kpiDetectedCount: 'طلبات إضافية مكتشفة',
    tabAllSections: 'كل الأقسام',
    tabRegistry: 'السجل',
    tabClientEmail: 'رسالة العميل',
    tabChangeOrder: 'ملحق العقد',
    tabJsonSchema: 'مخطط JSON',
    syncTemplatesBtn: 'مزامنة القوالب مع السجل',
    copyEmailBtn: 'نسخ الرسالة',
    copiedBadge: 'تم النسخ',
    exportPdfPrintBtn: 'تصدير PDF / طباعة',

    accountTabOverview: 'الملف الشخصي والملخص',
    accountTabSettings: 'الإعدادات والتفضيلات',
    accountTabLibrary: 'المكتبة السحابية',
    accountNewAuditBtn: 'تدقيق جديد',
    accountRegisteredLabel: 'تاريخ التسجيل',
    accountQuotaTitle: 'الاشتراك وحدود التدقيق',
    accountUsedAuditsLabel: 'عمليات التدقيق المستخدمة',
    accountAvailableNow: 'متاح الآن',
    accountCloudAuditsLabel: 'تقارير في السحابة',
    accountUpgradeBtn: 'الترقية إلى باقة Pro (999 تدقيق + علامة تجارية خاصة)',
    accountManageProBtn: 'إدارة باقة Pro والبيانات القانونية',

    settingsHeaderKicker: 'الإعدادات الشاملة لمساحة العمل',
    settingsHeaderTitle: 'إعدادات وتفضيلات الحساب',
    settingsHeaderDesc: 'اضبط اللغة، المعايير المالية الافتراضية، أسلوب صياغة الذكاء الاصطناعي وإعدادات الأمان.',
    settingsSaveAllBtn: 'حفظ الإعدادات',
    settingsSavedToastTitle: 'تم حفظ الإعدادات بنجاح',
    settingsSavedToastDesc: 'تم تحديث اللغة وسعر الساعة ومعادلة أيام العمل والتوقيع.',

    settingsCardATitle: 'أ) اللغة والمنطقة الجغرافية',
    settingsCardADesc: 'لغة الواجهة، لغة المستندات المولدة بالذكاء الاصطناعي وتنسيق التاريخ',
    settingsUiLangLabel: 'لغة الواجهة (10 أسواق عالمية)',
    settingsReportLangLabel: 'لغة المستندات المولدة بالذكاء الاصطناعي',
    settingsDateFormatLabel: 'تنسيق التاريخ والوقت',
    settingsTimezoneLabel: 'المنطقة الزمنية',

    settingsCardBTitle: 'ب) المعايير المالية ومعايير العمل الافتراضية',
    settingsCardBDesc: 'التعبئة التلقائية للعملة وسعر الساعة وساعات يوم العمل والضريبة',
    settingsDefaultCurrencyLabel: 'العملة الأساسية الافتراضية',
    settingsDefaultRateLabel: 'سعر الساعة القياسي للشركة / المستقل',
    settingsWorkHoursDayLabel: 'ساعات العمل في اليوم الواحد (معادلة التمديد)',
    settingsTaxNoteLabel: 'ملاحظة الضريبة في ملاحق العقود (Change Order)',
    taxVatExempt: 'معفى من ضريبة القيمة المضافة (بدون ضريبة)',
    taxVat20: 'شامل ضريبة القيمة المضافة 20%',
    taxUsn: 'نظام ضريبي مبسط (USN)',
    taxVatExclusive: 'غير شامل الضريبة (VAT Exclusive)',

    settingsCardCTitle: 'ج) إعدادات المدقق الذكي والقوالب القانونية',
    settingsCardCDesc: 'نبرة رسالة العميل، دقة فحص النطاق والتوقيع الافتراضي',
    settingsEmailToneLabel: 'نبرة رسالة العميل',
    toneDiplomatic: 'دبلوماسية وهادئة (بدون مواجهة)',
    toneStrictLegal: 'قانونية صارمة (إحالة لبنود العقد)',
    tonePartnerBacklog: 'شراكة تعاونية مع اقتراح المرحلة v1.1',
    settingsStrictnessLabel: 'دقة وصرامة كشف توسع النطاق',
    strictnessStandard: 'قياسية (تدقيق متوازن)',
    strictnessMeticulous: 'دقيقة للغاية (رصد حتى تعديلات الواجهة البسيطة)',
    strictnessCriticalOnly: 'الانحرافات المعمارية الجوهرية فقط',
    settingsDefaultSignatureLabel: 'التوقيع الافتراضي للرسائل وملفات PDF',
    settingsSignaturePlaceholder: 'الاسم / اسم الوكالة، المسمى الوظيفي، بيانات التواصل',

    settingsCardDTitle: 'د) الأمان والإشعارات والبيانات',
    settingsCardDDesc: 'إشعارات البريد، الحفظ التلقائي للمسودات وتصدير التقارير',
    settingsEmailCopyToggle: 'إرسال نسخة من التقرير المكتمل إلى بريدي الإلكتروني',
    settingsQuotaAlertToggle: 'تنبيهي عند اقتراب انتهاء رصيد التدقيقات',
    settingsAutoSaveDraftsToggle: 'حفظ مسودات المواصفات والمحاضر تلقائياً في المتصفح',
    settingsPasswordSectionLabel: 'تغيير كلمة المرور أو إرسال رمز تحقق من 6 أرقام',
    settingsSendOtpBtn: 'إرسال رمز من 6 أرقام إلى البريد',
    settingsExportJsonBtn: 'تصدير جميع تقاريري (JSON)',
    settingsExportCsvBtn: 'تصدير جميع تقاريري (CSV)',

    authLoginTitle: 'تسجيل الدخول إلى الحساب',
    authRegisterTitle: 'إنشاء حساب جديد',
    authTabLogin: 'دخول',
    authTabRegister: 'تسجيل',
    authStudioNameLabel: 'الاسم أو اسم شركة البرمجة',
    authEmailLabel: 'البريد الإلكتروني للعمل',
    authPasswordLabel: 'كلمة المرور (6 أحرف على الأقل)',
    authLoginWithOtp: 'الدخول برمز البريد الإلكتروني',
    authLoginWithPassword: 'الدخول بكلمة المرور',
    authSubmitLogin: 'الدخول إلى مساحة العمل',
    authSubmitRegister: 'إنشاء حساب والبدء',
    footerTagline: 'ScopeGuard Legal — نظام حماية شركات البرمجة والمستقلين من توسع نطاق العمل غير المدفوع',
  },

  ja: {
    navLanding: 'ホーム',
    navWorkspace: 'ワークスペース',
    navArchive: 'アーカイブ',
    navAccount: 'マイページ',
    navAdmin: '開発者コンソール',
    navLoginRegister: 'ログイン / 登録',
    navSignOut: 'ログアウト',
    navLanguageLabel: '表示言語',
    navCurrencyLabel: '通貨選択',
    navFreeChecksLeft: '無料監査残り',
    navChecksUsed: '監査回数',
    navManagePlan: 'プラン管理',
    navAccountAndLibrary: 'アカウント設定',
    navProfileMobile: 'アカウント',

    heroBadgeSubtitle: 'IT開発会社・フリーランスのためのAIスコープクリープ防止システム',
    heroTitleHighlight: '無償の追加修正（スコープクリープ）から予算を守る',
    heroTitleSuffix: 'わずか30秒で監査',
    heroSubtitle:
      '要件定義書（SOW）と会議録音・議事録をアップロード。AIが顧客の追加要望を契約条項と照合し、工数（1〜40時間）を算出、変更合意書（Change Order）と丁寧な顧客向けメールを自動生成します。',
    heroCtaStart: 'ワークスペースを開く · 監査開始',
    heroCtaSample: 'サンプルレポートを見る',
    heroFormatsNote: 'PDF, DOCX, TXT, MP3, WAV 最大25MB対応',
    heroExportNote: 'Change OrderをPDF・Word形式で出力',
    heroShowcaseBadge: 'AI要件照合インタラクティブデモ',
    heroSourceSpecLabel: '基本契約 / 要件定義書',
    heroCallTranscriptLabel: '会議議事録・発言録',
    heroTimecodeLabel: 'タイムコード',
    heroOutOfScopeBadge: '契約スコープ外',
    heroFoundItemsPrefix: '検出された追加要件：',
    heroFoundItemsOn: '相当額',
    heroHoursUnit: '時間',
    heroShiftPrefix: '納期延長',
    heroShiftDaysUnit: '営業日',
    heroEmailAndCoLink: '顧客メールと変更合意書ドラフト →',
    heroOpenInWorkspace: 'ワークスペースで開く',
    bentoBadge: '法務・技術の両面から追加費用を正当化',
    bentoTitle: '「無償対応」のトラブルを未然に防ぐ4つの成果物',
    bentoSubtitle:
      '感情的な交渉の代わりに、タイムコード付きの客観的な監査レポート・工数見積・変更契約書を提示できます。',
    bento1Tag: '01 · タイムコード付きスコープクリープ検出',
    bento1Title: '会議音声・議事録と仕様書条項の自動照合',
    bento1Desc: 'PDF、DOCX、MP3/WAVに対応。顧客の発言引用と矛盾する仕様書条項を正確に紐付けます。',
    bento2Tag: '02 · 1〜40時間のリアルタイム見積',
    bento2Title: '追加予算とリリース納期延伸の自動計算',
    bento2Desc: '7つの主要通貨に対応し、営業日ベースで法的な納期延長日数を自動算出します。',
    bento3Tag: '03 · 外交的で丁寧な顧客向けメール',
    bento3Title: '関係を損なわずに追加費用をスマートに提案',
    bento3Desc: '基本スコープの納期遵守を確約しつつ、追加契約（Change Order）か次期フェーズ（Backlog v1.1）かの選択肢を提示。',
    bento4Tag: '04 · 法務変更合意書 (PDF / Word)',
    bento4Title: '当事者情報・署名欄付きの公式契約付属書',
    bento4Desc: '自社ブランド名入りのA4印刷用Change OrderをPDFおよびWordで即座に出力。',
    bottomCtaKicker: 'プロジェクト文書の監査準備完了',
    bottomCtaTitle: '仕様書と議事録の無料監査を今すぐ体験',
    bottomCtaDesc: 'ワークスペースを開き、ワンクリックでデモを読み込むかファイルをアップロードしてください。',
    bottomCtaPrimary: 'ワークスペースを開く',
    bottomCtaSecondary: '監査アーカイブ',

    workspaceBadge: 'ScopeGuard ワークスペース',
    workspaceDefaultTitle: '仕様書・議事録スコープ監査',
    workspaceSampleBtn: 'サンプル',
    workspaceLibraryBtn: 'ライブラリ',
    workspaceArchiveBtn: 'アーカイブ',
    workspacePrintPdfBtn: 'PDF帳票 / 印刷',
    step1Kicker: 'ステップ 1 · 資料のアップロード',
    step1Title: '要件定義書（仕様書）と打ち合わせ記録',
    demoTemplatesLabel: 'デモ事例：',
    resetInputsBtn: 'リセット',
    fieldProjectName: 'プロジェクト名 / 契約番号',
    fieldHourlyRate: '時間単価',
    fieldAuditDate: '監査日',
    fieldReportLang: 'AIレポート生成言語',
    fieldReportLangMatchUi: '表示言語に合わせる',
    specFieldTitle: '1. 基本要件（仕様書・契約書・ブリーフ）',
    specDropTitle: '仕様書ファイルをドロップ (PDF, DOCX, TXT)',
    specDropSub: 'またはクリックしてファイルを選択',
    specChooseBtn: 'ファイル選択',
    specTextareaPlaceholder: 'または合意済みの仕様書条項を直接貼り付けてください...',
    transcriptFieldTitle: '2. 会議資料（通話録音または文字起こし）',
    transcriptDropTitle: '通話録音 (MP3, WAV, M4A)',
    transcriptDropSub: 'クリックして音声を選択、または下に議事録を貼り付け',
    transcriptChooseBtn: '音声を選択',
    transcriptTextareaPlaceholder: 'またはZoom/Meet議事録・チャット履歴を貼り付けてください...',
    submitAuditBtn: 'スコープクリープ法務監査を実行',
    autoSaveArchiveNote: '検出結果はアーカイブおよびクラウドに自動保存されます',

    kpiProtectedBudget: '保護された予算額',
    kpiRateNote: '契約単価 · Change Order',
    kpiHoursOut: 'スコープ外工数',
    kpiHoursSub: 'タスクあたり1〜40時間評価',
    kpiDeadlineShift: '納期延長日数',
    kpiDeadlineSub: '法的なマイルストーン延長',
    kpiDetectedCount: '検出された追加要望',
    tabAllSections: 'すべて表示',
    tabRegistry: '追加要件一覧',
    tabClientEmail: '顧客向けメール',
    tabChangeOrder: '変更合意書',
    tabJsonSchema: 'JSONスキーマ',
    syncTemplatesBtn: '一覧とテンプレートを同期',
    copyEmailBtn: 'メールをコピー',
    copiedBadge: 'コピー完了',
    exportPdfPrintBtn: 'PDF出力 / 印刷',

    accountTabOverview: 'プロフィール概要',
    accountTabSettings: '設定と環境設定',
    accountTabLibrary: 'クラウドライブラリ',
    accountNewAuditBtn: '新規監査',
    accountRegisteredLabel: '登録日',
    accountQuotaTitle: 'プランと監査枠',
    accountUsedAuditsLabel: '使用済み監査回数',
    accountAvailableNow: '利用可能残り',
    accountCloudAuditsLabel: 'クラウド保存数',
    accountUpgradeBtn: 'Proプランへアップグレード（999回＋自社ロゴ対応）',
    accountManageProBtn: 'Proプラン・事業者情報の管理',

    settingsHeaderKicker: 'ワークスペース全体設定',
    settingsHeaderTitle: 'アカウント設定と環境設定',
    settingsHeaderDesc: '言語・地域、標準単価・稼働時間、AI監査トーン、セキュリティを設定します。',
    settingsSaveAllBtn: '設定を保存',
    settingsSavedToastTitle: '設定を保存しました',
    settingsSavedToastDesc: '言語、標準時間単価、納期計算式、署名が同期されました。',

    settingsCardATitle: 'A) 言語と地域設定',
    settingsCardADesc: '表示言語、AI生成ドキュメントの言語、日付形式',
    settingsUiLangLabel: 'インターフェース言語（世界10市場対応）',
    settingsReportLangLabel: 'AI生成ドキュメントの言語',
    settingsDateFormatLabel: '日付フォーマット',
    settingsTimezoneLabel: 'タイムゾーン',

    settingsCardBTitle: 'B) 財務・稼働時間の標準設定（自動入力）',
    settingsCardBDesc: '新規監査作成時に自動適用される通貨・時間単価・1日の稼働時間・税表記',
    settingsDefaultCurrencyLabel: 'デフォルト基本通貨',
    settingsDefaultRateLabel: '標準時間単価（アワリーレート）',
    settingsWorkHoursDayLabel: '1営業日あたりの稼働時間（納期延長計算式）',
    settingsTaxNoteLabel: '変更合意書（Change Order）の税表記',
    taxVatExempt: '税抜 / 非課税 (VAT Exempt)',
    taxVat20: '税込 (20% VAT Included)',
    taxUsn: '簡易課税制度 (USN)',
    taxVatExclusive: '税別 (VAT Exclusive)',

    settingsCardCTitle: 'C) AI監査および法務テンプレート設定',
    settingsCardCDesc: '顧客向けメールのトーン、スコープクリープ検出の厳密さ、デフォルト署名',
    settingsEmailToneLabel: '顧客向けメールのトーン',
    toneDiplomatic: '丁寧・外交的（対立を避ける穏やかな提案）',
    toneStrictLegal: '厳格な法務トーン（契約条項を明確に引用）',
    tonePartnerBacklog: 'パートナーシップ型（Backlog v1.1への先送り提案）',
    settingsStrictnessLabel: 'スコープクリープ検出の厳密さ',
    strictnessStandard: '標準（バランス重視）',
    strictnessMeticulous: '最高精度（細かなUI修正もすべて検出）',
    strictnessCriticalOnly: '重大なアーキテクチャ変更のみ検出',
    settingsDefaultSignatureLabel: 'メール・PDF帳票のデフォルト署名',
    settingsSignaturePlaceholder: '氏名 / 会社名、役職、連絡先',

    settingsCardDTitle: 'D) セキュリティ・通知・データ出力',
    settingsCardDDesc: 'メール通知、ブラウザ下書き自動保存、レポート一括エクスポート',
    settingsEmailCopyToggle: '完了した監査レポートの控えをメールで受信する',
    settingsQuotaAlertToggle: '監査枠の残りが少なくなった際に通知する',
    settingsAutoSaveDraftsToggle: '仕様書と議事録の下書きをブラウザに自動保存する',
    settingsPasswordSectionLabel: 'パスワード変更または6桁の確認コード送信',
    settingsSendOtpBtn: '6桁のコードをメールに送信',
    settingsExportJsonBtn: '全レポートをエクスポート (JSON)',
    settingsExportCsvBtn: '全レポートをエクスポート (CSV)',

    authLoginTitle: 'アカウントにログイン',
    authRegisterTitle: '新規アカウント登録',
    authTabLogin: 'ログイン',
    authTabRegister: '新規登録',
    authStudioNameLabel: '氏名または開発会社・スタジオ名',
    authEmailLabel: '業務用メールアドレス',
    authPasswordLabel: 'パスワード（6文字以上）',
    authLoginWithOtp: 'メール確認コードでログイン',
    authLoginWithPassword: 'パスワードでログイン',
    authSubmitLogin: 'ワークスペースにログイン',
    authSubmitRegister: '登録して開始する',
    footerTagline: 'ScopeGuard Legal — IT開発現場を無償のスコープクリープから守るリーガルテック基盤',
  },

  kk: {
    navLanding: 'Басты бет',
    navWorkspace: 'Кабинет',
    navArchive: 'Мұрағат',
    navAccount: 'Жеке кабинет',
    navAdmin: 'Әзірлеуші панелі',
    navLoginRegister: 'Кіру / Тіркелу',
    navSignOut: 'Шығу',
    navLanguageLabel: 'Интерфейс тілі',
    navCurrencyLabel: 'Валюта таңдау',
    navFreeChecksLeft: 'Тегін тексеру қалды',
    navChecksUsed: 'Тексерулер',
    navManagePlan: 'Тарифті басқару',
    navAccountAndLibrary: 'Жеке кабинет және баптаулар',
    navProfileMobile: 'Профиль',

    heroBadgeSubtitle: 'IT-жобаларды тегін Scope Creep-тен қорғайтын ЖИ-жүйе',
    heroTitleHighlight: 'Жоба бюджетін тегін түзетулерден қорғаңыз',
    heroTitleSuffix: '30 секунд ішінде',
    heroSubtitle:
      'Бастапқы ТТ (Техникалық тапсырма) мен клиентпен қоңырау жазбасын жүктеңіз. Нейрожелі әрбір жаңа талапты шартпен салыстырып, норма-сағатты (1–40 сағ) есептейді және дайын Қосымша келісімді (Change Order) дипломатиялық хатпен бірге құрастырады.',
    heroCtaStart: 'Жұмыс аймағын ашу · Аудитті бастау',
    heroCtaSample: 'Есеп үлгісін көру',
    heroFormatsNote: 'PDF, DOCX, TXT, MP3, WAV 25 МБ дейін',
    heroExportNote: 'Change Order құжатын PDF және Word форматында жүктеу',
    heroShowcaseBadge: 'ЖИ-тексерудің интерактивті көрсетілімі',
    heroSourceSpecLabel: 'Бастапқы Шарт / ТТ',
    heroCallTranscriptLabel: 'Кездесу стенограммасы',
    heroTimecodeLabel: 'Таймкод',
    heroOutOfScopeBadge: 'Шарт шеңберінен тыс',
    heroFoundItemsPrefix: 'Табылған қосымша жұмыстар:',
    heroFoundItemsOn: 'сомасы',
    heroHoursUnit: 'сағ',
    heroShiftPrefix: 'Мерзім',
    heroShiftDaysUnit: 'жұмыс күн.',
    heroEmailAndCoLink: 'Хат пен қосымша келісім мәтіні →',
    heroOpenInWorkspace: 'Кабинетте ашу',
    bentoBadge: 'Құқықтық және техникалық дәлелдеудің толық циклі',
    bentoTitle: '«Тегін пысықтаулар» туралы кез келген дауды жабатын төрт құжат',
    bentoSubtitle:
      'Клиентпен эмоциялық дауласудың орнына таймкодтары, сағат есебі және дайын Қосымша келісімі бар құрылымдалған есеп жіберіңіз.',
    bento1Tag: '01 · Таймкод бойынша Scope Creep детекторы',
    bento1Title: 'Аудиожазба мен стенограмманы ТТ тармақтарымен салыстыру',
    bento1Desc: 'PDF, DOCX, TXT және MP3/WAV қоңырау жазбаларын қолдайды. Әрбір жаңа талап нақты дәйексөзбен байланыстырылады.',
    bento2Tag: '02 · 1–40 норма-сағат тірі сметасы',
    bento2Title: 'Бюджет пен тапсыру мерзімінің жылжуын автоесептеу',
    bento2Desc: '7 әлемдік валютада лезде қайта есептеу және жұмыс күндеріндегі дедлайн жылжуын шығару.',
    bento3Tag: '03 · Дипломатиялық хат',
    bento3Title: 'Тапсырыс берушімен жанжалсыз қосымша төлемді негіздеу',
    bento3Desc: 'Негізгі ТТ мерзімінде орындалатынын растайды және Change Order немесе Backlog v1.1 нұсқасын ұсынады.',
    bento4Tag: '04 · Заңды Change Order (PDF / Word)',
    bento4Title: 'Тараптардың деректемелері бар ресми Қосымша келісім',
    bento4Desc: 'Агенттік логотипі, жұмыстар кестесі және қол қою блогы бар дайын А4 парағы.',
    bottomCtaKicker: 'Құжаттарыңызды тексеруге дайын',
    bottomCtaTitle: 'Дәл қазір ТТ мен қоңыраудың тегін аудитін іске қосыңыз',
    bottomCtaDesc: 'Жұмыс аймағына өтіп, дайын демо-кейсті таңдаңыз немесе өз файлдарыңызды жүктеңіз.',
    bottomCtaPrimary: 'Жұмыс аймағын ашу',
    bottomCtaSecondary: 'Тексерулер мұрағаты',

    workspaceBadge: 'ScopeGuard Жұмыс кабинеті',
    workspaceDefaultTitle: 'ТТ және келіссөздер стенограммасының аудиті',
    workspaceSampleBtn: 'Есеп үлгісі',
    workspaceLibraryBtn: 'Кітапхана',
    workspaceArchiveBtn: 'Мұрағат',
    workspacePrintPdfBtn: 'PDF бланкі / Басып шығару',
    step1Kicker: '1-қадам · Материалдарды жүктеу',
    step1Title: 'Бастапқы ТТ және тапсырыс берушімен кездесу жазбасы',
    demoTemplatesLabel: 'Демо-үлгілер:',
    resetInputsBtn: 'Тазарту',
    fieldProjectName: 'Жоба атауы / Шарт №',
    fieldHourlyRate: 'Сағаттық мөлшерлеме',
    fieldAuditDate: 'Аудит күні',
    fieldReportLang: 'ЖИ есебін генерациялау тілі',
    fieldReportLangMatchUi: 'Интерфейс тілімен бірдей',
    specFieldTitle: '1. Бастапқы талаптар (ТТ, шарт, бриф)',
    specDropTitle: 'ТТ файлын осында сүйреңіз (PDF, DOCX, TXT)',
    specDropSub: 'Немесе құрылғыдан құжат таңдау үшін басыңыз',
    specChooseBtn: 'Файлды таңдау',
    specTextareaPlaceholder: 'Немесе Техникалық тапсырманың бекітілген тармақтарын қолмен қойыңыз...',
    transcriptFieldTitle: '2. Кездесу материалдары (қоңырау аудиосы немесе стенограмма)',
    transcriptDropTitle: 'Қоңырау жазбасы (MP3, WAV, M4A) немесе видео',
    transcriptDropSub: 'Аудио жүктеу үшін басыңыз немесе төменге стенограмманы қойыңыз',
    transcriptChooseBtn: 'Медиа жүктеу',
    transcriptTextareaPlaceholder: 'Немесе Zoom/Meet кездесуінің мәтінін / Telegram хат алмасуын қойыңыз...',
    submitAuditBtn: 'Scope Creep заңды аудитін іске қосу',
    autoSaveArchiveNote: 'Барлық табылған сәйкессіздіктер «Мұрағат» пен бұлтқа автоматты түрде сақталады',

    kpiProtectedBudget: 'Қорғалған бюджет',
    kpiRateNote: 'Шарт мөлшерлемесі · Change Order',
    kpiHoursOut: 'ТТ-дан тыс сағаттар',
    kpiHoursSub: 'Әр тапсырмаға 1–40 сағ калибрлеу',
    kpiDeadlineShift: 'Тапсыру мерзімінің жылжуы',
    kpiDeadlineSub: 'Кезең дедлайнын құқықтық ұзарту',
    kpiDetectedCount: 'ТТ-дан тыс талаптар',
    tabAllSections: 'Барлық бөлімдер',
    tabRegistry: 'Тізілім',
    tabClientEmail: 'Клиентке хат',
    tabChangeOrder: 'Қосымша келісім',
    tabJsonSchema: 'JSON Схемасы',
    syncTemplatesBtn: 'Үлгілерді тізіліммен синхрондау',
    copyEmailBtn: 'Хатты көшіру',
    copiedBadge: 'Көшірілді',
    exportPdfPrintBtn: 'PDF экспорт / Басып шығару',

    accountTabOverview: 'Профиль және шолу',
    accountTabSettings: 'Баптаулар мен қалаулар',
    accountTabLibrary: 'Жұмыстар кітапханасы',
    accountNewAuditBtn: 'Жаңа ТТ аудиті',
    accountRegisteredLabel: 'Тіркелген күні',
    accountQuotaTitle: 'Жазылым және аудит лимиттері',
    accountUsedAuditsLabel: 'Жұмсалған ТТ тексерулері',
    accountAvailableNow: 'Қазір қолжетімді',
    accountCloudAuditsLabel: 'Бұлттағы аудиттер',
    accountUpgradeBtn: 'Pro тарифіне өту (999 тексеру + White-Label)',
    accountManageProBtn: 'Pro тарифін және деректемелерді басқару',

    settingsHeaderKicker: 'Жұмыс орнының жаһандық конфигурациясы',
    settingsHeaderTitle: 'Аккаунт баптаулары мен қалаулары',
    settingsHeaderDesc: 'Локализацияны, әдепкі қаржылық стандарттарды, ЖИ-аудитор мәнерін және қауіпсіздікті баптаңыз.',
    settingsSaveAllBtn: 'Баптауларды сақтау',
    settingsSavedToastTitle: 'Баптаулар сәтті сақталды',
    settingsSavedToastDesc: 'Тіл, мөлшерлеме, жұмыс күні формуласы және қолтаңба синхрондалды.',

    settingsCardATitle: 'А) Локализация және аймақ',
    settingsCardADesc: 'Интерфейс тілі, ЖИ құжаттарының тілі және күн форматы',
    settingsUiLangLabel: 'Интерфейс тілі (10 әлемдік нарық)',
    settingsReportLangLabel: 'Генерацияланатын құжаттар тілі',
    settingsDateFormatLabel: 'Күн мен уақыт форматы',
    settingsTimezoneLabel: 'Уақыт белдеуі',

    settingsCardBTitle: 'Б) Әдепкі қаржылық және жұмыс стандарттары',
    settingsCardBDesc: 'Жаңа аудитке валютаны, сағаттық мөлшерлемені, жұмыс күнін және ҚҚС-ты автоқою',
    settingsDefaultCurrencyLabel: 'Әдепкі базалық валюта',
    settingsDefaultRateLabel: 'Студияның стандартты сағаттық мөлшерлемесі',
    settingsWorkHoursDayLabel: '1 жұмыс күніндегі жұмыс сағаты (дедлайн формуласы)',
    settingsTaxNoteLabel: 'Қосымша келісімдерге арналған салық белгісі',
    taxVatExempt: 'ҚҚС-сыз (ҚҚС салынбайды)',
    taxVat20: '20% ҚҚС есебімен',
    taxUsn: 'Оңайлатылған салық режимі (УСН/ОСР)',
    taxVatExclusive: 'VAT Exclusive (Салықтарды қоспағанда)',

    settingsCardCTitle: 'В) ЖИ-аудитор және заңды үлгілер баптаулары',
    settingsCardCDesc: 'Клиентке хат мәнері, іздеу қатаңдығы және автоқолтаңба',
    settingsEmailToneLabel: 'Клиентке хат мәнері (Тон)',
    toneDiplomatic: 'Дипломатиялық және жұмсақ (жанжалсыз)',
    toneStrictLegal: 'Қатаң заңды (шарт тармақтарына сілтемемен)',
    tonePartnerBacklog: 'Серіктестік (Backlog v1.1 ұсынысымен)',
    settingsStrictnessLabel: 'Scope Creep іздеу қатаңдығы',
    strictnessStandard: 'Стандартты (теңгерімді аудит)',
    strictnessMeticulous: 'Барынша мұқият (ұсақ UI түзетулерін де іздеу)',
    strictnessCriticalOnly: 'Тек сыни архитектуралық алшақтықтар',
    settingsDefaultSignatureLabel: 'Хаттар мен PDF-бланкілерге арналған әдепкі қолтаңба',
    settingsSignaturePlaceholder: 'Аты-жөні / Агенттік атауы, лауазымы, байланыс деректері',

    settingsCardDTitle: 'Г) Қауіпсіздік, хабарламалар және деректер',
    settingsCardDDesc: 'Email-хабарламалар, жобаларды автосақтау және есептерді экспорттау',
    settingsEmailCopyToggle: 'Дайын есептің көшірмесін поштама жіберу',
    settingsQuotaAlertToggle: 'Тексеру лимиті аяқталуға жақын қалғанда хабарлау',
    settingsAutoSaveDraftsToggle: 'ТТ мен стенограмма жобаларын браузерде автосақтау',
    settingsPasswordSectionLabel: 'Құпиясөзді өзгерту немесе поштаға 6 таңбалы код жіберу',
    settingsSendOtpBtn: 'Поштаға 6 таңбалы код жіберу',
    settingsExportJsonBtn: 'Барлық есептерімді экспорттау (JSON)',
    settingsExportCsvBtn: 'Барлық есептерімді экспорттау (CSV)',

    authLoginTitle: 'Жеке кабинетке кіру',
    authRegisterTitle: 'Аккаунтты тіркеу',
    authTabLogin: 'Кіру',
    authTabRegister: 'Тіркелу',
    authStudioNameLabel: 'Атыңыз немесе IT-студия атауы',
    authEmailLabel: 'Жұмыс Email-ы',
    authPasswordLabel: 'Құпиясөз (кемінде 6 таңба)',
    authLoginWithOtp: 'Поштадағы кодпен кіру',
    authLoginWithPassword: 'Құпиясөзбен кіру',
    authSubmitLogin: 'Жеке кабинетке кіру',
    authSubmitRegister: 'Тіркелу және бастау',
    footerTagline: 'ScopeGuard Legal — IT-орындаушыларды келісілмеген қосымша жұмыс көлемінен қорғау жүйесі',
  },
};

const LANGUAGE_STORAGE_KEY = 'scopeguard_ui_lang_v1';

export function loadSavedLanguage(): LanguageCode {
  try {
    const raw = localStorage.getItem(LANGUAGE_STORAGE_KEY) as LanguageCode | null;
    if (raw && SUPPORTED_LANGUAGES.some((l) => l.code === raw)) {
      return raw;
    }
  } catch {
    // ignore
  }
  return 'ru';
}

export function saveLanguageToStorage(lang: LanguageCode): void {
  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
  } catch {
    // ignore
  }
}

export type TranslatorFn = ((key: string) => string) & TranslationDictionary;

const DOT_KEY_MAP: Record<string, keyof TranslationDictionary> = {
  // Nav & TopBar
  'nav.landing': 'navLanding',
  'nav.audit': 'navWorkspace',
  'nav.history': 'navArchive',
  'nav.account': 'navAccount',
  'nav.admin': 'navAdmin',
  'nav.profile': 'navProfileMobile',
  'topBar.auditsQuota': 'navChecksUsed',
  'topBar.freeAuditsLeft': 'navFreeChecksLeft',
  'topBar.accountAndLibrary': 'navAccountAndLibrary',
  'topBar.developerAdmin': 'navAdmin',
  'topBar.managePlan': 'navManagePlan',
  'topBar.signOut': 'navSignOut',
  'topBar.signInRegister': 'navLoginRegister',
  'topBar.library': 'workspaceLibraryBtn',
  'topBar.archive': 'workspaceArchiveBtn',
  'topBar.quotaLimit': 'accountUsedAuditsLabel',

  // Landing Page
  'landing.badgeSubtitle': 'heroBadgeSubtitle',
  'landing.heroHighlight': 'heroTitleHighlight',
  'landing.heroSuffix': 'heroTitleSuffix',
  'landing.heroDescription': 'heroSubtitle',
  'landing.ctaStart': 'heroCtaStart',
  'landing.ctaSample': 'heroCtaSample',
  'landing.formatsHint': 'heroFormatsNote',
  'landing.exportHint': 'heroExportNote',
  'landing.showcaseBadge': 'heroShowcaseBadge',
  'landing.sourceContract': 'heroSourceSpecLabel',
  'landing.callTranscript': 'heroCallTranscriptLabel',
  'landing.outOfScopeBadge': 'heroOutOfScopeBadge',
  'landing.emailAndCoLink': 'heroEmailAndCoLink',
  'landing.openInWorkspace': 'heroOpenInWorkspace',
  'landing.bentoSectionBadge': 'bentoBadge',
  'landing.bentoSectionTitle': 'bentoTitle',
  'landing.bentoSectionSubtitle': 'bentoSubtitle',
  'landing.bento1Badge': 'bento1Tag',
  'landing.bento1Title': 'bento1Title',
  'landing.bento1Desc': 'bento1Desc',
  'landing.bento2Badge': 'bento2Tag',
  'landing.bento2Title': 'bento2Title',
  'landing.bento2Desc': 'bento2Desc',
  'landing.bento3Badge': 'bento3Tag',
  'landing.bento3Title': 'bento3Title',
  'landing.bento3Desc': 'bento3Desc',
  'landing.bento4Badge': 'bento4Tag',
  'landing.bento4Title': 'bento4Title',
  'landing.bento4Desc': 'bento4Desc',
  'landing.goToWorkspace': 'bottomCtaPrimary',
  'landing.bottomCtaBadge': 'bottomCtaKicker',
  'landing.bottomCtaTitle': 'bottomCtaTitle',
  'landing.bottomCtaDesc': 'bottomCtaDesc',
  'landing.openWorkspaceBtn': 'bottomCtaPrimary',
  'landing.archiveBtn': 'bottomCtaSecondary',

  // Workspace & SourceInputPanel
  'workspace.badge': 'workspaceBadge',
  'workspace.defaultTitle': 'workspaceDefaultTitle',
  'workspace.sampleReportBtn': 'workspaceSampleBtn',
  'workspace.pdfPrintBtn': 'workspacePrintPdfBtn',
  'workspace.step1Badge': 'step1Kicker',
  'workspace.step1Title': 'step1Title',
  'workspace.demoTemplates': 'demoTemplatesLabel',
  'workspace.resetBtn': 'resetInputsBtn',
  'workspace.projectNameLabel': 'fieldProjectName',
  'workspace.hourlyRateLabel': 'fieldHourlyRate',
  'workspace.ratePerHour': 'fieldHourlyRate',
  'workspace.auditDateLabel': 'fieldAuditDate',
  'workspace.field1Title': 'specFieldTitle',
  'workspace.dropSpecTitle': 'specDropTitle',
  'workspace.dropSpecSub': 'specDropSub',
  'workspace.chooseFileBtn': 'specChooseBtn',
  'workspace.specPlaceholder': 'specTextareaPlaceholder',
  'workspace.field2Title': 'transcriptFieldTitle',
  'workspace.dropTranscriptTitle': 'transcriptDropTitle',
  'workspace.dropTranscriptSub': 'transcriptDropSub',
  'workspace.uploadMediaBtn': 'transcriptChooseBtn',
  'workspace.transcriptPlaceholder': 'transcriptTextareaPlaceholder',
  'workspace.autoSaveHint': 'autoSaveArchiveNote',
  'workspace.submitAuditBtn': 'submitAuditBtn',
  'workspace.kpiProtectedBudget': 'kpiProtectedBudget',
  'workspace.kpiRateSub': 'kpiRateNote',
  'workspace.kpiHoursOut': 'kpiHoursOut',
  'workspace.kpiHoursUnit': 'heroHoursUnit',
  'workspace.kpiCalibrationSub': 'kpiHoursSub',
  'workspace.kpiDeadlineShift': 'kpiDeadlineShift',
  'workspace.kpiDaysUnit': 'heroShiftDaysUnit',
  'workspace.kpiDeadlineSub': 'kpiDeadlineSub',
  'workspace.kpiFindingsCount': 'kpiDetectedCount',
  'workspace.foundItems': 'kpiDetectedCount',
  'workspace.tabAll': 'tabAllSections',
  'workspace.tabRegistry': 'tabRegistry',
  'workspace.tabEmail': 'tabClientEmail',
  'workspace.tabChangeOrder': 'tabChangeOrder',
  'workspace.pdfPrintSheetBtn': 'exportPdfPrintBtn',

  // Account & Settings
  'account.subTabOverview': 'accountTabOverview',
  'account.subTabSettings': 'accountTabSettings',
  'account.subTabLibrary': 'accountTabLibrary',
  'account.newAuditBtn': 'accountNewAuditBtn',
  'account.signOutBtn': 'navSignOut',
  'account.registered': 'accountRegisteredLabel',
  'account.studioNameLabel': 'authStudioNameLabel',
  'account.subscriptionTitle': 'accountQuotaTitle',
  'account.usedAuditsLabel': 'accountUsedAuditsLabel',
  'account.availableNow': 'accountAvailableNow',
  'account.protectedBudget': 'kpiProtectedBudget',
  'account.cloudAuditsCount': 'accountCloudAuditsLabel',
  'account.upgradeProBtn': 'accountUpgradeBtn',
  'account.manageProBtn': 'accountManageProBtn',
  'account.changePasswordTitle': 'settingsPasswordSectionLabel',
  'account.newPasswordPlaceholder': 'authPasswordLabel',
  'account.confirmPasswordPlaceholder': 'authPasswordLabel',

  // Settings Cards
  'settings.sectionTitle': 'settingsHeaderTitle',
  'settings.sectionSubtitle': 'settingsHeaderDesc',
  'settings.saveBtn': 'settingsSaveAllBtn',
  'settings.savedToastTitle': 'settingsSavedToastTitle',
  'settings.savedToastDesc': 'settingsSavedToastDesc',
  'settings.cardA.title': 'settingsCardATitle',
  'settings.cardA.subtitle': 'settingsCardADesc',
  'settings.cardA.interfaceLang': 'settingsUiLangLabel',
  'settings.cardA.reportLang': 'settingsReportLangLabel',
  'settings.cardA.reportLangSameAsUi': 'fieldReportLangMatchUi',
  'settings.cardA.dateFormat': 'settingsDateFormatLabel',
  'settings.cardA.timezone': 'settingsTimezoneLabel',
  'settings.cardB.title': 'settingsCardBTitle',
  'settings.cardB.subtitle': 'settingsCardBDesc',
  'settings.cardB.defaultCurrency': 'settingsDefaultCurrencyLabel',
  'settings.cardB.defaultHourlyRate': 'settingsDefaultRateLabel',
  'settings.cardB.workHoursPerDay': 'settingsWorkHoursDayLabel',
  'settings.cardB.taxNote': 'settingsTaxNoteLabel',
  'settings.cardB.taxNoVat': 'taxVatExempt',
  'settings.cardB.taxVat20': 'taxVat20',
  'settings.cardB.taxUsn': 'taxUsn',
  'settings.cardB.taxVatExclusive': 'taxVatExclusive',
  'settings.cardC.title': 'settingsCardCTitle',
  'settings.cardC.subtitle': 'settingsCardCDesc',
  'settings.cardC.emailTone': 'settingsEmailToneLabel',
  'settings.cardC.toneDiplomatic': 'toneDiplomatic',
  'settings.cardC.toneStrict': 'toneStrictLegal',
  'settings.cardC.tonePartner': 'tonePartnerBacklog',
  'settings.cardC.strictness': 'settingsStrictnessLabel',
  'settings.cardC.strictStandard': 'strictnessStandard',
  'settings.cardC.strictMeticulous': 'strictnessMeticulous',
  'settings.cardC.strictCritical': 'strictnessCriticalOnly',
  'settings.cardC.defaultSignature': 'settingsDefaultSignatureLabel',
  'settings.cardC.signaturePlaceholder': 'settingsSignaturePlaceholder',
  'settings.cardD.title': 'settingsCardDTitle',
  'settings.cardD.subtitle': 'settingsCardDDesc',
  'settings.cardD.emailReportCopy': 'settingsEmailCopyToggle',
  'settings.cardD.emailQuotaAlert': 'settingsQuotaAlertToggle',
  'settings.cardD.autoSaveDrafts': 'settingsAutoSaveDraftsToggle',
  'settings.cardD.sendOtpBtn': 'settingsSendOtpBtn',
  'settings.cardD.exportJsonBtn': 'settingsExportJsonBtn',
  'settings.cardD.exportCsvBtn': 'settingsExportCsvBtn',

  // Footer
  'footer.left': 'footerTagline',
};

const EXTRA_FALLBACKS: Record<string, Partial<Record<LanguageCode, string>>> = {
  'topBar.of': {
    ru: 'из',
    en: 'of',
    zh: '/',
    es: 'de',
    de: 'von',
    fr: 'sur',
    pt: 'de',
    ar: 'من',
    ja: '/',
    kk: '/',
  },
  'topBar.pro': {
    ru: 'PRO',
    en: 'PRO',
  },
  'topBar.remaining': {
    ru: 'Осталось',
    en: 'Remaining',
    zh: '剩余',
    es: 'Restantes',
    de: 'Verbleibend',
    fr: 'Restant',
    pt: 'Restantes',
    ar: 'المتبقي',
    ja: '残り',
    kk: 'Қалды',
  },
  'topBar.themeLight': {
    ru: 'Светлая тема',
    en: 'Light theme',
  },
  'topBar.themeDark': {
    ru: 'Темная тема',
    en: 'Dark theme',
  },
  'landing.pdfBaseEstimate': {
    ru: 'PDF · Базовая смета',
    en: 'PDF · Base Estimate',
  },
  'workspace.projectNamePlaceholder': {
    ru: 'Например: B2B-портал дистрибуции «АгроСнаб»',
    en: 'e.g., B2B Distribution Portal',
  },
  'workspace.removeFileBtn': {
    ru: 'Удалить файл',
    en: 'Remove file',
  },
  'workspace.kpiItemsUnit': {
    ru: 'поз.',
    en: 'items',
    zh: '项',
    es: 'ítems',
    de: 'Pos.',
    fr: 'élém.',
    pt: 'itens',
    ar: 'بند',
    ja: '件',
    kk: 'поз.',
  },
  'workspace.itemsUnit': {
    ru: 'поз.',
    en: 'items',
  },
  'workspace.kpiCrit': {
    ru: 'Крит',
    en: 'Crit',
  },
  'workspace.kpiMed': {
    ru: 'Сред',
    en: 'Med',
  },
  'workspace.kpiLow': {
    ru: 'Низ',
    en: 'Low',
  },
  'account.planPro': {
    ru: 'Тариф PRO Unlimited',
    en: 'PRO Unlimited Plan',
  },
  'account.planFree': {
    ru: 'Тариф Starter (Free)',
    en: 'Starter Plan (Free)',
  },
  'account.adminBadge': {
    ru: 'Администратор (Developer)',
    en: 'Developer Admin',
  },
  'account.profileSecurityTitle': {
    ru: 'Профиль студии и стандарты',
    en: 'Studio Profile & Standards',
  },
  'account.supabaseProfilesBadge': {
    ru: 'Профиль Supabase (profiles)',
    en: 'Supabase Profile (profiles)',
  },
  'account.studioNamePlaceholder': {
    ru: 'Название вашей студии или ФИО',
    en: 'Your studio or full name',
  },
  'account.saved': {
    ru: 'Сохранено',
    en: 'Saved',
  },
  'account.saveToProfile': {
    ru: 'Сохранить в профиль',
    en: 'Save to profile',
  },
  'account.quotaBadge': {
    ru: 'Лимит аудитов и подписка',
    en: 'Audit Quota & Subscription',
  },
  'account.proLimit999': {
    ru: 'Безлимитный PRO (999)',
    en: 'Unlimited PRO (999)',
  },
  'account.freePackage': {
    ru: 'Стартовый пакет',
    en: 'Starter package',
  },
  'account.reportsUnit': {
    ru: 'отч.',
    en: 'reports',
  },
  'account.updatePasswordBtn': {
    ru: 'Обновить пароль',
    en: 'Update password',
  },
  'account.cloudLibraryTitle': {
    ru: 'Облачная библиотека аудитов',
    en: 'Cloud Audit Library',
  },
  'account.cloudLibraryBadge': {
    ru: 'Таблица Supabase audits',
    en: 'Supabase audits table',
  },
  'account.totalSaved': {
    ru: 'Всего сохранено',
    en: 'Total saved',
  },
  'account.emptyLibraryTitle': {
    ru: 'В вашей облачной библиотеке пока нет сохраненных аудитов',
    en: 'No saved audits in your cloud library yet',
  },
  'account.emptyLibraryDesc': {
    ru: 'Запустите сверку ТЗ и стенограммы в рабочем кабинете — отчет автоматически сохранится в Supabase.',
    en: 'Run an SOW & transcript audit in the workspace — the report will be automatically saved to Supabase.',
  },
  'account.runFirstAuditBtn': {
    ru: 'Запустить первый аудит',
    en: 'Run First Audit',
  },
  'account.openInWorkspaceBtn': {
    ru: 'Открыть в кабинете',
    en: 'Open in Workspace',
  },
  'settings.resetDefaultsBtn': {
    ru: 'Сбросить по умолчанию',
    en: 'Reset defaults',
  },
  'settings.resetToastTitle': {
    ru: 'Настройки сброшены по умолчанию',
    en: 'Settings reset to defaults',
  },
  'settings.cardD.otpSentToast': {
    ru: '6-значный код отправлен на почту',
    en: '6-digit code sent to email',
  },
  'footer.right': {
    ru: 'Supabase Cloud Auth & Database · Строгая JSON-схема · Change Order PDF/Word',
    en: 'Supabase Cloud Auth & Database · Strict JSON Schema · Change Order PDF/Word',
  },
};

function createTranslator(
  dict: TranslationDictionary,
  lang: LanguageCode
): TranslatorFn {
  const fn = (key: string): string => {
    const mappedKey = DOT_KEY_MAP[key];
    if (mappedKey && dict[mappedKey]) {
      return dict[mappedKey];
    }
    if (key in dict) {
      return dict[key as keyof TranslationDictionary];
    }
    const extra = EXTRA_FALLBACKS[key];
    if (extra) {
      return extra[lang] || extra.en || extra.ru || key;
    }
    return key;
  };
  return Object.assign(fn, dict);
}

interface I18nContextValue {
  lang: LanguageCode;
  setLang: (next: LanguageCode) => void;
  t: TranslatorFn;
  meta: LanguageMeta;
}

const I18nContext = createContext<I18nContextValue>({
  lang: 'ru',
  setLang: () => {},
  t: createTranslator(TRANSLATIONS.ru, 'ru'),
  meta: SUPPORTED_LANGUAGES[0],
});

export const I18nProvider: React.FC<{
  lang?: LanguageCode;
  onChangeLang?: (next: LanguageCode) => void;
  children: React.ReactNode;
}> = ({ lang, onChangeLang, children }) => {
  const [internalLang, setInternalLang] = useState<LanguageCode>(
    () => lang ?? loadSavedLanguage()
  );

  useEffect(() => {
    if (lang) {
      setInternalLang(lang);
    }
  }, [lang]);

  useEffect(() => {
    const meta = getLanguageMeta(internalLang);
    document.documentElement.lang = meta.code;
    document.documentElement.dir = meta.dir;
  }, [internalLang]);

  const handleSetLang = (next: LanguageCode) => {
    setInternalLang(next);
    saveLanguageToStorage(next);
    if (onChangeLang) {
      onChangeLang(next);
    }
  };

  const dict = TRANSLATIONS[internalLang] ?? TRANSLATIONS.ru;
  const value: I18nContextValue = {
    lang: internalLang,
    setLang: handleSetLang,
    t: createTranslator(dict, internalLang),
    meta: getLanguageMeta(internalLang),
  };

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export function useI18n(): I18nContextValue {
  return useContext(I18nContext);
}
