export type HolidayType = 'public' | 'company' | 'special';

export type HolidayCalendar = {
  id: number;
  company_id: number;
  name: string;
  code: string | null;
  is_active: boolean;
  policies_count?: number;
  company?: { id: number; name: string; code: string };
  created_at: string;
  updated_at: string;
};

export type Holiday = {
  id: number;
  holiday_calendar_id: number;
  name: string;
  date: string;
  type: HolidayType;
  notes: string | null;
  calendar?: HolidayCalendar;
  created_at: string;
  updated_at: string;
};

export type HolidayCalendarPayload = {
  company_id: number;
  name: string;
  code?: string;
  is_active?: boolean;
};

export type HolidayPayload = {
  holiday_calendar_id: number;
  name: string;
  date: string;
  end_date?: string | null;
  type?: HolidayType;
  notes?: string | null;
};

export type HolidayListParams = {
  holiday_calendar_id: number;
  year?: number;
  month?: number;
  type?: HolidayType;
};
