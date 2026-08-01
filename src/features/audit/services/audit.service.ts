import { apiRequest } from '@/infra/http/apiClient';
import type {
  AdminAuditListParams,
  AdminAuditLog,
  AdminAuditPaginationMeta,
} from '../types/audit.type';

export async function listAdminAuditLogs(
  token: string,
  params: AdminAuditListParams = {},
) {
  const response = await apiRequest<AdminAuditLog[]>('/audit-logs', {
    token,
    query: {
      page: params.page,
      per_page: params.per_page,
      feature: params.feature,
      date_from: params.date_from,
      date_to: params.date_to,
    },
  });

  return {
    logs: response.data,
    meta: response.meta as AdminAuditPaginationMeta,
  };
}
