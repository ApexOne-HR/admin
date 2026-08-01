import { useQuery } from '@tanstack/react-query';
import { useAdminSession } from '@/features/auth/hooks/useAdminSession';
import * as auditService from '../services/audit.service';
import type { AdminAuditListParams } from '../types/audit.type';

export const auditKeys = {
  all: ['admin', 'audit-logs'] as const,
  list: (params: AdminAuditListParams) =>
    ['admin', 'audit-logs', 'list', params] as const,
};

function requireToken(token: string | null): string {
  if (!token) {
    throw new Error('Missing admin session token');
  }
  return token;
}

export function useAdminAuditLogsQuery(
  params: AdminAuditListParams,
  enabled = true,
) {
  const { token } = useAdminSession();

  return useQuery({
    queryKey: auditKeys.list(params),
    enabled: enabled && Boolean(token),
    queryFn: () => auditService.listAdminAuditLogs(requireToken(token), params),
  });
}
