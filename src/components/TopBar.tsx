import React, { useState } from 'react';
import {
  CreditCard,
  FileSearch,
  FolderClock,
  Menu,
  Moon,
  ShieldCheck,
  Sun,
  X,
} from 'lucide-react';
import {
  CURRENCY_CONFIGS,
  formatQuotaBadgeText,
  getRemainingAudits,
  type ActiveNavTab,
  type CurrencyCode,
  type FreemiumState,
} from '../utils/scopeAnalyzer';

export type ActiveSection = 'audit' | 'email' | 'change-order' | 'json';

interface NavigationHubProps {
  activeTab: ActiveNavTab;
  onSelectTab: (tab: ActiveNavTab) => void;
  activeSection: ActiveSection;
  onSelectSection: (section: ActiveSection) => void;
  historyCount: number;
  freemiumState: FreemiumState;
  currency: CurrencyCode;
  onChangeCurrency: (currency: CurrencyCode) => void;
  isDark: boolean;
  onToggleTheme: () => void;
  onOpenPricingModal: () => void;
}

const CURRENCY_ORDER: CurrencyCode[] = ['USD', 'RUB', 'EUR', 'KZT'];

export const TopBar: React.FC<NavigationHubProps> = ({
  activeTab,
  onSelectTab,
  activeSection,
  onSelectSection,
  historyCount,
  freemiumState,
  currency,
  onChangeCurrency,
  isDark,
  onToggleTheme,
  onOpenPricingModal,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const remaining = getRemainingAudits(freemiumState);
  const isExhausted = remaining === 0;
  const badgeText = formatQuotaBadgeText(freemiumState);

  const mainTabs: Array<{
    id: ActiveNavTab;
    label: string;
    shortLabel: string;
    icon: React.FC<{ className?: string }>;
    badge?: number;
  }> = [
    {
      id: 'landing',
      label: 'О продукте',
      shortLabel: 'Главная',
      icon: ShieldCheck,
    },
    {
      id: 'audit',
      label: 'Аудит ТЗ',
      shortLabel: 'Аудит ТЗ',
      icon: FileSearch,
    },
    {
      id: 'history',
      label: 'Библиотека работ',
      shortLabel: 'Библиотека',
      icon: FolderClock,
      badge: historyCount,
    },
    {
      id: 'pricing',
      label: 'Тарифы и лимиты',
      shortLabel: 'Тарифы',
      icon: CreditCard,
    },
  ];

  const auditAnchors: Array<{ id: ActiveSection; label: string }> = [
    { id: 'audit', label: 'Реестр ТЗ' },
    { id: 'email', label: 'Письмо клиенту' },
    { id: 'change-order', label: 'Доп. соглашение' },
    { id: 'json', label: 'JSON Схема' },
  ];

  return (
    <>
      {/* Top Header Bar (Strict 3-Zone Contract, Compact height for 15% mobile cap) */}
      <header className="sticky top-0 z-30 h-13 sm:h-15 flex items-center justify-between gap-4 sm:gap-8 px-4 sm:px-6 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 print:hidden">
        {/* Zone 1: Single text element wordmark — Clickable to open Product Landing Page */}
        <a
          href="#top"
          data-testid="brand-logo"
          title="Перейти на главную страницу о продукте ScopeGuard Legal"
          onClick={(e) => {
            e.preventDefault();
            onSelectTab('landing');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        >
          ScopeGuard Legal
        </a>

        {/* Zone 2: Contextual single-line navigation links */}
        <nav
          aria-label="Быстрая навигация по разделам"
          className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300"
        >
          {activeTab === 'audit' ? (
            <>
              <button
                type="button"
                onClick={() => onSelectTab('landing')}
                className="whitespace-nowrap shrink-0 py-1 border-b-2 border-transparent text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
              >
                О продукте
              </button>
              {auditAnchors.map((item) => {
                const isActive = activeSection === item.id;
                return (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    onClick={(e) => {
                      e.preventDefault();
                      onSelectSection(item.id);
                    }}
                    className={`whitespace-nowrap shrink-0 py-1 transition-colors border-b-2 ${
                      isActive
                        ? 'border-indigo-600 text-slate-900 dark:text-white font-semibold'
                        : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {item.label}
                  </a>
                );
              })}
            </>
          ) : (
            mainTabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => onSelectTab(tab.id)}
                  className={`whitespace-nowrap shrink-0 py-1 transition-colors border-b-2 cursor-pointer ${
                    isActive
                      ? 'border-indigo-600 text-slate-900 dark:text-white font-semibold'
                      : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })
          )}
        </nav>

        {/* Zone 3: Currency selector, Quota text, Theme switch & Primary CTA */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <select
            aria-label="Выбор валюты"
            data-testid="header-currency-select"
            value={currency}
            onChange={(e) => onChangeCurrency(e.target.value as CurrencyCode)}
            className="min-h-[38px] px-2.5 py-1.5 text-xs font-mono font-semibold text-slate-800 dark:text-slate-100 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:border-indigo-500 cursor-pointer shrink-0"
          >
            {CURRENCY_ORDER.map((code) => (
              <option key={code} value={code}>
                {CURRENCY_CONFIGS[code].label}
              </option>
            ))}
          </select>

          <span
            data-testid="quota-badge"
            className={`hidden xl:inline text-xs font-mono tabular-nums whitespace-nowrap shrink-0 ${
              isExhausted
                ? 'text-red-600 dark:text-red-400 font-semibold'
                : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            {badgeText}
          </span>

          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={
              isDark ? 'Включить светлую тему' : 'Включить темную тему'
            }
            title={isDark ? 'Светлая тема' : 'Темная тема'}
            className="min-h-[38px] min-w-[38px] inline-flex items-center justify-center p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 rounded-lg transition-colors cursor-pointer shrink-0"
          >
            {isDark ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4" />
            )}
          </button>

          <button
            type="button"
            onClick={onOpenPricingModal}
            className="hidden sm:inline-flex items-center justify-center min-h-[38px] px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {freemiumState.tier === 'free' ? 'Перейти на Pro' : 'Тарифы Pro'}
          </button>

          {/* Mobile Burger Trigger (>=44px touch target) */}
          <button
            type="button"
            data-testid="mobile-menu-trigger"
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            aria-label={
              isMobileMenuOpen ? 'Закрыть меню навигации' : 'Открыть меню навигации'
            }
            aria-expanded={isMobileMenuOpen}
            className="lg:hidden min-h-[44px] min-w-[44px] inline-flex items-center justify-center p-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
          >
            {isMobileMenuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>
      </header>

      {/* Mobile Dropdown Drawer when burger is clicked */}
      {isMobileMenuOpen && (
        <div
          role="dialog"
          aria-label="Мобильное меню"
          className="lg:hidden fixed inset-x-0 top-13 z-40 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-4 shadow-xl space-y-3 print:hidden"
        >
          <div className="space-y-1">
            {mainTabs.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    onSelectTab(tab.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full min-h-[44px] flex items-center justify-between px-3.5 py-2.5 text-sm font-semibold rounded-xl transition-colors cursor-pointer ${
                    active
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </span>
                  {typeof tab.badge === 'number' && (
                    <span className="font-mono text-xs tabular-nums opacity-85">
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
            <span className="text-xs font-mono tabular-nums text-slate-600 dark:text-slate-300">
              {badgeText}
            </span>
            <button
              type="button"
              onClick={() => {
                setIsMobileMenuOpen(false);
                onOpenPricingModal();
              }}
              className="min-h-[44px] px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl cursor-pointer whitespace-nowrap"
            >
              Управление тарифом
            </button>
          </div>
        </div>
      )}
    </>
  );
};

interface DesktopSidebarProps {
  activeTab: ActiveNavTab;
  onSelectTab: (tab: ActiveNavTab) => void;
  activeSection: ActiveSection;
  onSelectSection: (section: ActiveSection) => void;
  historyCount: number;
  freemiumState: FreemiumState;
  onOpenPricingModal: () => void;
}

export const DesktopSidebar: React.FC<DesktopSidebarProps> = ({
  activeTab,
  onSelectTab,
  activeSection,
  onSelectSection,
  historyCount,
  freemiumState,
  onOpenPricingModal,
}) => {
  const remaining = getRemainingAudits(freemiumState);
  const badgeText = formatQuotaBadgeText(freemiumState);

  const navItems: Array<{
    id: ActiveNavTab;
    label: string;
    subtitle: string;
    icon: React.FC<{ className?: string }>;
    count?: number;
  }> = [
    {
      id: 'audit',
      label: 'Аудит ТЗ (Кабинет)',
      subtitle: 'Сверка и смета Change Order',
      icon: FileSearch,
    },
    {
      id: 'history',
      label: 'Библиотека работ',
      subtitle: 'Архив проверок и отчетов',
      icon: FolderClock,
      count: historyCount,
    },
    {
      id: 'pricing',
      label: 'Тарифы и лимиты',
      subtitle: 'Подписка и способы оплаты',
      icon: CreditCard,
    },
    {
      id: 'landing',
      label: 'О продукте',
      subtitle: 'Главная страница и обзор',
      icon: ShieldCheck,
    },
  ];

  return (
    <aside
      aria-label="Главное боковое меню"
      className="hidden lg:flex lg:w-64 xl:w-68 shrink-0 flex-col justify-between bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 p-4 select-none print:hidden"
    >
      <div className="space-y-6">
        {/* Primary Navigation Hub */}
        <div>
          <div className="px-3 mb-2 text-[11px] font-semibold text-slate-400 dark:text-slate-500">
            Навигация по системе
          </div>
          <nav aria-label="Разделы приложения" className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  data-testid={`sidebar-tab-${item.id}`}
                  onClick={() => onSelectTab(item.id)}
                  className={`w-full flex items-center justify-between gap-3 px-3.5 py-3 rounded-xl text-left transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon
                      className={`w-4 h-4 shrink-0 ${
                        isActive
                          ? 'text-white'
                          : 'text-slate-400 dark:text-slate-400'
                      }`}
                    />
                    <div className="min-w-0">
                      <div className="text-xs font-bold truncate">
                        {item.label}
                      </div>
                      <div
                        className={`text-[11px] truncate ${
                          isActive
                            ? 'text-indigo-100'
                            : 'text-slate-500 dark:text-slate-400'
                        }`}
                      >
                        {item.subtitle}
                      </div>
                    </div>
                  </div>
                  {typeof item.count === 'number' && (
                    <span
                      data-testid="sidebar-history-count"
                      className={`text-xs font-mono tabular-nums font-bold shrink-0 ${
                        isActive
                          ? 'text-white'
                          : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Quick Section Jump when on Audit Tab */}
        {activeTab === 'audit' && (
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
            <div className="px-3 mb-2 text-[11px] font-semibold text-slate-400 dark:text-slate-500">
              Этапы текущего аудита
            </div>
            <div className="space-y-1">
              {(
                [
                  { id: 'audit', label: '01. Загрузка и Реестр ТЗ' },
                  { id: 'email', label: '02. Дипломатичное письмо' },
                  { id: 'change-order', label: '03. Доп. соглашение' },
                  { id: 'json', label: '04. JSON-схема отчета' },
                ] as const
              ).map((sec) => (
                <button
                  key={sec.id}
                  type="button"
                  onClick={() => onSelectSection(sec.id)}
                  className={`w-full text-left px-3 py-2 text-xs rounded-lg transition-colors cursor-pointer ${
                    activeSection === sec.id
                      ? 'font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50/70 dark:bg-indigo-950/40'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  {sec.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Subscription & Quota Card in Sidebar */}
      <div className="mt-6 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white">
          <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
          <span>
            {freemiumState.tier === 'free'
              ? 'Базовый лимит (Free)'
              : freemiumState.tier === 'freelance'
              ? 'Тариф Freelance Pro'
              : 'Тариф Agency Unlimited'}
          </span>
        </div>

        <div className="text-xs font-mono tabular-nums text-slate-600 dark:text-slate-300">
          {badgeText}
        </div>

        {remaining !== 'unlimited' && (
          <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${
                remaining === 0 ? 'bg-red-500' : 'bg-indigo-600'
              }`}
              style={{
                width: `${
                  freemiumState.tier === 'free'
                    ? Math.min(
                        100,
                        ((freemiumState.maxFreeAudits - Number(remaining)) /
                          freemiumState.maxFreeAudits) *
                          100
                      )
                    : Math.min(
                        100,
                        ((freemiumState.freelanceQuota - Number(remaining)) /
                          freemiumState.freelanceQuota) *
                          100
                      )
                }%`,
              }}
            />
          </div>
        )}

        <button
          type="button"
          onClick={onOpenPricingModal}
          className="w-full py-2 px-3 text-xs font-semibold text-white bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-500 rounded-lg transition-colors cursor-pointer"
        >
          {freemiumState.tier === 'free'
            ? 'Снять лимиты проверок'
            : 'Управление подпиской'}
        </button>
      </div>
    </aside>
  );
};

interface MobileBottomNavProps {
  activeTab: ActiveNavTab;
  onSelectTab: (tab: ActiveNavTab) => void;
  historyCount: number;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  onSelectTab,
  historyCount,
}) => {
  const items: Array<{
    id: ActiveNavTab;
    label: string;
    icon: React.FC<{ className?: string }>;
    badge?: number;
  }> = [
    { id: 'audit', label: 'Аудит ТЗ', icon: FileSearch },
    {
      id: 'history',
      label: 'Библиотека',
      icon: FolderClock,
      badge: historyCount,
    },
    { id: 'pricing', label: 'Тарифы', icon: CreditCard },
  ];

  return (
    <nav
      aria-label="Нижняя панель навигации"
      data-testid="mobile-bottom-nav"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 h-14 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 grid grid-cols-3 items-center px-2 print:hidden"
    >
      {items.map((item) => {
        const Icon = item.icon;
        const active = activeTab === item.id;
        return (
          <button
            key={item.id}
            type="button"
            data-testid={`mobile-tab-${item.id}`}
            onClick={() => onSelectTab(item.id)}
            className={`min-h-[44px] flex flex-col items-center justify-center rounded-xl transition-colors cursor-pointer ${
              active
                ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium'
            }`}
          >
            <div className="relative flex items-center justify-center">
              <Icon className="w-5 h-5" />
              {typeof item.badge === 'number' && item.badge > 0 && (
                <span className="ml-1 text-[10px] font-mono tabular-nums font-bold">
                  ({item.badge})
                </span>
              )}
            </div>
            <span className="text-[11px] tracking-tight mt-0.5 whitespace-nowrap">
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
