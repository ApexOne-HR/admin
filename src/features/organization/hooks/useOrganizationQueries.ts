import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAdminSession } from '@/features/auth/hooks/useAdminSession';
import * as organizationService from '../services/organization.service';
import type {
  CompanyPayload,
  DepartmentPayload,
  DesignationPayload,
  DivisionPayload,
} from '../types/organization.type';

export const organizationKeys = {
  companies: (activeOnly?: boolean) => ['admin', 'companies', { activeOnly }] as const,
  divisions: (companyId?: number) => ['admin', 'divisions', { companyId }] as const,
  departments: (divisionId?: number) => ['admin', 'departments', { divisionId }] as const,
  designations: (companyId?: number, departmentId?: number) =>
    ['admin', 'designations', { companyId, departmentId }] as const,
};

function requireToken(token: string | null): string {
  if (!token) {
    throw new Error('Missing admin session token');
  }
  return token;
}

export function useCompaniesQuery(enabled = true) {
  const { token } = useAdminSession();

  return useQuery({
    queryKey: organizationKeys.companies(),
    enabled: enabled && Boolean(token),
    queryFn: () => organizationService.listCompanies(requireToken(token)),
  });
}

export function useDivisionsQuery(companyId?: number, enabled = true) {
  const { token } = useAdminSession();

  return useQuery({
    queryKey: organizationKeys.divisions(companyId),
    enabled: enabled && Boolean(token),
    queryFn: () => organizationService.listDivisions(requireToken(token), companyId),
  });
}

export function useDepartmentsQuery(divisionId?: number, enabled = true) {
  const { token } = useAdminSession();

  return useQuery({
    queryKey: organizationKeys.departments(divisionId),
    enabled: enabled && Boolean(token),
    queryFn: () => organizationService.listDepartments(requireToken(token), divisionId),
  });
}

export function useDesignationsQuery(companyId?: number, departmentId?: number, enabled = true) {
  const { token } = useAdminSession();

  return useQuery({
    queryKey: organizationKeys.designations(companyId, departmentId),
    enabled: enabled && Boolean(token),
    queryFn: () =>
      organizationService.listDesignations(requireToken(token), companyId, departmentId),
  });
}

export function useCreateCompanyMutation() {
  const { token } = useAdminSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CompanyPayload) =>
      organizationService.createCompany(requireToken(token), payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'companies'] });
    },
  });
}

export function useUpdateCompanyMutation() {
  const { token } = useAdminSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<CompanyPayload> }) =>
      organizationService.updateCompany(requireToken(token), id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'companies'] });
    },
  });
}

export function useDeleteCompanyMutation() {
  const { token } = useAdminSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => organizationService.deleteCompany(requireToken(token), id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'companies'] });
    },
  });
}

export function useCreateDivisionMutation() {
  const { token } = useAdminSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: DivisionPayload) =>
      organizationService.createDivision(requireToken(token), payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'divisions'] });
    },
  });
}

export function useUpdateDivisionMutation() {
  const { token } = useAdminSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<DivisionPayload> }) =>
      organizationService.updateDivision(requireToken(token), id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'divisions'] });
    },
  });
}

export function useDeleteDivisionMutation() {
  const { token } = useAdminSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => organizationService.deleteDivision(requireToken(token), id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'divisions'] });
    },
  });
}

export function useCreateDepartmentMutation() {
  const { token } = useAdminSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: DepartmentPayload) =>
      organizationService.createDepartment(requireToken(token), payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'departments'] });
    },
  });
}

export function useUpdateDepartmentMutation() {
  const { token } = useAdminSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<DepartmentPayload> }) =>
      organizationService.updateDepartment(requireToken(token), id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'departments'] });
    },
  });
}

export function useDeleteDepartmentMutation() {
  const { token } = useAdminSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => organizationService.deleteDepartment(requireToken(token), id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'departments'] });
    },
  });
}

export function useCreateDesignationMutation() {
  const { token } = useAdminSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: DesignationPayload) =>
      organizationService.createDesignation(requireToken(token), payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'designations'] });
    },
  });
}

export function useUpdateDesignationMutation() {
  const { token } = useAdminSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<DesignationPayload> }) =>
      organizationService.updateDesignation(requireToken(token), id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'designations'] });
    },
  });
}

export function useDeleteDesignationMutation() {
  const { token } = useAdminSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => organizationService.deleteDesignation(requireToken(token), id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'designations'] });
    },
  });
}
