import React, { useEffect, useState } from 'react';
import { FolderClock, Printer } from 'lucide-react';
import {
  DesktopSidebar,
  MobileBottomNav,
  TopBar,
  type ActiveSection,
} from './components/TopBar';
import { SourceInputPanel } from './components/SourceInputPanel';
import { ScopeItemsTable } from './components/ScopeItemsTable';
import { DeliverablesView } from './components/DeliverablesView';
import { AuditHistoryView } from './components/AuditHistoryView';
import { LandingPage } from './components/LandingPage';
import { PricingModal } from './components/PricingModal';
import { OfficialChangeOrderPrintModal } from './components/OfficialChangeOrderPrintModal';
import { AUDIT_PRESETS, type AuditPreset } from './data/presets';
import {
  buildAuditHistoryEntry,
  calculateScopeMetrics,
  canPerformAudit,
  clampSuggestedHours,
  consumeAuditQuota,
  convertHourlyRate,
  createInitialFreemiumState,
  deleteAuditHistoryEntry,
  formatMoney,
  rebuildChangeOrderSummary,
  rebuildClientEmailDraft,
  upgradeSubscription,
  upsertAuditHistoryEntry,
  validateAuditReportSchema,
  type ActiveNavTab,
  type AuditHistoryEntry,
  type CurrencyCode,
  type FreemiumState,
  type OutOfScopeItem,
  type ScopeAuditReport,
  type SeverityLevel,
} from './utils/scopeAnalyzer';

const FREEMIUM_STORAGE_KEY = 'scopeguard_freemium_v1';
const CURRENCY_STORAGE_KEY = 'scopeguard_currency_v1';
const HISTORY_STORAGE_KEY = 'scopeguard_history_v1';
const THEME_STORAGE_KEY = 'scopeguard_theme_v1';

function loadSavedCurrency(): CurrencyCode {
  try {
    const raw = localStorage.getItem(CURRENCY_STORAGE_KEY);
    if (raw === 'USD' || raw === 'RUB' || raw === 'EUR' || raw === 'KZT') {
      return raw;
    }
  } catch {
    // Ignore storage read errors
  }
  return 'USD';
}

function loadSavedTheme(): boolean {
  try {
    const raw = localStorage.getItem(THEME_STORAGE_KEY);
    if (raw === 'dark') return true;
    if (raw === 'light') return false;
  } catch {
    // Ignore storage read errors
  }
  return false;
}

function createSeedHistoryEntries(
  currency: CurrencyCode
): AuditHistoryEntry[] {
  return AUDIT_PRESETS.map((preset) => {
    const rateInCurr = convertHourlyRate(preset.hourlyRate, 'RUB', currency);
    const syncedReport: ScopeAuditReport = {
      ...preset.report,
      client_email_draft: rebuildClientEmailDraft(
        preset.report.project_name,
        preset.report.out_of_scope_items,
        preset.report.in_scope_items,
        rateInCurr,
        currency
      ),
      change_order_summary: rebuildChangeOrderSummary(
        preset.report.project_name,
        preset.report.audit_date,
        preset.report.out_of_scope_items,
        rateInCurr,
        currency
      ),
    };
    return buildAuditHistoryEntry({
      id: `seed-${preset.id}`,
      projectName: preset.report.project_name,
      contractNumber: preset.contractNumber,
      auditDate: preset.report.audit_date,
      hourlyRate: rateInCurr,
      currency,
      specText: preset.specText,
      transcriptText: preset.transcriptText,
      report: syncedReport,
    });
  });
}

function loadSavedHistory(currency: CurrencyCode): AuditHistoryEntry[] {
  try {
    const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!raw) return createSeedHistoryEntries(currency);
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed as AuditHistoryEntry[];
    }
  } catch {
    // Ignore storage read errors
  }
  return createSeedHistoryEntries(currency);
}

function loadFreemiumState(): FreemiumState {
  const initial = createInitialFreemiumState();
  try {
    const raw = localStorage.getItem(FREEMIUM_STORAGE_KEY);
    if (!raw) return initial;
    const parsed = JSON.parse(raw) as Partial<FreemiumState>;
    return {
      tier:
        parsed.tier === 'freelance' || parsed.tier === 'agency'
          ? parsed.tier
          : 'free',
      usedAudits:
        typeof parsed.usedAudits === 'number' && parsed.usedAudits >= 0
          ? parsed.usedAudits
          : 0,
      maxFreeAudits: initial.maxFreeAudits,
      freelanceQuota: initial.freelanceQuota,
      agencyBrandName:
        typeof parsed.agencyBrandName === 'string' &&
        parsed.agencyBrandName.trim()
          ? parsed.agencyBrandName.trim()
          : initial.agencyBrandName,
      executorRequisites:
        typeof parsed.executorRequisites === 'string' &&
        parsed.executorRequisites.trim()
          ? parsed.executorRequisites.trim()
          : initial.executorRequisites,
      clientRequisites:
        typeof parsed.clientRequisites === 'string' &&
        parsed.clientRequisites.trim()
          ? parsed.clientRequisites.trim()
          : initial.clientRequisites,
    };
  } catch {
    return initial;
  }
}

export default function App() {
  const initialPreset = AUDIT_PRESETS[0];
  const initialCurrency = loadSavedCurrency();
  const initialRate = convertHourlyRate(
    initialPreset.hourlyRate,
    'RUB',
    initialCurrency
  );

  const [isDark, setIsDark] = useState<boolean>(loadSavedTheme);
  const [activeTab, setActiveTab] = useState<ActiveNavTab>('audit');
  const [currency, setCurrency] = useState<CurrencyCode>(initialCurrency);
  const [selectedPresetId, setSelectedPresetId] = useState<string>(
    initialPreset.id
  );
  const [activeHistoryId, setActiveHistoryId] = useState<string | null>(
    `seed-${initialPreset.id}`
  );
  const [historyEntries, setHistoryEntries] = useState<AuditHistoryEntry[]>(
    () => loadSavedHistory(initialCurrency)
  );
  const [projectName, setProjectName] = useState<string>(
    initialPreset.report.project_name
  );
  const [contractNumber, setContractNumber] = useState<string>(
    initialPreset.contractNumber
  );
  const [auditDate, setAuditDate] = useState<string>(
    initialPreset.report.audit_date
  );
  const [hourlyRate, setHourlyRate] = useState<number>(initialRate);
  const [specText, setSpecText] = useState<string>(initialPreset.specText);
  const [specFile, setSpecFile] = useState<File | null>(null);
  const [transcriptText, setTranscriptText] = useState<string>(
    initialPreset.transcriptText
  );
  const [transcriptFile, setTranscriptFile] = useState<File | null>(null);
  const [report, setReport] = useState<ScopeAuditReport>(() => ({
    ...initialPreset.report,
    client_email_draft: rebuildClientEmailDraft(
      initialPreset.report.project_name,
      initialPreset.report.out_of_scope_items,
      initialPreset.report.in_scope_items,
      initialRate,
      initialCurrency
    ),
    change_order_summary: rebuildChangeOrderSummary(
      initialPreset.report.project_name,
      initialPreset.report.audit_date,
      initialPreset.report.out_of_scope_items,
      initialRate,
      initialCurrency
    ),
  }));
  const [activeSection, setActiveSection] = useState<ActiveSection>('audit');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisStepText, setAnalysisStepText] = useState<string>('');
  const [analysisProgress, setAnalysisProgress] = useState<number>(0);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Freemium & Paywall State
  const [freemiumState, setFreemiumState] =
    useState<FreemiumState>(loadFreemiumState);
  const [isPricingModalOpen, setIsPricingModalOpen] = useState<boolean>(false);
  const [isQuotaPaywallTriggered, setIsQuotaPaywallTriggered] =
    useState<boolean>(false);

  // Official Print / PDF Sheet Modal State
  const [isPrintModalOpen, setIsPrintModalOpen] = useState<boolean>(false);

  // Sync dark class on documentElement
  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      localStorage.setItem(THEME_STORAGE_KEY, isDark ? 'dark' : 'light');
    } catch {
      // Ignore storage errors
    }
  }, [isDark]);

  useEffect(() => {
    try {
      localStorage.setItem(FREEMIUM_STORAGE_KEY, JSON.stringify(freemiumState));
    } catch {
      // Ignore storage quota errors
    }
  }, [freemiumState]);

  useEffect(() => {
    try {
      localStorage.setItem(CURRENCY_STORAGE_KEY, currency);
    } catch {
      // Ignore storage quota errors
    }
  }, [currency]);

  useEffect(() => {
    try {
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(historyEntries));
    } catch {
      // Ignore storage quota errors
    }
  }, [historyEntries]);

  const metrics = calculateScopeMetrics(report.out_of_scope_items, hourlyRate);

  const syncDeliverablesWithItems = (
    nextOutItems: OutOfScopeItem[],
    nextInItems: string[],
    nextProject = projectName,
    nextDate = auditDate,
    nextRate = hourlyRate,
    nextCurr = currency
  ): ScopeAuditReport => {
    const cleanProject = nextProject.trim() || 'Проект разработки ПО';
    const nextEmail = rebuildClientEmailDraft(
      cleanProject,
      nextOutItems,
      nextInItems,
      nextRate,
      nextCurr
    );
    const nextChangeOrder = rebuildChangeOrderSummary(
      cleanProject,
      nextDate,
      nextOutItems,
      nextRate,
      nextCurr
    );
    const updatedReport: ScopeAuditReport = {
      project_name: cleanProject,
      audit_date: nextDate,
      out_of_scope_items: nextOutItems,
      in_scope_items: nextInItems,
      client_email_draft: nextEmail,
      change_order_summary: nextChangeOrder,
    };
    setReport(updatedReport);
    return updatedReport;
  };

  const handleChangeCurrency = (nextCurrency: CurrencyCode) => {
    if (nextCurrency === currency) return;
    const convertedRate = convertHourlyRate(hourlyRate, currency, nextCurrency);
    setCurrency(nextCurrency);
    setHourlyRate(convertedRate);
    syncDeliverablesWithItems(
      report.out_of_scope_items,
      report.in_scope_items,
      projectName,
      auditDate,
      convertedRate,
      nextCurrency
    );
  };

  const handleSelectPreset = (preset: AuditPreset) => {
    const convertedRate = convertHourlyRate(preset.hourlyRate, 'RUB', currency);
    setSelectedPresetId(preset.id);
    setActiveHistoryId(`seed-${preset.id}`);
    setProjectName(preset.report.project_name);
    setContractNumber(preset.contractNumber);
    setAuditDate(preset.report.audit_date);
    setHourlyRate(convertedRate);
    setSpecText(preset.specText);
    setSpecFile(null);
    setTranscriptText(preset.transcriptText);
    setTranscriptFile(null);
    syncDeliverablesWithItems(
      preset.report.out_of_scope_items,
      preset.report.in_scope_items,
      preset.report.project_name,
      preset.report.audit_date,
      convertedRate,
      currency
    );
    setValidationError(null);
  };

  const handleClearInputs = () => {
    setSelectedPresetId('custom');
    setActiveHistoryId(null);
    setProjectName('');
    setSpecText('');
    setSpecFile(null);
    setTranscriptText('');
    setTranscriptFile(null);
    setValidationError(null);
  };

  const runScopeAudit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const hasSpec = Boolean(specText.trim() || specFile);
    const hasTranscript = Boolean(transcriptText.trim() || transcriptFile);

    if (!hasSpec || !hasTranscript) {
      setValidationError(
        'Ошибка валидации: загрузите файл или вставьте текст как для исходного ТЗ (Поле 1), так и для материалов встречи (Поле 2).'
      );
      return;
    }

    // Freemium Paywall Check
    if (!canPerformAudit(freemiumState)) {
      setIsQuotaPaywallTriggered(true);
      setIsPricingModalOpen(true);
      return;
    }

    setValidationError(null);
    setIsAnalyzing(true);
    setAnalysisStepText(
      specFile || transcriptFile
        ? 'Обработка файла и передача в Gemini File API...'
        : 'Обработка исходных документов...'
    );
    setAnalysisProgress(25);

    const stepTimer1 = window.setTimeout(() => {
      setAnalysisStepText('Сверка условий ТЗ и поиск скрытых доработок...');
      setAnalysisProgress(65);
    }, 280);

    const stepTimer2 = window.setTimeout(() => {
      setAnalysisStepText(
        'Формирование Change Order и дипломатичного письма...'
      );
      setAnalysisProgress(90);
    }, 560);

    try {
      const formData = new FormData();
      formData.append(
        'projectName',
        projectName.trim() || 'Аудит ИТ-проекта'
      );
      formData.append('specText', specText);
      formData.append('transcriptText', transcriptText);
      formData.append('auditDate', auditDate);
      formData.append('hourlyRate', String(hourlyRate));
      if (specFile) {
        formData.append('specFile', specFile);
      }
      if (transcriptFile) {
        formData.append('transcriptFile', transcriptFile);
      }

      const apiUrl = import.meta.env.VITE_API_URL || '/api/audit';
      const response = await fetch(apiUrl, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        setValidationError(
          data?.error || 'Не удалось выполнить сверку документов.'
        );
        return;
      }

      setAnalysisProgress(100);

      const userEnteredName = projectName.trim();
      const validated = validateAuditReportSchema(
        data?.report ?? data,
        userEnteredName || 'Аудит ИТ-проекта'
      );
      const finalProjectName = userEnteredName || validated.project_name;
      const finalAuditDate = auditDate.trim() || validated.audit_date;

      const syncedReport = syncDeliverablesWithItems(
        validated.out_of_scope_items,
        validated.in_scope_items,
        finalProjectName,
        finalAuditDate,
        hourlyRate,
        currency
      );
      setProjectName(finalProjectName);
      setAuditDate(finalAuditDate);
      setFreemiumState((prev) => consumeAuditQuota(prev));

      // Automatically save completed audit to History Library in localStorage
      const savedEntry = buildAuditHistoryEntry({
        projectName: finalProjectName,
        contractNumber,
        auditDate: finalAuditDate,
        hourlyRate,
        currency,
        specText: specText || (specFile ? `[Файл ТЗ: ${specFile.name}]` : ''),
        transcriptText:
          transcriptText ||
          (transcriptFile ? `[Медиафайл встречи: ${transcriptFile.name}]` : ''),
        report: syncedReport,
      });
      setHistoryEntries((prev) => upsertAuditHistoryEntry(prev, savedEntry));
      setActiveHistoryId(savedEntry.id);
    } catch (err) {
      setValidationError(
        err instanceof Error
          ? err.message
          : 'Ошибка соединения с сервером анализа.'
      );
    } finally {
      window.clearTimeout(stepTimer1);
      window.clearTimeout(stepTimer2);
      setIsAnalyzing(false);
      setAnalysisStepText('');
      setAnalysisProgress(0);
    }
  };

  const handleOpenHistoryEntry = (entry: AuditHistoryEntry) => {
    const rateInActive = convertHourlyRate(
      entry.hourlyRate,
      entry.currency,
      currency
    );
    setActiveHistoryId(entry.id);
    setSelectedPresetId('custom');
    setProjectName(entry.projectName);
    setContractNumber(entry.contractNumber);
    setAuditDate(entry.auditDate);
    setHourlyRate(rateInActive);
    setSpecText(entry.specText);
    setSpecFile(null);
    setTranscriptText(entry.transcriptText);
    setTranscriptFile(null);
    syncDeliverablesWithItems(
      entry.report.out_of_scope_items,
      entry.report.in_scope_items,
      entry.projectName,
      entry.auditDate,
      rateInActive,
      currency
    );
    setValidationError(null);
    setActiveTab('audit');
  };

  const handlePrintHistoryEntry = (entry: AuditHistoryEntry) => {
    handleOpenHistoryEntry(entry);
    setIsPrintModalOpen(true);
  };

  const handleDeleteHistoryEntry = (id: string) => {
    setHistoryEntries((prev) => deleteAuditHistoryEntry(prev, id));
    if (activeHistoryId === id) {
      setActiveHistoryId(null);
    }
  };

  const handleRestoreSeedHistory = () => {
    const seeds = createSeedHistoryEntries(currency);
    setHistoryEntries(seeds);
  };

  const handleUpdateItemHours = (id: number, hours: number) => {
    const clamped = clampSuggestedHours(hours);
    const nextItems = report.out_of_scope_items.map((item) =>
      item.id === id ? { ...item, suggested_hours: clamped } : item
    );
    syncDeliverablesWithItems(nextItems, report.in_scope_items);
  };

  const handleUpdateItemSeverity = (id: number, severity: SeverityLevel) => {
    const nextItems = report.out_of_scope_items.map((item) =>
      item.id === id ? { ...item, severity } : item
    );
    syncDeliverablesWithItems(nextItems, report.in_scope_items);
  };

  const handleDeleteItem = (id: number) => {
    const nextItems = report.out_of_scope_items
      .filter((item) => item.id !== id)
      .map((item, idx) => ({ ...item, id: idx + 1 }));
    syncDeliverablesWithItems(nextItems, report.in_scope_items);
  };

  const handleAddItem = (newItem: Omit<OutOfScopeItem, 'id'>) => {
    const nextId = report.out_of_scope_items.length + 1;
    const nextItems: OutOfScopeItem[] = [
      ...report.out_of_scope_items,
      { id: nextId, ...newItem },
    ];
    syncDeliverablesWithItems(nextItems, report.in_scope_items);
  };

  const handleAddInScopeItem = (text: string) => {
    const nextIn = [...report.in_scope_items, text];
    syncDeliverablesWithItems(report.out_of_scope_items, nextIn);
  };

  const handleRemoveInScopeItem = (index: number) => {
    const nextIn = report.in_scope_items.filter((_, idx) => idx !== index);
    syncDeliverablesWithItems(report.out_of_scope_items, nextIn);
  };

  const handleSelectSection = (section: ActiveSection) => {
    setActiveTab('audit');
    setActiveSection(section);
    window.setTimeout(() => {
      const el = document.getElementById(section);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 50);
  };

  const handleCompleteUpgrade = (
    tier: 'freelance' | 'agency',
    customAgencyBrand?: string
  ) => {
    setFreemiumState((prev) =>
      upgradeSubscription(prev, tier, customAgencyBrand)
    );
    setIsQuotaPaywallTriggered(false);
    setIsPricingModalOpen(false);
  };

  const handleResetDemoQuota = () => {
    setFreemiumState(createInitialFreemiumState());
    setIsQuotaPaywallTriggered(false);
  };

  return (
    <div
      id="top"
      className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-16 lg:pb-0 transition-colors"
    >
      <TopBar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        activeSection={activeSection}
        onSelectSection={handleSelectSection}
        historyCount={historyEntries.length}
        freemiumState={freemiumState}
        currency={currency}
        onChangeCurrency={handleChangeCurrency}
        isDark={isDark}
        onToggleTheme={() => setIsDark((prev) => !prev)}
        onOpenPricingModal={() => {
          setIsQuotaPaywallTriggered(false);
          setIsPricingModalOpen(true);
        }}
      />

      {/* Unified Dashboard Shell: Left Sidebar on Desktop + Main Content Viewport */}
      <div className="flex-1 flex max-w-[1600px] w-full mx-auto print:hidden">
        <DesktopSidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          activeSection={activeSection}
          onSelectSection={handleSelectSection}
          historyCount={historyEntries.length}
          freemiumState={freemiumState}
          onOpenPricingModal={() => {
            setIsQuotaPaywallTriggered(false);
            setIsPricingModalOpen(true);
          }}
        />

        <main className="flex-1 min-w-0 px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          {/* SCREEN 0: PRODUCT LANDING PAGE (Triggered by clicking Logo or 'О продукте') */}
          {activeTab === 'landing' && (
            <LandingPage
              currency={currency}
              hourlyRate={hourlyRate}
              freemiumState={freemiumState}
              onStartFreeAudit={() => {
                setActiveTab('audit');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onViewSampleReport={() => {
                handleSelectPreset(AUDIT_PRESETS[0]);
                setActiveTab('audit');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onOpenHistory={() => {
                setActiveTab('history');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          )}

          {/* SCREEN 1: MAIN AUDIT WORKSPACE (Two-Column Desktop Layout) */}
          {activeTab === 'audit' && (
            <>
              {/* Executive Header & Financial Protection Strip */}
              <section
                id="audit"
                aria-label="Сводка защиты бюджета проекта"
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6"
              >
                <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-800">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <span>{freemiumState.agencyBrandName}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">
                        Дата аудита: {report.audit_date}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{contractNumber}</span>
                    </div>
                    <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-slate-900 dark:text-white mt-1.5 text-balance">
                      {report.project_name || 'Аудит ТЗ и расшифровки переговоров'}
                    </h1>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => setActiveTab('history')}
                      className="min-h-[44px] inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <FolderClock className="w-3.5 h-3.5" />
                      <span>Библиотека ({historyEntries.length})</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsPrintModalOpen(true)}
                      className="min-h-[44px] inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Экспорт Change Order в PDF / Печать</span>
                    </button>
                  </div>
                </div>

                {/* 4-Column Tabular KPI Strip */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 pt-5">
                  <div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      Выявлено новых хотелок
                    </div>
                    <div
                      data-testid="metric-item-count"
                      className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-1"
                    >
                      {metrics.itemCount} поз.
                    </div>
                    <div className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-1 font-mono tabular-nums">
                      <span>Крит: {metrics.criticalCount}</span>
                      <span className="mx-1" aria-hidden="true">
                        ·
                      </span>
                      <span>Сред: {metrics.mediumCount}</span>
                      <span className="mx-1" aria-hidden="true">
                        ·
                      </span>
                      <span>Низ: {metrics.lowCount}</span>
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      Объем доработок сверх сметы
                    </div>
                    <div
                      data-testid="metric-total-hours"
                      className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-1"
                    >
                      {metrics.totalHours} нормо-ч
                    </div>
                    <div className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Диапазон: 1–40 ч на задачу
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      Защищенный бюджет (Change Order)
                    </div>
                    <div
                      data-testid="metric-total-cost"
                      className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-indigo-600 dark:text-indigo-400 mt-1"
                    >
                      {formatMoney(metrics.totalCost, currency)}
                    </div>
                    <div className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-1 font-mono tabular-nums">
                      Ставка {formatMoney(hourlyRate, currency)}/ч
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      Правовое влияние на график
                    </div>
                    <div className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-1">
                      +
                      {metrics.totalHours > 0
                        ? Math.max(1, Math.ceil(metrics.totalHours / 6))
                        : 0}{' '}
                      раб. дн.
                    </div>
                    <div className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Соразмерный сдвиг дедлайна
                    </div>
                  </div>
                </div>
              </section>

              {/* TWO-COLUMN DESKTOP WORKSPACE: Left = Upload Form, Right = Live Scope Creep Register */}
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
                <div className="xl:col-span-5">
                  <SourceInputPanel
                    selectedPresetId={selectedPresetId}
                    onSelectPreset={handleSelectPreset}
                    projectName={projectName}
                    onChangeProjectName={(val) => {
                      setProjectName(val);
                      setReport((prev) => ({
                        ...prev,
                        project_name: val.trim() || prev.project_name,
                      }));
                    }}
                    auditDate={auditDate}
                    onChangeAuditDate={(val) => {
                      setAuditDate(val);
                      setReport((prev) => ({ ...prev, audit_date: val }));
                    }}
                    hourlyRate={hourlyRate}
                    onChangeHourlyRate={(val) => {
                      const safe =
                        Number.isFinite(val) && val > 0 ? val : 50;
                      setHourlyRate(safe);
                      syncDeliverablesWithItems(
                        report.out_of_scope_items,
                        report.in_scope_items,
                        projectName,
                        auditDate,
                        safe,
                        currency
                      );
                    }}
                    currency={currency}
                    specText={specText}
                    onChangeSpecText={setSpecText}
                    specFile={specFile}
                    onChangeSpecFile={setSpecFile}
                    transcriptText={transcriptText}
                    onChangeTranscriptText={setTranscriptText}
                    transcriptFile={transcriptFile}
                    onChangeTranscriptFile={setTranscriptFile}
                    onSubmitAudit={runScopeAudit}
                    onClearInputs={handleClearInputs}
                    isAnalyzing={isAnalyzing}
                    analysisStepText={analysisStepText}
                    analysisProgress={analysisProgress}
                    validationError={validationError}
                    onSetValidationError={setValidationError}
                  />
                </div>

                <div className="xl:col-span-7">
                  <ScopeItemsTable
                    outOfScopeItems={report.out_of_scope_items}
                    inScopeItems={report.in_scope_items}
                    hourlyRate={hourlyRate}
                    currency={currency}
                    onUpdateItemHours={handleUpdateItemHours}
                    onUpdateItemSeverity={handleUpdateItemSeverity}
                    onDeleteItem={handleDeleteItem}
                    onAddItem={handleAddItem}
                    onAddInScopeItem={handleAddInScopeItem}
                    onRemoveInScopeItem={handleRemoveInScopeItem}
                  />
                </div>
              </div>

              {/* Deliverables: Diplomatic Client Email, Change Order & JSON Schema */}
              <DeliverablesView
                report={report}
                hourlyRate={hourlyRate}
                currency={currency}
                onUpdateEmailSubject={(subject) =>
                  setReport((prev) => ({
                    ...prev,
                    client_email_draft: {
                      ...prev.client_email_draft,
                      subject,
                    },
                  }))
                }
                onUpdateEmailBody={(body) =>
                  setReport((prev) => ({
                    ...prev,
                    client_email_draft: { ...prev.client_email_draft, body },
                  }))
                }
                onUpdateChangeOrder={(summary) =>
                  setReport((prev) => ({
                    ...prev,
                    change_order_summary: summary,
                  }))
                }
                onRegenerateTemplates={() =>
                  syncDeliverablesWithItems(
                    report.out_of_scope_items,
                    report.in_scope_items
                  )
                }
                onOpenPrintModal={() => setIsPrintModalOpen(true)}
              />
            </>
          )}

          {/* SCREEN 2: LIBRARY OF AUDITS / HISTORY */}
          {activeTab === 'history' && (
            <AuditHistoryView
              entries={historyEntries}
              activeEntryId={activeHistoryId}
              currency={currency}
              onOpenEntry={handleOpenHistoryEntry}
              onPrintEntry={handlePrintHistoryEntry}
              onDeleteEntry={handleDeleteHistoryEntry}
              onRestoreSeedHistory={handleRestoreSeedHistory}
              onStartNewAudit={() => {
                handleClearInputs();
                setActiveTab('audit');
              }}
            />
          )}

          {/* SCREEN 3: TARIFFS & LIMITS HUB */}
          {activeTab === 'pricing' && (
            <PricingModal
              isOpen={true}
              inlineMode={true}
              onClose={() => setActiveTab('audit')}
              currentTier={freemiumState.tier}
              freemiumState={freemiumState}
              currency={currency}
              onChangeCurrency={handleChangeCurrency}
              quotaExhaustedReason={isQuotaPaywallTriggered}
              initialAgencyBrand={freemiumState.agencyBrandName}
              onCompleteUpgrade={handleCompleteUpgrade}
              onResetDemoQuota={handleResetDemoQuota}
            />
          )}
        </main>
      </div>

      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-5 px-6 mt-8 print:hidden">
        <div className="max-w-[1600px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
          <span>
            ScopeGuard Legal — Система защиты ИТ-исполнителей от несогласованного расширения объема работ
          </span>
          <span>
            Формат выгрузки: Строгая JSON-схема · Change Order PDF/Word · Gemini File API (PDF/DOCX/MP3/WAV)
          </span>
        </div>
      </footer>

      {/* Mobile Bottom Navigation Bar */}
      <MobileBottomNav
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        historyCount={historyEntries.length}
      />

      {/* Modal Pricing & Paywall Dialog */}
      <PricingModal
        isOpen={isPricingModalOpen}
        onClose={() => setIsPricingModalOpen(false)}
        currentTier={freemiumState.tier}
        freemiumState={freemiumState}
        currency={currency}
        onChangeCurrency={handleChangeCurrency}
        quotaExhaustedReason={isQuotaPaywallTriggered}
        initialAgencyBrand={freemiumState.agencyBrandName}
        onCompleteUpgrade={handleCompleteUpgrade}
        onResetDemoQuota={handleResetDemoQuota}
      />

      {/* Official Branded Change Order Sheet for PDF / Print / Word Export */}
      <OfficialChangeOrderPrintModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        report={report}
        hourlyRate={hourlyRate}
        currency={currency}
        contractNumber={contractNumber}
        onChangeContractNumber={setContractNumber}
        agencyBrandName={freemiumState.agencyBrandName}
        onChangeAgencyBrandName={(val) =>
          setFreemiumState((prev) => ({ ...prev, agencyBrandName: val }))
        }
        executorRequisites={freemiumState.executorRequisites}
        onChangeExecutorRequisites={(val) =>
          setFreemiumState((prev) => ({ ...prev, executorRequisites: val }))
        }
        clientRequisites={freemiumState.clientRequisites}
        onChangeClientRequisites={(val) =>
          setFreemiumState((prev) => ({ ...prev, clientRequisites: val }))
        }
        tier={freemiumState.tier}
      />
    </div>
  );
}
