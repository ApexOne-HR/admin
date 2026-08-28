export type AttendanceStatus =
  | 'present'
  | 'absent'
  | 'on_leave'
  | 'incomplete';

export type AttendanceSource = 'admin' | 'mobile' | 'system';
export type AttendanceLeaveSession = 'full' | 'am' | 'pm';
export type AttendanceAbsenceSession = 'full' | 'am' | 'pm';
export type AttendanceLeaveDuration = 'full_day' | 'half_day';
export type AttendanceEntryType =
  | 'present'
  | 'absent'
  | 'full_day_leave'
  | 'morning_leave'
  | 'evening_leave';

export type AttendanceSummary = {
  id: number;
  name: string;
};

export type AttendanceEmployeeSummary = {
  id: number;
  employee_code: string;
  full_name: string;
};

export type AttendanceActorSummary = {
  id: number;
  name: string;
  email: string | null;
};

export type AttendanceRecord = {
  id: number;
  employee_id: number;
  company_id: number;
  division_id: number | null;
  department_id: number | null;
  work_date: string;
  timezone: string;
  policy_id: number | null;
  work_schedule_id: number | null;
  work_location_id: number | null;
  check_in_at: string | null;
  check_out_at: string | null;
  check_in_location_id: number | null;
  check_out_location_id: number | null;
  check_in_latitude: string | null;
  check_in_longitude: string | null;
  check_out_latitude: string | null;
  check_out_longitude: string | null;
  status: AttendanceStatus;
  status_label: string;
  leave_session: AttendanceLeaveSession | null;
  leave_session_label: string | null;
  leave_duration: AttendanceLeaveDuration | null;
  leave_application_id: number | null;
  absence_session: AttendanceAbsenceSession | null;
  absence_session_label: string | null;
  late_minutes: number;
  early_leave_minutes: number;
  worked_minutes: number;
  overtime_minutes: number;
  source: AttendanceSource;
  source_label: string;
  is_voided: boolean;
  voided_at: string | null;
  void_reason: string | null;
  employee: AttendanceEmployeeSummary | null;
  company: AttendanceSummary | null;
  division: AttendanceSummary | null;
  department: AttendanceSummary | null;
  policy: AttendanceSummary | null;
  work_schedule: AttendanceSummary | null;
  work_location: AttendanceSummary | null;
  check_in_location: AttendanceSummary | null;
  check_out_location: AttendanceSummary | null;
  creator: AttendanceActorSummary | null;
  updater: AttendanceActorSummary | null;
  voider: AttendanceActorSummary | null;
  created_at: string;
  updated_at: string;
};

export type AttendanceListParams = {
  page?: number;
  per_page?: number;
  q?: string;
  company_id?: number;
  division_id?: number;
  department_id?: number;
  employee_id?: number;
  date_from?: string;
  date_to?: string;
  status?: AttendanceStatus;
  source?: AttendanceSource;
  is_voided?: 0 | 1;
};

export type AttendancePaginationMeta = {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
};

export type AttendanceCreatePayload = {
  employee_id: number;
  work_date: string;
  attendance_type: AttendanceEntryType;
  check_in_time?: string | null;
  check_out_time?: string | null;
  check_in_location_id?: number | null;
  check_out_location_id?: number | null;
  check_in_latitude?: number | null;
  check_in_longitude?: number | null;
  check_out_latitude?: number | null;
  check_out_longitude?: number | null;
  reason?: string | null;
};

export type AttendanceBulkCreatePayload = {
  dates: string[];
  attendance_type: AttendanceEntryType;
  check_in_time?: string | null;
  check_out_time?: string | null;
  check_in_location_id?: number | null;
  check_out_location_id?: number | null;
  check_in_latitude?: number | null;
  check_in_longitude?: number | null;
  check_out_latitude?: number | null;
  check_out_longitude?: number | null;
  reason?: string | null;
};

export type AttendanceBulkCreateResult = {
  created: AttendanceRecord[];
  skipped: Array<{ date: string; reason: string }>;
};

export type AttendanceUpdatePayload = {
  attendance_type: AttendanceEntryType;
  check_in_time?: string | null;
  check_out_time?: string | null;
  check_in_location_id?: number | null;
  check_out_location_id?: number | null;
  check_in_latitude?: number | null;
  check_in_longitude?: number | null;
  check_out_latitude?: number | null;
  check_out_longitude?: number | null;
  reason: string;
};

export type AttendanceReasonPayload = {
  reason: string;
};
