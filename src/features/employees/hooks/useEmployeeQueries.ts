import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAdminSession } from '@/features/auth/hooks/useAdminSession';
import * as employeeService from '../services/employee.service';
import type { EmployeeListParams, EmployeePayload } from '../types/employee.type';

export const employeeKeys = {
  all: ['admin', 'employees'] as const,
  list: (params: EmployeeListParams) => ['admin', 'employees', 'list', params] as const,
  detail: (id: number) => ['admin', 'employees', 'detail', id] as const,
};

function requireToken(token: string | null): string {
  if (!token) {
    throw new Error('Missing admin session token');
  }
  return token;
}

export function useEmployeesQuery(params: EmployeeListParams, enabled = true) {
  const { token } = useAdminSession();
  return useQuery({
    queryKey: employeeKeys.list(params),
    enabled: enabled && Boolean(token),
    queryFn: () => employeeService.listEmployees(requireToken(token), params),
  });
}

export function useEmployeeQuery(id: number | undefined, enabled = true) {
  const { token } = useAdminSession();
  return useQuery({
    queryKey: employeeKeys.detail(id ?? 0),
    enabled: enabled && Boolean(token) && Boolean(id),
    queryFn: () => employeeService.getEmployee(requireToken(token), id as number),
  });
}

export function useCreateEmployeeMutation() {
  const { token } = useAdminSession();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: EmployeePayload) =>
      employeeService.createEmployee(requireToken(token), payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: employeeKeys.all });
    },
  });
}

export function useUpdateEmployeeMutation() {
  const { token } = useAdminSession();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<EmployeePayload> }) =>
      employeeService.updateEmployee(requireToken(token), id, payload),
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({ queryKey: employeeKeys.all });
      await queryClient.invalidateQueries({ queryKey: employeeKeys.detail(variables.id) });
    },
  });
}

export function useDeleteEmployeeMutation() {
  const { token } = useAdminSession();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => employeeService.deleteEmployee(requireToken(token), id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: employeeKeys.all });
    },
  });
}
