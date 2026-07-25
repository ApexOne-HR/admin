import { apiRequest } from '@/infra/http/apiClient';
import type {
  LeavePackage,
  LeavePackagePayload,
  LeaveType,
  LeaveTypePayload,
} from '../types/leave.type';

export async function listLeaveTypes(token: string, companyId?: number, activeOnly?: boolean) {
  const response = await apiRequest<LeaveType[]>('/leave-types', {
    token,
    query: {
      company_id: companyId,
      active_only: activeOnly ? 1 : undefined,
    },
  });
  return response.data;
}

export async function createLeaveType(token: string, payload: LeaveTypePayload) {
  const response = await apiRequest<LeaveType>('/leave-types', {
    method: 'POST',
    token,
    body: payload,
  });
  return response.data;
}

export async function updateLeaveType(
  token: string,
  id: number,
  payload: Partial<LeaveTypePayload>,
) {
  const response = await apiRequest<LeaveType>(`/leave-types/${id}`, {
    method: 'PUT',
    token,
    body: payload,
  });
  return response.data;
}

export async function deleteLeaveType(token: string, id: number) {
  await apiRequest<null>(`/leave-types/${id}`, { method: 'DELETE', token });
}

export async function listLeavePackages(token: string, companyId?: number, activeOnly?: boolean) {
  const response = await apiRequest<LeavePackage[]>('/leave-packages', {
    token,
    query: {
      company_id: companyId,
      active_only: activeOnly ? 1 : undefined,
    },
  });
  return response.data;
}

export async function createLeavePackage(token: string, payload: LeavePackagePayload) {
  const response = await apiRequest<LeavePackage>('/leave-packages', {
    method: 'POST',
    token,
    body: payload,
  });
  return response.data;
}

export async function updateLeavePackage(
  token: string,
  id: number,
  payload: Partial<LeavePackagePayload>,
) {
  const response = await apiRequest<LeavePackage>(`/leave-packages/${id}`, {
    method: 'PUT',
    token,
    body: payload,
  });
  return response.data;
}

export async function deleteLeavePackage(token: string, id: number) {
  await apiRequest<null>(`/leave-packages/${id}`, { method: 'DELETE', token });
}
