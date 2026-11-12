import React, { useEffect, useState } from 'react';
import {
  Clock,
  FileSpreadsheet,
  FolderClock,
  Layers,
  MailCheck,
  Printer,
  Scale,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import {
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
import { SampleReportModal } from './components/SampleReportModal';
import { ToastContainer, type ToastItem } from './components/ToastContainer';
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

type WorkspaceResultsTab = 'all' | 'registry' | 'email' | 'change-order';

function useAnimatedNumber(targetValue: number, durationMs = 380): number {
  const [displayValue, setDisplayValue] = useState<number>(targetValue);

  useEffect(() => {
    let rafId = 0;
    const startValue = displayValue;
    const delta = targetValue - startValue;
    if (delta === 0) return;

    const startTime = performance.now();
    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / durationMs);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.round(startValue + delta * eased));
      if (progress < 1) {
        rafId = window.requestAnimationFrame(tick);
      } else {
        setDisplayValue(targetValue);
      }
    };

    rafId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(rafId);
  }, [targetValue, durationMs]);

  return displayValue;
}

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
  // Open immediately on the new Landing Page on first visit
  const [activeTab, setActiveTab] = useState<ActiveNavTab>('landing');
  const [workspaceResultsTab, setWorkspaceResultsTab] =
    useState<WorkspaceResultsTab>('all');
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
  const [isSampleModalOpen, setIsSampleModalOpen] = useState<boolean>(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = (
    title: string,
    description?: string,
    variant: ToastItem['variant'] = 'success'
  ) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setToasts((prev) => [...prev.slice(-2), { id, title, description, variant }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3600);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

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
  const shiftDays =
    metrics.totalHours > 0 ? Math.max(1, Math.ceil(metrics.totalHours / 6)) : 0;

  const animatedTotalCost = useAnimatedNumber(metrics.totalCost);
  const animatedTotalHours = useAnimatedNumber(metrics.totalHours);
  const animatedItemCount = useAnimatedNumber(metrics.itemCount);
  const animatedShiftDays = useAnimatedNumber(shiftDays);

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
    setAnalysisStepText('Читаем ТЗ...');
    setAnalysisProgress(20);

    const stepTimer1 = window.setTimeout(() => {
      setAnalysisStepText('Сверяем стенограмму...');
      setAnalysisProgress(48);
    }, 220);

    const stepTimer2 = window.setTimeout(() => {
      setAnalysisStepText('Считаем нормо-часы...');
      setAnalysisProgress(74);
    }, 440);

    const stepTimer3 = window.setTimeout(() => {
      setAnalysisStepText('Формируем юридическое обоснование...');
      setAnalysisProgress(92);
    }, 660);

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
      addToast(
        'Юридический аудит завершен и сохранен',
        `Проект «${finalProjectName}»: выявлено ${validated.out_of_scope_items.length} поз. вне ТЗ.`,
        'document'
      );

      // Smoothly scroll to results zone
      window.setTimeout(() => {
        const el = document.getElementById('results-zone');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 80);
    } catch (err) {
      setValidationError(
        err instanceof Error
          ? err.message
          : 'Ошибка соединения с сервером анализа.'
      );
    } finally {
      window.clearTimeout(stepTimer1);
      window.clearTimeout(stepTimer2);
      window.clearTimeout(stepTimer3);
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
    addToast(
      `Доработка «${newItem.title}» добавлена`,
      `Оценка +${newItem.suggested_hours} ч включена в расчет Change Order и письма.`,
      'success'
    );
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
    addToast(
      `Тариф ${tier === 'agency' ? 'Agency Unlimited' : 'Freelance Pro'} активирован`,
      'Лимиты проверок и функции экспорта документов успешно обновлены.',
      'success'
    );
  };

  const handleResetDemoQuota = () => {
    setFreemiumState(createInitialFreemiumState());
    setIsQuotaPaywallTriggered(false);
    addToast('Демо-лимит сброшен', 'Доступно 2 из 2 бесплатных аудитов.', 'info');
  };

  return (
    <div
      id="top"
      className="min-h-screen flex flex-col bg-[#F8FAFC] dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-16 lg:pb-0 transition-colors"
    >
      {/* Sleek Floating Top Bar (No bulky left sidebar!) */}
      <TopBar
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
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

      {/* Full-Width Main Viewport */}
      <div className="flex-1 w-full print:hidden">
        {/* SCREEN 0: ULTRA-MODERN FRAMER / LINEAR / APPLE LANDING PAGE */}
        {activeTab === 'landing' && (
          <LandingPage
            currency={currency}
            hourlyRate={hourlyRate}
            freemiumState={freemiumState}
            onStartFreeAudit={() => {
              setActiveTab('audit');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onOpenSampleModal={() => setIsSampleModalOpen(true)}
            onOpenHistory={() => {
              setActiveTab('history');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {/* SCREEN 1: FULL-WIDTH TOP-TO-BOTTOM WORKSPACE ("КАБИНЕТ") */}
        {activeTab === 'audit' && (
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8 animate-tab-fade">
            {/* Workspace Hero Banner / Quick Context Header */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 font-semibold border border-indigo-500/20">
                    <Sparkles className="w-3 h-3" />
                    Рабочий кабинет ScopeGuard
                  </span>
                  <span>{freemiumState.agencyBrandName}</span>
                  <span aria-hidden="true">·</span>
                  <span>{contractNumber}</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                  {report.project_name || 'Аудит ТЗ и расшифровки переговоров'}
                </h1>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsSampleModalOpen(true)}
                  className="min-h-[40px] inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/90 dark:border-slate-800 rounded-xl shadow-2xs transition-all active:scale-95 cursor-pointer"
                >
                  <span>Пример отчета</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('history')}
                  className="min-h-[40px] inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/90 dark:border-slate-800 rounded-xl shadow-2xs transition-all active:scale-95 cursor-pointer"
                >
                  <FolderClock className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>Архив ({historyEntries.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsPrintModalOpen(true);
                    addToast(
                      'Официальный бланк Change Order сформирован',
                      'Готов к печати, сохранению в PDF или выгрузке в Word.',
                      'document'
                    );
                  }}
                  className="min-h-[40px] inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 rounded-xl shadow-sm transition-all active:scale-95 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Бланк PDF / Печать</span>
                </button>
              </div>
            </div>

            {/* ZONE 1: SIDE-BY-SIDE DRAG & DROP UPLOAD ZONE */}
            <SourceInputPanel
              selectedPresetId={selectedPresetId}
              onSelectPreset={(preset) => {
                handleSelectPreset(preset);
                addToast(
                  `Загружен шаблон «${preset.label}»`,
                  'Исходное ТЗ, стенограмма и реестр правок синхронизированы.',
                  'info'
                );
              }}
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
                const safe = Number.isFinite(val) && val > 0 ? val : 50;
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

            {/* ZONE 2: RESULTS DASHBOARD — ANIMATED KPI CARDS + UNIFIED TABS */}
            <section
              id="results-zone"
              aria-label="Сводка защиты бюджета и результаты аудита"
              className="space-y-6 pt-2"
            >
              {/* 4 Large Animated KPI Cards */}
              <div
                id="audit"
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
              >
                {/* KPI 1: Protected Budget (Emerald/Indigo Highlight) */}
                <div className="glass-card card-hover-lift rounded-3xl p-5 sm:p-6 relative overflow-hidden border-emerald-500/30 dark:border-emerald-500/30">
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute -right-8 -top-8 w-28 h-28 rounded-full bg-emerald-500/10 blur-2xl"
                  />
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                      Защищенный бюджет
                    </span>
                    <span className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                      <ShieldCheck className="w-4 h-4" />
                    </span>
                  </div>
                  <div
                    data-testid="metric-total-cost"
                    className="text-2xl sm:text-3xl font-extrabold font-mono tabular-nums text-emerald-600 dark:text-emerald-400 mt-2 tracking-tight"
                  >
                    {formatMoney(animatedTotalCost, currency)}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 font-mono tabular-nums">
                    Ставка: {formatMoney(hourlyRate, currency)}/ч · Change Order
                  </div>
                </div>

                {/* KPI 2: Hours Out of Scope */}
                <div className="glass-card card-hover-lift rounded-3xl p-5 sm:p-6">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                      Часы сверх ТЗ
                    </span>
                    <span className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                      <Clock className="w-4 h-4" />
                    </span>
                  </div>
                  <div
                    data-testid="metric-total-hours"
                    className="text-2xl sm:text-3xl font-extrabold font-mono tabular-nums text-slate-900 dark:text-white mt-2 tracking-tight"
                  >
                    +{animatedTotalHours} нормо-ч
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
                    Калибровка 1–40 ч на каждую задачу
                  </div>
                </div>

                {/* KPI 3: Legal Deadline Shift */}
                <div className="glass-card card-hover-lift rounded-3xl p-5 sm:p-6">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                      Сдвиг срока сдачи
                    </span>
                    <span className="w-8 h-8 rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center">
                      <TrendingUp className="w-4 h-4" />
                    </span>
                  </div>
                  <div className="text-2xl sm:text-3xl font-extrabold font-mono tabular-nums text-slate-900 dark:text-white mt-2 tracking-tight">
                    +{animatedShiftDays} раб. дн.
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
                    Правовое продление дедлайна этапа
                  </div>
                </div>

                {/* KPI 4: Out-of-Scope Findings Count */}
                <div className="glass-card card-hover-lift rounded-3xl p-5 sm:p-6">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                      Выявлено хотелок вне ТЗ
                    </span>
                    <span className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                      <FileSpreadsheet className="w-4 h-4" />
                    </span>
                  </div>
                  <div
                    data-testid="metric-item-count"
                    className="text-2xl sm:text-3xl font-extrabold font-mono tabular-nums text-slate-900 dark:text-white mt-2 tracking-tight"
                  >
                    {animatedItemCount} поз.
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 font-mono tabular-nums">
                    Крит: {metrics.criticalCount} · Сред: {metrics.mediumCount}{' '}
                    · Низ: {metrics.lowCount}
                  </div>
                </div>
              </div>

              {/* Unified Results Navigation Bar: «Все разделы / Реестр / Письмо / Доп. соглашение / PDF» */}
              <div className="glass-card rounded-2xl p-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div
                  role="tablist"
                  aria-label="Навигация по результатам аудита"
                  className="flex flex-wrap items-center gap-1 p-1 bg-slate-100/90 dark:bg-slate-800/80 rounded-xl"
                >
                  {(
                    [
                      { id: 'all', label: 'Все разделы', icon: Layers },
                      {
                        id: 'registry',
                        label: `Реестр (${report.out_of_scope_items.length})`,
                        icon: FileSpreadsheet,
                      },
                      {
                        id: 'email',
                        label: 'Письмо клиенту',
                        icon: MailCheck,
                      },
                      {
                        id: 'change-order',
                        label: 'Доп. соглашение',
                        icon: Scale,
                      },
                    ] as const
                  ).map((tab) => {
                    const Icon = tab.icon;
                    const active = workspaceResultsTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        onClick={() => setWorkspaceResultsTab(tab.id)}
                        className={`min-h-[38px] inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-lg transition-all active:scale-95 cursor-pointer whitespace-nowrap ${
                          active
                            ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setIsPrintModalOpen(true);
                    addToast(
                      'Официальный бланк Change Order открыт',
                      'Доступна печать в PDF или скачивание в Word (.doc).',
                      'document'
                    );
                  }}
                  className="min-h-[38px] inline-flex items-center justify-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-slate-900 dark:bg-indigo-600 hover:bg-indigo-600 dark:hover:bg-indigo-500 rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer whitespace-nowrap"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>PDF / Печать бланка</span>
                </button>
              </div>

              {/* Active Results View */}
              <div key={workspaceResultsTab} className="space-y-6 animate-tab-fade">
                {(workspaceResultsTab === 'all' ||
                  workspaceResultsTab === 'registry') && (
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
                )}

                {(workspaceResultsTab === 'all' ||
                  workspaceResultsTab === 'email' ||
                  workspaceResultsTab === 'change-order') && (
                  <DeliverablesView
                    report={report}
                    hourlyRate={hourlyRate}
                    currency={currency}
                    initialTab={
                      workspaceResultsTab === 'email'
                        ? 'email'
                        : workspaceResultsTab === 'change-order'
                        ? 'change-order'
                        : 'all'
                    }
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
                        client_email_draft: {
                          ...prev.client_email_draft,
                          body,
                        },
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
                    onOpenPrintModal={() => {
                      setIsPrintModalOpen(true);
                      addToast(
                        'Официальный бланк Change Order открыт',
                        'Вы можете распечатать документ в PDF или скачать в формате Word.',
                        'document'
                      );
                    }}
                    onNotifyToast={(title, desc) =>
                      addToast(title, desc, 'success')
                    }
                  />
                )}
              </div>
            </section>
          </main>
        )}

        {/* SCREEN 2: LIBRARY OF AUDITS / HISTORY ("АРХИВ") */}
        {activeTab === 'history' && (
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 animate-tab-fade">
            <AuditHistoryView
              entries={historyEntries}
              activeEntryId={activeHistoryId}
              currency={currency}
              onOpenEntry={(entry) => {
                handleOpenHistoryEntry(entry);
                addToast(
                  `Открыт проект «${entry.projectName}»`,
                  'Данные отчета и смета загружены в рабочий кабинет.',
                  'info'
                );
              }}
              onPrintEntry={handlePrintHistoryEntry}
              onDeleteEntry={handleDeleteHistoryEntry}
              onRestoreSeedHistory={handleRestoreSeedHistory}
              onStartNewAudit={() => {
                handleClearInputs();
                setActiveTab('audit');
              }}
            />
          </main>
        )}

        {/* SCREEN 3: TARIFFS & LIMITS HUB */}
        {activeTab === 'pricing' && (
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 animate-tab-fade">
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
          </main>
        )}
      </div>

      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200/80 dark:border-slate-800 py-5 px-6 mt-8 print:hidden">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
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
        onSelectTab={(tab) => {
          setActiveTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        historyCount={historyEntries.length}
      />

      {/* Interactive Sample Report Preview Modal (From Landing Page) */}
      <SampleReportModal
        isOpen={isSampleModalOpen}
        currency={currency}
        onClose={() => setIsSampleModalOpen(false)}
        onLoadPresetInWorkspace={(preset) => {
          handleSelectPreset(preset);
          setActiveTab('audit');
          window.scrollTo({ top: 0, behavior: 'smooth' });
          addToast(
            `Пример «${preset.label}» загружен в кабинет`,
            'Вы можете отредактировать часы или протестировать свой документ.',
            'info'
          );
        }}
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

      {/* Bottom-Right Animated Toast Notification Stack */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
