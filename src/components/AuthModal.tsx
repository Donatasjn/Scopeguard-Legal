import React, { useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  Building2,
  CheckCircle2,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
  UserPlus,
  X,
} from 'lucide-react';
import {
  signInQuickDemoProfile,
  signInWithEmailPassword,
  signUpWithEmailPassword,
  type UserProfile,
} from '../lib/supabase';
import { BrandLogoIcon } from './BrandLogo';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (profile: UserProfile, isNewUser: boolean) => void;
  reasonMessage?: string | null;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
  reasonMessage,
}) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorText(null);
    setIsLoading(true);

    try {
      if (mode === 'login') {
        const { profile, error } = await signInWithEmailPassword(
          email,
          password
        );
        if (error || !profile) {
          setErrorText(
            error || 'Не удалось выполнить вход. Проверьте Email и пароль.'
          );
          return;
        }
        onAuthSuccess(profile, false);
        onClose();
      } else {
        const { profile, error } = await signUpWithEmailPassword(
          email,
          password,
          fullName
        );
        if (error || !profile) {
          setErrorText(
            error || 'Не удалось завершить регистрацию. Проверьте данные.'
          );
          return;
        }
        onAuthSuccess(profile, true);
        onClose();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemoLogin = async (
    demoEmail: string,
    demoPass: string,
    demoName: string
  ) => {
    setErrorText(null);
    setEmail(demoEmail);
    setPassword(demoPass);
    setFullName(demoName);
    setIsLoading(true);
    try {
      const profile = await signInQuickDemoProfile(demoEmail, demoName);
      onAuthSuccess(profile, false);
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
      data-testid="auth-modal"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-xl overflow-y-auto animate-modal-backdrop"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md rounded-3xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-[0_24px_70px_-15px_rgba(15,23,42,0.45)] animate-modal-content space-y-6"
      >
        {/* Top Ambient Glow */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-16 left-1/2 -translate-x-1/2 w-64 h-32 rounded-full bg-gradient-to-r from-indigo-500/20 via-violet-500/20 to-emerald-500/20 blur-2xl"
        />

        {/* Header */}
        <div className="relative flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <BrandLogoIcon className="w-10 h-10 shrink-0 shadow-sm rounded-xl" />
            <div>
              <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
                <Sparkles className="w-3 h-3" />
                <span>Облачный аккаунт ScopeGuard</span>
              </div>
              <h2
                id="auth-modal-title"
                className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight"
              >
                {mode === 'login'
                  ? 'Вход в личный кабинет'
                  : 'Регистрация аккаунта'}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Закрыть окно авторизации"
            className="min-h-[38px] min-w-[38px] inline-flex items-center justify-center p-2 rounded-full text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Optional Prompt Banner when guest clicked "Run Audit" */}
        {reasonMessage && (
          <div className="p-3.5 rounded-2xl bg-indigo-50/90 dark:bg-indigo-950/50 border border-indigo-200/80 dark:border-indigo-800/70 flex items-start gap-2.5 text-xs text-indigo-950 dark:text-indigo-200">
            <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{reasonMessage}</span>
          </div>
        )}

        {/* Mode Switcher Tabs */}
        <div
          role="tablist"
          aria-label="Переключение входа и регистрации"
          className="grid grid-cols-2 gap-1 p-1 rounded-2xl bg-slate-100/90 dark:bg-slate-800/90 border border-slate-200/60 dark:border-slate-700/60"
        >
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'login'}
            data-testid="auth-tab-login"
            onClick={() => {
              setMode('login');
              setErrorText(null);
            }}
            className={`min-h-[38px] inline-flex items-center justify-center gap-1.5 px-4 py-1.5 text-xs font-bold rounded-xl transition-all active:scale-95 cursor-pointer ${
              mode === 'login'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Вход</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={mode === 'register'}
            data-testid="auth-tab-register"
            onClick={() => {
              setMode('register');
              setErrorText(null);
            }}
            className={`min-h-[38px] inline-flex items-center justify-center gap-1.5 px-4 py-1.5 text-xs font-bold rounded-xl transition-all active:scale-95 cursor-pointer ${
              mode === 'register'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Регистрация</span>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div>
              <label
                htmlFor="auth-fullname"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Имя или название ИТ-студии
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="auth-fullname"
                  data-testid="auth-fullname-input"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Напр.: BinaryWave Digital Studio"
                  className="w-full min-h-[44px] pl-10 pr-4 py-2 text-xs sm:text-sm font-medium bg-slate-50/90 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500 focus:outline-none transition-colors"
                />
              </div>
            </div>
          )}

          <div>
            <label
              htmlFor="auth-email"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
            >
              Рабочий Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="auth-email"
                data-testid="auth-email-input"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@agency.ru"
                className="w-full min-h-[44px] pl-10 pr-4 py-2 text-xs sm:text-sm font-medium bg-slate-50/90 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500 focus:outline-none transition-colors"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="auth-password"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
            >
              Пароль (минимум 6 символов)
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="auth-password"
                data-testid="auth-password-input"
                type="password"
                required
                minLength={6}
                autoComplete={
                  mode === 'login' ? 'current-password' : 'new-password'
                }
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full min-h-[44px] pl-10 pr-4 py-2 text-xs sm:text-sm font-medium bg-slate-50/90 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500 focus:outline-none transition-colors"
              />
            </div>
          </div>

          {errorText && (
            <div
              role="alert"
              data-testid="auth-error-banner"
              className="p-3 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 flex items-start gap-2 text-xs font-medium text-red-700 dark:text-red-300"
            >
              <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
              <span>{errorText}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            data-testid="auth-submit-btn"
            className="w-full min-h-[46px] inline-flex items-center justify-center gap-2 px-6 py-3 text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-indigo-600 via-violet-600 to-emerald-500 hover:from-indigo-500 hover:to-emerald-400 rounded-2xl shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-60"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>
                  {mode === 'login'
                    ? 'Выполняем вход в Supabase...'
                    : 'Создаем профиль в Supabase...'}
                </span>
              </>
            ) : (
              <>
                <span>
                  {mode === 'login'
                    ? 'Войти в личный кабинет'
                    : 'Зарегистрироваться и начать'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Quick 1-Click Demo Accounts for Instant Verification */}
        <div className="pt-4 border-t border-slate-200/80 dark:border-slate-800 space-y-2.5">
          <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>Быстрый вход в 1 клик (Демо / Тест ролей):</span>
            <span className="font-mono text-[10px] text-indigo-600 dark:text-indigo-400">
              Supabase Auth
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              type="button"
              data-testid="quick-login-user-btn"
              disabled={isLoading}
              onClick={() =>
                handleQuickDemoLogin(
                  'pm@binarywave.studio',
                  'scopeguard2026',
                  'BinaryWave Digital Studio'
                )
              }
              className="p-2.5 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 hover:border-indigo-400 dark:hover:border-indigo-500 text-left transition-all active:scale-95 cursor-pointer"
            >
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>ИТ-Студия (Pro)</span>
              </div>
              <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 truncate mt-0.5">
                pm@binarywave.studio
              </div>
            </button>

            <button
              type="button"
              data-testid="quick-login-admin-btn"
              disabled={isLoading}
              onClick={() =>
                handleQuickDemoLogin(
                  'donatas.jn@gmail.com',
                  'adminscope2026',
                  'Donatas · Lead Architect (Admin)'
                )
              }
              className="p-2.5 rounded-xl border border-indigo-200/90 dark:border-indigo-900/70 bg-indigo-50/50 dark:bg-indigo-950/30 hover:border-indigo-500 text-left transition-all active:scale-95 cursor-pointer"
            >
              <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-950 dark:text-indigo-200">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <span>Разработчик (Admin)</span>
              </div>
              <div className="text-[11px] font-mono text-indigo-700/80 dark:text-indigo-300/80 truncate mt-0.5">
                donatas.jn@gmail.com
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
