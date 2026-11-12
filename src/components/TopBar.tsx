import React, { useState } from 'react';
import {
  CreditCard,
  FolderClock,
  Layers,
  Menu,
  Moon,
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
  const isLandingDarkHero = activeTab === 'landing' && !isDark;

  const mainTabs: Array<{
    id: ActiveNavTab;
    label: string;
    icon: React.FC<{ className?: string }>;
    badge?: number;
  }> = [
    {
      id: 'landing',
      label: 'Главная',
      icon: Sparkles,
    },
    {
      id: 'audit',
      label: 'Кабинет',
      icon: Layers,
    },
    {
      id: 'history',
      label: 'Архив',
      icon: FolderClock,
      badge: historyCount,
    },
  ];

  return (
    <>
      {/* FLOATING TOP BAR (Framer / Linear / Apple Glass Navigation) */}
      <header className="sticky top-0 z-40 pt-3 pb-2 px-3 sm:px-6 print:hidden transition-all duration-300">
        <div
          className={`max-w-7xl mx-auto h-15 flex items-center justify-between gap-3 sm:gap-6 px-4 sm:px-6 rounded-2xl backdrop-blur-xl transition-all duration-300 ${
            isLandingDarkHero
              ? 'bg-[#0B0F19]/85 border border-white/10 text-white shadow-[0_16px_40px_-10px_rgba(0,0,0,0.55)]'
              : 'bg-white/85 dark:bg-slate-900/85 border border-slate-200/80 dark:border-slate-800 text-slate-900 dark:text-white shadow-[0_10px_30px_-10px_rgba(15,23,42,0.08)]'
          }`}
        >
          {/* Zone 1: Shield SVG Logo (Always returns to Landing Page) */}
          <a
            href="#top"
            data-testid="brand-logo"
            title="На Главную страницу ScopeGuard Legal"
            onClick={(e) => {
              e.preventDefault();
              onSelectTab('landing');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="group inline-flex items-center gap-2.5 text-base sm:text-lg font-bold tracking-tight transition-all active:scale-95 cursor-pointer shrink-0"
          >
            <BrandLogoIcon className="w-8 h-8 shrink-0 transition-transform duration-200 group-hover:scale-105" />
            <span
              className={
                isLandingDarkHero
                  ? 'text-white group-hover:text-indigo-300'
                  : 'text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400'
              }
            >
              ScopeGuard
            </span>
            <span
              className={`hidden sm:inline-flex items-center px-2 py-0.5 text-[11px] font-mono font-semibold rounded-md border ${
                isLandingDarkHero
                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-400/30'
                  : 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300 border-indigo-200/70 dark:border-indigo-800/60'
              }`}
            >
              Legal AI
            </span>
          </a>

          {/* Zone 2: Center Segmented Switcher «Главная / Кабинет / Архив» */}
          <nav
            aria-label="Переключатель экранов"
            className={`hidden md:flex items-center gap-1 p-1 rounded-xl border ${
              isLandingDarkHero
                ? 'bg-white/5 border-white/10'
                : 'bg-slate-100/90 dark:bg-slate-800/90 border-slate-200/60 dark:border-slate-700/60'
            }`}
          >
            {mainTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  data-testid={`nav-tab-${tab.id}`}
                  onClick={() => {
                    onSelectTab(tab.id);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className={`inline-flex items-center gap-2 px-4 py-1.5 text-xs font-semibold rounded-lg transition-all active:scale-95 whitespace-nowrap cursor-pointer ${
                    isActive
                      ? isLandingDarkHero
                        ? 'bg-gradient-to-r from-indigo-600 to-emerald-500 text-white shadow-sm'
                        : 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                      : isLandingDarkHero
                      ? 'text-slate-300 hover:text-white hover:bg-white/5'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span>{tab.label}</span>
                  {typeof tab.badge === 'number' && tab.badge > 0 && (
                    <span
                      data-testid="sidebar-history-count"
                      className={`px-1.5 py-0.2 text-[10px] font-mono tabular-nums rounded-md ${
                        isActive
                          ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                          : 'bg-slate-200/70 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Currency, Free Audits Counter, Theme Toggle & «Pro» CTA */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            <select
              aria-label="Выбор валюты"
              data-testid="header-currency-select"
              value={currency}
              onChange={(e) => onChangeCurrency(e.target.value as CurrencyCode)}
              className={`min-h-[36px] px-2.5 py-1 text-xs font-mono font-semibold rounded-xl border focus:outline-none cursor-pointer transition-colors ${
                isLandingDarkHero
                  ? 'bg-white/10 text-white border-white/15 hover:bg-white/15 [&>option]:text-slate-900'
                  : 'bg-slate-100/90 dark:bg-slate-800 text-slate-800 dark:text-slate-100 border-slate-200/80 dark:border-slate-700 hover:bg-slate-200/70'
              }`}
            >
              {CURRENCY_ORDER.map((code) => (
                <option key={code} value={code}>
                  {CURRENCY_CONFIGS[code].label}
                </option>
              ))}
            </select>

            <span
              data-testid="quota-badge"
              className={`hidden xl:inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-mono tabular-nums border whitespace-nowrap ${
                isExhausted
                  ? 'bg-red-500/15 text-red-500 border-red-500/30 font-semibold'
                  : isLandingDarkHero
                  ? 'bg-white/5 text-slate-300 border-white/10'
                  : 'bg-slate-100/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-slate-200/60 dark:border-slate-700'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isExhausted ? 'bg-red-500' : 'bg-emerald-500'
                }`}
              />
              <span>{badgeText}</span>
            </span>

            <button
              type="button"
              onClick={onToggleTheme}
              aria-label={
                isDark ? 'Включить светлую тему' : 'Включить темную тему'
              }
              title={isDark ? 'Светлая тема' : 'Темная тема'}
              className={`min-h-[36px] min-w-[36px] inline-flex items-center justify-center p-2 rounded-xl border transition-all active:scale-95 cursor-pointer shrink-0 ${
                isLandingDarkHero
                  ? 'bg-white/10 text-slate-200 border-white/15 hover:bg-white/15'
                  : 'bg-slate-100/90 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200/80 dark:border-slate-700 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {isDark ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </button>

            <button
              type="button"
              data-testid="open-pro-modal-btn"
              onClick={onOpenPricingModal}
              className="inline-flex items-center justify-center gap-1.5 min-h-[36px] px-4 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-indigo-600 via-indigo-500 to-emerald-500 hover:from-indigo-500 hover:to-emerald-400 rounded-xl shadow-sm transition-all active:scale-95 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>
                {freemiumState.tier === 'free' ? 'Pro' : 'Тариф Pro'}
              </span>
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
              className="md:hidden min-h-[38px] min-w-[38px] inline-flex items-center justify-center p-2 rounded-xl cursor-pointer"
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Dropdown Drawer */}
      {isMobileMenuOpen && (
        <div
          role="dialog"
          aria-label="Мобильное меню"
          className="md:hidden fixed inset-x-3 top-19 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-2xl space-y-3 print:hidden animate-modal-content"
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
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className={`w-full min-h-[44px] flex items-center justify-between px-4 py-2.5 text-sm font-semibold rounded-xl transition-all active:scale-95 cursor-pointer ${
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
              className="min-h-[40px] px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-xl cursor-pointer whitespace-nowrap"
            >
              Тарифы Pro
            </button>
          </div>
        </div>
      )}
    </>
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
    { id: 'landing', label: 'Главная', icon: Sparkles },
    { id: 'audit', label: 'Кабинет', icon: Layers },
    {
      id: 'history',
      label: 'Архив',
      icon: FolderClock,
      badge: historyCount,
    },
  ];

  return (
    <nav
      aria-label="Нижняя панель навигации"
      data-testid="mobile-bottom-nav"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 h-15 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-t border-slate-200/80 dark:border-slate-800 grid grid-cols-3 items-center px-2 print:hidden"
    >
      {items.map((item) => {
        const Icon = item.icon;
        const active = activeTab === item.id;
        return (
          <button
            key={item.id}
            type="button"
            data-testid={`mobile-tab-${item.id}`}
            onClick={() => {
              onSelectTab(item.id);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`min-h-[44px] flex flex-col items-center justify-center rounded-xl transition-all active:scale-95 cursor-pointer ${
              active
                ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                : 'text-slate-500 dark:text-slate-400 font-medium'
            }`}
          >
            <div className="flex items-center justify-center">
              <Icon className="w-4 h-4" />
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
