import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAdminSession } from '@/features/auth/hooks/useAdminSession';
import * as rbacService from '../services/rbac.service';
import type {
  SyncUserRolesPayload,
  SyncUserOrganizationScopesPayload,
  CreateRolePayload,
  SyncRolePermissionsPayload,
  UpdateRolePayload,
} from '../types/rbac.type';

export const rbacKeys = {
  roles: ['admin', 'roles'] as const,
  role: (id: number) => ['admin', 'roles', id] as const,
  permissions: (group?: string) => ['admin', 'permissions', group ?? 'all'] as const,
  users: (page: number, perPage: number) => ['admin', 'users', { page, perPage }] as const,
};

function requireToken(token: string | null): string {
  if (!token) {
    throw new Error('Missing admin session token');
  }
  return token;
}

export function useRolesQuery(enabled = true) {
  const { token } = useAdminSession();

  return useQuery({
    queryKey: rbacKeys.roles,
    enabled: enabled && Boolean(token),
    queryFn: () => rbacService.listRoles(requireToken(token)),
  });
}

export function usePermissionsQuery(group?: string, enabled = true) {
  const { token } = useAdminSession();

  return useQuery({
    queryKey: rbacKeys.permissions(group),
    enabled: enabled && Boolean(token),
    queryFn: () => rbacService.listPermissions(requireToken(token), group),
  });
}

export function useUsersQuery(page = 1, perPage = 15, enabled = true) {
  const { token } = useAdminSession();

  return useQuery({
    queryKey: rbacKeys.users(page, perPage),
    enabled: enabled && Boolean(token),
    queryFn: () => rbacService.listUsers(requireToken(token), page, perPage),
  });
}

export function useCreateRoleMutation() {
  const { token } = useAdminSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateRolePayload) =>
      rbacService.createRole(requireToken(token), payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: rbacKeys.roles });
    },
  });
}

export function useUpdateRoleMutation() {
  const { token } = useAdminSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ roleId, payload }: { roleId: number; payload: UpdateRolePayload }) =>
      rbacService.updateRole(requireToken(token), roleId, payload),
    onSuccess: async (role) => {
      await queryClient.invalidateQueries({ queryKey: rbacKeys.roles });
      await queryClient.invalidateQueries({ queryKey: rbacKeys.role(role.id) });
    },
  });
}

export function useDeleteRoleMutation() {
  const { token } = useAdminSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (roleId: number) => rbacService.deleteRole(requireToken(token), roleId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: rbacKeys.roles });
    },
  });
}

export function useSyncRolePermissionsMutation() {
  const { token } = useAdminSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      roleId,
      payload,
    }: {
      roleId: number;
      payload: SyncRolePermissionsPayload;
    }) => rbacService.syncRolePermissions(requireToken(token), roleId, payload),
    onSuccess: async (role) => {
      await queryClient.invalidateQueries({ queryKey: rbacKeys.roles });
      await queryClient.invalidateQueries({ queryKey: rbacKeys.role(role.id) });
    },
  });
}

export function useSyncUserRolesMutation() {
  const { token } = useAdminSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, payload }: { userId: number; payload: SyncUserRolesPayload }) =>
      rbacService.syncUserRoles(requireToken(token), userId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });
}

export function useSyncUserOrganizationScopesMutation() {
  const { token } = useAdminSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userId,
      payload,
    }: {
      userId: number;
      payload: SyncUserOrganizationScopesPayload;
    }) => rbacService.syncUserOrganizationScopes(requireToken(token), userId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });
}
