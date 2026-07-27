export type EmployeeStatus =
  | 'offer'
  | 'probation'
  | 'permanent'
  | 'terminated'
  | 'resigned'
  | 'dismissed';
export type EmploymentType = 'full-time' | 'part-time' | 'contract' | 'others';
export type EmploymentLevel = 'Junior' | 'Senior' | 'Manager' | 'Executive';

export type EffectiveDefault = {
  id: number;
  name: string;
  source: 'employee' | 'division' | 'company';
};

export type Employee = {
  id: number;
  user_id: number | null;
  company_id: number;
  division_id: number | null;
  department_id: number | null;
  designation_id: number | null;
  report_to: number | null;
  policy_id: number | null;
  work_schedule_id: number | null;
  work_location_id: number | null;
  leave_package_id: number | null;
  employee_code: string;
  sir_name: string | null;
  full_name: string;
  myanmar_name: string | null;
  email: string | null;
  phone: string | null;
  status: EmployeeStatus;
  employment_type: EmploymentType | null;
  employment_level: EmploymentLevel | null;
  auto_attendance: boolean;
  date_of_joining: string;
  date_of_resignation: string | null;
  probation_periods_months: number;
  permanent_date: string | null;
  service_years: number;
  date_of_birth: string | null;
  is_foreigner: boolean;
  nrc_number: string | null;
  passport_number: string | null;
  ssb_number: string | null;
  income_tax_applicable: boolean;
  current_address: string | null;
  permanent_address: string | null;
  company?: { id: number; name: string };
  division?: { id: number; name: string } | null;
  department?: { id: number; name: string } | null;
  designation?: { id: number; name: string } | null;
  manager?: { id: number; employee_code: string; full_name: string } | null;
  effective_defaults?: {
    policy: EffectiveDefault | null;
    work_schedule: EffectiveDefault | null;
    work_location: EffectiveDefault | null;
    leave_package: EffectiveDefault | null;
  };
  created_at: string;
  updated_at: string;
};

export type EmployeePayload = {
  user_id?: number | null;
  company_id: number;
  division_id: number;
  department_id: number;
  designation_id: number;
  report_to?: number | null;
  policy_id: number;
  work_schedule_id: number;
  work_location_id: number;
  leave_package_id: number;
  employee_code: string;
  sir_name?: string | null;
  full_name: string;
  myanmar_name?: string | null;
  email?: string | null;
  phone?: string | null;
  status?: EmployeeStatus;
  employment_type: EmploymentType;
  employment_level?: EmploymentLevel | null;
  auto_attendance?: boolean;
  date_of_joining: string;
  date_of_resignation?: string | null;
  probation_periods_months?: number | null;
  permanent_date?: string | null;
  date_of_birth?: string | null;
  is_foreigner?: boolean;
  nrc_number?: string | null;
  passport_number?: string | null;
  ssb_number?: string | null;
  income_tax_applicable?: boolean;
  current_address?: string | null;
  permanent_address?: string | null;
};

export type EmployeeListParams = {
  page?: number;
  per_page?: number;
  q?: string;
  company_id?: number;
  division_id?: number;
  department_id?: number;
  status?: EmployeeStatus | '';
};

export type PaginatedMeta = {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
};
