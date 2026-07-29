import { apiRequest } from '@/infra/http/apiClient';
import type {
  AttachmentCategory,
  EmployeeAttachment,
  EmployeeAttachmentDownload,
  EmployeeAsset,
  EmployeeAssetPayload,
  EmployeeBank,
  EmployeeBankDraft,
  EmployeeEducation,
  EmployeeEmergencyContact,
  EmployeeEmergencyContactDraft,
  EmployeeLeaveAllocation,
} from '../types/employee-extension.type';

export async function listEmployeeBanks(token: string, employeeId: number) {
  const response = await apiRequest<EmployeeBank[]>(`/employees/${employeeId}/banks`, { token });
  return response.data;
}

export async function syncEmployeeBanks(
  token: string,
  employeeId: number,
  banks: EmployeeBankDraft[],
) {
  const response = await apiRequest<EmployeeBank[]>(`/employees/${employeeId}/banks`, {
    method: 'PUT',
    token,
    body: { banks },
  });
  return response.data;
}

export async function listEmployeeEmergencyContacts(token: string, employeeId: number) {
  const response = await apiRequest<EmployeeEmergencyContact[]>(
    `/employees/${employeeId}/emergency-contacts`,
    { token },
  );
  return response.data;
}

export async function syncEmployeeEmergencyContacts(
  token: string,
  employeeId: number,
  contacts: EmployeeEmergencyContactDraft[],
) {
  const response = await apiRequest<EmployeeEmergencyContact[]>(
    `/employees/${employeeId}/emergency-contacts`,
    {
      method: 'PUT',
      token,
      body: { contacts },
    },
  );
  return response.data;
}

export async function listEmployeeEducations(token: string, employeeId: number) {
  const response = await apiRequest<EmployeeEducation[]>(
    `/employees/${employeeId}/educations`,
    { token },
  );
  return response.data;
}

export async function syncEmployeeEducations(
  token: string,
  employeeId: number,
  educations: Array<{
    degree_level: string;
    field_of_study?: string | null;
    institution_name?: string | null;
    passing_year?: number | null;
  }>,
) {
  const response = await apiRequest<EmployeeEducation[]>(
    `/employees/${employeeId}/educations`,
    {
      method: 'PUT',
      token,
      body: { educations },
    },
  );
  return response.data;
}

export async function listEmployeeLeaveAllocations(
  token: string,
  employeeId: number,
  fiscalYearId?: number,
) {
  const response = await apiRequest<EmployeeLeaveAllocation[]>(
    `/employees/${employeeId}/leave-allocations`,
    {
      token,
      query: { fiscal_year_id: fiscalYearId },
    },
  );
  return response.data;
}

export async function syncEmployeeLeaveAllocations(
  token: string,
  employeeId: number,
  fiscalYearId?: number,
) {
  const response = await apiRequest<EmployeeLeaveAllocation[]>(
    `/employees/${employeeId}/leave-allocations/sync`,
    {
      method: 'POST',
      token,
      body: fiscalYearId ? { fiscal_year_id: fiscalYearId } : {},
    },
  );
  return response.data;
}

export async function updateEmployeeLeaveAllocation(
  token: string,
  employeeId: number,
  allocationId: number,
  payload: Partial<Pick<EmployeeLeaveAllocation, 'total_days' | 'used_days' | 'pending_days'>>,
) {
  const response = await apiRequest<EmployeeLeaveAllocation>(
    `/employees/${employeeId}/leave-allocations/${allocationId}`,
    {
      method: 'PUT',
      token,
      body: payload,
    },
  );
  return response.data;
}

export async function listEmployeeAttachments(token: string, employeeId: number) {
  const response = await apiRequest<EmployeeAttachment[]>(
    `/employees/${employeeId}/attachments`,
    { token },
  );
  return response.data;
}

export async function uploadEmployeeAttachment(
  token: string,
  employeeId: number,
  payload: {
    category: AttachmentCategory;
    title: string;
    is_employee_visible?: boolean;
    file: File;
  },
) {
  const body = new FormData();
  body.append('category', payload.category);
  body.append('title', payload.title);
  if (payload.is_employee_visible !== undefined) {
    body.append('is_employee_visible', payload.is_employee_visible ? '1' : '0');
  }
  body.append('file', payload.file);

  const response = await apiRequest<EmployeeAttachment>(
    `/employees/${employeeId}/attachments`,
    {
      method: 'POST',
      token,
      body,
      formData: true,
    },
  );
  return response.data;
}

export async function downloadEmployeeAttachment(
  token: string,
  employeeId: number,
  attachmentId: number,
) {
  const response = await apiRequest<EmployeeAttachmentDownload>(
    `/employees/${employeeId}/attachments/${attachmentId}/download`,
    { token },
  );
  return response.data;
}

export async function deleteEmployeeAttachment(
  token: string,
  employeeId: number,
  attachmentId: number,
) {
  await apiRequest<null>(`/employees/${employeeId}/attachments/${attachmentId}`, {
    method: 'DELETE',
    token,
  });
}

export async function listEmployeeAssets(token: string, employeeId: number) {
  const response = await apiRequest<EmployeeAsset[]>(`/employees/${employeeId}/assets`, { token });
  return response.data;
}

export async function createEmployeeAsset(
  token: string,
  employeeId: number,
  payload: EmployeeAssetPayload,
) {
  const response = await apiRequest<EmployeeAsset>(`/employees/${employeeId}/assets`, {
    method: 'POST',
    token,
    body: payload,
  });
  return response.data;
}

export async function updateEmployeeAsset(
  token: string,
  employeeId: number,
  assetId: number,
  payload: EmployeeAssetPayload,
) {
  const response = await apiRequest<EmployeeAsset>(
    `/employees/${employeeId}/assets/${assetId}`,
    {
      method: 'PUT',
      token,
      body: payload,
    },
  );
  return response.data;
}

export async function deleteEmployeeAsset(
  token: string,
  employeeId: number,
  assetId: number,
) {
  await apiRequest<null>(`/employees/${employeeId}/assets/${assetId}`, {
    method: 'DELETE',
    token,
  });
}
