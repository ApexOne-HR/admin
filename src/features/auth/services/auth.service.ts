import { ApiError, apiRequest } from '@/infra/http/apiClient';
import type { AdminSession, AdminUser, LoginCredentials, LoginResponseData } from '../types/auth.type';

const SESSION_STORAGE_KEY = 'apex-hr-admin-session';

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

export function getAuthErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 422 && error.body?.errors) {
      const firstFieldErrors = Object.values(error.body.errors)[0];
      if (firstFieldErrors?.[0]) {
        return firstFieldErrors[0];
      }
    }

    if (error.status === 429) {
      return 'Too many login attempts. Please wait and try again.';
    }

    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Unable to sign in';
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
  if (!user?.role?.is_active) {
    return false;
  }

  return Boolean(user.role.permissions?.some((item) => item.slug === permission));
}

export function canAny(user: AdminUser | null | undefined, permissions: string[]): boolean {
  return permissions.some((permission) => can(user, permission));
}
