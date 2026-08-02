import { useQuery } from '@tanstack/react-query';
import { useAdminSession } from '@/features/auth/hooks/useAdminSession';
import * as dashboardService from '../services/dashboard.service';

export const dashboardKeys = {
  all: ['admin', 'dashboard'] as const,
  summary: () => ['admin', 'dashboard', 'summary'] as const,
};

function requireToken(token: string | null): string {
  if (!token) {
    throw new Error('Missing admin session token');
  }
  return token;
}

export function useDashboardSummaryQuery(enabled = true) {
  const { token } = useAdminSession();

  return useQuery({
    queryKey: dashboardKeys.summary(),
    enabled: enabled && Boolean(token),
    queryFn: () => dashboardService.getDashboardSummary(requireToken(token)),
  });
}
