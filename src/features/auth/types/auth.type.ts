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
  created_at: string;
  updated_at: string;
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
