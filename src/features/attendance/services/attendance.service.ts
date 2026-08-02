import { apiRequest } from '@/infra/http/apiClient';
import type {
  AttendanceBulkCreatePayload,
  AttendanceBulkCreateResult,
  AttendanceCreatePayload,
  AttendanceListParams,
  AttendancePaginationMeta,
  AttendanceReasonPayload,
  AttendanceRecord,
  AttendanceUpdatePayload,
} from '../types/attendance.type';

export async function listAttendanceRecords(
  token: string,
  params: AttendanceListParams = {},
) {
  const response = await apiRequest<AttendanceRecord[]>('/attendance-records', {
    token,
    query: {
      page: params.page,
      per_page: params.per_page,
      q: params.q,
      company_id: params.company_id,
      division_id: params.division_id,
      department_id: params.department_id,
      employee_id: params.employee_id,
      date_from: params.date_from,
      date_to: params.date_to,
      status: params.status,
      source: params.source,
      is_voided: params.is_voided,
    },
  });

  return {
    records: response.data,
    meta: response.meta as AttendancePaginationMeta,
  };
}

export async function listAllAttendanceRecords(
  token: string,
  params: Omit<AttendanceListParams, 'page' | 'per_page'> = {},
) {
  const records: AttendanceRecord[] = [];
  let page = 1;
  let lastPage = 1;

  do {
    const result = await listAttendanceRecords(token, {
      ...params,
      page,
      per_page: 100,
    });
    records.push(...result.records);
    lastPage = result.meta.last_page;
    page += 1;
  } while (page <= lastPage);

  return records;
}

export async function getAttendanceRecord(token: string, id: number) {
  const response = await apiRequest<AttendanceRecord>(`/attendance-records/${id}`, {
    token,
  });
  return response.data;
}

export async function createAttendanceRecord(
  token: string,
  payload: AttendanceCreatePayload,
) {
  const response = await apiRequest<AttendanceRecord>('/attendance-records', {
    method: 'POST',
    token,
    body: payload,
  });
  return response.data;
}

export async function bulkCreateAttendanceRecords(
  token: string,
  employeeId: number,
  payload: AttendanceBulkCreatePayload,
) {
  const response = await apiRequest<AttendanceBulkCreateResult>(
    `/employees/${employeeId}/attendance-records/bulk`,
    {
      method: 'POST',
      token,
      body: payload,
    },
  );
  return response.data;
}

export async function updateAttendanceRecord(
  token: string,
  id: number,
  payload: AttendanceUpdatePayload,
) {
  const response = await apiRequest<AttendanceRecord>(`/attendance-records/${id}`, {
    method: 'PUT',
    token,
    body: payload,
  });
  return response.data;
}

export async function voidAttendanceRecord(
  token: string,
  id: number,
  payload: AttendanceReasonPayload,
) {
  const response = await apiRequest<AttendanceRecord>(
    `/attendance-records/${id}/void`,
    {
      method: 'POST',
      token,
      body: payload,
    },
  );
  return response.data;
}

export async function restoreAttendanceRecord(
  token: string,
  id: number,
  payload: AttendanceReasonPayload,
) {
  const response = await apiRequest<AttendanceRecord>(
    `/attendance-records/${id}/restore`,
    {
      method: 'POST',
      token,
      body: payload,
    },
  );
  return response.data;
}
