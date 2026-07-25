export type Permission = {
  id: number;
  name: string;
  slug: string;
  group: string;
  description: string | null;
};

export type Role = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  is_active: boolean;
  permissions?: Permission[];
  created_at: string;
  updated_at: string;
};

export type AdminUser = {
  id: number;
  name: string;
  email: string;
  roles: Role[];
  data_scope?: DataScope;
  created_at: string;
  updated_at: string;
};

export type DataScopeEntry = {
  id?: number;
  company_id: number;
  division_id: number | null;
  company?: { id: number; name: string; code: string } | null;
  division?: { id: number; name: string; code: string } | null;
};

export type DataScope = {
  is_global: boolean;
  scopes: DataScopeEntry[];
};

export type AdminSession = {
  user: AdminUser;
  accessToken: string;
};

export type LoginCredentials = {
  email: string;
  password: string;
};

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

export type LoginResponseData = {
  token: string;
  token_type: string;
  user: AdminUser;
};
