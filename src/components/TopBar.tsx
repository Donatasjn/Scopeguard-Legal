import React, { useState } from 'react';
import {
  CreditCard,
  FileSearch,
  FolderClock,
  Menu,
  Moon,
  ShieldCheck,
  Sparkles,
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
import { BrandLogoIcon } from './BrandLogo';

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
      shortLabel: 'О продукте',
      icon: Sparkles,
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
      {/* Google NotebookLM / Workspace Floating Translucent Header */}
      <header className="sticky top-0 z-30 pt-2.5 pb-2 px-3 sm:px-6 print:hidden transition-all">
        <div className="max-w-[1540px] mx-auto h-14 flex items-center justify-between gap-3 sm:gap-6 px-4 sm:px-6 rounded-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/70 dark:border-slate-800/80 shadow-[0_4px_24px_-6px_rgba(15,23,42,0.06)]">
          {/* Zone 1: Brand SVG Shield Logo + ScopeGuard Legal Wordmark */}
          <a
            href="#top"
            data-testid="brand-logo"
            title="Перейти на главную страницу ScopeGuard Legal (NotebookLM Overview)"
            onClick={(e) => {
              e.preventDefault();
              onSelectTab('landing');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="group inline-flex items-center gap-2.5 text-base sm:text-[17px] font-semibold tracking-tight text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            <BrandLogoIcon className="w-7 h-7 shrink-0 transition-transform duration-200 group-hover:scale-105" />
            <span>ScopeGuard</span>
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60">
              Legal AI
            </span>
          </a>

          {/* Zone 2: Google Material 3 Pill Navigation */}
          <nav
            aria-label="Навигация по платформе"
            className="hidden md:flex items-center gap-1 p-1 rounded-full bg-[#EDF2FA]/85 dark:bg-slate-800/80"
          >
            {mainTabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => onSelectTab(tab.id)}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-full transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                    isActive
                      ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-300 shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-700/50'
                  }`}
                >
                  <span>{tab.label}</span>
                  {typeof tab.badge === 'number' && tab.badge > 0 && (
                    <span className="px-1.5 py-0.2 text-[10px] font-mono tabular-nums rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Pill Controls (Currency, Quota, Theme, Pro CTA) */}
          <div className="flex items-center gap-2 shrink-0">
            <select
              aria-label="Выбор валюты"
              data-testid="header-currency-select"
              value={currency}
              onChange={(e) => onChangeCurrency(e.target.value as CurrencyCode)}
              className="min-h-[36px] px-3 py-1 text-xs font-mono font-semibold text-slate-800 dark:text-slate-100 bg-[#EDF2FA]/90 dark:bg-slate-800 hover:bg-[#E1E9F6] dark:hover:bg-slate-700 border border-transparent rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500/40 cursor-pointer shrink-0 transition-colors"
            >
              {CURRENCY_ORDER.map((code) => (
                <option key={code} value={code}>
                  {CURRENCY_CONFIGS[code].label}
                </option>
              ))}
            </select>

            <span
              data-testid="quota-badge"
              className={`hidden xl:inline-flex items-center px-3 py-1 rounded-full text-xs font-mono tabular-nums whitespace-nowrap shrink-0 ${
                isExhausted
                  ? 'bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300 font-semibold'
                  : 'bg-[#EDF2FA]/70 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300'
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
              className="min-h-[36px] min-w-[36px] inline-flex items-center justify-center p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-[#EDF2FA]/90 dark:bg-slate-800 rounded-full transition-colors cursor-pointer shrink-0"
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
              className="hidden sm:inline-flex items-center justify-center min-h-[36px] px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 dark:bg-indigo-600 hover:bg-indigo-600 dark:hover:bg-indigo-500 rounded-full shadow-xs transition-all whitespace-nowrap shrink-0 cursor-pointer"
            >
              {freemiumState.tier === 'free' ? 'Перейти на Pro' : 'Тарифы Pro'}
            </button>

            {/* Mobile Burger Trigger */}
            <button
              type="button"
              data-testid="mobile-menu-trigger"
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
              aria-label={
                isMobileMenuOpen
                  ? 'Закрыть меню навигации'
                  : 'Открыть меню навигации'
              }
              aria-expanded={isMobileMenuOpen}
              className="lg:hidden min-h-[40px] min-w-[40px] inline-flex items-center justify-center p-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full cursor-pointer"
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Google Docs Secondary Quick-Jump Pill Bar when inside Audit Workspace */}
        {activeTab === 'audit' && (
          <div className="hidden lg:flex max-w-[1540px] mx-auto mt-2 px-4 items-center justify-between text-xs">
            <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-[#EDF2FA]/90 dark:bg-slate-900/90 border border-slate-200/60 dark:border-slate-800">
              <span className="px-2.5 py-0.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                Листы документа:
              </span>
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
                    className={`px-3 py-1 rounded-full transition-all whitespace-nowrap ${
                      isActive
                        ? 'bg-[#C2E7FF] dark:bg-indigo-600 text-[#001D35] dark:text-white font-semibold'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-white/70 dark:hover:bg-slate-800'
                    }`}
                  >
                    {item.label}
                  </a>
                );
              })}
            </div>
          </div>
        )}
      </header>

      {/* Mobile Dropdown Drawer */}
      {isMobileMenuOpen && (
        <div
          role="dialog"
          aria-label="Мобильное меню"
          className="lg:hidden fixed inset-x-3 top-18 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 rounded-3xl p-4 shadow-2xl space-y-3 print:hidden animate-modal-content"
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
                  className={`w-full min-h-[44px] flex items-center justify-between px-4 py-2.5 text-sm font-semibold rounded-full transition-colors cursor-pointer ${
                    active
                      ? 'bg-[#C2E7FF] text-[#001D35] dark:bg-indigo-600 dark:text-white'
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

          <div className="pt-3 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3">
            <span className="text-xs font-mono tabular-nums text-slate-600 dark:text-slate-300">
              {badgeText}
            </span>
            <button
              type="button"
              onClick={() => {
                setIsMobileMenuOpen(false);
                onOpenPricingModal();
              }}
              className="min-h-[40px] px-4 py-2 text-xs font-semibold text-white bg-slate-900 dark:bg-indigo-600 rounded-full cursor-pointer whitespace-nowrap"
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
      label: 'Аудит ТЗ (Документ)',
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
      subtitle: 'Обзор NotebookLM',
      icon: Sparkles,
    },
  ];

  // On the NotebookLM Landing Page, hide the workspace rail so the hero & bento grid are 100% centered and airy
  if (activeTab === 'landing') {
    return null;
  }

  return (
    <aside
      aria-label="Навигация Google Workspace"
      className="hidden lg:flex lg:w-64 shrink-0 flex-col justify-between bg-transparent pl-4 pr-2 py-4 select-none print:hidden"
    >
      <div className="space-y-6">
        <div>
          <div className="px-4 mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Рабочая область
          </div>
          <nav aria-label="Разделы приложения" className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  data-testid={`sidebar-tab-${item.id}`}
                  onClick={() => onSelectTab(item.id)}
                  className={`w-full flex items-center justify-between gap-3 px-4 py-2.5 rounded-full text-left transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#C2E7FF] text-[#001D35] dark:bg-indigo-600 dark:text-white font-semibold shadow-2xs'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800/70'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon
                      className={`w-4 h-4 shrink-0 ${
                        isActive
                          ? 'text-[#001D35] dark:text-white'
                          : 'text-slate-500 dark:text-slate-400'
                      }`}
                    />
                    <div className="min-w-0">
                      <div className="text-xs font-semibold truncate">
                        {item.label}
                      </div>
                      <div
                        className={`text-[10px] truncate ${
                          isActive
                            ? 'text-[#001D35]/75 dark:text-indigo-100'
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
                      className={`text-xs font-mono tabular-nums font-bold px-2 py-0.5 rounded-full shrink-0 ${
                        isActive
                          ? 'bg-white/70 text-[#001D35] dark:bg-indigo-900 dark:text-white'
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

        {/* Document Outline (Google Docs Left Outline Style) */}
        {activeTab === 'audit' && (
          <div className="pt-4 border-t border-slate-200/70 dark:border-slate-800">
            <div className="px-4 mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Структура документа
            </div>
            <div className="space-y-0.5">
              {(
                [
                  { id: 'audit', label: '1. Исходные файлы и ТЗ' },
                  { id: 'email', label: '2. Письмо заказчику' },
                  { id: 'change-order', label: '3. Доп. соглашение' },
                  { id: 'json', label: '4. JSON-схема отчета' },
                ] as const
              ).map((sec) => (
                <button
                  key={sec.id}
                  type="button"
                  onClick={() => onSelectSection(sec.id)}
                  className={`w-full text-left px-4 py-2 text-xs rounded-full transition-colors cursor-pointer ${
                    activeSection === sec.id
                      ? 'font-semibold text-indigo-700 dark:text-indigo-300 bg-[#EDF2FA] dark:bg-indigo-950/50'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/40 dark:hover:bg-slate-800/40'
                  }`}
                >
                  {sec.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Google Workspace Storage/Quota Pill Card */}
      <div className="mt-6 p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white">
          <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
          <span>
            {freemiumState.tier === 'free'
              ? 'Базовый план (Free)'
              : freemiumState.tier === 'freelance'
              ? 'Freelance Pro'
              : 'Agency Unlimited'}
          </span>
        </div>

        <div className="text-xs font-mono tabular-nums text-slate-600 dark:text-slate-300">
          {badgeText}
        </div>

        {remaining !== 'unlimited' && (
          <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all rounded-full ${
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
          className="w-full py-2 px-4 text-xs font-semibold text-indigo-700 dark:text-white bg-[#EDF2FA] dark:bg-indigo-600 hover:bg-[#D3E3FD] dark:hover:bg-indigo-500 rounded-full transition-colors cursor-pointer"
        >
          {freemiumState.tier === 'free'
            ? 'Расширить лимит'
            : 'Настройки тарифа'}
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
    { id: 'landing', label: 'Обзор', icon: Sparkles },
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
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 h-15 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-200/80 dark:border-slate-800 grid grid-cols-4 items-center px-2 print:hidden"
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
            className={`min-h-[44px] flex flex-col items-center justify-center rounded-full transition-colors cursor-pointer ${
              active
                ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium'
            }`}
          >
            <div
              className={`px-3 py-0.5 rounded-full flex items-center justify-center ${
                active ? 'bg-[#C2E7FF]/70 dark:bg-indigo-950/80' : ''
              }`}
            >
              <Icon className="w-4 h-4" />
              {typeof item.badge === 'number' && item.badge > 0 && (
                <span className="ml-1 text-[10px] font-mono tabular-nums font-bold">
                  {item.badge}
                </span>
              )}
            </div>
            <span className="text-[10px] tracking-tight mt-0.5 whitespace-nowrap">
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
