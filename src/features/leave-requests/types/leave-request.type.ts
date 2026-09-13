export type LeaveRequestStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'cancelled';

export type LeaveCreationSource = 'admin' | 'employee';

export type LeaveRequestEmployee = {
  id: number;
  employee_code: string;
  full_name: string;
  myanmar_name: string | null;
  email: string | null;
  avatar_url: string | null;
  company: { id: number; name: string } | null;
  department: { id: number; name: string } | null;
  designation: { id: number; name: string } | null;
};

export type LeaveRequestDocument = {
  id: number;
  original_name: string;
  mime_type: string | null;
  size_bytes: number;
  url: string | null;
};

export type LeaveRequest = {
  id: number;
  employee_id: number;
  company_id: number;
  leave_type_id: number;
  fiscal_year_id: number;
  start_date: string;
  end_date: string;
  start_session: string;
  end_session: string;
  requested_days: number;
  counted_dates: Array<{ date: string; session: string; amount: number }>;
  reason: string | null;
  status: LeaveRequestStatus;
  status_label: string;
  creation_source: LeaveCreationSource;
  submitted_at: string | null;
  decision_note: string | null;
  decided_at: string | null;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  employee: LeaveRequestEmployee | null;
  leave_type: {
    id: number;
    name: string;
    requires_document: boolean;
  } | null;
  approvers: Array<{
    id: number;
    full_name: string;
    employee_code: string;
    email: string | null;
    avatar_url: string | null;
    department: { id: number; name: string } | null;
    designation: { id: number; name: string } | null;
    sort_order: number;
  }>;
  documents: LeaveRequestDocument[];
  created_by: { id: number; name: string } | null;
  decided_by: { id: number; name: string } | null;
  created_at: string;
  updated_at: string;
};

export type LeaveRequestListParams = {
  page?: number;
  per_page?: number;
  q?: string;
  company_id?: number;
  division_id?: number;
  department_id?: number;
  employee_id?: number;
  leave_type_id?: number;
  date_from?: string;
  date_to?: string;
  status?: LeaveRequestStatus;
  creation_source?: LeaveCreationSource;
};

export type LeaveRequestPaginationMeta = {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
};

export const LEAVE_REQUEST_STATUS_OPTIONS: Array<{
  value: LeaveRequestStatus | '';
  label: string;
}> = [
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: '', label: 'All statuses' },
];
