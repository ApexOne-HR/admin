import type { ChipProps } from '@mui/material/Chip';
import type {
  AttendanceEntryType,
  AttendanceRecord,
  AttendanceSource,
  AttendanceStatus,
} from '../types/attendance.type';

export const ATTENDANCE_STATUS_OPTIONS: AttendanceStatus[] = [
  'present',
  'absent',
  'on_leave',
  'incomplete',
];

export const ATTENDANCE_SOURCE_OPTIONS: AttendanceSource[] = [
  'admin',
  'mobile',
  'system',
];

export function attendanceStatusMeta(status: AttendanceStatus): {
  label: string;
  color: ChipProps['color'];
} {
  const values: Record<
    AttendanceStatus,
    { label: string; color: ChipProps['color'] }
  > = {
    present: { label: 'Present', color: 'success' },
    absent: { label: 'Absent', color: 'error' },
    on_leave: { label: 'On leave', color: 'info' },
    incomplete: { label: 'Incomplete', color: 'warning' },
  };

  return values[status];
}

export function attendanceSourceLabel(source: AttendanceSource): string {
  return {
    admin: 'Admin',
    mobile: 'Mobile',
    system: 'System',
  }[source];
}

export function formatAttendanceDateTime(
  value: string | null,
  timezone: string,
): string {
  if (!value) return '—';

  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: timezone,
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export function formatMinutes(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  if (hours === 0) return `${remainder}m`;
  if (remainder === 0) return `${hours}h`;
  return `${hours}h ${remainder}m`;
}

export function attendanceEntryTypeFromRecord(
  record: AttendanceRecord,
): AttendanceEntryType {
  if (record.status === 'absent') return 'absent';
  if (record.leave_session === 'full') return 'full_day_leave';
  if (record.leave_session === 'am') return 'morning_leave';
  if (record.leave_session === 'pm') return 'evening_leave';
  return 'present';
}

export function localTimeFromIso(
  value: string | null,
  timezone: string,
): string {
  if (!value) return '';

  try {
    const parts = new Intl.DateTimeFormat('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: timezone,
    }).formatToParts(new Date(value));
    const hour = parts.find((part) => part.type === 'hour')?.value ?? '00';
    const minute = parts.find((part) => part.type === 'minute')?.value ?? '00';
    return `${hour}:${minute}`;
  } catch {
    return '';
  }
}
