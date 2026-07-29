export type AllowanceDeductionType = 'allowance' | 'deduction';

export type AllowanceDeduction = {
  id: number;
  company_id: number;
  name: string;
  code: string;
  type: AllowanceDeductionType;
  is_taxable: boolean;
  is_active: boolean;
  company?: { id: number; name: string } | null;
  created_at: string;
  updated_at: string;
};

export type AllowanceDeductionPayload = {
  company_id: number;
  name: string;
  code: string;
  type: AllowanceDeductionType;
  is_taxable: boolean;
  is_active: boolean;
};

export type SalaryStructureItem = {
  id: number;
  salary_structure_id: number;
  employee_id: number;
  allowance_deduction_id: number;
  amount: number;
  is_fixed: boolean;
  allowance_deduction?: {
    id: number;
    name: string;
    code: string;
    type: AllowanceDeductionType;
    is_taxable: boolean;
  } | null;
};

export type SalaryStructure = {
  id: number;
  employee_id: number;
  basic_salary: number;
  payment_mode: 'bank' | 'cash' | string;
  payment_duration: 'monthly' | 'bi-weekly' | string;
  effective_date: string;
  end_date: string | null;
  is_current: boolean;
  total_allowance: number;
  total_deduction: number;
  total_salary: number;
  items: SalaryStructureItem[];
  created_at: string;
  updated_at: string;
};

export type SalaryStructureItemDraft = {
  allowance_deduction_id: number | '';
  amount: string;
  is_fixed: boolean;
};

export type SalaryStructurePayload = {
  basic_salary: number;
  payment_mode: 'bank' | 'cash';
  payment_duration: 'monthly' | 'bi-weekly';
  effective_date: string;
  end_date?: string | null;
  items: Array<{
    allowance_deduction_id: number;
    amount: number;
    is_fixed: boolean;
  }>;
};
