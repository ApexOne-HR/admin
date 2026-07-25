import { apiRequest } from '@/infra/http/apiClient';
import type { AdminSession, AdminUser, LoginCredentials, LoginResponseData } from '../types/auth.type';

const SESSION_STORAGE_KEY = 'apex-hr-admin-session';

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

export function getStoredAdminSession(): AdminSession | null {
  if (!canUseStorage()) {
    return null;
  }

  const rawSession = window.localStorage.getItem(SESSION_STORAGE_KEY);
  if (!rawSession) {
    return null;
  }

  try {
    const session = JSON.parse(rawSession) as AdminSession;
    if (!session?.accessToken || !session?.user?.id) {
      clearStoredAdminSession();
      return null;
    }
    return session;
  } catch {
    clearStoredAdminSession();
    return null;
  }
}

export function saveStoredAdminSession(session: AdminSession) {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
}

export function clearStoredAdminSession() {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.removeItem(SESSION_STORAGE_KEY);
}

export async function loginWithCredentials(credentials: LoginCredentials): Promise<AdminSession> {
  const response = await apiRequest<LoginResponseData>('/auth/login', {
    method: 'POST',
    body: {
      email: credentials.email.trim().toLowerCase(),
      password: credentials.password,
    },
  });

  const session: AdminSession = {
    accessToken: response.data.token,
    user: response.data.user,
  };

  saveStoredAdminSession(session);
  return session;
}

export async function fetchCurrentUser(token: string): Promise<AdminUser> {
  const response = await apiRequest<AdminUser>('/auth/me', { token });
  return response.data;
}

export async function logoutAdmin(token: string | null): Promise<void> {
  if (token) {
    try {
      await apiRequest<null>('/auth/logout', { method: 'POST', token });
    } catch {
      // Always clear local session even if API logout fails
    }
  }

  clearStoredAdminSession();
}

export function can(user: AdminUser | null | undefined, permission: string): boolean {
  if (!user?.roles?.length) {
    return false;
  }

  return user.roles.some(
    (role) => role.is_active && role.permissions?.some((item) => item.slug === permission),
  );
}

/** Global org/employee data access (Phase 3). */
export function isGlobalScope(user: AdminUser | null | undefined): boolean {
  if (!user) {
    return false;
  }

  if (user.data_scope?.is_global) {
    return true;
  }

  return (
    can(user, 'employees.view_all_companies') || can(user, 'organizations.view_all')
  );
}
