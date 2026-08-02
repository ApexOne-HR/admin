export type DashboardAttendanceToday = {
  present: number;
  absent: number;
  incomplete: number;
  on_leave: number;
  total: number;
};

export type DashboardAttentionItem = {
  id: number;
  kind: 'incomplete';
  work_date: string;
  status: string;
  status_label: string;
  employee: {
    id: number;
    employee_code: string;
    full_name: string;
  } | null;
};

export type DashboardNeedsAttention = {
  incomplete: DashboardAttentionItem[];
};

export type DashboardUpcomingHoliday = {
  id: number;
  name: string;
  date: string;
  type: string;
  type_label: string;
  calendar: {
    id: number;
    name: string;
    code: string | null;
    company: { id: number; name: string } | null;
  } | null;
};

export type DashboardSummary = {
  as_of_date: string;
  attendance_today: DashboardAttendanceToday | null;
  needs_attention: DashboardNeedsAttention | null;
  upcoming_holidays: DashboardUpcomingHoliday[] | null;
};
