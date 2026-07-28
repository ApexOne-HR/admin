import { apiRequest } from '@/infra/http/apiClient';
import type {
  Employee,
  EmployeeListParams,
  NrcOption,
  EmployeePayload,
  PaginatedMeta,
} from '../types/employee.type';

export async function listEmployees(token: string, params: EmployeeListParams = {}) {
  const response = await apiRequest<Employee[]>('/employees', {
    token,
    query: {
      page: params.page,
      per_page: params.per_page,
      q: params.q,
      company_id: params.company_id,
      division_id: params.division_id,
      department_id: params.department_id,
      status: params.status || undefined,
    },
  });

  return {
    employees: response.data,
    meta: response.meta as PaginatedMeta,
  };
}

export async function getEmployee(token: string, id: number) {
  const response = await apiRequest<Employee>(`/employees/${id}`, { token });
  return response.data;
}

export async function listEmployeeNrcOptions(token: string) {
  const response = await apiRequest<NrcOption[]>('/employees/nrc-options', { token });
  return response.data;
}

export async function createEmployee(token: string, payload: EmployeePayload) {
  const response = await apiRequest<Employee>('/employees', {
    method: 'POST',
    token,
    body: payload,
  });
  return response.data;
}

export async function updateEmployee(
  token: string,
  id: number,
  payload: Partial<EmployeePayload>,
) {
  const response = await apiRequest<Employee>(`/employees/${id}`, {
    method: 'PUT',
    token,
    body: payload,
  });
  return response.data;
}

export async function deleteEmployee(token: string, id: number) {
  await apiRequest<null>(`/employees/${id}`, { method: 'DELETE', token });
}
