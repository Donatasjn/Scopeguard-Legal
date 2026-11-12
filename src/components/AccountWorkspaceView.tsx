import React, { useEffect, useState } from 'react';
import {
  ArrowUpRight,
  Bell,
  Bot,
  Building2,
  Calendar,
  Check,
  Clock,
  Coins,
  CreditCard,
  Download,
  FileJson,
  FileSpreadsheet,
  FolderClock,
  Globe,
  KeyRound,
  Loader2,
  LogOut,
  Mail,
  Plus,
  RotateCcw,
  Save,
  Send,
  Settings,
  ShieldCheck,
  Sparkles,
  Trash2,
  User,
} from 'lucide-react';
import {
  SUPPORTED_LANGUAGES,
  formatDateByPreference,
  useI18n,
  type LanguageCode,
} from '../lib/i18n';
import {
  exportUserAuditsToCsvFile,
  exportUserAuditsToJsonFile,
  getInitials,
  getRemainingUserAudits,
  sendEmailOtpCode,
  toggleProfileAdminAccess,
  updateAccountPassword,
  updateProfileStudioName,
  type CloudAuditRecord,
  type UserProfile,
} from '../lib/supabase';
import {
  CURRENCY_CONFIGS,
  convertHourlyRate,
  createDefaultUserSettings,
  formatMoney,
  getPlanPriceDisplay,
  type CurrencyCode,
  type EmailToneOption,
  type ReportLanguageCode,
  type StrictnessOption,
  type TaxNoteOption,
  type UserSettings,
  type WorkHoursPerDayOption,
} from '../utils/scopeAnalyzer';

interface AccountWorkspaceViewProps {
  profile: UserProfile;
  cloudAudits: CloudAuditRecord[];
  currency: CurrencyCode;
  onChangeCurrency?: (currency: CurrencyCode) => void;
  userSettings: UserSettings;
  onSaveUserSettings: (nextSettings: UserSettings) => Promise<void> | void;
  onProfileUpdated: (next: UserProfile) => void;
  onOpenCloudAudit: (audit: CloudAuditRecord) => void;
  onDeleteCloudAudit: (auditId: string) => void;
  onOpenPricingModal: () => void;
  onStartNewAudit: () => void;
  onOpenAdminPanel: () => void;
  onSignOut: () => void;
  onNotifyToast: (
    title: string,
    description?: string,
    variant?: 'success' | 'info' | 'document'
  ) => void;
}

type AccountSectionFilter = 'all' | 'settings' | 'library';

const TIMEZONE_OPTIONS = [
  'Europe/Moscow (UTC+3)',
  'Asia/Almaty (UTC+5)',
  'Asia/Dubai (UTC+4)',
  'Europe/Berlin (UTC+1)',
  'Europe/London (UTC+0)',
  'America/New_York (UTC-5)',
  'America/Sao_Paulo (UTC-3)',
  'Asia/Shanghai (UTC+8)',
  'Asia/Tokyo (UTC+9)',
];

const ALL_CURRENCIES: Array<{ code: CurrencyCode; label: string }> = [
  { code: 'RUB', label: '₽ RUB (Российский рубль)' },
  { code: 'USD', label: '$ USD (US Dollar)' },
  { code: 'EUR', label: '€ EUR (Euro)' },
  { code: 'KZT', label: '₸ KZT (Казахстанский тенге)' },
  { code: 'CNY', label: '¥ CNY (人民币 Yuan)' },
  { code: 'BYN', label: 'Br BYN (Белорусский рубль)' },
  { code: 'GBP', label: '£ GBP (British Pound)' },
  { code: 'AED', label: 'د.إ AED (UAE Dirham)' },
  { code: 'JPY', label: '¥ JPY (日本円 Yen)' },
];

export const AccountWorkspaceView: React.FC<AccountWorkspaceViewProps> = ({
  profile,
  cloudAudits,
  currency,
  onChangeCurrency,
  userSettings,
  onSaveUserSettings,
  onProfileUpdated,
  onOpenCloudAudit,
  onDeleteCloudAudit,
  onOpenPricingModal,
  onStartNewAudit,
  onOpenAdminPanel,
  onSignOut,
  onNotifyToast,
}) => {
  const { lang, setLang, t } = useI18n();
  const [activeSubTab, setActiveSubTab] = useState<AccountSectionFilter>('all');

  const [studioName, setStudioName] = useState(profile.full_name);
  const [isSavingName, setIsSavingName] = useState(false);
  const [nameSavedSuccess, setNameSavedSuccess] = useState(false);

  // Settings form state initialized from userSettings
  const [draftSettings, setDraftSettings] = useState<UserSettings>(userSettings);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [settingsSavedBadge, setSettingsSavedBadge] = useState(false);

  useEffect(() => {
    setDraftSettings(userSettings);
  }, [userSettings]);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [passwordStatus, setPasswordStatus] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [otpSentSuccess, setOtpSentSuccess] = useState(false);

  const initials = getInitials(profile.full_name || profile.email);
  const remainingAudits = getRemainingUserAudits(profile);
  const usagePercent = Math.min(
    100,
    Math.round(
      (profile.audits_used / Math.max(1, profile.audits_limit)) * 100
    )
  );

  const totalProtectedInActiveCurrency = cloudAudits.reduce((sum, item) => {
    const rateInCurr = convertHourlyRate(
      item.hourly_rate || 4500,
      item.currency || 'RUB',
      currency
    );
    return sum + item.total_hours * rateInCurr;
  }, 0);

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studioName.trim()) return;
    setIsSavingName(true);
    try {
      const updated = await updateProfileStudioName(profile, studioName);
      onProfileUpdated(updated);
      setNameSavedSuccess(true);
      onNotifyToast(
        t('account.saved'),
        `${updated.full_name}`,
        'success'
      );
      window.setTimeout(() => setNameSavedSuccess(false), 2500);
    } finally {
      setIsSavingName(false);
    }
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordStatus(null);

    if (newPassword.length < 6) {
      setPasswordStatus({
        type: 'error',
        text: t('account.newPasswordPlaceholder'),
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordStatus({
        type: 'error',
        text: 'Пароли не совпадают / Passwords do not match.',
      });
      return;
    }

    setIsSavingPassword(true);
    try {
      const res = await updateAccountPassword(newPassword);
      setPasswordStatus({
        type: res.success ? 'success' : 'error',
        text: res.message,
      });
      if (res.success) {
        setNewPassword('');
        setConfirmPassword('');
        onNotifyToast(t('account.updatePasswordBtn'), res.message, 'success');
      }
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleSendVerificationOtp = async () => {
    setIsSendingOtp(true);
    try {
      const res = await sendEmailOtpCode(profile.email);
      if (res.sent) {
        setOtpSentSuccess(true);
        onNotifyToast(
          t('settings.cardD.otpSentToast'),
          `${profile.email}`,
          'info'
        );
        window.setTimeout(() => setOtpSentSuccess(false), 4000);
      }
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleInterfaceLangChangeInSettings = (nextLang: LanguageCode) => {
    setLang(nextLang);
    setDraftSettings((prev) => ({
      ...prev,
      interfaceLanguage: nextLang,
    }));
  };

  const handleDefaultCurrencyChangeInSettings = (nextCurr: CurrencyCode) => {
    const convertedRate = convertHourlyRate(
      draftSettings.defaultHourlyRate,
      draftSettings.defaultCurrency,
      nextCurr
    );
    setDraftSettings((prev) => ({
      ...prev,
      defaultCurrency: nextCurr,
      defaultHourlyRate: convertedRate,
    }));
  };

  const handleSaveAllSettings = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSavingSettings(true);
    try {
      await onSaveUserSettings(draftSettings);
      setSettingsSavedBadge(true);
      onNotifyToast(
        t('settings.savedToastTitle'),
        t('settings.savedToastDesc'),
        'success'
      );
      window.setTimeout(() => setSettingsSavedBadge(false), 3000);
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleResetDefaultSettings = async () => {
    const defaults = createDefaultUserSettings();
    setDraftSettings(defaults);
    setLang(defaults.interfaceLanguage);
    await onSaveUserSettings(defaults);
    onNotifyToast(
      t('settings.resetToastTitle'),
      t('settings.savedToastDesc'),
      'info'
    );
  };

  const handleExportJson = () => {
    exportUserAuditsToJsonFile(cloudAudits);
    onNotifyToast(
      t('settings.cardD.exportJsonBtn'),
      `${cloudAudits.length} отчетов выгружено в JSON`,
      'document'
    );
  };

  const handleExportCsv = () => {
    exportUserAuditsToCsvFile(cloudAudits);
    onNotifyToast(
      t('settings.cardD.exportCsvBtn'),
      `${cloudAudits.length} отчетов выгружено в CSV`,
      'document'
    );
  };

  const handleToggleAdminMode = async () => {
    const nextState = !profile.is_admin;
    const updated = await toggleProfileAdminAccess(profile, nextState);
    onProfileUpdated(updated);
    onNotifyToast(
      nextState
        ? 'Режим разработчика (is_admin) включен'
        : 'Режим разработчика отключен',
      nextState
        ? 'В верхней панели открыта вкладка «Кабинет разработчика».'
        : 'Вкладка разработчика скрыта из навигации.',
      'info'
    );
  };

  return (
    <div
      data-testid="account-workspace-view"
      className="space-y-8 animate-tab-fade"
    >
      {/* Top Header Banner */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-600 via-violet-600 to-emerald-500 text-white font-extrabold text-xl flex items-center justify-center shadow-lg shrink-0">
            {initials}
          </div>

          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  profile.plan === 'pro'
                    ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-2xs'
                    : 'bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <Sparkles className="w-3 h-3" />
                <span>
                  {profile.plan === 'pro'
                    ? t('account.planPro')
                    : t('account.planFree')}
                </span>
              </span>

              {profile.is_admin && (
                <button
                  type="button"
                  onClick={onOpenAdminPanel}
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25 transition-colors cursor-pointer"
                >
                  <ShieldCheck className="w-3 h-3" />
                  <span>{t('account.adminBadge')}</span>
                </button>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              {profile.full_name}
            </h1>

            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
              <span className="inline-flex items-center gap-1.5 font-mono">
                <Mail className="w-3.5 h-3.5 text-indigo-500" />
                {profile.email}
              </span>
              <span aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1.5 font-mono tabular-nums">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                {t('account.registered')}:{' '}
                {formatDateByPreference(
                  profile.created_at,
                  draftSettings.dateFormat
                )}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onStartNewAudit}
            className="min-h-[42px] inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 rounded-xl shadow-sm transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{t('account.newAuditBtn')}</span>
          </button>

          <button
            type="button"
            data-testid="account-signout-btn"
            onClick={onSignOut}
            className="min-h-[42px] inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100/90 dark:bg-slate-800 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-400 rounded-xl border border-slate-200/80 dark:border-slate-700 transition-all active:scale-95 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{t('account.signOutBtn')}</span>
          </button>
        </div>
      </div>

      {/* Sub-navigation Tabs inside Personal Account */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          role="tablist"
          aria-label="Account sections"
          className="inline-flex flex-wrap items-center gap-1.5 p-1.5 rounded-2xl bg-slate-200/70 dark:bg-slate-900/90 border border-slate-300/70 dark:border-slate-800"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeSubTab === 'all'}
            data-testid="account-tab-overview"
            onClick={() => setActiveSubTab('all')}
            className={`min-h-[38px] inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeSubTab === 'all'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <User className="w-3.5 h-3.5 text-indigo-500" />
            <span>{t('account.subTabOverview')}</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeSubTab === 'settings'}
            data-testid="account-tab-settings"
            onClick={() => setActiveSubTab('settings')}
            className={`min-h-[38px] inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeSubTab === 'settings'
                ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>{t('account.subTabSettings')}</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeSubTab === 'library'}
            data-testid="account-tab-library"
            onClick={() => setActiveSubTab('library')}
            className={`min-h-[38px] inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeSubTab === 'library'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <FolderClock className="w-3.5 h-3.5 text-emerald-500" />
            <span>
              {t('account.subTabLibrary')} ({cloudAudits.length})
            </span>
          </button>
        </div>

        {/* Quick Save Settings Button in Toolbar */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleResetDefaultSettings}
            className="min-h-[38px] inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-white/80 dark:bg-slate-900/80 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800 rounded-xl transition-all active:scale-95 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{t('settings.resetDefaultsBtn')}</span>
          </button>

          <button
            type="button"
            data-testid="save-all-settings-top-btn"
            disabled={isSavingSettings}
            onClick={() => handleSaveAllSettings()}
            className="min-h-[38px] inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-indigo-600 via-violet-600 to-emerald-500 hover:from-indigo-500 hover:to-emerald-400 rounded-xl shadow-sm transition-all active:scale-95 cursor-pointer"
          >
            {isSavingSettings ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : settingsSavedBadge ? (
              <Check className="w-3.5 h-3.5" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            <span>{t('settings.saveBtn')}</span>
          </button>
        </div>
      </div>

      {/* Block 1 & Block 2: Profile Overview + Subscription & Limits Card */}
      {activeSubTab !== 'library' && activeSubTab !== 'settings' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Card 1: Profile & Studio Name */}
          <section
            aria-label={t('account.profileSecurityTitle')}
            className="lg:col-span-7 glass-card rounded-3xl p-6 sm:p-7 flex flex-col justify-between space-y-6"
          >
            <div className="space-y-5">
              <div className="flex items-center justify-between gap-2 pb-4 border-b border-slate-200/70 dark:border-slate-800">
                <div>
                  <div className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                    {t('account.supabaseProfilesBadge')}
                  </div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                    {t('account.profileSecurityTitle')}
                  </h2>
                </div>
                <span className="text-xs font-mono text-slate-400">
                  ID: {profile.id.slice(0, 12)}...
                </span>
              </div>

              {/* Studio / User Name Form */}
              <form onSubmit={handleSaveName} className="space-y-3">
                <label
                  htmlFor="account-studio-name-input"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                >
                  {t('account.studioNameLabel')}
                </label>
                <div className="flex flex-col sm:flex-row gap-2.5">
                  <div className="relative flex-1">
                    <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="account-studio-name-input"
                      data-testid="account-studio-name-input"
                      type="text"
                      value={studioName}
                      onChange={(e) => setStudioName(e.target.value)}
                      placeholder={t('account.studioNamePlaceholder')}
                      className="w-full min-h-[42px] pl-10 pr-4 py-2 text-xs sm:text-sm font-semibold bg-slate-50/90 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isSavingName}
                    data-testid="save-profile-name-btn"
                    className="min-h-[42px] inline-flex items-center justify-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-slate-900 dark:bg-indigo-600 hover:bg-indigo-600 dark:hover:bg-indigo-500 rounded-xl transition-all active:scale-95 cursor-pointer shrink-0 disabled:opacity-60"
                  >
                    {isSavingName ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : nameSavedSuccess ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Save className="w-3.5 h-3.5" />
                    )}
                    <span>
                      {nameSavedSuccess
                        ? t('account.saved')
                        : t('account.saveToProfile')}
                    </span>
                  </button>
                </div>
              </form>

              {/* Quick summary of active default standards */}
              <div className="p-4 rounded-2xl bg-slate-50/90 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/70 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block text-[11px]">
                    {t('settings.cardA.interfaceLang')}
                  </span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white mt-0.5 block">
                    {lang.toUpperCase()}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block text-[11px]">
                    {t('settings.cardB.defaultCurrency')}
                  </span>
                  <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 mt-0.5 block">
                    {CURRENCY_CONFIGS[draftSettings.defaultCurrency].label}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block text-[11px]">
                    {t('workspace.ratePerHour')}
                  </span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white mt-0.5 block">
                    {formatMoney(
                      draftSettings.defaultHourlyRate,
                      draftSettings.defaultCurrency
                    )}
                    /ч
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block text-[11px]">
                    {t('settings.cardB.workHoursPerDay')}
                  </span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 block">
                    {draftSettings.workHoursPerDay}h / day
                  </span>
                </div>
              </div>
            </div>

            {/* Admin Access Switcher for Developer Role (visible only to admin account) */}
            {(profile.is_admin ||
              profile.email.toLowerCase() === 'donatas.jn@gmail.com') && (
              <div className="pt-4 border-t border-slate-200/70 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                  <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>
                    Права разработчика (поле{' '}
                    <code className="font-mono">profiles.is_admin</code>):
                  </span>
                </div>
                <button
                  type="button"
                  data-testid="toggle-admin-role-btn"
                  onClick={handleToggleAdminMode}
                  className={`min-h-[34px] px-3.5 py-1 rounded-lg font-mono text-xs font-bold transition-all active:scale-95 cursor-pointer ${
                    profile.is_admin
                      ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {profile.is_admin
                    ? 'is_admin: true (Активен)'
                    : 'is_admin: false (Включить)'}
                </button>
              </div>
            )}
          </section>

          {/* Card 2: Subscription & Audits Quota Progress */}
          <section
            aria-label={t('account.subscriptionTitle')}
            className="lg:col-span-5 glass-card rounded-3xl p-6 sm:p-7 flex flex-col justify-between space-y-6 relative overflow-hidden"
          >
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-12 -top-12 w-44 h-44 rounded-full bg-gradient-to-br from-indigo-500/15 to-emerald-500/15 blur-2xl"
            />

            <div className="space-y-5 relative">
              <div className="flex items-center justify-between gap-2 pb-4 border-b border-slate-200/70 dark:border-slate-800">
                <div>
                  <div className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                    {t('account.quotaBadge')}
                  </div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                    {t('account.subscriptionTitle')}
                  </h2>
                </div>

                <span
                  data-testid="account-plan-badge"
                  className={`px-3 py-1 rounded-xl text-xs font-mono font-bold ${
                    profile.plan === 'pro'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-200/80 dark:bg-slate-800 text-slate-800 dark:text-slate-200'
                  }`}
                >
                  {profile.plan === 'pro' ? 'PRO PLAN' : 'FREE PLAN'}
                </span>
              </div>

              {/* Visual Progress Bar of Used Audits */}
              <div className="p-4 rounded-2xl bg-slate-50/90 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/70 space-y-2.5">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                    {t('account.usedAuditsLabel')}
                  </span>
                  <span
                    data-testid="account-quota-counter"
                    className="text-base font-extrabold font-mono tabular-nums text-slate-900 dark:text-white"
                  >
                    {profile.audits_used} {t('topBar.of')} {profile.audits_limit}
                  </span>
                </div>

                <div className="h-2.5 w-full rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      remainingAudits === 0
                        ? 'bg-red-500'
                        : 'bg-gradient-to-r from-indigo-600 via-violet-500 to-emerald-500'
                    }`}
                    style={{ width: `${Math.max(6, usagePercent)}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                  <span>
                    {t('account.availableNow')}: {remainingAudits}
                  </span>
                  <span>
                    {profile.plan === 'pro'
                      ? t('account.proLimit999')
                      : t('account.freePackage')}
                  </span>
                </div>
              </div>

              {/* Cumulative Protected Budget Metric */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                  <div className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
                    {t('account.protectedBudget')}
                  </div>
                  <div className="text-lg font-extrabold font-mono tabular-nums text-emerald-700 dark:text-emerald-400 mt-0.5">
                    {formatMoney(totalProtectedInActiveCurrency, currency)}
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20">
                  <div className="text-[11px] font-semibold text-indigo-700 dark:text-indigo-300">
                    {t('account.cloudAuditsCount')}
                  </div>
                  <div className="text-lg font-extrabold font-mono tabular-nums text-indigo-700 dark:text-indigo-300 mt-0.5">
                    {cloudAudits.length} {t('account.reportsUnit')}
                  </div>
                </div>
              </div>

              {/* Updated Tariff Grid & Instant Currency Switcher in Personal Account */}
              <div
                data-testid="account-subscription-pricing-box"
                className="p-3.5 rounded-2xl bg-slate-50/90 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/70 space-y-2.5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                    Тарифная сетка ({currency}):
                  </span>
                  {onChangeCurrency && (
                    <div className="flex flex-wrap items-center gap-1">
                      {ALL_CURRENCIES.map((item) => (
                        <button
                          key={item.code}
                          type="button"
                          data-testid={`account-sub-currency-${item.code}`}
                          onClick={() => onChangeCurrency(item.code)}
                          className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold transition-colors cursor-pointer ${
                            currency === item.code
                              ? 'bg-indigo-600 text-white'
                              : 'bg-slate-200/70 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-300'
                          }`}
                        >
                          {item.code}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2 text-center font-mono text-xs">
                  <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700">
                    <div className="text-[10px] text-slate-500">Starter</div>
                    <div
                      data-testid="account-price-starter"
                      className="font-bold text-slate-900 dark:text-white mt-0.5"
                    >
                      {getPlanPriceDisplay('starter', currency)}
                    </div>
                    <div className="text-[9px] text-slate-400">2 в подарок</div>
                  </div>
                  <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-indigo-500/30">
                    <div className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold">
                      Freelance
                    </div>
                    <div
                      data-testid="account-price-freelance"
                      className="font-bold text-slate-900 dark:text-white mt-0.5"
                    >
                      {getPlanPriceDisplay('freelance', currency)}
                    </div>
                    <div className="text-[9px] text-slate-400">25 ауд./мес</div>
                  </div>
                  <div className="p-2 rounded-xl bg-indigo-600/10 border border-indigo-500/40">
                    <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                      Pro / Studio
                    </div>
                    <div
                      data-testid="account-price-agency"
                      className="font-bold text-slate-900 dark:text-white mt-0.5"
                    >
                      {getPlanPriceDisplay('agency', currency)}
                    </div>
                    <div className="text-[9px] text-slate-400">Безлимит</div>
                  </div>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onOpenPricingModal}
              className="w-full min-h-[44px] inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-indigo-600 via-violet-600 to-emerald-500 hover:from-indigo-500 hover:to-emerald-400 rounded-2xl shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <CreditCard className="w-4 h-4" />
              <span>
                {profile.plan === 'pro'
                  ? t('account.manageProBtn')
                  : `${t('account.upgradeProBtn')} (${getPlanPriceDisplay('freelance', currency)} / ${getPlanPriceDisplay('agency', currency)})`}
              </span>
            </button>
          </section>
        </div>
      )}

      {/* ADVANCED SETTINGS & PREFERENCES SECTION (4 LOGICAL CARDS: А, Б, В, Г) */}
      {activeSubTab !== 'library' && (
        <section
          aria-label={t('settings.sectionTitle')}
          data-testid="account-settings-section"
          className="space-y-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                <Settings className="w-3.5 h-3.5" />
                <span>ScopeGuard Legal Preferences · i18n & Defaults</span>
              </div>
              <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white mt-1">
                {t('settings.sectionTitle')}
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-3xl">
                {t('settings.sectionSubtitle')}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
            {/* КАРТОЧКА А: Локализация и регион */}
            <div
              data-testid="settings-card-localization"
              className="glass-card rounded-3xl p-6 sm:p-7 flex flex-col justify-between space-y-5"
            >
              <div className="space-y-4">
                <div className="flex items-start gap-3 pb-4 border-b border-slate-200/70 dark:border-slate-800">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                    <Globe className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      {t('settings.cardA.title')}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {t('settings.cardA.subtitle')}
                    </p>
                  </div>
                </div>

                {/* 1. Interface Language (10 languages) */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="settings-interface-language"
                    className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                  >
                    {t('settings.cardA.interfaceLang')}
                  </label>
                  <select
                    id="settings-interface-language"
                    data-testid="settings-interface-language"
                    value={lang}
                    onChange={(e) =>
                      handleInterfaceLangChangeInSettings(
                        e.target.value as LanguageCode
                      )
                    }
                    className="w-full min-h-[42px] px-3.5 py-2 text-xs sm:text-sm font-semibold bg-slate-900 text-white border border-slate-700 rounded-xl focus:border-indigo-500 focus:outline-none cursor-pointer"
                  >
                    {SUPPORTED_LANGUAGES.map((item) => (
                      <option
                        key={item.code}
                        value={item.code}
                        className="bg-slate-900 text-white"
                      >
                        {item.flag} {item.fullLabel}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. AI Generated Report & Legal Docs Language */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="settings-report-language"
                    className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                  >
                    {t('settings.cardA.reportLang')}
                  </label>
                  <select
                    id="settings-report-language"
                    data-testid="settings-report-language"
                    value={draftSettings.reportLanguage}
                    onChange={(e) =>
                      setDraftSettings((prev) => ({
                        ...prev,
                        reportLanguage: e.target.value as ReportLanguageCode,
                      }))
                    }
                    className="w-full min-h-[42px] px-3.5 py-2 text-xs sm:text-sm font-semibold bg-slate-900 text-white border border-slate-700 rounded-xl focus:border-indigo-500 focus:outline-none cursor-pointer"
                  >
                    <option value="interface" className="bg-slate-900 text-white">
                      🌐 {t('settings.cardA.reportLangSameAsUi')} (
                      {lang.toUpperCase()})
                    </option>
                    {SUPPORTED_LANGUAGES.map((item) => (
                      <option
                        key={item.code}
                        value={item.code}
                        className="bg-slate-900 text-white"
                      >
                        {item.flag} {item.fullLabel}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 3. Date format & Timezone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label
                      htmlFor="settings-date-format"
                      className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                    >
                      {t('settings.cardA.dateFormat')}
                    </label>
                    <select
                      id="settings-date-format"
                      data-testid="settings-date-format"
                      value={draftSettings.dateFormat}
                      onChange={(e) =>
                        setDraftSettings((prev) => ({
                          ...prev,
                          dateFormat: e.target.value as
                            | 'DD.MM.YYYY'
                            | 'MM/DD/YYYY'
                            | 'YYYY-MM-DD',
                        }))
                      }
                      className="w-full min-h-[42px] px-3.5 py-2 text-xs font-mono font-bold bg-slate-900 text-white border border-slate-700 rounded-xl focus:border-indigo-500 focus:outline-none cursor-pointer"
                    >
                      <option value="DD.MM.YYYY">DD.MM.YYYY (12.11.2026)</option>
                      <option value="MM/DD/YYYY">MM/DD/YYYY (11/12/2026)</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD (2026-11-12)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="settings-timezone"
                      className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                    >
                      {t('settings.cardA.timezone')}
                    </label>
                    <select
                      id="settings-timezone"
                      data-testid="settings-timezone"
                      value={draftSettings.timezone}
                      onChange={(e) =>
                        setDraftSettings((prev) => ({
                          ...prev,
                          timezone: e.target.value,
                        }))
                      }
                      className="w-full min-h-[42px] px-3.5 py-2 text-xs font-mono font-bold bg-slate-900 text-white border border-slate-700 rounded-xl focus:border-indigo-500 focus:outline-none cursor-pointer"
                    >
                      {TIMEZONE_OPTIONS.map((tz) => (
                        <option key={tz} value={tz}>
                          {tz}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* КАРТОЧКА Б: Финансовые и рабочие стандарты по умолчанию */}
            <div
              data-testid="settings-card-financial"
              className="glass-card rounded-3xl p-6 sm:p-7 flex flex-col justify-between space-y-5"
            >
              <div className="space-y-4">
                <div className="flex items-start gap-3 pb-4 border-b border-slate-200/70 dark:border-slate-800">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <Coins className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      {t('settings.cardB.title')}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {t('settings.cardB.subtitle')}
                    </p>
                  </div>
                </div>

                {/* 1. Base Currency & 2. Default Studio Hourly Rate */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label
                      htmlFor="settings-default-currency"
                      className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                    >
                      {t('settings.cardB.defaultCurrency')}
                    </label>
                    <select
                      id="settings-default-currency"
                      data-testid="settings-default-currency"
                      value={draftSettings.defaultCurrency}
                      onChange={(e) =>
                        handleDefaultCurrencyChangeInSettings(
                          e.target.value as CurrencyCode
                        )
                      }
                      className="w-full min-h-[42px] px-3.5 py-2 text-xs font-mono font-bold bg-slate-900 text-white border border-slate-700 rounded-xl focus:border-indigo-500 focus:outline-none cursor-pointer"
                    >
                      {ALL_CURRENCIES.map((curr) => (
                        <option key={curr.code} value={curr.code}>
                          {curr.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="settings-default-hourly-rate"
                      className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                    >
                      {t('settings.cardB.defaultHourlyRate')} (
                      {CURRENCY_CONFIGS[draftSettings.defaultCurrency].symbol}/ч)
                    </label>
                    <input
                      id="settings-default-hourly-rate"
                      data-testid="settings-default-hourly-rate"
                      type="number"
                      min={1}
                      step={5}
                      value={draftSettings.defaultHourlyRate}
                      onChange={(e) =>
                        setDraftSettings((prev) => ({
                          ...prev,
                          defaultHourlyRate: Math.max(
                            1,
                            Number(e.target.value) || 0
                          ),
                        }))
                      }
                      className="w-full min-h-[42px] px-3.5 py-2 text-xs sm:text-sm font-mono font-bold bg-slate-50/90 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* 3. Work hours per 1 business day (6h / 7h / 8h) */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {t('settings.cardB.workHoursPerDay')}
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {([6, 7, 8] as WorkHoursPerDayOption[]).map((hoursVal) => {
                      const active = draftSettings.workHoursPerDay === hoursVal;
                      const labelKey =
                        hoursVal === 6
                          ? 'settings.cardB.hours6'
                          : hoursVal === 7
                          ? 'settings.cardB.hours7'
                          : 'settings.cardB.hours8';
                      return (
                        <button
                          key={hoursVal}
                          type="button"
                          data-testid={`settings-work-hours-${hoursVal}`}
                          onClick={() =>
                            setDraftSettings((prev) => ({
                              ...prev,
                              workHoursPerDay: hoursVal,
                            }))
                          }
                          className={`min-h-[40px] flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-mono font-bold rounded-xl border transition-all cursor-pointer ${
                            active
                              ? 'bg-indigo-600 text-white border-indigo-500 shadow-xs'
                              : 'bg-slate-50/90 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-400'
                          }`}
                        >
                          <Clock className="w-3.5 h-3.5" />
                          <span>{t(labelKey)}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 4. Tax Note for Change Order */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="settings-tax-note"
                    className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                  >
                    {t('settings.cardB.taxNote')}
                  </label>
                  <select
                    id="settings-tax-note"
                    data-testid="settings-tax-note"
                    value={draftSettings.taxNote}
                    onChange={(e) =>
                      setDraftSettings((prev) => ({
                        ...prev,
                        taxNote: e.target.value as TaxNoteOption,
                      }))
                    }
                    className="w-full min-h-[42px] px-3.5 py-2 text-xs sm:text-sm font-semibold bg-slate-900 text-white border border-slate-700 rounded-xl focus:border-indigo-500 focus:outline-none cursor-pointer"
                  >
                    <option value="vat_exempt">{t('settings.cardB.taxNoVat')}</option>
                    <option value="vat_20">{t('settings.cardB.taxVat20')}</option>
                    <option value="usn">{t('settings.cardB.taxUsn')}</option>
                    <option value="vat_exclusive">
                      {t('settings.cardB.taxVatExclusive')}
                    </option>
                  </select>
                </div>
              </div>
            </div>

            {/* КАРТОЧКА В: Настройки ИИ-аудитора и юридических шаблонов */}
            <div
              data-testid="settings-card-ai-legal"
              className="glass-card rounded-3xl p-6 sm:p-7 flex flex-col justify-between space-y-5"
            >
              <div className="space-y-4">
                <div className="flex items-start gap-3 pb-4 border-b border-slate-200/70 dark:border-slate-800">
                  <div className="w-10 h-10 rounded-2xl bg-violet-500/15 text-violet-600 dark:text-violet-400 flex items-center justify-center shrink-0">
                    <Bot className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      {t('settings.cardC.title')}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {t('settings.cardC.subtitle')}
                    </p>
                  </div>
                </div>

                {/* 1. Email Tone */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="settings-email-tone"
                    className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                  >
                    {t('settings.cardC.emailTone')}
                  </label>
                  <select
                    id="settings-email-tone"
                    data-testid="settings-email-tone"
                    value={draftSettings.emailTone}
                    onChange={(e) =>
                      setDraftSettings((prev) => ({
                        ...prev,
                        emailTone: e.target.value as EmailToneOption,
                      }))
                    }
                    className="w-full min-h-[42px] px-3.5 py-2 text-xs sm:text-sm font-semibold bg-slate-900 text-white border border-slate-700 rounded-xl focus:border-indigo-500 focus:outline-none cursor-pointer"
                  >
                    <option value="diplomatic">
                      {t('settings.cardC.toneDiplomatic')}
                    </option>
                    <option value="strict_legal">
                      {t('settings.cardC.toneStrict')}
                    </option>
                    <option value="partner_backlog">
                      {t('settings.cardC.tonePartner')}
                    </option>
                  </select>
                </div>

                {/* 2. Scope Creep Detection Strictness */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="settings-strictness"
                    className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                  >
                    {t('settings.cardC.strictness')}
                  </label>
                  <select
                    id="settings-strictness"
                    data-testid="settings-strictness"
                    value={draftSettings.strictness}
                    onChange={(e) =>
                      setDraftSettings((prev) => ({
                        ...prev,
                        strictness: e.target.value as StrictnessOption,
                      }))
                    }
                    className="w-full min-h-[42px] px-3.5 py-2 text-xs sm:text-sm font-semibold bg-slate-900 text-white border border-slate-700 rounded-xl focus:border-indigo-500 focus:outline-none cursor-pointer"
                  >
                    <option value="standard">
                      {t('settings.cardC.strictStandard')}
                    </option>
                    <option value="meticulous">
                      {t('settings.cardC.strictMeticulous')}
                    </option>
                    <option value="critical_only">
                      {t('settings.cardC.strictCritical')}
                    </option>
                  </select>
                </div>

                {/* 3. Default Signature for Emails & PDF */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="settings-default-signature"
                    className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                  >
                    {t('settings.cardC.defaultSignature')}
                  </label>
                  <textarea
                    id="settings-default-signature"
                    data-testid="settings-default-signature"
                    rows={3}
                    value={draftSettings.defaultSignature}
                    onChange={(e) =>
                      setDraftSettings((prev) => ({
                        ...prev,
                        defaultSignature: e.target.value,
                      }))
                    }
                    placeholder={t('settings.cardC.signaturePlaceholder')}
                    className="w-full px-3.5 py-2.5 text-xs font-medium bg-slate-50/90 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none resize-none"
                  />
                </div>
              </div>
            </div>

            {/* КАРТОЧКА Г: Безопасность, уведомления и данные */}
            <div
              data-testid="settings-card-security-data"
              className="glass-card rounded-3xl p-6 sm:p-7 flex flex-col justify-between space-y-5"
            >
              <div className="space-y-4">
                <div className="flex items-start gap-3 pb-4 border-b border-slate-200/70 dark:border-slate-800">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                    <Bell className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      {t('settings.cardD.title')}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {t('settings.cardD.subtitle')}
                    </p>
                  </div>
                </div>

                {/* Toggles: Email Copy, Quota Alert, Auto-save Drafts */}
                <div className="space-y-2.5">
                  <label className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-slate-50/90 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/70 cursor-pointer">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                      {t('settings.cardD.emailReportCopy')}
                    </span>
                    <input
                      type="checkbox"
                      data-testid="toggle-email-report-copy"
                      checked={draftSettings.emailReportCopy}
                      onChange={(e) =>
                        setDraftSettings((prev) => ({
                          ...prev,
                          emailReportCopy: e.target.checked,
                        }))
                      }
                      className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-slate-50/90 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/70 cursor-pointer">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                      {t('settings.cardD.emailQuotaAlert')}
                    </span>
                    <input
                      type="checkbox"
                      data-testid="toggle-email-quota-alert"
                      checked={draftSettings.emailQuotaAlert}
                      onChange={(e) =>
                        setDraftSettings((prev) => ({
                          ...prev,
                          emailQuotaAlert: e.target.checked,
                        }))
                      }
                      className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-slate-50/90 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/70 cursor-pointer">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                      {t('settings.cardD.autoSaveDrafts')}
                    </span>
                    <input
                      type="checkbox"
                      data-testid="toggle-autosave-drafts"
                      checked={draftSettings.autoSaveDrafts}
                      onChange={(e) =>
                        setDraftSettings((prev) => ({
                          ...prev,
                          autoSaveDrafts: e.target.checked,
                        }))
                      }
                      className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
                    />
                  </label>
                </div>

                {/* Password Change & 6-Digit Email Code */}
                <form
                  onSubmit={handleSavePassword}
                  className="pt-2 border-t border-slate-200/70 dark:border-slate-800 space-y-2.5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                      <KeyRound className="w-3.5 h-3.5 text-indigo-500" />
                      <span>{t('account.changePasswordTitle')}</span>
                    </span>

                    <button
                      type="button"
                      data-testid="send-verification-otp-btn"
                      disabled={isSendingOtp}
                      onClick={handleSendVerificationOtp}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 rounded-lg transition-colors cursor-pointer"
                    >
                      {isSendingOtp ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : otpSentSuccess ? (
                        <Check className="w-3 h-3 text-emerald-500" />
                      ) : (
                        <Send className="w-3 h-3" />
                      )}
                      <span>{t('settings.cardD.sendOtpBtn')}</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="password"
                      aria-label={t('account.newPasswordPlaceholder')}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder={t('account.newPasswordPlaceholder')}
                      className="min-h-[38px] px-3 py-1.5 text-xs bg-slate-50/90 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none"
                    />
                    <div className="flex gap-2">
                      <input
                        type="password"
                        aria-label={t('account.confirmPasswordPlaceholder')}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder={t('account.confirmPasswordPlaceholder')}
                        className="flex-1 min-h-[38px] px-3 py-1.5 text-xs bg-slate-50/90 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none"
                      />
                      <button
                        type="submit"
                        disabled={isSavingPassword}
                        className="min-h-[38px] px-3.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-all active:scale-95 cursor-pointer whitespace-nowrap shrink-0"
                      >
                        {t('account.updatePasswordBtn')}
                      </button>
                    </div>
                  </div>

                  {passwordStatus && (
                    <p
                      className={`text-xs font-medium ${
                        passwordStatus.type === 'success'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}
                    >
                      {passwordStatus.text}
                    </p>
                  )}
                </form>

                {/* Data Export Buttons (JSON / CSV) */}
                <div className="pt-2 border-t border-slate-200/70 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    data-testid="export-all-reports-json-btn"
                    onClick={handleExportJson}
                    className="min-h-[40px] inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100/90 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-600 dark:hover:text-indigo-300 border border-slate-200/80 dark:border-slate-700 rounded-xl transition-all active:scale-95 cursor-pointer"
                  >
                    <FileJson className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                    <span className="truncate">
                      {t('settings.cardD.exportJsonBtn')}
                    </span>
                  </button>

                  <button
                    type="button"
                    data-testid="export-all-reports-csv-btn"
                    onClick={handleExportCsv}
                    className="min-h-[40px] inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100/90 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-600 dark:hover:text-emerald-300 border border-slate-200/80 dark:border-slate-700 rounded-xl transition-all active:scale-95 cursor-pointer"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span className="truncate">
                      {t('settings.cardD.exportCsvBtn')}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Primary Save All Settings Action Bar */}
          <div className="glass-card rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border border-indigo-500/25">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                <Download className="w-4 h-4" />
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-300">
                <span className="font-bold text-slate-900 dark:text-white block">
                  {t('settings.sectionTitle')}
                </span>
                <span>{t('settings.savedToastDesc')}</span>
              </div>
            </div>

            <button
              type="button"
              data-testid="save-all-settings-btn"
              disabled={isSavingSettings}
              onClick={() => handleSaveAllSettings()}
              className="min-h-[44px] inline-flex items-center justify-center gap-2 px-6 py-2.5 text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-indigo-600 via-violet-600 to-emerald-500 hover:from-indigo-500 hover:to-emerald-400 rounded-xl shadow-md transition-all active:scale-95 cursor-pointer shrink-0"
            >
              {isSavingSettings ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : settingsSavedBadge ? (
                <Check className="w-4 h-4" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>{t('settings.saveBtn')}</span>
            </button>
          </div>
        </section>
      )}

      {/* Block 3: Cloud Library of Audits (Table `audits`) */}
      {activeSubTab !== 'settings' && (
        <section
          aria-label={t('account.cloudLibraryTitle')}
          className="glass-card rounded-3xl p-6 sm:p-8 space-y-5"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200/70 dark:border-slate-800">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                <FolderClock className="w-3.5 h-3.5" />
                <span>{t('account.cloudLibraryBadge')}</span>
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
                {t('account.cloudLibraryTitle')}
              </h2>
            </div>

            <span className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
              {t('account.totalSaved')}: {cloudAudits.length}
            </span>
          </div>

          {cloudAudits.length === 0 ? (
            <div className="py-12 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl space-y-3">
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                {t('account.emptyLibraryTitle')}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                {t('account.emptyLibraryDesc')}
              </p>
              <button
                type="button"
                onClick={onStartNewAudit}
                className="min-h-[40px] inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-all active:scale-95 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{t('account.runFirstAuditBtn')}</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {cloudAudits.map((audit) => {
                const rateInCurr = convertHourlyRate(
                  audit.hourly_rate || 4500,
                  audit.currency || 'RUB',
                  currency
                );
                const budgetInCurr = audit.total_hours * rateInCurr;

                return (
                  <article
                    key={audit.id}
                    data-testid="cloud-audit-card"
                    className="p-5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 hover:border-indigo-400/70 transition-all flex flex-col justify-between gap-4"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                        <span>
                          {formatDateByPreference(
                            audit.audit_date,
                            draftSettings.dateFormat
                          )}
                        </span>
                        <span>+{audit.total_hours} h</span>
                      </div>

                      <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                        {audit.project_name}
                      </h3>

                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
                          <div className="text-[10px] text-slate-500 dark:text-slate-400">
                            {t('workspace.foundItems')}
                          </div>
                          <div className="text-sm font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-0.5">
                            {audit.items_count} {t('workspace.itemsUnit')}
                          </div>
                        </div>

                        <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                          <div className="text-[10px] text-emerald-700 dark:text-emerald-300">
                            {t('account.protectedBudget')}
                          </div>
                          <div className="text-sm font-bold font-mono tabular-nums text-emerald-700 dark:text-emerald-400 mt-0.5">
                            +{formatMoney(budgetInCurr, currency)}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-200/70 dark:border-slate-800 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => onOpenCloudAudit(audit)}
                        className="flex-1 min-h-[38px] inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-slate-900 dark:bg-indigo-600 hover:bg-indigo-600 dark:hover:bg-indigo-500 rounded-xl transition-all active:scale-95 cursor-pointer"
                      >
                        <span>{t('account.openInWorkspaceBtn')}</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => onDeleteCloudAudit(audit.id)}
                        aria-label={`Delete ${audit.project_name}`}
                        className="min-h-[38px] min-w-[38px] inline-flex items-center justify-center p-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 rounded-xl transition-all active:scale-95 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      )}
    </div>
  );
};
