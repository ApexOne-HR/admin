import { createContext } from 'react';
import type { AdminSession, AuthStatus, LoginCredentials } from '../types/auth.type';

export type AdminSessionContextValue = {
  session: AdminSession | null;
  status: AuthStatus;
  isAuthenticated: boolean;
  token: string | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

export const AdminSessionContext = createContext<AdminSessionContextValue | null>(null);
