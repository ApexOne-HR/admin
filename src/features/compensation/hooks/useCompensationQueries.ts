import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAdminSession } from '@/features/auth/hooks/useAdminSession';
import { employeeKeys } from '@/features/employees/hooks/useEmployeeQueries';
import * as compensationService from '../services/compensation.service';
import type {
  AllowanceDeductionPayload,
  AllowanceDeductionType,
  SalaryStructurePayload,
} from '../types/compensation.type';

export const compensationKeys = {
  all: ['admin', 'compensation'] as const,
  catalog: (params: { company_id?: number; type?: AllowanceDeductionType; active_only?: boolean }) =>
    ['admin', 'compensation', 'catalog', params] as const,
  salaryList: (employeeId: number) =>
    ['admin', 'employees', employeeId, 'salary-structures'] as const,
  salaryCurrent: (employeeId: number) =>
    ['admin', 'employees', employeeId, 'salary-structures', 'current'] as const,
};

function requireToken(token: string | null): string {
  if (!token) {
    throw new Error('Missing admin session token');
  }
  return token;
}

export function useAllowanceDeductionsQuery(
  params: { company_id?: number; type?: AllowanceDeductionType; active_only?: boolean } = {},
  enabled = true,
) {
  const { token } = useAdminSession();
  return useQuery({
    queryKey: compensationKeys.catalog(params),
    enabled: enabled && Boolean(token),
    queryFn: () => compensationService.listAllowanceDeductions(requireToken(token), params),
  });
}

export function useCreateAllowanceDeductionMutation() {
  const { token } = useAdminSession();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: AllowanceDeductionPayload) =>
      compensationService.createAllowanceDeduction(requireToken(token), payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: compensationKeys.all });
    },
  });
}

export function useUpdateAllowanceDeductionMutation() {
  const { token } = useAdminSession();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<AllowanceDeductionPayload> }) =>
      compensationService.updateAllowanceDeduction(requireToken(token), id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: compensationKeys.all });
    },
  });
}

export function useDeleteAllowanceDeductionMutation() {
  const { token } = useAdminSession();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      compensationService.deleteAllowanceDeduction(requireToken(token), id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: compensationKeys.all });
    },
  });
}

export function useEmployeeSalaryStructuresQuery(employeeId: number, enabled = true) {
  const { token } = useAdminSession();
  return useQuery({
    queryKey: compensationKeys.salaryList(employeeId),
    enabled: enabled && Boolean(token) && Boolean(employeeId),
    queryFn: () =>
      compensationService.listEmployeeSalaryStructures(requireToken(token), employeeId),
  });
}

export function useCurrentEmployeeSalaryQuery(employeeId: number, enabled = true) {
  const { token } = useAdminSession();
  return useQuery({
    queryKey: compensationKeys.salaryCurrent(employeeId),
    enabled: enabled && Boolean(token) && Boolean(employeeId),
    queryFn: () =>
      compensationService.getCurrentEmployeeSalaryStructure(requireToken(token), employeeId),
  });
}

export function useCreateEmployeeSalaryMutation(employeeId: number) {
  const { token } = useAdminSession();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: SalaryStructurePayload) =>
      compensationService.createEmployeeSalaryStructure(requireToken(token), employeeId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: compensationKeys.salaryList(employeeId) });
      await queryClient.invalidateQueries({ queryKey: compensationKeys.salaryCurrent(employeeId) });
      await queryClient.invalidateQueries({ queryKey: employeeKeys.detail(employeeId) });
    },
  });
}

export function useUpdateEmployeeSalaryMutation(employeeId: number) {
  const { token } = useAdminSession();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      structureId,
      payload,
    }: {
      structureId: number;
      payload: Partial<SalaryStructurePayload>;
    }) =>
      compensationService.updateEmployeeSalaryStructure(
        requireToken(token),
        employeeId,
        structureId,
        payload,
      ),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: compensationKeys.salaryList(employeeId) });
      await queryClient.invalidateQueries({ queryKey: compensationKeys.salaryCurrent(employeeId) });
      await queryClient.invalidateQueries({ queryKey: employeeKeys.detail(employeeId) });
    },
  });
}
