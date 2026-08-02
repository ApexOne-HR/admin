import { apiRequest } from '@/infra/http/apiClient';
import type { DashboardSummary } from '../types/dashboard.type';

export async function getDashboardSummary(token: string) {
  const response = await apiRequest<DashboardSummary>('/dashboard/summary', { token });
  return response.data;
}
