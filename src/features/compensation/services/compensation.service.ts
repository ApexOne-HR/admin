import { apiRequest } from '@/infra/http/apiClient';
import type {
  AllowanceDeduction,
  AllowanceDeductionPayload,
  AllowanceDeductionType,
  SalaryStructure,
  SalaryStructurePayload,
} from '../types/compensation.type';

export async function listAllowanceDeductions(
  token: string,
  params: { company_id?: number; type?: AllowanceDeductionType; active_only?: boolean } = {},
) {
  const response = await apiRequest<AllowanceDeduction[]>('/allowances-deductions', {
    token,
    query: {
      company_id: params.company_id,
      type: params.type,
      active_only: params.active_only ? 1 : undefined,
    },
  });
  return response.data;
}

export async function createAllowanceDeduction(token: string, payload: AllowanceDeductionPayload) {
  const response = await apiRequest<AllowanceDeduction>('/allowances-deductions', {
    method: 'POST',
    token,
    body: payload,
  });
  return response.data;
}

export async function updateAllowanceDeduction(
  token: string,
  id: number,
  payload: Partial<AllowanceDeductionPayload>,
) {
  const response = await apiRequest<AllowanceDeduction>(`/allowances-deductions/${id}`, {
    method: 'PUT',
    token,
    body: payload,
  });
  return response.data;
}

export async function deleteAllowanceDeduction(token: string, id: number) {
  await apiRequest<null>(`/allowances-deductions/${id}`, { method: 'DELETE', token });
}

export async function listEmployeeSalaryStructures(token: string, employeeId: number) {
  const response = await apiRequest<SalaryStructure[]>(
    `/employees/${employeeId}/salary-structures`,
    { token },
  );
  return response.data;
}

export async function getCurrentEmployeeSalaryStructure(token: string, employeeId: number) {
  const response = await apiRequest<SalaryStructure | null>(
    `/employees/${employeeId}/salary-structures/current`,
    { token },
  );
  return response.data;
}

export async function createEmployeeSalaryStructure(
  token: string,
  employeeId: number,
  payload: SalaryStructurePayload,
) {
  const response = await apiRequest<SalaryStructure>(
    `/employees/${employeeId}/salary-structures`,
    {
      method: 'POST',
      token,
      body: payload,
    },
  );
  return response.data;
}

export async function updateEmployeeSalaryStructure(
  token: string,
  employeeId: number,
  structureId: number,
  payload: Partial<SalaryStructurePayload>,
) {
  const response = await apiRequest<SalaryStructure>(
    `/employees/${employeeId}/salary-structures/${structureId}`,
    {
      method: 'PUT',
      token,
      body: payload,
    },
  );
  return response.data;
}
