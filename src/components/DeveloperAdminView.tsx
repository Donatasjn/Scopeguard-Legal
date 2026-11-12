import React, { useEffect, useState } from 'react';
import {
  Activity,
  ArrowUpRight,
  BarChart3,
  Eye,
  FolderClock,
  PlusCircle,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
  X,
} from 'lucide-react';
import {
  adminAddFiveAuditsToUserInDb,
  adminToggleUserPlanInDb,
  fetchAllActivityLogsForAdmin,
  fetchAllAuditsForAdmin,
  fetchAllProfilesForAdmin,
  getInitials,
  type ActivityLogRecord,
  type CloudAuditRecord,
  type UserProfile,
} from '../lib/supabase';
import {
  convertHourlyRate,
  formatMoney,
  type CurrencyCode,
} from '../utils/scopeAnalyzer';

interface DeveloperAdminViewProps {
  currentAdmin: UserProfile;
  currency: CurrencyCode;
  onCurrentAdminUpdated: (updated: UserProfile) => void;
  onOpenAuditInWorkspace: (audit: CloudAuditRecord) => void;
  onNotifyToast: (
    title: string,
    description?: string,
    variant?: 'success' | 'info' | 'document'
  ) => void;
}

type AdminSubTab = 'overview' | 'users' | 'logs';

export const DeveloperAdminView: React.FC<DeveloperAdminViewProps> = ({
  currentAdmin,
  currency,
  onCurrentAdminUpdated,
  onOpenAuditInWorkspace,
  onNotifyToast,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<AdminSubTab>('overview');
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [allAudits, setAllAudits] = useState<CloudAuditRecord[]>([]);
  const [logs, setLogs] = useState<ActivityLogRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [logEmailFilter, setLogEmailFilter] = useState('');
  const [inspectedUser, setInspectedUser] = useState<UserProfile | null>(null);

  const loadAdminData = async () => {
    setIsLoading(true);
    try {
      const [loadedProfiles, loadedAudits, loadedLogs] = await Promise.all([
        fetchAllProfilesForAdmin(),
        fetchAllAuditsForAdmin(),
        fetchAllActivityLogsForAdmin(),
      ]);
      setProfiles(loadedProfiles);
      setAllAudits(loadedAudits);
      setLogs(loadedLogs);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const totalUsersCount = profiles.length;
  const proUsersCount = profiles.filter((p) => p.plan === 'pro').length;
  const totalAuditsConducted = Math.max(
    allAudits.length,
    profiles.reduce((acc, p) => acc + p.audits_used, 0)
  );

  const totalProtectedBudgetAll = allAudits.reduce((sum, audit) => {
    const rateInCurr = convertHourlyRate(
      audit.hourly_rate || 4500,
      audit.currency || 'RUB',
      currency
    );
    return sum + audit.total_hours * rateInCurr;
  }, 0);

  const filteredProfiles = profiles.filter((p) => {
    const q = userSearchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      p.email.toLowerCase().includes(q) ||
      p.full_name.toLowerCase().includes(q) ||
      p.plan.toLowerCase().includes(q)
    );
  });

  const filteredLogs = logs.filter((l) => {
    const q = logEmailFilter.trim().toLowerCase();
    if (!q) return true;
    return (
      l.user_email.toLowerCase().includes(q) ||
      l.action.toLowerCase().includes(q) ||
      l.details.toLowerCase().includes(q)
    );
  });

  const handleToggleUserPlan = async (target: UserProfile) => {
    const updated = await adminToggleUserPlanInDb(target, currentAdmin);
    setProfiles((prev) =>
      prev.map((item) => (item.id === updated.id ? updated : item))
    );
    if (updated.id === currentAdmin.id) {
      onCurrentAdminUpdated(updated);
    }
    const freshLogs = await fetchAllActivityLogsForAdmin();
    setLogs(freshLogs);
    onNotifyToast(
      `Тариф пользователя ${updated.email} изменен`,
      `Установлен статус ${updated.plan.toUpperCase()} (лимит: ${updated.audits_limit} проверок).`,
      'success'
    );
  };

  const handleAddFiveChecks = async (target: UserProfile) => {
    const updated = await adminAddFiveAuditsToUserInDb(target, currentAdmin);
    setProfiles((prev) =>
      prev.map((item) => (item.id === updated.id ? updated : item))
    );
    if (updated.id === currentAdmin.id) {
      onCurrentAdminUpdated(updated);
    }
    const freshLogs = await fetchAllActivityLogsForAdmin();
    setLogs(freshLogs);
    onNotifyToast(
      `Начислено +5 проверок`,
      `Новый лимит для ${updated.email}: ${updated.audits_limit} проверок.`,
      'info'
    );
  };

  const inspectedUserAudits = inspectedUser
    ? allAudits.filter(
        (a) =>
          a.user_id === inspectedUser.id ||
          (a.user_email &&
            a.user_email.toLowerCase() === inspectedUser.email.toLowerCase())
      )
    : [];

  return (
    <div
      data-testid="developer-admin-view"
      className="space-y-8 animate-tab-fade"
    >
      {/* Top Developer Console Header */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 relative overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-12 -top-12 w-56 h-56 rounded-full bg-gradient-to-br from-indigo-500/15 via-violet-500/15 to-emerald-500/15 blur-2xl"
        />

        <div className="space-y-1.5 relative">
          <div className="inline-flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400">
            <ShieldCheck className="w-4 h-4" />
            <span>Supabase Admin Console · Доступ is_admin === true</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Кабинет разработчика и управление платформой
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Мониторинг метрик продукта, управление тарифами пользователей в таблице{' '}
            <code className="font-mono">profiles</code> и аудит событий{' '}
            <code className="font-mono">activity_logs</code>.
          </p>
        </div>

        {/* 3 Smooth Sub-Tabs Switcher */}
        <div className="flex flex-wrap items-center gap-2 relative shrink-0">
          <div
            role="tablist"
            aria-label="Разделы кабинета разработчика"
            className="flex flex-wrap items-center gap-1 p-1.5 rounded-2xl bg-slate-100/90 dark:bg-slate-800/90 border border-slate-200/70 dark:border-slate-700"
          >
            {(
              [
                {
                  id: 'overview',
                  label: 'Обзор и метрики',
                  icon: BarChart3,
                },
                {
                  id: 'users',
                  label: `Пользователи (${totalUsersCount})`,
                  icon: Users,
                },
                {
                  id: 'logs',
                  label: `Лента действий (${logs.length})`,
                  icon: Activity,
                },
              ] as const
            ).map((tab) => {
              const Icon = tab.icon;
              const active = activeSubTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  data-testid={`admin-subtab-${tab.id}`}
                  onClick={() => setActiveSubTab(tab.id)}
                  className={`min-h-[38px] inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold rounded-xl transition-all active:scale-95 cursor-pointer whitespace-nowrap ${
                    active
                      ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
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
            onClick={loadAdminData}
            aria-label="Обновить данные из Supabase"
            title="Синхронизировать с Supabase"
            className="min-h-[40px] min-w-[40px] inline-flex items-center justify-center p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-indigo-600 transition-all active:scale-95 cursor-pointer"
          >
            <RefreshCw
              className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`}
            />
          </button>
        </div>
      </div>

      {/* TAB 1: OVERVIEW & KPI METRICS */}
      {activeSubTab === 'overview' && (
        <div className="space-y-6 animate-tab-fade">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="glass-card card-hover-lift rounded-3xl p-6">
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Всего пользователей (profiles)
              </div>
              <div
                data-testid="admin-kpi-total-users"
                className="text-3xl font-extrabold font-mono tabular-nums text-slate-900 dark:text-white mt-2"
              >
                {totalUsersCount}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
                Активных аккаунтов в Supabase
              </div>
            </div>

            <div className="glass-card card-hover-lift rounded-3xl p-6">
              <div className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                Пользователей на тарифе Pro
              </div>
              <div
                data-testid="admin-kpi-pro-users"
                className="text-3xl font-extrabold font-mono tabular-nums text-indigo-600 dark:text-indigo-400 mt-2"
              >
                {proUsersCount}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 font-mono tabular-nums">
                Конверсия в Pro:{' '}
                {totalUsersCount > 0
                  ? Math.round((proUsersCount / totalUsersCount) * 100)
                  : 0}
                %
              </div>
            </div>

            <div className="glass-card card-hover-lift rounded-3xl p-6">
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Всего проведено аудитов
              </div>
              <div
                data-testid="admin-kpi-total-audits"
                className="text-3xl font-extrabold font-mono tabular-nums text-slate-900 dark:text-white mt-2"
              >
                {totalAuditsConducted}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
                Сохранено отчетов в audits: {allAudits.length}
              </div>
            </div>

            <div className="glass-card card-hover-lift rounded-3xl p-6 border-emerald-500/30">
              <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                Общая сумма защищенных бюджетов
              </div>
              <div
                data-testid="admin-kpi-saved-budget"
                className="text-2xl sm:text-3xl font-extrabold font-mono tabular-nums text-emerald-600 dark:text-emerald-400 mt-2"
              >
                {formatMoney(totalProtectedBudgetAll, currency)}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
                Суммарный эффект Change Order
              </div>
            </div>
          </div>

          {/* Quick Overview Split: Recent Users & Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <section className="glass-card rounded-3xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Недавние аккаунты студий и юристов
                </h2>
                <button
                  type="button"
                  onClick={() => setActiveSubTab('users')}
                  className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                >
                  Все пользователи →
                </button>
              </div>

              <div className="divide-y divide-slate-200/70 dark:divide-slate-800">
                {profiles.slice(0, 4).map((user) => (
                  <div
                    key={user.id}
                    className="py-3 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
                        {getInitials(user.full_name || user.email)}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {user.full_name}
                        </div>
                        <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 truncate">
                          {user.email}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs font-mono tabular-nums text-slate-600 dark:text-slate-300">
                        {user.audits_used}/{user.audits_limit}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-lg text-[11px] font-mono font-bold ${
                          user.plan === 'pro'
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {user.plan.toUpperCase()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="glass-card rounded-3xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Последние события (activity_logs)
                </h2>
                <button
                  type="button"
                  onClick={() => setActiveSubTab('logs')}
                  className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                >
                  Открыть весь журнал →
                </button>
              </div>

              <div className="divide-y divide-slate-200/70 dark:divide-slate-800">
                {logs.slice(0, 4).map((log) => (
                  <div key={log.id} className="py-3 space-y-1">
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="font-bold text-slate-900 dark:text-white">
                        {log.action}
                      </span>
                      <span className="font-mono text-[11px] text-slate-400">
                        {log.user_email}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 truncate">
                      {log.details}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      )}

      {/* TAB 2: INTERACTIVE USERS TABLE */}
      {activeSubTab === 'users' && (
        <section
          aria-label="Таблица зарегистрированных пользователей"
          className="glass-card rounded-3xl p-6 sm:p-8 space-y-5 animate-tab-fade"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/70 dark:border-slate-800">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Зарегистрированные пользователи (profiles)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Мгновенное переключение тарифа Free ↔ Pro (с лимитом 999), начисление +5 проверок и просмотр аудитов.
              </p>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="search"
                aria-label="Поиск пользователей по Email или имени"
                data-testid="admin-users-search"
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
                placeholder="Поиск по Email или студии..."
                className="w-full min-h-[40px] pl-9 pr-4 py-1.5 text-xs bg-slate-50/90 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200/80 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400">
                  <th className="py-3 pr-4">Пользователь / Студия</th>
                  <th className="py-3 px-3">Дата регистрации</th>
                  <th className="py-3 px-3">Тариф</th>
                  <th className="py-3 px-3">Использовано проверок</th>
                  <th className="py-3 pl-3 text-right">Быстрые действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/70 dark:divide-slate-800 text-xs">
                {filteredProfiles.map((user) => {
                  const pct = Math.min(
                    100,
                    Math.round(
                      (user.audits_used / Math.max(1, user.audits_limit)) * 100
                    )
                  );
                  return (
                    <tr
                      key={user.id}
                      data-testid={`admin-user-row-${user.email}`}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-4 pr-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                            {getInitials(user.full_name || user.email)}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                              <span>{user.full_name}</span>
                              {user.is_admin && (
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                                  ADMIN
                                </span>
                              )}
                            </div>
                            <div className="font-mono text-slate-500 dark:text-slate-400 mt-0.5">
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-3 font-mono tabular-nums text-slate-600 dark:text-slate-300 whitespace-nowrap">
                        {new Date(user.created_at).toLocaleDateString('ru-RU')}
                      </td>

                      <td className="py-4 px-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold ${
                            user.plan === 'pro'
                              ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white'
                              : 'bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <Sparkles className="w-3 h-3" />
                          <span>{user.plan.toUpperCase()}</span>
                        </span>
                      </td>

                      <td className="py-4 px-3 min-w-[160px]">
                        <div className="flex items-center justify-between font-mono tabular-nums text-xs mb-1">
                          <span className="font-bold text-slate-900 dark:text-white">
                            {user.audits_used} / {user.audits_limit}
                          </span>
                          <span className="text-slate-400">{pct}%</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-indigo-600 to-emerald-500"
                            style={{ width: `${Math.max(5, pct)}%` }}
                          />
                        </div>
                      </td>

                      <td className="py-4 pl-3 text-right whitespace-nowrap">
                        <div className="inline-flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleToggleUserPlan(user)}
                            className="min-h-[34px] px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-600 hover:text-white border border-indigo-200/70 dark:border-indigo-800 transition-all active:scale-95 cursor-pointer"
                          >
                            {user.plan === 'pro' ? 'Сделать Free' : 'Включить Pro (999)'}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleAddFiveChecks(user)}
                            className="min-h-[34px] inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500 hover:text-white border border-emerald-500/25 transition-all active:scale-95 cursor-pointer"
                          >
                            <PlusCircle className="w-3.5 h-3.5" />
                            <span>+5 проверок</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setInspectedUser(user)}
                            className="min-h-[34px] inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-95 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Аудиты</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* TAB 3: CHRONOLOGICAL ACTIVITY LOGS */}
      {activeSubTab === 'logs' && (
        <section
          aria-label="Лента действий пользователей"
          className="glass-card rounded-3xl p-6 sm:p-8 space-y-5 animate-tab-fade"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/70 dark:border-slate-800">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Хронологический журнал событий (activity_logs)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Автоматическая фиксация запусков аудита, входов в аккаунт, скачиваний PDF и копирования писем клиенту.
              </p>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="search"
                aria-label="Фильтр логов по Email"
                data-testid="admin-logs-email-filter"
                value={logEmailFilter}
                onChange={(e) => setLogEmailFilter(e.target.value)}
                placeholder="Фильтр по Email или действию..."
                className="w-full min-h-[40px] pl-9 pr-4 py-1.5 text-xs bg-slate-50/90 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="divide-y divide-slate-200/70 dark:divide-slate-800">
            {filteredLogs.length === 0 ? (
              <div className="py-10 text-center text-xs text-slate-500">
                Событий по фильтру «{logEmailFilter}» не найдено.
              </div>
            ) : (
              filteredLogs.map((entry) => (
                <div
                  key={entry.id}
                  data-testid="admin-activity-log-row"
                  className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50/60 dark:hover:bg-slate-800/30 px-3 rounded-xl transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20">
                        {entry.action}
                      </span>
                      <span className="text-xs font-mono font-semibold text-slate-800 dark:text-slate-200">
                        {entry.user_email}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {entry.details}
                    </p>
                  </div>

                  <div className="text-[11px] font-mono tabular-nums text-slate-400 shrink-0">
                    {new Date(entry.created_at).toLocaleString('ru-RU')}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      )}

      {/* MODAL: INSPECT SELECTED USER'S AUDITS */}
      {inspectedUser && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="inspect-user-audits-title"
          onClick={() => setInspectedUser(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xl overflow-y-auto animate-modal-backdrop"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl rounded-3xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-2xl animate-modal-content space-y-5"
          >
            <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-200/70 dark:border-slate-800">
              <div>
                <div className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                  История проверок пользователя
                </div>
                <h3
                  id="inspect-user-audits-title"
                  className="text-lg font-bold text-slate-900 dark:text-white mt-0.5"
                >
                  {inspectedUser.full_name} ({inspectedUser.email})
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setInspectedUser(null)}
                aria-label="Закрыть окно аудитов пользователя"
                className="min-h-[38px] min-w-[38px] inline-flex items-center justify-center p-2 rounded-full text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {inspectedUserAudits.length === 0 ? (
              <div className="py-10 text-center text-xs text-slate-500 dark:text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                <FolderClock className="w-6 h-6 text-slate-400 mx-auto mb-2" />
                У выбранного пользователя пока нет сохраненных отчетов в таблице audits.
              </div>
            ) : (
              <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                {inspectedUserAudits.map((audit) => {
                  const rateInCurr = convertHourlyRate(
                    audit.hourly_rate || 4500,
                    audit.currency || 'RUB',
                    currency
                  );
                  const budgetInCurr = audit.total_hours * rateInCurr;

                  return (
                    <div
                      key={audit.id}
                      className="p-4 rounded-2xl bg-slate-50/90 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="text-xs font-mono text-slate-400">
                          {audit.audit_date} · +{audit.total_hours} нормо-ч ·{' '}
                          {audit.items_count} поз.
                        </div>
                        <div className="text-sm font-bold text-slate-900 dark:text-white">
                          {audit.project_name}
                        </div>
                        <div className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          Защищенный бюджет: +{formatMoney(budgetInCurr, currency)}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setInspectedUser(null);
                          onOpenAuditInWorkspace(audit);
                        }}
                        className="min-h-[38px] inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-slate-900 dark:bg-indigo-600 hover:bg-indigo-600 rounded-xl transition-all active:scale-95 cursor-pointer shrink-0"
                      >
                        <span>Открыть в кабинете</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
