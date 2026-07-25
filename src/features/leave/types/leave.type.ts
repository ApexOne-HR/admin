export type LeaveType = {
  id: number;
  company_id: number;
  name: string;
  code: string;
  is_paid: boolean;
  is_active: boolean;
  company?: { id: number; name: string };
  created_at: string;
  updated_at: string;
};

export type LeavePackageItem = {
  id?: number;
  leave_type_id: number;
  days_allowed: number;
  leave_type?: {
    id: number;
    name: string;
    code: string;
    is_paid: boolean;
  } | null;
};

export type LeavePackage = {
  id: number;
  company_id: number;
  name: string;
  description: string | null;
  is_active: boolean;
  company?: { id: number; name: string };
  items?: LeavePackageItem[];
  created_at: string;
  updated_at: string;
};

export type LeaveTypePayload = {
  company_id: number;
  name: string;
  code: string;
  is_paid?: boolean;
  is_active?: boolean;
};

export type LeavePackagePayload = {
  company_id: number;
  name: string;
  description?: string | null;
  is_active?: boolean;
  items?: Array<{ leave_type_id: number; days_allowed: number }>;
};
