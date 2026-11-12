import React, { useState } from 'react';
import {
  ArrowUpRight,
  Building2,
  Calendar,
  Check,
  CreditCard,
  FolderClock,
  KeyRound,
  Loader2,
  LogOut,
  Mail,
  Plus,
  Save,
  ShieldCheck,
  Sparkles,
  Trash2,
} from 'lucide-react';
import {
  getInitials,
  getRemainingUserAudits,
  toggleProfileAdminAccess,
  updateAccountPassword,
  updateProfileStudioName,
  type CloudAuditRecord,
  type UserProfile,
} from '../lib/supabase';
import {
  convertHourlyRate,
  formatMoney,
  type CurrencyCode,
} from '../utils/scopeAnalyzer';

interface AccountWorkspaceViewProps {
  profile: UserProfile;
  cloudAudits: CloudAuditRecord[];
  currency: CurrencyCode;
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

export const AccountWorkspaceView: React.FC<AccountWorkspaceViewProps> = ({
  profile,
  cloudAudits,
  currency,
  onProfileUpdated,
  onOpenCloudAudit,
  onDeleteCloudAudit,
  onOpenPricingModal,
  onStartNewAudit,
  onOpenAdminPanel,
  onSignOut,
  onNotifyToast,
}) => {
  const [studioName, setStudioName] = useState(profile.full_name);
  const [isSavingName, setIsSavingName] = useState(false);
  const [nameSavedSuccess, setNameSavedSuccess] = useState(false);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [passwordStatus, setPasswordStatus] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

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
        'Профиль сохранен в Supabase',
        `Имя / название студии обновлено на «${updated.full_name}».`,
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
        text: 'Пароль должен содержать не менее 6 символов.',
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordStatus({
        type: 'error',
        text: 'Введенные пароли не совпадают.',
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
        onNotifyToast('Пароль обновлен', res.message, 'success');
      }
    } finally {
      setIsSavingPassword(false);
    }
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
                <span>{profile.plan === 'pro' ? 'Тариф PRO' : 'Тариф FREE'}</span>
              </span>

              {profile.is_admin && (
                <button
                  type="button"
                  onClick={onOpenAdminPanel}
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25 transition-colors cursor-pointer"
                >
                  <ShieldCheck className="w-3 h-3" />
                  <span>Администратор · Кабинет разработчика →</span>
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
                Регистрация:{' '}
                {new Date(profile.created_at).toLocaleDateString('ru-RU')}
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
            <span>Новый аудит ТЗ</span>
          </button>

          <button
            type="button"
            data-testid="account-signout-btn"
            onClick={onSignOut}
            className="min-h-[42px] inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100/90 dark:bg-slate-800 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-400 rounded-xl border border-slate-200/80 dark:border-slate-700 transition-all active:scale-95 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Выйти</span>
          </button>
        </div>
      </div>

      {/* Block 1 & Block 2: Profile Settings + Subscription & Limits Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Card 1: Profile & Security Settings */}
        <section
          aria-label="Карточка профиля и аккаунта"
          className="lg:col-span-7 glass-card rounded-3xl p-6 sm:p-7 flex flex-col justify-between space-y-6"
        >
          <div className="space-y-5">
            <div className="flex items-center justify-between gap-2 pb-4 border-b border-slate-200/70 dark:border-slate-800">
              <div>
                <div className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                  Таблица Supabase · profiles
                </div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                  Профиль и настройки безопасности
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
                Имя / Название студии (отображается в шапке Change Order)
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
                    placeholder="Название вашего агентства или ФИО"
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
                    {nameSavedSuccess ? 'Сохранено' : 'Сохранить в профиль'}
                  </span>
                </button>
              </div>
            </form>

            {/* Password Change Form */}
            <form
              onSubmit={handleSavePassword}
              className="pt-4 border-t border-slate-200/70 dark:border-slate-800 space-y-3"
            >
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                <KeyRound className="w-3.5 h-3.5 text-indigo-500" />
                <span>Смена пароля аккаунта</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <input
                  type="password"
                  aria-label="Новый пароль"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Новый пароль (мин. 6 симв.)"
                  className="min-h-[40px] px-3.5 py-2 text-xs bg-slate-50/90 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none"
                />
                <div className="flex gap-2">
                  <input
                    type="password"
                    aria-label="Подтвердите новый пароль"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Повторите пароль"
                    className="flex-1 min-h-[40px] px-3.5 py-2 text-xs bg-slate-50/90 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={isSavingPassword}
                    className="min-h-[40px] px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-all active:scale-95 cursor-pointer whitespace-nowrap shrink-0"
                  >
                    Обновить
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
          aria-label="Карточка подписки и лимитов"
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
                  Квота проверок и тариф
                </div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                  Подписка и лимиты аудитов
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
                  Израсходовано проверок ТЗ
                </span>
                <span
                  data-testid="account-quota-counter"
                  className="text-base font-extrabold font-mono tabular-nums text-slate-900 dark:text-white"
                >
                  {profile.audits_used} из {profile.audits_limit}
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
                <span>Доступно сейчас: {remainingAudits} пров.</span>
                <span>
                  {profile.plan === 'pro'
                    ? 'Расширенный лимит 999'
                    : 'Бесплатный пакет'}
                </span>
              </div>
            </div>

            {/* Cumulative Protected Budget Metric */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                <div className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
                  Защищенный бюджет
                </div>
                <div className="text-lg font-extrabold font-mono tabular-nums text-emerald-700 dark:text-emerald-400 mt-0.5">
                  {formatMoney(totalProtectedInActiveCurrency, currency)}
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20">
                <div className="text-[11px] font-semibold text-indigo-700 dark:text-indigo-300">
                  Аудитов в облаке
                </div>
                <div className="text-lg font-extrabold font-mono tabular-nums text-indigo-700 dark:text-indigo-300 mt-0.5">
                  {cloudAudits.length} отчетов
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
                ? 'Управление тарифом Pro и реквизитами'
                : 'Перейти на тариф Pro (999 проверок + White-Label)'}
            </span>
          </button>
        </section>
      </div>

      {/* Block 3: Cloud Library of Audits (Table `audits`) */}
      <section
        aria-label="Облачная Библиотека работ"
        className="glass-card rounded-3xl p-6 sm:p-8 space-y-5"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200/70 dark:border-slate-800">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
              <FolderClock className="w-3.5 h-3.5" />
              <span>Облачное хранилище Supabase · таблица audits</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
              Библиотека работ (История аудитов)
            </h2>
          </div>

          <span className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
            Всего сохранено: {cloudAudits.length}
          </span>
        </div>

        {cloudAudits.length === 0 ? (
          <div className="py-12 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl space-y-3">
            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
              В вашей облачной библиотеке пока нет сохраненных аудитов
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              Запустите проверку ТЗ и расшифровки встречи в рабочем кабинете — результат автоматически сохранится в таблицу Supabase audits.
            </p>
            <button
              type="button"
              onClick={onStartNewAudit}
              className="min-h-[40px] inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-all active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Провести первый аудит</span>
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
                      <span>Дата: {audit.audit_date}</span>
                      <span>+{audit.total_hours} нормо-ч</span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                      {audit.project_name}
                    </h3>

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
                        <div className="text-[10px] text-slate-500 dark:text-slate-400">
                          Найдено доработок
                        </div>
                        <div className="text-sm font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-0.5">
                          {audit.items_count} поз. вне ТЗ
                        </div>
                      </div>

                      <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                        <div className="text-[10px] text-emerald-700 dark:text-emerald-300">
                          Защищенный бюджет
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
                      <span>Открыть отчет в кабинете</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => onDeleteCloudAudit(audit.id)}
                      aria-label={`Удалить аудит ${audit.project_name}`}
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
    </div>
  );
};
