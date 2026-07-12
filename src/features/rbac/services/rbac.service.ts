import { apiRequest } from '@/infra/http/apiClient';
import type { AdminUser, Permission, Role } from '@/features/auth/types/auth.type';
import type {
  AssignUserRolePayload,
  CreateRolePayload,
  PaginatedMeta,
  SyncRolePermissionsPayload,
  UpdateRolePayload,
} from '../types/rbac.type';

export async function listRoles(token: string) {
  const response = await apiRequest<Role[]>('/roles', { token });
  return response.data;
}

export async function getRole(token: string, roleId: number) {
  const response = await apiRequest<Role>(`/roles/${roleId}`, { token });
  return response.data;
}

export async function createRole(token: string, payload: CreateRolePayload) {
  const response = await apiRequest<Role>('/roles', {
    method: 'POST',
    token,
    body: payload,
  });
  return response.data;
}

export async function updateRole(token: string, roleId: number, payload: UpdateRolePayload) {
  const response = await apiRequest<Role>(`/roles/${roleId}`, {
    method: 'PUT',
    token,
    body: payload,
  });
  return response.data;
}

export async function deleteRole(token: string, roleId: number) {
  await apiRequest<null>(`/roles/${roleId}`, {
    method: 'DELETE',
    token,
  });
}

export async function syncRolePermissions(
  token: string,
  roleId: number,
  payload: SyncRolePermissionsPayload,
) {
  const response = await apiRequest<Role>(`/roles/${roleId}/permissions`, {
    method: 'PUT',
    token,
    body: payload,
  });
  return response.data;
}

export async function listPermissions(token: string, group?: string) {
  const response = await apiRequest<Permission[]>('/permissions', {
    token,
    query: { group },
  });
  return response.data;
}

export async function listUsers(token: string, page = 1, perPage = 15) {
  const response = await apiRequest<AdminUser[]>('/users', {
    token,
    query: { page, per_page: perPage },
  });

  return {
    users: response.data,
    meta: response.meta as PaginatedMeta,
  };
}

export async function assignUserRole(
  token: string,
  userId: number,
  payload: AssignUserRolePayload,
) {
  const response = await apiRequest<AdminUser>(`/users/${userId}/role`, {
    method: 'PUT',
    token,
    body: payload,
  });
  return response.data;
}
