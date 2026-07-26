import { apiRequest } from '@/infra/http/apiClient';
import type { FiscalYear, FiscalYearPayload } from '../types/fiscal.type';

export async function listFiscalYears(token: string, companyId?: number, activeOnly?: boolean) {
  const response = await apiRequest<FiscalYear[]>('/fiscal-years', {
    token,
    query: {
      company_id: companyId,
      active_only: activeOnly ? 1 : undefined,
    },
  });
  return response.data;
}

export async function createFiscalYear(token: string, payload: FiscalYearPayload) {
  const response = await apiRequest<FiscalYear>('/fiscal-years', {
    method: 'POST',
    token,
    body: payload,
  });
  return response.data;
}

export async function updateFiscalYear(
  token: string,
  id: number,
  payload: Partial<FiscalYearPayload>,
) {
  const response = await apiRequest<FiscalYear>(`/fiscal-years/${id}`, {
    method: 'PUT',
    token,
    body: payload,
  });
  return response.data;
}

export async function deleteFiscalYear(token: string, id: number) {
  await apiRequest<null>(`/fiscal-years/${id}`, { method: 'DELETE', token });
}
