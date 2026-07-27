import { apiRequest } from '@/infra/http/apiClient';
import type {
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
