import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAdminSession } from '@/features/auth/hooks/useAdminSession';
import * as attendanceService from '../services/attendance.service';
import type {
  AttendanceCreatePayload,
  AttendanceListParams,
  AttendanceReasonPayload,
  AttendanceUpdatePayload,
} from '../types/attendance.type';

export const attendanceKeys = {
  all: ['admin', 'attendance-records'] as const,
  list: (params: AttendanceListParams) =>
    ['admin', 'attendance-records', 'list', params] as const,
  detail: (id: number) => ['admin', 'attendance-records', 'detail', id] as const,
};

function requireToken(token: string | null): string {
  if (!token) {
    throw new Error('Missing admin session token');
  }
  return token;
}

export function useAttendanceRecordsQuery(
  params: AttendanceListParams,
  enabled = true,
) {
  const { token } = useAdminSession();

  return useQuery({
    queryKey: attendanceKeys.list(params),
    enabled: enabled && Boolean(token),
    queryFn: () =>
      attendanceService.listAttendanceRecords(requireToken(token), params),
  });
}

export function useAttendanceRecordQuery(id?: number, enabled = true) {
  const { token } = useAdminSession();

  return useQuery({
    queryKey: attendanceKeys.detail(id ?? 0),
    enabled: enabled && Boolean(token) && Boolean(id),
    queryFn: () =>
      attendanceService.getAttendanceRecord(requireToken(token), id as number),
  });
}

export function useCreateAttendanceRecordMutation() {
  const { token } = useAdminSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: AttendanceCreatePayload) =>
      attendanceService.createAttendanceRecord(requireToken(token), payload),
    onSuccess: async (record) => {
      queryClient.setQueryData(attendanceKeys.detail(record.id), record);
      await queryClient.invalidateQueries({ queryKey: attendanceKeys.all });
    },
  });
}

export function useUpdateAttendanceRecordMutation(id: number) {
  const { token } = useAdminSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: AttendanceUpdatePayload) =>
      attendanceService.updateAttendanceRecord(requireToken(token), id, payload),
    onSuccess: async (record) => {
      queryClient.setQueryData(attendanceKeys.detail(record.id), record);
      await queryClient.invalidateQueries({ queryKey: attendanceKeys.all });
    },
  });
}

export function useVoidAttendanceRecordMutation(id: number) {
  const { token } = useAdminSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: AttendanceReasonPayload) =>
      attendanceService.voidAttendanceRecord(requireToken(token), id, payload),
    onSuccess: async (record) => {
      queryClient.setQueryData(attendanceKeys.detail(record.id), record);
      await queryClient.invalidateQueries({ queryKey: attendanceKeys.all });
    },
  });
}

export function useRestoreAttendanceRecordMutation(id: number) {
  const { token } = useAdminSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: AttendanceReasonPayload) =>
      attendanceService.restoreAttendanceRecord(requireToken(token), id, payload),
    onSuccess: async (record) => {
      queryClient.setQueryData(attendanceKeys.detail(record.id), record);
      await queryClient.invalidateQueries({ queryKey: attendanceKeys.all });
    },
  });
}
