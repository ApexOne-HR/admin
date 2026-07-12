export type Company = {
  id: number;
  name: string;
  code: string;
  description: string | null;
  currency: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type Division = {
  id: number;
  company_id: number;
  name: string;
  code: string;
  description: string | null;
  is_active: boolean;
  company?: Company;
  created_at: string;
  updated_at: string;
};

export type Department = {
  id: number;
  division_id: number;
  name: string;
  code: string;
  description: string | null;
  is_active: boolean;
  division?: Division;
  created_at: string;
  updated_at: string;
};

export type Designation = {
  id: number;
  department_id: number;
  name: string;
  code: string;
  description: string | null;
  is_active: boolean;
  department?: Department;
  division?: Division;
  company?: Company;
  created_at: string;
  updated_at: string;
};

export type CompanyPayload = {
  name: string;
  code: string;
  description?: string;
  currency?: string;
  is_active?: boolean;
};

export type DivisionPayload = {
  company_id: number;
  name: string;
  code: string;
  description?: string;
  is_active?: boolean;
};

export type DepartmentPayload = {
  division_id: number;
  name: string;
  code: string;
  description?: string;
  is_active?: boolean;
};

export type DesignationPayload = {
  department_id: number;
  name: string;
  code: string;
  description?: string;
  is_active?: boolean;
};
