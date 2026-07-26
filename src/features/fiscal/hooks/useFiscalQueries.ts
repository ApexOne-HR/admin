import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAdminSession } from '@/features/auth/hooks/useAdminSession';
import * as fiscalService from '../services/fiscal.service';
import type { FiscalYearPayload } from '../types/fiscal.type';

export const fiscalKeys = {
  years: (companyId?: number) => ['admin', 'fiscal-years', { companyId }] as const,
};

function requireToken(token: string | null): string {
  if (!token) {
    throw new Error('Missing admin session token');
  }
  return token;
}

export function useFiscalYearsQuery(companyId?: number, enabled = true) {
  const { token } = useAdminSession();
  return useQuery({
    queryKey: fiscalKeys.years(companyId),
    enabled: enabled && Boolean(token),
    queryFn: () => fiscalService.listFiscalYears(requireToken(token), companyId),
  });
}

export function useCreateFiscalYearMutation() {
  const { token } = useAdminSession();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: FiscalYearPayload) =>
      fiscalService.createFiscalYear(requireToken(token), payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'fiscal-years'] });
    },
  });
}

export function useUpdateFiscalYearMutation() {
  const { token } = useAdminSession();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<FiscalYearPayload> }) =>
      fiscalService.updateFiscalYear(requireToken(token), id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'fiscal-years'] });
    },
  });
}

export function useDeleteFiscalYearMutation() {
  const { token } = useAdminSession();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => fiscalService.deleteFiscalYear(requireToken(token), id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'fiscal-years'] });
    },
  });
}
