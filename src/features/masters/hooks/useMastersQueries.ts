import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAdminSession } from '@/features/auth/hooks/useAdminSession';
import * as mastersService from '../services/masters.service';
import type {
  LocationPayload,
  PolicyPayload,
  WorkSchedulePayload,
} from '../types/masters.type';

export const mastersKeys = {
  locations: (companyId?: number) => ['admin', 'locations', { companyId }] as const,
  schedules: (companyId?: number) => ['admin', 'work-schedules', { companyId }] as const,
  policies: (companyId?: number) => ['admin', 'policies', { companyId }] as const,
};

function requireToken(token: string | null): string {
  if (!token) {
    throw new Error('Missing admin session token');
  }
  return token;
}

export function useLocationsQuery(companyId?: number, enabled = true) {
  const { token } = useAdminSession();
  return useQuery({
    queryKey: mastersKeys.locations(companyId),
    enabled: enabled && Boolean(token),
    queryFn: () => mastersService.listLocations(requireToken(token), companyId),
  });
}

export function useWorkSchedulesQuery(companyId?: number, enabled = true) {
  const { token } = useAdminSession();
  return useQuery({
    queryKey: mastersKeys.schedules(companyId),
    enabled: enabled && Boolean(token),
    queryFn: () => mastersService.listWorkSchedules(requireToken(token), companyId),
  });
}

export function usePoliciesQuery(companyId?: number, enabled = true) {
  const { token } = useAdminSession();
  return useQuery({
    queryKey: mastersKeys.policies(companyId),
    enabled: enabled && Boolean(token),
    queryFn: () => mastersService.listPolicies(requireToken(token), companyId),
  });
}

export function useCreateLocationMutation() {
  const { token } = useAdminSession();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: LocationPayload) =>
      mastersService.createLocation(requireToken(token), payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'locations'] });
    },
  });
}

export function useUpdateLocationMutation() {
  const { token } = useAdminSession();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<LocationPayload> }) =>
      mastersService.updateLocation(requireToken(token), id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'locations'] });
    },
  });
}

export function useDeleteLocationMutation() {
  const { token } = useAdminSession();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => mastersService.deleteLocation(requireToken(token), id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'locations'] });
    },
  });
}

export function useCreateWorkScheduleMutation() {
  const { token } = useAdminSession();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: WorkSchedulePayload) =>
      mastersService.createWorkSchedule(requireToken(token), payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'work-schedules'] });
    },
  });
}

export function useUpdateWorkScheduleMutation() {
  const { token } = useAdminSession();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<WorkSchedulePayload> }) =>
      mastersService.updateWorkSchedule(requireToken(token), id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'work-schedules'] });
    },
  });
}

export function useDeleteWorkScheduleMutation() {
  const { token } = useAdminSession();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => mastersService.deleteWorkSchedule(requireToken(token), id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'work-schedules'] });
    },
  });
}

export function useCreatePolicyMutation() {
  const { token } = useAdminSession();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: PolicyPayload) =>
      mastersService.createPolicy(requireToken(token), payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'policies'] });
    },
  });
}

export function useUpdatePolicyMutation() {
  const { token } = useAdminSession();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<PolicyPayload> }) =>
      mastersService.updatePolicy(requireToken(token), id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'policies'] });
    },
  });
}

export function useDeletePolicyMutation() {
  const { token } = useAdminSession();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => mastersService.deletePolicy(requireToken(token), id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'policies'] });
    },
  });
}
