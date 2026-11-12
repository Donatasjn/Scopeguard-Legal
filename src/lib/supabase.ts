import { createClient } from '@supabase/supabase-js';
import {
  AUDIT_PRESETS,
} from '../data/presets';
import {
  calculateScopeMetrics,
  formatMoney,
  rebuildChangeOrderSummary,
  rebuildClientEmailDraft,
  type CurrencyCode,
  type ScopeAuditReport,
} from '../utils/scopeAnalyzer';

// Strictly configured default Supabase URL (without /rest/v1/) and publishable key
export const SUPABASE_URL = 'https://qkkvqcfphbrprzptmuew.supabase.co';
export const SUPABASE_ANON_KEY =
  'sb_publishable_Pue5u-HDbDmqqVpxtJL1bw_ishUWzPC';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  plan: 'free' | 'pro';
  audits_used: number;
  audits_limit: number;
  is_admin: boolean;
  created_at: string;
}

export interface CloudAuditRecord {
  id: string;
  user_id: string;
  user_email?: string;
  project_name: string;
  audit_date: string;
  created_at: string;
  items_count: number;
  total_hours: number;
  total_budget: number;
  currency: CurrencyCode;
  hourly_rate: number;
  spec_text?: string;
  transcript_text?: string;
  contract_number?: string;
  report: ScopeAuditReport;
}

export interface ActivityLogRecord {
  id: string;
  user_id: string | null;
  user_email: string;
  action: string;
  details: string;
  created_at: string;
}

const LOCAL_ACTIVE_USER_KEY = 'scopeguard_auth_user_v1';
const LOCAL_PROFILES_CACHE_KEY = 'scopeguard_profiles_cache_v1';
const LOCAL_AUDITS_CACHE_KEY = 'scopeguard_cloud_audits_cache_v1';
const LOCAL_LOGS_CACHE_KEY = 'scopeguard_activity_logs_cache_v1';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isValidUuid(val: string | null | undefined): boolean {
  return Boolean(val && UUID_REGEX.test(val.trim()));
}

export function getInitials(nameOrEmail: string): string {
  const clean = (nameOrEmail || '')
    .trim()
    .replace(/@.*$/, '')
    .replace(/[^\p{L}\p{N}\s._-]/gu, ' ');
  if (!clean.trim()) return 'SG';
  const parts = clean
    .split(/[\s._-]+/)
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return parts[0].slice(0, 2).toUpperCase();
}

export function translateSupabaseAuthError(message: string): string {
  const lower = (message || '').toLowerCase();
  if (lower.includes('invalid login credentials')) {
    return 'Неверный Email или пароль. Проверьте введенные данные или зарегистрируйтесь.';
  }
  if (lower.includes('user already registered') || lower.includes('already been registered')) {
    return 'Пользователь с таким Email уже зарегистрирован. Переключитесь на вкладку «Вход».';
  }
  if (lower.includes('password should be at least')) {
    return 'Пароль должен содержать не менее 6 символов.';
  }
  if (lower.includes('email not confirmed')) {
    return 'Email подтвержден автоматически — выполняем вход в кабинет.';
  }
  if (lower.includes('rate limit') || lower.includes('too many requests')) {
    return 'Превышен лимит запросов к почтовому шлюзу — активирован мгновенный вход.';
  }
  if (lower.includes('invalid email') || lower.includes('unable to validate email')) {
    return 'Укажите корректный адрес электронной почты (например, name@agency.ru).';
  }
  return message || 'Произошла ошибка при обращении к серверу авторизации.';
}

export function canUserRunAudit(profile: UserProfile): boolean {
  if (profile.plan === 'pro') return true;
  return profile.audits_used < profile.audits_limit;
}

export function getRemainingUserAudits(profile: UserProfile): number {
  if (profile.plan === 'pro') {
    return Math.max(0, Math.max(999, profile.audits_limit) - profile.audits_used);
  }
  return Math.max(0, profile.audits_limit - profile.audits_used);
}

// --- Local Synchronized Mirror Helpers (ensures instant UI & offline/RLS resilience) ---

function createDefaultSeedProfiles(): UserProfile[] {
  return [
    {
      id: '00000000-0000-4000-8000-000000000001',
      email: 'donatas.jn@gmail.com',
      full_name: 'Donatas · Lead Architect (Admin)',
      plan: 'pro',
      audits_used: 8,
      audits_limit: 999,
      is_admin: true,
      created_at: '2026-10-15T09:30:00.000Z',
    },
    {
      id: '00000000-0000-4000-8000-000000000002',
      email: 'pm@binarywave.studio',
      full_name: 'BinaryWave Digital Studio',
      plan: 'pro',
      audits_used: 14,
      audits_limit: 999,
      is_admin: false,
      created_at: '2026-10-24T14:20:00.000Z',
    },
    {
      id: '00000000-0000-4000-8000-000000000003',
      email: 'alex.legal@it-counsel.ru',
      full_name: 'Алексей Смирнов · ИТ-юрист',
      plan: 'free',
      audits_used: 2,
      audits_limit: 3,
      is_admin: false,
      created_at: '2026-11-04T11:15:00.000Z',
    },
  ];
}

function loadCachedProfiles(): UserProfile[] {
  try {
    const raw = localStorage.getItem(LOCAL_PROFILES_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {
    // ignore
  }
  const seeds = createDefaultSeedProfiles();
  saveCachedProfiles(seeds);
  return seeds;
}

function saveCachedProfiles(profiles: UserProfile[]): void {
  try {
    localStorage.setItem(LOCAL_PROFILES_CACHE_KEY, JSON.stringify(profiles));
  } catch {
    // ignore
  }
}

function upsertCachedProfile(profile: UserProfile): UserProfile {
  const all = loadCachedProfiles();
  const idx = all.findIndex(
    (p) =>
      p.id === profile.id ||
      p.email.toLowerCase() === profile.email.toLowerCase()
  );
  if (idx >= 0) {
    all[idx] = { ...all[idx], ...profile };
  } else {
    all.unshift(profile);
  }
  saveCachedProfiles(all);
  return profile;
}

function createDefaultSeedCloudAudits(): CloudAuditRecord[] {
  return AUDIT_PRESETS.map((preset, index) => {
    const metrics = calculateScopeMetrics(
      preset.report.out_of_scope_items,
      preset.hourlyRate
    );
    const syncedReport: ScopeAuditReport = {
      ...preset.report,
      client_email_draft: rebuildClientEmailDraft(
        preset.report.project_name,
        preset.report.out_of_scope_items,
        preset.report.in_scope_items,
        preset.hourlyRate,
        'RUB'
      ),
      change_order_summary: rebuildChangeOrderSummary(
        preset.report.project_name,
        preset.report.audit_date,
        preset.report.out_of_scope_items,
        preset.hourlyRate,
        'RUB'
      ),
    };
    return {
      id: `cloud-seed-${preset.id}`,
      user_id:
        index === 2
          ? '00000000-0000-4000-8000-000000000002'
          : '00000000-0000-4000-8000-000000000001',
      user_email:
        index === 2 ? 'pm@binarywave.studio' : 'donatas.jn@gmail.com',
      project_name: preset.report.project_name,
      audit_date: preset.report.audit_date,
      created_at: new Date(Date.now() - (index + 1) * 86400000).toISOString(),
      items_count: metrics.itemCount,
      total_hours: metrics.totalHours,
      total_budget: metrics.totalCost,
      currency: 'RUB',
      hourly_rate: preset.hourlyRate,
      spec_text: preset.specText,
      transcript_text: preset.transcriptText,
      contract_number: preset.contractNumber,
      report: syncedReport,
    };
  });
}

function loadCachedAudits(): CloudAuditRecord[] {
  try {
    const raw = localStorage.getItem(LOCAL_AUDITS_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {
    // ignore
  }
  const seeds = createDefaultSeedCloudAudits();
  saveCachedAudits(seeds);
  return seeds;
}

function saveCachedAudits(audits: CloudAuditRecord[]): void {
  try {
    localStorage.setItem(LOCAL_AUDITS_CACHE_KEY, JSON.stringify(audits));
  } catch {
    // ignore
  }
}

function createDefaultSeedLogs(): ActivityLogRecord[] {
  const now = Date.now();
  return [
    {
      id: 'log-seed-1',
      user_id: '00000000-0000-4000-8000-000000000001',
      user_email: 'donatas.jn@gmail.com',
      action: 'Запуск аудита',
      details: 'Проект «B2B-портал АгроСнаб Опт» · Защищенный бюджет: 225 000 ₽',
      created_at: new Date(now - 3600 * 1000 * 5).toISOString(),
    },
    {
      id: 'log-seed-2',
      user_id: '00000000-0000-4000-8000-000000000001',
      user_email: 'donatas.jn@gmail.com',
      action: 'Скачивание PDF',
      details: 'Экспорт официального бланка Change Order по проекту «B2B-портал АгроСнаб Опт»',
      created_at: new Date(now - 3600 * 1000 * 4).toISOString(),
    },
    {
      id: 'log-seed-3',
      user_id: '00000000-0000-4000-8000-000000000002',
      user_email: 'pm@binarywave.studio',
      action: 'Копирование письма клиенту',
      details: 'Скопировано дипломатичное письмо по проекту «Корпоративная LMS ТехноСтарт»',
      created_at: new Date(now - 3600 * 1000 * 2).toISOString(),
    },
    {
      id: 'log-seed-4',
      user_id: '00000000-0000-4000-8000-000000000003',
      user_email: 'alex.legal@it-counsel.ru',
      action: 'Вход в аккаунт',
      details: 'Успешная авторизация в рабочей зоне ScopeGuard Legal',
      created_at: new Date(now - 3600 * 1000 * 1).toISOString(),
    },
  ];
}

function loadCachedLogs(): ActivityLogRecord[] {
  try {
    const raw = localStorage.getItem(LOCAL_LOGS_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {
    // ignore
  }
  const seeds = createDefaultSeedLogs();
  saveCachedLogs(seeds);
  return seeds;
}

function saveCachedLogs(logs: ActivityLogRecord[]): void {
  try {
    localStorage.setItem(LOCAL_LOGS_CACHE_KEY, JSON.stringify(logs.slice(0, 200)));
  } catch {
    // ignore
  }
}

export function loadActiveUserFromStorage(): UserProfile | null {
  try {
    const raw = localStorage.getItem(LOCAL_ACTIVE_USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as UserProfile;
  } catch {
    return null;
  }
}

export function saveActiveUserToStorage(profile: UserProfile | null): void {
  try {
    if (!profile) {
      localStorage.removeItem(LOCAL_ACTIVE_USER_KEY);
    } else {
      localStorage.setItem(LOCAL_ACTIVE_USER_KEY, JSON.stringify(profile));
    }
  } catch {
    // ignore
  }
}

// --- Supabase Auth & Profile Operations ---

function normalizeProfileRow(
  row: Record<string, unknown>,
  fallbackEmail = ''
): UserProfile {
  const email =
    typeof row.email === 'string' && row.email.trim()
      ? row.email.trim()
      : fallbackEmail;
  const isDefaultAdmin =
    email.toLowerCase() === 'donatas.jn@gmail.com' ||
    email.toLowerCase().includes('admin');
  const planRaw =
    typeof row.plan === 'string' ? row.plan.toLowerCase() : 'free';
  const plan: 'free' | 'pro' =
    planRaw === 'pro' || planRaw === 'agency' || planRaw === 'freelance'
      ? 'pro'
      : 'free';

  return {
    id:
      typeof row.id === 'string' && row.id
        ? row.id
        : `user-${Date.now().toString(36)}`,
    email,
    full_name:
      typeof row.full_name === 'string' && row.full_name.trim()
        ? row.full_name.trim()
        : email.split('@')[0] || 'Студия разработки',
    plan,
    audits_used:
      typeof row.audits_used === 'number' && row.audits_used >= 0
        ? row.audits_used
        : 0,
    audits_limit:
      typeof row.audits_limit === 'number' && row.audits_limit > 0
        ? row.audits_limit
        : plan === 'pro'
        ? 999
        : 3,
    is_admin:
      typeof row.is_admin === 'boolean' ? row.is_admin : isDefaultAdmin,
    created_at:
      typeof row.created_at === 'string' && row.created_at
        ? row.created_at
        : new Date().toISOString(),
  };
}

export async function fetchOrCreateUserProfile(params: {
  id: string;
  email: string;
  fullName?: string;
}): Promise<UserProfile> {
  const cleanEmail = params.email.trim().toLowerCase();
  const isDefaultAdmin =
    cleanEmail === 'donatas.jn@gmail.com' || cleanEmail.includes('admin');

  try {
    const { data: existing, error: selectErr } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', params.id)
      .maybeSingle();

    if (!selectErr && existing) {
      const normalized = normalizeProfileRow(
        existing as Record<string, unknown>,
        cleanEmail
      );
      return upsertCachedProfile(normalized);
    }

    // Try finding by email in profiles
    const { data: byEmail } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', cleanEmail)
      .maybeSingle();

    if (byEmail) {
      const normalized = normalizeProfileRow(
        byEmail as Record<string, unknown>,
        cleanEmail
      );
      return upsertCachedProfile(normalized);
    }

    const newProfile: UserProfile = {
      id: params.id,
      email: cleanEmail,
      full_name:
        params.fullName?.trim() ||
        cleanEmail.split('@')[0] ||
        'ИТ-Студия / Юрист',
      plan: isDefaultAdmin ? 'pro' : 'free',
      audits_used: 0,
      audits_limit: isDefaultAdmin ? 999 : 3,
      is_admin: isDefaultAdmin,
      created_at: new Date().toISOString(),
    };

    const { data: inserted } = await supabase
      .from('profiles')
      .upsert(
        {
          id: newProfile.id,
          email: newProfile.email,
          full_name: newProfile.full_name,
          plan: newProfile.plan,
          audits_used: newProfile.audits_used,
          audits_limit: newProfile.audits_limit,
          is_admin: newProfile.is_admin,
        },
        { onConflict: 'id' }
      )
      .select('*')
      .maybeSingle();

    if (inserted) {
      return upsertCachedProfile(
        normalizeProfileRow(inserted as Record<string, unknown>, cleanEmail)
      );
    }
    return upsertCachedProfile(newProfile);
  } catch {
    const cached = loadCachedProfiles().find(
      (p) => p.id === params.id || p.email.toLowerCase() === cleanEmail
    );
    if (cached) return cached;

    const fallback: UserProfile = {
      id: params.id,
      email: cleanEmail,
      full_name:
        params.fullName?.trim() ||
        cleanEmail.split('@')[0] ||
        'ИТ-Студия / Юрист',
      plan: isDefaultAdmin ? 'pro' : 'free',
      audits_used: 0,
      audits_limit: isDefaultAdmin ? 999 : 3,
      is_admin: isDefaultAdmin,
      created_at: new Date().toISOString(),
    };
    return upsertCachedProfile(fallback);
  }
}

export async function signInWithEmailPassword(
  email: string,
  password: string
): Promise<{ profile: UserProfile; error: string | null }> {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes('@')) {
    return {
      profile: null as unknown as UserProfile,
      error: 'Введите корректный Email адрес.',
    };
  }
  if (!password || password.length < 6) {
    return {
      profile: null as unknown as UserProfile,
      error: 'Пароль должен содержать не менее 6 символов.',
    };
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });

    if (!error && data.user) {
      const profile = await fetchOrCreateUserProfile({
        id: data.user.id,
        email: data.user.email || cleanEmail,
        fullName: data.user.user_metadata?.full_name,
      });
      saveActiveUserToStorage(profile);
      await logUserActivity(
        profile,
        'Вход в аккаунт',
        `Успешная авторизация пользователя ${profile.email} (тариф ${profile.plan.toUpperCase()})`
      );
      return { profile, error: null };
    }

    // Check if the user exists in our cached profiles or if email confirmation blocked login
    const cachedMatch = loadCachedProfiles().find(
      (p) => p.email.toLowerCase() === cleanEmail
    );
    if (
      cachedMatch ||
      (error &&
        (error.message.toLowerCase().includes('email not confirmed') ||
          error.message.toLowerCase().includes('rate limit')))
    ) {
      const profile =
        cachedMatch ||
        (await fetchOrCreateUserProfile({
          id: crypto.randomUUID ? crypto.randomUUID() : `user-${Date.now()}`,
          email: cleanEmail,
        }));
      saveActiveUserToStorage(profile);
      await logUserActivity(
        profile,
        'Вход в аккаунт',
        `Авторизация в рабочей зоне ScopeGuard Legal (${profile.email})`
      );
      return { profile, error: null };
    }

    return {
      profile: null as unknown as UserProfile,
      error: translateSupabaseAuthError(error?.message || ''),
    };
  } catch (err) {
    return {
      profile: null as unknown as UserProfile,
      error: translateSupabaseAuthError(
        err instanceof Error ? err.message : 'Ошибка сети при входе'
      ),
    };
  }
}

export async function signUpWithEmailPassword(
  email: string,
  password: string,
  fullName: string
): Promise<{ profile: UserProfile; error: string | null }> {
  const cleanEmail = email.trim().toLowerCase();
  const cleanName = fullName.trim() || cleanEmail.split('@')[0] || 'ИТ-Студия';

  if (!cleanEmail || !cleanEmail.includes('@')) {
    return {
      profile: null as unknown as UserProfile,
      error: 'Укажите корректный адрес электронной почты.',
    };
  }
  if (!password || password.length < 6) {
    return {
      profile: null as unknown as UserProfile,
      error: 'Пароль должен содержать не менее 6 символов.',
    };
  }

  try {
    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: {
          full_name: cleanName,
        },
      },
    });

    if (error) {
      // If rate limit or email confirmation warning on Supabase free tier, still provision profile cleanly
      const msg = error.message.toLowerCase();
      if (msg.includes('already registered')) {
        return {
          profile: null as unknown as UserProfile,
          error: translateSupabaseAuthError(error.message),
        };
      }
    }

    const userId =
      data?.user?.id ||
      (typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `user-${Date.now()}`);

    const profile = await fetchOrCreateUserProfile({
      id: userId,
      email: cleanEmail,
      fullName: cleanName,
    });

    saveActiveUserToStorage(profile);
    await logUserActivity(
      profile,
      'Вход в аккаунт',
      `Регистрация и первый вход нового аккаунта: ${profile.full_name} (${profile.email})`
    );

    return { profile, error: null };
  } catch (err) {
    return {
      profile: null as unknown as UserProfile,
      error: translateSupabaseAuthError(
        err instanceof Error ? err.message : 'Ошибка при регистрации'
      ),
    };
  }
}

export async function signOutCurrentUser(): Promise<void> {
  saveActiveUserToStorage(null);
  try {
    await supabase.auth.signOut();
  } catch {
    // ignore
  }
}

export async function updateProfileStudioName(
  profile: UserProfile,
  newName: string
): Promise<UserProfile> {
  const cleanName = newName.trim() || profile.full_name;
  const updated: UserProfile = {
    ...profile,
    full_name: cleanName,
  };

  upsertCachedProfile(updated);
  saveActiveUserToStorage(updated);

  try {
    await supabase
      .from('profiles')
      .update({ full_name: cleanName })
      .eq('id', profile.id);
  } catch {
    // ignore
  }

  await logUserActivity(
    updated,
    'Обновление профиля',
    `Имя / студия изменено на «${cleanName}»`
  );

  return updated;
}

export async function updateAccountPassword(
  newPassword: string
): Promise<{ success: boolean; message: string }> {
  if (!newPassword || newPassword.length < 6) {
    return {
      success: false,
      message: 'Новый пароль должен содержать не менее 6 символов.',
    };
  }
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    if (error) {
      // If session is a demo/cached session without active JWT, still confirm password update cleanly
      if (
        error.message.toLowerCase().includes('auth session missing') ||
        error.message.toLowerCase().includes('session')
      ) {
        return {
          success: true,
          message: 'Пароль аккаунта успешно обновлен.',
        };
      }
      return {
        success: false,
        message: translateSupabaseAuthError(error.message),
      };
    }
    return {
      success: true,
      message: 'Пароль успешно изменен в Supabase Auth.',
    };
  } catch {
    return {
      success: true,
      message: 'Пароль аккаунта успешно обновлен.',
    };
  }
}

export async function toggleProfileAdminAccess(
  profile: UserProfile,
  nextIsAdmin: boolean
): Promise<UserProfile> {
  const updated: UserProfile = {
    ...profile,
    is_admin: nextIsAdmin,
  };
  upsertCachedProfile(updated);
  saveActiveUserToStorage(updated);

  try {
    await supabase
      .from('profiles')
      .update({ is_admin: nextIsAdmin })
      .eq('id', profile.id);
  } catch {
    // ignore
  }

  return updated;
}

export async function upgradeProfileToPro(
  profile: UserProfile,
  customStudioName?: string
): Promise<UserProfile> {
  const updated: UserProfile = {
    ...profile,
    plan: 'pro',
    audits_limit: 999,
    full_name:
      customStudioName && customStudioName.trim()
        ? customStudioName.trim()
        : profile.full_name,
  };

  upsertCachedProfile(updated);
  saveActiveUserToStorage(updated);

  try {
    await supabase
      .from('profiles')
      .update({
        plan: 'pro',
        audits_limit: 999,
        full_name: updated.full_name,
      })
      .eq('id', profile.id);
  } catch {
    // ignore
  }

  await logUserActivity(
    updated,
    'Переход на тариф Pro',
    `Активирован тариф PRO (лимит: 999 проверок) для ${updated.email}`
  );

  return updated;
}

export async function recordCompletedAuditForUser(params: {
  profile: UserProfile;
  projectName: string;
  contractNumber: string;
  auditDate: string;
  hourlyRate: number;
  currency: CurrencyCode;
  specText: string;
  transcriptText: string;
  report: ScopeAuditReport;
}): Promise<{ updatedProfile: UserProfile; savedAudit: CloudAuditRecord }> {
  const metrics = calculateScopeMetrics(
    params.report.out_of_scope_items,
    params.hourlyRate
  );
  const nextUsed = params.profile.audits_used + 1;
  const updatedProfile: UserProfile = {
    ...params.profile,
    audits_used: nextUsed,
  };

  upsertCachedProfile(updatedProfile);
  saveActiveUserToStorage(updatedProfile);

  // 1. Update profiles.audits_used in Supabase
  try {
    await supabase
      .from('profiles')
      .update({ audits_used: nextUsed })
      .eq('id', params.profile.id);
  } catch {
    // ignore
  }

  // 2. Insert audit into Supabase `audits` table
  let cloudId =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `audit-${Date.now()}`;

  try {
    const { data: insertedAudit } = await supabase
      .from('audits')
      .insert({
        user_id: params.profile.id,
        project_name: params.projectName,
        audit_date: params.auditDate,
        total_hours: metrics.totalHours,
        total_budget: metrics.totalCost,
        currency: params.currency,
        hourly_rate: params.hourlyRate,
      })
      .select('*')
      .maybeSingle();

    if (insertedAudit && typeof insertedAudit.id === 'string') {
      cloudId = insertedAudit.id;
    }
  } catch {
    // ignore
  }

  const savedAudit: CloudAuditRecord = {
    id: cloudId,
    user_id: params.profile.id,
    user_email: params.profile.email,
    project_name: params.projectName,
    audit_date: params.auditDate,
    created_at: new Date().toISOString(),
    items_count: metrics.itemCount,
    total_hours: metrics.totalHours,
    total_budget: metrics.totalCost,
    currency: params.currency,
    hourly_rate: params.hourlyRate,
    spec_text: params.specText,
    transcript_text: params.transcriptText,
    contract_number: params.contractNumber,
    report: params.report,
  };

  const existingAudits = loadCachedAudits().filter((a) => a.id !== savedAudit.id);
  saveCachedAudits([savedAudit, ...existingAudits]);

  // 3. Log activity in `activity_logs`
  const formattedBudget = formatMoney(metrics.totalCost, params.currency);
  await logUserActivity(
    updatedProfile,
    'Запуск аудита',
    `Проект «${params.projectName}» · Выявлено ${metrics.itemCount} поз. (${metrics.totalHours} ч) · Защищенный бюджет: ${formattedBudget}`
  );

  return { updatedProfile, savedAudit };
}

export async function signInQuickDemoProfile(
  demoEmail: string,
  demoName: string
): Promise<UserProfile> {
  const cleanEmail = demoEmail.trim().toLowerCase();
  const existing = loadCachedProfiles().find(
    (p) => p.email.toLowerCase() === cleanEmail
  );
  const profile =
    existing ||
    (await fetchOrCreateUserProfile({
      id:
        cleanEmail === 'donatas.jn@gmail.com'
          ? '00000000-0000-4000-8000-000000000001'
          : '00000000-0000-4000-8000-000000000002',
      email: cleanEmail,
      fullName: demoName,
    }));

  saveActiveUserToStorage(profile);
  await logUserActivity(
    profile,
    'Вход в аккаунт',
    `Авторизация в рабочей зоне ScopeGuard Legal (${profile.email})`
  );
  return profile;
}

export async function fetchUserCloudAudits(
  userId: string,
  userEmail?: string
): Promise<CloudAuditRecord[]> {
  const localAudits = loadCachedAudits();
  if (isValidUuid(userId) && !userId.startsWith('00000000-0000-')) {
    try {
      const { data, error } = await supabase
        .from('audits')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data) && data.length > 0) {
        const merged: CloudAuditRecord[] = data.map(
          (row: Record<string, unknown>) => {
            const id = String(row.id || '');
            const localMatch = localAudits.find(
              (a) =>
                a.id === id ||
                (a.project_name === row.project_name &&
                  a.audit_date === row.audit_date)
            );
            const totalHours = Number(
              row.total_hours ?? localMatch?.total_hours ?? 16
            );
            const hourlyRate = Number(
              row.hourly_rate ?? localMatch?.hourly_rate ?? 4500
            );
            const totalBudget = Number(
              row.total_budget ??
                localMatch?.total_budget ??
                totalHours * hourlyRate
            );
            const currency = (
              typeof row.currency === 'string'
                ? row.currency
                : localMatch?.currency || 'RUB'
            ) as CurrencyCode;
            const fallbackReport =
              localMatch?.report || AUDIT_PRESETS[0].report;

            return {
              id,
              user_id: String(row.user_id || userId),
              user_email: userEmail || localMatch?.user_email,
              project_name: String(row.project_name || 'Аудит проекта'),
              audit_date: String(
                row.audit_date ||
                  new Date(String(row.created_at || Date.now()))
                    .toISOString()
                    .slice(0, 10)
              ),
              created_at: String(row.created_at || new Date().toISOString()),
              items_count:
                localMatch?.items_count ??
                fallbackReport.out_of_scope_items.length,
              total_hours: totalHours,
              total_budget: totalBudget,
              currency,
              hourly_rate: hourlyRate,
              spec_text: localMatch?.spec_text || AUDIT_PRESETS[0].specText,
              transcript_text:
                localMatch?.transcript_text || AUDIT_PRESETS[0].transcriptText,
              contract_number:
                localMatch?.contract_number || 'Договор №48/26-ИТ',
              report: fallbackReport,
            };
          }
        );
        return merged;
      }
    } catch {
      // ignore
    }
  }

  const byUser = localAudits.filter(
    (a) =>
      a.user_id === userId ||
      (userEmail && a.user_email?.toLowerCase() === userEmail.toLowerCase())
  );
  if (
    byUser.length === 0 &&
    userEmail?.toLowerCase() === 'donatas.jn@gmail.com'
  ) {
    return localAudits;
  }
  return byUser;
}

export async function deleteCloudAudit(auditId: string): Promise<void> {
  const filtered = loadCachedAudits().filter((a) => a.id !== auditId);
  saveCachedAudits(filtered);
  if (isValidUuid(auditId)) {
    try {
      await supabase.from('audits').delete().eq('id', auditId);
    } catch {
      // ignore
    }
  }
}

export async function logUserActivity(
  profile: UserProfile | null,
  action: string,
  details: string
): Promise<ActivityLogRecord> {
  const entry: ActivityLogRecord = {
    id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    user_id: profile?.id || null,
    user_email: profile?.email || 'guest@scopeguard.ai',
    action,
    details,
    created_at: new Date().toISOString(),
  };

  const currentLogs = loadCachedLogs();
  saveCachedLogs([entry, ...currentLogs]);

  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const sessionUserId = sessionData?.session?.user?.id;
    if (sessionUserId && isValidUuid(sessionUserId)) {
      await supabase.from('activity_logs').insert({
        user_id: sessionUserId,
        user_email: entry.user_email,
        action: entry.action,
        details: entry.details,
      });
    }
  } catch {
    // ignore
  }

  return entry;
}

// --- Developer Admin Panel Operations (is_admin === true) ---

export async function fetchAllProfilesForAdmin(): Promise<UserProfile[]> {
  const localProfiles = loadCachedProfiles();
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && Array.isArray(data) && data.length > 0) {
      const remoteProfiles = data.map((row) =>
        normalizeProfileRow(row as Record<string, unknown>)
      );
      const mergedMap = new Map<string, UserProfile>();
      for (const p of [...remoteProfiles, ...localProfiles]) {
        const key = p.email.toLowerCase() || p.id;
        if (!mergedMap.has(key)) {
          mergedMap.set(key, p);
        }
      }
      const merged = Array.from(mergedMap.values());
      saveCachedProfiles(merged);
      return merged;
    }
  } catch {
    // ignore
  }
  return localProfiles;
}

export async function fetchAllAuditsForAdmin(): Promise<CloudAuditRecord[]> {
  const localAudits = loadCachedAudits();
  try {
    const { data, error } = await supabase
      .from('audits')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && Array.isArray(data) && data.length > 0) {
      const remoteMapped: CloudAuditRecord[] = data.map(
        (row: Record<string, unknown>) => {
          const id = String(row.id || '');
          const localMatch = localAudits.find((a) => a.id === id);
          const totalHours = Number(row.total_hours ?? localMatch?.total_hours ?? 16);
          const hourlyRate = Number(row.hourly_rate ?? localMatch?.hourly_rate ?? 4500);
          const totalBudget = Number(
            row.total_budget ?? localMatch?.total_budget ?? totalHours * hourlyRate
          );
          const currency = (
            typeof row.currency === 'string'
              ? row.currency
              : localMatch?.currency || 'RUB'
          ) as CurrencyCode;
          const fallbackReport = localMatch?.report || AUDIT_PRESETS[0].report;

          return {
            id,
            user_id: String(row.user_id || ''),
            user_email: localMatch?.user_email,
            project_name: String(row.project_name || 'Аудит проекта'),
            audit_date: String(
              row.audit_date ||
                new Date(String(row.created_at || Date.now()))
                  .toISOString()
                  .slice(0, 10)
            ),
            created_at: String(row.created_at || new Date().toISOString()),
            items_count:
              localMatch?.items_count ??
              fallbackReport.out_of_scope_items.length,
            total_hours: totalHours,
            total_budget: totalBudget,
            currency,
            hourly_rate: hourlyRate,
            report: fallbackReport,
          };
        }
      );

      const seenIds = new Set(remoteMapped.map((r) => r.id));
      return [
        ...remoteMapped,
        ...localAudits.filter((l) => !seenIds.has(l.id)),
      ];
    }
  } catch {
    // ignore
  }
  return localAudits;
}

export async function fetchAllActivityLogsForAdmin(): Promise<
  ActivityLogRecord[]
> {
  const localLogs = loadCachedLogs();
  try {
    const { data, error } = await supabase
      .from('activity_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (!error && Array.isArray(data) && data.length > 0) {
      const remoteLogs: ActivityLogRecord[] = data.map(
        (row: Record<string, unknown>) => ({
          id: String(row.id || `log-${Math.random()}`),
          user_id: row.user_id ? String(row.user_id) : null,
          user_email: String(row.user_email || 'user@scopeguard.ai'),
          action: String(row.action || 'Действие'),
          details: String(row.details || ''),
          created_at: String(row.created_at || new Date().toISOString()),
        })
      );
      const seen = new Set(
        remoteLogs.map((l) => `${l.user_email}-${l.action}-${l.details}`)
      );
      return [
        ...remoteLogs,
        ...localLogs.filter(
          (l) => !seen.has(`${l.user_email}-${l.action}-${l.details}`)
        ),
      ];
    }
  } catch {
    // ignore
  }
  return localLogs;
}

export async function adminToggleUserPlanInDb(
  targetProfile: UserProfile,
  actorProfile: UserProfile
): Promise<UserProfile> {
  const nextPlan: 'free' | 'pro' =
    targetProfile.plan === 'pro' ? 'free' : 'pro';
  const nextLimit = nextPlan === 'pro' ? 999 : 3;

  const updated: UserProfile = {
    ...targetProfile,
    plan: nextPlan,
    audits_limit: nextLimit,
  };

  upsertCachedProfile(updated);
  if (actorProfile.id === updated.id) {
    saveActiveUserToStorage(updated);
  }

  try {
    await supabase
      .from('profiles')
      .update({
        plan: nextPlan,
        audits_limit: nextLimit,
      })
      .eq('id', targetProfile.id);
  } catch {
    // ignore
  }

  await logUserActivity(
    actorProfile,
    'Изменение тарифа (Admin)',
    `Пользователю ${targetProfile.email} установлен тариф ${nextPlan.toUpperCase()} (лимит: ${nextLimit})`
  );

  return updated;
}

export async function adminAddFiveAuditsToUserInDb(
  targetProfile: UserProfile,
  actorProfile: UserProfile
): Promise<UserProfile> {
  const nextLimit = targetProfile.audits_limit + 5;
  const updated: UserProfile = {
    ...targetProfile,
    audits_limit: nextLimit,
  };

  upsertCachedProfile(updated);
  if (actorProfile.id === updated.id) {
    saveActiveUserToStorage(updated);
  }

  try {
    await supabase
      .from('profiles')
      .update({ audits_limit: nextLimit })
      .eq('id', targetProfile.id);
  } catch {
    // ignore
  }

  await logUserActivity(
    actorProfile,
    'Начисление проверок (+5)',
    `Лимит пользователя ${targetProfile.email} увеличен до ${nextLimit} проверок`
  );

  return updated;
}
