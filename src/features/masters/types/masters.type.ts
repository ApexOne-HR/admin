export type WorkingDay = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

export type Location = {
  id: number;
  company_id: number;
  name: string;
  code: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  geofence_radius_m: number;
  is_active: boolean;
  company?: { id: number; name: string; code: string };
  created_at: string;
  updated_at: string;
};

export type WorkSchedule = {
  id: number;
  company_id: number;
  name: string;
  code: string | null;
  check_in_time: string;
  check_out_time: string;
  break_start_time: string | null;
  break_end_time: string | null;
  working_days: WorkingDay[];
  is_active: boolean;
  company?: { id: number; name: string; code: string };
  created_at: string;
  updated_at: string;
};

export type Policy = {
  id: number;
  company_id: number;
  name: string;
  code: string | null;
  late_grace_minutes: number;
  early_leave_grace_minutes: number;
  ot_allowed: boolean;
  is_sandwich_leave_applicable: boolean;
  work_schedule_id: number | null;
  is_active: boolean;
  company?: { id: number; name: string; code: string };
  work_schedule?: WorkSchedule | null;
  created_at: string;
  updated_at: string;
};

export type LocationPayload = {
  company_id: number;
  name: string;
  code?: string;
  address?: string;
  latitude?: number | null;
  longitude?: number | null;
  geofence_radius_m?: number;
  is_active?: boolean;
};

export type WorkSchedulePayload = {
  company_id: number;
  name: string;
  code?: string;
  check_in_time: string;
  check_out_time: string;
  break_start_time?: string | null;
  break_end_time?: string | null;
  working_days?: WorkingDay[];
  is_active?: boolean;
};

export type PolicyPayload = {
  company_id: number;
  name: string;
  code?: string;
  late_grace_minutes?: number;
  early_leave_grace_minutes?: number;
  ot_allowed?: boolean;
  is_sandwich_leave_applicable?: boolean;
  work_schedule_id?: number | null;
  is_active?: boolean;
};
