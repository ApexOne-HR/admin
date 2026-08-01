import { apiRequest } from '@/infra/http/apiClient';
import type {
  Location,
  LocationPayload,
  Policy,
  PolicyPayload,
  WorkSchedule,
  WorkSchedulePayload,
} from '../types/masters.type';

export async function listLocations(token: string, companyId?: number) {
  const response = await apiRequest<Location[]>('/locations', {
    token,
    query: { company_id: companyId },
  });
  return response.data;
}

export async function createLocation(token: string, payload: LocationPayload) {
  const response = await apiRequest<Location>('/locations', {
    method: 'POST',
    token,
    body: payload,
  });
  return response.data;
}

export async function updateLocation(token: string, id: number, payload: Partial<LocationPayload>) {
  const response = await apiRequest<Location>(`/locations/${id}`, {
    method: 'PUT',
    token,
    body: payload,
  });
  return response.data;
}

export async function deleteLocation(token: string, id: number) {
  await apiRequest<null>(`/locations/${id}`, { method: 'DELETE', token });
}

export async function listWorkSchedules(token: string, companyId?: number) {
  const response = await apiRequest<WorkSchedule[]>('/work-schedules', {
    token,
    query: { company_id: companyId },
  });
  return response.data;
}

export async function getWorkSchedule(token: string, id: number) {
  const response = await apiRequest<WorkSchedule>(`/work-schedules/${id}`, {
    token,
  });
  return response.data;
}

export async function createWorkSchedule(token: string, payload: WorkSchedulePayload) {
  const response = await apiRequest<WorkSchedule>('/work-schedules', {
    method: 'POST',
    token,
    body: payload,
  });
  return response.data;
}

export async function updateWorkSchedule(
  token: string,
  id: number,
  payload: Partial<WorkSchedulePayload>,
) {
  const response = await apiRequest<WorkSchedule>(`/work-schedules/${id}`, {
    method: 'PUT',
    token,
    body: payload,
  });
  return response.data;
}

export async function deleteWorkSchedule(token: string, id: number) {
  await apiRequest<null>(`/work-schedules/${id}`, { method: 'DELETE', token });
}

export async function listPolicies(token: string, companyId?: number) {
  const response = await apiRequest<Policy[]>('/policies', {
    token,
    query: { company_id: companyId },
  });
  return response.data;
}

export async function getPolicy(token: string, id: number) {
  const response = await apiRequest<Policy>(`/policies/${id}`, { token });
  return response.data;
}

export async function createPolicy(token: string, payload: PolicyPayload) {
  const response = await apiRequest<Policy>('/policies', {
    method: 'POST',
    token,
    body: payload,
  });
  return response.data;
}

export async function updatePolicy(token: string, id: number, payload: Partial<PolicyPayload>) {
  const response = await apiRequest<Policy>(`/policies/${id}`, {
    method: 'PUT',
    token,
    body: payload,
  });
  return response.data;
}

export async function deletePolicy(token: string, id: number) {
  await apiRequest<null>(`/policies/${id}`, { method: 'DELETE', token });
}
