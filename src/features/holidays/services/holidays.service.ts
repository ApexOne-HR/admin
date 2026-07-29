import { apiRequest } from '@/infra/http/apiClient';
import type {
  Holiday,
  HolidayCalendar,
  HolidayCalendarPayload,
  HolidayListParams,
  HolidayPayload,
} from '../types/holidays.type';

export async function listHolidayCalendars(
  token: string,
  companyId?: number,
  activeOnly?: boolean,
) {
  const response = await apiRequest<HolidayCalendar[]>('/holiday-calendars', {
    token,
    query: {
      company_id: companyId,
      active_only: activeOnly ? 1 : undefined,
    },
  });
  return response.data;
}

export async function createHolidayCalendar(token: string, payload: HolidayCalendarPayload) {
  const response = await apiRequest<HolidayCalendar>('/holiday-calendars', {
    method: 'POST',
    token,
    body: payload,
  });
  return response.data;
}

export async function updateHolidayCalendar(
  token: string,
  id: number,
  payload: Partial<HolidayCalendarPayload>,
) {
  const response = await apiRequest<HolidayCalendar>(`/holiday-calendars/${id}`, {
    method: 'PUT',
    token,
    body: payload,
  });
  return response.data;
}

export async function deleteHolidayCalendar(token: string, id: number) {
  await apiRequest<null>(`/holiday-calendars/${id}`, { method: 'DELETE', token });
}

export async function listHolidays(token: string, params: HolidayListParams) {
  const response = await apiRequest<Holiday[]>('/holidays', {
    token,
    query: {
      holiday_calendar_id: params.holiday_calendar_id,
      year: params.year,
      month: params.month,
      type: params.type,
    },
  });
  return response.data;
}

export async function createHoliday(token: string, payload: HolidayPayload) {
  const response = await apiRequest<Holiday | Holiday[]>('/holidays', {
    method: 'POST',
    token,
    body: payload,
  });
  return response.data;
}

export async function updateHoliday(
  token: string,
  id: number,
  payload: Partial<HolidayPayload>,
) {
  const response = await apiRequest<Holiday>(`/holidays/${id}`, {
    method: 'PUT',
    token,
    body: payload,
  });
  return response.data;
}

export async function deleteHoliday(token: string, id: number) {
  await apiRequest<null>(`/holidays/${id}`, { method: 'DELETE', token });
}
