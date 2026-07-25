export type Company = {
  id: number;
  name: string;
  timezone: string;
  currency: string;
  website: string | null;
  logo: string | null;
  tax_id: string | null;
  contact_address: string | null;
  contact_phone: string | null;
  company_type: string | null;
  default_policy_id: number | null;
  default_work_schedule_id: number | null;
  default_location_id: number | null;
  default_leave_package_id: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type Division = {
  id: number;
  company_id: number;
  name: string;
  address: string | null;
  default_policy_id: number | null;
  default_work_schedule_id: number | null;
  default_location_id: number | null;
  default_leave_package_id: number | null;
  is_active: boolean;
  company?: Company;
  created_at: string;
  updated_at: string;
};

export type Department = {
  id: number;
  division_id: number;
  name: string;
  is_active: boolean;
  division?: Division;
  created_at: string;
  updated_at: string;
};

export type Designation = {
  id: number;
  company_id: number;
  department_id: number | null;
  name: string;
  is_active: boolean;
  company?: Company;
  department?: Department | null;
  division?: Division;
  created_at: string;
  updated_at: string;
};

export type CompanyPayload = {
  name: string;
  currency?: string;
  timezone?: string;
  website?: string | null;
  logo?: string | null;
  tax_id?: string | null;
  contact_address?: string | null;
  contact_phone?: string | null;
  company_type?: string | null;
  default_policy_id?: number | null;
  default_work_schedule_id?: number | null;
  default_location_id?: number | null;
  default_leave_package_id?: number | null;
  is_active?: boolean;
};

export type DivisionPayload = {
  company_id: number;
  name: string;
  address?: string | null;
  default_policy_id?: number | null;
  default_work_schedule_id?: number | null;
  default_location_id?: number | null;
  default_leave_package_id?: number | null;
  is_active?: boolean;
};

export type DepartmentPayload = {
  division_id: number;
  name: string;
  is_active?: boolean;
};

export type DesignationPayload = {
  company_id: number;
  department_id?: number | null;
  name: string;
  is_active?: boolean;
};
