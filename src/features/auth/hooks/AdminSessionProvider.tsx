import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { ApiError } from '@/infra/http/apiClient';
import {
  clearStoredAdminSession,
  fetchCurrentUser,
  getStoredAdminSession,
  loginWithCredentials,
  logoutAdmin,
  saveStoredAdminSession,
} from '../services/auth.service';
import type { AdminSession, AuthStatus, LoginCredentials } from '../types/auth.type';
import { AdminSessionContext, type AdminSessionContextValue } from './adminSession.context';

type AdminSessionState = {
  session: AdminSession | null;
  status: AuthStatus;
};

type AdminSessionProviderProps = {
  children: ReactNode;
};

export function AdminSessionProvider({ children }: AdminSessionProviderProps) {
  const [state, setState] = useState<AdminSessionState>({
    session: null,
    status: 'loading',
  });

  useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      const stored = getStoredAdminSession();

      if (!stored) {
        if (!cancelled) {
          setState({ session: null, status: 'unauthenticated' });
        }
        return;
      }

      try {
        const user = await fetchCurrentUser(stored.accessToken);
        if (cancelled) {
          return;
        }

        const session: AdminSession = {
          accessToken: stored.accessToken,
          user,
        };
        saveStoredAdminSession(session);
        setState({ session, status: 'authenticated' });
      } catch (error) {
        clearStoredAdminSession();
        if (!cancelled) {
          setState({ session: null, status: 'unauthenticated' });
        }

        if (!(error instanceof ApiError && (error.status === 401 || error.status === 403))) {
          console.error(error);
        }
      }
    }

    void restoreSession();

    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (credentials: LoginCredentials) => {
    const nextSession = await loginWithCredentials(credentials);
    setState({
      session: nextSession,
      status: 'authenticated',
    });
  }, []);

  const logout = useCallback(async () => {
    await logoutAdmin(state.session?.accessToken ?? null);
    setState({
      session: null,
      status: 'unauthenticated',
    });
  }, [state.session?.accessToken]);

  const value = useMemo<AdminSessionContextValue>(
    () => ({
      session: state.session,
      status: state.status,
      isAuthenticated: state.status === 'authenticated' && state.session !== null,
      token: state.session?.accessToken ?? null,
      login,
      logout,
    }),
    [login, logout, state.session, state.status],
  );

  return <AdminSessionContext.Provider value={value}>{children}</AdminSessionContext.Provider>;
}
