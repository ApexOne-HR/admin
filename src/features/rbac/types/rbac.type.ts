export type {
  Permission,
  Role,
  AdminUser as RbacUser,
} from '@/features/auth/types/auth.type';

export type CreateRolePayload = {
  name: string;
  slug?: string;
  description?: string;
  is_active?: boolean;
};

export type UpdateRolePayload = {
  name?: string;
  slug?: string;
  description?: string | null;
  is_active?: boolean;
};

export type SyncRolePermissionsPayload = {
  permission_ids: number[];
};

export type AssignUserRolePayload = {
  role_id: number;
};

export type PaginatedMeta = {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
};
