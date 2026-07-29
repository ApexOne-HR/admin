import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAdminSession } from '@/features/auth/hooks/useAdminSession';
import * as holidaysService from '../services/holidays.service';
import type {
  HolidayCalendarPayload,
  HolidayListParams,
  HolidayPayload,
} from '../types/holidays.type';

export const holidayKeys = {
  calendars: (companyId?: number) => ['admin', 'holiday-calendars', { companyId }] as const,
  holidays: (params: Partial<HolidayListParams>) => ['admin', 'holidays', params] as const,
};

function requireToken(token: string | null): string {
  if (!token) {
    throw new Error('Missing admin session token');
  }
  return token;
}

export function useHolidayCalendarsQuery(companyId?: number, enabled = true) {
  const { token } = useAdminSession();
  return useQuery({
    queryKey: holidayKeys.calendars(companyId),
    enabled: enabled && Boolean(token),
    queryFn: () => holidaysService.listHolidayCalendars(requireToken(token), companyId),
  });
}

export function useHolidaysQuery(params: HolidayListParams | null, enabled = true) {
  const { token } = useAdminSession();
  return useQuery({
    queryKey: holidayKeys.holidays(params ?? {}),
    enabled: enabled && Boolean(token) && params !== null,
    queryFn: () => holidaysService.listHolidays(requireToken(token), params as HolidayListParams),
  });
}

export function useCreateHolidayCalendarMutation() {
  const { token } = useAdminSession();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: HolidayCalendarPayload) =>
      holidaysService.createHolidayCalendar(requireToken(token), payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'holiday-calendars'] });
    },
  });
}

export function useUpdateHolidayCalendarMutation() {
  const { token } = useAdminSession();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<HolidayCalendarPayload> }) =>
      holidaysService.updateHolidayCalendar(requireToken(token), id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'holiday-calendars'] });
    },
  });
}

export function useDeleteHolidayCalendarMutation() {
  const { token } = useAdminSession();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => holidaysService.deleteHolidayCalendar(requireToken(token), id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'holiday-calendars'] });
    },
  });
}

export function useCreateHolidayMutation() {
  const { token } = useAdminSession();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: HolidayPayload) =>
      holidaysService.createHoliday(requireToken(token), payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'holidays'] });
    },
  });
}

export function useUpdateHolidayMutation() {
  const { token } = useAdminSession();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<HolidayPayload> }) =>
      holidaysService.updateHoliday(requireToken(token), id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'holidays'] });
    },
  });
}

export function useDeleteHolidayMutation() {
  const { token } = useAdminSession();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => holidaysService.deleteHoliday(requireToken(token), id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'holidays'] });
    },
  });
}
