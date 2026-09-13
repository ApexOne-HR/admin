import { apiRequest } from '@/infra/http/apiClient';
import type {
  LeaveRequest,
  LeaveRequestListParams,
  LeaveRequestPaginationMeta,
} from '../types/leave-request.type';

export async function getPendingLeaveRequestCount(token: string) {
  const response = await apiRequest<{ pending_count: number }>(
    '/leave-applications/pending-count',
    { token },
  );
  return response.data.pending_count;
}

export async function listLeaveRequests(
  token: string,
  params: LeaveRequestListParams = {},
) {
  const response = await apiRequest<LeaveRequest[]>('/leave-applications', {
    token,
    query: {
      page: params.page,
      per_page: params.per_page,
      q: params.q,
      company_id: params.company_id,
      division_id: params.division_id,
      department_id: params.department_id,
      employee_id: params.employee_id,
      leave_type_id: params.leave_type_id,
      date_from: params.date_from,
      date_to: params.date_to,
      status: params.status,
      creation_source: params.creation_source,
    },
  });

  return {
    records: response.data,
    meta: response.meta as LeaveRequestPaginationMeta,
  };
}

export async function getLeaveRequest(token: string, id: number) {
  const response = await apiRequest<LeaveRequest>(`/leave-applications/${id}`, {
    token,
  });
  return response.data;
}

export async function approveLeaveRequest(token: string, id: number) {
  const response = await apiRequest<LeaveRequest>(
    `/leave-applications/${id}/approve`,
    { method: 'POST', token },
  );
  return response.data;
}

export async function rejectLeaveRequest(
  token: string,
  id: number,
  decisionNote: string,
) {
  const response = await apiRequest<LeaveRequest>(
    `/leave-applications/${id}/reject`,
    {
      method: 'POST',
      token,
      body: { decision_note: decisionNote },
    },
  );
  return response.data;
}
