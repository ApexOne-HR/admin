import { apiRequest } from '@/infra/http/apiClient';
import type {
  Company,
  CompanyPayload,
  Department,
  DepartmentPayload,
  Designation,
  DesignationPayload,
  Division,
  DivisionPayload,
} from '../types/organization.type';

export async function listCompanies(token: string, activeOnly?: boolean) {
  const response = await apiRequest<Company[]>('/companies', {
    token,
    query: { active_only: activeOnly ? 1 : undefined },
  });
  return response.data;
}

export async function createCompany(token: string, payload: CompanyPayload) {
  const response = await apiRequest<Company>('/companies', {
    method: 'POST',
    token,
    body: payload,
  });
  return response.data;
}

export async function updateCompany(token: string, id: number, payload: Partial<CompanyPayload>) {
  const response = await apiRequest<Company>(`/companies/${id}`, {
    method: 'PUT',
    token,
    body: payload,
  });
  return response.data;
}

export async function deleteCompany(token: string, id: number) {
  await apiRequest<null>(`/companies/${id}`, { method: 'DELETE', token });
}

export async function listDivisions(token: string, companyId?: number, activeOnly?: boolean) {
  const response = await apiRequest<Division[]>('/divisions', {
    token,
    query: {
      company_id: companyId,
      active_only: activeOnly ? 1 : undefined,
    },
  });
  return response.data;
}

export async function createDivision(token: string, payload: DivisionPayload) {
  const response = await apiRequest<Division>('/divisions', {
    method: 'POST',
    token,
    body: payload,
  });
  return response.data;
}

export async function updateDivision(token: string, id: number, payload: Partial<DivisionPayload>) {
  const response = await apiRequest<Division>(`/divisions/${id}`, {
    method: 'PUT',
    token,
    body: payload,
  });
  return response.data;
}

export async function deleteDivision(token: string, id: number) {
  await apiRequest<null>(`/divisions/${id}`, { method: 'DELETE', token });
}

export async function listDepartments(token: string, divisionId?: number, activeOnly?: boolean) {
  const response = await apiRequest<Department[]>('/departments', {
    token,
    query: {
      division_id: divisionId,
      active_only: activeOnly ? 1 : undefined,
    },
  });
  return response.data;
}

export async function createDepartment(token: string, payload: DepartmentPayload) {
  const response = await apiRequest<Department>('/departments', {
    method: 'POST',
    token,
    body: payload,
  });
  return response.data;
}

export async function updateDepartment(
  token: string,
  id: number,
  payload: Partial<DepartmentPayload>,
) {
  const response = await apiRequest<Department>(`/departments/${id}`, {
    method: 'PUT',
    token,
    body: payload,
  });
  return response.data;
}

export async function deleteDepartment(token: string, id: number) {
  await apiRequest<null>(`/departments/${id}`, { method: 'DELETE', token });
}

export async function listDesignations(token: string, departmentId?: number, activeOnly?: boolean) {
  const response = await apiRequest<Designation[]>('/designations', {
    token,
    query: {
      department_id: departmentId,
      active_only: activeOnly ? 1 : undefined,
    },
  });
  return response.data;
}

export async function createDesignation(token: string, payload: DesignationPayload) {
  const response = await apiRequest<Designation>('/designations', {
    method: 'POST',
    token,
    body: payload,
  });
  return response.data;
}

export async function updateDesignation(
  token: string,
  id: number,
  payload: Partial<DesignationPayload>,
) {
  const response = await apiRequest<Designation>(`/designations/${id}`, {
    method: 'PUT',
    token,
    body: payload,
  });
  return response.data;
}

export async function deleteDesignation(token: string, id: number) {
  await apiRequest<null>(`/designations/${id}`, { method: 'DELETE', token });
}
