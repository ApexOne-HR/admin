export type AdminAuditFeature = 'attendance' | 'fiscal_year';

export type AdminAuditActor = {
  id: number;
  name: string;
  email: string | null;
};

export type AdminAuditLog = {
  id: number;
  feature: string | null;
  action: string;
  reason: string | null;
  auditable_type: string | null;
  auditable_type_label: string | null;
  auditable_id: number | null;
  before_values: Record<string, unknown> | null;
  after_values: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  request_id: string | null;
  ip_address: string | null;
  actor: AdminAuditActor | null;
  created_at: string;
};

export type AdminAuditListParams = {
  page?: number;
  per_page?: number;
  feature?: AdminAuditFeature;
  date_from?: string;
  date_to?: string;
};

export type AdminAuditPaginationMeta = {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
};

export const ADMIN_AUDIT_FEATURE_OPTIONS: Array<{
  value: AdminAuditFeature;
  label: string;
}> = [
  { value: 'attendance', label: 'Attendance' },
  { value: 'fiscal_year', label: 'Fiscal year' },
];
