import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAdminSession } from '@/features/auth/hooks/useAdminSession';
import * as extensionService from '../services/employee-extension.service';
import type {
  AttachmentCategory,
  EmployeeAssetPayload,
  EmployeeBankDraft,
  EmployeeEducationDraft,
  EmployeeEmergencyContactDraft,
} from '../types/employee-extension.type';
import { employeeKeys } from './useEmployeeQueries';

export const employeeExtensionKeys = {
  banks: (employeeId: number) => ['admin', 'employees', employeeId, 'banks'] as const,
  contacts: (employeeId: number) =>
    ['admin', 'employees', employeeId, 'emergency-contacts'] as const,
  educations: (employeeId: number) =>
    ['admin', 'employees', employeeId, 'educations'] as const,
  allocations: (employeeId: number, fiscalYearId?: number) =>
    ['admin', 'employees', employeeId, 'leave-allocations', { fiscalYearId }] as const,
  attachments: (employeeId: number) =>
    ['admin', 'employees', employeeId, 'attachments'] as const,
  assets: (employeeId: number) =>
    ['admin', 'employees', employeeId, 'assets'] as const,
};

function requireToken(token: string | null): string {
  if (!token) {
    throw new Error('Missing admin session token');
  }
  return token;
}

export function useEmployeeBanksQuery(employeeId: number, enabled = true) {
  const { token } = useAdminSession();
  return useQuery({
    queryKey: employeeExtensionKeys.banks(employeeId),
    enabled: enabled && Boolean(token) && Boolean(employeeId),
    queryFn: () => extensionService.listEmployeeBanks(requireToken(token), employeeId),
  });
}

export function useSyncEmployeeBanksMutation(employeeId: number) {
  const { token } = useAdminSession();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (banks: EmployeeBankDraft[]) =>
      extensionService.syncEmployeeBanks(requireToken(token), employeeId, banks),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: employeeExtensionKeys.banks(employeeId) });
      await queryClient.invalidateQueries({ queryKey: employeeKeys.detail(employeeId) });
    },
  });
}

export function useEmployeeEmergencyContactsQuery(employeeId: number, enabled = true) {
  const { token } = useAdminSession();
  return useQuery({
    queryKey: employeeExtensionKeys.contacts(employeeId),
    enabled: enabled && Boolean(token) && Boolean(employeeId),
    queryFn: () =>
      extensionService.listEmployeeEmergencyContacts(requireToken(token), employeeId),
  });
}

export function useSyncEmployeeEmergencyContactsMutation(employeeId: number) {
  const { token } = useAdminSession();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (contacts: EmployeeEmergencyContactDraft[]) =>
      extensionService.syncEmployeeEmergencyContacts(requireToken(token), employeeId, contacts),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: employeeExtensionKeys.contacts(employeeId),
      });
      await queryClient.invalidateQueries({ queryKey: employeeKeys.detail(employeeId) });
    },
  });
}

export function useEmployeeEducationsQuery(employeeId: number, enabled = true) {
  const { token } = useAdminSession();
  return useQuery({
    queryKey: employeeExtensionKeys.educations(employeeId),
    enabled: enabled && Boolean(token) && Boolean(employeeId),
    queryFn: () => extensionService.listEmployeeEducations(requireToken(token), employeeId),
  });
}

export function useSyncEmployeeEducationsMutation(employeeId: number) {
  const { token } = useAdminSession();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (educations: EmployeeEducationDraft[]) =>
      extensionService.syncEmployeeEducations(
        requireToken(token),
        employeeId,
        educations.map((row) => ({
          degree_level: row.degree_level,
          field_of_study: row.field_of_study.trim() || null,
          institution_name: row.institution_name.trim() || null,
          passing_year: row.passing_year === '' ? null : Number(row.passing_year),
        })),
      ),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: employeeExtensionKeys.educations(employeeId),
      });
      await queryClient.invalidateQueries({ queryKey: employeeKeys.detail(employeeId) });
    },
  });
}

export function useEmployeeLeaveAllocationsQuery(
  employeeId: number,
  fiscalYearId?: number,
  enabled = true,
) {
  const { token } = useAdminSession();
  return useQuery({
    queryKey: employeeExtensionKeys.allocations(employeeId, fiscalYearId),
    enabled: enabled && Boolean(token) && Boolean(employeeId),
    queryFn: () =>
      extensionService.listEmployeeLeaveAllocations(
        requireToken(token),
        employeeId,
        fiscalYearId,
      ),
  });
}

export function useSyncEmployeeLeaveAllocationsMutation(employeeId: number) {
  const { token } = useAdminSession();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (fiscalYearId?: number) =>
      extensionService.syncEmployeeLeaveAllocations(
        requireToken(token),
        employeeId,
        fiscalYearId,
      ),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['admin', 'employees', employeeId, 'leave-allocations'],
      });
      await queryClient.invalidateQueries({ queryKey: employeeKeys.detail(employeeId) });
    },
  });
}

export function useUpdateEmployeeLeaveAllocationMutation(employeeId: number) {
  const { token } = useAdminSession();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      allocationId,
      payload,
    }: {
      allocationId: number;
      payload: { total_days?: number; used_days?: number; pending_days?: number };
    }) =>
      extensionService.updateEmployeeLeaveAllocation(
        requireToken(token),
        employeeId,
        allocationId,
        payload,
      ),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['admin', 'employees', employeeId, 'leave-allocations'],
      });
      await queryClient.invalidateQueries({ queryKey: employeeKeys.detail(employeeId) });
    },
  });
}

export function useEmployeeAttachmentsQuery(employeeId: number, enabled = true) {
  const { token } = useAdminSession();
  return useQuery({
    queryKey: employeeExtensionKeys.attachments(employeeId),
    enabled: enabled && Boolean(token) && Boolean(employeeId),
    queryFn: () => extensionService.listEmployeeAttachments(requireToken(token), employeeId),
  });
}

export function useUploadEmployeeAttachmentMutation(employeeId: number) {
  const { token } = useAdminSession();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      category: AttachmentCategory;
      title: string;
      is_employee_visible?: boolean;
      file: File;
    }) => extensionService.uploadEmployeeAttachment(requireToken(token), employeeId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: employeeExtensionKeys.attachments(employeeId),
      });
      await queryClient.invalidateQueries({ queryKey: employeeKeys.detail(employeeId) });
    },
  });
}

export function useDownloadEmployeeAttachmentMutation(employeeId: number) {
  const { token } = useAdminSession();
  return useMutation({
    mutationFn: (attachmentId: number) =>
      extensionService.downloadEmployeeAttachment(requireToken(token), employeeId, attachmentId),
  });
}

export function useDeleteEmployeeAttachmentMutation(employeeId: number) {
  const { token } = useAdminSession();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (attachmentId: number) =>
      extensionService.deleteEmployeeAttachment(requireToken(token), employeeId, attachmentId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: employeeExtensionKeys.attachments(employeeId),
      });
      await queryClient.invalidateQueries({ queryKey: employeeKeys.detail(employeeId) });
    },
  });
}

export function useEmployeeAssetsQuery(employeeId: number, enabled = true) {
  const { token } = useAdminSession();
  return useQuery({
    queryKey: employeeExtensionKeys.assets(employeeId),
    enabled: enabled && Boolean(token) && Boolean(employeeId),
    queryFn: () => extensionService.listEmployeeAssets(requireToken(token), employeeId),
  });
}

function useInvalidateEmployeeAssets(employeeId: number) {
  const queryClient = useQueryClient();

  return async () => {
    await queryClient.invalidateQueries({
      queryKey: employeeExtensionKeys.assets(employeeId),
    });
    await queryClient.invalidateQueries({ queryKey: employeeKeys.detail(employeeId) });
  };
}

export function useCreateEmployeeAssetMutation(employeeId: number) {
  const { token } = useAdminSession();
  const invalidate = useInvalidateEmployeeAssets(employeeId);
  return useMutation({
    mutationFn: (payload: EmployeeAssetPayload) =>
      extensionService.createEmployeeAsset(requireToken(token), employeeId, payload),
    onSuccess: invalidate,
  });
}

export function useUpdateEmployeeAssetMutation(employeeId: number) {
  const { token } = useAdminSession();
  const invalidate = useInvalidateEmployeeAssets(employeeId);
  return useMutation({
    mutationFn: ({ assetId, payload }: { assetId: number; payload: EmployeeAssetPayload }) =>
      extensionService.updateEmployeeAsset(
        requireToken(token),
        employeeId,
        assetId,
        payload,
      ),
    onSuccess: invalidate,
  });
}

export function useDeleteEmployeeAssetMutation(employeeId: number) {
  const { token } = useAdminSession();
  const invalidate = useInvalidateEmployeeAssets(employeeId);
  return useMutation({
    mutationFn: (assetId: number) =>
      extensionService.deleteEmployeeAsset(requireToken(token), employeeId, assetId),
    onSuccess: invalidate,
  });
}
