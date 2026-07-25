import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAdminSession } from '@/features/auth/hooks/useAdminSession';
import * as leaveService from '../services/leave.service';
import type { LeavePackagePayload, LeaveTypePayload } from '../types/leave.type';

export const leaveKeys = {
  types: (companyId?: number) => ['admin', 'leave-types', { companyId }] as const,
  packages: (companyId?: number) => ['admin', 'leave-packages', { companyId }] as const,
};

function requireToken(token: string | null): string {
  if (!token) {
    throw new Error('Missing admin session token');
  }
  return token;
}

export function useLeaveTypesQuery(companyId?: number, enabled = true) {
  const { token } = useAdminSession();
  return useQuery({
    queryKey: leaveKeys.types(companyId),
    enabled: enabled && Boolean(token),
    queryFn: () => leaveService.listLeaveTypes(requireToken(token), companyId),
  });
}

export function useLeavePackagesQuery(companyId?: number, enabled = true) {
  const { token } = useAdminSession();
  return useQuery({
    queryKey: leaveKeys.packages(companyId),
    enabled: enabled && Boolean(token),
    queryFn: () => leaveService.listLeavePackages(requireToken(token), companyId),
  });
}

export function useCreateLeaveTypeMutation() {
  const { token } = useAdminSession();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: LeaveTypePayload) =>
      leaveService.createLeaveType(requireToken(token), payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'leave-types'] });
    },
  });
}

export function useUpdateLeaveTypeMutation() {
  const { token } = useAdminSession();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<LeaveTypePayload> }) =>
      leaveService.updateLeaveType(requireToken(token), id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'leave-types'] });
    },
  });
}

export function useDeleteLeaveTypeMutation() {
  const { token } = useAdminSession();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => leaveService.deleteLeaveType(requireToken(token), id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'leave-types'] });
    },
  });
}

export function useCreateLeavePackageMutation() {
  const { token } = useAdminSession();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: LeavePackagePayload) =>
      leaveService.createLeavePackage(requireToken(token), payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'leave-packages'] });
    },
  });
}

export function useUpdateLeavePackageMutation() {
  const { token } = useAdminSession();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<LeavePackagePayload> }) =>
      leaveService.updateLeavePackage(requireToken(token), id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'leave-packages'] });
    },
  });
}

export function useDeleteLeavePackageMutation() {
  const { token } = useAdminSession();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => leaveService.deleteLeavePackage(requireToken(token), id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'leave-packages'] });
    },
  });
}
