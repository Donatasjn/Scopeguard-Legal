import React, { useEffect, useRef, useState } from 'react';
import {
  Check,
  ChevronDown,
  CreditCard,
  FolderClock,
  Layers,
  LogIn,
  LogOut,
  Menu,
  Moon,
  ShieldCheck,
  Sparkles,
  Sun,
  User,
  X,
} from 'lucide-react';
import {
  getInitials,
  getRemainingUserAudits,
  type UserProfile,
} from '../lib/supabase';
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
  currentUser: UserProfile | null;
  onOpenAuthModal: () => void;
  onSignOut: () => void;
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
  currentUser,
  onOpenAuthModal,
  onSignOut,
  currency,
  onChangeCurrency,
  isDark,
  onToggleTheme,
  onOpenPricingModal,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [isCurrencyMenuOpen, setIsCurrencyMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const currencyDropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsAccountMenuOpen(false);
      }
      if (
        currencyDropdownRef.current &&
        !currencyDropdownRef.current.contains(event.target as Node)
      ) {
        setIsCurrencyMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const remaining = currentUser
    ? getRemainingUserAudits(currentUser)
    : getRemainingAudits(freemiumState);
  const isExhausted = remaining === 0;
  const badgeText = currentUser
    ? `Проверок: ${currentUser.audits_used}/${currentUser.audits_limit}`
    : formatQuotaBadgeText(freemiumState);
  const isLandingDarkHero = activeTab === 'landing' && !isDark;

  const mainTabs: Array<{
    id: ActiveNavTab;
    label: string;
    icon: React.FC<{ className?: string }>;
    badge?: number;
    accentAdmin?: boolean;
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
    ...(currentUser
      ? [
          {
            id: 'account' as ActiveNavTab,
            label: 'Личный кабинет',
            icon: User,
          },
        ]
      : []),
    ...(currentUser?.is_admin
      ? [
          {
            id: 'admin' as ActiveNavTab,
            label: 'Кабинет разработчика',
            icon: ShieldCheck,
            accentAdmin: true,
          },
        ]
      : []),
  ];

  return (
    <>
      {/* FLOATING TOP BAR (Framer / Linear / Apple Glass Navigation) */}
      <header className="sticky top-0 z-40 pt-3 pb-2 px-3 sm:px-6 print:hidden transition-all duration-300">
        <div
          className={`max-w-7xl mx-auto h-15 flex items-center justify-between gap-2 sm:gap-4 px-4 sm:px-5 rounded-2xl backdrop-blur-xl transition-all duration-300 ${
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
            className="group inline-flex items-center gap-2 text-base font-bold tracking-tight transition-all active:scale-95 cursor-pointer shrink-0"
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
          </a>

          {/* Zone 2: Center Segmented Switcher */}
          <nav
            aria-label="Переключатель экранов"
            className={`hidden lg:flex items-center gap-1 p-1 rounded-xl border ${
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
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all active:scale-95 whitespace-nowrap cursor-pointer ${
                    isActive
                      ? isLandingDarkHero
                        ? 'bg-gradient-to-r from-indigo-600 to-emerald-500 text-white shadow-sm'
                        : 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                      : tab.accentAdmin
                      ? isLandingDarkHero
                        ? 'text-emerald-300 hover:bg-emerald-500/15'
                        : 'text-indigo-700 dark:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20'
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

          {/* Zone 3: Currency, Theme, Pro & Interactive User Profile Widget */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="relative" ref={currencyDropdownRef}>
              <button
                type="button"
                aria-label="Выбор валюты"
                aria-haspopup="listbox"
                aria-expanded={isCurrencyMenuOpen}
                data-testid="header-currency-select"
                onClick={() => setIsCurrencyMenuOpen((prev) => !prev)}
                className={`min-h-[36px] inline-flex items-center gap-1.5 px-3 py-1 text-xs font-mono font-bold rounded-xl border focus:outline-none cursor-pointer transition-all active:scale-95 ${
                  isLandingDarkHero
                    ? 'bg-slate-900/90 text-white border-slate-700/80 hover:border-indigo-500/70'
                    : 'bg-slate-900/90 dark:bg-slate-900/95 text-white border-slate-700/80 hover:border-indigo-500/70 shadow-xs'
                }`}
              >
                <span>{CURRENCY_CONFIGS[currency].label}</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                    isCurrencyMenuOpen ? 'rotate-180 text-indigo-400' : ''
                  }`}
                />
              </button>

              {isCurrencyMenuOpen && (
                <div
                  role="listbox"
                  aria-label="Список валют"
                  data-testid="currency-dropdown-menu"
                  className="absolute right-0 mt-2 w-40 rounded-2xl bg-slate-900/95 backdrop-blur-2xl border border-slate-700/80 p-1.5 shadow-[0_20px_50px_-10px_rgba(0,0,0,0.65)] space-y-1 animate-modal-content z-50 text-slate-100"
                >
                  {CURRENCY_ORDER.map((code) => {
                    const isSelected = currency === code;
                    return (
                      <button
                        key={code}
                        type="button"
                        role="option"
                        aria-selected={isSelected}
                        data-testid={`currency-option-${code}`}
                        onClick={() => {
                          onChangeCurrency(code);
                          setIsCurrencyMenuOpen(false);
                        }}
                        className={`w-full min-h-[36px] flex items-center justify-between px-3 py-1.5 text-xs font-mono font-bold rounded-xl transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-gradient-to-r from-indigo-600/90 to-violet-600/90 text-white shadow-xs'
                            : 'text-slate-300 hover:bg-slate-800/90 hover:text-white'
                        }`}
                      >
                        <span>{CURRENCY_CONFIGS[code].label}</span>
                        {isSelected && (
                          <Check className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

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
              className="hidden sm:inline-flex items-center justify-center gap-1.5 min-h-[36px] px-3.5 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-indigo-600 via-indigo-500 to-emerald-500 hover:from-indigo-500 hover:to-emerald-400 rounded-xl shadow-sm transition-all active:scale-95 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Pro</span>
            </button>

            {/* Interactive User Account Widget OR Pill Login Button */}
            {currentUser ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  data-testid="header-account-widget"
                  aria-expanded={isAccountMenuOpen}
                  onClick={() => setIsAccountMenuOpen((prev) => !prev)}
                  className={`min-h-[38px] inline-flex items-center gap-2 pl-1.5 pr-2.5 py-1 rounded-full border transition-all active:scale-95 cursor-pointer ${
                    isLandingDarkHero
                      ? 'bg-white/10 border-white/15 text-white hover:bg-white/15'
                      : 'bg-slate-100/90 dark:bg-slate-800/90 border-slate-200/80 dark:border-slate-700 text-slate-900 dark:text-white hover:border-indigo-400'
                  }`}
                >
                  <span className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-600 via-violet-600 to-emerald-500 text-white text-[11px] font-extrabold flex items-center justify-center shrink-0">
                    {getInitials(currentUser.full_name || currentUser.email)}
                  </span>

                  <span className="hidden xl:flex flex-col items-start text-left leading-none">
                    <span className="text-[11px] font-bold max-w-[130px] truncate">
                      {currentUser.email}
                    </span>
                    <span
                      data-testid="quota-badge"
                      className="text-[10px] font-mono tabular-nums opacity-75 mt-0.5"
                    >
                      Осталось: {remaining} ({currentUser.audits_used}/
                      {currentUser.audits_limit})
                    </span>
                  </span>

                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                      currentUser.plan === 'pro'
                        ? 'bg-indigo-600 text-white'
                        : isExhausted
                        ? 'bg-red-500/20 text-red-500'
                        : 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300'
                    }`}
                  >
                    {currentUser.plan}
                  </span>

                  <ChevronDown className="w-3.5 h-3.5 opacity-70" />
                </button>

                {/* Frosted Glass Profile Dropdown Menu */}
                {isAccountMenuOpen && (
                  <div
                    role="menu"
                    data-testid="account-dropdown-menu"
                    className="absolute right-0 mt-2 w-72 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-slate-200/80 dark:border-slate-800 p-3 shadow-2xl space-y-2.5 animate-modal-content z-50 text-slate-900 dark:text-white"
                  >
                    <div className="p-2.5 rounded-xl bg-slate-50/90 dark:bg-slate-800/70 border border-slate-200/60 dark:border-slate-700/60">
                      <div className="text-xs font-bold truncate">
                        {currentUser.full_name}
                      </div>
                      <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {currentUser.email}
                      </div>
                      <div className="mt-2 flex items-center justify-between text-[11px] font-mono tabular-nums">
                        <span className="text-slate-500 dark:text-slate-400">
                          Лимит проверок:
                        </span>
                        <span className="font-bold text-indigo-600 dark:text-indigo-400">
                          {currentUser.audits_used} из {currentUser.audits_limit}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <button
                        type="button"
                        role="menuitem"
                        data-testid="dropdown-open-account-btn"
                        onClick={() => {
                          setIsAccountMenuOpen(false);
                          onSelectTab('account');
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="w-full min-h-[38px] flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      >
                        <User className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        <span>Личный кабинет и библиотека</span>
                      </button>

                      {currentUser.is_admin && (
                        <button
                          type="button"
                          role="menuitem"
                          data-testid="dropdown-open-admin-btn"
                          onClick={() => {
                            setIsAccountMenuOpen(false);
                            onSelectTab('admin');
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className="w-full min-h-[38px] flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-xl text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 transition-colors cursor-pointer"
                        >
                          <ShieldCheck className="w-4 h-4" />
                          <span>Кабинет разработчика (Admin)</span>
                        </button>
                      )}

                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setIsAccountMenuOpen(false);
                          onOpenPricingModal();
                        }}
                        className="w-full min-h-[38px] flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      >
                        <CreditCard className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                        <span>Управление тарифом ({currentUser.plan.toUpperCase()})</span>
                      </button>
                    </div>

                    <div className="pt-2 border-t border-slate-200/70 dark:border-slate-800">
                      <button
                        type="button"
                        role="menuitem"
                        data-testid="dropdown-signout-btn"
                        onClick={() => {
                          setIsAccountMenuOpen(false);
                          onSignOut();
                        }}
                        className="w-full min-h-[38px] flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Выйти из аккаунта</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
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
                  data-testid="open-auth-modal-btn"
                  onClick={onOpenAuthModal}
                  className={`min-h-[38px] inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold rounded-full border transition-all active:scale-95 whitespace-nowrap cursor-pointer ${
                    isLandingDarkHero
                      ? 'bg-white/10 hover:bg-white/20 text-white border-white/20 shadow-sm'
                      : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-transparent hover:bg-indigo-600 dark:hover:bg-indigo-400 shadow-xs'
                  }`}
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Войти / Регистрация</span>
                </button>
              </>
            )}

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
              className="lg:hidden min-h-[38px] min-w-[38px] inline-flex items-center justify-center p-2 rounded-xl cursor-pointer"
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
          className="lg:hidden fixed inset-x-3 top-19 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-2xl space-y-3 print:hidden animate-modal-content"
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
            {currentUser ? (
              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onSignOut();
                }}
                className="min-h-[40px] px-4 py-2 text-xs font-semibold text-red-600 bg-red-50 dark:bg-red-950/40 rounded-xl cursor-pointer whitespace-nowrap"
              >
                Выйти
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onOpenAuthModal();
                }}
                className="min-h-[40px] px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-xl cursor-pointer whitespace-nowrap"
              >
                Войти / Регистрация
              </button>
            )}
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
  currentUser?: UserProfile | null;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  onSelectTab,
  historyCount,
  currentUser,
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
    ...(currentUser
      ? [{ id: 'account' as ActiveNavTab, label: 'Профиль', icon: User }]
      : []),
  ];

  return (
    <nav
      aria-label="Нижняя панель навигации"
      data-testid="mobile-bottom-nav"
      className={`md:hidden fixed bottom-0 left-0 right-0 z-40 h-15 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-t border-slate-200/80 dark:border-slate-800 grid ${
        items.length === 4 ? 'grid-cols-4' : 'grid-cols-3'
      } items-center px-2 print:hidden`}
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
